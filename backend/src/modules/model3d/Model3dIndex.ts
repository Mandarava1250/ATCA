// ============================================
// 华夏营造 - 3D工坊模块 (支持 Mock 降级)
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import sql from 'mssql';
import { query, execute, isMockMode, transaction } from '../../config/database';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { validateBody, validateParams } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { mockComponentDefs, mockTemplates } from '../../utils/mockData';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('Model3D');

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/) });
const saveModelSchema = z.object({
  modelName: z.string().min(1).max(255),
  modelData: z.string().max(50 * 1024 * 1024).optional(), // 最大50MB
  thumbnailUrl: z.string().max(500 * 1024).optional(), // 最大500KB（base64缩略图）
  isPublic: z.boolean().optional().default(false),
});

// 获取构件定义列表
router.get('/components', asyncHandler(async (req, res) => {
  const { category } = req.query as { category?: string };

  logger.info('获取构件定义列表', { category });

  if (isMockMode()) {
    let data = mockComponentDefs;
    if (category) data = data.filter((c: any) => c.category === category);
    logger.info('Mock模式-返回构件定义', { count: data.length, category });
    res.json({ success: true, data }); return;
  }

  let whereClause = 'WHERE [is_active] = 1'; const params: any = {};
  if (category) { whereClause += ' AND [category] = @category'; params.category = category; }
  const components = await query('media3d', `SELECT [definition_id], [type], [category], [name], [description], [dimensions], [material], [snap_points], [era], [complexity], [tags], [created_at] FROM dbo.model_component_definitions ${whereClause} ORDER BY [category], [name]`, params);
  logger.info('数据库模式-返回构件定义', { count: components.length });
  res.json({ success: true, data: components });
}));

// 获取建筑模板列表
router.get('/templates', asyncHandler(async (_req, res) => {
  logger.info('获取建筑模板列表');

  if (isMockMode()) {
    logger.info('Mock模式-返回模板列表', { count: mockTemplates.length });
    res.json({ success: true, data: mockTemplates }); return;
  }

  const templates = await query('media3d', `SELECT [template_id], [template_name], [description], [category], [building_type], [era], [complexity_level], [thumbnail_url], [is_featured], [is_active], [created_at] FROM dbo.building_templates WHERE [is_active] = 1 ORDER BY [template_id]`);
  logger.info('数据库模式-返回模板列表', { count: templates.length });
  res.json({ success: true, data: templates });
}));

// 获取模板详情
router.get('/templates/:id', validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);

  logger.info('获取模板详情', { templateId: id });

  if (isMockMode()) {
    const tpl = mockTemplates.find((t: any) => t.template_id === id);
    if (!tpl) {
      logger.warn('Mock模式-模板不存在', { templateId: id });
      res.status(404).json({ success: false, error: { code: 'MODEL_001', message: '模板不存在' } }); return;
    }
    logger.info('Mock模式-返回模板详情', { templateId: id });
    res.json({ success: true, data: { ...tpl, components: [] } }); return;
  }

  const templates = await query('media3d', 'SELECT [template_id], [template_name], [description], [category], [building_type], [era], [complexity_level], [thumbnail_url], [is_featured], [is_active], [created_at] FROM dbo.building_templates WHERE [template_id] = @id', { id });
  if (templates.length === 0) {
    logger.warn('数据库模式-模板不存在', { templateId: id });
    res.status(404).json({ success: false, error: { code: 'MODEL_001', message: '模板不存在' } }); return;
  }

  const components = await query('media3d', 'SELECT c.*, d.[type], d.[category], d.[name], d.[description] FROM dbo.template_components c JOIN dbo.model_component_definitions d ON c.[definition_id] = d.[definition_id] WHERE c.[template_id] = @id ORDER BY c.[build_order]', { id });
  logger.info('数据库模式-返回模板详情', { templateId: id, componentCount: components.length });

  res.json({ success: true, data: { ...(templates[0] as any), components } });
}));

// 获取所有公开模型列表
router.get('/', asyncHandler(async (_req, res) => {
  logger.info('获取公开模型列表');

  if (isMockMode()) {
    logger.info('Mock模式-返回公开模型列表');
    res.json({ success: true, data: [
      { model_id: 1, model_name: '太和殿示例模型', thumbnail_url: null, is_public: true, download_count: 45, created_at: '2024-01-01', username: 'admin' },
      { model_id: 2, model_name: '应县木塔示例', thumbnail_url: null, is_public: true, download_count: 12, created_at: '2024-01-02', username: 'user1' },
    ]}); return;
  }

  const models = await query('media3d', `SELECT m.[model_id], m.[model_name], m.[thumbnail_url], m.[is_public], m.[download_count], m.[created_at], u.[username] FROM dbo.user_models m LEFT JOIN ATCA_User.dbo.atca_user u ON m.[user_id] = u.[user_id] WHERE m.[is_public] = 1 ORDER BY m.[created_at] DESC`);
  logger.info('数据库模式-返回公开模型列表', { count: models.length });

  res.json({ success: true, data: models });
}));

