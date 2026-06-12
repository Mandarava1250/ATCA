/**
 * 华夏营造 - 知识库管理API
 */

import { Router } from 'express';
import { knowledgeBaseService } from '../../services/KnowledgeBaseService';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * 获取知识库统计信息
 * GET /knowledge/stats
 */
router.get('/stats', asyncHandler(async (_req, res) => {
  const stats = await knowledgeBaseService.getStats();
  res.json({ success: true, data: stats });
}));

/**
 * 获取知识类别列表
 * GET /knowledge/categories
 */
router.get('/categories', asyncHandler(async (_req, res) => {
  const categories = await knowledgeBaseService.getCategories();
  res.json({ success: true, data: categories });
}));

/**
 * 获取知识列表
 * GET /knowledge?category=xxx
 */
router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const topics = await knowledgeBaseService.getAll(category as string | undefined);
  res.json({ success: true, data: topics });
}));

/**
 * 获取单条知识详情
 * GET /knowledge/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: { message: '无效的知识ID' } });
    return;
  }

  const topic = await knowledgeBaseService.getById(id);
  if (!topic) {
    res.status(404).json({ success: false, error: { message: '知识条目不存在' } });
    return;
  }

  res.json({ success: true, data: topic });
}));

/**
 * 搜索知识
 * GET /knowledge/search?q=xxx&limit=10
 */
router.get('/search/query', asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  
  if (!q || typeof q !== 'string') {
    res.status(400).json({ success: false, error: { message: '搜索关键词不能为空' } });
    return;
  }

  const results = await knowledgeBaseService.search(q, parseInt(limit as string) || 10);
  res.json({ success: true, data: results });
}));

/**
 * 添加知识条目（需要管理员权限）
 * POST /knowledge
 */
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { topic_key, topic_name, category, content, content_en, source, confidence, verified, keywords } = req.body;

  if (!topic_key || !topic_name || !category || !content) {
    res.status(400).json({ 
      success: false, 
      error: { message: '缺少必填字段：topic_key, topic_name, category, content' } 
    });
    return;
  }

  const id = await knowledgeBaseService.add({
    topic_key,
    topic_name,
    category,
    content,
    content_en,
    source,
    confidence: confidence || 0.9,
    verified: verified || false,
    keywords
  });

  res.json({ success: true, data: { topic_id: id, message: '添加成功' } });
}));

/**
 * 更新知识条目（需要管理员权限）
 * PUT /knowledge/:id
 */
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: { message: '无效的知识ID' } });
    return;
  }

  const { topic_name, category, content, content_en, source, confidence, verified, keywords } = req.body;
  
  const success = await knowledgeBaseService.update(id, {
    topic_name,
    category,
    content,
    content_en,
    source,
    confidence,
    verified,
    keywords
  });

  if (!success) {
    res.status(404).json({ success: false, error: { message: '更新失败或知识条目不存在' } });
    return;
  }

  res.json({ success: true, data: { message: '更新成功' } });
}));

/**
 * 删除知识条目（需要管理员权限）
 * DELETE /knowledge/:id
 */
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: { message: '无效的知识ID' } });
    return;
  }

  const success = await knowledgeBaseService.delete(id);
  if (!success) {
    res.status(404).json({ success: false, error: { message: '删除失败或知识条目不存在' } });
    return;
  }

  res.json({ success: true, data: { message: '删除成功' } });
}));

/**
 * 初始化知识库
 * POST /knowledge/init
 */
router.post('/init', asyncHandler(async (_req, res) => {
  await knowledgeBaseService.initialize();
  const stats = await knowledgeBaseService.getStats();
  res.json({ success: true, data: { message: '知识库初始化完成', ...stats } });
}));

export default router;
