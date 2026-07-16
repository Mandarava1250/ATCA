import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { mockArchitectures, mockQuestions, mockCompetitionModes, mockActivities } from '../../utils/mockData';
import { buildSparkAuthUrl, callSparkWebSocket, getSparkEndpoint } from '../../utils/sparkHelper';

const router = Router();
router.use(authMiddleware as any, adminMiddleware as any);

// 批量操作配置
const BATCH_CONFIG = {
  MAX_BATCH_SIZE: 100,      // 最大批量操作数量
  BATCH_TIMEOUT_MS: 60000,   // 批量操作超时时间（毫秒）
  BATCH_DELAY_MS: 10,        // 每个操作之间的延迟（毫秒）
};

// 用户数据缓存（用于提升查询性能）
const userCache = {
  data: [] as any[],
  timestamp: 0,
  ttl: 60000, // 缓存有效期60秒
};

function getUserCacheKey(params: { search?: string; page: number; limit: number }) {
  return `${params.search || ''}_${params.page}_${params.limit}`;
}

const userQueryCache = new Map<string, { data: any[]; meta: any; timestamp: number }>();

function getCachedUserQuery(key: string) {
  const cached = userQueryCache.get(key);
  if (cached && Date.now() - cached.timestamp < userCache.ttl) {
    return cached;
  }
  userQueryCache.delete(key);
  return null;
}

function setCachedUserQuery(key: string, data: any[], meta: any) {
  userQueryCache.set(key, { data, meta, timestamp: Date.now() });
  // 限制缓存数量
  if (userQueryCache.size > 50) {
    const oldestKey = Array.from(userQueryCache.keys()).sort((a, b) => 
      userQueryCache.get(a)!.timestamp - userQueryCache.get(b)!.timestamp
    )[0];
    userQueryCache.delete(oldestKey);
  }
}

// ============ 用户增长趋势 ============
router.get('/user-growth', asyncHandler(async (req: any, res) => {
  const days = parseInt(req.query.days) || 7;
  const safeDays = Math.min(Math.max(days, 1), 90);

  if (isMockMode()) {
    const dates: string[] = [];
    const userCounts: number[] = [];
    const dauCounts: number[] = [];
    const totalUsers = 156;
    for (let i = safeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
      const progress = (safeDays - i) / safeDays;
      userCounts.push(Math.round(totalUsers * (0.3 + progress * 0.7)));
      dauCounts.push(Math.round(totalUsers * (0.15 + progress * 0.4)));
    }
    res.json({ success: true, data: { dates, userCounts, dauCounts } });
    return;
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - safeDays);
    const startStr = startDate.toISOString().split('T')[0];

    const result = await query('user', `
      SELECT CAST([created_at] AS DATE) as date, COUNT(*) as count
      FROM [atca_user]
      WHERE [created_at] >= @startDate
      GROUP BY CAST([created_at] AS DATE)
      ORDER BY date
    `, { startDate: startStr });

    const dates: string[] = [];
    const dailyNew: number[] = [];
    for (let i = safeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
      const dateKey = d.toISOString().split('T')[0];
      const row = (result as any[]).find(r => {
        const rDate = new Date(r.date).toISOString().split('T')[0];
        return rDate === dateKey;
      });
      dailyNew.push(row ? row.count : 0);
    }

    // 获取总用户数，用于对齐累计曲线终点
    const [totalRes] = await query('user', 'SELECT COUNT(*) as cnt FROM [atca_user]');
    const total = (totalRes as any)?.cnt || 0;

    // 累计用户（从 total - sum(dailyNew) 开始累加，保证终点对齐 total）
    const userCounts: number[] = [];
    let cumulative = Math.max(0, total - dailyNew.reduce((a, b) => a + b, 0));
    for (const n of dailyNew) {
      cumulative += n;
      userCounts.push(cumulative);
    }
    // 如果起点为 0 且 total > 0，生成平滑曲线
    if (userCounts[0] === 0 && total > 0) {
      for (let i = 0; i < safeDays; i++) {
        userCounts[i] = Math.round(total * (0.3 + (i / (safeDays - 1 || 1)) * 0.7));
      }
    }
    // 最终对齐
    if (userCounts.length > 0) userCounts[userCounts.length - 1] = total;

    // DAU 模拟（实际项目建议增加 login_log 表做真实统计）
    const dauCounts = userCounts.map(u => Math.round(u * (0.35 + Math.random() * 0.25)));

    res.json({ success: true, data: { dates, userCounts, dauCounts } });
  } catch (err: any) {
    console.error('[Admin UserGrowth] 查询失败:', err.message);
    const dates: string[] = [];
    const userCounts: number[] = [];
    const dauCounts: number[] = [];
    for (let i = safeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
      userCounts.push(Math.round(100 + i * 8));
      dauCounts.push(Math.round(50 + i * 4));
    }
    res.json({ success: true, data: { dates, userCounts, dauCounts } });
  }
}));

// ============ 仪表盘 ============
router.get('/dashboard', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: { totalUsers: 156, totalArchitectures: mockArchitectures.length, totalQuestions: mockQuestions.length, totalModels: 36, totalAI: 3 } });
    return;
  }
  try {
    const [u] = await query('user', 'SELECT COUNT(*) as cnt FROM [atca_user]');
    const [a] = await query('architecture', 'SELECT COUNT(*) as cnt FROM [ancient_architecture]');
    const [q] = await query('competition', 'SELECT COUNT(*) as cnt FROM [question]');
    const [m] = await query('media3d', 'SELECT COUNT(*) as cnt FROM [user_models]');
    const [ai] = await query('user', 'SELECT COUNT(*) as cnt FROM [ai_config]');
    res.json({ success: true, data: { totalUsers: (u as any)?.cnt || 0, totalArchitectures: (a as any)?.cnt || 0, totalQuestions: (q as any)?.cnt || 0, totalModels: (m as any)?.cnt || 0, totalAI: (ai as any)?.cnt || 0 } });
  } catch (err: any) { console.error('[Admin Dashboard] 查询失败:', err.message || err); res.json({ success: true, data: { totalUsers: 0, totalArchitectures: 0, totalQuestions: 0, totalModels: 0, totalAI: 0 } }); }
}));

