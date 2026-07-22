/**
 * 筑见山河 - 知识图谱用户检索模块
 * 提供面向普通用户的知识图谱检索功能
 * 支持实体查询、关系查询、路径查询等多种检索方式
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { knowledgeGraphService } from '../../services/KnowledgeGraphService';
import { isMockMode } from '../../config/database';

const router = Router();

// ============ 实体查询 ============

/**
 * 获取知识主题列表（支持分页和分类过滤）
 * GET /knowledge-graph/topics
 */
router.get('/topics', asyncHandler(async (req, res) => {
  const { page = '1', pageSize = '20', category = '' } = req.query as Record<string, string>;
  
  const result = await knowledgeGraphService.getTopics({
    category: category || undefined,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
  });
  
  res.json({ 
    success: true, 
    data: result.data,
    meta: { total: result.total, page: parseInt(page), pageSize: parseInt(pageSize) }
  });
}));

/**
 * 根据ID获取单个主题详情
 * GET /knowledge-graph/topics/:id
 */
router.get('/topics/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const topic = await knowledgeGraphService.getTopicById(parseInt(id));
  
  if (!topic) {
    res.status(404).json({ success: false, error: { message: '主题不存在' } });
    return;
  }
  
  res.json({ success: true, data: topic });
}));

/**
 * 根据名称搜索主题
 * GET /knowledge-graph/search
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q = '' } = req.query as Record<string, string>;
  
  if (!q.trim()) {
    res.json({ success: true, data: [] });
    return;
  }
  
  const topics = await knowledgeGraphService.searchTopics(q);
  res.json({ success: true, data: topics });
}));

/**
 * 获取所有分类
 * GET /knowledge-graph/categories
 */
router.get('/categories', asyncHandler(async (_req, res) => {
  const categories = await knowledgeGraphService.getCategories();
  res.json({ success: true, data: categories });
}));

// ============ 关系查询 ============

/**
 * 获取实体的直接邻居（关系查询）
 * GET /knowledge-graph/topics/:id/neighbors
 */
router.get('/topics/:id/neighbors', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { relationType } = req.query as Record<string, string>;
  
  const neighbors = await knowledgeGraphService.getNeighbors(
    parseInt(id),
    relationType || undefined
  );
  
  res.json({ success: true, data: neighbors });
}));

// ============ 路径查询 ============

/**
 * 查找两个主题之间的所有路径
 * GET /knowledge-graph/paths
 */
router.get('/paths', asyncHandler(async (req, res) => {
  const { from, to, maxHops = '3' } = req.query as Record<string, string>;
  
  if (!from || !to) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数: from 和 to' } });
    return;
  }
  
  const paths = await knowledgeGraphService.findPaths(
    parseInt(from),
    parseInt(to),
    parseInt(maxHops)
  );
  
  res.json({ success: true, data: paths });
}));

// ============ 知识图谱统计 ============

/**
 * 获取知识图谱统计信息（公开）
 * GET /knowledge-graph/stats
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
      },
    });
    return;
  }

  const stats = await knowledgeGraphService.getStats();
  res.json({ success: true, data: stats });
}));

export default router;