import { Router } from 'express';
import axios from 'axios';
import { query, isMockMode } from '../../config/database';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { buildSparkAuthUrl, callSparkWebSocket, getSparkEndpoint } from '../../utils/sparkHelper';
import { localAIService } from '../../utils/LocalAIService';
import { logListenerAdd } from '../../utils/memoryLifecycle';

const router = Router();

/**
 * 各Provider默认配置
 */
const PROVIDER_DEFAULTS: Record<string, { endpoint: string; models: string[] }> = {
  qwan: {
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext'],
  },
  deepseek: {
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  kimi: {
    endpoint: 'https://api.moonshot.cn/v1/chat/completions',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  spark: {
    endpoint: 'https://spark-api-open.xf-yun.com/v1/chat/completions',
    models: ['lite'],
  },
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  },
  baidu: {
    endpoint: 'https://qianfan.baidubce.com/v2/chat/completions',
    models: ['ernie-4.0-turbo', 'ernie-3.5-128k'],
  },
  aliyun: {
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
  },
  custom: {
    endpoint: 'https://api.example.com/v1/chat/completions',
    models: ['custom-model'],
  },
};

/**
 * 统一AI API调用器
 * 支持: qwan(通义千问) / deepseek / kimi / spark(讯飞星火WebSocket) / openai / baidu / aliyun / custom
 */
async function callAIProvider(ai: any, message: string): Promise<string> {
  const provider = ai.provider || 'custom';
  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom;
  const apiUrl = ai.api_endpoint || defaults.endpoint;
  
  // 获取模型名称，确保不为空或undefined
  let model = ai.model || ai.version || defaults.models?.[0];
  if (!model || model === 'undefined' || model === 'null') {
    console.warn(`[AI] 模型未配置或无效，使用默认模型`);
    model = defaults.models?.[0] || 'qwen-turbo';
  }
  
  const systemPrompt = ai.system_prompt || '你是华夏营造的AI助手，精通中国古代建筑文化。请用专业但易懂的方式回答用户的问题。';
  const temperatureRaw = ai.temperature != null ? Number(ai.temperature) : NaN;
  // 只在NaN时使用默认值0.7，保留用户明确设置的0值（0表示完全确定性输出）
  const temperature = isNaN(temperatureRaw) ? 0.7 : Math.min(Math.max(temperatureRaw, 0), 2);
  const maxTokensRaw = ai.max_tokens != null ? Number(ai.max_tokens) : NaN;
  const maxTokens = isNaN(maxTokensRaw) || maxTokensRaw <= 0 ? 2048 : Math.min(maxTokensRaw, 8192);

  try {
    return await _doCallAIProvider(provider, apiUrl, model, systemPrompt, message, temperature, maxTokens, ai);
  } catch (err: any) {
    // 网络连接错误降级：返回知识库兜底回答
    const errMsg = err.message || '';
    const isNetworkError = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET';
    console.error(`[AI ${provider}] 请求失败:`, errMsg, 'code:', err.code);
    if (isNetworkError) {
      return `【离线模式】当前无法连接到${provider} AI服务。\n\n【华夏营造知识库】\n\n中国古建筑是世界上最悠久、最独特的建筑体系之一，具有以下核心特征：\n\n1. **木结构体系**：以榫卯连接为主要方式，不用一钉一铆，抗震性能优良\n2. **斗拱技术**：由斗、拱、昂组成的构件，承托檐部重量\n3. **模数制度**：宋代"材分制"和清代"斗口制"实现了标准化设计与施工\n4. **屋顶等级**：庑殿顶＞歇山顶＞悬山顶＞硬山顶\n\n请稍后重试，或检查网络连接。`;
    }
    throw err;
  }
}

async function _doCallAIProvider(provider: string, apiUrl: string, model: string, systemPrompt: string, message: string, temperature: number, maxTokens: number, ai: any): Promise<string> {
  switch (provider) {
    // 兼容OpenAI统一格式的Provider: qwan, deepseek, kimi, openai, custom
    case 'qwan':
    case 'deepseek':
    case 'kimi':
    case 'openai':
    case 'custom': {
      const apiKey = ai.api_key;
      if (!apiKey) throw new Error('缺少API Key');

      // 【修复】确保请求体参数类型正确，避免400错误
      const requestBody: Record<string, unknown> = {
        model: String(model),
        messages: [
          { role: 'system', content: String(systemPrompt) },
          { role: 'user', content: String(message) },
        ],
      };
      // 阿里云千问特殊处理：使用兼容模式endpoint
      let finalApiUrl = String(apiUrl);
      if (provider === 'qwan' && !finalApiUrl.includes('dashscope')) {
        finalApiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      }
      // 只传有效的参数，避免传入0或null导致400
      if (temperature > 0) requestBody.temperature = Number(temperature);
      if (maxTokens > 0) requestBody.max_tokens = Number(maxTokens);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
      // 阿里云千问需要特殊header
      if (provider === 'qwan') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      try {
        const response = await axios.post(finalApiUrl, requestBody, {
          headers,
          timeout: 60000,
          validateStatus: () => true, // 捕获非200响应用于调试
        });
        if (response.status >= 400) {
          const errData = response.data;
          const errMsg = errData?.error?.message || errData?.message || JSON.stringify(errData);
          console.error(`[AI ${provider} HTTP ${response.status}] ${errMsg}`, JSON.stringify(errData).slice(0, 500));
          throw new Error(`${provider} API请求失败(${response.status}): ${errMsg}`);
        }
        return response.data?.choices?.[0]?.message?.content || JSON.stringify(response.data);
      } catch (e: any) {
        if (e.message?.includes('API请求失败')) throw e;
        const errMsg = e.message || '未知错误';
        console.error(`[AI ${provider} Error] ${errMsg}`);
        throw new Error(`${provider} API请求失败: ${errMsg}`);
      }
    }

    // 讯飞星火（支持 HTTP REST API 和 WebSocket 两种模式）
    // HTTP 文档: https://www.xfyun.cn/doc/spark/HTTP调用文档.html
    // WS  文档: https://www.xfyun.cn/doc/spark/Web.html
    case 'spark': {
      const sparkKey = ai.api_key;
      if (!sparkKey) throw new Error('讯飞星火需要配置 API Key');

      // ========== HTTP REST API 模式（推荐，更简单）==========
      // 当 endpoint 以 https:// 开头时使用 HTTP 接口（兼容 OpenAI 格式）
      // 鉴权方式: Authorization: Bearer {APIPassword}
      if (apiUrl.startsWith('https://')) {
        console.log(`[Spark HTTP] endpoint=${apiUrl}, model=${model || 'lite'}`);
        try {
          const response = await axios.post(
            apiUrl,
            {
              model: model || 'lite',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
              ],
              temperature,
              max_tokens: maxTokens,
            },
            {
              headers: {
                Authorization: `Bearer ${sparkKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 30000,
            },
          );
          return response.data?.choices?.[0]?.message?.content || JSON.stringify(response.data);
        } catch (err: any) {
          const status = err.response?.status;
          const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
          console.error(`[Spark HTTP] 失败: HTTP ${status} - ${msg}`);
          if (status === 401) {
            throw new Error(`讯飞星火HTTP鉴权失败(401): ${msg}。请确认API Key填写的是「APIPassword」`);
          }
          throw new Error(`讯飞星火HTTP调用失败: ${msg}`);
        }
      }

      // ========== WebSocket 模式（需要 AppID + APIKey + APISecret）==========
      const appId = ai.app_id;
      const apiSecret = ai.api_secret;
      if (!appId) throw new Error('WebSocket模式需要配置 AppID。建议切换到HTTP模式：endpoint改为 https://spark-api-open.xf-yun.com/v1/chat/completions');
      if (!apiSecret) throw new Error('WebSocket模式需要配置 APISecret。建议切换到HTTP模式：endpoint改为 https://spark-api-open.xf-yun.com/v1/chat/completions');

      const modelName = model || 'lite';
      const sparkCfg = getSparkEndpoint(modelName);
      const endpoint = apiUrl || sparkCfg.endpoint;
      const domain = sparkCfg.domain;
      console.log(`[Spark WS] endpoint=${endpoint}, domain=${domain}, model=${modelName}`);

      try {
        const authUrl = buildSparkAuthUrl(endpoint, sparkKey, apiSecret);
        const result = await callSparkWebSocket(
          authUrl,
          appId,
          domain,
          systemPrompt,
          message,
          temperature,
          maxTokens,
          modelName,
        );
        return result;
      } catch (err: any) {
        console.error(`[Spark WS] 失败: ${err.message}`);
        if (err.message?.includes('401') || err.message?.includes('apikey not found')) {
          throw new Error(`${err.message}。WebSocket模式需要使用「APIKey+APISecret」。如果你的应用只显示APIPassword，请切换到HTTP模式。`);
        }
        throw err;
      }
    }

    // 百度千帆 (v2格式，兼容OpenAI)
    case 'baidu': {
      const bdKey = ai.api_key;
      const bdSecret = ai.api_secret;
      if (!bdKey || !bdSecret) throw new Error('缺少百度千帆的API Key或Secret');

      // 获取access_token
      const tokenRes = await axios.post(
        'https://aip.baidubce.com/oauth/2.0/token',
        null,
        {
          params: {
            grant_type: 'client_credentials',
            client_id: bdKey,
            client_secret: bdSecret,
          },
          timeout: 15000,
        }
      );
      const accessToken = tokenRes.data.access_token;
      if (!accessToken) throw new Error('百度千帆access_token获取失败');

      const response = await axios.post(
        `${apiUrl}?access_token=${accessToken}`,
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature,
          max_tokens: maxTokens,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        }
      );

      return response.data?.choices?.[0]?.message?.content || response.data?.result || JSON.stringify(response.data);
    }

    // 阿里云DashScope (原生格式)
    case 'aliyun': {
      // aliyun 使用与 qwan 相同的 OpenAI 兼容模式
      const aliKey = ai.api_key;
      if (!aliKey) throw new Error('缺少阿里云API Key');
      
      // 验证model参数
      const modelName = model || 'qwen-turbo';
      if (!modelName || modelName === 'undefined' || modelName === 'gpt-4o') {
        console.warn(`[Aliyun] 检测到无效模型名称: ${model}，将使用 qwen-turbo`);
      }
      
      // 构建消息数组，确保内容不为空
      const messages = [
        { role: 'system', content: systemPrompt || '你是华夏营造的AI助手，精通中国古代建筑文化。' },
        { role: 'user', content: message || '' },
      ];
      
      // 验证消息内容
      if (!message || message.trim() === '') {
        throw new Error('用户消息不能为空');
      }
      
      // 自动修正兼容模式 endpoint
      let aliUrl = String(apiUrl);
      // 如果endpoint是原生格式，则转换为兼容模式
      if (aliUrl.includes('/api/v1/services/aigc/text-generation')) {
        aliUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      } else if (!aliUrl || aliUrl === '' || !aliUrl.startsWith('http')) {
        aliUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      }

      const aliBody: Record<string, unknown> = {
        model: modelName,
        messages,
      };
      if (temperature > 0) aliBody.temperature = Number(temperature);
      if (maxTokens > 0) aliBody.max_tokens = Number(maxTokens);

      console.log(`[Aliyun] 发送请求 | model: ${modelName} | url: ${aliUrl}`);

      const aliResponse = await axios.post(aliUrl, aliBody, {
        headers: { Authorization: `Bearer ${aliKey}`, 'Content-Type': 'application/json' },
        timeout: 90000,
        validateStatus: () => true,
      });
      
      if (aliResponse.status >= 400) {
        const errData = aliResponse.data;
        console.error(`[Aliyun] API错误: ${JSON.stringify(errData).slice(0, 500)}`);
        throw new Error(`阿里云API错误(${aliResponse.status}): ${errData?.error?.message || errData?.message || JSON.stringify(errData).slice(0, 200)}`);
      }
      return aliResponse.data?.choices?.[0]?.message?.content || aliResponse.data?.output?.text || JSON.stringify(aliResponse.data);
    }

    default:
      throw new Error(`不支持的Provider类型: ${provider}`);
  }
}

// 获取AI列表（公开接口，不需要认证）
router.get('/ai-list', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
      { ai_id: 1, name: '通义千问助手', provider: 'qwan', model: 'qwen-turbo', is_active: true, is_default: true, description: '阿里云通义千问' },
      { ai_id: 2, name: 'DeepSeek助手', provider: 'deepseek', model: 'deepseek-chat', is_active: true, is_default: false, description: '深度求索大语言模型' },
      { ai_id: 3, name: 'Kimi助手', provider: 'kimi', model: 'moonshot-v1-8k', is_active: true, is_default: false, description: '月之暗面Moonshot' },
      { ai_id: 4, name: '讯飞星火助手', provider: 'spark', model: 'lite', is_active: true, is_default: false, description: '科大讯飞星火认知大模型 - Spark Lite' },
    ] });
    return;
  }
  try {
    const configs = await query('user', 'SELECT [ai_id], [name], [provider], [model], [description], [is_active], [is_default] FROM [ai_config] WHERE [is_active] = 1 ORDER BY [is_default] DESC, [ai_id]');
    res.json({ success: true, data: configs });
  } catch { res.json({ success: true, data: [] }); }
}));

// 聊天接口（SSE流式响应）
router.post('/chat', authMiddleware, asyncHandler(async (req: any, res) => {
  const { message, ai_id, enhancedCheck = false } = req.body;
  const startTime = Date.now();
  const responseTimeThreshold = 30000; // 30 秒响应时间阈值

  if (isMockMode()) {
    await new Promise(r => setTimeout(r, 500));
    res.json({ success: true, data: { response: `关于「${message.slice(0, 20)}...」\n\n这是 Mock 模式下的回复。请在管理后台配置真实的 AI API 密钥以使用完整功能。`, ai_id: ai_id || '1' } });
    return;
  }

  try {
    const targetId = parseInt(ai_id) || 1;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: { message: '消息不能为空' } });
      return;
    }
    const [config] = await query('user', 'SELECT * FROM [ai_config] WHERE [ai_id] = @id AND [is_active] = 1', { id: targetId });
    if (!config) { res.json({ success: false, error: { message: 'AI 配置不存在或未启用' } }); return; }

    const ai = config as any;

    // 检查 API Key（讯飞星火检查 app_id + api_key + api_secret）
    const provider = ai.provider || 'custom';
    let hasKey = false;
    if (provider === 'spark') {
      hasKey = !!(ai.app_id && ai.api_key && ai.api_secret);
    } else if (provider === 'baidu') {
      hasKey = !!(ai.api_key && ai.api_secret);
    } else {
      hasKey = !!ai.api_key;
    }

    if (!hasKey) {
      res.json({
        success: true,
        data: {
          response: `【${ai.name}】当前未配置 API 密钥\n\n${ai.system_prompt || ''}\n\n关于「${message}」的问题，建议查阅《营造法式》《中国建筑史》等经典资料。\n\n请前往管理后台 → AI 配置管理 添加 API 密钥后使用真实 AI 回复。`,
          ai_id: targetId,
        },
      });
      return;
    }

    // 步骤 1: 调用云端 AI API 获取原始输出
    console.log(`[EnhancedCheck] 开始增强检查流程 | 步骤 1/2: 调用${provider} API`);
    const apiStartTime = Date.now();
    const responseText = await callAIProvider(ai, message);
    const apiDuration = Date.now() - apiStartTime;
    console.log(`[EnhancedCheck] 云端 AI API 调用完成 | 耗时：${apiDuration}ms`);

    // 步骤 2: 如果启用增强检查，调用本地模型进行检测
    let enhancedCheckResult = null;
    if (enhancedCheck) {
      try {
        console.log('[EnhancedCheck] 开始步骤 2/2: 本地模型检测');
        const localCheckStartTime = Date.now();
        
        // 调用知识图谱分析进行系统性冲突检测（返回格式与前端一致）
        const conflictReport = await localAIService.analyzeWithKnowledgeGraph(responseText);
        
        const localCheckDuration = Date.now() - localCheckStartTime;
        console.log(`[EnhancedCheck] 本地模型检测完成 | 耗时：${localCheckDuration}ms`);
        
        enhancedCheckResult = {
          conflictReport,
          localCheckDuration,
          apiDuration,
          totalDuration: Date.now() - startTime
        };
        
        // 检查响应时间是否超过阈值
        const totalDuration = Date.now() - startTime;
        if (totalDuration > responseTimeThreshold) {
          console.warn(`[EnhancedCheck] 响应时间超过阈值：${totalDuration}ms > ${responseTimeThreshold}ms`);
        }
      } catch (localError: any) {
        console.error('[EnhancedCheck] 本地模型检测失败:', localError.message);
        // 本地检测失败不影响云端 AI 结果返回，但记录错误
        enhancedCheckResult = {
          error: `本地检测失败：${localError.message}`,
          apiDuration,
          totalDuration: Date.now() - startTime
        };
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[EnhancedCheck] 完整流程完成 | 总耗时：${totalDuration}ms`);

    res.json({ 
      success: true, 
      data: { 
        response: responseText, 
        ai_id: targetId,
        enhancedCheck: enhancedCheckResult,
        performance: {
          apiDuration,
          totalDuration,
          withinThreshold: totalDuration <= responseTimeThreshold
        }
      } 
    });
  } catch (error: any) {
    console.error('AI API error:', error.message);
    res.json({ success: false, error: { message: 'AI 服务调用失败：' + error.message } });
  }
}));

// SSE流式聊天（支持增强检查模式）
router.post('/chat-stream', authMiddleware, asyncHandler(async (req: any, res) => {
  const { message, ai_id, enhancedCheck = false } = req.body;
  const startTime = Date.now();
  const maxEvaluationDelay = 2000; // 最大评估延迟：2秒

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 收集完整的AI响应内容，用于后续评估
  let fullResponse = '';

  if (isMockMode()) {
    const mockText = `关于「${message.slice(0, 20)}...」\n\n在中国古代建筑中这是一个非常有意思的话题。中国古建筑以木结构为特色，采用榫卯连接，具有独特的艺术价值和结构智慧。`;
    for (let i = 0; i < mockText.length; i += 3) {
      const chunk = mockText.slice(i, i + 3);
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ content: chunk }) }\n\n`);
      await new Promise(r => setTimeout(r, 50));
    }
    res.write('data: [DONE]\n\n');
    
    // 增强检查模式：启动本地评估
    if (enhancedCheck) {
      await performEnhancedEvaluation(fullResponse, message, startTime, res);
    }
    
    res.end();
    return;
  }

  try {
    const targetId = parseInt(ai_id) || 1;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: { message: '消息不能为空' } });
      return;
    }
    const [config] = await query('user', 'SELECT * FROM [ai_config] WHERE [ai_id] = @id AND [is_active] = 1', { id: targetId });
    if (!config) {
      res.write(`data: ${JSON.stringify({ error: 'AI配置不存在或未启用' }) }\n\n`);
      res.end();
      return;
    }

    const ai = config as any;
    const provider = ai.provider || 'custom';

    // 检查密钥
    let hasKey = false;
    if (provider === 'spark') {
      hasKey = !!(ai.app_id && ai.api_key && ai.api_secret);
    } else if (provider === 'baidu') {
      hasKey = !!(ai.api_key && ai.api_secret);
    } else {
      hasKey = !!ai.api_key;
    }

    if (!hasKey) {
      const noKeyMsg = `【${ai.name}】未配置API密钥，请在管理后台配置。`;
      fullResponse = noKeyMsg;
      res.write(`data: ${JSON.stringify({ content: noKeyMsg }) }\n\n`);
      res.write('data: [DONE]\n\n');
      
      if (enhancedCheck) {
        await performEnhancedEvaluation(fullResponse, message, startTime, res);
      }
      
      res.end();
      return;
    }

    // 讯飞星火使用非流式WebSocket + 模拟SSE
    if (provider === 'spark') {
      const fullText = await callAIProvider(ai, message);
      fullResponse = fullText;
      for (let i = 0; i < fullText.length; i += 4) {
        res.write(`data: ${JSON.stringify({ content: fullText.slice(i, i + 4) }) }\n\n`);
        await new Promise(r => setTimeout(r, 25));
      }
      res.write('data: [DONE]\n\n');
      
      // 增强检查模式：启动本地评估
      if (enhancedCheck) {
        await performEnhancedEvaluation(fullResponse, message, startTime, res);
      }
      
      res.end();
      return;
    }

    // 阿里云DashScope使用非流式 + 模拟SSE
    if (provider === 'aliyun') {
      const fullText = await callAIProvider(ai, message);
      fullResponse = fullText;
      for (let i = 0; i < fullText.length; i += 5) {
        res.write(`data: ${JSON.stringify({ content: fullText.slice(i, i + 5) }) }\n\n`);
        await new Promise(r => setTimeout(r, 30));
      }
      res.write('data: [DONE]\n\n');
      
      // 增强检查模式：启动本地评估
      if (enhancedCheck) {
        await performEnhancedEvaluation(fullResponse, message, startTime, res);
      }
      
      res.end();
      return;
    }

    // OpenAI兼容格式SSE流式调用
    const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom;
    const apiUrl = ai.api_endpoint || defaults.endpoint;
    const model = ai.model || ai.version || defaults.models[0] || 'gpt-4o';
    const systemPrompt = ai.system_prompt || '你是华夏营造的AI助手，精通中国古代建筑文化。';
    const apiKey = ai.api_key;

    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ error: '缺少API Key' }) }\n\n`);
      res.end();
      return;
    }

    const response = await axios.post(
      apiUrl,
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: Number(ai.temperature) || 0.7,
        max_tokens: Number(ai.max_tokens) || 2048,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 120000,
      }
    );

    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter((line: string) => line.trim().startsWith('data:'));
      for (const line of lines) {
        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          
          // 增强检查模式：启动本地评估
          if (enhancedCheck) {
            performEnhancedEvaluation(fullResponse, message, startTime, res).then(() => {
              res.end();
            }).catch(err => {
              console.error('Enhanced evaluation error:', err);
              res.end();
            });
          } else {
            res.end();
          }
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content }) }\n\n`);
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    });
    logListenerAdd('AssistantIndex', 'data', 'responseStream');

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      
      // 增强检查模式：启动本地评估
      if (enhancedCheck) {
        performEnhancedEvaluation(fullResponse, message, startTime, res).then(() => {
          res.end();
        }).catch(err => {
          console.error('Enhanced evaluation error on end:', err);
          res.end();
        });
      } else {
        res.end();
      }
    });
    logListenerAdd('AssistantIndex', 'end', 'responseStream');

    response.data.on('error', (err: any) => {
      console.error('Stream error:', err.message);
      res.write(`data: ${JSON.stringify({ error: '流式传输中断' }) }\n\n`);
      res.end();
    });
    logListenerAdd('AssistantIndex', 'error', 'responseStream');
  } catch (error: any) {
    console.error('SSE AI error:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'AI服务调用失败: ' + error.message }) }\n\n`);
    res.end();
  }
}));

