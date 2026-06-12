import { Router } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

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

export default router;
