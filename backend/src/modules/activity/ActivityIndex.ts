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

// Mock 内存存储（替代浏览器 localStorage）
const mockStorage = new Map<string, string>();

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
    // 使用参数化查询防止SQL注入
    const placeholders = achievementIds.map((_, i) => `@id${i}`).join(',');
    const params: Record<string, number> = {};
    achievementIds.forEach((id: number, i: number) => {
      params[`id${i}`] = id;
    });
    
    const achievements = await query('activity',
      `SELECT [achievement_id], [achievement_name], [description], [icon], [badge_url], [required_points]
       FROM dbo.[achievement]
       WHERE [achievement_id] IN (${placeholders})`,
      params
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

// ========================
// 每日打卡 API
// ========================

// 用户打卡
router.post('/checkin', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { device_type, device_info } = req.body;

  if (isMockMode()) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const mockCheckins = JSON.parse(mockStorage.get('mock_checkins') || '[]');
    const hasCheckedToday = mockCheckins.some((c: any) => c.checkin_date === todayStr);
    
    if (hasCheckedToday) {
      res.json({ success: false, message: '今日已打卡', already_checked: true });
      return;
    }

    // 查找昨天的打卡记录，验证连续性
    const yesterdayCheckin = mockCheckins.find((c: any) => c.checkin_date === yesterdayStr);
    const streak = yesterdayCheckin ? yesterdayCheckin.streak_count + 1 : 1;
    let points = 10;
    if (streak >= 7) points = 50;
    else if (streak >= 5) points = 30;
    else if (streak >= 3) points = 20;

    const newCheckin = {
      checkin_id: Date.now(),
      checkin_date: todayStr,
      checkin_time: new Date().toISOString(),
      streak_count: streak,
      points_earned: points,
      device_type,
      device_info,
      created_at: new Date().toISOString(),
    };

    mockCheckins.unshift(newCheckin);
    mockStorage.set('mock_checkins', JSON.stringify(mockCheckins));

    res.json({ success: true, message: '打卡成功', checkin_id: newCheckin.checkin_id, streak_count: streak, points_earned: points, already_checked: false });
    return;
  }

  try {
    const result = await execute(
      'activity',
      'EXEC sp_user_checkin @user_id = @uid, @device_type = @dt, @device_info = @di',
      { uid: req.user!.userId, dt: device_type || null, di: device_info || null }
    );

    if (Array.isArray(result) && result.length > 0) {
      const row = result[0];
      if (row.success) {
        res.json({
          success: true,
          message: row.message,
          checkin_id: row.checkin_id,
          streak_count: row.streak_count,
          points_earned: row.points_earned,
          already_checked: false,
        });
      } else {
        res.json({
          success: false,
          message: row.message,
          already_checked: true,
        });
      }
    } else {
      res.json({ success: false, message: '打卡失败', already_checked: false });
    }
  } catch (err: any) {
    console.error('[Checkin] 打卡失败:', err.message);
    res.status(500).json({ success: false, message: '打卡失败', details: err.message });
  }
}));

// 获取用户打卡记录
router.get('/checkin', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '30' } = req.query as Record<string, string>;

  if (isMockMode()) {
    const mockCheckins = JSON.parse(mockStorage.get('mock_checkins') || '[]');
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = mockCheckins.slice(start, start + parseInt(limit));
    res.json({ success: true, data: { list: paginated, total: mockCheckins.length, totalPages: Math.ceil(mockCheckins.length / parseInt(limit)) } });
    return;
  }

  try {
    const countResult = await query(
      'activity',
      'SELECT COUNT(*) AS total FROM [daily_checkin] WHERE [user_id] = @uid',
      { uid: req.user!.userId }
    );
    const total = countResult.length > 0 ? (countResult[0] as any).total : 0;

    const result = await query(
      'activity',
      'EXEC sp_get_user_checkins @user_id = @uid, @page = @p, @limit = @l',
      { uid: req.user!.userId, p: parseInt(page), l: parseInt(limit) }
    );

    const list = Array.isArray(result) ? result : [];
    res.json({ success: true, data: { list, total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err: any) {
    console.error('[Checkin] 获取打卡记录失败:', err.message);
    res.json({ success: true, data: { list: [], total: 0, totalPages: 0 } });
  }
}));

// 获取用户打卡统计
router.get('/checkin/stats', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    const mockCheckins = JSON.parse(mockStorage.get('mock_checkins') || '[]');
    const stats = {
      total_checkins: mockCheckins.length,
      max_streak: mockCheckins.length > 0 ? Math.max(...mockCheckins.map((c: any) => c.streak_count)) : 0,
      total_points: mockCheckins.reduce((sum: number, c: any) => sum + c.points_earned, 0),
      last_checkin_date: mockCheckins.length > 0 ? mockCheckins[0].checkin_date : null,
      weekly_checkins: mockCheckins.filter((c: any) => {
        const d = new Date(c.checkin_date);
        return d >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }).length,
      monthly_checkins: mockCheckins.filter((c: any) => {
        const d = new Date(c.checkin_date);
        return d >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }).length,
    };
    res.json({ success: true, data: stats });
    return;
  }

  try {
    const result = await query('activity', 'EXEC sp_get_user_checkin_stats @user_id = @uid', { uid: req.user!.userId });
    const stats = Array.isArray(result) && result.length > 0 ? result[0] : {};
    res.json({ success: true, data: stats });
  } catch (err: any) {
    console.error('[Checkin] 获取统计失败:', err.message);
    res.json({ success: true, data: { total_checkins: 0, max_streak: 0, total_points: 0, last_checkin_date: null, weekly_checkins: 0, monthly_checkins: 0 } });
  }
}));

// 检查今日是否已打卡
router.get('/checkin/today', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    const today = new Date().toISOString().split('T')[0];
    const mockCheckins = JSON.parse(mockStorage.get('mock_checkins') || '[]');
    const checked = mockCheckins.some((c: any) => c.checkin_date === today);
    res.json({ success: true, data: { checked_today: checked } });
    return;
  }

  try {
    const result = await query('activity', 'EXEC sp_check_today_checkin @user_id = @uid', { uid: req.user!.userId });
    const checked = Array.isArray(result) && result.length > 0 && result[0].checked_today === true;
    res.json({ success: true, data: { checked_today: checked } });
  } catch (err: any) {
    console.error('[Checkin] 检查今日打卡失败:', err.message);
    res.json({ success: true, data: { checked_today: false } });
  }
}));

// 获取打卡日历数据
router.get('/checkin/calendar', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { year = new Date().getFullYear().toString(), month = (new Date().getMonth() + 1).toString() } = req.query as Record<string, string>;

  if (isMockMode()) {
    const mockCheckins = JSON.parse(mockStorage.get('mock_checkins') || '[]');
    const filtered = mockCheckins.filter((c: any) => {
      const d = new Date(c.checkin_date);
      return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
    });
    res.json({ success: true, data: filtered });
    return;
  }

  try {
    const result = await query(
      'activity',
      'EXEC sp_get_checkin_calendar @user_id = @uid, @year = @y, @month = @m',
      { uid: req.user!.userId, y: parseInt(year), m: parseInt(month) }
    );
    res.json({ success: true, data: Array.isArray(result) ? result : [] });
  } catch (err: any) {
    console.error('[Checkin] 获取日历失败:', err.message);
    res.json({ success: true, data: [] });
  }
}));

export default router;