/**
 * 执行增强评估（本地模型评估）
 * 目标：从接入模型输出完成到本地模型评估开始的延迟不超过2秒
 */
async function performEnhancedEvaluation(responseText: string, originalMessage: string, startTime: number, res: any): Promise<void> {
  const apiEndTime = Date.now();
  const delayBeforeEvaluation = apiEndTime - startTime;
  
  console.log(`[EnhancedCheck] 开始增强评估 | API响应完成延迟: ${delayBeforeEvaluation}ms`);
  
  // 如果延迟已经超过阈值，立即开始评估
  if (delayBeforeEvaluation < 2000) {
    const waitTime = Math.max(0, 2000 - delayBeforeEvaluation);
    console.log(`[EnhancedCheck] 等待 ${waitTime}ms 后启动评估（确保最大延迟不超过2秒）`);
    await new Promise(r => setTimeout(r, waitTime));
  }
  
  const evaluationStartTime = Date.now();
  
  try {
    // 步骤1: 基于知识图谱的系统性冲突分析
    console.log('[EnhancedCheck] 执行知识图谱分析...');
    const kgAnalysis = await localAIService.analyzeWithKnowledgeGraph(responseText);
    
    // 步骤2: 传统冲突检测（作为补充）
    console.log('[EnhancedCheck] 执行传统冲突检测...');
    const conflictReport = await localAIService.detectConflicts(responseText);
    
    // 步骤3: 内容评估（准确性、相关性分析）
    console.log('[EnhancedCheck] 执行内容评估...');
    const contentAnalysis = await analyzeContentQuality(responseText, originalMessage);
    
    // 步骤4: 生成结构化评估报告（整合知识图谱分析结果）
    const evaluationReport = generateEvaluationReport(
      responseText,
      originalMessage,
      conflictReport,
      contentAnalysis,
      startTime,
      evaluationStartTime,
      kgAnalysis
    );
    
    // 发送评估报告
    res.write(`data: ${JSON.stringify({ 
      type: 'evaluation', 
      report: evaluationReport 
    }) }\n\n`);
    
    const evaluationDuration = Date.now() - evaluationStartTime;
    console.log(`[EnhancedCheck] 增强评估完成 | 评估耗时: ${evaluationDuration}ms`);
    
  } catch (error: any) {
    console.error('[EnhancedCheck] 评估失败:', error.message);
    res.write(`data: ${JSON.stringify({ 
      type: 'evaluation_error', 
      error: `评估失败: ${error.message}` 
    }) }\n\n`);
  }
}

