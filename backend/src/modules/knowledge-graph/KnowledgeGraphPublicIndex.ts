/**
 * 筑见山河 - 知识图谱公开接口模块
 * 提供知识图谱的公开操作接口（无需管理员权限）
 */

import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { knowledgeGraphService } from '../../services/KnowledgeGraphService';

const router = Router();

// ============ 知识主题管理（公开接口） ============

/**
 * 获取知识主题列表
 * GET /knowledge-graph/topics
 */
router.get('/topics', asyncHandler(async (req: any, res) => {
  const { category, page = '1', pageSize = '20' } = req.query as Record<string, string>;
  
  try {
    const result = await knowledgeGraphService.getTopics({
      category: category || undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
    
    res.json({ success: true, data: result.data, total: result.total });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 获取单个知识主题
 * GET /knowledge-graph/topics/:id
 */
router.get('/topics/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  try {
    const topic = await knowledgeGraphService.getTopicById(parseInt(id));
    
    if (!topic) {
      res.status(404).json({ success: false, error: { message: '知识主题不存在' } });
      return;
    }
    
    res.json({ success: true, data: topic });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 添加知识主题
 * POST /knowledge-graph/topics
 */
router.post('/topics', validateBody(z.object({
  topic_key: z.string().min(1).max(100),
  topic_name: z.string().min(1).max(200),
  category: z.string().min(1).max(50),
  content_zh: z.string().min(1),
  content_en: z.string().optional(),
  source: z.string().optional().default('用户添加'),
  confidence: z.number().min(0).max(1).default(0.95),
  verified: z.boolean().default(false),
})), asyncHandler(async (req: any, res) => {
  try {
    const topicId = await knowledgeGraphService.addTopic(req.body);
    res.json({ success: true, data: { topic_id: topicId, ...req.body } });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '添加失败' } 
    });
  }
}));

/**
 * 更新知识主题
 * PUT /knowledge-graph/topics/:id
 */
router.put('/topics/:id', validateBody(z.object({
  topic_name: z.string().optional(),
  category: z.string().optional(),
  content_zh: z.string().optional(),
  content_en: z.string().optional(),
  source: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  verified: z.boolean().optional(),
})), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  try {
    const success = await knowledgeGraphService.updateTopic(parseInt(id), req.body);
    
    if (!success) {
      res.status(404).json({ success: false, error: { message: '更新失败或知识主题不存在' } });
      return;
    }
    
    res.json({ success: true, data: { topic_id: parseInt(id), ...req.body } });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '更新失败' } 
    });
  }
}));

/**
 * 删除知识主题
 * DELETE /knowledge-graph/topics/:id
 */
router.delete('/topics/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  try {
    const success = await knowledgeGraphService.deleteTopic(parseInt(id));
    
    if (!success) {
      res.status(404).json({ success: false, error: { message: '删除失败或知识主题不存在' } });
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

/**
 * 批量删除知识主题
 * DELETE /knowledge-graph/topics/batch
 */
router.delete('/topics/batch', validateBody(z.object({
  ids: z.array(z.number().int().positive()),
})), asyncHandler(async (req: any, res) => {
  const { ids } = req.body;
  
  try {
    const result = await knowledgeGraphService.batchDeleteTopics(ids);
    res.json({ success: true, data: { deletedCount: result } });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '批量删除失败' } 
    });
  }
}));

// ============ 关键词管理 ============

/**
 * 获取主题的关键词
 * GET /knowledge-graph/topics/:id/keywords
 */
router.get('/topics/:id/keywords', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  try {
    const keywords = await knowledgeGraphService.getKeywords(parseInt(id));
    res.json({ success: true, data: keywords });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 添加关键词
 * POST /knowledge-graph/topics/:id/keywords
 */
router.post('/topics/:id/keywords', validateBody(z.object({
  keyword: z.string().min(1).max(100),
  weight: z.number().min(0.1).max(5).default(1.0),
  language: z.string().default('zh'),
})), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const { keyword, weight, language } = req.body;
  
  try {
    const keywordId = await knowledgeGraphService.addKeyword(parseInt(id), keyword, weight, language);
    res.json({ success: true, data: { keyword_id: keywordId, keyword, weight, language } });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '添加失败' } 
    });
  }
}));

// ============ 关系管理 ============

/**
 * 获取所有关系
 * GET /knowledge-graph/relations
 */
