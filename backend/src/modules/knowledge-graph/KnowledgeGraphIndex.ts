/**
 * 华夏营造 - 知识图谱数据导入管理模块
 * 提供管理员安全高效地添加本地模型知识图谱数据的功能
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { knowledgeGraphService } from '../../services/KnowledgeGraphService';
import { isMockMode } from '../../config/database';

const router = Router();
router.use(authMiddleware as any, adminMiddleware as any);

// ============ 数据导入接口 ============

/**
 * 支持的导入格式枚举
 */
export type ImportFormat = 'json-ld' | 'rdf-xml' | 'csv' | 'json';

/**
 * 冲突解决策略
 */
export type ConflictStrategy = 'overwrite' | 'skip' | 'prompt';

/**
 * 导入请求验证schema
 */
const importSchema = z.object({
  format: z.enum(['json-ld', 'rdf-xml', 'csv', 'json']),
  data: z.string(), // Base64编码的文件内容或JSON字符串
  conflictStrategy: z.enum(['overwrite', 'skip', 'prompt']).default('prompt'),
  validateOnly: z.boolean().default(false),
  batchSize: z.number().min(1).max(1000).default(100),
});

/**
 * 执行数据导入
 * POST /admin/knowledge-graph/import
 */
router.post('/import', validateBody(importSchema), asyncHandler(async (req: any, res) => {
  const { format, data, conflictStrategy, validateOnly, batchSize } = req.body;
  
  // Mock模式下返回模拟数据
  if (isMockMode()) {
    const mockResult = {
      success: true,
      data: {
        importId: 'mock-import-' + Date.now(),
        status: validateOnly ? 'validated' : 'completed',
        totalRecords: 150,
        successCount: 145,
        failedCount: 5,
        skippedCount: 0,
        conflicts: [],
        errors: [
          { row: 23, message: '无效的实体ID格式' },
          { row: 56, message: '缺少必填字段: name' },
          { row: 89, message: '关系目标不存在' },
          { row: 112, message: '数据格式错误' },
          { row: 145, message: '重复的实体ID' },
        ],
        report: `导入报告\n- 总记录数: 150\n- 成功: 145\n- 失败: 5\n- 跳过: 0\n- 格式: ${format}\n- 策略: ${conflictStrategy}`,
        createdAt: new Date().toISOString(),
      },
    };
    res.json(mockResult);
    return;
  }

  try {
    const result = await knowledgeGraphService.importData({
      format,
      data,
      conflictStrategy,
      validateOnly,
      batchSize,
      userId: req.user?.user_id,
      userName: req.user?.username,
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '导入失败' } 
    });
  }
}));

/**
 * 验证数据格式（不执行导入）
 * POST /admin/knowledge-graph/validate
 */
router.post('/validate', validateBody(importSchema), asyncHandler(async (req: any, res) => {
  const { format, data } = req.body;
  
  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        isValid: true,
        totalRecords: 150,
        warnings: [
          { row: 45, message: '建议添加description字段' },
          { row: 78, message: '检测到潜在的重复数据' },
        ],
        errors: [],
      },
    });
    return;
  }

  try {
    const result = await knowledgeGraphService.validateData(format, data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '验证失败' } 
    });
  }
}));

// ============ 导入历史记录 ============

/**
 * 查询导入历史记录
 * GET /admin/knowledge-graph/import-history
 */