// ============ 用户管理 ============
router.get('/users', asyncHandler(async (req: any, res) => {
  const { page = '1', limit = '20', search = '' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  if (isMockMode()) {
    const users = [
      { user_id: 1, username: 'admin', nickname: '管理员', email: 'admin@example.com', role: 'admin', is_active: true, created_at: '2024-01-01' },
      { user_id: 2, username: 'user1', nickname: '建筑达人', email: 'user1@example.com', role: 'user', is_active: true, created_at: '2024-01-15' },
    ];
    const filtered = search ? users.filter((u: any) => u.username.includes(search) || u.nickname?.includes(search)) : users;
    res.json({ success: true, data: filtered, meta: { total: filtered.length, page: pageNum, limit: limitNum } });
    return;
  }

  // 尝试从缓存获取
  const cacheKey = getUserCacheKey({ search, page: pageNum, limit: limitNum });
  const cachedResult = getCachedUserQuery(cacheKey);
  if (cachedResult) {
    res.json({ success: true, data: cachedResult.data, meta: cachedResult.meta, cached: true });
    return;
  }

  try {
    let whereClause = 'WHERE 1=1';
    const params: any = {};
    if (search) { 
      whereClause += ' AND ([username] LIKE @search OR [nickname] LIKE @search)'; 
      params.search = `%${search}%`; 
    }

    // 使用参数化查询提升安全性和性能
    const users = await query('user', 
      `SELECT [user_id], [username], [nickname], [email], [role], [is_active], [avatar], [created_at] 
       FROM [atca_user] ${whereClause} 
       ORDER BY [user_id] DESC 
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, 
      { ...params, offset, limit: limitNum });
    
    const [countRes] = await query('user', `SELECT COUNT(*) as total FROM [atca_user] ${whereClause}`, params);
    const total = (countRes as any)?.total || 0;
    const meta = { total, page: pageNum, limit: limitNum };
    
    // 缓存结果
    setCachedUserQuery(cacheKey, users, meta);
    
    res.json({ success: true, data: users, meta, cached: false });
  } catch (err: any) { 
    console.error('[Admin Users] 查询失败:', err.message || err); 
    res.json({ success: true, data: [], meta: { total: 0, page: pageNum, limit: limitNum } }); 
  }
}));

// 管理员禁言/解禁用户
router.put('/users/:id/mute', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const { is_muted, mute_reason } = req.body;
  if (isMockMode()) { res.json({ success: true }); return; }
  try {
    await execute('user', 'UPDATE [atca_user] SET [is_muted] = @muted, [mute_reason] = @reason WHERE [user_id] = @id',
        { id: parseInt(id), muted: is_muted ? 1 : 0, reason: mute_reason || null });
    res.json({ success: true, message: is_muted ? '用户已被禁言' : '用户已解除禁言' });
  } catch (err: any) {
    // 如果列不存在，尝试创建列
    if (err.message?.includes('is_muted') || err.message?.includes('mute_reason') || err.message?.includes('Invalid column')) {
      try {
        await execute('user', 'ALTER TABLE [atca_user] ADD [is_muted] BIT NOT NULL DEFAULT 0');
        await execute('user', 'ALTER TABLE [atca_user] ADD [mute_reason] NVARCHAR(500) NULL');
        await execute('user', 'UPDATE [atca_user] SET [is_muted] = @muted, [mute_reason] = @reason WHERE [user_id] = @id',
            { id: parseInt(id), muted: is_muted ? 1 : 0, reason: mute_reason || null });
        res.json({ success: true, message: is_muted ? '用户已被禁言' : '用户已解除禁言' });
      } catch (e2: any) { res.status(500).json({ success: false, error: { message: '禁言操作失败：' + e2.message } }); }
    } else { res.status(500).json({ success: false, error: { message: err.message } }); }
  }
}));

router.put('/users/:id', validateBody(z.object({ nickname: z.string().optional(), email: z.string().email().optional(), role: z.enum(['user', 'admin', 'moderator']).optional(), is_active: z.boolean().optional() })), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  if (isMockMode()) { res.json({ success: true, data: { user_id: parseInt(id) } }); return; }
  try {
    const fields: string[] = []; const params: any = { id: parseInt(id) };
    const body = req.body;
    if (body.nickname !== undefined) { fields.push('[nickname] = @nickname'); params.nickname = body.nickname; }
    if (body.email !== undefined) { fields.push('[email] = @email'); params.email = body.email; }
    if (body.role !== undefined) { fields.push('[role] = @role'); params.role = body.role; }
    if (body.is_active !== undefined) { fields.push('[is_active] = @is_active'); params.is_active = body.is_active ? 1 : 0; }
    if (fields.length === 0) { res.json({ success: false, error: { message: '没有要更新的字段' } }); return; }
    await execute('user', `UPDATE [atca_user] SET ${fields.join(', ')} WHERE [user_id] = @id`, params);
    // 清除用户缓存
    userQueryCache.clear();
    res.json({ success: true, data: { user_id: parseInt(id) } });
  } catch (e: any) { res.json({ success: false, error: { message: e.message || '更新失败' } }); }
}));

router.delete('/users/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  if (isMockMode()) { res.json({ success: true }); return; }
  try { 
    await execute('user', 'DELETE FROM [atca_user] WHERE [user_id] = @id', { id: parseInt(id) }); 
    // 清除用户缓存
    userQueryCache.clear();
    res.json({ success: true }); 
  }
  catch (e: any) { res.json({ success: false, error: { message: e.message || '删除失败' } }); }
}));

// 创建用户
router.post('/users', validateBody(z.object({ 
  username: z.string().min(3).max(50), 
  password: z.string().min(6).max(100),
  nickname: z.string().max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional()
})), asyncHandler(async (req: any, res) => {
  const { username, password, nickname, email, role = 'user' } = req.body;
  if (isMockMode()) { 
    res.json({ success: true, data: { user_id: 999 } }); 
    return; 
  }
  try {
    // 检查用户名是否已存在
    const [existing] = await query('user', 'SELECT [user_id] FROM [atca_user] WHERE [username] = @username', { username });
    if (existing) {
      res.status(400).json({ success: false, error: { message: '用户名已存在' } });
      return;
    }
    // 检查邮箱是否已存在
    if (email) {
      const [emailExists] = await query('user', 'SELECT [user_id] FROM [atca_user] WHERE [email] = @email', { email });
      if (emailExists) {
        res.status(400).json({ success: false, error: { message: '邮箱已被使用' } });
        return;
      }
    }
    // 创建用户
    const result = await execute('user', 
      'INSERT INTO [atca_user] ([username], [password], [nickname], [email], [role], [is_active]) OUTPUT INSERTED.[user_id] VALUES (@username, @password, @nickname, @email, @role, 1)',
      { username, password, nickname: nickname || null, email: email || null, role }
    );
    const userId = (result as any)?.[0]?.user_id;
    if (userId) {
      // 清除用户缓存
      userQueryCache.clear();
      res.json({ success: true, data: { user_id: userId } });
    } else {
      res.status(500).json({ success: false, error: { message: '创建用户失败' } });
    }
  } catch (e: any) { 
    res.status(500).json({ success: false, error: { message: e.message || '创建用户失败' } }); 
  }
}));

// 中英文建筑名称映射
const ARCH_NAME_MAP: Record<string, string> = {
  'Summer Palace': '颐和园',
  'Forbidden City': '故宫',
  'Yinxu Palace and Ancestral Temple Site': '殷墟宫殿宗庙遗址',
  'Giant Wild Goose Pagoda': '大雁塔',
  'Sakyamuni Pagoda of Fogong Temple': '佛宫寺释迦塔（应县木塔）',
  'Temple of Heaven': '天坛',
  'The Great Wall': '长城',
  'Terracotta Army': '兵马俑',
  'Potala Palace': '布达拉宫',
  'Mogao Caves': '莫高窟',
  'Dujiangyan': '都江堰',
  'Lijiang Ancient Town': '丽江古城',
  'Pingyao Ancient City': '平遥古城',
  'Suzhou Gardens': '苏州园林',
  'Chengde Mountain Resort': '承德避暑山庄',
  'Mausoleum of the First Qin Emperor': '秦始皇陵',
  'Longmen Grottoes': '龙门石窟',
  'Yungang Grottoes': '云冈石窟',
  'Shaolin Monastery': '少林寺',
  'Humble Administrator\'s Garden': '拙政园',
};

function mapArchName(name: string): string {
  return ARCH_NAME_MAP[name] || name;
}

function mapArchNames(items: any[]): any[] {
  return items.map(item => ({ ...item, name: mapArchName(item.name || '') }));
}

// ============ 古建筑管理 ============
router.get('/architectures', asyncHandler(async (req: any, res) => {
  const { page = '1', limit = '20', search = '' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  if (isMockMode()) {
    const filtered = search ? mockArchitectures.filter((a: any) => a.name.includes(search) || a.location?.includes(search)) : mockArchitectures;
    res.json({ success: true, data: filtered, meta: { total: filtered.length, page: parseInt(page), limit: parseInt(limit) } });
    return;
  }

  try {
    let whereClause = 'WHERE 1=1'; const params: any = {};
    if (search) { whereClause += ' AND ([name] LIKE @search OR [location] LIKE @search)'; params.search = `%${search}%`; }
    const arches = await query('architecture', `SELECT [architecture_id], [name], [chinese_name], [type], [founding_dynasty], [completed_dynasty], [location], [coordinates], [protection_level], [brief_description], [full_description], [main_image_url], [created_at] FROM [ancient_architecture] ${whereClause} ORDER BY [architecture_id] DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`, params);
    const mappedArches = mapArchNames(arches as any[]);
    const [countRes] = await query('architecture', `SELECT COUNT(*) as total FROM [ancient_architecture] ${whereClause}`, params);
    res.json({ success: true, data: mappedArches, meta: { total: (countRes as any)?.total || 0, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err: any) { console.error('[Admin Architectures] 查询失败:', err.message || err); res.json({ success: true, data: [], meta: { total: 0 } }); }
}));

router.post('/architectures', validateBody(z.object({ name: z.string().min(1), type: z.string().min(1), founding_dynasty: z.string().optional(), location: z.string().optional(), coordinates: z.string().optional(), protection_level: z.string().optional(), brief_description: z.string().optional(), full_description: z.string().optional(), main_image_url: z.string().optional() })), asyncHandler(async (req: any, res) => {
  if (isMockMode()) { res.json({ success: true, data: { architecture_id: 999, ...req.body } }); return; }
  try {
    const result = await execute('architecture', 'INSERT INTO [ancient_architecture] ([name], [type], [founding_dynasty], [location], [coordinates], [protection_level], [brief_description], [full_description], [main_image_url]) OUTPUT INSERTED.* VALUES (@name, @type, @founding_dynasty, @location, @coordinates, @protection_level, @brief_description, @full_description, @main_image_url)', req.body);
    res.json({ success: true, data: (result.recordset as any[])[0] });
  } catch (e: any) { res.json({ success: false, error: { message: e.message || '添加失败' } }); }
}));

router.put('/architectures/:id', validateBody(z.object({ name: z.string().min(1).optional(), type: z.string().optional(), founding_dynasty: z.string().optional(), location: z.string().optional(), brief_description: z.string().optional(), full_description: z.string().optional(), main_image_url: z.string().optional() })), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  if (isMockMode()) { res.json({ success: true, data: { architecture_id: parseInt(id) } }); return; }
  try { const fields = Object.keys(req.body).map(k => `[${k}] = @${k}`).join(', '); await execute('architecture', `UPDATE [ancient_architecture] SET ${fields} WHERE [architecture_id] = @id`, { ...req.body, id: parseInt(id) }); res.json({ success: true, data: { architecture_id: parseInt(id) } }); }
  catch (e: any) { res.json({ success: false, error: { message: e.message || '更新失败' } }); }
}));

router.delete('/architectures/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  if (isMockMode()) { res.json({ success: true }); return; }
  try { await execute('architecture', 'DELETE FROM [ancient_architecture] WHERE [architecture_id] = @id', { id: parseInt(id) }); res.json({ success: true }); }
  catch (e: any) { res.json({ success: false, error: { message: e.message || '删除失败' } }); }
}));

// ============ 竞赛题目管理 ============
router.get('/questions', asyncHandler(async (req: any, res) => {
  const { page = '1', limit = '20', search = '', difficulty = '' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  if (isMockMode()) {
    let filtered = [...mockQuestions];
    if (search) filtered = filtered.filter((q: any) => q.question_text.includes(search));
    if (difficulty) filtered = filtered.filter((q: any) => q.difficulty === difficulty);
    res.json({ success: true, data: filtered, meta: { total: filtered.length, page: parseInt(page), limit: parseInt(limit) } });
    return;
  }

  try {
    let whereClause = 'WHERE 1=1'; const params: any = {};
    if (search) { whereClause += ' AND [question_text] LIKE @search'; params.search = `%${search}%`; }
    if (difficulty) { whereClause += ' AND [difficulty] = @difficulty'; params.difficulty = difficulty; }
    const questions = await query('competition', `SELECT [question_id], [external_building_id], [question_text], [option_a], [option_b], [option_c], [option_d], [correct_answer], [explanation], [difficulty], [points], [created_at], [category] FROM [question] ${whereClause} ORDER BY [question_id] DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`, params);
    const [countRes] = await query('competition', `SELECT COUNT(*) as total FROM [question] ${whereClause}`, params);
    res.json({ success: true, data: questions, meta: { total: (countRes as any)?.total || 0, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err: any) { console.error('[Admin Questions] 查询失败:', err.message || err); res.json({ success: true, data: [], meta: { total: 0 } }); }
}));

router.post('/questions', validateBody(z.object({ question_text: z.string().min(1), option_a: z.string().min(1), option_b: z.string().min(1), option_c: z.string().optional(), option_d: z.string().optional(), correct_answer: z.string().min(1).max(1), explanation: z.string().optional(), difficulty: z.string().min(1), points: z.number().min(1), building_id: z.number().optional() })), asyncHandler(async (req: any, res) => {
  if (isMockMode()) { res.json({ success: true, data: { question_id: 999, ...req.body } }); return; }
  try { const result = await execute('competition', 'INSERT INTO [question] ([external_building_id], [question_text], [option_a], [option_b], [option_c], [option_d], [correct_answer], [explanation], [difficulty], [points]) OUTPUT INSERTED.* VALUES (@building_id, @question_text, @option_a, @option_b, @option_c, @option_d, @correct_answer, @explanation, @difficulty, @points)', req.body); res.json({ success: true, data: (result.recordset as any[])[0] }); }
  catch (e: any) { res.json({ success: false, error: { message: e.message || '添加失败' } }); }
}));

router.put('/questions/:id', validateBody(z.object({ question_text: z.string().optional(), option_a: z.string().optional(), option_b: z.string().optional(), option_c: z.string().optional(), option_d: z.string().optional(), correct_answer: z.string().optional(), explanation: z.string().optional(), difficulty: z.string().optional(), points: z.number().optional() })), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  if (isMockMode()) { res.json({ success: true, data: { question_id: parseInt(id) } }); return; }
  try { const fields = Object.keys(req.body).map(k => `[${k}] = @${k}`).join(', '); await execute('competition', `UPDATE [question] SET ${fields} WHERE [question_id] = @id`, { ...req.body, id: parseInt(id) }); res.json({ success: true, data: { question_id: parseInt(id) } }); }
  catch (e: any) { res.json({ success: false, error: { message: e.message || '更新失败' } }); }
}));

router.delete('/questions/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  if (isMockMode()) { res.json({ success: true }); return; }
  try { await execute('competition', 'DELETE FROM [question] WHERE [question_id] = @id', { id: parseInt(id) }); res.json({ success: true }); }
  catch (e: any) { res.json({ success: false, error: { message: e.message || '删除失败' } }); }
}));

// ============ AI配置管理 ============
router.get('/ai-configs', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [
        { ai_id: 1, name: '通用AI助手', provider: 'openai', app_id: null, api_key: null, api_secret: null, version: 'gpt-4o', api_endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o', is_active: true, is_default: true, temperature: 0.70, max_tokens: 2048, description: '通用型AI助手' },
        { ai_id: 2, name: '建筑技术专家', provider: 'openai', app_id: null, api_key: null, api_secret: null, version: 'gpt-4o', api_endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o', is_active: true, is_default: false, temperature: 0.50, max_tokens: 2048, description: '专注建筑技术' },
        { ai_id: 3, name: '讯飞星火Lite', provider: 'spark', app_id: null, api_key: null, api_secret: null, version: 'lite', api_endpoint: 'https://spark-api-open.xf-yun.com/v1/chat/completions', model: 'lite', is_active: true, is_default: false, temperature: 0.50, max_tokens: 2048, description: '讯飞星火 - HTTP模式(默认)或WebSocket模式' },
      ] });
    return;
  }
  try {
    const configs = await query('user', 'SELECT [ai_id], [name], [provider], [app_id], [api_key], [api_secret], [version], [api_endpoint], [model], [system_prompt], [description], [is_active], [is_default], [temperature], [max_tokens], [created_at], [updated_at] FROM [ai_config] ORDER BY [ai_id]');
    res.json({ success: true, data: configs });
  } catch (err: any) { console.error('[Admin AIConfigs] 查询失败:', err.message || err); res.json({ success: true, data: [] }); }
}));

const aiSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  provider: z.string().min(1, '提供商不能为空'),
  app_id: z.union([z.string(), z.null()]).optional(),
  api_key: z.union([z.string(), z.null()]).optional(),
  api_secret: z.union([z.string(), z.null()]).optional(),
  version: z.union([z.string(), z.null()]).optional(),
  api_endpoint: z.union([z.string(), z.null()]).optional(),
  model: z.union([z.string(), z.null()]).optional(),
  is_active: z.union([z.boolean(), z.null()]).optional(),
  is_default: z.union([z.boolean(), z.null()]).optional(),
  temperature: z.union([z.number().min(0).max(2), z.null()]).optional(),
  max_tokens: z.union([z.number().min(1), z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  system_prompt: z.union([z.string(), z.null()]).optional(),
  max_concurrent: z.union([z.number().min(1), z.null()]).optional(),
  max_queue_size: z.union([z.number().min(1), z.null()]).optional(),
  queue_timeout: z.union([z.number().min(1), z.null()]).optional(),
});

router.post('/ai-configs', validateBody(aiSchema), asyncHandler(async (req: any, res) => {
  if (isMockMode()) { res.json({ success: true, data: { ai_id: 999, ...req.body } }); return; }
  try {
    const b = req.body;
    const params = {
      name: b.name, provider: b.provider,
      app_id: b.app_id || null, api_key: b.api_key || null, api_secret: b.api_secret || null,
      version: b.model || b.version || null,
      api_endpoint: b.api_endpoint || null, model: b.model || null,
      system_prompt: b.system_prompt || null, description: b.description || null,
      is_active: b.is_active === true || b.is_active === 1 ? 1 : 0,
      is_default: b.is_default === true || b.is_default === 1 ? 1 : 0,
      temperature: Number(b.temperature) || 0.7,
      max_tokens: Number(b.max_tokens) || 2048,
      max_concurrent: Number(b.max_concurrent) || 3,
      max_queue_size: Number(b.max_queue_size) || 20,
      queue_timeout: Number(b.queue_timeout) || 60,
    };
    const result = await execute('user', 'INSERT INTO [ai_config] ([name], [provider], [app_id], [api_key], [api_secret], [version], [api_endpoint], [model], [system_prompt], [description], [is_active], [is_default], [temperature], [max_tokens], [max_concurrent], [max_queue_size], [queue_timeout]) OUTPUT INSERTED.* VALUES (@name, @provider, @app_id, @api_key, @api_secret, @version, @api_endpoint, @model, @system_prompt, @description, @is_active, @is_default, @temperature, @max_tokens, @max_concurrent, @max_queue_size, @queue_timeout)', params);
    res.json({ success: true, data: (result.recordset as any[])[0] });
  } catch (e: any) { console.error('[AI Save Error]', e); res.json({ success: false, error: { message: e.message || '添加失败' } }); }
}));

router.put('/ai-configs/:id', validateBody(aiSchema.partial()), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  if (isMockMode()) { res.json({ success: true, data: { ai_id: parseInt(id) } }); return; }
  try {
    const b = req.body;
    const params: any = { id: parseInt(id) };
    const fields: string[] = [];
    if (b.name !== undefined) { fields.push('[name] = @name'); params.name = b.name; }
    if (b.provider !== undefined) { fields.push('[provider] = @provider'); params.provider = b.provider; }
    if (b.app_id !== undefined) { fields.push('[app_id] = @app_id'); params.app_id = b.app_id || null; }
    if (b.api_key !== undefined) { fields.push('[api_key] = @api_key'); params.api_key = b.api_key || null; }
    if (b.api_secret !== undefined) { fields.push('[api_secret] = @api_secret'); params.api_secret = b.api_secret || null; }
    if (b.model !== undefined || b.version !== undefined) { fields.push('[version] = @version'); params.version = b.model || b.version || null; }
    if (b.api_endpoint !== undefined) { fields.push('[api_endpoint] = @api_endpoint'); params.api_endpoint = b.api_endpoint || null; }
    if (b.model !== undefined) { fields.push('[model] = @model'); params.model = b.model || null; }
    if (b.system_prompt !== undefined) { fields.push('[system_prompt] = @system_prompt'); params.system_prompt = b.system_prompt || null; }
    if (b.description !== undefined) { fields.push('[description] = @description'); params.description = b.description || null; }
    if (b.is_active !== undefined) { fields.push('[is_active] = @is_active'); params.is_active = b.is_active === true || b.is_active === 1 ? 1 : 0; }
    if (b.is_default !== undefined) { fields.push('[is_default] = @is_default'); params.is_default = b.is_default === true || b.is_default === 1 ? 1 : 0; }
    if (b.temperature !== undefined) { fields.push('[temperature] = @temperature'); params.temperature = Number(b.temperature) || 0.7; }
    if (b.max_tokens !== undefined) { fields.push('[max_tokens] = @max_tokens'); params.max_tokens = Number(b.max_tokens) || 2048; }
    if (b.max_concurrent !== undefined) { fields.push('[max_concurrent] = @max_concurrent'); params.max_concurrent = Number(b.max_concurrent) || 3; }
    if (b.max_queue_size !== undefined) { fields.push('[max_queue_size] = @max_queue_size'); params.max_queue_size = Number(b.max_queue_size) || 20; }
    if (b.queue_timeout !== undefined) { fields.push('[queue_timeout] = @queue_timeout'); params.queue_timeout = Number(b.queue_timeout) || 60; }
    if (fields.length === 0) { res.json({ success: true }); return; }
    await execute('user', `UPDATE [ai_config] SET ${fields.join(', ')} WHERE [ai_id] = @id`, params);
    res.json({ success: true, data: { ai_id: parseInt(id) } });
  } catch (e: any) { console.error('[AI Update Error]', e); res.json({ success: false, error: { message: e.message || '更新失败' } }); }
}));

router.delete('/ai-configs/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  if (isMockMode()) { res.json({ success: true }); return; }
  try { await execute('user', 'DELETE FROM [ai_config] WHERE [ai_id] = @id', { id: parseInt(id) }); res.json({ success: true }); }
  catch (e: any) { res.json({ success: false, error: { message: e.message || '删除失败' } }); }
}));

// ============ AI 测试 ============
const testAISchema = z.object({
  id: z.union([z.number(), z.string()]),
  message: z.string().min(1).default('你好，请介绍一下中国传统建筑的特点。'),
});

router.post('/ai-configs/test', validateBody(testAISchema), asyncHandler(async (req: any, res) => {
  const { id, message } = req.body;
  if (isMockMode()) { res.json({ success: true, data: { content: '[Mock] 这是测试回复：中国传统建筑以木结构为主，采用榫卯连接...' } }); return; }

  try {
    // 查询AI配置
    const configs = await query('user', 'SELECT [ai_id],[name],[provider],[app_id],[api_key],[api_secret],[api_endpoint],[model],[version],[temperature],[max_tokens],[system_prompt] FROM [ai_config] WHERE [ai_id] = @id', { id: Number(id) });
    const config = (configs as any[])?.[0];
    if (!config) { res.status(404).json({ success: false, error: { message: '未找到该AI配置' } }); return; }

    const provider = config.provider;
    const systemPrompt = config.system_prompt || '你是一个专业的中国传统建筑助手。';
    let result = '';

    if (provider === 'spark') {
      // 讯飞星火 — 使用WebSocket
      try {
        const modelVer = config.model || config.version || 'v4.0';
        const sparkCfg = getSparkEndpoint(modelVer);
        const apiEndpoint = config.api_endpoint || sparkCfg.endpoint;
        const authUrl = buildSparkAuthUrl(apiEndpoint, config.api_key || '', config.api_secret || '');
        result = await callSparkWebSocket(authUrl, config.app_id || '', sparkCfg.domain, systemPrompt, message, config.temperature || 0.7, config.max_tokens || 2048, modelVer);
      } catch (e: any) { result = '[星火调用失败] ' + (e.message || String(e)); }
    } else if (provider === 'qwan') {
      // 通义千问 — 使用阿里云 DashScope HTTP API（OpenAI兼容格式）
      try {
        const apiKey = config.api_key || '';
        const modelName = config.model || 'qwen-turbo';
        // temperature处理：0和null都不传，避免阿里云400
        const tempRaw = config.temperature != null ? Number(config.temperature) : NaN;
        const temperature = isNaN(tempRaw) || tempRaw === 0 ? 0.7 : Math.min(Math.max(tempRaw, 0.01), 2);
        const maxTRaw = config.max_tokens != null ? Number(config.max_tokens) : NaN;
        const maxTokens = isNaN(maxTRaw) || maxTRaw <= 0 ? 2048 : Math.min(maxTRaw, 8192);

        const requestBody: any = {
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
        };
        if (temperature > 0) requestBody.temperature = temperature;
        if (maxTokens > 0) requestBody.max_tokens = maxTokens;

        const apiResp = await axios.post(
            config.api_endpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
            requestBody,
            {
              headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              timeout: 30000,
            }
        );
        result = apiResp.data?.choices?.[0]?.message?.content || '[千问API返回为空]';
      } catch (e: any) {
        const errCode = e.response?.status;
        const errData = e.response?.data;
        const errMsg = errData?.error?.message || errData?.message || e.message || String(e);
        console.error(`[AI Test Qwan Error ${errCode}] ${errMsg}`, JSON.stringify(errData).slice(0, 300));
        result = '[千问调用失败(' + (errCode || '?') + ')] ' + errMsg;
      }
    } else if (provider === 'deepseek') {
      // DeepSeek
      try {
        const apiKey = config.api_key || '';
        const apiResp = await axios.post(config.api_endpoint || 'https://api.deepseek.com/v1/chat/completions', {
          model: config.model || 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: config.temperature ?? 0.7,
          max_tokens: config.max_tokens ?? 2048,
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        });
        result = apiResp.data?.choices?.[0]?.message?.content || '[DeepSeek API返回为空]';
      } catch (e: any) {
        result = '[DeepSeek调用失败] ' + (e.response?.data?.error?.message || e.message || String(e));
      }
    } else if (provider === 'openai') {
      // OpenAI
      try {
        const apiKey = config.api_key || '';
        const apiResp = await axios.post(config.api_endpoint || 'https://api.openai.com/v1/chat/completions', {
          model: config.model || 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: config.temperature ?? 0.7,
          max_tokens: config.max_tokens ?? 2048,
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          timeout: 30000,
        });
        result = apiResp.data?.choices?.[0]?.message?.content || '[OpenAI API返回为空]';
      } catch (e: any) {
        result = '[OpenAI调用失败] ' + (e.response?.data?.error?.message || e.message || String(e));
      }
    } else {
      result = `[不支持的AI提供商: ${provider}]`;
    }

    res.json({ success: true, data: { content: result } });
  } catch (e: any) {
    console.error('[AI Test Error]', e);
    res.status(500).json({ success: false, error: { message: e.message || '测试失败' } });
  }
}));

// ============ 3D模型管理 ============

/** 确保 user_models 表存在 is_featured 列（失败时静默处理） */
async function ensureUserModelsFeaturedColumn() {
  try {
    await execute('media3d', 'ALTER TABLE dbo.user_models ADD [is_featured] BIT NOT NULL DEFAULT 0');
    console.log('[Admin 3D] 已自动为 user_models 表添加 is_featured 列');
  } catch (e: any) {
    const msg = e.message || '';
    if (msg.includes('already exists') || msg.includes('重复') || msg.includes('COLUMN') || msg.includes('约束') || msg.includes('存在')) {
      // 列已存在，忽略
    } else {
      console.warn('[Admin 3D] 添加 is_featured 列失败:', msg);
    }
  }
}

// 获取所有3D模型（管理员上传 + 用户上传）
router.get('/models', asyncHandler(async (req: any, res) => {
  const { page = '1', limit = '20', search = '', source = '' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  if (isMockMode()) {
    const models = [
      { model_id: 1, model_name: '太和殿示例', source: 'admin', username: 'admin', thumbnail_url: null, is_public: true, is_featured: true, download_count: 45, component_count: 32, created_at: '2024-01-01' },
      { model_id: 2, model_name: '用户民居模型', source: 'user', username: 'user1', thumbnail_url: null, is_public: true, is_featured: false, download_count: 12, component_count: 24, created_at: '2024-01-02' },
    ];
    const filtered = search ? models.filter((m: any) => m.model_name.includes(search)) : models;
    if (source) {
      const f2 = filtered.filter((m: any) => m.source === source);
      res.json({ success: true, data: f2, meta: { total: f2.length, page: parseInt(page), limit: parseInt(limit) } });
    } else {
      res.json({ success: true, data: filtered, meta: { total: filtered.length, page: parseInt(page), limit: parseInt(limit) } });
    }
    return;
  }

  try {
    // 确保 user_models 有 is_featured 列
    await ensureUserModelsFeaturedColumn();

    // 查询管理员上传的（building_templates）- 不携带分页，在内存中合并后分页
    const adminWhere = search ? " AND t.[template_name] LIKE @search" : '';
    const adminModels = await query('media3d',
        `SELECT t.[template_id] AS model_id, t.[template_name] AS model_name, 'admin' AS source, 'admin' AS username, t.[thumbnail_url], CAST(ISNULL(t.[is_featured],0) AS BIT) AS is_featured, CAST(1 AS BIT) AS is_public, 0 AS download_count, t.[created_at] FROM dbo.building_templates t WHERE t.[is_active] = 1${adminWhere}`,
        search ? { search: `%${search}%` } : {}
    );

    // 查询用户上传的（user_models）- 不携带分页，在内存中合并后分页
    const userWhere = search ? " AND m.[model_name] LIKE @search" : '';
    let userModels: any[] = [];
    try {
      userModels = await query('media3d',
          `SELECT m.[model_id], m.[model_name], 'user' AS source, ISNULL(u.[username], '未知用户') AS username, m.[thumbnail_url], ISNULL(m.[is_featured],0) AS is_featured, m.[is_public], m.[download_count], m.[created_at] FROM dbo.user_models m LEFT JOIN ATCA_User.dbo.atca_user u ON m.[user_id] = u.[user_id] WHERE 1=1${userWhere}`,
          search ? { search: `%${search}%` } : {}
      );
    } catch (err: any) {
      if (err.message?.includes('is_featured') || err.message?.includes('Invalid column')) {
        userModels = await query('media3d',
            `SELECT m.[model_id], m.[model_name], 'user' AS source, ISNULL(u.[username], '未知用户') AS username, m.[thumbnail_url], 0 AS is_featured, m.[is_public], m.[download_count], m.[created_at] FROM dbo.user_models m LEFT JOIN ATCA_User.dbo.atca_user u ON m.[user_id] = u.[user_id] WHERE 1=1${userWhere}`,
            search ? { search: `%${search}%` } : {}
        );
      } else {
        console.error('[Admin Models] user_models 查询失败:', err.message);
      }
    }

// 合并、过滤、排序（在内存中完成，避免跨表分页错误）
    let allModels = [
      ...(adminModels as any[]).map(m => ({ ...m, source: m.source || 'admin', source_label: '管理员上传' })),
      ...userModels.map(m => ({ ...m, source: m.source || 'user', source_label: '用户上传' }))
    ];
    if (source === 'admin') allModels = allModels.filter(m => m.source === 'admin');
    if (source === 'user') allModels = allModels.filter(m => m.source === 'user');
    allModels.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 内存中分页
    const total = allModels.length;
    const paged = allModels.slice(offset, offset + parseInt(limit));

    const [countAdmin] = await query('media3d', 'SELECT COUNT(*) as cnt FROM dbo.building_templates WHERE [is_active] = 1');
    const [countUser] = await query('media3d', 'SELECT COUNT(*) as cnt FROM dbo.user_models');
    res.json({
      success: true,
      data: paged,
      meta: {
        total: ((countAdmin as any)?.cnt || 0) + ((countUser as any)?.cnt || 0),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err: any) {
    console.error('[Admin Models] 查询失败:', err.message || err);
    res.json({ success: true, data: [], meta: { total: 0 } });
  }
}));

// 获取精选模型
router.get('/models/featured', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: [{ model_id: 1, model_name: '太和殿模型', thumbnail_url: null, is_featured: true, source: 'admin' }] });
    return;
  }
  try {
    await ensureUserModelsFeaturedColumn();

    // 1. 管理员上传的精选（building_templates）
    let adminFeatured: any[] = [];
    try {
      adminFeatured = await query('media3d',
          `SELECT [template_id] AS model_id, [template_name] AS model_name, [thumbnail_url], [category], [created_at], 0 AS download_count, [is_featured], 'admin' AS source FROM dbo.building_templates WHERE [is_featured] = 1 ORDER BY [created_at] DESC`
      );
    } catch (e) { adminFeatured = []; }

    // 2. 用户模型中被精选的（user_models）
    let userFeatured: any[] = [];
    try {
      userFeatured = await query('media3d',
          `SELECT m.[model_id], m.[model_name], m.[thumbnail_url], m.[created_at], m.[download_count], u.[username] as author, ISNULL(m.[is_featured],0) AS is_featured, 'user' AS source FROM dbo.user_models m LEFT JOIN ATCA_User.dbo.atca_user u ON m.[user_id] = u.[user_id] WHERE m.[is_featured] = 1 ORDER BY m.[created_at] DESC`
      );
    } catch (e) { userFeatured = []; }

    res.json({ success: true, data: [...adminFeatured, ...userFeatured] });
  } catch (err: any) {
    console.error('[Admin Featured] 查询失败:', err.message || err);
    res.json({ success: true, data: [] });
  }
}));

// 切换精选状态（source 可选，后端自动判断）
router.put('/models/:id/featured', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const { is_featured, source } = req.body;
  const modelId = parseInt(id);
  const featuredValue = is_featured ? 1 : 0;

  if (isMockMode()) {
    res.json({ success: true, message: '精选状态已更新（Mock模式）' });
    return;
  }

  // 自动判断来源（优先信任前端传的 source，未传则自动探测）
  let finalSource = source;
  if (!finalSource) {
    const [adminCheck] = await query('media3d', 'SELECT 1 as ok FROM dbo.building_templates WHERE [template_id] = @id', { id: modelId });
    if (adminCheck) {
      finalSource = 'admin';
    } else {
      const [userCheck] = await query('media3d', 'SELECT 1 as ok FROM dbo.user_models WHERE [model_id] = @id', { id: modelId });
      if (userCheck) finalSource = 'user';
    }
  }

  if (!finalSource) {
    res.status(404).json({ success: false, error: { message: '未找到该模型，无法更新精选状态' } });
    return;
  }

  if (finalSource === 'admin') {
    try {
      await execute('media3d',
          'UPDATE dbo.building_templates SET [is_featured] = @is_featured WHERE [template_id] = @id',
          { id: modelId, is_featured: featuredValue }
      );
      res.json({ success: true, message: is_featured ? '已设为精选' : '已取消精选' });
      return;
    } catch (e: any) {
      console.error('[Admin Featured] 更新 building_templates 失败:', e.message);
      res.status(500).json({ success: false, error: { message: e.message || '操作失败' } });
      return;
    }
  }

  if (finalSource === 'user') {
    try {
      await ensureUserModelsFeaturedColumn();
      await execute('media3d',
          'UPDATE dbo.user_models SET [is_featured] = @is_featured WHERE [model_id] = @id',
          { id: modelId, is_featured: featuredValue }
      );
      res.json({ success: true, message: is_featured ? '已设为精选' : '已取消精选' });
      return;
    } catch (e: any) {
      console.error('[Admin Featured] 更新 user_models 失败:', e.message);
      res.status(500).json({ success: false, error: { message: e.message || '操作失败' } });
      return;
    }
  }

  res.status(400).json({ success: false, error: { message: 'source 参数无效，只能为 "admin" 或 "user"' } });
}));

// 删除3D模型（支持 source 参数）
router.delete('/models/:id', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const { source } = req.query as { source?: string };

  if (isMockMode()) {
    res.json({ success: true, message: '模型删除成功（Mock模式）' });
    return;
  }

  const modelId = parseInt(id);

  try {
    if (source === 'admin') {
      await execute('media3d', 'DELETE FROM dbo.building_templates WHERE [template_id] = @id', { id: modelId });
    } else if (source === 'user') {
      await execute('media3d', 'DELETE FROM dbo.user_models WHERE [model_id] = @id', { id: modelId });
    } else {
      // 未指定 source：先尝试 building_templates，再尝试 user_models
      let deleted = false;
      try {
        const result = await execute('media3d', 'DELETE FROM dbo.building_templates WHERE [template_id] = @id', { id: modelId });
        if (result && (result.rowsAffected as any[])?.[0] > 0) deleted = true;
      } catch (e) { /* ignore */ }

      if (!deleted) {
        await execute('media3d', 'DELETE FROM dbo.user_models WHERE [model_id] = @id', { id: modelId });
      }
    }
    res.json({ success: true, message: '模型删除成功' });
  } catch (err: any) {
    console.error('[Admin DeleteModel] 删除失败:', err.message);
    res.status(500).json({ success: false, error: { message: err.message || '删除失败' } });
  }
}));

// ============ AI测试 ============
router.post('/ai-configs/:id/test', asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const testMessage = req.body.message || '你好，请介绍一下中国古代建筑的特点。';

  if (isMockMode()) {
    res.json({ success: true, data: { response: `这是Mock模式下的测试回复。\n\n您发送的测试消息：「${testMessage}」\n\n请在管理后台配置真实的AI API密钥以使用完整功能。` } });
    return;
  }

  try {
    const [config] = await query('user', 'SELECT * FROM [ai_config] WHERE [ai_id] = @id', { id: parseInt(id) });
    if (!config) { res.json({ success: false, error: { message: 'AI配置不存在' } }); return; }

    const ai = config as any;
    const provider = ai.provider || 'custom';
    const model = ai.model || ai.version || 'gpt-4o';
    const systemPrompt = ai.system_prompt || '你是华夏营造的AI助手，精通中国古代建筑文化。';
    const apiUrl = ai.api_endpoint || 'https://api.openai.com/v1/chat/completions';

    // 未配置密钥时返回模拟响应
    let hasKey = false;
    if (provider === 'spark') {
      const sparkEndpoint = ai.api_endpoint || '';
      if (sparkEndpoint.startsWith('https://')) {
        // HTTP模式：只需要APIPassword
        hasKey = !!ai.api_key;
      } else {
        // WebSocket模式：需要AppID + APIKey + APISecret
        hasKey = !!(ai.app_id && ai.api_key && ai.api_secret);
      }
    } else if (provider === 'baidu') {
      hasKey = !!(ai.api_key && ai.api_secret);
    } else {
      hasKey = !!ai.api_key;
    }
    if (!hasKey) {
      res.json({
        success: true,
        data: {
          response: `【${ai.name}】当前未配置API密钥\n\n${systemPrompt}\n\n测试消息：「${testMessage}」\n\n请配置API密钥后重新测试。`,
        },
      });
      return;
    }

    let responseText = '';

    // 讯飞星火（支持 HTTP REST API 和 WebSocket 两种模式）
    if (provider === 'spark') {
      const sparkKey = ai.api_key;
      if (!sparkKey) {
        res.json({ success: false, error: { message: '讯飞星火需要配置 API Key' } });
        return;
      }

      // HTTP REST API 模式（endpoint以https://开头）
      if (apiUrl.startsWith('https://')) {
        console.log(`[Spark HTTP] endpoint=${apiUrl}, model=${model || 'lite'}`);
        try {
          const sparkRes = await axios.post(
              apiUrl,
              { model: model || 'lite', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: testMessage }], temperature: 0.7, max_tokens: 2048 },
              { headers: { Authorization: `Bearer ${sparkKey}`, 'Content-Type': 'application/json' }, timeout: 30000 },
          );
          responseText = sparkRes.data?.choices?.[0]?.message?.content || JSON.stringify(sparkRes.data);
        } catch (err: any) {
          const status = err.response?.status;
          const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
          console.error(`[Spark HTTP] 失败: HTTP ${status} - ${msg}`);
          if (status === 401) {
            throw new Error(`讯飞星火HTTP鉴权失败(401): ${msg}\n\n请确认: 1) API Key填写的是「APIPassword」而非「APIKey」 2) 已开通对应模型权限`);
          }
          throw new Error(`讯飞星火HTTP调用失败: ${msg}`);
        }
      }
      // WebSocket 模式（endpoint以wss://开头）
      else {
        const appId = ai.app_id;
        const sparkSecret = ai.api_secret;
        if (!appId || !sparkSecret) {
          res.json({ success: false, error: { message: 'WebSocket模式需要配置 AppID 和 APISecret。建议切换到HTTP模式：将endpoint改为 https://spark-api-open.xf-yun.com/v1/chat/completions' } });
          return;
        }
        const modelName = model || 'lite';
        const sparkCfg = getSparkEndpoint(modelName);
        const endpoint = apiUrl || sparkCfg.endpoint;
        const domain = sparkCfg.domain;
        console.log(`[Spark WS] endpoint=${endpoint}, domain=${domain}, model=${modelName}`);
        try {
          const authUrl = buildSparkAuthUrl(endpoint, sparkKey, sparkSecret);
          responseText = await callSparkWebSocket(authUrl, appId, domain, systemPrompt, testMessage, 0.7, 2048, modelName);
        } catch (err: any) {
          console.error(`[Spark WS] 失败: ${err.message}`);
          if (err.message?.includes('401') || err.message?.includes('apikey not found')) {
            throw new Error(`${err.message}\n\nWebSocket模式需要使用「APIKey+APISecret+AppID」。\n如果你的应用只显示APIPassword，请将endpoint改为 https://spark-api-open.xf-yun.com/v1/chat/completions 使用HTTP模式。`);
          }
          throw err;
        }
      }
    }
    // 百度千帆特殊处理
    else if (provider === 'baidu') {
      const tokenRes = await axios.post('https://aip.baidubce.com/oauth/2.0/token', null, {
        params: { grant_type: 'client_credentials', client_id: ai.api_key, client_secret: ai.api_secret },
        timeout: 15000,
      });
      const accessToken = tokenRes.data.access_token;
      const bdRes = await axios.post(
          `${apiUrl}?access_token=${accessToken}`,
          { model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: testMessage }], temperature: 0.7, max_tokens: 2048 },
          { headers: { 'Content-Type': 'application/json' }, timeout: 60000 },
      );
      responseText = bdRes.data?.choices?.[0]?.message?.content || bdRes.data?.result || JSON.stringify(bdRes.data);
    }
    // 阿里云DashScope原生格式
    else if (provider === 'aliyun') {
      const aliRes = await axios.post(
          apiUrl,
          { model, input: { messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: testMessage }] }, parameters: { temperature: 0.7, max_tokens: 2048, result_format: 'message' } },
          { headers: { Authorization: `Bearer ${ai.api_key}`, 'Content-Type': 'application/json' }, timeout: 60000 },
      );
      responseText = aliRes.data?.output?.choices?.[0]?.message?.content || aliRes.data?.output?.text || JSON.stringify(aliRes.data);
    }
    // 其余Provider统一使用OpenAI兼容格式
    else {
      const apiRes = await axios.post(
          apiUrl,
          { model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: testMessage }], temperature: 0.7, max_tokens: 2048 },
          { headers: { Authorization: `Bearer ${ai.api_key}`, 'Content-Type': 'application/json' }, timeout: 60000 },
      );
      responseText = apiRes.data?.choices?.[0]?.message?.content || JSON.stringify(apiRes.data);
    }

    res.json({ success: true, data: { response: responseText, provider, model } });
  } catch (e: any) {
    console.error('[Admin AI Test] 测试失败:', e.message);
    res.json({ success: false, error: { message: 'AI测试调用失败: ' + (e.response?.data?.error?.message || e.message) } });
  }
}));

