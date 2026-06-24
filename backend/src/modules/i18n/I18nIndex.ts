import { Router } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import axios from 'axios';
import crypto from 'crypto';

const router = Router();

// 百度翻译API配置
const BAIDU_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
const BAIDU_APP_ID = process.env.BAIDU_TRANSLATE_APP_ID || '';
const BAIDU_SECRET_KEY = process.env.BAIDU_TRANSLATE_SECRET_KEY || '';

// ========================
// 语言管理
// ========================

// 获取支持的语言列表
router.get('/languages', asyncHandler(async (req, res) => {
  const activeOnly = req.query.active_only !== 'false';

  if (isMockMode()) {
    res.json({
      success: true,
      data: [
        { language_code: 'zh-CN', language_name: 'Chinese (Simplified)', native_name: '简体中文', is_active: true, is_default: true, sort_order: 1 },
        { language_code: 'en', language_name: 'English', native_name: 'English', is_active: true, is_default: false, sort_order: 2 },
      ]
    });
    return;
  }

  try {
    const result = await query('architecture', 'EXEC sp_get_languages @active_only = @active', { active: activeOnly ? 1 : 0 });
    res.json({ success: true, data: result || [] });
  } catch {
    // 表可能不存在，返回默认
    res.json({
      success: true,
      data: [
        { language_code: 'zh-CN', language_name: 'Chinese (Simplified)', native_name: '简体中文', is_active: true, is_default: true, sort_order: 1 },
        { language_code: 'en', language_name: 'English', native_name: 'English', is_active: true, is_default: false, sort_order: 2 },
      ]
    });
  }
}));

// ========================
// 翻译查询
// ========================

// 获取单个实体的翻译
router.get('/translate/:entityType/:entityId', asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const lang = (req.query.lang as string) || 'en';

  if (isMockMode()) {
    // 返回mock翻译数据
    const mockTranslations: Record<string, string> = {
      name: `${entityType}_${entityId} (EN)`,
      description: `This is the English description for ${entityType} #${entityId}.`,
    };
    res.json({ success: true, data: mockTranslations });
    return;
  }

  try {
    const result = await query(
      'architecture',
      'EXEC sp_get_translation @entity_type = @type, @entity_id = @id, @language_code = @lang',
      { type: entityType, id: parseInt(entityId), lang }
    );
    const translations: Record<string, { text: string; isMachine: boolean }> = {};
    if (Array.isArray(result)) {
      for (const row of result as any[]) {
        translations[row.field_name] = {
          text: row.translated_text,
          isMachine: row.is_machine_translated === true || row.is_machine_translated === 1,
        };
      }
    }
    res.json({ success: true, data: translations });
  } catch {
    res.json({ success: true, data: {} });
  }
}));

// 批量获取翻译
router.post('/translate/batch', asyncHandler(async (req, res) => {
  const { entityType, entityIds, language = 'en' } = req.body;

  if (!entityType || !Array.isArray(entityIds) || entityIds.length === 0) {
    res.status(400).json({ success: false, error: { message: '缺少参数 entityType 或 entityIds' } });
    return;
  }

  if (isMockMode()) {
    const mockData: Record<string, Record<string, string>> = {};
    for (const id of entityIds) {
      mockData[String(id)] = {
        name: `${entityType}_${id} (EN)`,
        description: `English description for ${entityType} #${id}.`,
      };
    }
    res.json({ success: true, data: mockData });
    return;
  }

  try {
    const idsJson = JSON.stringify(entityIds);
    const result = await query(
      'architecture',
      'EXEC sp_get_translations_batch @entity_type = @type, @entity_ids = @ids, @language_code = @lang',
      { type: entityType, ids: idsJson, lang: language }
    );

    const data: Record<string, Record<string, { text: string; isMachine: boolean }>> = {};
    if (Array.isArray(result)) {
      for (const row of result as any[]) {
        const eid = String(row.entity_id);
        if (!data[eid]) data[eid] = {};
        data[eid][row.field_name] = {
          text: row.translated_text,
          isMachine: row.is_machine_translated === true || row.is_machine_translated === 1,
        };
      }
    }
    res.json({ success: true, data });
  } catch {
    res.json({ success: true, data: {} });
  }
}));

