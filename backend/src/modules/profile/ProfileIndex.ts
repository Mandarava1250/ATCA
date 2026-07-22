// ============================================
// 筑见山河 - 个人主页模块 (支持 Mock 降级)
// ============================================

import { Router } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// 获取个人资料
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        userId: req.user!.userId, username: req.user!.username,
        nickname: req.user!.username, email: 'user@example.com',
        avatar: null, points: 580, level: 3, role: 'user',
        bio: '古建筑爱好者', location: '北京',
        interests: ['古建筑', '历史'], socialLinks: {}, visibility: 'public',
        createdAt: '2024-01-01', lastLogin: new Date().toISOString(),
        totalPointsEarned: 580,
      },
    });
    return;
  }
  const [users, settings, points] = await Promise.all([
    query('user', `SELECT [user_id], [username], [nickname], [email], [avatar], [points], [level], [role], [created_at], [last_login] FROM dbo.atca_user WHERE [user_id] = @userId`, { userId: req.user!.userId }),
    query('user', `SELECT * FROM dbo.profile_settings WHERE [user_id] = @userId`, { userId: req.user!.userId }),
    query('user', `SELECT SUM([points_change]) AS total FROM dbo.points_transaction WHERE [user_id] = @userId`, { userId: req.user!.userId }),
  ]);
  if (users.length === 0) { res.status(404).json({ success: false, error: { code: 'USER_001', message: '用户不存在' } }); return; }
  const user = users[0] as any;
  const setting = settings[0] as any || {};
  res.json({ success: true, data: { userId: user.user_id, username: user.username, nickname: user.nickname || user.username, email: user.email, avatar: user.avatar, points: user.points, level: user.level, role: user.role, bio: setting.bio || null, location: setting.location || null, interests: setting.interests ? JSON.parse(setting.interests as string) : [], socialLinks: setting.social_links ? JSON.parse(setting.social_links as string) : {}, visibility: setting.visibility || 'public', createdAt: user.created_at, lastLogin: user.last_login, totalPointsEarned: (points[0] as any)?.total || 0 } });
}));

// 获取收藏列表
router.get('/favorites', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
      { favorite_id: 1, architecture_id: 1, name: '太和殿', chinese_name: '太和殿', type: '宫殿', founding_dynasty: '明', location: '北京', main_image_url: null, favorite_time: '2024-01-01' },
      { favorite_id: 2, architecture_id: 3, name: '佛光寺东大殿', chinese_name: '佛光寺东大殿', type: '寺庙', founding_dynasty: '唐', location: '山西五台', main_image_url: null, favorite_time: '2024-01-02' },
    ]});
    return;
  }
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const favorites = await query('architecture', `SELECT f.*, a.[name], a.[chinese_name], a.[type], a.[founding_dynasty], a.[location], a.[main_image_url] FROM dbo.architecture_favorites f JOIN dbo.ancient_architecture a ON f.[architecture_id] = a.[architecture_id] WHERE f.[user_id] = @userId ORDER BY f.[favorite_time] DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`, { userId: (req as any).user!.userId });
  res.json({ success: true, data: favorites });
}));

// 获取用户模型
router.get('/models', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
      { model_id: 1, model_name: '示例民居', thumbnail_url: null, is_public: true, download_count: 12, created_at: '2024-01-01', updated_at: '2024-01-01' },
    ]});
    return;
  }
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const models = await query('media3d', `SELECT [model_id], [model_name], [thumbnail_url], [is_public], [download_count], [created_at], [updated_at] FROM dbo.user_models WHERE [user_id] = @userId ORDER BY [updated_at] DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`, { userId: (req as any).user!.userId });
  res.json({ success: true, data: models });
}));

// 获取积分记录
router.get('/points', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
      { transaction_id: 1, user_id: req.user!.userId, points_change: 50, transaction_type: 'game_complete', reference_id: null, description: '完成入门模式竞赛', created_at: '2024-01-01' },
      { transaction_id: 2, user_id: req.user!.userId, points_change: 30, transaction_type: 'daily_task', reference_id: null, description: '每日任务奖励', created_at: '2024-01-01' },
    ]});
    return;
  }
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const transactions = await query('user', `SELECT * FROM dbo.points_transaction WHERE [user_id] = @userId ORDER BY [created_at] DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`, { userId: (req as any).user!.userId });
  res.json({ success: true, data: transactions });
}));

// 更新个人设置
router.put('/settings', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { visibility, bio, location, interests, socialLinks, notificationPreferences } = req.body;
  if (isMockMode()) { res.json({ success: true, message: '设置更新成功（Mock）' }); return; }
  await execute('user', `UPDATE dbo.profile_settings SET [visibility] = @visibility, [bio] = @bio, [location] = @location, [interests] = @interests, [social_links] = @socialLinks, [notification_preferences] = @notificationPreferences, [updated_at] = GETDATE() WHERE [user_id] = @userId`, { userId, visibility: visibility || 'public', bio: bio || null, location: location || null, interests: interests ? JSON.stringify(interests) : null, socialLinks: socialLinks ? JSON.stringify(socialLinks) : null, notificationPreferences: notificationPreferences ? JSON.stringify(notificationPreferences) : null });
  res.json({ success: true, message: '设置更新成功' });
}));

export default router;