// ============ 每日打卡管理 ============

/** 获取每日打卡列表（支持日期范围查询） */
router.get('/daily-challenges', asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  let sql = 'SELECT [challenge_id], [challenge_date], [title], [description], [difficulty], [points_reward], [question_count], [time_limit], [image_url] FROM [daily_challenge]';
  if (start && end) {
    sql += ' WHERE [challenge_date] BETWEEN @start AND @end ORDER BY [challenge_date]';
    const data = await query('competition', sql, { start, end });
    res.json({ success: true, data });
  } else {
    sql += ' ORDER BY [challenge_date] DESC';
    const data = await query('competition', sql);
    res.json({ success: true, data });
  }
}));

/** 获取单日打卡详情 */
router.get('/daily-challenges/:id', asyncHandler(async (req, res) => {
  const [item] = await query('competition', 'SELECT * FROM [daily_challenge] WHERE [challenge_id] = @id', { id: req.params.id });
  if (!item) { res.status(404).json({ success: false, error: { message: '每日打卡不存在' } }); return; }
  res.json({ success: true, data: item });
}));

/** 单条打卡数据校验 Schema（支持字符串自动转数字） */
const singleDailyChallengeSchema = z.object({
  challenge_date: z.string().min(1, '日期不能为空'),
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  difficulty: z.string().default('困难'),
  points_reward: z.coerce.number().int().min(0).default(100),
  question_count: z.coerce.number().int().min(1).default(5),
  time_limit: z.coerce.number().int().min(0).default(300),
  image_url: z.string().optional(),
});

