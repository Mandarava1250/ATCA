// ============================================
// 华夏营造 - 认证路由模块 (支持 Mock 降级)
// ============================================

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query, execute, isMockMode } from '../../config/database';
import { config } from '../../config/app';
import {
  generateTokens,
  verifyRefreshToken,
  authMiddleware,
  addToBlacklist,
  AuthRequest,
} from '../../middleware/auth';
import { validateBody } from '../../middleware/validation';
import { asyncHandler } from '../../middleware/errorHandler';
import { createLogger } from '../../utils/logger';
import { authRateLimiter, loginRateLimit } from '../../middleware/rateLimiter';
import { validatePassword } from '../../middleware/security';

const router = Router();
const logger = createLogger('Auth');

// 头像上传配置
const avatarUploadDir = path.resolve(config.upload.dir, 'avatars');
if (!fs.existsSync(avatarUploadDir)) { fs.mkdirSync(avatarUploadDir, { recursive: true }); }

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarUploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + unique + path.extname(file.originalname));
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只允许上传图片文件') as any);
  },
});

// Mock 模式下的内存用户存储
const mockUsers: Array<{
  user_id: number; username: string; nickname: string | null;
  password: string; email: string; role: string; points: number;
  level: number; is_active: boolean; avatar: string | null; created_at: string;
}> = [];
let mockUserIdCounter = 1;

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(12).max(128),
  email: z.string().email(),
  nickname: z.string().max(50).optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(12).max(128),
});

// 注册
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { username, password, email, nickname } = req.body;

    logger.info('用户注册请求', { username, email, hasNickname: !!nickname, ip: req.ip });

    // 密码强度验证
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      logger.warn('注册失败-密码强度不足', { username });
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_010',
          message: '密码强度不足',
          details: passwordValidation.errors.join('; '),
        },
      });
      return;
    }

    if (isMockMode()) {
      logger.info('Mock模式注册流程开始', { username });

      // 检查用户名是否存在
      const existingUser = mockUsers.find((u) => u.username === username);
      if (existingUser) {
        logger.warn('注册失败-用户名已存在', { username });
        res.status(409).json({ success: false, error: { code: 'AUTH_009', message: '用户名已存在' } });
        return;
      }

      // 检查邮箱是否存在
      const existingEmail = mockUsers.find((u) => u.email === email);
      if (existingEmail) {
        logger.warn('注册失败-邮箱已存在', { email });
        res.status(409).json({ success: false, error: { code: 'AUTH_008', message: '邮箱已存在' } });
        return;
      }

      // 密码加密
      logger.info('开始密码加密', { username });
      const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
      logger.info('密码加密完成', { username });

      // 创建用户
      const userId = mockUserIdCounter++;
      mockUsers.push({
        user_id: userId, username, nickname: nickname || null,
        password: hashedPassword, email, role: 'user', points: 0,
        level: 1, is_active: true, avatar: null, created_at: new Date().toISOString(),
      });

      // 生成Token
      logger.info('生成用户Token', { userId, username });
      const tokens = generateTokens(userId, username, 'user');

      logger.info('用户注册成功', { userId, username, role: 'user' });
      res.status(201).json({
        success: true,
        data: { user: { userId, username, nickname: nickname || username, email, role: 'user', points: 0, level: 1, avatar: '/images/default-avatar.png' }, tokens },
        message: '注册成功（Mock 模式）',
      });
      return;
    }

    // 数据库模式注册
    logger.info('数据库模式注册流程开始', { username });

    // 检查用户名是否存在
    logger.info('检查用户名是否存在', { username });
    const existingUser = await query('user', 'SELECT [user_id] FROM dbo.atca_user WHERE [username] = @username', { username });
    if (existingUser.length > 0) {
      logger.warn('注册失败-用户名已存在', { username });
      res.status(409).json({ success: false, error: { code: 'AUTH_009', message: '用户名已存在' } }); return;
    }

    // 检查邮箱是否存在
    logger.info('检查邮箱是否存在', { email });
    const existingEmail = await query('user', 'SELECT [user_id] FROM dbo.atca_user WHERE [email] = @email', { email });
    if (existingEmail.length > 0) {
      logger.warn('注册失败-邮箱已存在', { email });
      res.status(409).json({ success: false, error: { code: 'AUTH_008', message: '邮箱已存在' } }); return;
    }

    // 密码加密
    logger.info('开始密码加密', { username });
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);
    logger.info('密码加密完成', { username });

    // 创建用户记录
    logger.info('创建用户记录到数据库', { username, email });
    const result = await execute('user', `INSERT INTO dbo.atca_user ([username], [nickname], [password], [email], [role], [points], [level], [is_active]) VALUES (@username, @nickname, @password, @email, 'user', 0, 1, 1); SELECT SCOPE_IDENTITY() AS user_id;`, { username, nickname: nickname || null, password: hashedPassword, email });
    const userId = result.recordset[0].user_id as number;
    logger.info('用户记录创建成功', { userId, username });

    // 创建用户设置记录
    logger.info('创建用户设置记录', { userId });
    await execute('user', `INSERT INTO dbo.profile_settings ([user_id], [visibility], [bio]) VALUES (@userId, 'public', NULL)`, { userId });
    logger.info('用户设置记录创建成功', { userId });

    // 生成Token
    logger.info('生成用户Token', { userId, username });
    const tokens = generateTokens(userId, username, 'user');

    logger.info('用户注册成功', { userId, username, role: 'user' });
    res.status(201).json({
      success: true,
      data: { user: { userId, username, nickname: nickname || username, email, role: 'user', points: 0, level: 1, avatar: '/images/default-avatar.png' }, tokens },
      message: '注册成功',
    });
  })
);

