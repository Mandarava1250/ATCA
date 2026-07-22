// ============================================
// 筑见山河 - 认证服务
// 统一管理JWT认证相关操作
// 实现 IService 接口以纳入统一服务注册体系
// ============================================

import jwt from 'jsonwebtoken';
import type { SignOptions, Secret } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config/app';
import { IService, ServiceState } from '../core';
import { logInit, logDispose, logListenerAdd } from '../utils/memoryLifecycle';

export interface AuthUser {
  userId: number;
  username: string;
  role: string;
  iat?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface ITokenBlacklistStore {
  add(token: string, ttlSeconds: number): Promise<void>;
  has(token: string): Promise<boolean>;
}

class MemoryBlacklistStore implements ITokenBlacklistStore {
  private store = new Set<string>();

  async add(token: string, ttlSeconds: number): Promise<void> {
    this.store.add(token);
    setTimeout(() => this.store.delete(token), ttlSeconds * 1000);
  }

  async has(token: string): Promise<boolean> {
    return this.store.has(token);
  }
}

class RedisBlacklistStore implements ITokenBlacklistStore {
  private client: Redis | null = null;
  private connectionFailed = false;
  private initAttempted = false;

  private async ensureClient(): Promise<void> {
    if (this.client) return;
    if (this.connectionFailed) return;
    if (this.initAttempted) return;

    this.initAttempted = true;

    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        enableReadyCheck: false,
        lazyConnect: true,
      });

      this.client.on('error', () => {
        // 静默处理
      });
      logListenerAdd('AuthService', 'error', 'redisClient');

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

/**
 * 认证服务类
 * 实现 IService 接口以纳入统一服务注册体系
 */
export class AuthService implements IService {
  readonly serviceId = 'auth-service';
  readonly serviceName = '认证服务';

  private static instance: AuthService | null = null;
  private blacklistStore: ITokenBlacklistStore | null = null;
  private readonly BLACKLIST_TTL_SECONDS = 24 * 60 * 60;
  private state: ServiceState = ServiceState.UNREGISTERED;

  private constructor() {
    // 私有构造函数，防止直接实例化
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 服务工厂函数（用于服务注册中心）
   */
  static createInstance(): AuthService {
    return AuthService.getInstance();
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    this.state = ServiceState.INITIALIZING;
    
    const isProduction = config.nodeEnv === 'production';
    this.blacklistStore = isProduction ? new RedisBlacklistStore() : new MemoryBlacklistStore();
    
    this.state = ServiceState.READY;
    console.log(`[${this.serviceName}] 服务初始化完成`);
    logInit('AuthService', `${this.serviceName}初始化完成`);
  }

  /**
   * 销毁服务
   */
  async dispose(): Promise<void> {
    this.blacklistStore = null;
    this.state = ServiceState.DISPOSED;
    console.log(`[${this.serviceName}] 服务已销毁`);
    logDispose('AuthService', `${this.serviceName}已销毁`);
  }

  /**
   * 获取服务状态
   */
  getState(): ServiceState {
    return this.state;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    return this.state === ServiceState.READY && this.blacklistStore !== null;
  }

  async addToBlacklist(token: string): Promise<void> {
    if (!this.blacklistStore) {
      throw new Error('认证服务未初始化');
    }
    await this.blacklistStore.add(token, this.BLACKLIST_TTL_SECONDS);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    if (!this.blacklistStore) {
      throw new Error('认证服务未初始化');
    }
    return this.blacklistStore.has(token);
  }

  generateTokens(userId: number, username: string, role: string): { accessToken: string; refreshToken: string } {
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

  async verifyAccessToken(token: string): Promise<AuthUser | null> {
    try {
      if (await this.isBlacklisted(token)) return null;
      const decoded = jwt.verify(token, config.jwt.secret as Secret) as jwt.JwtPayload;
      if (decoded.type !== 'access') return null;
      return { userId: decoded.userId as number, username: decoded.username as string, role: decoded.role as string };
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret as Secret) as jwt.JwtPayload;
      if (decoded.type !== 'refresh') return null;
      return { userId: decoded.userId as number, username: decoded.username as string, role: decoded.role as string };
    } catch {
      return null;
    }
  }

  async authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
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

    const decoded = await this.verifyAccessToken(token);
    if (!decoded) {
      res.status(401).json({ success: false, error: { code: 'AUTH_002', message: '令牌已过期或无效' } });
      return;
    }

    req.user = decoded;
    next();
  }

  adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
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
}

// 导出单例实例（向后兼容）
export const authService = AuthService.getInstance();