/** 创建每日打卡（单条） */
router.post('/daily-challenges', validateBody(singleDailyChallengeSchema), asyncHandler(async (req, res) => {
  const item = req.body;
  try {
    const existing = await query('competition', 'SELECT [challenge_id] FROM [daily_challenge] WHERE [challenge_date] = @date', { date: item.challenge_date });
    if (existing && existing.length > 0) {
      await execute('competition',
          'UPDATE [daily_challenge] SET [title]=@title,[description]=@description,[difficulty]=@difficulty,[points_reward]=@points_reward,[question_count]=@question_count,[time_limit]=@time_limit,[image_url]=@image_url WHERE [challenge_date]=@date',
          { date: item.challenge_date, title: item.title, description: item.description || null, difficulty: item.difficulty, points_reward: item.points_reward, question_count: item.question_count, time_limit: item.time_limit, image_url: item.image_url || null }
      );
      res.json({ success: true, message: '每日打卡已更新' });
    } else {
      await execute('competition',
          'INSERT INTO [daily_challenge] ([challenge_date],[title],[description],[difficulty],[points_reward],[question_count],[time_limit],[image_url]) VALUES (@date,@title,@description,@difficulty,@points_reward,@question_count,@time_limit,@image_url)',
          { date: item.challenge_date, title: item.title, description: item.description || null, difficulty: item.difficulty, points_reward: item.points_reward, question_count: item.question_count, time_limit: item.time_limit, image_url: item.image_url || null }
      );
      res.json({ success: true, message: '每日打卡已创建' });
    }
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message || '操作失败' } }); }
}));

