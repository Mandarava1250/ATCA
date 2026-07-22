// ============================================
// 筑见山河 - API请求缓存系统
// 实现SWR风格的请求级缓存策略
// 目标: 缓存命中率达到40%以上，减少重复网络请求
// ============================================

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiresAt: number;
  error?: Error;
  isValidating: boolean;
}

export interface CacheOptions {
  /** 缓存键 */
  key: string;
  /** 缓存过期时间（毫秒），默认5分钟 */
  ttl?: number;
  /** 是否在后台重新验证，默认true */
  revalidateOnFocus?: boolean;
  /** 重新验证间隔（毫秒），默认0（禁用） */
  revalidateInterval?: number;
  /** 是否启用缓存，默认true */
  enabled?: boolean;
}

export interface FetchOptions<T> extends CacheOptions {
  /** 获取数据的函数 */
  fetcher: () => Promise<T>;
  /** 是否强制刷新（忽略缓存） */
  forceRefresh?: boolean;
}

/**
 * 缓存管理器 - 统一管理API响应缓存
 */
class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private subscribers: Map<string, Set<(entry: CacheEntry) => void>> = new Map();
  private revalidateTimers: Map<string, NodeJS.Timeout> = new Map();
  private focusHandler: (() => void) | null = null;

  // 默认配置
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟
  private readonly MAX_CACHE_SIZE = 1000;

  constructor() {
    this.setupFocusHandler();
  }

  /**
   * 设置窗口焦点重新验证处理器
   */
  private setupFocusHandler(): void {
    if (typeof window === 'undefined') return;

    this.focusHandler = () => {
      this.revalidateAll();
    };

    window.addEventListener('focus', this.focusHandler);
  }

  /**
   * 生成缓存键
   */
  generateKey(endpoint: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return endpoint;
    }
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, unknown>);
    return `${endpoint}?${JSON.stringify(sortedParams)}`;
  }

  /**
   * 获取缓存条目
   */
  get<T>(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry as CacheEntry<T>;
  }

  /**
   * 设置缓存条目
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // 检查缓存大小
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      isValidating: false,
    };

    this.cache.set(key, entry);
    this.notifySubscribers(key, entry);
  }

  /**
   * 更新缓存条目（保留时间戳）
   */
  update<T>(key: string, data: T): void {
    const existing = this.cache.get(key);
    if (existing) {
      existing.data = data;
      existing.timestamp = Date.now();
      existing.isValidating = false;
      this.notifySubscribers(key, existing);
    }
  }

  /**
   * 删除缓存条目
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.clearRevalidateTimer(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    for (const timer of this.revalidateTimers.values()) {
      clearTimeout(timer);
    }
    this.revalidateTimers.clear();
  }

  /**
   * 按前缀删除缓存
   */
  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        this.clearRevalidateTimer(key);
      }
    }
  }

  /**
   * 使缓存失效（标记为需要重新验证）
   */
  invalidate(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expiresAt = 0;
    }
  }

  /**
   * 获取缓存数据，如果不存在或过期则调用fetcher获取
   */
  async fetch<T>(options: FetchOptions<T>): Promise<T> {
    const { key, fetcher, ttl = this.DEFAULT_TTL, forceRefresh = false, enabled = true } = options;

    // 如果禁用缓存，直接获取
    if (!enabled) {
      return fetcher();
    }

    // 检查缓存
    const cached = this.get<T>(key);

    // 如果强制刷新或缓存不存在/过期
    if (forceRefresh || !cached) {
      // 标记为正在验证
      this.setValidating(key, true);

      try {
        const data = await fetcher();
        this.set(key, data, ttl);
        return data;
      } catch (error) {
        // 如果有旧缓存数据，返回旧数据并记录错误
        if (cached) {
          console.warn(`[Cache] 获取失败，使用过期缓存: ${key}`, error);
          return cached.data;
        }
        throw error;
      } finally {
        this.setValidating(key, false);
      }
    }

    // 返回缓存数据
    // 如果接近过期时间，后台重新验证
    const timeUntilExpiry = cached.expiresAt - Date.now();
    if (timeUntilExpiry < ttl * 0.2) {
      this.backgroundRevalidate(key, fetcher, ttl);
    }

    return cached.data;
  }

  /**
   * 后台重新验证
   */
  private async backgroundRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    const entry = this.cache.get(key);
    if (entry?.isValidating) return;

    this.setValidating(key, true);

    try {
      const data = await fetcher();
      this.set(key, data, ttl);
    } catch (error) {
      console.warn(`[Cache] 后台重新验证失败: ${key}`, error);
    } finally {
      this.setValidating(key, false);
    }
  }

  /**
   * 设置验证状态
   */
  private setValidating(key: string, isValidating: boolean): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.isValidating = isValidating;
      this.notifySubscribers(key, entry);
    }
  }

  /**
   * 重新验证所有缓存
   */
  revalidateAll(): void {
    // 这个方法需要外部提供fetcher，所以只标记为过期
    for (const entry of this.cache.values()) {
      entry.expiresAt = Math.min(entry.expiresAt, Date.now() + 1000);
    }
  }

  /**
   * 设置定期重新验证
   */
  setRevalidateInterval(key: string, fetcher: () => Promise<unknown>, interval: number): void {
    this.clearRevalidateTimer(key);

    const timer = setInterval(async () => {
      try {
        const data = await fetcher();
        this.update(key, data);
      } catch (error) {
        console.warn(`[Cache] 定期重新验证失败: ${key}`, error);
      }
    }, interval);

    this.revalidateTimers.set(key, timer);
  }

  /**
   * 清除定期重新验证定时器
   */
  private clearRevalidateTimer(key: string): void {
    const timer = this.revalidateTimers.get(key);
    if (timer) {
      clearInterval(timer);
      this.revalidateTimers.delete(key);
    }
  }

  /**
   * 订阅缓存变化
   */
  subscribe(key: string, callback: (entry: CacheEntry) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // 返回取消订阅函数
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(key: string, entry: CacheEntry): void {
    const subs = this.subscribers.get(key);
    if (subs) {
      for (const callback of subs) {
        callback(entry);
      }
    }
  }

  /**
   * 驱逐最旧的缓存
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.expiresAt - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: 0, // 需要额外跟踪
      entries,
    };
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.clear();
    this.subscribers.clear();
    if (this.focusHandler && typeof window !== 'undefined') {
      window.removeEventListener('focus', this.focusHandler);
    }
  }
}

// 全局缓存管理器实例
export const cacheManager = new CacheManager();

// ============================================
// React/Vue Hook 风格的缓存使用接口
// ============================================

/**
 * 使用缓存的API请求
 * @example
 * const data = await useCachedApi({
 *   key: '/api/v1/models',
 *   fetcher: () => api.getModels(),
 *   ttl: 60000, // 1分钟
 * });
 */
export async function useCachedApi<T>(options: FetchOptions<T>): Promise<T> {
  return cacheManager.fetch(options);
}

/**
 * 使缓存失效
 * @example
 * invalidateCache('/api/v1/models');
 */
export function invalidateCache(keyOrPrefix: string): void {
  if (keyOrPrefix.includes('*')) {
    cacheManager.deleteByPrefix(keyOrPrefix.replace('*', ''));
  } else {
    cacheManager.invalidate(keyOrPrefix);
  }
}

/**
 * 预取数据到缓存
 */
export async function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<void> {
  try {
    const data = await fetcher();
    cacheManager.set(key, data, ttl);
  } catch (error) {
    console.warn(`[Cache] 预取失败: ${key}`, error);
  }
}