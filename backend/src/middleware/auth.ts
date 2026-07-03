// ============================================
// 华夏营造 - JWT认证中间件
// ============================================

import jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/app';
import { logListenerAdd } from '../utils/memoryLifecycle';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
    iat?: number;
  };
}

// Token 黑名单存储接口
interface TokenBlacklistStore {
  add(token: string, ttlSeconds: number): Promise<void>;
  has(token: string): Promise<boolean>;
}

// 内存存储实现（开发环境使用）
class MemoryBlacklistStore implements TokenBlacklistStore {
  private store = new Set<string>();

  async add(token: string, ttlSeconds: number): Promise<void> {
    this.store.add(token);
    setTimeout(() => this.store.delete(token), ttlSeconds * 1000);
  }

  async has(token: string): Promise<boolean> {
    return this.store.has(token);
  }
}

// Redis 存储实现（生产环境使用）
class RedisBlacklistStore implements TokenBlacklistStore {
  private client: any = null;
  private connectionFailed = false;
  private initAttempted = false;

  private async ensureClient(): Promise<void> {
    if (this.client) return;
    if (this.connectionFailed) return; // 已确认连接失败，不再尝试
    if (this.initAttempted) return; // 已尝试初始化，不再重复
    
    this.initAttempted = true;
    
    try {
      // 动态加载 ioredis，避免强制依赖
      // @ts-ignore
      const redisModule = require('ioredis');
      const RedisClass = redisModule.default || redisModule;
      this.client = new RedisClass({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 1,  // 最多重试1次
        retryStrategy: () => null, // 禁用自动重连
        enableReadyCheck: false,
        lazyConnect: true,  // 懒加载连接
      });
      
      // 抑制所有错误事件日志
      this.client.on('error', () => {
        // 静默处理，不输出日志
      });
      logListenerAdd('Auth', 'error', 'redisClient');
      
      await this.client.connect();
      await this.client.ping();
      console.log('[Auth] Redis 黑名单存储已连接');
    } catch (error) {
      console.warn('[Auth] Redis 连接失败，降级到内存存储');
      this.connectionFailed = true;
      this.client = null;
    }
  }

  async add(token: string, ttlSeconds: number): Promise<void> {
    await this.ensureClient();
    if (this.client) {
      try {
        await this.client.set(`blacklist:${token}`, 'true', 'EX', ttlSeconds);
      } catch (error) {
        console.warn('[Auth] Redis 添加黑名单失败:', (error as Error).message);
      }
    }
  }

  async has(token: string): Promise<boolean> {
    await this.ensureClient();
    if (this.client) {
      try {
        const result = await this.client.get(`blacklist:${token}`);
        return result === 'true';
      } catch (error) {
        console.warn('[Auth] Redis 查询黑名单失败:', (error as Error).message);
      }
    }
    return false;
  }
}

// 根据环境选择存储实现
const isProduction = config.nodeEnv === 'production';
const BLACKLIST_TTL_SECONDS = 24 * 60 * 60; // 24小时

const blacklistStore: TokenBlacklistStore = isProduction
  ? new RedisBlacklistStore()
  : new MemoryBlacklistStore();

export async function addToBlacklist(token: string): Promise<void> {
  await blacklistStore.add(token, BLACKLIST_TTL_SECONDS);
}

export async function isBlacklisted(token: string): Promise<boolean> {
  return blacklistStore.has(token);
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

export async function verifyAccessToken(token: string): Promise<{ userId: number; username: string; role: string } | null> {
  try {
    if (await isBlacklisted(token)) return null;
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

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

  const decoded = await verifyAccessToken(token);
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
