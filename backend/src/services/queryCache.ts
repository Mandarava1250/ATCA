// ============================================
// 华夏营造 - 数据库查询缓存服务
// 实现高效的查询缓存策略，减少数据库压力
// ============================================

import { createLogger } from '../utils/logger';
import { query as dbQuery } from '../config/database';
import { logCacheCleanup } from '../utils/memoryLifecycle';

const logger = createLogger('QueryCache');

// 缓存项接口
interface CacheEntry {
  data: any;
  timestamp: number;
  hitCount: number;
  lastAccess: number;
  ttl: number; // 每条缓存的过期时间（秒），支持自定义
}

// 缓存配置
interface CacheConfig {
  ttl: number; // 过期时间（秒）
  maxSize: number; // 最大缓存条目数
  enabled: boolean; // 是否启用缓存
}

// 默认配置
const DEFAULT_CONFIG: CacheConfig = {
  ttl: 300, // 5分钟
  maxSize: 1000,
  enabled: true,
};

// 全局缓存存储
class QueryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 定期清理过期缓存
    if (this.config.enabled) {
      setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
    }
    
    logger.info('查询缓存服务已初始化', { config: this.config });
  }

  // 生成缓存键
  generateKey(dbName: string, sql: string, params: any = {}): string {
    const paramsStr = JSON.stringify(params);
    return `${dbName}:${sql}:${paramsStr}`;
  }

  // 获取缓存
  get(dbName: string, sql: string, params: any = {}): any | null {
    if (!this.config.enabled) return null;

    const key = this.generateKey(dbName, sql, params);
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // 检查是否过期（使用缓存条目的自定义TTL）
    const effectiveTtl = entry.ttl ?? this.config.ttl;
    if (Date.now() - entry.timestamp > effectiveTtl * 1000) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // 更新访问时间和命中计数
    entry.hitCount++;
    entry.lastAccess = Date.now();
    this.hitCount++;

    logger.debug('缓存命中', { key: key.substring(0, 50), hitCount: entry.hitCount });
    return entry.data;
  }

  // 设置缓存（支持自定义TTL）
  set(dbName: string, sql: string, params: any, data: any, ttl?: number): void {
    if (!this.config.enabled) return;

    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    const key = this.generateKey(dbName, sql, params);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      hitCount: 1,
      lastAccess: Date.now(),
      ttl: ttl ?? this.config.ttl, // 使用自定义TTL或默认TTL
    };

    this.cache.set(key, entry);
    logger.debug('缓存设置', { key: key.substring(0, 50), dataSize: JSON.stringify(data).length, ttl: entry.ttl });
  }

  // 缓存驱逐策略（增强型LRU）
  evict(): void {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    // 考虑 TTL、访问频率和最后访问时间
    entries.sort((a, b) => {
      const aTtlRemaining = (a[1].ttl * 1000) - (now - a[1].timestamp);
      const bTtlRemaining = (b[1].ttl * 1000) - (now - b[1].timestamp);

      // 优先删除已过期的
      if (aTtlRemaining <= 0) return -1;
      if (bTtlRemaining <= 0) return 1;

      // TTL 剩余比例较小但命中次数较少的优先删除
      const aScore = a[1].lastAccess - (a[1].hitCount * 1000);
      const bScore = b[1].lastAccess - (b[1].hitCount * 1000);
      return aScore - bScore;
    });

    // 删除前10%的条目
    const toDelete = Math.ceil(entries.length * 0.1) || 1;
    let deleted = 0;
    for (let i = 0; i < toDelete; i++) {
      const entry = entries[i];
      const ttlRemaining = (entry[1].ttl * 1000) - (now - entry[1].timestamp);
      // 不删除 TTL 还剩 50% 以上的高频热点数据
      if (ttlRemaining > entry[1].ttl * 500 && entry[1].hitCount > 5) {
        continue;
      }
      this.cache.delete(entry[0]);
      deleted++;
    }

    logger.debug(`缓存驱逐: 删除 ${deleted} 条记录`);
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    let deleted = 0;

    for (const [key, entry] of this.cache.entries()) {
      // 使用缓存条目的自定义TTL，如果没有则使用全局TTL
      const effectiveTtl = entry.ttl ?? this.config.ttl;
      if (now - entry.timestamp > effectiveTtl * 1000) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      logCacheCleanup('QueryCache', deleted, this.cache.size);
      logger.debug(`缓存清理: 删除 ${deleted} 条过期记录`);
    }
  }

  // 清除指定缓存
  clear(dbName?: string): void {
    if (dbName) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(dbName)) {
          this.cache.delete(key);
        }
      }
      logger.debug(`清除 ${dbName} 相关缓存`);
    } else {
      this.cache.clear();
      logger.debug('清除所有缓存');
    }
  }

  // 获取缓存统计
  getStats() {
    const hitRate = this.hitCount + this.missCount > 0
      ? ((this.hitCount / (this.hitCount + this.missCount)) * 100).toFixed(2)
      : '0.00';

    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: `${hitRate}%`,
    };
  }

  // 禁用缓存
  disable(): void {
    this.config.enabled = false;
    this.cache.clear();
    logger.info('查询缓存已禁用');
  }

  // 启用缓存
  enable(): void {
    this.config.enabled = true;
    logger.info('查询缓存已启用');
  }
}