// 保存模型（支持事务）
router.post('/', authMiddleware, validateBody(saveModelSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { modelName, modelData, isPublic } = req.body;
  let thumbnailUrl: string = req.body.thumbnailUrl || '';
  const userId = req.user!.userId;

  logger.info('保存用户模型', { userId, modelName, isPublic, hasModelData: !!modelData });

  if (isMockMode()) {
    logger.info('Mock模式-模型保存成功');
    res.status(201).json({ success: true, data: { modelId: 1, modelName, userId, isPublic }, message: '模型保存成功（Mock）' }); return;
  }

  // thumbnail_url 支持 base64 缩略图，最大500KB
  if (thumbnailUrl && thumbnailUrl.length > 500 * 1024) {
    logger.warn('缩略图数据过长，进行截断', { originalLength: thumbnailUrl.length });
    thumbnailUrl = thumbnailUrl.substring(0, 500 * 1024);
  }

  let modelId: number;

  try {
    // 使用事务确保数据一致性
    modelId = await transaction('media3d', async (tx) => {
      // 1. 插入用户模型记录
      const insertResult = await tx.request()
        .input('userId', sql.Int, userId)
        .input('modelName', sql.NVarChar(sql.MAX), modelName)
        .input('modelData', sql.NVarChar(sql.MAX), modelData || null)
        .input('thumbnailUrl', sql.NVarChar(sql.MAX), thumbnailUrl || null)
        .input('isPublic', sql.Bit, isPublic ? 1 : 0)
        .query(`INSERT INTO dbo.user_models ([user_id], [model_name], [model_data], [thumbnail_url], [is_public]) VALUES (@userId, @modelName, @modelData, @thumbnailUrl, @isPublic); SELECT SCOPE_IDENTITY() AS model_id;`);

      return (insertResult.recordset[0] as any).model_id as number;
    });

    logger.info('模型保存成功', { modelId, userId });

    // 如果设为公开，同步到building_shares（跨库操作，使用单独事务）
    if (isPublic) {
      try {
        await transaction('architecture', async (tx) => {
          const username = req.user?.username || '用户';
          await tx.request()
            .input('uid', sql.Int, userId)
            .input('uname', sql.NVarChar(100), username)
            .input('mid', sql.Int, modelId)
            .input('title', sql.NVarChar(255), modelName)
            .input('desc', sql.NVarChar(sql.MAX), modelName)
            .input('thumb', sql.NVarChar(sql.MAX), thumbnailUrl || null)
            .input('btype', sql.NVarChar(50), '用户模型')
            .input('era', sql.NVarChar(50), '现代')
            .query('INSERT INTO dbo.building_shares ([user_id],[username],[model_id],[title],[description],[thumbnail_url],[building_type],[is_featured],[era],[created_at]) VALUES (@uid,@uname,@mid,@title,@desc,@thumb,@btype,0,@era,GETDATE())');
        });
        logger.info('模型同步到building_shares成功', { modelId });
      } catch (shareErr: any) {
        logger.warn('[Model3d] 同步到building_shares失败:', shareErr.message);
        // 记录日志但不中断主流程
      }
    }

    res.status(201).json({ success: true, data: { modelId, modelName, userId, isPublic }, message: '模型保存成功' });
  } catch (error: any) {
    logger.error('[Model3d] 模型保存失败:', error.message);
    res.status(500).json({ success: false, error: { code: 'MODEL_SAVE_FAILED', message: '模型保存失败，请稍后重试' } });
  }
}));

// 获取用户模型列表
router.get('/my-models', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
      { model_id: 1, model_name: '示例民居', thumbnail_url: null, is_public: true, download_count: 12, created_at: '2024-01-01', updated_at: '2024-01-01', component_count: 8 },
      { model_id: 2, model_name: '小亭阁', thumbnail_url: null, is_public: false, download_count: 0, created_at: '2024-01-02', updated_at: '2024-01-02', component_count: 5 },
    ]});
    return;
  }
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const models = await query('media3d', `SELECT m.[model_id], m.[model_name], m.[thumbnail_url], m.[is_public], m.[download_count], m.[created_at], m.[updated_at], (SELECT COUNT(*) FROM dbo.model_component_instances WHERE [model_id] = m.[model_id]) AS component_count FROM dbo.user_models m WHERE m.[user_id] = @userId ORDER BY m.[updated_at] DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`, { userId: (req as any).user!.userId });
  res.json({ success: true, data: models });
}));