// 登录
router.post(
  '/login',
  authRateLimiter,
  loginRateLimit,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    logger.info('用户登录请求', { username, ip: req.ip });

    if (isMockMode()) {
      logger.info('Mock模式登录流程开始', { username });

      // 查找用户
      const user = mockUsers.find((u) => u.username === username);
      if (!user) {
        logger.warn('登录失败-用户不存在', { username });
        res.status(401).json({ success: false, error: { code: 'AUTH_001', message: '用户名或密码错误' } }); return;
      }
      logger.info('用户存在，开始验证', { userId: user.user_id, username });

      // 检查账户状态
      if (!user.is_active) {
        logger.warn('登录失败-账户已被禁用', { userId: user.user_id, username });
        res.status(403).json({ success: false, error: { code: 'AUTH_005', message: '账户已被禁用' } }); return;
      }

      // 验证密码
      logger.info('开始密码验证', { userId: user.user_id, username });
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        logger.warn('登录失败-密码错误', { userId: user.user_id, username });
        // 记录失败尝试
        await (req as any).recordLoginAttempt?.(false);
        res.status(401).json({ success: false, error: { code: 'AUTH_001', message: '用户名或密码错误' } }); return;
      }
      logger.info('密码验证通过', { userId: user.user_id, username });

      // 记录成功登录
      await (req as any).recordLoginAttempt?.(true);

      // 生成Token
      logger.info('生成登录Token', { userId: user.user_id, username });
      const tokens = generateTokens(user.user_id, username, user.role);

      logger.info('用户登录成功', { userId: user.user_id, username, role: user.role });
      res.json({ success: true, data: { user: { userId: user.user_id, username: user.username, nickname: user.nickname || user.username, email: user.email, avatar: user.avatar, points: user.points, level: user.level, role: user.role }, tokens }, message: '登录成功（Mock 模式）' });
      return;
    }

    // 数据库模式登录
    logger.info('数据库模式登录流程开始', { username });

    // 查询用户（只从 user 数据库查询）
    let users: any[] = [];
    try {
      logger.info('查询用户数据', { username });
      users = await query('user', `SELECT [user_id], [username], [nickname], [password], [email], [avatar], [points], [level], [role], [is_active], [last_login] FROM dbo.atca_user WHERE [username] = @username`, { username });
      logger.info('用户数据查询成功', { username, found: users.length > 0 });
    } catch (dbErr: any) {
      logger.error('用户数据查询失败', { username, error: dbErr.message });
      res.status(500).json({ success: false, error: { code: 'AUTH_500', message: '数据库连接失败，请稍后重试' } });
      return;
    }

    if (users.length === 0) {
      logger.warn('登录失败-用户不存在', { username });
      // 记录失败尝试（用户不存在也算）
      await (req as any).recordLoginAttempt?.(false);
      res.status(401).json({ success: false, error: { code: 'AUTH_001', message: '用户名或密码错误' } }); return;
    }

    const user = users[0] as any;
    logger.info('用户存在，开始验证', { userId: user.user_id, username, isActive: user.is_active });

    // 检查账户状态
    if (!user.is_active) {
      logger.warn('登录失败-账户已被禁用', { userId: user.user_id, username });
      res.status(403).json({ success: false, error: { code: 'AUTH_005', message: '账户已被禁用' } }); return;
    }

    // 验证密码
    logger.info('开始密码验证', { userId: user.user_id, username });
    const validPassword = await bcrypt.compare(password, user.password as string);
    if (!validPassword) {
      logger.warn('登录失败-密码错误', { userId: user.user_id, username });
      // 记录失败尝试
      await (req as any).recordLoginAttempt?.(false);
      res.status(401).json({ success: false, error: { code: 'AUTH_001', message: '用户名或密码错误' } }); return;
    }
    logger.info('密码验证通过', { userId: user.user_id, username });

    // 记录成功登录
    await (req as any).recordLoginAttempt?.(true);

    // 更新最后登录时间（忽略失败）
    try {
      logger.info('更新最后登录时间', { userId: user.user_id });
      await execute('user', 'UPDATE dbo.atca_user SET [last_login] = GETDATE() WHERE [user_id] = @userId', { userId: user.user_id });
      logger.info('最后登录时间更新成功', { userId: user.user_id });
    } catch (updateErr) {
      logger.warn('更新最后登录时间失败', { userId: user.user_id, error: (updateErr as Error).message });
    }

    // 生成Token
    logger.info('生成登录Token', { userId: user.user_id, username });
    const tokens = generateTokens(user.user_id as number, username, user.role as string);

    logger.info('用户登录成功', { userId: user.user_id, username, role: user.role });
    res.json({ success: true, data: { user: { userId: user.user_id, username: user.username, nickname: user.nickname || user.username, email: user.email, avatar: user.avatar, points: user.points, level: user.level, role: user.role }, tokens }, message: '登录成功' });
  })
);

