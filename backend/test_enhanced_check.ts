import axios, { AxiosResponse } from 'axios';

let token = '';

// 登录响应接口
interface LoginResponse {
  success: boolean;
  data: {
    tokens: {
      accessToken: string;
    };
  };
}

// AI列表响应接口
interface AIListResponse {
  success: boolean;
  data: Array<{
    ai_id: number;
    name: string;
  }>;
}

// 冲突详情接口
interface Conflict {
  type: string;
  severity: string;
  conflictingStatement: string;
  analysis: string;
  correctionSuggestion: string;
}

// 冲突报告接口
interface ConflictReport {
  conflicts: Conflict[];
  severityLevel: string;
  summary: string;
  knowledgeCoverage: string;
}

// 增强检查结果接口
interface EnhancedCheck {
  localCheckDuration: string;
  conflictReport: ConflictReport;
}

// 聊天响应接口
interface ChatResponse {
  success: boolean;
  data: {
    response: string;
    enhancedCheck?: EnhancedCheck;
  };
}

// 登录获取token
async function login(): Promise<void> {
  try {
    const response: AxiosResponse<LoginResponse> = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'testuser',
      password: 'Test@12345'
    }, { timeout: 10000 });
    
    if (response.data.success && response.data.data.tokens.accessToken) {
      token = response.data.data.tokens.accessToken;
      console.log('✅ 登录成功');
    }
  } catch (error) {
    console.error('登录失败:', error.response?.data?.error?.message || error.message);
    throw error;
  }
}

// 测试增强检查模式的分析报告功能
async function testEnhancedCheck(): Promise<void> {
  console.log('=== 测试增强检查模式分析报告 ===\n');
  
  // 先登录
  await login();
  
  // 获取AI列表
  console.log('获取AI列表...');
  const aiListResponse: AxiosResponse<AIListResponse> = await axios.get('http://localhost:3000/api/v1/assistant/ai-list', { timeout: 10000 });
  console.log('可用AI:', JSON.stringify(aiListResponse.data.data.map(a => ({id: a.ai_id, name: a.name})), null, 2));
  
  const aiId = aiListResponse.data.data[0]?.ai_id || 1;
  console.log('使用AI ID:', aiId);
  
  // 测试用例1: 包含事实性错误的回答（宋代使用斗口制）
  const testInput1 = '宋代建筑使用斗口制作为模数制度，这使得建筑设计更加标准化。';
  console.log('\n测试用例1 - 事实性错误检测（宋代不应使用斗口制）：');
  console.log('输入:', testInput1);
  console.log('---');
  
  try {
    console.log('发送请求... (可能需要等待30-60秒)');
    const startTime = Date.now();
    
    const response: AxiosResponse<ChatResponse> = await axios.post('http://localhost:3000/api/v1/assistant/chat', {
      message: testInput1,
      ai_id: aiId,
      enhancedCheck: true
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 180000 // 3分钟超时
    });
    
    const duration = Date.now() - startTime;
    console.log(`响应时间: ${duration}ms`);
    console.log('响应状态:', response.status);
    console.log('是否成功:', response.data.success);
    
    if (response.data.success && response.data.data) {
      console.log('\n原始AI响应:', response.data.data.response?.substring(0, 300) + '...');
      
      if (response.data.data.enhancedCheck) {
        const ec = response.data.data.enhancedCheck;
        console.log('\n✅ 增强检查结果:');
        console.log('  检测耗时:', ec.localCheckDuration + 'ms');
        
        if (ec.conflictReport) {
          const cr = ec.conflictReport;
          console.log('  冲突数量:', cr.conflicts?.length || 0);
          console.log('  严重程度:', cr.severityLevel);
          console.log('  分析摘要:', cr.summary);
          console.log('  知识覆盖率:', cr.knowledgeCoverage);
          
          if (cr.conflicts && cr.conflicts.length > 0) {
            console.log('\n  冲突详情:');
            cr.conflicts.forEach((c, i) => {
              console.log(`    ${i+1}. [${c.type}] [${c.severity}]`);
              console.log(`       冲突陈述: ${c.conflictingStatement}`);
              console.log(`       分析: ${c.analysis}`);
              console.log(`       修正建议: ${c.correctionSuggestion}`);
            });
          }
        } else {
          console.log('\n  ❌ 冲突报告为空');
        }
      } else {
        console.log('\n❌ 未返回增强检查结果');
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
  
  console.log('\n=== 测试完成 ===');
}

testEnhancedCheck();