// 删除模型（支持事务）
router.delete('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) { res.json({ success: true, message: '模型删除成功（Mock）' }); return; }
  const id = parseInt(req.params.id);
  const userId = req.user!.userId;

  try {
    // 使用事务删除主表记录
    const deleteResult = await transaction('media3d', async (tx) => {
      const result = await tx.request()
        .input('id', sql.Int, id)
        .input('userId', sql.Int, userId)
        .query('DELETE FROM dbo.user_models WHERE [model_id] = @id AND [user_id] = @userId; SELECT @@ROWCOUNT AS deleted');
      return (result.recordset[0] as any).deleted as number;
    });

    if (deleteResult === 0) {
      res.status(404).json({ success: false, error: { message: '模型不存在或无权删除' } });
      return;
    }

    logger.info('模型删除成功', { modelId: id, userId });

    // 同步删除building_shares中的记录（跨库操作，使用单独事务）
    try {
      await transaction('architecture', async (tx) => {
        await tx.request()
          .input('mid', sql.Int, id)
          .query('DELETE FROM dbo.building_shares WHERE [model_id] = @mid');
      });
      logger.info('building_shares记录删除成功', { modelId: id });
    } catch (e: any) {
      logger.warn('[Model3d] 删除building_shares记录失败:', e.message);
    }

    res.json({ success: true, message: '模型删除成功' });
  } catch (error: any) {
    logger.error('[Model3d] 模型删除失败:', error.message);
    res.status(500).json({ success: false, error: { code: 'MODEL_DELETE_FAILED', message: '模型删除失败，请稍后重试' } });
  }
}));

// 获取单个模型详情（用于加载已保存的模型）
router.get('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isMockMode()) {
    res.json({ success: true, data: { model_id: id, model_name: 'Mock模型', model_data: '{"version":"2.0","components":[]}', thumbnail_url: null, is_public: true, user_id: req.user!.userId } });
    return;
  }
  
  // 1. 先查用户模型表
  let models = await query('media3d',
      'SELECT [model_id], [user_id], [model_name], [model_data], [thumbnail_url], [is_public], [download_count], [created_at], [updated_at] FROM dbo.user_models WHERE [model_id] = @id',
      { id }
  );

  // 2. 若不存在，回查建筑模板表（管理员导入的精选模型）
  if (models.length === 0) {
    const tplModels = await query('media3d',
        'SELECT [template_id] AS model_id, [created_by] AS user_id, [template_name] AS model_name, [template_structure] AS model_data, [thumbnail_url], 1 AS is_public, 0 AS download_count, [created_at], [updated_at] FROM dbo.building_templates WHERE [template_id] = @id',
        { id }
    );
    if (tplModels.length > 0) {
      models = tplModels;
    }
  }

  if (models.length === 0) { res.status(404).json({ success: false, error: { message: '模型不存在' } }); return; }

  const model = models[0] as any;
  if (!model.is_public && model.user_id !== req.user!.userId) {
    res.status(403).json({ success: false, error: { message: '无权访问此模型' } });
    return;
  }
  res.json({ success: true, data: model });
}));

