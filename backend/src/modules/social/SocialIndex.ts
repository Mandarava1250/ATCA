/**
 * 社区活动模块 — 包含建筑分享、论坛、评论、社交互动
 * 自动创建所需数据表（如果不存在）
 */
import { Router, Response, Request, NextFunction } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware, optionalAuthMiddleware, checkMuteMiddleware } from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { z } from 'zod';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('Social');

// 异步路由包装器（Express 4 兼容）
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== 自动建表 & 初始化 ====================

let tablesInitialized = false;

async function initTables(): Promise<void> {
  if (tablesInitialized || isMockMode()) return;
  try {
    // 1. building_shares 建筑分享表
    await execute('social', `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'building_shares')
      CREATE TABLE dbo.building_shares (
        [share_id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NULL,
        [username] NVARCHAR(100) NULL,
        [model_id] INT NULL,
        [title] NVARCHAR(200) NOT NULL,
        [description] NVARCHAR(1000) NULL,
        [model_data] NVARCHAR(MAX) NULL,
        [thumbnail_url] NVARCHAR(500) NULL,
        [era] NVARCHAR(50) NULL,
        [building_type] NVARCHAR(100) NULL,
        [tags] NVARCHAR(500) NULL,
        [likes] INT NOT NULL DEFAULT 0,
        [views] INT NOT NULL DEFAULT 0,
        [downloads] INT NOT NULL DEFAULT 0,
        [is_featured] BIT NOT NULL DEFAULT 0,
        [status] NVARCHAR(20) NOT NULL DEFAULT 'approved',
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NULL
      )`);

    // 2. forum_boards 论坛板块表
    await execute('social', `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'forum_boards')
      CREATE TABLE dbo.forum_boards (
        [board_id] INT IDENTITY(1,1) PRIMARY KEY,
        [board_name] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(500) NULL,
        [icon] NVARCHAR(50) NULL,
        [topic_count] INT NOT NULL DEFAULT 0,
        [post_count] INT NOT NULL DEFAULT 0,
        [sort_order] INT NOT NULL DEFAULT 0,
        [is_active] BIT NOT NULL DEFAULT 1,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE()
      )`);

    // 3. forum_topics 论坛主题表
    await execute('social', `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'forum_topics')
      CREATE TABLE dbo.forum_topics (
        [topic_id] INT IDENTITY(1,1) PRIMARY KEY,
        [board_id] INT NOT NULL,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(100) NULL,
        [title] NVARCHAR(200) NOT NULL,
        [content] NVARCHAR(MAX) NULL,
        [reply_count] INT NOT NULL DEFAULT 0,
        [view_count] INT NOT NULL DEFAULT 0,
        [is_pinned] BIT NOT NULL DEFAULT 0,
        [is_locked] BIT NOT NULL DEFAULT 0,
        [status] NVARCHAR(20) NOT NULL DEFAULT 'approved',
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NULL,
        [last_reply_at] DATETIME2 NULL,
        [last_reply_user] NVARCHAR(100) NULL
      )`);

    // 4. forum_replies 论坛回复表
    await execute('social', `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'forum_replies')
      CREATE TABLE dbo.forum_replies (
        [reply_id] INT IDENTITY(1,1) PRIMARY KEY,
        [topic_id] INT NOT NULL,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(100) NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [floor_number] INT NOT NULL DEFAULT 1,
        [is_pinned] BIT NOT NULL DEFAULT 0,
        [status] NVARCHAR(20) NOT NULL DEFAULT 'approved',
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE()
      )`);

    // 5. comments 评论表
    await execute('social', `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'comments')
      CREATE TABLE dbo.comments (
        [comment_id] INT IDENTITY(1,1) PRIMARY KEY,
        [target_type] NVARCHAR(50) NOT NULL DEFAULT 'social',
        [target_id] INT NOT NULL,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(100) NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [parent_id] INT NULL,
        [likes] INT NOT NULL DEFAULT 0,
        [is_deleted] BIT NOT NULL DEFAULT 0,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NULL
      )`);

    // 6. likes 点赞记录表
    await execute('social', `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'likes')
      CREATE TABLE dbo.likes (
        [like_id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [target_type] NVARCHAR(20) NOT NULL,
        [target_id] INT NOT NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_likes UNIQUE ([user_id], [target_type], [target_id])
      )`);

    // 7. shares 社交分享记录表
    await execute('social', `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'shares')
      CREATE TABLE dbo.shares (
        [share_id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(100) NULL,
        [target_type] NVARCHAR(20) NOT NULL,
        [target_id] INT NOT NULL,
        [target_title] NVARCHAR(200) NOT NULL,
        [share_url] NVARCHAR(500) NULL,
        [share_message] NVARCHAR(500) NULL,
        [platform] NVARCHAR(20) NULL,
        [view_count] INT NOT NULL DEFAULT 0,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE()
      )`);

    // 8. notes 笔记表
    await execute('social', `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notes')
      CREATE TABLE dbo.notes (
        [note_id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(100) NULL,
        [title] NVARCHAR(200) NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [tags] NVARCHAR(500) NULL,
        [is_public] BIT NOT NULL DEFAULT 0,
        [related_building_id] INT NULL,
        [related_building_name] NVARCHAR(200) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [updated_at] DATETIME2 NULL
      )`);

    tablesInitialized = true;
    console.log('[Social] 所有社区数据表已初始化');
  } catch (err: any) {
    console.warn('[Social] 建表初始化失败:', err.message);
  }
}

