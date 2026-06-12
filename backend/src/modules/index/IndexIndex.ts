// ============================================
// 华夏营造 - 首页模块 (支持 Mock 降级)
// ============================================

import { Router } from 'express';
import { query, isMockMode } from '../../config/database';
import { asyncHandler } from '../../middleware/errorHandler';
import { mockArchitectures, mockCompetitionModes, mockActivities, mockQuestions } from '../../utils/mockData';

const router = Router();

// 首页数据聚合
router.get('/dashboard', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        featuredArchitectures: mockArchitectures.slice(0, 6),
        popularArchitectures: mockArchitectures,
        competitionModes: mockCompetitionModes,
        activities: mockActivities,
        dailyChallenge: null,
      },
    });
    return;
  }

  const [featuredArchitectures, popularArchitectures, competitionModes, activities, dailyChallenge] = await Promise.all([
    query('architecture', `SELECT TOP 6 [architecture_id], [name], [chinese_name], [type], [founding_dynasty], [brief_description], [main_image_url] FROM dbo.ancient_architecture ORDER BY [architecture_id]`),
    query('architecture', `SELECT TOP 8 * FROM dbo.vw_popular_architectures ORDER BY popularity_score DESC`),
    query('competition', `SELECT * FROM [competition_mode] WHERE [is_active] = 1 ORDER BY [sort_order]`),
    query('activity', `SELECT TOP 4 [activity_id], [title], [description], [start_date], [end_date], [activity_type], [banner_url], [reward_points], [current_participants] FROM [activity] WHERE [is_active] = 1 AND [end_date] > GETDATE() ORDER BY [start_date] DESC`),
    query('competition', `SELECT TOP 1 * FROM [daily_challenge] WHERE [challenge_date] = CAST(GETDATE() AS DATE)`),
  ]);

  res.json({
    success: true,
    data: { featuredArchitectures, popularArchitectures, competitionModes, activities, dailyChallenge: dailyChallenge[0] || null },
  });
}));

// 统计数据
router.get('/stats', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: { architectureCount: mockArchitectures.length, userCount: 128, modelCount: 36, questionCount: mockQuestions.length } });
    return;
  }
  const [archCount, userCount, modelCount, questionCount] = await Promise.all([
    query('architecture', 'SELECT COUNT(*) AS count FROM dbo.ancient_architecture'),
    query('user', 'SELECT COUNT(*) AS count FROM dbo.atca_user WHERE [is_active] = 1'),
    query('media3d', 'SELECT COUNT(*) AS count FROM dbo.user_models'),
    query('competition', 'SELECT COUNT(*) AS count FROM [question]'),
  ]);
  res.json({ success: true, data: { architectureCount: (archCount[0] as any).count, userCount: (userCount[0] as any).count, modelCount: (modelCount[0] as any).count, questionCount: (questionCount[0] as any).count } });
}));

// 用户排行榜（根据积分排名）
router.get('/leaderboard', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
      { user_id: 1, username: '古建达人', nickname: '古建达人', points: 1200, level: 5, avatar: null },
      { user_id: 2, username: '营造匠', nickname: '营造匠', points: 980, level: 4, avatar: null },
      { user_id: 3, username: '斗拱爱好者', nickname: '斗拱爱好者', points: 850, level: 4, avatar: null },
    ]});
    return;
  }
  try {
    const users = await query('user', `SELECT TOP 10 [user_id], [username], [nickname], [points], [level], [avatar] FROM dbo.atca_user WHERE [is_active] = 1 AND [role] <> 'admin' ORDER BY [points] DESC`);
    res.json({ success: true, data: users || [] });
  } catch (err: any) {
    res.json({ success: true, data: [] });
  }
}));

export default router;