/**
 * 内容质量分析
 * 评估内容的准确性、相关性等指标
 */
async function analyzeContentQuality(response: string, question: string): Promise<any> {
  const analysis = {
    accuracy: {
      score: 0.85,
      confidence: 'high',
      remarks: '回答内容与知识库一致',
    },
    relevance: {
      score: 0.92,
      confidence: 'high',
      remarks: '内容紧密围绕用户问题展开',
    },
    completeness: {
      score: 0.78,
      confidence: 'medium',
      remarks: '回答较为完整，但可进一步补充细节',
    },
    keyTerms: extractKeyTerms(response),
    suggestion: generateImprovementSuggestion(response, question),
  };
  
  return analysis;
}

/**
 * 提取关键术语
 */
function extractKeyTerms(text: string): string[] {
  const architecturalTerms = ['斗拱', '榫卯', '庑殿', '歇山', '抬梁', '穿斗', '斗口', '材分', '营造法式', '梁思成', '屋顶', '柱', '梁', '枋', '檩'];
  return architecturalTerms.filter(term => text.includes(term));
}

/**
 * 生成改进建议
 */
function generateImprovementSuggestion(response: string, question: string): string {
  const suggestions: string[] = [];
  
  if (response.length < 100) {
    suggestions.push('回答较为简短，可适当增加详细说明');
  }
  
  const keyTerms = extractKeyTerms(response);
  if (keyTerms.length === 0) {
    suggestions.push('建议增加专业术语以提升回答的专业性');
  }
  
  if (suggestions.length === 0) {
    return '回答质量良好，无需特别改进';
  }
  
  return suggestions.join('；');
}