// ========================
// 翻译管理（需管理员权限）
// ========================

// 保存/更新翻译
router.post('/translate', authMiddleware, asyncHandler(async (req, res) => {
  const { entity_type, entity_id, field_name, language_code, translated_text, is_machine_translated = true } = req.body;

  if (!entity_type || !entity_id || !field_name || !language_code || !translated_text) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数' } });
    return;
  }

  if (isMockMode()) {
    res.json({ success: true, data: { saved: true } });
    return;
  }

  try {
    await execute(
      'architecture',
      'EXEC sp_upsert_translation @entity_type = @type, @entity_id = @id, @field_name = @field, @language_code = @lang, @translated_text = @text, @is_machine_translated = @machine',
      {
        type: entity_type,
        id: parseInt(entity_id),
        field: field_name,
        lang: language_code,
        text: translated_text,
        machine: is_machine_translated ? 1 : 0,
      }
    );
    res.json({ success: true, data: { saved: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '保存翻译失败', details: err.message } });
  }
}));

// 自动翻译接口（调用AI翻译）
router.post('/translate/auto', authMiddleware, asyncHandler(async (req, res) => {
  const { entity_type, entity_id, field_name, source_text, target_lang = 'en' } = req.body;

  if (!source_text) {
    res.status(400).json({ success: false, error: { message: '缺少源文本' } });
    return;
  }

  // 这里可以集成第三方翻译API（如Azure Translator, Google Translate等）
  // 当前返回模拟翻译结果
  const mockTranslations: Record<string, Record<string, string>> = {
    en: {
      '宫殿': 'Palace',
      '寺庙': 'Temple',
      '塔': 'Pagoda',
      '园林': 'Garden',
      '民居': 'Folk House',
      '城墙': 'City Wall',
      '桥梁': 'Bridge',
      '牌坊': 'Memorial Archway',
      '石窟': 'Grotto',
      '陵墓': 'Mausoleum',
      '祭祀建筑': 'Ritual Building',
      '抬梁式': 'Post-and-Beam (Tailiang) Style',
      '穿斗式': 'Column-and-Tie (Chuandou) Style',
      '斗拱': 'Dougong (Bracket Set)',
      '庑殿顶': 'Wudian (Hip) Roof',
      '歇山顶': 'Xieshan (Hip-and-Gable) Roof',
      '悬山顶': 'Xuanshan (Overhanging Gable) Roof',
      '硬山顶': 'Yingshan (Hard Gable) Roof',
      '攒尖顶': 'Zanjian (Pyramidal) Roof',
      '榫卯': 'Mortise and Tenon',
      '材分制': 'Cai-Fen Modular System',
      '斗口制': 'Doukou Modular System',
    }
  };

  // 尝试查找已有翻译
  let translated = mockTranslations[target_lang]?.[source_text];
  if (!translated) {
    // 如果找不到精确匹配，返回一个通用的机器翻译标记
    translated = `[${target_lang.toUpperCase()}] ${source_text}`;
  }

  res.json({
    success: true,
    data: {
      translated_text: translated,
      source_text,
      target_lang,
      is_machine_translated: true,
    }
  });
}));

// ========================
// 翻译管理扩展API
// ========================

// 获取翻译统计
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        total_translations: 156,
        pending_reviews: 23,
        approved_translations: 120,
        rejected_translations: 13,
        machine_translations: 45,
        human_translations: 111,
        memory_entries: 89,
        entity_types: 5,
        languages: 3,
      }
    });
    return;
  }

  try {
    const result = await query('architecture', 'EXEC sp_get_translation_stats');
    res.json({ success: true, data: result?.[0] || {} });
  } catch {
    res.json({ success: true, data: {} });
  }
}));

