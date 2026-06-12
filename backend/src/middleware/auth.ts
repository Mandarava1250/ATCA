// ============================================
// 华夏营造 - JWT认证中间件
// ============================================

import jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/app';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
    iat?: number;
  };
}

// 内存中的Token黑名单（生产环境应使用Redis）
const tokenBlacklist = new Set<string>();

export function addToBlacklist(token: string): void {
  tokenBlacklist.add(token);
  // 24小时后自动清理
  setTimeout(() => tokenBlacklist.delete(token), 24 * 60 * 60 * 1000);
}

export function isBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

export function generateTokens(userId: number, username: string, role: string): { accessToken: string; refreshToken: string } {
  const accessToken = jwt.sign(
    { userId, username, role, type: 'access' },
    config.jwt.secret as Secret,
    { expiresIn: config.jwt.accessExpiry } as SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, username, role, type: 'refresh' },
    config.jwt.refreshSecret as Secret,
    { expiresIn: config.jwt.refreshExpiry } as SignOptions
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): { userId: number; username: string; role: string } | null {
  try {
    if (isBlacklisted(token)) return null;
    const decoded = jwt.verify(token, config.jwt.secret as Secret) as jwt.JwtPayload;
    if (decoded.type !== 'access') return null;
    return { userId: decoded.userId as number, username: decoded.username as string, role: decoded.role as string };
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: number; username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret as Secret) as jwt.JwtPayload;
    if (decoded.type !== 'refresh') return null;
    return { userId: decoded.userId as number, username: decoded.username as string, role: decoded.role as string };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // 支持Header和Query参数（SSE EventSource无法自定义Header）
  let token: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ success: false, error: { code: 'AUTH_003', message: '未提供认证令牌' } });
    return;
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, error: { code: 'AUTH_002', message: '令牌已过期或无效' } });
    return;
  }

  req.user = decoded;
  next();
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'AUTH_003', message: '未认证' } });
    return;
  }
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    res.status(403).json({ success: false, error: { code: 'AUTH_004', message: '权限不足' } });
    return;
  }
  next();
}

// 检查用户是否被禁言（需要在authMiddleware之后使用）
export async function checkMuteMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { next(); return; }
  try {
    const { query } = await import('../config/database');
    const [user] = await query('user', 'SELECT [is_muted],[mute_reason] FROM [atca_user] WHERE [user_id] = @uid', { uid: req.user.userId });
    if (user && (user as any).is_muted === 1) {
      res.status(403).json({ success: false, error: { code: 'MUTE_001', message: '你已被禁言，无法执行此操作' + ((user as any).mute_reason ? `：${(user as any).mute_reason}` : '') } });
      return;
    }
  } catch { /* 表或字段不存在则跳过检查 */ }
  next();
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  let token: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }
  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}