async function initBoards(): Promise<void> {
  if (isMockMode()) return;
  try {
    const boards = await query('social', 'SELECT COUNT(*) as cnt FROM dbo.forum_boards');
    if ((boards[0] as any).cnt === 0) {
      await execute('social', `INSERT INTO dbo.forum_boards ([board_name],[description],[icon],[sort_order]) VALUES
        (N'综合讨论',N'古建筑相关综合话题',N'chat',1),
        (N'营造技艺',N'木结构、斗拱、榫卯等技术讨论',N'tools',2),
        (N'历史人文',N'古建筑背后的历史故事',N'book',3),
        (N'保护修缮',N'古建筑保护与修缮经验',N'shield',4),
        (N'作品分享',N'3D建模、摄影、绘画作品',N'image',5)`);
      console.log('[Social] 论坛板块已初始化');
    }
  } catch (err: any) {
    console.warn('[Social] 板块初始化失败:', err.message);
  }
}

// 每个请求前确保表已创建
router.use(asyncHandler(async (_req: Request, _res: Response, next: NextFunction) => {
  await initTables();
  await initBoards();
  next();
}));

// ==================== 建筑分享 ====================

router.get('/building-shares', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { search, era, building_type, featured, page = '1', limit = '20' } = req.query;
  try {
    let sql = `SELECT [share_id],[user_id],[username],[model_id],[title],[description],[thumbnail_url],[era],[building_type],[tags],[likes],[views],[is_featured],[status],[created_at],[updated_at] FROM dbo.building_shares WHERE [status] = 'approved'`;
    const params: any = {};
    if (search) { sql += ` AND ([title] LIKE @s OR [description] LIKE @s OR [tags] LIKE @s)`; params.s = `%${search}%`; }
    if (era) { sql += ` AND [era] = @e`; params.e = era; }
    if (building_type) { sql += ` AND [building_type] = @bt`; params.bt = building_type; }
    if (featured === '1') { sql += ` AND [is_featured] = 1`; }
    sql += ` ORDER BY [created_at] DESC OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`;
    params.off = (parseInt(page as string) - 1) * parseInt(limit as string);
    params.lim = parseInt(limit as string);
    const data = await query('social', sql, params);
    res.json({ success: true, data: data || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
}));

router.get('/building-shares/:id', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [share] = await query('social', 'SELECT * FROM dbo.building_shares WHERE [share_id] = @id', { id: parseInt(id) });
    if (!share) { res.status(404).json({ success: false, error: { message: '分享不存在' } }); return; }
    await execute('social', 'UPDATE dbo.building_shares SET [views] = [views] + 1 WHERE [share_id] = @id', { id: parseInt(id) });
    res.json({ success: true, data: share });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

router.post('/building-shares', authMiddleware, checkMuteMiddleware, validateBody(z.object({ title: z.string().min(1), description: z.string().optional(), model_data: z.string().optional(), thumbnail_url: z.string().optional(), era: z.string().optional(), building_type: z.string().optional(), tags: z.string().optional(), model_id: z.number().optional() })), asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const username = req.user?.username || '用户';
  const { title, description, model_data, thumbnail_url, era, building_type, tags, model_id } = req.body;
  try {
    const result = await execute('social', `INSERT INTO dbo.building_shares ([user_id],[username],[model_id],[title],[description],[model_data],[thumbnail_url],[era],[building_type],[tags],[created_at]) OUTPUT INSERTED.share_id VALUES (@uid,@uname,@mid,@title,@desc,@md,@thumb,@era,@bt,@tags,GETDATE())`, { uid: userId, uname: username, mid: model_id || null, title, desc: description || null, md: model_data || null, thumb: thumbnail_url || null, era: era || null, bt: building_type || null, tags: tags || null });
    const shareId = (result.recordset[0] as any).share_id;
    res.status(201).json({ success: true, data: { share_id: shareId }, message: '分享发布成功' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

router.put('/building-shares/:id', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { title, description, is_featured, thumbnail_url, era, building_type } = req.body;
  const fields: string[] = [];
  const params: any = { id: parseInt(id) };
  if (title !== undefined) { fields.push('[title] = @title'); params.title = title; }
  if (description !== undefined) { fields.push('[description] = @desc'); params.desc = description; }
  if (is_featured !== undefined) { fields.push('[is_featured] = @feat'); params.feat = is_featured ? 1 : 0; }
  if (thumbnail_url !== undefined) { fields.push('[thumbnail_url] = @thumb'); params.thumb = thumbnail_url; }
  if (era !== undefined) { fields.push('[era] = @era'); params.era = era; }
  if (building_type !== undefined) { fields.push('[building_type] = @bt'); params.bt = building_type; }
  if (fields.length === 0) { res.json({ success: true }); return; }
  fields.push('[updated_at] = GETDATE()');
  try {
    await execute('social', `UPDATE dbo.building_shares SET ${fields.join(', ')} WHERE [share_id] = @id`, params);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

router.delete('/building-shares/:id', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
  try {
    if (isAdmin) { await execute('social', 'DELETE FROM dbo.building_shares WHERE [share_id] = @id', { id: parseInt(id) }); }
    else { await execute('social', 'DELETE FROM dbo.building_shares WHERE [share_id] = @id AND [user_id] = @uid', { id: parseInt(id), uid: req.user.userId }); }
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

// ==================== 社交分享记录（ShareButton 用）====================

router.post('/shares', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const username = req.user?.username || '用户';
  const { target_type, target_id, target_title, platform, share_url, share_message } = req.body;
  try {
    await execute('social', `INSERT INTO dbo.shares ([user_id],[username],[target_type],[target_id],[target_title],[platform],[share_url],[share_message],[created_at]) VALUES (@uid,@uname,@tt,@tid,@ttitle,@plat,@url,@msg,GETDATE())`, { uid: userId, uname: username, tt: target_type, tid: target_id, ttitle: target_title, plat: platform || null, url: share_url || null, msg: share_message || null });
    res.status(201).json({ success: true, message: '分享记录成功' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

// ==================== 论坛 ====================

router.get('/forum/boards', optionalAuthMiddleware, asyncHandler(async (_req: Request, res: Response) => {
  logger.info('获取论坛板块列表');

  try {
    const data = await query('social', 'SELECT [board_id],[board_name],[description],[icon],[topic_count],[sort_order],[is_active] FROM dbo.forum_boards WHERE [is_active] = 1 ORDER BY [sort_order]');
    logger.info('论坛板块查询成功', { count: data?.length || 0 });
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    logger.error('论坛板块查询失败', { error: err.message });
    res.json({ success: true, data: [] });
  }
}));

router.get('/forum/topics', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { board_id, page = '1', limit = '20' } = req.query;
  const userId = (req as any).user?.userId;

  logger.info('获取论坛主题列表', { board_id, page, limit, userId });

  try {
    let sql = `SELECT [topic_id],[board_id],[user_id],[username],[title],[content],[reply_count],[view_count],[is_pinned],[status],[created_at],[updated_at],[last_reply_at],[last_reply_user] FROM dbo.forum_topics WHERE [status] = 'approved'`;
    const params: any = {};
    if (board_id) { sql += ` AND [board_id] = @bid`; params.bid = parseInt(board_id as string); }
    sql += ` ORDER BY [is_pinned] DESC, [last_reply_at] DESC OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`;
    params.off = (parseInt(page as string) - 1) * parseInt(limit as string);
    params.lim = parseInt(limit as string);
    const data = await query('social', sql, params);
    logger.info('论坛主题查询成功', { count: data?.length || 0 });
    res.json({ success: true, data: data || [] });
  } catch (err: any) {
    logger.error('论坛主题查询失败', { error: err.message });
    res.json({ success: true, data: [] });
  }
}));

router.get('/forum/topics/:id', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.userId;

  logger.info('获取论坛主题详情', { topicId: id, userId });

  try {
    const [topic] = await query('social', `SELECT * FROM dbo.forum_topics WHERE [topic_id] = @id AND [status] = 'approved'`, { id: parseInt(id) });
    if (!topic) {
      logger.warn('主题不存在', { topicId: id });
      res.status(404).json({ success: false, error: { message: '主题不存在' } }); return;
    }

    logger.info('主题存在，增加浏览量', { topicId: id });
    await execute('social', 'UPDATE dbo.forum_topics SET [view_count] = [view_count] + 1 WHERE [topic_id] = @id', { id: parseInt(id) });

    const replies = await query('social', `SELECT * FROM dbo.forum_replies WHERE [topic_id] = @id AND [status] = 'approved' ORDER BY [floor_number]`, { id: parseInt(id) });
    logger.info('获取主题详情成功', { topicId: id, replyCount: replies?.length || 0 });

    res.json({ success: true, data: { topic, replies: replies || [] } });
  } catch (err: any) {
    logger.error('获取主题详情失败', { topicId: id, error: err.message });
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}));

router.post('/forum/topics', authMiddleware, checkMuteMiddleware, validateBody(z.object({ board_id: z.number().int().positive(), title: z.string().min(1).max(200), content: z.string().min(1) })), asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const username = req.user?.username || '用户';
  const { board_id, title, content } = req.body;

  logger.info('发表论坛主题', { userId, board_id, titleLength: title.length, contentLength: content.length });

  try {
    const result = await execute('social', `INSERT INTO dbo.forum_topics ([board_id],[user_id],[username],[title],[content],[created_at],[last_reply_at]) OUTPUT INSERTED.topic_id VALUES (@bid,@uid,@uname,@title,@content,GETDATE(),GETDATE())`, { bid: board_id, uid: userId, uname: username, title, content });
    const topicId = (result.recordset[0] as any).topic_id;

    logger.info('主题已创建，更新板块统计', { topicId, board_id });
    await execute('social', 'UPDATE dbo.forum_boards SET [topic_count] = [topic_count] + 1 WHERE [board_id] = @bid', { bid: board_id });

    logger.info('论坛主题发表成功', { topicId, userId, board_id });
    res.status(201).json({ success: true, data: { topic_id: topicId }, message: '主题发表成功' });
  } catch (err: any) {
    logger.error('论坛主题发表失败', { userId, error: err.message });
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}));

router.post('/forum/replies', authMiddleware, checkMuteMiddleware, validateBody(z.object({ topic_id: z.number().int().positive(), content: z.string().min(1) })), asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const username = req.user?.username || '用户';
  const { topic_id, content } = req.body;

  logger.info('发表论坛回复', { userId, topic_id, contentLength: content.length });

  try {
    const [cnt] = await query('social', 'SELECT COUNT(*) as c FROM dbo.forum_replies WHERE [topic_id] = @tid', { tid: topic_id });
    const floor = (cnt as any).c + 1;

    logger.info('计算回复楼层', { topic_id, floor });

    const result = await execute('social', `INSERT INTO dbo.forum_replies ([topic_id],[user_id],[username],[content],[floor_number]) OUTPUT INSERTED.reply_id VALUES (@tid,@uid,@uname,@content,@floor)`, { tid: topic_id, uid: userId, uname: username, content, floor });
    const replyId = (result.recordset[0] as any).reply_id;

    logger.info('回复已创建，更新主题统计', { replyId, topic_id });
    await execute('social', 'UPDATE dbo.forum_topics SET [reply_count] = [reply_count] + 1, [last_reply_at] = GETDATE() WHERE [topic_id] = @tid', { tid: topic_id });

    logger.info('论坛回复发表成功', { replyId, userId, topic_id, floor });
    res.status(201).json({ success: true, data: { reply_id: replyId }, message: '回复发表成功' });
  } catch (err: any) {
    logger.error('论坛回复发表失败', { userId, topic_id, error: err.message });
    res.status(500).json({ success: false, error: { message: err.message } });
  }
}));

// ==================== 评论 ====================

router.get('/comments', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { target_type = 'social', target_id, page = '1', limit = '50' } = req.query;
  try {
    const data = await query('social', `SELECT [comment_id],[target_type],[target_id],[user_id],[username],[content],[parent_id],[likes],[is_deleted],[created_at],[updated_at] FROM dbo.comments WHERE [target_type] = @tt AND [target_id] = @tid AND [is_deleted] = 0 ORDER BY [created_at] DESC OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`, { tt: target_type, tid: parseInt(target_id as string), off: (parseInt(page as string) - 1) * parseInt(limit as string), lim: parseInt(limit as string) });
    res.json({ success: true, data: data || [] });
  } catch { res.json({ success: true, data: [] }); }
}));

router.post('/comments', authMiddleware, checkMuteMiddleware, validateBody(z.object({ target_type: z.string().optional(), target_id: z.number().int().positive(), content: z.string().min(1), parent_id: z.number().int().optional() })), asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const username = req.user?.username || '用户';
  const { target_type = 'social', target_id, content, parent_id } = req.body;
  try {
    await execute('social', 'INSERT INTO dbo.comments ([target_type],[target_id],[user_id],[username],[content],[parent_id],[created_at]) VALUES (@tt,@tid,@uid,@uname,@content,@pid,GETDATE())', { tt: target_type, tid: target_id, uid: userId, uname: username, content, pid: parent_id || null });
    res.status(201).json({ success: true, message: '评论发表成功' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

router.delete('/comments/:id', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await execute('social', 'UPDATE dbo.comments SET [is_deleted] = 1 WHERE [comment_id] = @id AND [user_id] = @uid', { id: parseInt(id), uid: req.user.userId });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

// ==================== 点赞 ====================

router.post('/likes', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const { target_type, target_id } = req.body;
  try {
    const [existing] = await query('social', 'SELECT * FROM dbo.likes WHERE [user_id] = @uid AND [target_type] = @tt AND [target_id] = @tid', { uid: userId, tt: target_type, tid: target_id });
    if (existing) {
      await execute('social', 'DELETE FROM dbo.likes WHERE [user_id] = @uid AND [target_type] = @tt AND [target_id] = @tid', { uid: userId, tt: target_type, tid: target_id });
      if (target_type === 'share' || target_type === 'building_share') {
        await execute('social', 'UPDATE dbo.building_shares SET [likes] = CASE WHEN [likes] > 0 THEN [likes] - 1 ELSE 0 END WHERE [share_id] = @tid', { tid: target_id });
      } else if (target_type === 'comment') {
        await execute('social', 'UPDATE dbo.comments SET [likes] = CASE WHEN [likes] > 0 THEN [likes] - 1 ELSE 0 END WHERE [comment_id] = @tid', { tid: target_id });
      }
      res.json({ success: true, data: { liked: false } });
    } else {
      await execute('social', 'INSERT INTO dbo.likes ([user_id],[target_type],[target_id],[created_at]) VALUES (@uid,@tt,@tid,GETDATE())', { uid: userId, tt: target_type, tid: target_id });
      if (target_type === 'share' || target_type === 'building_share') {
        await execute('social', 'UPDATE dbo.building_shares SET [likes] = [likes] + 1 WHERE [share_id] = @tid', { tid: target_id });
      } else if (target_type === 'comment') {
        await execute('social', 'UPDATE dbo.comments SET [likes] = [likes] + 1 WHERE [comment_id] = @tid', { tid: target_id });
      }
      res.json({ success: true, data: { liked: true } });
    }
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

// ==================== 我的内容 ====================

router.get('/my-content', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  try {
    const topics = await query('social', `SELECT [topic_id],[title],[content],[reply_count],[view_count],[created_at],'topic' as content_type FROM dbo.forum_topics WHERE [user_id] = @uid AND [status] = 'approved' ORDER BY [created_at] DESC`, { uid: userId });
    const replies = await query('social', `SELECT r.[reply_id],r.[content],r.[floor_number],r.[created_at],r.[topic_id],t.[title] as target_title,'reply' as content_type FROM dbo.forum_replies r LEFT JOIN dbo.forum_topics t ON r.topic_id = t.topic_id WHERE r.[user_id] = @uid AND r.[status] = 'approved' ORDER BY r.[created_at] DESC`, { uid: userId });
    res.json({ success: true, data: { topics: topics || [], replies: replies || [] } });
  } catch { res.json({ success: true, data: { topics: [], replies: [] } }); }
}));

// 兼容旧版 my-comments 接口
router.get('/my-comments', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const { page = '1', limit = '20' } = req.query;
  try {
    const data = await query('social', `SELECT [comment_id],[target_type],[target_id],[content],[created_at] FROM dbo.comments WHERE [user_id] = @uid AND [is_deleted] = 0 ORDER BY [created_at] DESC OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`, { uid: userId, off: (parseInt(page as string) - 1) * parseInt(limit as string), lim: parseInt(limit as string) });
    res.json({ success: true, data: data || [] });
  } catch { res.json({ success: true, data: [] }); }
}));

// ==================== 同步公开模型 ====================

router.post('/sync-public-models', authMiddleware, asyncHandler(async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: { synced: 0 }, message: '同步完成' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

// ==================== 笔记 ====================

router.get('/notes', optionalAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const { is_public, user_id, page = '1', limit = '20' } = req.query;
  try {
    let sql = `SELECT [note_id],[user_id],[username],[title],[content],[tags],[is_public],[related_building_id],[related_building_name],[created_at],[updated_at] FROM dbo.notes WHERE 1=1`;
    const params: any = {};
    if (is_public === '1') { sql += ` AND [is_public] = 1`; }
    if (user_id) { sql += ` AND [user_id] = @uid`; params.uid = parseInt(user_id as string); }
    sql += ` ORDER BY [created_at] DESC OFFSET @off ROWS FETCH NEXT @lim ROWS ONLY`;
    params.off = (parseInt(page as string) - 1) * parseInt(limit as string);
    params.lim = parseInt(limit as string);
    const data = await query('social', sql, params);
    res.json({ success: true, data: data || [] });
  } catch { res.json({ success: true, data: [] }); }
}));

router.post('/notes', authMiddleware, checkMuteMiddleware, validateBody(z.object({ title: z.string().min(1), content: z.string().min(1), tags: z.string().optional(), is_public: z.boolean().optional(), related_building_id: z.number().optional(), related_building_name: z.string().optional() })), asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const username = req.user?.username || '用户';
  const { title, content, tags, is_public = false, related_building_id, related_building_name } = req.body;
  try {
    const result = await execute('social', `INSERT INTO dbo.notes ([user_id],[username],[title],[content],[tags],[is_public],[related_building_id],[related_building_name],[created_at]) OUTPUT INSERTED.note_id VALUES (@uid,@uname,@title,@content,@tags,@pub,@rbid,@rbname,GETDATE())`, { uid: userId, uname: username, title, content, tags: tags || null, pub: is_public ? 1 : 0, rbid: related_building_id || null, rbname: related_building_name || null });
    const noteId = (result.recordset[0] as any).note_id;
    res.status(201).json({ success: true, data: { note_id: noteId }, message: '笔记创建成功' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

router.delete('/notes/:id', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await execute('social', 'DELETE FROM dbo.notes WHERE [note_id] = @id AND [user_id] = @uid', { id: parseInt(id), uid: req.user.userId });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

// ==================== 禁言状态 ====================

router.get('/mute-status', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  try {
    const [user] = await query('user', 'SELECT [is_muted],[mute_reason] FROM [atca_user] WHERE [user_id] = @uid', { uid: userId });
    res.json({ success: true, data: { is_muted: (user as any)?.is_muted === 1, mute_reason: (user as any)?.mute_reason || '' } });
  } catch { res.json({ success: true, data: { is_muted: false, mute_reason: '' } }); }
}));

// ==================== 社区管理（管理员）====================

router.get('/admin/forum/topics', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const isAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
  if (!isAdmin) { res.status(403).json({ success: false, error: { message: '权限不足' } }); return; }
  try {
    const data = await query('social', 'SELECT t.*, b.board_name FROM dbo.forum_topics t LEFT JOIN dbo.forum_boards b ON t.board_id = b.board_id ORDER BY t.created_at DESC');
    res.json({ success: true, data: data || [] });
  } catch { res.json({ success: true, data: [] }); }
}));

router.delete('/admin/forum/topics/:id', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await execute('social', 'DELETE FROM dbo.forum_replies WHERE [topic_id] = @tid', { tid: parseInt(id) });
    await execute('social', 'DELETE FROM dbo.forum_topics WHERE [topic_id] = @id', { id: parseInt(id) });
    res.json({ success: true, message: '帖子已删除' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

router.delete('/admin/forum/replies/:id', authMiddleware, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    await execute('social', 'DELETE FROM dbo.forum_replies WHERE [reply_id] = @id', { id: parseInt(id) });
    res.json({ success: true, message: '回复已删除' });
  } catch (err: any) { res.status(500).json({ success: false, error: { message: err.message } }); }
}));

// ==================== 健康检查 ====================

router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Social 路由已挂载', timestamp: new Date().toISOString() });
});

export default router;