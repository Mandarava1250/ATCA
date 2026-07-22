// ============================================
// 筑见山河 - 活动与成就模块 (支持 Mock 降级)
// ============================================

import { Router } from 'express';
import { z } from 'zod';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware, AuthRequest, adminMiddleware } from '../../middleware/auth';
import { validateParams } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { pushToUser } from '../../services/SyncService';
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

// 创建成就（管理员）
router.post('/achievements', authMiddleware, adminMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { name, description, icon, condition_type, condition_value, points, is_active } = req.body;
  if (isMockMode()) {
    const newAchievement = {
      achievement_id: Date.now(),
      achievement_name: name,
      description,
      achievement_type: condition_type,
      required_points: points,
      required_actions: condition_value,
      icon,
      badge_url: null,
      is_active: is_active !== false,
      created_at: new Date().toISOString()
    };
    res.json({ success: true, data: newAchievement });
    return;
  }
  const result = await execute('activity', `INSERT INTO [achievement] ([achievement_name], [description], [achievement_type], [required_points], [required_actions], [icon], [is_active]) OUTPUT INSERTED.* VALUES (@name, @description, @type, @points, @actions, @icon, @is_active)`, {
    name,
    description,
    type: condition_type,
    points,
    actions: condition_value,
    icon,
    is_active: is_active !== false
  });
  res.json({ success: true, data: result && Array.isArray(result) ? result[0] : result });
}));

// 更新成就（管理员）
router.put('/achievements/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { name, description, icon, condition_type, condition_value, points, is_active } = req.body;
  if (isMockMode()) {
    res.json({ success: true, data: { achievement_id: id, achievement_name: name, description, achievement_type: condition_type, required_points: points, required_actions: condition_value, icon, is_active } });
    return;
  }
  const result = await execute('activity', `UPDATE [achievement] SET [achievement_name] = COALESCE(@name, [achievement_name]), [description] = COALESCE(@description, [description]), [achievement_type] = COALESCE(@type, [achievement_type]), [required_points] = COALESCE(@points, [required_points]), [required_actions] = COALESCE(@actions, [required_actions]), [icon] = COALESCE(@icon, [icon]), [is_active] = COALESCE(@is_active, [is_active]) OUTPUT DELETED.* WHERE [achievement_id] = @id`, {
    id,
    name,
    description,
    type: condition_type,
    points,
    actions: condition_value,
    icon,
    is_active
  });
  const updated = result && Array.isArray(result) ? result[0] : null;
  if (!updated) { res.status(404).json({ success: false, error: { code: 'SYS_004', message: '成就不存在' } }); return; }
  res.json({ success: true, data: updated });
}));

// 删除成就（管理员）
router.delete('/achievements/:id', authMiddleware, adminMiddleware, validateParams(idParamSchema), asyncHandler(async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isMockMode()) {
    res.json({ success: true, message: '删除成功（Mock）' });
    return;
  }
  const result = await execute('activity', `DELETE FROM [achievement] OUTPUT DELETED.* WHERE [achievement_id] = @id`, { id });
  const deleted = result && Array.isArray(result) ? result[0] : null;
  if (!deleted) { res.status(404).json({ success: false, error: { code: 'SYS_004', message: '成就不存在' } }); return; }
  res.json({ success: true, message: '删除成功' });
}));

// 获取成就统计（管理员）
router.get('/achievements/stats', authMiddleware, adminMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: { total_achievements: mockAchievements.length, total_users: 0, total_unlocked: 0 } });
    return;
  }
  const stats = await query('activity', `SELECT COUNT(*) AS total_achievements FROM [achievement]`);
  const userStats = await query('activity', `SELECT COUNT(DISTINCT [external_user_id]) AS total_users, COUNT(*) AS total_unlocked FROM [user_achievement]`);
  res.json({ success: true, data: {
    total_achievements: stats.length > 0 ? stats[0].total_achievements : 0,
    total_users: userStats.length > 0 ? userStats[0].total_users : 0,
    total_unlocked: userStats.length > 0 ? userStats[0].total_unlocked : 0
  }});
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