// 创建全局缓存实例
export const queryCache = new QueryCache();

// ============================================
// 缓存装饰器
// ============================================
export function cached(ttl?: number) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // 获取参数用于生成缓存键
      const dbName = args[0];
      const sql = args[1];
      const params = args[2] || {};

      // 尝试从缓存获取
      const cachedData = queryCache.get(dbName, sql, params);
      if (cachedData !== null) {
        return cachedData;
      }

      // 执行原始方法
      const result = await originalMethod.apply(this, args);

      // 存入缓存（直接传递自定义TTL，避免并发问题）
      queryCache.set(dbName, sql, params, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// ============================================
// 缓存辅助函数
// ============================================

// 批量查询缓存（支持并行查询）
export async function cachedBatchQuery(
  dbName: 'user' | 'architecture' | 'competition' | 'activity' | 'media3d' | 'social',
  queries: Array<{ sql: string; params?: any; ttl?: number }>
): Promise<any[]> {
  // 分离已缓存和未缓存的查询
  const cachedResults: (any | null)[] = new Array(queries.length).fill(null);
  const uncachedIndices: number[] = [];
  const uncachedQueries: Array<{ sql: string; params?: any; ttl?: number }> = [];

  // 第一步：检查缓存
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const cachedData = queryCache.get(dbName, query.sql, query.params);
    if (cachedData !== null) {
      cachedResults[i] = cachedData;
    } else {
      uncachedIndices.push(i);
      uncachedQueries.push(query);
    }
  }

  // 第二步：并行执行未缓存的查询
  if (uncachedQueries.length > 0) {
    const promises = uncachedQueries.map(async (query) => {
      const result = await dbQuery(dbName, query.sql, query.params, false); // 不使用缓存，我们自己处理
      return { result, query };
    });

    const dbResults = await Promise.all(promises);

    // 第三步：将结果填入对应位置并更新缓存
    for (let i = 0; i < dbResults.length; i++) {
      const { result, query } = dbResults[i];
      const originalIndex = uncachedIndices[i];
      cachedResults[originalIndex] = result;

      // 更新缓存（支持自定义TTL）
      queryCache.set(dbName, query.sql, query.params, result, query.ttl);
    }

    logger.info(`批量查询完成: ${queries.length} 条查询, 缓存命中 ${queries.length - uncachedQueries.length} 条, 数据库查询 ${uncachedQueries.length} 条`);
  }

  return cachedResults;
}

// 缓存预热（支持自定义TTL）
export async function warmupCache(
  dbName: string,
  queries: Array<{ sql: string; params?: any; data: any; ttl?: number }>
): Promise<void> {
  for (const query of queries) {
    queryCache.set(dbName, query.sql, query.params, query.data, query.ttl);
  }
  logger.info(`缓存预热完成: ${queries.length} 条记录`);
}

// 获取缓存统计信息
export function getCacheStats() {
  return queryCache.getStats();
}