// 获取翻译列表（带筛选和分页）
router.get('/translations', authMiddleware, asyncHandler(async (req, res) => {
  const { entity_type, language, status, page = 1, limit = 20 } = req.query;

  if (isMockMode()) {
    const mockList = [
      { translation_id: 1, entity_type: 'architecture', entity_id: 1, field_name: 'name', language_code: 'en', translated_text: 'Forbidden City', source_text: '故宫', review_status: 'approved', is_machine_translated: false, quality_score: 95, created_at: new Date().toISOString() },
      { translation_id: 2, entity_type: 'architecture', entity_id: 2, field_name: 'description', language_code: 'en', translated_text: 'The Great Wall of China', source_text: '长城', review_status: 'pending', is_machine_translated: true, quality_score: 0, created_at: new Date().toISOString() },
      { translation_id: 3, entity_type: 'quiz', entity_id: 10, field_name: 'question', language_code: 'ja', translated_text: '故宫の建築年代は？', source_text: '故宫的建筑年代是？', review_status: 'pending', is_machine_translated: true, quality_score: 0, created_at: new Date().toISOString() },
    ];
    res.json({ success: true, data: { list: mockList, total: 3, totalPages: 1 } });
    return;
  }

  try {
    const result = await query(
      'architecture',
      'EXEC sp_get_pending_reviews @entity_type = @type, @language_code = @lang, @page = @p, @limit = @l',
      { type: entity_type || null, lang: language || null, p: parseInt(page as string), l: parseInt(limit as string) }
    );
    const list = Array.isArray(result) ? result : [];
    const total = list.length > 0 ? (list[0] as any).total || list.length : 0;
    res.json({ success: true, data: { list, total, totalPages: Math.ceil(total / parseInt(limit as string)) } });
  } catch {
    res.json({ success: true, data: { list: [], total: 0, totalPages: 0 } });
  }
}));

// 翻译审核
router.post('/review', authMiddleware, asyncHandler(async (req, res) => {
  const { translation_id, review_status, review_notes, quality_score } = req.body;
  const reviewer_id = (req as any).user?.userId || 1;

  if (!translation_id || !review_status) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数' } });
    return;
  }

  if (isMockMode()) {
    res.json({ success: true, data: { review_id: 1 } });
    return;
  }

  try {
    const result = await execute(
      'architecture',
      'EXEC sp_submit_translation_review @translation_id = @tid, @reviewer_id = @rid, @review_status = @status, @review_notes = @notes, @quality_score = @score',
      { tid: translation_id, rid: reviewer_id, status: review_status, notes: review_notes || null, score: quality_score || null }
    );
    res.json({ success: true, data: { review_id: result } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '审核失败', details: err.message } });
  }
}));

