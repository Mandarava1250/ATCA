// ============================================
// 筑见山河 - JWT认证中间件
// 统一委托给 AuthService 单例，消除重复代码
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthUser } from '../services/AuthService';

// Re-export AuthRequest 类型以保持向后兼容
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// 获取 AuthService 单例
const authService = AuthService.getInstance();

// ---- 向后兼容的委托函数 ----

export async function addToBlacklist(token: string): Promise<void> {
  return authService.addToBlacklist(token);
}

export async function isBlacklisted(token: string): Promise<boolean> {
  return authService.isBlacklisted(token);
}

export function generateTokens(userId: number, username: string, role: string): { accessToken: string; refreshToken: string } {
  return authService.generateTokens(userId, username, role);
}

export async function verifyAccessToken(token: string): Promise<{ userId: number; username: string; role: string } | null> {
  return authService.verifyAccessToken(token);
}

export function verifyRefreshToken(token: string): { userId: number; username: string; role: string } | null {
  return authService.verifyRefreshToken(token);
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  return authService.authMiddleware(req, res, next);
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  return authService.adminMiddleware(req, res, next);
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

export async function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  let token: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }
  if (token) {
    const decoded = await verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}