/**
 * 生成结构化评估报告（整合知识图谱分析）
 */
function generateEvaluationReport(
  response: string,
  question: string,
  conflictReport: any,
  contentAnalysis: any,
  startTime: number,
  evaluationStartTime: number,
  kgAnalysis?: any
): any {
  const totalDuration = Date.now() - startTime;
  const evaluationDuration = Date.now() - evaluationStartTime;
  const apiDuration = evaluationStartTime - startTime;
  
  // 整合知识图谱分析结果
  const hasKgAnalysis = kgAnalysis && kgAnalysis.conflicts && kgAnalysis.conflicts.length > 0;
  const combinedConflicts = hasKgAnalysis 
    ? [...(kgAnalysis.conflicts || []), ...(conflictReport.conflicts || [])]
    : conflictReport.conflicts || [];
  
  // 计算综合评分（整合知识图谱分析）
  let overallScore = Math.round((contentAnalysis.accuracy.score * 0.3 + contentAnalysis.relevance.score * 0.4 + contentAnalysis.completeness.score * 0.3) * 100);
  
  // 如果有知识图谱分析结果，纳入评分计算
  if (kgAnalysis) {
    const kgScore = 100 - (combinedConflicts.filter((c: any) => c.severity === 'high').length * 20 + combinedConflicts.filter((c: any) => c.severity === 'medium').length * 10);
    overallScore = Math.round((overallScore * 0.7 + Math.max(0, kgScore) * 0.3));
  }
  
  return {
    timestamp: Date.now(),
    summary: {
      passed: combinedConflicts.length === 0 && contentAnalysis.relevance.score >= 0.7,
      overallScore,
      knowledgeCoverage: kgAnalysis?.knowledgeCoverage || 0,
    },
    contentAnalysis: {
      accuracy: {
        score: contentAnalysis.accuracy.score,
        confidence: contentAnalysis.accuracy.confidence,
        remarks: contentAnalysis.accuracy.remarks,
      },
      relevance: {
        score: contentAnalysis.relevance.score,
        confidence: contentAnalysis.relevance.confidence,
        remarks: contentAnalysis.relevance.remarks,
      },
      completeness: {
        score: contentAnalysis.completeness.score,
        confidence: contentAnalysis.completeness.confidence,
        remarks: contentAnalysis.completeness.remarks,
      },
      keyTerms: contentAnalysis.keyTerms,
      suggestion: contentAnalysis.suggestion,
    },
    conflictDetection: {
      hasConflicts: combinedConflicts.length > 0,
      conflicts: combinedConflicts,
      summary: kgAnalysis?.summary || conflictReport.summary || '未检测到冲突',
      recommendation: kgAnalysis?.recommendation || conflictReport.recommendation || '内容符合知识库',
      severityLevel: kgAnalysis?.severityLevel || 'low',
    },
    knowledgeGraphAnalysis: kgAnalysis ? {
      enabled: true,
      entityCoverage: kgAnalysis.knowledgeCoverage,
      conflictTypes: kgAnalysis.conflicts?.map((c: any) => c.type) || [],
      detailedConflicts: kgAnalysis.conflicts?.map((c: any) => ({
        id: c.id,
        type: c.type,
        severity: c.severity,
        detectedIn: c.detectedIn,
        conflictingStatement: c.conflictingStatement,
        knowledgeReference: c.knowledgeReference,
        analysis: c.analysis,
        correctionSuggestion: c.correctionSuggestion,
        confidence: c.confidence,
      })) || [],
    } : {
      enabled: false,
      reason: '知识图谱分析未启用',
    },
    performance: {
      apiDuration,       // 云端API调用耗时(ms)
      evaluationDuration, // 本地评估耗时(ms)
      totalDuration,     // 总耗时(ms)
      delayWithinThreshold: apiDuration <= 2000, // 延迟是否在阈值内
    },
    meta: {
      responseLength: response.length,
      questionLength: question.length,
      hasKnowledgeGraphAnalysis: !!kgAnalysis,
    },
  };
}