// 刷新Token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(401).json({ success: false, error: { code: 'AUTH_011', message: '未提供刷新令牌' } }); return; }
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) { res.status(401).json({ success: false, error: { code: 'AUTH_011', message: '刷新令牌无效' } }); return; }
  const tokens = generateTokens(decoded.userId, decoded.username, decoded.role);
  res.json({ success: true, data: tokens });
}));

// 登出
router.post('/logout', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) { addToBlacklist(authHeader.substring(7)); }
  res.json({ success: true, message: '登出成功' });
}));

// 获取当前用户
router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    const user = mockUsers.find((u) => u.user_id === req.user!.userId);
    if (!user) { res.status(404).json({ success: false, error: { code: 'USER_001', message: '用户不存在' } }); return; }
    res.json({ success: true, data: { userId: user.user_id, username: user.username, nickname: user.nickname || user.username, email: user.email, avatar: user.avatar, points: user.points, level: user.level, role: user.role, createdAt: user.created_at } });
    return;
  }
  const users = await query('user', `SELECT [user_id], [username], [nickname], [email], [avatar], [points], [level], [role], [is_active], [created_at] FROM dbo.atca_user WHERE [user_id] = @userId`, { userId: req.user!.userId });
  if (users.length === 0) { res.status(404).json({ success: false, error: { code: 'USER_001', message: '用户不存在' } }); return; }
  const user = users[0] as any;
  res.json({ success: true, data: { userId: user.user_id, username: user.username, nickname: user.nickname || user.username, email: user.email, avatar: user.avatar, points: user.points, level: user.level, role: user.role, createdAt: user.created_at } });
}));