router.get('/import-history', asyncHandler(async (req: any, res) => {
  const { page = '1', limit = '20', status = '', search = '' } = req.query as Record<string, string>;
  
  if (isMockMode()) {
    const mockHistory = [
      {
        importId: 'import-20240115-001',
        format: 'json-ld',
        status: 'completed',
        totalRecords: 150,
        successCount: 145,
        failedCount: 5,
        skippedCount: 0,
        createdBy: 'admin',
        createdAt: '2024-01-15T10:30:00Z',
        duration: 1250,
      },
      {
        importId: 'import-20240114-002',
        format: 'csv',
        status: 'completed',
        totalRecords: 200,
        successCount: 200,
        failedCount: 0,
        skippedCount: 0,
        createdBy: 'admin',
        createdAt: '2024-01-14T14:20:00Z',
        duration: 890,
      },
      {
        importId: 'import-20240113-003',
        format: 'rdf-xml',
        status: 'failed',
        totalRecords: 100,
        successCount: 0,
        failedCount: 100,
        skippedCount: 0,
        createdBy: 'admin',
        createdAt: '2024-01-13T09:15:00Z',
        duration: 320,
        errorMessage: '文件格式错误，无法解析RDF/XML',
      },
    ];
    
    let filtered = mockHistory;
    if (status) {
      filtered = filtered.filter(h => h.status === status);
    }
    if (search) {
      filtered = filtered.filter(h => 
        h.importId.includes(search) || 
        h.format.includes(search) || 
        h.createdBy.includes(search)
      );
    }
    
    res.json({ 
      success: true, 
      data: filtered,
      meta: { total: filtered.length, page: parseInt(page), limit: parseInt(limit) }
    });
    return;
  }

  try {
    const result = await knowledgeGraphService.getImportHistory({
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || undefined,
      search: search || undefined,
    });
    
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 获取单次导入详情
 * GET /admin/knowledge-graph/import-history/:id
 */
router.get('/import-history/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        importId: id,
        format: 'json-ld',
        status: 'completed',
        conflictStrategy: 'overwrite',
        totalRecords: 150,
        successCount: 145,
        failedCount: 5,
        skippedCount: 0,
        createdBy: 'admin',
        createdAt: '2024-01-15T10:30:00Z',
        duration: 1250,
        report: `知识图谱数据导入报告\n\n导入信息:\n- 导入ID: ${id}\n- 格式: JSON-LD\n- 策略: 覆盖\n- 操作者: admin\n- 时间: 2024-01-15 10:30:00\n\n统计信息:\n- 总记录数: 150\n- 成功导入: 145\n- 失败: 5\n- 跳过: 0\n\n失败详情:\n1. 第23行 - 无效的实体ID格式\n2. 第56行 - 缺少必填字段: name\n3. 第89行 - 关系目标不存在\n4. 第112行 - 数据格式错误\n5. 第145行 - 重复的实体ID`,
        errors: [
          { row: 23, message: '无效的实体ID格式', entityId: null },
          { row: 56, message: '缺少必填字段: name', entityId: 'entity-56' },
          { row: 89, message: '关系目标不存在', entityId: 'entity-89' },
          { row: 112, message: '数据格式错误', entityId: 'entity-112' },
          { row: 145, message: '重复的实体ID', entityId: 'entity-145' },
        ],
      },
    });
    return;
  }

  try {
    const result = await knowledgeGraphService.getImportDetail(id);
    
    if (!result) {
      res.status(404).json({ success: false, error: { message: '导入记录不存在' } });
      return;
    }
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 删除导入记录
 * DELETE /admin/knowledge-graph/import-history/:id
 */
router.delete('/import-history/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  if (isMockMode()) {
    res.json({ success: true, message: '删除成功' });
    return;
  }

  try {
    const success = await knowledgeGraphService.deleteImportRecord(id);
    
    if (!success) {
      res.status(404).json({ success: false, error: { message: '删除失败或记录不存在' } });
      return;
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '删除失败' } 
    });
  }
}));

// ============ 图谱关系管理 ============

/**
 * 获取所有关系类型定义
 * GET /admin/knowledge-graph/relations
 */
router.get('/relations', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({
      success: true,
      data: [
        { id: 1, name: '属于', nameEn: 'belongsTo', description: '实体所属类别', domain: 'Architecture', range: 'Category' },
        { id: 2, name: '位于', nameEn: 'locatedAt', description: '地理位置关系', domain: 'Architecture', range: 'Location' },
        { id: 3, name: '建造于', nameEn: 'builtIn', description: '建造年代', domain: 'Architecture', range: 'Dynasty' },
        { id: 4, name: '包含', nameEn: 'contains', description: '包含关系', domain: 'Architecture', range: 'Component' },
        { id: 5, name: '使用', nameEn: 'uses', description: '使用技术/材料', domain: 'Architecture', range: 'Technique' },
        { id: 6, name: '影响', nameEn: 'influencedBy', description: '受影响于', domain: 'Architecture', range: 'Architecture' },
      ],
    });
    return;
  }

  try {
    const relations = await knowledgeGraphService.getRelationTypes();
    res.json({ success: true, data: relations });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 添加新的关系类型
 * POST /admin/knowledge-graph/relations
 */
router.post('/relations', validateBody(z.object({
  name: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().optional(),
  range: z.string().optional(),
})), asyncHandler(async (req: any, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: { id: 999, ...req.body } });
    return;
  }

  try {
    const id = await knowledgeGraphService.addRelationType(req.body);
    res.json({ success: true, data: { id, ...req.body } });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '添加失败' } 
    });
  }
}));