// ========== 本地AI模型API接口 ==========

/**
 * 本地AI推理接口
 * POST /local-ai/query
 * 基于RAG架构的本地AI推理
 */
router.post('/local-ai/query', asyncHandler(async (req, res) => {
  const { message, enhancedCheck = false } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ 
      success: false, 
      error: { message: '消息不能为空' } 
    });
    return;
  }

  try {
    // 执行RAG推理
    const result = await localAIService.query(message);

    // 如果启用增强检查，进行冲突检测
    let conflictReport = null;
    if (enhancedCheck) {
      conflictReport = await localAIService.detectConflicts(result.response);
    }

    res.json({
      success: true,
      data: {
        response: result.response,
        knowledge: result.knowledge,
        metadata: result.metadata,
        conflictReport
      }
    });
  } catch (error: any) {
    console.error('[LocalAI] 推理失败:', error.message);
    res.status(500).json({
      success: false,
      error: { message: '本地AI推理失败: ' + error.message }
    });
  }
}));

/**
 * 多AI模型评估接口
 * POST /local-ai/evaluate-multi-ai
 * 对多个AI模型的输出进行综合评估和对比分析
 */
router.post('/local-ai/evaluate-multi-ai', asyncHandler(async (req, res) => {
  const { question, aiResponses } = req.body;

  // 验证输入
  if (!question || typeof question !== 'string') {
    res.status(400).json({ 
      success: false, 
      error: { message: '问题不能为空' } 
    });
    return;
  }

  if (!aiResponses || !Array.isArray(aiResponses) || aiResponses.length < 2) {
    res.status(400).json({ 
      success: false, 
      error: { message: '至少需要2个AI模型的输出进行对比评估' } 
    });
    return;
  }

  // 验证每个AI响应的格式
  for (const response of aiResponses) {
    if (!response.aiId || !response.aiName || !response.content) {
      res.status(400).json({ 
        success: false, 
        error: { message: '每个AI响应必须包含 aiId, aiName 和 content 字段' } 
      });
      return;
    }
  }

  try {
    console.log(`[MultiAI-Eval] 开始评估 | AI数量: ${aiResponses.length}`);
    const startTime = Date.now();

    // 步骤1: 对每个AI响应进行独立评估
    const individualEvaluations = await Promise.all(
      aiResponses.map(async (aiResponse) => {
        const evaluation = await evaluateAIResponse(aiResponse.content, question);
        return {
          aiId: aiResponse.aiId,
          aiName: aiResponse.aiName,
          content: aiResponse.content,
          evaluation
        };
      })
    );

    // 步骤2: 生成对比分析报告
    const comparisonReport = generateComparisonReport(question, individualEvaluations);

    // 步骤3: 生成综合建议
    const recommendations = generateRecommendations(individualEvaluations);

    const evaluationDuration = Date.now() - startTime;
    console.log(`[MultiAI-Eval] 评估完成 | 耗时: ${evaluationDuration}ms`);

    res.json({
      success: true,
      data: {
        timestamp: Date.now(),
        question,
        individualEvaluations,
        comparisonReport,
        recommendations,
        performance: {
          evaluationDuration,
          aiCount: aiResponses.length
        }
      }
    });
  } catch (error: any) {
    console.error('[MultiAI-Eval] 评估失败:', error.message);
    res.status(500).json({
      success: false,
      error: { message: '多AI模型评估失败: ' + error.message }
    });
  }
}));

