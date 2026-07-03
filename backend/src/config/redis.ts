/**
 * 华夏营造 - Redis缓存配置
 * 用于多端数据同步的状态缓存
 */

import Redis from 'ioredis';
import { config } from './app';
import { logInit, logDispose, logListenerAdd } from '../utils/memoryLifecycle';

// Redis客户端实例
let redisClient: Redis | null = null;

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: 'atca:',
  retryStrategy: (times: number) => {
    if (times > 3) {
      console.error('[Redis] 连接失败超过3次，停止重试');
      return null;
    }
    return Math.min(times * 200, 2000);
  },
  maxRetriesPerRequest: 3,
};

/**
 * 初始化Redis连接
 */
export function initRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(redisConfig);
  logInit('Redis', 'Redis客户端初始化');

  redisClient.on('connect', () => {
    console.log('[Redis] 连接成功');
  });
  logListenerAdd('Redis', 'connect', 'redisClient');

  redisClient.on('error', (err) => {
    console.error('[Redis] 连接错误:', err.message);
  });
  logListenerAdd('Redis', 'error', 'redisClient');

  redisClient.on('close', () => {
    console.log('[Redis] 连接关闭');
  });
  logListenerAdd('Redis', 'close', 'redisClient');

  return redisClient;
}

/**
 * 获取Redis客户端
 */
export function getRedis(): Redis {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

/**
 * 关闭Redis连接
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] 连接已关闭');
    logDispose('Redis', 'Redis连接已关闭');
  }
}

// ========================
// 同步缓存服务
// ========================

const SYNC_CACHE_PREFIX = 'sync:';
const DEVICE_KEY_PREFIX = 'device:';
const SESSION_KEY_PREFIX = 'session:';
const LOCK_KEY_PREFIX = 'lock:';

// 默认过期时间
const DEFAULT_TTL = 3600; // 1小时
const SESSION_TTL = 86400; // 24小时
const LOCK_TTL = 10; // 10秒

/**
 * 同步缓存服务
 */
export const SyncCacheService = {
  /**
   * 设置用户设备在线状态
   */
  async setDeviceOnline(userId: number, deviceId: string, deviceInfo: any): Promise<void> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}${DEVICE_KEY_PREFIX}${userId}:${deviceId}`;
    await redis.setex(key, SESSION_TTL, JSON.stringify({
      ...deviceInfo,
      online_at: Date.now(),
    }));
  },

  /**
   * 获取用户所有在线设备
   */
  async getOnlineDevices(userId: number): Promise<any[]> {
    const redis = getRedis();
    const pattern = `${SYNC_CACHE_PREFIX}${DEVICE_KEY_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return [];
    
    const devices: any[] = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        devices.push(JSON.parse(data));
      }
    }
    return devices;
  },

  /**
   * 移除设备在线状态
   */
  async setDeviceOffline(userId: number, deviceId: string): Promise<void> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}${DEVICE_KEY_PREFIX}${userId}:${deviceId}`;
    await redis.del(key);
  },

  /**
   * 缓存同步消息（用于离线消息队列）
   */
  async cacheSyncMessage(userId: number, message: any): Promise<void> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}queue:${userId}`;
    await redis.rpush(key, JSON.stringify(message));
    await redis.expire(key, DEFAULT_TTL);
  },

  /**
   * 获取用户待处理的同步消息
   */
  async getPendingMessages(userId: number, limit: number = 100): Promise<any[]> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}queue:${userId}`;
    const messages = await redis.lrange(key, 0, limit - 1);
    
    // 清空队列
    if (messages.length > 0) {
      await redis.ltrim(key, messages.length, -1);
    }
    
    return messages.map(m => JSON.parse(m));
  },

  /**
   * 设置同步锁（防止并发同步冲突）
   */
  async acquireSyncLock(userId: number, entityType: string, entityId: number): Promise<boolean> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}${LOCK_KEY_PREFIX}${userId}:${entityType}:${entityId}`;
    const result = await redis.setnx(key, '1');
    if (result === 1) {
      await redis.expire(key, LOCK_TTL);
      return true;
    }
    return false;
  },

  /**
   * 释放同步锁
   */
  async releaseSyncLock(userId: number, entityType: string, entityId: number): Promise<void> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}${LOCK_KEY_PREFIX}${userId}:${entityType}:${entityId}`;
    await redis.del(key);
  },

  /**
   * 缓存用户会话数据
   */
  async cacheSession(sessionId: string, sessionData: any): Promise<void> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}${SESSION_KEY_PREFIX}${sessionId}`;
    await redis.setex(key, SESSION_TTL, JSON.stringify(sessionData));
  },

  /**
   * 获取用户会话数据
   */
  async getSession(sessionId: string): Promise<any | null> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}${SESSION_KEY_PREFIX}${sessionId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * 删除用户会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}${SESSION_KEY_PREFIX}${sessionId}`;
    await redis.del(key);
  },

  /**
   * 记录同步统计（实时）
   */
  async recordSyncStats(success: boolean, latencyMs: number): Promise<void> {
    const redis = getRedis();
    const today = new Date().toISOString().slice(0, 10);
    const key = `${SYNC_CACHE_PREFIX}stats:${today}`;
    
    await redis.hincrby(key, success ? 'success' : 'failed', 1);
    await redis.hincrby(key, 'total', 1);
    
    // 更新平均延迟（简化计算）
    const currentAvg = parseFloat(await redis.hget(key, 'avg_latency') || '0');
    const total = parseInt(await redis.hget(key, 'total') || '1');
    const newAvg = (currentAvg * (total - 1) + latencyMs) / total;
    await redis.hset(key, 'avg_latency', newAvg.toFixed(2));
    
    // 设置过期时间（保留7天）
    await redis.expire(key, 7 * 86400);
  },

  /**
   * 获取今日同步统计
   */
  async getTodayStats(): Promise<any> {
    const redis = getRedis();
    const today = new Date().toISOString().slice(0, 10);
    const key = `${SYNC_CACHE_PREFIX}stats:${today}`;
    
    const stats = await redis.hgetall(key);
    const total = parseInt(stats.total || '0');
    const success = parseInt(stats.success || '0');
    
    return {
      total,
      success,
      failed: parseInt(stats.failed || '0'),
      avg_latency: parseFloat(stats.avg_latency || '0'),
      success_rate: total > 0 ? (success / total * 100).toFixed(2) : '0',
    };
  },

  /**
   * 缓存数据版本（用于冲突检测）
   */
  async setDataVersion(userId: number, entityType: string, entityId: number, version: number): Promise<void> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}version:${userId}:${entityType}:${entityId}`;
    await redis.setex(key, DEFAULT_TTL, String(version));
  },

  /**
   * 获取数据版本
   */
  async getDataVersion(userId: number, entityType: string, entityId: number): Promise<number> {
    const redis = getRedis();
    const key = `${SYNC_CACHE_PREFIX}version:${userId}:${entityType}:${entityId}`;
    const version = await redis.get(key);
    return version ? parseInt(version) : 0;
  },
};

export default {
  initRedis,
  getRedis,
  closeRedis,
  SyncCacheService,
};