// 更新模型（重命名/切换公开状态，支持事务）
router.put('/:id', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { modelName, isPublic, thumbnailUrl, modelData } = req.body;
  
  if (isMockMode()) { res.json({ success: true }); return; }
  
  const fields: string[] = [];
  const params: any = { id };
  if (modelName !== undefined) { fields.push('[model_name] = @modelName'); params.modelName = modelName; }
  if (isPublic !== undefined) { fields.push('[is_public] = @isPublic'); params.isPublic = isPublic ? 1 : 0; }
  if (thumbnailUrl !== undefined) { fields.push('[thumbnail_url] = @thumbnailUrl'); params.thumbnailUrl = thumbnailUrl?.length > 500 * 1024 ? thumbnailUrl.substring(0, 500 * 1024) : thumbnailUrl; }
  if (modelData !== undefined) { fields.push('[model_data] = @modelData'); params.modelData = modelData; }
  if (fields.length === 0) { res.json({ success: true }); return; }

  // 先获取当前模型信息（用于同步building_shares）
  const [existingModel] = await query('media3d',
    'SELECT [model_name],[is_public],[thumbnail_url] FROM dbo.user_models WHERE [model_id] = @id AND [user_id] = @userId',
    { id, userId: req.user!.userId }
  );
  
  if (!existingModel) {
    res.status(404).json({ success: false, error: { message: '模型不存在' } });
    return;
  }
  
  const oldIsPublic = (existingModel as any)?.is_public;
  const finalModelName = modelName !== undefined ? modelName : (existingModel as any)?.model_name;
  const finalThumb = thumbnailUrl !== undefined ? thumbnailUrl : (existingModel as any)?.thumbnail_url;

  try {
    // 使用事务更新主表
    await transaction('media3d', async (tx) => {
      const updateQuery = `UPDATE dbo.user_models SET ${fields.join(', ')}, [updated_at] = GETDATE() WHERE [model_id] = @id AND [user_id] = @userId`;
      await tx.request()
        .input('id', sql.Int, id)
        .input('userId', sql.Int, req.user!.userId)
        .query(updateQuery, params);
    });

    logger.info('模型更新成功', { modelId: id, userId: req.user!.userId });

    // 同步到building_shares表：设为公开时插入/更新，取消公开时删除
    if (isPublic === true && !oldIsPublic) {
      // 刚设为公开：插入building_shares
      try {
        await transaction('architecture', async (tx) => {
          await tx.request()
            .input('mid', sql.Int, id)
            .input('title', sql.NVarChar(255), finalModelName)
            .input('desc', sql.NVarChar(sql.MAX), finalModelName)
            .input('thumb', sql.NVarChar(sql.MAX), finalThumb || null)
            .input('btype', sql.NVarChar(50), '用户模型')
            .input('era', sql.NVarChar(50), '现代')
            .query('INSERT INTO dbo.building_shares ([model_id],[title],[description],[thumbnail_url],[building_type],[is_featured],[era],[created_at]) VALUES (@mid,@title,@desc,@thumb,@btype,0,@era,GETDATE())');
        });
        logger.info('模型同步到building_shares成功', { modelId: id });
      } catch (shareErr: any) {
        // 如果已存在则更新
        if (shareErr.message?.includes('duplicate') || shareErr.number === 2627 || shareErr.number === 2601) {
          await transaction('architecture', async (tx) => {
            await tx.request()
              .input('mid', sql.Int, id)
              .input('title', sql.NVarChar(255), finalModelName)
              .input('thumb', sql.NVarChar(sql.MAX), finalThumb || null)
              .query('UPDATE dbo.building_shares SET [title]=@title,[thumbnail_url]=@thumb,[updated_at]=GETDATE() WHERE [model_id]=@mid');
          }).catch(() => {});
        }
      }
    } else if (isPublic === false && oldIsPublic) {
      // 取消公开：从building_shares删除
      try {
        await transaction('architecture', async (tx) => {
          await tx.request()
            .input('mid', sql.Int, id)
            .query('DELETE FROM dbo.building_shares WHERE [model_id] = @mid');
        });
        logger.info('模型从building_shares删除', { modelId: id });
      } catch (e: any) { logger.warn('[Model3d] 从building_shares删除失败:', e.message || e); }
    } else if (isPublic === true && oldIsPublic && modelName !== undefined) {
      // 已公开的模型改名：同步更新building_shares
      try {
        await transaction('architecture', async (tx) => {
          await tx.request()
            .input('mid', sql.Int, id)
            .input('title', sql.NVarChar(255), finalModelName)
            .input('desc', sql.NVarChar(sql.MAX), finalModelName)
            .query('UPDATE dbo.building_shares SET [title]=@title,[description]=@desc,[updated_at]=GETDATE() WHERE [model_id]=@mid');
        });
        logger.info('building_shares更新成功', { modelId: id });
      } catch (e: any) { logger.warn('[Model3d] building_shares更新失败:', e.message || e); }
    }

    res.json({ success: true, message: '模型更新成功' });
  } catch (error: any) {
    logger.error('[Model3d] 模型更新失败:', error.message);
    res.status(500).json({ success: false, error: { code: 'MODEL_UPDATE_FAILED', message: '模型更新失败，请稍后重试' } });
  }
}));

// 导出模型数据
router.get('/:id/export', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isMockMode()) { const exportData = { version: '1.0', modelName: '我的模型', createdAt: new Date().toISOString(), modelData: null }; res.setHeader('Content-Type', 'application/json'); res.setHeader('Content-Disposition', 'attachment; filename="model.json"'); res.send(JSON.stringify(exportData, null, 2)); return; }
  const models = await query('media3d', 'SELECT [model_name], [model_data] FROM dbo.user_models WHERE [model_id] = @id AND ([user_id] = @userId OR [is_public] = 1)', { id, userId: req.user!.userId });
  if (models.length === 0) { res.status(404).json({ success: false, error: { message: '模型不存在' } }); return; }
  const model = models[0] as any;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(model.model_name)}.json"`);
  res.send(model.model_data || '{}');
}));