/**
 * 更新关系类型
 * PUT /admin/knowledge-graph/relations/:id
 */
router.put('/relations/:id', validateBody(z.object({
  name: z.string().optional(),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  domain: z.string().optional(),
  range: z.string().optional(),
})), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  if (isMockMode()) {
    res.json({ success: true, data: { id: parseInt(id), ...req.body } });
    return;
  }

  try {
    const success = await knowledgeGraphService.updateRelationType(parseInt(id), req.body);
    
    if (!success) {
      res.status(404).json({ success: false, error: { message: '更新失败或关系类型不存在' } });
      return;
    }
    
    res.json({ success: true, data: { id: parseInt(id), ...req.body } });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '更新失败' } 
    });
  }
}));

/**
 * 删除关系类型
 * DELETE /admin/knowledge-graph/relations/:id
 */
router.delete('/relations/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  if (isMockMode()) {
    res.json({ success: true, message: '删除成功' });
    return;
  }

  try {
    const success = await knowledgeGraphService.deleteRelationType(parseInt(id));
    
    if (!success) {
      res.status(404).json({ success: false, error: { message: '删除失败或关系类型不存在' } });
      return;
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '删除失败' } 
    });
  }
}));

// ============ 审计日志 ============

/**
 * 查询审计日志
 * GET /admin/knowledge-graph/audit-logs
 */
router.get('/audit-logs', asyncHandler(async (req: any, res) => {
  const { page = '1', limit = '20', action = '', user = '' } = req.query as Record<string, string>;
  
  if (isMockMode()) {
    const mockLogs = [
      {
        id: 1,
        action: 'IMPORT',
        user: 'admin',
        userId: 1,
        targetType: 'KnowledgeGraph',
        targetId: 'import-20240115-001',
        details: '导入JSON-LD格式数据，成功145条，失败5条',
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        action: 'VALIDATE',
        user: 'admin',
        userId: 1,
        targetType: 'KnowledgeGraph',
        targetId: null,
        details: '验证CSV数据，共200条记录通过',
        createdAt: '2024-01-15T09:45:00Z',
      },
      {
        id: 3,
        action: 'ADD_RELATION',
        user: 'admin',
        userId: 1,
        targetType: 'RelationType',
        targetId: '7',
        details: '添加关系类型: influencedBy(影响)',
        createdAt: '2024-01-14T16:20:00Z',
      },
    ];
    
    let filtered = mockLogs;
    if (action) {
      filtered = filtered.filter(l => l.action === action);
    }
    if (user) {
      filtered = filtered.filter(l => l.user.includes(user));
    }
    
    res.json({ 
      success: true, 
      data: filtered,
      meta: { total: filtered.length, page: parseInt(page), limit: parseInt(limit) }
    });
    return;
  }

  try {
    const result = await knowledgeGraphService.getAuditLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      action: action || undefined,
      user: user || undefined,
    });
    
    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

// ============ 数据统计 ============

/**
 * 获取知识图谱统计信息
 * GET /admin/knowledge-graph/stats
 */
router.get('/stats', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        totalEntities: 5000,
        totalRelations: 12000,
        entityTypes: [
          { name: 'Architecture', count: 500 },
          { name: 'Person', count: 200 },
          { name: 'Dynasty', count: 50 },
          { name: 'Location', count: 300 },
          { name: 'Technique', count: 150 },
          { name: 'Material', count: 100 },
        ],
        relationTypes: 25,
        totalImports: 45,
        lastImportDate: '2024-01-15T10:30:00Z',
      },
    });
    return;
  }

  try {
    const stats = await knowledgeGraphService.getStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

export default router;