const checkinSchema = z.object({
  device_type: z.enum(['mobile', 'web', 'desktop']).optional(),
  device_info: z.string().max(255).optional(),
  checkin_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const logger = {
  info: (msg: string, data?: any) => console.log(`[Checkin] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[Checkin] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[Checkin] ${msg}`, data || ''),
};

async function calculateStreakAndPoints(userId: number, targetDateStr: string): Promise<{ streak: number; points: number }> {
  try {
    const yesterday = new Date(targetDateStr);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const result = await query(
      'sync',
      'SELECT TOP 1 [streak_count] FROM dbo.user_checkin_sync WHERE [user_id] = @uid AND [checkin_date] = @cd',
      { uid: userId, cd: yesterdayStr }
    );

    let streak = 1;
    if (Array.isArray(result) && result.length > 0) {
      streak = result[0].streak_count + 1;
    }

    let points = 10;
    if (streak >= 7) points = 50;
    else if (streak >= 5) points = 30;
    else if (streak >= 3) points = 20;

    return { streak, points };
  } catch (err: any) {
    logger.warn(`计算连续打卡失败，使用默认值 - 用户: ${userId}, 错误: ${err.message}`);
    return { streak: 1, points: 10 };
  }
}

// 用户打卡
router.post('/checkin', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { device_type, device_info, checkin_date } = req.body;

  const validationResult = checkinSchema.safeParse({ device_type, device_info, checkin_date });
  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    logger.warn(`打卡请求参数验证失败 - 用户: ${req.user!.userId}, 错误: ${errorMessages.join(', ')}`);
    res.status(400).json({ success: false, message: '参数验证失败', errors: errorMessages });
    return;
  }

  const targetDate = checkin_date ? new Date(checkin_date) : new Date();
  const targetDateStr = targetDate.toISOString().split('T')[0];

  if (isMockMode()) {
    const mockCheckins = JSON.parse(mockStorage.get('mock_checkins') || '[]');
    const hasCheckedToday = mockCheckins.some((c: any) => c.checkin_date === targetDateStr);
    
    if (hasCheckedToday) {
      res.json({ success: false, message: '该日期已打卡', already_checked: true });
      return;
    }

    const yesterday = new Date(targetDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayCheckin = mockCheckins.find((c: any) => c.checkin_date === yesterdayStr);
    const streak = yesterdayCheckin ? yesterdayCheckin.streak_count + 1 : 1;
    let points = 10;
    if (streak >= 7) points = 50;
    else if (streak >= 5) points = 30;
    else if (streak >= 3) points = 20;

    const newCheckin = {
      checkin_id: Date.now(),
      checkin_date: targetDateStr,
      checkin_time: new Date().toISOString(),
      streak_count: streak,
      points_earned: points,
      device_type,
      device_info,
      created_at: new Date().toISOString(),
    };

    mockCheckins.unshift(newCheckin);
    mockStorage.set('mock_checkins', JSON.stringify(mockCheckins));

    logger.info(`Mock模式打卡成功 - 用户: ${req.user!.userId}, 日期: ${targetDateStr}, 连续: ${streak}, 积分: ${points}`);

    res.json({ success: true, message: '打卡成功', checkin_id: newCheckin.checkin_id, streak_count: streak, points_earned: points, already_checked: false });
    return;
  }

  try {
    const checkResult = await query(
      'sync',
      'SELECT 1 FROM dbo.user_checkin_sync WHERE [user_id] = @uid AND [checkin_date] = @cd',
      { uid: req.user!.userId, cd: targetDateStr }
    );

    if (Array.isArray(checkResult) && checkResult.length > 0) {
      logger.info(`打卡失败（已打卡） - 用户: ${req.user!.userId}, 日期: ${targetDateStr}`);
      res.json({ success: false, message: '该日期已打卡', already_checked: true });
      return;
    }

    const { streak, points } = await calculateStreakAndPoints(req.user!.userId, targetDateStr);
    const checkinId = Date.now();
    const checkinTime = new Date();

    const result = await execute(
      'sync',
      'EXEC sp_sync_record_checkin @user_id = @uid, @checkin_id = @cid, @checkin_date = @cd, @checkin_time = @ct, @streak_count = @sc, @points_earned = @pe, @device_type = @dt, @device_info = @di',
      {
        uid: req.user!.userId,
        cid: checkinId,
        cd: targetDateStr,
        ct: checkinTime.toISOString(),
        sc: streak,
        pe: points,
        dt: device_type || null,
        di: device_info || null,
      }
    );

    logger.info(`打卡成功 - 用户: ${req.user!.userId}, 日期: ${targetDateStr}, 连续: ${streak}, 积分: ${points}`);

    try {
      pushToUser(req.user!.userId, 'sync:checkin_update', {
        checkin_date: targetDateStr,
        streak_count: streak,
        points_earned: points,
        device_type,
        timestamp: Date.now(),
      });
    } catch (syncErr: any) {
      logger.warn('WebSocket同步推送失败（用户可能未连接）:', syncErr.message);
    }

    res.json({
      success: true,
      message: '打卡成功',
      checkin_id: checkinId,
      streak_count: streak,
      points_earned: points,
      already_checked: false,
    });
  } catch (err: any) {
    logger.error(`打卡数据库操作失败 - 用户: ${req.user!.userId}, 日期: ${targetDateStr}, 错误: ${err.message}`);
    
    const mockCheckins = JSON.parse(mockStorage.get('mock_checkins') || '[]');
    const hasCheckedToday = mockCheckins.some((c: any) => c.checkin_date === targetDateStr);
    
    if (hasCheckedToday) {
      res.json({ success: false, message: '该日期已打卡', already_checked: true });
    } else {
      const yesterday = new Date(targetDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayCheckin = mockCheckins.find((c: any) => c.checkin_date === yesterdayStr);
      const streak = yesterdayCheckin ? yesterdayCheckin.streak_count + 1 : 1;
      let points = 10;
      if (streak >= 7) points = 50;
      else if (streak >= 5) points = 30;
      else if (streak >= 3) points = 20;

      const newCheckin = {
        checkin_id: Date.now(),
        checkin_date: targetDateStr,
        checkin_time: new Date().toISOString(),
        streak_count: streak,
        points_earned: points,
        device_type,
        device_info,
        created_at: new Date().toISOString(),
      };

      mockCheckins.unshift(newCheckin);
      mockStorage.set('mock_checkins', JSON.stringify(mockCheckins));

      logger.info(`降级模式打卡成功 - 用户: ${req.user!.userId}, 日期: ${targetDateStr}, 连续: ${streak}, 积分: ${points}`);

      res.json({
        success: true,
        message: '打卡成功（降级模式）',
        checkin_id: newCheckin.checkin_id,
        streak_count: streak,
        points_earned: points,
        already_checked: false,
      });
    }
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
      'sync',
      'SELECT COUNT(*) AS total FROM dbo.user_checkin_sync WHERE [user_id] = @uid',
      { uid: req.user!.userId }
    );
    const total = countResult.length > 0 ? (countResult[0] as any).total : 0;

    const result = await query(
      'sync',
      'EXEC sp_sync_get_user_checkins @user_id = @uid, @page = @p, @limit = @l',
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
    const result = await query(
      'sync',
      'SELECT COUNT(*) AS total_checkins, MAX([streak_count]) AS max_streak, SUM([points_earned]) AS total_points, MAX([checkin_date]) AS last_checkin_date, SUM(CASE WHEN [checkin_date] >= DATEADD(DAY, -7, GETDATE()) THEN 1 ELSE 0 END) AS weekly_checkins, SUM(CASE WHEN [checkin_date] >= DATEADD(DAY, -30, GETDATE()) THEN 1 ELSE 0 END) AS monthly_checkins FROM dbo.user_checkin_sync WHERE [user_id] = @uid',
      { uid: req.user!.userId }
    );
    const stats = Array.isArray(result) && result.length > 0 ? result[0] : {
      total_checkins: 0,
      max_streak: 0,
      total_points: 0,
      last_checkin_date: null,
      weekly_checkins: 0,
      monthly_checkins: 0,
    };
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
    const today = new Date().toISOString().split('T')[0];
    const result = await query(
      'sync',
      'SELECT 1 FROM dbo.user_checkin_sync WHERE [user_id] = @uid AND [checkin_date] = @cd',
      { uid: req.user!.userId, cd: today }
    );
    const checked = Array.isArray(result) && result.length > 0;
    res.json({ success: true, data: { checked_today: checked } });
  } catch (err: any) {
    console.error('[Checkin] 检查今日打卡失败:', err.message);
    res.json({ success: true, data: { checked_today: false } });
  }
}));

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
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const result = await query(
      'sync',
      'SELECT [checkin_date], [streak_count], [points_earned] FROM dbo.user_checkin_sync WHERE [user_id] = @uid AND [checkin_date] >= @startDate AND [checkin_date] < DATEADD(MONTH, 1, @startDate) ORDER BY [checkin_date]',
      { uid: req.user!.userId, startDate }
    );
    res.json({ success: true, data: Array.isArray(result) ? result : [] });
  } catch (err: any) {
    console.error('[Checkin] 获取日历失败:', err.message);
    res.json({ success: true, data: [] });
  }
}));

export default router;
