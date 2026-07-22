// ============================================
// 筑见山河 - 客户端状态存储抽象层
// 支持内存存储和 Redis 存储
// ============================================

import { createLogger } from '../utils/logger';
import { logListenerAdd } from '../utils/memoryLifecycle';

const logger = createLogger('ClientStateStore');

// 浏览状态类型
export type BrowseState = 'browsing' | 'active' | 'idle' | 'bot';

// 请求记录接口
export interface RequestRecord {
  timestamp: number;
  path: string;
  method: string;
}

// 客户端状态接口
export interface ClientState {
  requests: RequestRecord[];
  lastActive: number;
  browseState: BrowseState;
  requestCount: number;
  consecutiveReads: number;
  consecutiveWrites: number;
}

// 存储接口
export interface IClientStateStore {
  get(clientId: string): Promise<ClientState | null>;
  set(clientId: string, state: ClientState): Promise<void>;
  delete(clientId: string): Promise<boolean>;
  clear(): Promise<void>;
  size(): Promise<number>;
  entries(): Promise<Array<[string, ClientState]>>;
}

// ============================================
// 内存存储实现（默认，适合单进程或2核2G服务器）
// ============================================
export class MemoryClientStateStore implements IClientStateStore {
  private store: Map<string, ClientState> = new Map();

  async get(clientId: string): Promise<ClientState | null> {
    return this.store.get(clientId) || null;
  }

  async set(clientId: string, state: ClientState): Promise<void> {
    this.store.set(clientId, state);
  }

  async delete(clientId: string): Promise<boolean> {
    return this.store.delete(clientId);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async size(): Promise<number> {
    return this.store.size;
  }

  async entries(): Promise<Array<[string, ClientState]>> {
    return Array.from(this.store.entries());
  }
}

// ============================================
// Redis 存储实现（适合多进程集群部署）
// ============================================
export class RedisClientStateStore implements IClientStateStore {
  private redis: any; // ioredis 实例
  private keyPrefix: string;
  private ttl: number; // 过期时间（秒）

  constructor(redisClient: any, options: { keyPrefix?: string; ttl?: number } = {}) {
    this.redis = redisClient;
    this.keyPrefix = options.keyPrefix || 'atca:client_state:';
    this.ttl = options.ttl || 3600; // 默认1小时过期
  }

  private getKey(clientId: string): string {
    return `${this.keyPrefix}${clientId}`;
  }

  async get(clientId: string): Promise<ClientState | null> {
    try {
      const key = this.getKey(clientId);
      const data = await this.redis.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      logger.error('Redis get 失败', { clientId, error });
      return null;
    }
  }

  async set(clientId: string, state: ClientState): Promise<void> {
    try {
      const key = this.getKey(clientId);
      const data = JSON.stringify(state);
      await this.redis.setex(key, this.ttl, data);
    } catch (error) {
      logger.error('Redis set 失败', { clientId, error });
    }
  }

  async delete(clientId: string): Promise<boolean> {
    try {
      const key = this.getKey(clientId);
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete 失败', { clientId, error });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Redis clear 失败', { error });
    }
  }

  async size(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      return keys.length;
    } catch (error) {
      logger.error('Redis size 失败', { error });
      return 0;
    }
  }

  async entries(): Promise<Array<[string, ClientState]>> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      const result: Array<[string, ClientState]> = [];

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const clientId = key.replace(this.keyPrefix, '');
          const state = JSON.parse(data);
          result.push([clientId, state]);
        }
      }

      return result;
    } catch (error) {
      logger.error('Redis entries 失败', { error });
      return [];
    }
  }
}

// ============================================
// 存储工厂
// ============================================
let storeInstance: IClientStateStore | null = null;

export interface StoreConfig {
  type: 'memory' | 'redis';
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    ttl?: number;
  };
}

export function initClientStateStore(config: StoreConfig): IClientStateStore {
  if (config.type === 'redis' && config.redis) {
    // 动态导入 ioredis（仅在需要时）
    try {
      const Redis = require('ioredis');
      const redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db || 0,
        lazyConnect: true, // 延迟连接
        retryStrategy: (times: number) => {
          if (times > 3) {
            logger.error('Redis 连接重试次数超过限制，回退到内存存储');
            return null; // 停止重试
          }
          return Math.min(times * 100, 3000); // 递增延迟
        },
      });

      redisClient.on('connect', () => {
        logger.info('Redis 客户端状态存储已连接');
      });
      logListenerAdd('ClientStateStore', 'connect', 'redisClient');

      redisClient.on('error', (err: Error) => {
        logger.error('Redis 连接错误', { error: err.message });
      });
      logListenerAdd('ClientStateStore', 'error', 'redisClient');

      redisClient.on('reconnecting', () => {
        logger.info('Redis 正在重连...');
      });
      logListenerAdd('ClientStateStore', 'reconnecting', 'redisClient');

      redisClient.on('ready', () => {
        logger.info('Redis 连接已恢复，客户端状态同步完成');
      });
      logListenerAdd('ClientStateStore', 'ready', 'redisClient');

      storeInstance = new RedisClientStateStore(redisClient, {
        keyPrefix: config.redis.keyPrefix,
        ttl: config.redis.ttl,
      });

      logger.info('客户端状态存储: Redis 模式');
      return storeInstance;
    } catch (error) {
      logger.warn('Redis 初始化失败，回退到内存存储', { error });
      storeInstance = new MemoryClientStateStore();
      logger.info('客户端状态存储: 内存模式（Redis 失败回退）');
      return storeInstance;
    }
  }

  // 默认使用内存存储
  storeInstance = new MemoryClientStateStore();
  logger.info('客户端状态存储: 内存模式');
  return storeInstance;
}

export function getClientStateStore(): IClientStateStore {
  if (!storeInstance) {
    // 未初始化时默认使用内存存储
    storeInstance = new MemoryClientStateStore();
    logger.info('客户端状态存储: 内存模式（未初始化，使用默认）');
  }
  return storeInstance;
}

// 清理存储实例（用于测试或重置）
export function resetClientStateStore(): void {
  storeInstance = null;
}