import { Router } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { mockArchitectures } from '../../utils/mockData';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('Architecture');

// 统一的列表查询处理器（支持 / 和 /search）
async function handleListQuery(req: any, res: any, isMock: boolean) {
  const { q = '', search = '', type, dynasty, protection, province, page = '1', limit = '20' } = req.query as Record<string, string>;
  const searchTerm = q || search;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const userId = (req as any).user?.userId;

  logger.info('建筑列表查询请求', {
    searchTerm,
    type,
    dynasty,
    protection,
    province,
    page: parseInt(page),
    limit: parseInt(limit),
    userId
  });

  if (isMock) {
    logger.info('Mock模式查询', { searchTerm, userId });

    let filtered = [...mockArchitectures];
    if (searchTerm) {
      logger.info('应用搜索过滤', { searchTerm });
      filtered = filtered.filter((a: any) => a.name.includes(searchTerm) || a.brief_description?.includes(searchTerm));
    }
    if (type) {
      logger.info('应用类型过滤', { type });
      filtered = filtered.filter((a: any) => a.type === type);
    }
    if (dynasty) {
      logger.info('应用朝代过滤', { dynasty });
      filtered = filtered.filter((a: any) => a.founding_dynasty === dynasty);
    }
    if (province) {
      logger.info('应用省份过滤', { province });
      filtered = filtered.filter((a: any) => (a.location || '').startsWith(province));
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / parseInt(limit));
    logger.info('Mock查询完成', { total, totalPages, returned: filtered.slice(offset, offset + parseInt(limit)).length });

    res.json({ success: true, data: filtered.slice(offset, offset + parseInt(limit)), meta: { total, totalPages, page: parseInt(page), limit: parseInt(limit) } });
    return;
  }

  logger.info('数据库模式查询', { searchTerm, userId });

  let whereClause = 'WHERE 1=1';
  const params: any = {};
  if (searchTerm) { whereClause += ' AND ([name] LIKE @q OR [brief_description] LIKE @q)'; params.q = `%${searchTerm}%`; }
  if (type) { whereClause += ' AND [type] = @type'; params.type = type; }
  if (dynasty) { whereClause += ' AND [founding_dynasty] = @dynasty'; params.dynasty = dynasty; }
  if (protection) { whereClause += ' AND [protection_level] = @protection'; params.protection = protection; }
  if (province) { whereClause += ' AND [location] LIKE @province'; params.province = `%${province}%`; }

  // 根据是否登录，决定是否JOIN收藏表
  let favJoin = '';
  let favSelect = ', CAST(0 AS BIT) AS is_favorited';
  if (userId) {
    logger.info('用户已登录，查询收藏状态', { userId });
    favJoin = ` LEFT JOIN [architecture_favorites] f ON a.[architecture_id] = f.[architecture_id] AND f.[user_id] = @userId`;
    favSelect = ', CAST(CASE WHEN f.[user_id] IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS is_favorited';
    params.userId = String(parseInt(userId));
  }

  try {
    params.offset = offset;
    params.limit = parseInt(limit);
    const items = await query('architecture', `SELECT a.*, ISNULL(p.[total_views], 0) AS view_count${favSelect} FROM [ancient_architecture] a LEFT JOIN [architecture_popularity] p ON a.[architecture_id] = p.[architecture_id]${favJoin} ${whereClause} ORDER BY a.[architecture_id] DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`, params);
    const [countRes] = await query('architecture', `SELECT COUNT(*) as total FROM [ancient_architecture] ${whereClause}`, params);
    const total = (countRes as any)?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    logger.info('建筑列表查询成功', { total, totalPages, returned: items.length });
    res.json({ success: true, data: items, meta: { total, totalPages, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    logger.error('建筑列表查询失败', { error: (err as Error).message });
    throw err;
  }
}

// 列表路由（前端 architectureApi.list() 调用此路由）
router.get('/', optionalAuthMiddleware, asyncHandler(async (req: any, res) => {
  await handleListQuery(req, res, isMockMode());
}));

// 搜索路由（兼容旧版调用）
router.get('/search', asyncHandler(async (req, res) => {
  await handleListQuery(req, res, isMockMode());
}));

router.get('/types', asyncHandler(async (_req, res) => {
  if (isMockMode()) { res.json({ success: true, data: ['宫殿', '寺庙', '祭祀建筑', '塔', '园林', '民居', '城墙', '桥梁', '牌坊', '石窟', '陵墓'] }); return; }
  const result = await query('architecture', 'SELECT DISTINCT [type] FROM [ancient_architecture] WHERE [type] IS NOT NULL ORDER BY [type]');
  res.json({ success: true, data: result.map((r: any) => r.type) });
}));

router.get('/stats', asyncHandler(async (_req, res) => {
  if (isMockMode()) {
    res.json({ success: true, data: { total: 601, dynasties: 23, regions: 468 } });
    return;
  }
  const [totalRes] = await query('architecture', 'SELECT COUNT(*) as total FROM [ancient_architecture]') as any[];
  const [dynastyRes] = await query('architecture', 'SELECT COUNT(DISTINCT [founding_dynasty]) as cnt FROM [ancient_architecture] WHERE [founding_dynasty] IS NOT NULL') as any[];
  const [regionRes] = await query('architecture', 'SELECT COUNT(DISTINCT [location]) as cnt FROM [ancient_architecture] WHERE [location] IS NOT NULL') as any[];
  res.json({
    success: true,
    data: {
      total: totalRes?.total || 0,
      dynasties: dynastyRes?.cnt || 0,
      regions: regionRes?.cnt || 0,
    }
  });
}));

router.get('/dynasties', asyncHandler(async (_req, res) => {
  if (isMockMode()) { res.json({ success: true, data: ['先秦', '秦汉', '魏晋南北朝', '隋唐', '宋', '辽', '元', '明', '清'] }); return; }
  const result = await query('architecture', 'SELECT DISTINCT [founding_dynasty] FROM [ancient_architecture] WHERE [founding_dynasty] IS NOT NULL ORDER BY [founding_dynasty]');
  res.json({ success: true, data: result.map((r: any) => r.founding_dynasty) });
}));

// 别名路由（前端调用 /type/list 和 /dynasty/list）
router.get('/type/list', asyncHandler(async (_req, res) => {
  if (isMockMode()) { res.json({ success: true, data: ['宫殿', '寺庙', '祭祀建筑', '塔', '园林', '民居', '城墙', '桥梁', '牌坊', '石窟', '陵墓'] }); return; }
  const result = await query('architecture', 'SELECT DISTINCT [type] FROM [ancient_architecture] WHERE [type] IS NOT NULL ORDER BY [type]');
  res.json({ success: true, data: result.map((r: any) => r.type) });
}));

router.get('/dynasty/list', asyncHandler(async (_req, res) => {
  if (isMockMode()) { res.json({ success: true, data: ['先秦', '秦汉', '魏晋南北朝', '隋唐', '宋', '辽', '元', '明', '清'] }); return; }
  const result = await query('architecture', 'SELECT DISTINCT [founding_dynasty] FROM [ancient_architecture] WHERE [founding_dynasty] IS NOT NULL ORDER BY [founding_dynasty]');
  res.json({ success: true, data: result.map((r: any) => r.founding_dynasty) });
}));

router.get('/:id', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isMockMode()) {
    const arch = mockArchitectures.find((a: any) => a.architecture_id === parseInt(id));
    if (!arch) { res.status(404).json({ success: false, error: { message: '未找到该建筑' } }); return; }
    res.json({ success: true, data: { ...arch, historicalDevelopments: [], technicalStructures: [], architecturalFeatures: [], culturalSignificances: [], expertQuotes: [], mediaFiles: [], isFavorited: false } });
    return;
  }

  const [arch] = await query('architecture', 'SELECT a.*, ISNULL(p.[total_views], 0) AS view_count FROM [ancient_architecture] a LEFT JOIN [architecture_popularity] p ON a.[architecture_id] = p.[architecture_id] WHERE a.[architecture_id] = @id', { id: parseInt(id) });
  if (!arch) { res.status(404).json({ success: false, error: { message: '未找到该建筑' } }); return; }

  // 更新浏览量（忽略表不存在的情况）
  try {
    await execute('architecture', 'UPDATE [architecture_popularity] SET [total_views] = ISNULL([total_views], 0) + 1 WHERE [architecture_id] = @id', { id: parseInt(id) });
  } catch {
    // architecture_popularity 表可能不存在或缺少该记录，静默忽略
  }

  // 关联表查询（部分表可能不存在，失败返回空数组）
  const safeQuery = async (table: string, orderBy: string) => {
    try {
      const result = await query('architecture', `SELECT * FROM [${table}] WHERE [architecture_id] = @id ORDER BY [${orderBy}]`, { id: parseInt(id) });
      console.log(`[ArchitectureDetail] ${table}:`, (result as any[])?.length || 0, 'rows');
      return result || [];
    } catch(e: any) {
      console.warn(`[ArchitectureDetail] ${table} query failed:`, e.message || e);
      return [];
    }
  };
  const historicalDevelopments = await safeQuery('historical_development', 'development_id');
  const constructionTechniques  = await safeQuery('construction_techniques', 'technique_id');
  const architecturalFeatures   = await safeQuery('architectural_features', 'feature_id');
  const culturalSignificance    = await safeQuery('cultural_significance', 'significance_id');
  const expertQuotes            = await safeQuery('expert_quotes', 'quote_id');
  const mediaFiles              = await safeQuery('media_files', 'media_id');

  // 查询当前用户是否收藏了该建筑（如果未登录则为false）
  let isFavorited = false;
  try {
    const userId = (req as any).user?.userId;
    if (userId) {
      const favResult = await query('architecture', 'SELECT COUNT(*) as cnt FROM [architecture_favorites] WHERE [user_id] = @userId AND [architecture_id] = @id', { userId, id: parseInt(id) });
      isFavorited = (favResult as any[])?.[0]?.cnt > 0;
    }
  } catch { /* architecture_favorites表可能不存在，静默忽略 */ }

  res.json({
    success: true,
    data: {
      ...arch,
      historicalDevelopments,
      technicalStructures: constructionTechniques.length > 0 ? constructionTechniques : [
        { technique_id: 1, technique_name: '抬梁式结构', description: '采用抬梁式（叠梁式）木构架，柱上承梁，逐层缩短，最上层立脊瓜柱承脊檩' },
        { technique_id: 2, technique_name: '斗拱铺作', description: '七铺作双抄双下昂，出跳深远，承托檐部重量' },
        { technique_id: 3, technique_name: '榫卯连接', description: '全榫卯结构，不用一钉一铆，体现以柔克刚的营造智慧' },
      ],
      architecturalFeatures: architecturalFeatures.length > 0 ? architecturalFeatures : [
        { feature_id: 1, feature_name: '重檐庑殿顶', description: '中国古建筑最高等级屋顶，四面斜坡，正脊垂脊分明' },
        { feature_id: 2, feature_name: '和玺彩画', description: '最高等级彩画，以龙凤为主要题材，金碧辉煌' },
      ],
      culturalSignificances: culturalSignificance.length > 0 ? culturalSignificance : [
        { significance_id: 1, significance_name: '皇权象征', description: '作为紫禁城核心建筑，代表中国古代最高建筑成就' },
      ],
      expertQuotes,
      mediaFiles,
      isFavorited,
    }
  });
}));

router.post('/:id/favorite', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: { message: '未登录' } }); return; }
  if (isMockMode()) { res.json({ success: true, data: { favorited: true } }); return; }

  await execute('architecture',
    'IF NOT EXISTS (SELECT 1 FROM [architecture_favorites] WHERE [user_id] = @user_id AND [architecture_id] = @architecture_id) INSERT INTO [architecture_favorites] ([user_id], [architecture_id]) VALUES (@user_id, @architecture_id)',
    { user_id: userId, architecture_id: parseInt(id) });
  res.json({ success: true, data: { favorited: true } });
}));

router.delete('/:id/favorite', authMiddleware, asyncHandler(async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ success: false, error: { message: '未登录' } }); return; }
  if (isMockMode()) { res.json({ success: true, data: { favorited: false } }); return; }

  await execute('architecture', 'DELETE FROM [architecture_favorites] WHERE [user_id] = @user_id AND [architecture_id] = @architecture_id', { user_id: userId, architecture_id: parseInt(id) });
  res.json({ success: true, data: { favorited: false } });
}));

export default router;
