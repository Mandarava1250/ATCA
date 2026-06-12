import { Router } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { mockCompetitionModes, mockQuestions } from '../../utils/mockData';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('Quiz');

// 获取竞赛模式列表
router.get('/modes', asyncHandler(async (_req, res) => {
  logger.info('获取竞赛模式列表');

  if (isMockMode()) {
    logger.info('Mock模式-返回竞赛模式列表', { count: mockCompetitionModes.length });
    res.json({ success: true, data: mockCompetitionModes }); return;
  }

  const modes = await query('competition', 'SELECT * FROM [competition_mode] ORDER BY [sort_order]');
  logger.info('数据库模式-返回竞赛模式列表', { count: modes.length });
  res.json({ success: true, data: modes });
}));

// 获取题目
router.get('/questions', authMiddleware, asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  const mode = (req.query.mode as string) || 'entry';
  const modeMap: Record<string, string> = { entry: '入门', basic: '基础', challenge: '挑战', advanced: '进阶', expert: '资深' };
  const difficulty = modeMap[mode] || '入门';

  logger.info('获取竞赛题目请求', { userId, mode, difficulty });

  if (isMockMode()) {
    logger.info('Mock模式-获取题目', { difficulty });

    const pool = mockQuestions.filter((q: any) => q.difficulty === difficulty || difficulty === '入门');
    logger.info('题目池大小', { poolSize: pool.length });

    const selected = pool.sort(() => Math.random() - 0.5).slice(0, 5);
    logger.info('已选中题目数量', { selectedCount: selected.length });

    res.json({
      success: true,
      data: {
        sessionId: `mock_${Date.now()}`, mode, timeLimit: 180,
        questions: selected.map((q: any) => ({
          questionId: q.question_id, questionText: q.question_text,
          optionA: q.option_a, optionB: q.option_b, optionC: q.option_c, optionD: q.option_d,
          difficulty: q.difficulty, points: q.points, explanation: q.explanation || '',
        })),
      }
    });
    return;
  }

  logger.info('数据库模式-获取题目', { difficulty });

  const questions = await query('competition', 'SELECT TOP 5 * FROM [question] WHERE [difficulty] = @difficulty ORDER BY NEWID()', { difficulty });
  if (!questions || questions.length === 0) {
    logger.warn('暂无该难度的题目', { difficulty });
    res.json({ success: false, error: { message: '暂无该难度的题目' } }); return;
  }

  logger.info('获取题目成功', { count: questions.length });

  const sessionId = `sess_${Date.now()}`;
  const timeLimits: Record<string, number> = { '入门': 300, '基础': 240, '挑战': 180, '进阶': 150, '资深': 120 };

  logger.info('返回题目给用户', { userId, sessionId, questionCount: questions.length, timeLimit: timeLimits[difficulty] || 180 });

  res.json({
    success: true,
    data: {
      sessionId, mode, timeLimit: timeLimits[difficulty] || 180,
      questions: questions.map((q: any) => ({
        questionId: q.question_id, questionText: q.question_text,
        optionA: q.option_a, optionB: q.option_b, optionC: q.option_c, optionD: q.option_d,
        difficulty: q.difficulty, points: q.points, explanation: q.explanation || '',
      })),
    }
  });
}));