/** 更新每日打卡 */
router.put('/daily-challenges/:id', validateBody(singleDailyChallengeSchema.partial()), asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const item = req.body;
  try {
    const fields: string[] = [];
    const params: any = { id: parseInt(id) };
    if (item.challenge_date !== undefined) { fields.push('[challenge_date] = @challenge_date'); params.challenge_date = item.challenge_date; }
    if (item.title !== undefined) { fields.push('[title] = @title'); params.title = item.title; }
    if (item.description !== undefined) { fields.push('[description] = @description'); params.description = item.description || null; }
    if (item.difficulty !== undefined) { fields.push('[difficulty] = @difficulty'); params.difficulty = item.difficulty; }
    if (item.points_reward !== undefined) { fields.push('[points_reward] = @points_reward'); params.points_reward = item.points_reward; }
    if (item.question_count !== undefined) { fields.push('[question_count] = @question_count'); params.question_count = item.question_count; }
    if (item.time_limit !== undefined) { fields.push('[time_limit] = @time_limit'); params.time_limit = item.time_limit; }
    if (item.image_url !== undefined) { fields.push('[image_url] = @image_url'); params.image_url = item.image_url || null; }
    if (fields.length === 0) { res.json({ success: false, error: { message: '没有要更新的字段' } }); return; }
    await execute('competition', `UPDATE [daily_challenge] SET ${fields.join(', ')} WHERE [challenge_id] = @id`, params);
    res.json({ success: true, message: '每日打卡已更新' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message || '更新失败' } }); }
}));