// 获取个人资料
router.get('/profile', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  if (isMockMode()) {
    const user = mockUsers.find((u) => u.user_id === req.user!.userId);
    if (!user) { res.status(404).json({ success: false, error: { code: 'USER_001', message: '用户不存在' } }); return; }
    res.json({
      success: true,
      data: { userId: user.user_id, username: user.username, nickname: user.nickname || user.username, email: user.email, avatar: user.avatar, points: user.points, level: user.level, role: user.role, visibility: 'public', bio: null, location: null, interests: [], socialLinks: {}, notificationPreferences: {}, createdAt: user.created_at },
    });
    return;
  }
  const profiles = await query('user', `SELECT p.*, u.[username], u.[nickname], u.[email], u.[avatar], u.[points], u.[level], u.[role], u.[created_at] FROM dbo.profile_settings p JOIN dbo.atca_user u ON p.[user_id] = u.[user_id] WHERE p.[user_id] = @userId`, { userId: req.user!.userId });
  if (profiles.length === 0) { res.status(404).json({ success: false, error: { code: 'USER_001', message: '用户不存在' } }); return; }
  const p = profiles[0] as any;
  res.json({ success: true, data: { userId: p.user_id, username: p.username, nickname: p.nickname || p.username, email: p.email, avatar: p.avatar, points: p.points, level: p.level, role: p.role, visibility: p.visibility, bio: p.bio, location: p.location, interests: p.interests ? JSON.parse(p.interests as string) : [], socialLinks: p.social_links ? JSON.parse(p.social_links as string) : {}, notificationPreferences: p.notification_preferences ? JSON.parse(p.notification_preferences as string) : {}, createdAt: p.created_at } });
}));

// 更新个人资料
router.put('/profile', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { nickname, bio, location, visibility } = req.body;
  const userId = req.user!.userId;
  if (isMockMode()) {
    const user = mockUsers.find((u) => u.user_id === userId);
    if (user) { user.nickname = nickname || user.nickname; }
    res.json({ success: true, message: '个人资料更新成功（Mock）' });
    return;
  }
  await execute('user', `UPDATE dbo.atca_user SET [nickname] = @nickname WHERE [user_id] = @userId`, { nickname: nickname || null, userId });
  await execute('user', `UPDATE dbo.profile_settings SET [bio] = @bio, [location] = @location, [visibility] = @visibility, [updated_at] = GETDATE() WHERE [user_id] = @userId`, { bio: bio || null, location: location || null, visibility: visibility || 'public', userId });
  res.json({ success: true, message: '个人资料更新成功' });
}));

// 头像上传
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) { res.status(400).json({ success: false, error: { message: '未收到文件' } }); return; }
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  const userId = req.user!.userId;
  if (isMockMode()) {
    const user = mockUsers.find((u) => u.user_id === userId);
    if (user) user.avatar = avatarUrl;
    res.json({ success: true, data: { avatarUrl } });
    return;
  }
  await execute('user', 'UPDATE dbo.atca_user SET [avatar] = @avatar WHERE [user_id] = @userId', { avatar: avatarUrl, userId });
  res.json({ success: true, data: { avatarUrl } });
}));

// 修改密码
router.put('/change-password', authMiddleware, validateBody(changePasswordSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  // 密码强度验证
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    res.status(400).json({
      success: false,
      error: {
        code: 'AUTH_010',
        message: '新密码强度不足',
        details: passwordValidation.errors.join('; '),
      },
    });
    return;
  }

  if (isMockMode()) {
    const user = mockUsers.find((u) => u.user_id === userId);
    if (!user) { res.status(404).json({ success: false, error: { code: 'USER_001', message: '用户不存在' } }); return; }
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) { res.status(401).json({ success: false, error: { code: 'AUTH_001', message: '原密码错误' } }); return; }
    user.password = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) { addToBlacklist(authHeader.substring(7)); }
    res.json({ success: true, message: '密码修改成功，请重新登录' });
    return;
  }

  const users = await query('user', 'SELECT [password] FROM dbo.atca_user WHERE [user_id] = @userId', { userId });
  if (users.length === 0) { res.status(404).json({ success: false, error: { code: 'USER_001', message: '用户不存在' } }); return; }
  const user = users[0] as any;
  const validPassword = await bcrypt.compare(oldPassword, user.password as string);
  if (!validPassword) { res.status(401).json({ success: false, error: { code: 'AUTH_001', message: '原密码错误' } }); return; }
  const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
  await execute('user', 'UPDATE dbo.atca_user SET [password] = @password WHERE [user_id] = @userId', { password: hashedPassword, userId });
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) { addToBlacklist(authHeader.substring(7)); }
  res.json({ success: true, message: '密码修改成功，请重新登录' });
}));

export default router;