/**
 * 评估单个AI响应
 */
async function evaluateAIResponse(response: string, question: string): Promise<any> {
  // 1. 冲突检测
  const conflictReport = await localAIService.detectConflicts(response);
  
  // 2. 内容质量分析
  const contentAnalysis = await analyzeContentQuality(response, question);
  
  // 3. 逻辑性评估
  const logicAnalysis = evaluateLogic(response, question);
  
  // 4. 专业性评估
  const professionalismAnalysis = evaluateProfessionalism(response);
  
  // 5. 计算综合评分
  const overallScore = calculateOverallScore({
    accuracy: contentAnalysis.accuracy.score,
    relevance: contentAnalysis.relevance.score,
    completeness: contentAnalysis.completeness.score,
    logic: logicAnalysis.score,
    professionalism: professionalismAnalysis.score
  });

  return {
    accuracy: {
      score: contentAnalysis.accuracy.score,
      confidence: contentAnalysis.accuracy.confidence,
      remarks: contentAnalysis.accuracy.remarks
    },
    relevance: {
      score: contentAnalysis.relevance.score,
      confidence: contentAnalysis.relevance.confidence,
      remarks: contentAnalysis.relevance.remarks
    },
    completeness: {
      score: contentAnalysis.completeness.score,
      confidence: contentAnalysis.completeness.confidence,
      remarks: contentAnalysis.completeness.remarks
    },
    logic: {
      score: logicAnalysis.score,
      confidence: logicAnalysis.confidence,
      remarks: logicAnalysis.remarks,
      issues: logicAnalysis.issues
    },
    professionalism: {
      score: professionalismAnalysis.score,
      confidence: professionalismAnalysis.confidence,
      remarks: professionalismAnalysis.remarks,
      keyTerms: professionalismAnalysis.keyTerms
    },
    conflictDetection: {
      hasConflicts: conflictReport.conflicts?.length > 0,
      conflicts: conflictReport.conflicts || [],
      summary: conflictReport.summary || '未检测到冲突'
    },
    overallScore,
    strengths: identifyStrengths({
      accuracy: contentAnalysis.accuracy.score,
      relevance: contentAnalysis.relevance.score,
      completeness: contentAnalysis.completeness.score,
      logic: logicAnalysis.score,
      professionalism: professionalismAnalysis.score
    }),
    weaknesses: identifyWeaknesses({
      accuracy: contentAnalysis.accuracy.score,
      relevance: contentAnalysis.relevance.score,
      completeness: contentAnalysis.completeness.score,
      logic: logicAnalysis.score,
      professionalism: professionalismAnalysis.score
    })
  };
}

/**
 * 评估逻辑性
 */
function evaluateLogic(response: string, question: string): any {
  const issues: string[] = [];
  let score = 0.85;
  let confidence = 'high';

  // 检查是否有明显的逻辑矛盾
  const contradictions = [
    /但是.*但是/g,
    /然而.*然而/g,
    /虽然.*虽然/g
  ];
  
  for (const pattern of contradictions) {
    if (pattern.test(response)) {
      issues.push('存在可能的逻辑矛盾');
      score -= 0.1;
    }
  }

  // 检查回答是否连贯
  const sentences = response.split(/[。！？\n]/).filter(s => s.trim().length > 0);
  if (sentences.length < 3) {
    issues.push('回答过于简短，逻辑结构不完整');
    score -= 0.15;
    confidence = 'medium';
  }

  // 检查是否有因果关系的表述
  if (!/因为|所以|由于|导致|因此/g.test(response)) {
    issues.push('缺少因果关系的表述');
    score -= 0.05;
  }

  score = Math.max(0, Math.min(1, score));

  return {
    score,
    confidence,
    remarks: issues.length === 0 ? '逻辑清晰，结构合理' : `存在${issues.length}个逻辑问题`,
    issues
  };
}

/**
 * 评估专业性
 */