/** 删除每日打卡 */
router.delete('/daily-challenges/:id', asyncHandler(async (req: any, res) => {
  try { await execute('competition', 'DELETE FROM [daily_challenge] WHERE [challenge_id] = @id', { id: req.params.id }); res.json({ success: true, data: { deleted: true } }); }
  catch (err: any) { res.status(500).json({ success: false, error: { message: err.message || '删除失败' } }); }
}));

/** 批量打卡 Schema */
const dailyChallengeSchema = z.object({
  items: z.array(singleDailyChallengeSchema),
});

/** 批量创建/更新每日打卡 */
router.post('/daily-challenges/batch', validateBody(dailyChallengeSchema), asyncHandler(async (req, res) => {
  const items = req.body.items;
  let created = 0;
  for (const item of items) {
    const existing = await query('competition', 'SELECT [challenge_id] FROM [daily_challenge] WHERE [challenge_date] = @date', { date: item.challenge_date });
    if (existing && existing.length > 0) {
      await execute('competition',
          'UPDATE [daily_challenge] SET [title]=@title,[description]=@description,[difficulty]=@difficulty,[points_reward]=@points_reward,[question_count]=@question_count,[time_limit]=@time_limit,[image_url]=@image_url WHERE [challenge_date]=@date',
          { date: item.challenge_date, title: item.title, description: item.description || null, difficulty: item.difficulty, points_reward: item.points_reward, question_count: item.question_count, time_limit: item.time_limit, image_url: item.image_url || null }
      );
    } else {
      await execute('competition',
          'INSERT INTO [daily_challenge] ([challenge_date],[title],[description],[difficulty],[points_reward],[question_count],[time_limit],[image_url]) VALUES (@date,@title,@description,@difficulty,@points_reward,@question_count,@time_limit,@image_url)',
          { date: item.challenge_date, title: item.title, description: item.description || null, difficulty: item.difficulty, points_reward: item.points_reward, question_count: item.question_count, time_limit: item.time_limit, image_url: item.image_url || null }
      );
      created++;
    }
  }
  res.json({ success: true, data: { created, total: items.length } });
}));

