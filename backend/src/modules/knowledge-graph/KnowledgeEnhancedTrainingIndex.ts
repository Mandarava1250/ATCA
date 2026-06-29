/**
 * 华夏营造 - 知识增强训练模块 API
 * 提供知识注入推理、训练任务管理、训练样本生成等功能
 */

import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { knowledgeEnhancedTrainingService, TrainingMode, TrainingStatus } from '../../services/KnowledgeEnhancedTrainingService';
import { isMockMode } from '../../config/database';

const router = Router();
router.use(authMiddleware as any);

// ============ 知识注入推理 ============

/**
 * 知识注入推理
 * POST /api/v1/knowledge-enhanced/inference
 */
router.post('/inference', validateBody(z.object({
  query: z.string().min(1),
  injectionDepth: z.number().min(1).max(5).default(2),
})), asyncHandler(async (req: any, res) => {
  const { query, injectionDepth } = req.body;

  if (isMockMode()) {
    const mockResult = {
      response: `根据华夏营造知识图谱，关于"${query}"的详细信息如下：

【古建筑知识】
中国古建筑以木构架为主要结构方式，具有独特的建筑美学特征。

📚 相关知识（知识注入）：
1. 斗拱（建筑结构）
   - 关系：related_to
   - 说明：斗拱是中国传统建筑中的重要构件

2. 抬梁式结构（建筑结构）
   - 关系：related_to
   - 说明：抬梁式结构是中国古建筑的主要结构形式之一

---
📖 数据来源：华夏营造知识图谱（置信度：95%）`,
      confidence: 0.9,
      knowledgeSources: [
        { topicId: 1, topicName: '古建筑', category: 'architecture', relevance: 1 },
        { topicId: 3, topicName: '斗拱', category: 'concept', relevance: 0.8 },
      ],
      reasoningPath: ['找到核心实体: 古建筑', '关联实体: 斗拱 (关系: related_to)'],
      metadata: {
        processingTime: 156,
        knowledgeUsed: 2,
        injectionDepth: 2,
      },
    };
    res.json({ success: true, data: mockResult });
    return;
  }

  const result = await knowledgeEnhancedTrainingService.knowledgeInjectionInference(query, injectionDepth);
  res.json({ success: true, data: result });
}));

// ============ 路径推理 ============

/**
 * 路径推理
 * GET /api/v1/knowledge-enhanced/path-reasoning
 */
router.get('/path-reasoning', asyncHandler(async (req, res) => {
  const { from, to, maxHops = '3' } = req.query as Record<string, string>;

  if (!from || !to) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数: from 和 to' } });
    return;
  }

  if (isMockMode()) {
    const mockResult = {
      paths: [
        { path_id: 1, path: '8->5', path_names: '佛光寺东大殿->斗拱', path_types: 'related_to', hop_count: 1 },
      ],
      reasoning: `从「佛光寺东大殿」到「斗拱」的推理路径：

路径 1（1 跳）：
  佛光寺东大殿->斗拱
  关系类型：related_to

推理结论：通过知识图谱路径分析，佛光寺东大殿与斗拱之间存在1条关联路径。`,
      confidence: 0.85,
    };
    res.json({ success: true, data: mockResult });
    return;
  }

  const result = await knowledgeEnhancedTrainingService.pathReasoning(
    parseInt(from),
    parseInt(to),
    parseInt(maxHops)
  );
  res.json({ success: true, data: result });
}));

// ============ 训练任务管理（需要管理员权限） ============

router.use(adminMiddleware as any);

/**
 * 创建训练任务
 * POST /api/v1/knowledge-enhanced/tasks
 */
router.post('/tasks', validateBody(z.object({
  mode: z.enum([TrainingMode.KNOWLEDGE_INJECTION, TrainingMode.FINE_TUNING, TrainingMode.RETRIEVAL_ENHANCEMENT]),
  category: z.string().optional(),
  sampleCount: z.number().min(1).max(1000).default(100),
  injectionDepth: z.number().min(1).max(5).default(2),
})), asyncHandler(async (req: any, res) => {
  const { mode, category, sampleCount, injectionDepth } = req.body;

  const task = await knowledgeEnhancedTrainingService.createTrainingTask({
    mode,
    category,
    sampleCount,
    injectionDepth,
  });

  res.json({ success: true, data: task });
}));

/**
 * 获取所有训练任务
 * GET /api/v1/knowledge-enhanced/tasks
 */
router.get('/tasks', asyncHandler(async (_req, res) => {
  const tasks = knowledgeEnhancedTrainingService.getTrainingTasks();
  res.json({ success: true, data: tasks });
}));

/**
 * 获取单个训练任务
 * GET /api/v1/knowledge-enhanced/tasks/:id
 */
router.get('/tasks/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = knowledgeEnhancedTrainingService.getTrainingTask(id);

  if (!task) {
    res.status(404).json({ success: false, error: { message: '训练任务不存在' } });
    return;
  }

  res.json({ success: true, data: task });
}));

/**
 * 启动训练任务
 * POST /api/v1/knowledge-enhanced/tasks/:id/start
 */
router.post('/tasks/:id/start', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const task = await knowledgeEnhancedTrainingService.startTrainingTask(id);
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
}));

/**
 * 暂停训练任务
 * POST /api/v1/knowledge-enhanced/tasks/:id/pause
 */
router.post('/tasks/:id/pause', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = knowledgeEnhancedTrainingService.stopTrainingTask(id);

  if (!task) {
    res.status(404).json({ success: false, error: { message: '训练任务不存在' } });
    return;
  }

  res.json({ success: true, data: task });
}));

/**
 * 删除训练任务
 * DELETE /api/v1/knowledge-enhanced/tasks/:id
 */
router.delete('/tasks/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const success = knowledgeEnhancedTrainingService.deleteTrainingTask(id);

  if (!success) {
    res.status(404).json({ success: false, error: { message: '训练任务不存在' } });
    return;
  }

  res.json({ success: true, message: '训练任务已删除' });
}));

// ============ 训练样本生成 ============

/**
 * 生成训练样本
 * POST /api/v1/knowledge-enhanced/generate-samples
 */
router.post('/generate-samples', validateBody(z.object({
  category: z.string().optional(),
  count: z.number().min(1).max(500).default(50),
  injectionDepth: z.number().min(1).max(5).default(2),
})), asyncHandler(async (req: any, res) => {
  const { category, count, injectionDepth } = req.body;

  const samples = await knowledgeEnhancedTrainingService.generateTrainingSamples({
    category,
    count,
    injectionDepth,
  });

  res.json({ success: true, data: samples, meta: { count: samples.length } });
}));

// ============ 统计信息 ============

/**
 * 获取训练服务统计信息
 * GET /api/v1/knowledge-enhanced/stats
 */
router.get('/stats', asyncHandler(async (_req, res) => {
  const stats = knowledgeEnhancedTrainingService.getStats();
  res.json({ success: true, data: stats });
}));

export default router;