// ============================================
// 华夏营造 - 活动与成就模块 (支持 Mock 降级)
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { validateParams } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { mockActivities, mockAchievements } from '../../utils/mockData';

const router = Router();
const idParamSchema = z.object({ id: z.string().regex(/^\d+$/) });

// 获取活动列表
router.get('/', asyncHandler(async (req, res) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  if (isMockMode()) { res.json({ success: true, data: mockActivities }); return; }
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = {
    offset: offset,
    limit: parseInt(limit)
  };
  const activities = await query('activity', `SELECT [activity_id], [title], [description], [start_date], [end_date], [activity_type], [banner_url], [reward_points], [max_participants], [current_participants], [is_active], [created_at] FROM [activity] WHERE [is_active] = 1 AND [end_date] > GETDATE() ORDER BY [start_date] DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params);
  res.json({ success: true, data: activities });
}));

// 获取成就列表（必须在 /:id 之前）
router.get('/achievements', asyncHandler(async (_req, res) => {
  if (isMockMode()) { res.json({ success: true, data: mockAchievements }); return; }
  const achievements = await query('activity', 'SELECT [achievement_id], [achievement_name], [description], [achievement_type], [required_points], [required_actions], [icon], [badge_url], [created_at] FROM [achievement] ORDER BY [required_points]');
  res.json({ success: true, data: achievements });
}));

// 获取用户成就（必须在 /:id 之前）
router.get('/user-achievements', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) { res.json({ success: true, data: [] }); return; }
  
  try {
    // 先查询用户成就记录
    const userAchievements = await query('user', 
      `SELECT [achievement_record_id], [achievement_id], [external_user_id], [obtained_at] 
       FROM dbo.user_achievement 
       WHERE [external_user_id] = @userId 
       ORDER BY [obtained_at] DESC`, 
      { userId: req.user!.userId }
    );
    
    // 如果没有成就记录，返回空数组
    if (!userAchievements || userAchievements.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }
    
    // 获取成就ID列表
    const achievementIds = userAchievements.map((ua: any) => ua.achievement_id);
    
    // 查询成就详情（从 Activity 数据库）
    const achievements = await query('activity',
      `SELECT [achievement_id], [achievement_name], [description], [icon], [badge_url], [required_points]
       FROM dbo.[achievement]
       WHERE [achievement_id] IN (${achievementIds.join(',')})`
    );
    
    // 合并数据
    const result = userAchievements.map((ua: any) => {
      const achievement = achievements.find((a: any) => a.achievement_id === ua.achievement_id);
      return {
        ...ua,
        achievement_name: achievement?.achievement_name || '',
        description: achievement?.description || '',
        icon: achievement?.icon || '',
        badge_url: achievement?.badge_url || '',
        required_points: achievement?.required_points || 0,
      };
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    // 如果表不存在或其他错误，返回空数组
    console.warn('[Activity] user-achievements 查询失败:', error.message);
    res.json({ success: true, data: [] });
  }
}));

// 获取每日任务（必须在 /:id 之前）
router.get('/daily-tasks', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
      { task_id: 1, task_name: '浏览3个古建筑', description: '在详情页浏览任意3个古建筑', points_reward: 10, required_action: 'view_architecture', action_count: 3, created_at: '2024-01-01' },
      { task_id: 2, task_name: '完成一次竞赛', description: '参与任意模式的知识竞赛', points_reward: 20, required_action: 'play_quiz', action_count: 1, created_at: '2024-01-01' },
    ]});
    return;
  }
  const tasks = await query('activity', 'SELECT [task_id], [task_name], [description], [points_reward], [required_action], [action_count] FROM [daily_tasks] ORDER BY [task_id]');
  res.json({ success: true, data: tasks });
}));

// 获取活动详情（参数化路由必须放在最后）
router.get('/:id', validateParams(idParamSchema), asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (isMockMode()) {
    const act = mockActivities.find((a: any) => a.activity_id === id);
    if (!act) { res.status(404).json({ success: false, error: { code: 'SYS_004', message: '活动不存在' } }); return; }
    res.json({ success: true, data: act }); return;
  }
  const activities = await query('activity', 'SELECT * FROM [activity] WHERE [activity_id] = @id', { id });
  if (activities.length === 0) { res.status(404).json({ success: false, error: { code: 'SYS_004', message: '活动不存在' } }); return; }
  res.json({ success: true, data: activities[0] });
}));

// 参与活动
router.post('/:id/join', authMiddleware, validateParams(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) { res.json({ success: true, message: '参与成功（Mock）' }); return; }
  const id = parseInt(req.params.id);
  await execute('activity', `IF NOT EXISTS (SELECT 1 FROM [user_activities] WHERE [user_id] = @userId AND [activity_id] = @id) INSERT INTO [user_activities] ([user_id], [activity_id], [joined_at]) VALUES (@userId, @id, GETDATE())`, { userId: req.user!.userId, id });
  res.json({ success: true, message: '参与成功' });
}));

export default router;