// 提交答案
router.post('/submit', authMiddleware, asyncHandler(async (req: any, res) => {
  const { sessionId, answers } = req.body;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  logger.info('提交竞赛答案', { userId, sessionId, answerCount: answers ? Object.keys(answers).length : 0 });

  if (!userId) {
    logger.warn('提交答案失败-用户未登录');
    res.status(401).json({ success: false, error: { message: '未登录' } }); return;
  }

  if (!answers || typeof answers !== 'object') {
    logger.warn('提交答案失败-答案格式错误', { userId });
    res.json({ success: false, error: { message: '答案格式错误' } }); return;
  }

  const questionIds = Object.keys(answers).map(Number);
  if (questionIds.length === 0) {
    logger.warn('提交答案失败-没有答案', { userId });
    res.json({ success: false, error: { message: '没有答案' } }); return;
  }

  logger.info('开始批改答案', { userId, sessionId, questionCount: questionIds.length });

  if (isMockMode()) {
    logger.info('Mock模式-批改答案');

    const allQuestions = mockQuestions.filter((q: any) => questionIds.includes(q.question_id));
    logger.info('找到题目数量', { found: allQuestions.length });

    let correctCount = 0, totalPoints = 0;
    const details = allQuestions.map((q: any) => {
      const isCorrect = answers[q.question_id] === q.correct_answer;
      if (isCorrect) { correctCount++; totalPoints += q.points; }
      return { questionId: q.question_id, isCorrect, yourAnswer: answers[q.question_id], correctAnswer: q.correct_answer, explanation: q.explanation, questionText: q.question_text, optionA: q.option_a, optionB: q.option_b, optionC: q.option_c, optionD: q.option_d };
    });

    logger.info('答案批改完成', { userId, correctCount, totalPoints, accuracy: Math.round((correctCount / allQuestions.length) * 100) });

    res.json({ success: true, data: { sessionId, totalQuestions: allQuestions.length, correctAnswers: correctCount, accuracy: Math.round((correctCount / allQuestions.length) * 100), earnedPoints: totalPoints, timeSpent: 60, details } });
    return;
  }

  logger.info('数据库模式-批改答案');

  const placeholders = questionIds.map((_: any, i: number) => `@id${i}`).join(',');
  const qParams = questionIds.reduce((acc: any, id: number, i: number) => { acc[`id${i}`] = id; return acc; }, {});
  const questions = await query('competition', `SELECT * FROM [question] WHERE [question_id] IN (${placeholders})`, qParams);

  logger.info('数据库查询题目成功', { found: questions.length });

  let correctCount = 0, totalPoints = 0;
  const details = questions.map((q: any) => {
    const isCorrect = answers[q.question_id] === q.correct_answer;
    if (isCorrect) { correctCount++; totalPoints += q.points; }
    return { questionId: q.question_id, isCorrect, yourAnswer: answers[q.question_id], correctAnswer: q.correct_answer, explanation: q.explanation, questionText: q.question_text, optionA: q.option_a, optionB: q.option_b, optionC: q.option_c, optionD: q.option_d };
  });

  const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  logger.info('答案批改完成', { userId, correctCount, totalPoints, accuracy });

  // 管理员不介入积分体系
  const isAdmin = userRole === 'admin';
  if (!isAdmin) {
    logger.info('记录用户答题历史', { userId });
    try {
      await execute('competition', 'INSERT INTO [user_answer_history] ([external_user_id], [question_id], [selected_answer], [is_correct], [points_earned], [answered_at]) VALUES (@user_id, @question_id, @answer, @is_correct, @points, GETDATE())', { user_id: userId, question_id: sessionId, answer: JSON.stringify(answers), is_correct: correctCount, points: totalPoints });
      logger.info('答题历史记录成功');
    } catch (err) {
      logger.warn('答题历史记录失败', { userId, error: (err as Error).message });
    }
  } else {
    logger.info('管理员跳过积分记录');
  }

  res.json({ success: true, data: { sessionId, totalQuestions: questions.length, correctAnswers: correctCount, accuracy, earnedPoints: totalPoints, timeSpent: 60, details } });
}));

router.get('/leaderboard', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
        { user_id: 1, username: '建筑达人', nickname: '梁思成', total_points: 1250, rank: 1 },
        { user_id: 2, username: 'ancient_fan', nickname: '古建迷', total_points: 980, rank: 2 },
      ] });
    return;
  }
  try {
    const result = await query('competition', 'SELECT TOP 50 [external_user_id] as user_id, SUM([points_earned]) as total_points FROM [user_answer_history] GROUP BY [external_user_id] HAVING SUM([points_earned]) > 0 ORDER BY total_points DESC');
    res.json({ success: true, data: result.map((r: any, i: number) => ({ ...r, rank: i + 1 })) });
  } catch { res.json({ success: true, data: [] }); }
}));

router.get('/stats', authMiddleware, asyncHandler(async (req: any, res) => {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: { message: '未登录' } }); return; }

  if (isMockMode()) {
    res.json({ success: true, data: { total_points: 850, current_level: '营造学徒', games_played: 12, accuracy: 78 } });
    return;
  }

  try {
    // 1. 从用户表获取真实积分和等级
    const [userInfo] = await query('user', 'SELECT [points], [level] FROM dbo.atca_user WHERE [user_id] = @user_id', { user_id: userId });
    const userPoints = (userInfo as any)?.points || 0;
    const userLevel = (userInfo as any)?.level || 1;

    // 2. 计算等级称号
    const levelMap: Record<number, string> = {
      1: '入门新手', 2: '初级学员', 3: '营造学徒', 4: '建筑博士',
      5: '营造宗师', 6: '古建大师', 7: '营造巨匠', 8: '建筑泰斗',
    };
    const levelName = levelMap[userLevel] || '入门新手';

    // 3. 从答题历史获取答题统计（表可能不存在）
    let gamesPlayed = 0, accuracy = 0;
    try {
      const [history] = await query('competition', 'SELECT COUNT(*) as games, AVG(CASE WHEN [is_correct] > 0 THEN 100.0 ELSE 0 END) as accuracy FROM [user_answer_history] WHERE [external_user_id] = @user_id', { user_id: userId });
      gamesPlayed = (history as any)?.games || 0;
      accuracy = Math.round((history as any)?.accuracy || 0);
    } catch { /* user_answer_history表可能不存在，静默忽略 */ }

    res.json({
      success: true,
      data: {
        total_points: userPoints,
        current_level: levelName,
        level: userLevel,
        games_played: gamesPlayed,
        accuracy: accuracy,
      }
    });
  } catch (err: any) {
    console.error('[Quiz Stats] Error:', err.message);
    res.json({ success: true, data: { total_points: 0, current_level: '入门新手', level: 1, games_played: 0, accuracy: 0 } });
  }
}));

export default router;