/** 批量删除每日打卡 */
router.post('/daily-challenges/batch-delete', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ success: false, error: { message: '缺少id列表' } }); return; }
  
  // 限制批量操作数量
  const safeIds = ids.slice(0, BATCH_CONFIG.MAX_BATCH_SIZE);
  const wasTruncated = ids.length > BATCH_CONFIG.MAX_BATCH_SIZE;
  
  const startTime = Date.now();
  let deleted = 0;
  const errors: { id: number; message: string }[] = [];
  
  for (const id of safeIds) {
    if (Date.now() - startTime > BATCH_CONFIG.BATCH_TIMEOUT_MS) {
      errors.push({ id, message: '操作超时' });
      continue;
    }
    try {
      await execute('competition', 'DELETE FROM [daily_challenge] WHERE [challenge_id] = @id', { id });
      
      deleted++;
    } catch (e: any) {
      errors.push({ id, message: e.message || '删除失败' });
    }
  }
  
  res.json({ 
    success: true, 
    data: { 
      deleted, 
      totalRequested: ids.length,
      truncated: wasTruncated,
      duration: Date.now() - startTime
    },
    errors: errors.length > 0 ? errors : undefined
  });
}));

// ============ 批量操作 ============

/** 批量删除古建筑 */
router.post('/architectures/batch-delete', asyncHandler(async (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ success: false, error: { message: '缺少id列表' } }); return; }
  
  // 限制批量操作数量
  const safeIds = ids.slice(0, BATCH_CONFIG.MAX_BATCH_SIZE);
  const wasTruncated = ids.length > BATCH_CONFIG.MAX_BATCH_SIZE;
  
  const startTime = Date.now();
  let deleted = 0;
  const errors: { id: number; message: string }[] = [];
  
  for (const id of safeIds) {
    if (Date.now() - startTime > BATCH_CONFIG.BATCH_TIMEOUT_MS) {
      errors.push({ id, message: '操作超时' });
      continue;
    }
    try {
      await execute('architecture', 'DELETE FROM [ancient_architecture] WHERE [architecture_id] = @id', { id });
      
      deleted++;
    } catch (e: any) {
      errors.push({ id, message: e.message || '删除失败' });
    }
  }
  
  res.json({ 
    success: true, 
    data: { 
      deleted, 
      totalRequested: ids.length,
      truncated: wasTruncated,
      duration: Date.now() - startTime
    },
    errors: errors.length > 0 ? errors : undefined
  });
}));

/** 批量删除题目 */
router.post('/questions/batch-delete', asyncHandler(async (req, res) => {
  const ids = req.body.ids;
  if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ success: false, error: { message: '缺少id列表' } }); return; }
  
  // 限制批量操作数量
  const safeIds = ids.slice(0, BATCH_CONFIG.MAX_BATCH_SIZE);
  const wasTruncated = ids.length > BATCH_CONFIG.MAX_BATCH_SIZE;
  
  const startTime = Date.now();
  let deleted = 0;
  const errors: { id: number; message: string }[] = [];
  
  for (const id of safeIds) {
    if (Date.now() - startTime > BATCH_CONFIG.BATCH_TIMEOUT_MS) {
      errors.push({ id, message: '操作超时' });
      continue;
    }
    try {
      await execute('competition', 'DELETE FROM [question] WHERE [question_id] = @id', { id });
      
      deleted++;
    } catch (e: any) {
      errors.push({ id, message: e.message || '删除失败' });
    }
  }
  
  res.json({ 
    success: true, 
    data: { 
      deleted, 
      totalRequested: ids.length,
      truncated: wasTruncated,
      duration: Date.now() - startTime
    },
    errors: errors.length > 0 ? errors : undefined
  });
}));

/** 批量删除3D模型（支持 source 参数区分来源） */
router.post('/models/batch-delete', asyncHandler(async (req, res) => {
  const { ids, source } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ success: false, error: { message: '缺少id列表' } }); return; }

  const safeIds = ids.slice(0, BATCH_CONFIG.MAX_BATCH_SIZE);
  const wasTruncated = ids.length > BATCH_CONFIG.MAX_BATCH_SIZE;

  const startTime = Date.now();
  let deleted = 0;
  const errors: { id: number; message: string }[] = [];

  for (const id of safeIds) {
    if (Date.now() - startTime > BATCH_CONFIG.BATCH_TIMEOUT_MS) {
      errors.push({ id, message: '操作超时' });
      continue;
    }
    try {
      if (source === 'admin') {
        await execute('media3d', 'DELETE FROM [building_templates] WHERE [template_id] = @id', { id });
      } else {
        await execute('media3d', 'DELETE FROM [user_models] WHERE [model_id] = @id', { id });
      }
      deleted++;
    } catch (e: any) {
      errors.push({ id, message: e.message || '删除失败' });
    }
  }

  res.json({
    success: true,
    data: {
      deleted,
      totalRequested: ids.length,
      truncated: wasTruncated,
      duration: Date.now() - startTime
    },
    errors: errors.length > 0 ? errors : undefined
  });
}));

router.post('/users/batch-delete', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) { res.status(400).json({ success: false, error: { message: '缺少id列表' } }); return; }
  
  // 限制批量操作数量
  const safeIds = ids.slice(0, BATCH_CONFIG.MAX_BATCH_SIZE);
  const wasTruncated = ids.length > BATCH_CONFIG.MAX_BATCH_SIZE;
  
  if (isMockMode()) {
    // 在mock模式下模拟批量删除
    const deleted = safeIds.length;
    res.json({ success: true, data: { deleted, skipped: 0, totalRequested: ids.length, truncated: wasTruncated } });
    return;
  }
  
  const startTime = Date.now();
  let deleted = 0;
  let skipped = 0;
  const errors: { id: number; message: string }[] = [];
  const results: { id: number; status: 'success' | 'skipped' | 'error'; message?: string }[] = [];
  
  for (const id of safeIds) {
    // 检查超时
    if (Date.now() - startTime > BATCH_CONFIG.BATCH_TIMEOUT_MS) {
      errors.push({ id, message: '操作超时' });
      results.push({ id, status: 'error', message: '操作超时' });
      skipped++;
      continue;
    }
    
    try {
      // 保护管理员账户
      const [user] = await query('user', 'SELECT [role] FROM [atca_user] WHERE [user_id] = @id', { id });
      if (user && (user as any).role === 'admin') {
        skipped++;
        results.push({ id, status: 'skipped', message: '管理员账户不能删除' });
        continue;
      }
      await execute('user', 'DELETE FROM [atca_user] WHERE [user_id] = @id', { id });
      
      deleted++;
      results.push({ id, status: 'success' });
    } catch (e: any) {
      errors.push({ id, message: e.message || '删除失败' });
      results.push({ id, status: 'error', message: e.message || '删除失败' });
    }
  }
  
  // 清除用户缓存
  userQueryCache.clear();
  
  res.json({ 
    success: true, 
    data: { 
      deleted, 
      skipped, 
      totalRequested: ids.length,
      truncated: wasTruncated,
      duration: Date.now() - startTime,
      results: results.slice(0, 20) // 只返回前20个详细结果
    },
    errors: errors.length > 0 ? errors : undefined
  });
}));

