// ============================================
// 华夏营造 - 暴力破解防护中间件
// ============================================

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger';

const logger = createLogger('RateLimiter');

// Redis客户端配置（可选）
let redisClient: any = null;
try {
  if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL);
  }
} catch (err) {
  logger.warn('Redis模块未安装，使用内存存储');
}

// 存储登录失败记录的内存存储（当Redis不可用时使用）
const loginAttempts: Record<string, { count: number; lastAttempt: number; lockedUntil: number }> = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15分钟
const ATTEMPT_WINDOW = 10 * 60 * 1000; // 10分钟内的尝试计数

// ============================================
// 获取客户端唯一标识
// ============================================

function getClientIdentifier(req: Request): string {
  // 优先使用IP地址
  const ip = req.ip || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
             'unknown';
  
  return ip;
}

// ============================================
// 获取登录尝试记录
// ============================================

async function getLoginAttempts(username: string, ip: string): Promise<{ count: number; lockedUntil: number }> {
  const key = `${username}:${ip}`;
  
  if (redisClient) {
    try {
      const data = await redisClient.get(`login:attempts:${key}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      logger.warn('Redis读取失败，回退到内存存储', { error: (err as Error).message });
    }
  }
  
  const record = loginAttempts[key];
  if (!record) {
    return { count: 0, lockedUntil: 0 };
  }
  
  // 检查时间窗口是否过期
  if (Date.now() - record.lastAttempt > ATTEMPT_WINDOW) {
    delete loginAttempts[key];
    return { count: 0, lockedUntil: 0 };
  }
  
  return { count: record.count, lockedUntil: record.lockedUntil };
}

// ============================================
// 更新登录尝试记录
// ============================================

async function updateLoginAttempts(username: string, ip: string, success: boolean): Promise<void> {
  const key = `${username}:${ip}`;
  
  if (success) {
    // 登录成功，清除尝试记录
    if (redisClient) {
      try {
        await redisClient.del(`login:attempts:${key}`);
      } catch (err) {
        logger.warn('Redis删除失败', { error: (err as Error).message });
      }
    }
    delete loginAttempts[key];
    return;
  }
  
  // 登录失败，增加计数
  const attempts = await getLoginAttempts(username, ip);
  const newCount = attempts.count + 1;
  const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : 0;
  
  const record = {
    count: newCount,
    lastAttempt: Date.now(),
    lockedUntil,
  };
  
  if (redisClient) {
    try {
      // 设置过期时间为锁定时间或时间窗口
      const expireTime = lockedUntil > 0 
        ? Math.ceil((lockedUntil - Date.now()) / 1000)
        : Math.ceil(ATTEMPT_WINDOW / 1000);
      
      await redisClient.set(`login:attempts:${key}`, JSON.stringify(record), 'EX', expireTime);
    } catch (err) {
      logger.warn('Redis写入失败，回退到内存存储', { error: (err as Error).message });
      loginAttempts[key] = record;
    }
  } else {
    loginAttempts[key] = record;
  }
  
  if (newCount >= MAX_ATTEMPTS) {
    logger.warn('账户已被锁定', { username, ip, lockoutDuration: LOCKOUT_DURATION / 60000 });
  }
}

// ============================================
// 登录尝试限制中间件
// ============================================

export async function loginRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { username } = req.body;
  const ip = getClientIdentifier(req);
  
  if (!username) {
    next();
    return;
  }
  
  const attempts = await getLoginAttempts(username, ip);
  
  // 检查账户是否被锁定
  if (attempts.lockedUntil > Date.now()) {
    const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    
    res.status(423).json({
      success: false,
      error: {
        code: 'AUTH_012',
        message: '账户已被临时锁定',
        details: `由于多次登录失败，账户已被锁定。请在 ${remainingMinutes} 分钟后重试。`,
      },
    });
    return;
  }
  
  // 注入方法供后续使用
  (req as any).recordLoginAttempt = (success: boolean) => updateLoginAttempts(username, ip, success);
  
  next();
}

// ============================================
// 通用API速率限制器
// ============================================

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string | object;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}) => {
  const messageContent = options.message || {
    success: false,
    error: {
      code: 'SEC_005',
      message: '请求过于频繁',
      details: '请稍后再试',
    },
  };

  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15分钟
    max: options.max || 100, // 每个窗口内的最大请求数
    message: typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent),
    standardHeaders: options.standardHeaders !== undefined ? options.standardHeaders : true,
    legacyHeaders: options.legacyHeaders !== undefined ? options.legacyHeaders : false,
    keyGenerator: (req) => getClientIdentifier(req),
  });
};

// ============================================
// 认证API专用速率限制器
// ============================================

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 30, // 每个窗口内最多30次认证请求（放宽以适应正常使用）
  message: {
    success: false,
    error: {
      code: 'AUTH_013',
      message: '认证请求过于频繁',
      details: '请稍后再试',
    },
  },
});

// ============================================
// 通用请求速率限制器
// ============================================

export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个窗口内最多1000次请求（放宽以适应正常页面加载）
});

// ============================================
// 严格速率限制器（用于敏感操作）
// ============================================

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10次请求
  message: {
    success: false,
    error: {
      code: 'SEC_006',
      message: '操作过于频繁',
      details: '请稍后再试',
    },
  },
});