// 获取翻译历史版本
router.get('/translations/:id/versions', authMiddleware, asyncHandler(async (req, res) => {
  const translationId = parseInt(req.params.id);

  if (isMockMode()) {
    res.json({
      success: true,
      data: [
        { version_id: 1, version_number: 1, translated_text: 'Forbidden City', edited_by: null, edit_reason: null, created_at: new Date().toISOString() },
        { version_id: 2, version_number: 2, translated_text: 'The Forbidden City', edited_by: 1, edit_reason: '修正翻译', created_at: new Date().toISOString() },
      ]
    });
    return;
  }

  try {
    const result = await query('architecture', 'EXEC sp_get_translation_versions @translation_id = @tid', { tid: translationId });
    res.json({ success: true, data: result || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
}));

// 翻译记忆查询
router.post('/memory/lookup', authMiddleware, asyncHandler(async (req, res) => {
  const { source_text, target_language } = req.body;

  if (!source_text || !target_language) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: [
        { memory_id: 1, source_text: '故宫', translated_text: 'Forbidden City', quality_score: 95, usage_count: 10 },
      ]
    });
    return;
  }

  try {
    const result = await query(
      'architecture',
      'EXEC sp_lookup_translation_memory @source_text = @text, @target_language = @lang',
      { text: source_text, lang: target_language }
    );
    res.json({ success: true, data: result || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
}));

// 翻译记忆列表
router.get('/memory', authMiddleware, asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;

  if (isMockMode()) {
    res.json({
      success: true,
      data: [
        { memory_id: 1, source_text: '故宫', source_language: 'zh', target_language: 'en', translated_text: 'Forbidden City', quality_score: 95, usage_count: 10 },
        { memory_id: 2, source_text: '长城', source_language: 'zh', target_language: 'en', translated_text: 'Great Wall', quality_score: 90, usage_count: 8 },
        { memory_id: 3, source_text: '斗拱', source_language: 'zh', target_language: 'ja', translated_text: '斗拱（組物）', quality_score: 85, usage_count: 5 },
      ]
    });
    return;
  }

  try {
    let sql = 'SELECT * FROM dbo.translation_memory';
    const params: any = {};
    if (search) {
      sql += ' WHERE source_text LIKE @search OR translated_text LIKE @search';
      params.search = `%${search}%`;
    }
    sql += ' ORDER BY usage_count DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    params.offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    params.limit = parseInt(limit as string);
    const result = await query('architecture', sql, params);
    res.json({ success: true, data: result || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
}));

// 批量翻译
router.post('/batch-translate', authMiddleware, asyncHandler(async (req, res) => {
  const { entityType, targetLang, fields } = req.body;

  if (!entityType || !targetLang || !fields?.length) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数' } });
    return;
  }

  // 返回任务信息（实际翻译由后台任务执行）
  res.json({
    success: true,
    data: {
      task_id: `batch_${Date.now()}`,
      entity_type: entityType,
      target_lang: targetLang,
      fields,
      total: 100, // 模拟总数
      status: 'pending',
    }
  });
}));

// 百度翻译API调用
async function callBaiduTranslate(text: string, from: string, to: string): Promise<string> {
  if (!BAIDU_APP_ID || !BAIDU_SECRET_KEY) {
    // 未配置API密钥，返回模拟翻译
    return `[${to.toUpperCase()}] ${text}`;
  }

  const salt = Date.now().toString();
  const sign = crypto
    .createHash('md5')
    .update(BAIDU_APP_ID + text + salt + BAIDU_SECRET_KEY)
    .digest('hex');

  try {
    const response = await axios.get(BAIDU_API_URL, {
      params: {
        q: text,
        from: from === 'zh' ? 'zh' : from,
        to: to === 'zh' ? 'zh' : to,
        appid: BAIDU_APP_ID,
        salt: salt,
        sign: sign,
      },
    });

    if (response.data?.trans_result?.[0]?.dst) {
      return response.data.trans_result[0].dst;
    }
    return `[${to.toUpperCase()}] ${text}`;
  } catch (error) {
    console.error('百度翻译API调用失败:', error);
    return `[${to.toUpperCase()}] ${text}`;
  }
}

// 自动翻译（使用百度API）
router.post('/translate/auto', authMiddleware, asyncHandler(async (req, res) => {
  const { source_text, target_lang = 'en' } = req.body;

  if (!source_text) {
    res.status(400).json({ success: false, error: { message: '缺少源文本' } });
    return;
  }

  // 调用百度翻译API
  const translated_text = await callBaiduTranslate(source_text, 'zh', target_lang);

  // 保存到翻译记忆
  if (!isMockMode()) {
    try {
      await execute(
        'architecture',
        'EXEC sp_upsert_translation_memory @source_text = @text, @source_language = @from, @target_language = @to, @translated_text = @result, @quality_score = @score',
        { text: source_text, from: 'zh', to: target_lang, result: translated_text, score: 80 }
      );
    } catch {
      // 忽略保存失败
    }
  }

  res.json({
    success: true,
    data: {
      translated_text,
      source_text,
      target_lang,
      is_machine_translated: true,
    }
  });
}));

export default router;