// 批量更新用户角色
router.post('/users/batch-update-role', validateBody(z.object({ 
  ids: z.array(z.number()), 
  role: z.enum(['user', 'admin', 'moderator']) 
})), asyncHandler(async (req, res) => {
  const { ids, role } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) { 
    res.status(400).json({ success: false, error: { message: '缺少id列表' } }); 
    return; 
  }
  
  // 限制批量操作数量
  const safeIds = ids.slice(0, BATCH_CONFIG.MAX_BATCH_SIZE);
  const wasTruncated = ids.length > BATCH_CONFIG.MAX_BATCH_SIZE;
  
  if (isMockMode()) {
    // 在mock模式下模拟批量角色更新
    const updated = safeIds.length;
    res.json({ success: true, data: { updated, skipped: 0, role, totalRequested: ids.length, truncated: wasTruncated } });
    return;
  }
  
  const startTime = Date.now();
  let updated = 0;
  let skipped = 0;
  const errors: { id: number; message: string }[] = [];
  const results: { id: number; status: 'success' | 'skipped' | 'error'; message?: string }[] = [];
  
  for (const id of safeIds) {
    // 检查超时
    if (Date.now() - startTime > BATCH_CONFIG.BATCH_TIMEOUT_MS) {
      errors.push({ id, message: '操作超时' });
      results.push({ id, status: 'error', message: '操作超时' });
      skipped++;
      continue;
    }
    
    try {
      // 检查用户是否存在
      const [user] = await query('user', 'SELECT [user_id] FROM [atca_user] WHERE [user_id] = @id', { id });
      if (!user) {
        errors.push({ id, message: '用户不存在' });
        results.push({ id, status: 'skipped', message: '用户不存在' });
        skipped++;
        continue;
      }
      await execute('user', 'UPDATE [atca_user] SET [role] = @role WHERE [user_id] = @id', { id, role });
      
      updated++;
      results.push({ id, status: 'success' });
    } catch (e: any) {
      errors.push({ id, message: e.message || '更新失败' });
      results.push({ id, status: 'error', message: e.message || '更新失败' });
      skipped++;
    }
  }
  
  // 清除用户缓存
  userQueryCache.clear();
  
  res.json({ 
    success: true, 
    data: { 
      updated, 
      skipped, 
      role, 
      totalRequested: ids.length,
      truncated: wasTruncated,
      duration: Date.now() - startTime,
      results: results.slice(0, 20)
    },
    errors: errors.length > 0 ? errors : undefined
  });
}));

// 批量更新用户状态
router.post('/users/batch-update-status', validateBody(z.object({ 
  ids: z.array(z.number()), 
  is_active: z.boolean() 
})), asyncHandler(async (req, res) => {
  const { ids, is_active } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) { 
    res.status(400).json({ success: false, error: { message: '缺少id列表' } }); 
    return; 
  }
  
  // 限制批量操作数量
  const safeIds = ids.slice(0, BATCH_CONFIG.MAX_BATCH_SIZE);
  const wasTruncated = ids.length > BATCH_CONFIG.MAX_BATCH_SIZE;
  
  if (isMockMode()) {
    // 在mock模式下模拟批量状态更新
    const updated = safeIds.length;
    res.json({ success: true, data: { updated, skipped: 0, is_active, totalRequested: ids.length, truncated: wasTruncated } });
    return;
  }
  
  const startTime = Date.now();
  let updated = 0;
  let skipped = 0;
  const errors: { id: number; message: string }[] = [];
  const results: { id: number; status: 'success' | 'skipped' | 'error'; message?: string }[] = [];
  
  for (const id of safeIds) {
    // 检查超时
    if (Date.now() - startTime > BATCH_CONFIG.BATCH_TIMEOUT_MS) {
      errors.push({ id, message: '操作超时' });
      results.push({ id, status: 'error', message: '操作超时' });
      skipped++;
      continue;
    }
    
    try {
      // 检查用户是否存在
      const [user] = await query('user', 'SELECT [user_id] FROM [atca_user] WHERE [user_id] = @id', { id });
      if (!user) {
        errors.push({ id, message: '用户不存在' });
        results.push({ id, status: 'skipped', message: '用户不存在' });
        skipped++;
        continue;
      }
      await execute('user', 'UPDATE [atca_user] SET [is_active] = @is_active WHERE [user_id] = @id', { id, is_active: is_active ? 1 : 0 });
      
      updated++;
      results.push({ id, status: 'success' });
    } catch (e: any) {
      errors.push({ id, message: e.message || '更新失败' });
      results.push({ id, status: 'error', message: e.message || '更新失败' });
      skipped++;
    }
  }
  
  // 清除用户缓存
  userQueryCache.clear();
  
  res.json({ 
    success: true, 
    data: { 
      updated, 
      skipped, 
      is_active, 
      totalRequested: ids.length,
      truncated: wasTruncated,
      duration: Date.now() - startTime,
      results: results.slice(0, 20)
    },
    errors: errors.length > 0 ? errors : undefined
  });
}));

// ============ 活动管理 ============

const activitySchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  activity_type: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  reward_points: z.coerce.number().int().min(0).optional(),
  max_participants: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  banner_url: z.string().optional(),
});

router.get('/activities', asyncHandler(async (req: any, res) => {
  const { page = '1', limit = '20', search = '' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let whereClause = 'WHERE 1=1';
    const params: any = {};
    if (search) { whereClause += ' AND ([title] LIKE @search OR [description] LIKE @search)'; params.search = `%${search}%`; }

    const activities = await query('activity', `SELECT [activity_id],[title],[description],[activity_type],[start_date],[end_date],[reward_points],[max_participants],[current_participants],[is_active],[banner_url],[created_at] FROM [activity] ${whereClause} ORDER BY [created_at] DESC OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY`, params);
    const [countRes] = await query('activity', `SELECT COUNT(*) as total FROM [activity] ${whereClause}`, params);
    res.json({ success: true, data: activities || [], meta: { total: (countRes as any)?.total || 0, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err: any) {
    console.error('[Admin Activities] 查询失败:', err.message || err);
    if (isMockMode()) {
      res.json({ success: true, data: mockActivities, meta: { total: mockActivities.length, page: parseInt(page), limit: parseInt(limit) } });
    } else {
      res.json({ success: true, data: [], meta: { total: 0 } });
    }
  }
}));

router.post('/activities', validateBody(activitySchema), asyncHandler(async (req, res) => {
  const { title, description, activity_type, start_date, end_date, reward_points, max_participants, is_active, banner_url } = req.body;
  if (isMockMode()) { res.json({ success: true, data: { activity_id: Date.now() } }); return; }
  try {
    const result = await execute('activity',
        'INSERT INTO [activity] ([title],[description],[activity_type],[start_date],[end_date],[reward_points],[max_participants],[is_active],[banner_url],[created_at]) OUTPUT INSERTED.activity_id VALUES (@title,@description,@type,@start,@end,@points,@max,@active,@banner,GETDATE())',
        { title, description: description || null, type: activity_type || '线上', start: start_date, end: end_date, points: reward_points || 0, max: max_participants || 0, active: is_active ? 1 : 0, banner: banner_url || null }
    );
    res.json({ success: true, data: { activity_id: (result.recordset?.[0] as any)?.activity_id } });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

router.put('/activities/:id', validateBody(activitySchema.partial()), asyncHandler(async (req: any, res) => {
  const { title, description, activity_type, start_date, end_date, reward_points, max_participants, is_active, banner_url } = req.body;
  if (isMockMode()) { res.json({ success: true }); return; }
  try {
    await execute('activity',
        'UPDATE [activity] SET [title]=@title,[description]=@description,[activity_type]=@type,[start_date]=@start,[end_date]=@end,[reward_points]=@points,[max_participants]=@max,[is_active]=@active,[banner_url]=@banner WHERE [activity_id]=@id',
        { id: req.params.id, title, description: description || null, type: activity_type || '线上', start: start_date, end: end_date, points: reward_points || 0, max: max_participants || 0, active: is_active ? 1 : 0, banner: banner_url || null }
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

router.delete('/activities/:id', asyncHandler(async (req: any, res) => {
  if (isMockMode()) { res.json({ success: true }); return; }
  try { await execute('activity', 'DELETE FROM [activity] WHERE [activity_id] = @id', { id: req.params.id }); res.json({ success: true }); }
  catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));
export default router;