// 批量导入模型（管理员用）
const batchImportSchema = z.object({
  models: z.array(z.object({
    model_name: z.string().min(1),
    model_data: z.string().optional(),
    thumbnail_url: z.string().optional(),
    is_public: z.boolean().optional().default(true),
    is_featured: z.boolean().optional().default(false),
  })).min(1).max(50),
});

router.post('/batch-import', authMiddleware, validateBody(batchImportSchema), asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { models } = req.body;
  let imported = 0;
  const errors: string[] = [];

  // 使用事务批量导入，提升性能（减少事务提交次数）
  try {
    await transaction('media3d', async (tx) => {
      for (const m of models) {
        const importType = (m as any).import_type || 'model';
        const request = tx.request();

        if (importType === 'building') {
          // 建筑/场景类型：插入到 user_models 表
          request
            .input('userId', sql.Int, userId)
            .input('modelName', sql.NVarChar(sql.MAX), m.model_name)
            .input('modelData', sql.NVarChar(sql.MAX), m.model_data || null)
            .input('thumbnailUrl', sql.NVarChar(sql.MAX), m.thumbnail_url || null);
          await request.query(
            'INSERT INTO dbo.user_models ([user_id],[model_name],[model_data],[thumbnail_url],[is_public]) VALUES (@userId,@modelName,@modelData,@thumbnailUrl,1)'
          );
        } else {
          // 模型类型：同时插入building_templates（精选）和user_models（官方模型）
          try {
            // 1. 插入到building_templates作为精选模型
            const templateRequest = tx.request();
            templateRequest
              .input('name', sql.NVarChar(255), m.model_name)
              .input('desc', sql.NVarChar(sql.MAX), '管理员导入的精选模型')
              .input('cat', sql.NVarChar(50), '古建筑')
              .input('btype', sql.NVarChar(50), '传统建筑')
              .input('era', sql.NVarChar(50), '传统')
              .input('complexity', sql.Int, 2)
              .input('thumb', sql.NVarChar(sql.MAX), m.thumbnail_url || null)
              .input('struct', sql.NVarChar(sql.MAX), m.model_data || '{}');
            await templateRequest.query(
              'INSERT INTO dbo.building_templates ([template_name],[description],[category],[building_type],[era],[complexity_level],[thumbnail_url],[is_featured],[is_active],[template_structure]) VALUES (@name,@desc,@cat,@btype,@era,@complexity,@thumb,1,1,@struct)'
            );
            // 2. 同时插入到user_models作为官方模型
            const userModelRequest = tx.request();
            userModelRequest
              .input('userId', sql.Int, userId)
              .input('modelName', sql.NVarChar(sql.MAX), '[精选] ' + m.model_name)
              .input('modelData', sql.NVarChar(sql.MAX), m.model_data || null)
              .input('thumbnailUrl', sql.NVarChar(sql.MAX), m.thumbnail_url || null);
            await userModelRequest.query(
              'INSERT INTO dbo.user_models ([user_id],[model_name],[model_data],[thumbnail_url],[is_public]) VALUES (@userId,@modelName,@modelData,@thumbnailUrl,1)'
            );
          } catch (e: any) {
            logger.warn('[BatchImport] building_templates插入失败，回退到user_models:', e.message);
            // 回退：仅插入到 user_models
            const fallbackRequest = tx.request();
            fallbackRequest
              .input('userId', sql.Int, userId)
              .input('modelName', sql.NVarChar(sql.MAX), m.model_name)
              .input('modelData', sql.NVarChar(sql.MAX), m.model_data || null)
              .input('thumbnailUrl', sql.NVarChar(sql.MAX), m.thumbnail_url || null);
            await fallbackRequest.query(
              'INSERT INTO dbo.user_models ([user_id],[model_name],[model_data],[thumbnail_url],[is_public]) VALUES (@userId,@modelName,@modelData,@thumbnailUrl,1)'
            );
          }
        }
        imported++;
      }
    });
  } catch (txError: any) {
    logger.error('[BatchImport] 批量导入事务失败:', txError.message);
    errors.push(txError.message);
  }

  res.json({
    success: imported > 0,
    data: { imported, total: models.length, errors: errors.length > 0 ? errors : undefined },
    message: `成功导入 ${imported}/${models.length} 个模型${errors.length > 0 ? `，${errors.length} 个失败` : ''}`
  });
}));

export default router;