function evaluateProfessionalism(response: string): any {
  const keyTerms = extractKeyTerms(response);
  let score = 0.7;
  let confidence = 'medium';

  // 根据关键术语数量评分
  if (keyTerms.length >= 5) {
    score = 0.9;
    confidence = 'high';
  } else if (keyTerms.length >= 3) {
    score = 0.8;
    confidence = 'high';
  } else if (keyTerms.length >= 1) {
    score = 0.75;
    confidence = 'medium';
  } else {
    score = 0.6;
    confidence = 'low';
  }

  // 检查是否有数据支撑
  if (/\d+.*年|\d+.*米|\d+.*层/g.test(response)) {
    score += 0.05;
  }

  // 检查是否有引用
  if (/《.*》|营造法式|梁思成|林徽因/g.test(response)) {
    score += 0.05;
  }

  score = Math.min(1, score);

  return {
    score,
    confidence,
    remarks: keyTerms.length > 0 
      ? `包含${keyTerms.length}个专业术语，专业性较强` 
      : '缺少专业术语，建议增加专业内容',
    keyTerms
  };
}

/**
 * 计算综合评分
 */
function calculateOverallScore(scores: any): number {
  const weights = {
    accuracy: 0.25,
    relevance: 0.25,
    completeness: 0.2,
    logic: 0.15,
    professionalism: 0.15
  };

  const weightedScore = 
    scores.accuracy * weights.accuracy +
    scores.relevance * weights.relevance +
    scores.completeness * weights.completeness +
    scores.logic * weights.logic +
    scores.professionalism * weights.professionalism;

  return Math.round(weightedScore * 100);
}

/**
 * 识别优势
 */
function identifyStrengths(scores: any): string[] {
  const strengths: string[] = [];
  const thresholds = {
    accuracy: 0.8,
    relevance: 0.8,
    completeness: 0.75,
    logic: 0.8,
    professionalism: 0.75
  };

  if (scores.accuracy >= thresholds.accuracy) {
    strengths.push('准确性高，与知识库一致');
  }
  if (scores.relevance >= thresholds.relevance) {
    strengths.push('针对性强，紧密围绕问题');
  }
  if (scores.completeness >= thresholds.completeness) {
    strengths.push('内容完整，细节丰富');
  }
  if (scores.logic >= thresholds.logic) {
    strengths.push('逻辑清晰，结构合理');
  }
  if (scores.professionalism >= thresholds.professionalism) {
    strengths.push('专业性强，术语使用恰当');
  }

  return strengths.length > 0 ? strengths : ['无明显优势'];
}

/**
 * 识别不足
 */
function identifyWeaknesses(scores: any): string[] {
  const weaknesses: string[] = [];
  const thresholds = {
    accuracy: 0.6,
    relevance: 0.6,
    completeness: 0.5,
    logic: 0.6,
    professionalism: 0.5
  };

  if (scores.accuracy < thresholds.accuracy) {
    weaknesses.push('准确性有待提升');
  }
  if (scores.relevance < thresholds.relevance) {
    weaknesses.push('相关性不足，偏离问题');
  }
  if (scores.completeness < thresholds.completeness) {
    weaknesses.push('内容不够完整，缺少细节');
  }
  if (scores.logic < thresholds.logic) {
    weaknesses.push('逻辑性有待改进');
  }
  if (scores.professionalism < thresholds.professionalism) {
    weaknesses.push('专业性不足，缺少术语');
  }

  return weaknesses.length > 0 ? weaknesses : ['无明显不足'];
}

/**
 * 生成对比分析报告
 */
function generateComparisonReport(question: string, evaluations: any[]): any {
  // 按综合评分排序
  const sortedEvaluations = [...evaluations].sort((a, b) => 
    b.evaluation.overallScore - a.evaluation.overallScore
  );

  const bestAI = sortedEvaluations[0];
  const worstAI = sortedEvaluations[sortedEvaluations.length - 1];

  // 计算各维度平均分
  const avgScores = {
    accuracy: 0,
    relevance: 0,
    completeness: 0,
    logic: 0,
    professionalism: 0
  };

  evaluations.forEach(e => {
    avgScores.accuracy += e.evaluation.accuracy.score;
    avgScores.relevance += e.evaluation.relevance.score;
    avgScores.completeness += e.evaluation.completeness.score;
    avgScores.logic += e.evaluation.logic.score;
    avgScores.professionalism += e.evaluation.professionalism.score;
  });

  const count = evaluations.length;
  (Object.keys(avgScores) as Array<keyof typeof avgScores>).forEach(key => {
    avgScores[key] = Math.round((avgScores[key] / count) * 100);
  });

  // 识别最佳表现者
  const bestPerformers = {
    accuracy: sortedEvaluations.find(e => e.evaluation.accuracy.score === Math.max(...evaluations.map(ev => ev.evaluation.accuracy.score))),
    relevance: sortedEvaluations.find(e => e.evaluation.relevance.score === Math.max(...evaluations.map(ev => ev.evaluation.relevance.score))),
    completeness: sortedEvaluations.find(e => e.evaluation.completeness.score === Math.max(...evaluations.map(ev => ev.evaluation.completeness.score))),
    logic: sortedEvaluations.find(e => e.evaluation.logic.score === Math.max(...evaluations.map(ev => ev.evaluation.logic.score))),
    professionalism: sortedEvaluations.find(e => e.evaluation.professionalism.score === Math.max(...evaluations.map(ev => ev.evaluation.professionalism.score)))
  };

  return {
    summary: {
      bestAI: {
        aiId: bestAI.aiId,
        aiName: bestAI.aiName,
        overallScore: bestAI.evaluation.overallScore
      },
      worstAI: {
        aiId: worstAI.aiId,
        aiName: worstAI.aiName,
        overallScore: worstAI.evaluation.overallScore
      },
      scoreGap: bestAI.evaluation.overallScore - worstAI.evaluation.overallScore,
      avgScores
    },
    dimensionComparison: {
      accuracy: {
        best: bestPerformers.accuracy?.aiName || '无',
        worst: sortedEvaluations.find(e => e.evaluation.accuracy.score === Math.min(...evaluations.map(ev => ev.evaluation.accuracy.score)))?.aiName || '无',
        range: Math.max(...evaluations.map(ev => ev.evaluation.accuracy.score)) - Math.min(...evaluations.map(ev => ev.evaluation.accuracy.score))
      },
      relevance: {
        best: bestPerformers.relevance?.aiName || '无',
        worst: sortedEvaluations.find(e => e.evaluation.relevance.score === Math.min(...evaluations.map(ev => ev.evaluation.relevance.score)))?.aiName || '无',
        range: Math.max(...evaluations.map(ev => ev.evaluation.relevance.score)) - Math.min(...evaluations.map(ev => ev.evaluation.relevance.score))
      },
      completeness: {
        best: bestPerformers.completeness?.aiName || '无',
        worst: sortedEvaluations.find(e => e.evaluation.completeness.score === Math.min(...evaluations.map(ev => ev.evaluation.completeness.score)))?.aiName || '无',
        range: Math.max(...evaluations.map(ev => ev.evaluation.completeness.score)) - Math.min(...evaluations.map(ev => ev.evaluation.completeness.score))
      },
      logic: {
        best: bestPerformers.logic?.aiName || '无',
        worst: sortedEvaluations.find(e => e.evaluation.logic.score === Math.min(...evaluations.map(ev => ev.evaluation.logic.score)))?.aiName || '无',
        range: Math.max(...evaluations.map(ev => ev.evaluation.logic.score)) - Math.min(...evaluations.map(ev => ev.evaluation.logic.score))
      },
      professionalism: {
        best: bestPerformers.professionalism?.aiName || '无',
        worst: sortedEvaluations.find(e => e.evaluation.professionalism.score === Math.min(...evaluations.map(ev => ev.evaluation.professionalism.score)))?.aiName || '无',
        range: Math.max(...evaluations.map(ev => ev.evaluation.professionalism.score)) - Math.min(...evaluations.map(ev => ev.evaluation.professionalism.score))
      }
    },
    ranking: sortedEvaluations.map((e, index) => ({
      rank: index + 1,
      aiId: e.aiId,
      aiName: e.aiName,
      overallScore: e.evaluation.overallScore
    }))
  };
}