router.get('/relations', asyncHandler(async (_req, res) => {
  try {
    const relations = await knowledgeGraphService.getAllRelations();
    res.json({ success: true, data: relations });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 获取主题的出边关系
 * GET /knowledge-graph/topics/:id/relations/outgoing
 */
router.get('/topics/:id/relations/outgoing', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  try {
    const relations = await knowledgeGraphService.getOutgoingRelations(parseInt(id));
    res.json({ success: true, data: relations });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 获取主题的入边关系
 * GET /knowledge-graph/topics/:id/relations/incoming
 */
router.get('/topics/:id/relations/incoming', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  try {
    const relations = await knowledgeGraphService.getIncomingRelations(parseInt(id));
    res.json({ success: true, data: relations });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

/**
 * 添加关系
 * POST /knowledge-graph/relations
 */
router.post('/relations', validateBody(z.object({
  from_topic_id: z.number().int().positive(),
  to_topic_id: z.number().int().positive(),
  relation_type: z.string().min(1),
  description: z.string().optional(),
})), asyncHandler(async (req: any, res) => {
  try {
    const { from_topic_id, to_topic_id, relation_type, description } = req.body;
    const relationId = await knowledgeGraphService.addRelation(from_topic_id, to_topic_id, relation_type, description);
    res.json({ success: true, data: { relation_id: relationId, ...req.body } });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '添加失败' } 
    });
  }
}));

/**
 * 删除关系
 * DELETE /knowledge-graph/relations/:id
 */
router.delete('/relations/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  
  try {
    const success = await knowledgeGraphService.deleteRelation(parseInt(id));
    
    if (!success) {
      res.status(404).json({ success: false, error: { message: '删除失败或关系不存在' } });
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

// ============ 语义查询 ============

/**
 * 语义查询
 * POST /knowledge-graph/semantic-query
 */
router.post('/semantic-query', validateBody(z.object({
  keywords: z.array(z.string()),
  language: z.string().default('zh'),
  max_results: z.number().int().positive().default(10),
})), asyncHandler(async (req: any, res) => {
  const { keywords, language, max_results } = req.body;
  
  try {
    const result = await knowledgeGraphService.semanticQuery(keywords, language, max_results);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '查询失败' } 
    });
  }
}));

// ============ 知识图谱数据（可视化） ============

/**
 * 获取知识图谱数据
 * GET /knowledge-graph/graph
 */
router.get('/graph', asyncHandler(async (req: any, res) => {
  const { maxNodes = '100' } = req.query as Record<string, string>;
  
  try {
    const graphData = await knowledgeGraphService.getGraphData(parseInt(maxNodes));
    res.json({ success: true, data: graphData });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: { message: error.message || '获取失败' } 
    });
  }
}));

// ============ 实体链接 ============

/**
 * 实体链接
 * POST /knowledge-graph/entity-linking
 */
router.post('/entity-linking', validateBody(z.object({
  text: z.string().min(1),
  max_entities: z.number().int().positive().default(5),
})), asyncHandler(async (req: any, res) => {
  const { text, max_entities } = req.body;
  
  try {
    const links = await knowledgeGraphService.entityLinking(text, max_entities);
    res.json({ success: true, data: links });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '实体链接失败' } 
    });
  }
}));

// ============ 本地模型集成接口 ============

/**
 * 检索知识供模型使用
 * POST /knowledge-graph/retrieve-for-model
 */
router.post('/retrieve-for-model', validateBody(z.object({
  query: z.string().min(1),
  max_results: z.number().int().positive().default(5),
})), asyncHandler(async (req: any, res) => {
  const { query, max_results } = req.body;
  
  try {
    const results = await knowledgeGraphService.retrieveKnowledgeForModel(query, max_results);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '检索失败' } 
    });
  }
}));

/**
 * 验证模型回答
 * POST /knowledge-graph/verify-answer
 */
router.post('/verify-answer', validateBody(z.object({
  question: z.string().min(1),
  ai_answer: z.string().min(1),
  ai_provider: z.string().min(1),
})), asyncHandler(async (req: any, res) => {
  const { question, ai_answer, ai_provider } = req.body;
  
  try {
    const result = await knowledgeGraphService.verifyAnswer(question, ai_answer, ai_provider);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ 
      success: false, 
      error: { message: error.message || '验证失败' } 
    });
  }
}));

export default router;