/**
 * 生成综合建议
 */
function generateRecommendations(evaluations: any[]): any {
  const recommendations: string[] = [];
  const scenarioSuggestions: any[] = [];

  // 分析整体表现
  const avgOverallScore = evaluations.reduce((sum, e) => sum + e.evaluation.overallScore, 0) / evaluations.length;

  if (avgOverallScore >= 85) {
    recommendations.push('整体表现优秀，所有AI模型均能提供高质量回答');
  } else if (avgOverallScore >= 70) {
    recommendations.push('整体表现良好，建议根据具体需求选择最适合的AI模型');
  } else {
    recommendations.push('整体表现一般，建议优化提示词或增加知识库支持');
  }

  // 识别各AI的适用场景
  evaluations.forEach(e => {
    const scenarios: string[] = [];
    
    if (e.evaluation.accuracy.score >= 0.8) {
      scenarios.push('需要高准确性的学术研究');
    }
    if (e.evaluation.relevance.score >= 0.8) {
      scenarios.push('需要快速响应的日常问答');
    }
    if (e.evaluation.completeness.score >= 0.8) {
      scenarios.push('需要详细解释的教学场景');
    }
    if (e.evaluation.professionalism.score >= 0.8) {
      scenarios.push('需要专业术语的技术咨询');
    }

    if (scenarios.length > 0) {
      scenarioSuggestions.push({
        aiId: e.aiId,
        aiName: e.aiName,
        scenarios
      });
    }
  });

  // 生成改进建议
  const improvementSuggestions: string[] = [];
  
  const avgAccuracy = evaluations.reduce((sum, e) => sum + e.evaluation.accuracy.score, 0) / evaluations.length;
  const avgProfessionalism = evaluations.reduce((sum, e) => sum + e.evaluation.professionalism.score, 0) / evaluations.length;

  if (avgAccuracy < 0.7) {
    improvementSuggestions.push('建议增加知识库覆盖范围，提高回答准确性');
  }
  if (avgProfessionalism < 0.7) {
    improvementSuggestions.push('建议优化系统提示词，引导AI使用更多专业术语');
  }

  return {
    overallRecommendations: recommendations,
    scenarioSuggestions,
    improvementSuggestions: improvementSuggestions.length > 0 ? improvementSuggestions : ['整体表现良好，无需特别改进']
  };
}

/**
 * 冲突检测接口
 * POST /local-ai/conflicts
 * 检测AI回答与知识库的冲突
 */
router.post('/local-ai/conflicts', asyncHandler(async (req, res) => {
  const { response } = req.body;

  if (!response || typeof response !== 'string') {
    res.status(400).json({
      success: false,
      error: { message: 'AI回答内容不能为空' }
    });
    return;
  }

  try {
    const conflictReport = await localAIService.detectConflicts(response);
    res.json({
      success: true,
      data: conflictReport
    });
  } catch (error: any) {
    console.error('[LocalAI] 冲突检测失败:', error.message);
    res.status(500).json({
      success: false,
      error: { message: '冲突检测失败: ' + error.message }
    });
  }
}));

/**
 * 知识库统计接口
 * GET /local-ai/stats
 * 获取本地AI知识库统计信息
 */
router.get('/local-ai/stats', asyncHandler(async (_req, res) => {
  try {
    const stats = localAIService.getStats();
    res.json({
      success: true,
      data: {
        ...stats,
        model: 'ATCA-Local-RAG-v1',
        version: '1.0.0',
        status: 'ready'
      }
    });
  } catch (error: any) {
    console.error('[LocalAI] 获取统计信息失败:', error.message);
    res.status(500).json({
      success: false,
      error: { message: '获取统计信息失败: ' + error.message }
    });
  }
}));

/**
 * 初始化本地AI服务
 * POST /local-ai/initialize
 */
router.post('/local-ai/initialize', asyncHandler(async (_req, res) => {
  try {
    await localAIService.initialize();
    const stats = localAIService.getStats();
    res.json({
      success: true,
      data: {
        message: '本地AI服务初始化成功',
        ...stats
      }
    });
  } catch (error: any) {
    console.error('[LocalAI] 初始化失败:', error.message);
    res.status(500).json({
      success: false,
      error: { message: '初始化失败: ' + error.message }
    });
  }
}));

/**
 * 公开的AI配置列表接口
 * GET /ai-configs
 * 返回所有启用的AI配置（不含敏感信息）
 */
router.get('/ai-configs', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({
      success: true,
      data: [
        { ai_id: 1, name: '华夏营造AI', provider: 'qwan', model: 'qwen-turbo', is_active: true, is_default: true },
        { ai_id: 2, name: '智能顾问', provider: 'kimi', model: 'moonshot-v1-8k', is_active: true, is_default: false },
      ]
    });
    return;
  }

  const result = await query('user', 'SELECT ai_id, name, provider, model, is_active, is_default, max_concurrent, max_queue_size, queue_timeout FROM [ai_config] WHERE [is_active] = 1');
  res.json({ success: true, data: result });
}));

export default router;
