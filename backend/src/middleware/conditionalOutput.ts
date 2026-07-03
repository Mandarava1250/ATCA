// ============================================
// 华夏营造 - 条件性数据输出控制器
// 基于浏览状态智能控制数据输出，降低不必要的资源消耗
// ============================================

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { BrowseState, isInBrowseState, isRequestFromBot } from './browseState';
import { logCacheCleanup, logTimerStart, logTimerStop } from '../utils/memoryLifecycle';

const logger = createLogger('ConditionalOutput');

// ============================================
// 输出控制配置
// ============================================
export interface OutputControlConfig {
  // 仅在浏览状态输出
  browseOnly?: boolean;
  // 禁止爬虫访问
  blockBots?: boolean;
  // 最小响应间隔（毫秒）
  minInterval?: number;
  // 数据压缩阈值（字节）
  compressThreshold?: number;
  // 是否启用缓存
  enableCache?: boolean;
  // 缓存时间（秒）
  cacheTTL?: number;
}

// 默认配置
const DEFAULT_CONFIG: OutputControlConfig = {
  browseOnly: false,
  blockBots: true,
  minInterval: 0,
  compressThreshold: 1024,
  enableCache: true,
  cacheTTL: 60,
};

// 缓存存储
const responseCache = new Map<string, { data: any; timestamp: number }>();

// 客户端最后响应时间记录
const lastResponseTime = new Map<string, number>();

// ============================================
// 获取客户端标识
// ============================================
function getClientKey(req: Request): string {
  const ip = req.ip || 'unknown';
  const path = req.path;
  const query = JSON.stringify(req.query);
  return `${ip}:${path}:${query}`;
}

// ============================================
// 缓存管理
// ============================================
function getCachedResponse(key: string, ttl: number): any | null {
  const cached = responseCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > ttl * 1000) {
    responseCache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedResponse(key: string, data: any): void {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
  });
  enforceCacheLimits();
}

// 定期清理过期缓存
const conditionalCleanupTimer = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, cached] of responseCache.entries()) {
    if (now - cached.timestamp > 300000) { // 5分钟过期
      responseCache.delete(key);
      cleaned++;
    }
  }
  // 同时清理 lastResponseTime，防止无限增长
  for (const [key, time] of lastResponseTime.entries()) {
    if (now - time > 300000) { // 5分钟过期
      lastResponseTime.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logCacheCleanup('ConditionalOutput', cleaned, responseCache.size + lastResponseTime.size);
    logger.debug(`清理过期缓存: ${cleaned} 条`);
  }
}, 60000); // 每分钟清理一次
logTimerStart('ConditionalOutput', 'cleanup', 60000);

// 最大缓存数量限制，防止内存溢出
const MAX_CACHE_SIZE = 500;
function enforceCacheLimits(): void {
  if (responseCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(responseCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, Math.ceil(entries.length * 0.2));
    toDelete.forEach(([key]) => responseCache.delete(key));
    logger.warn(`responseCache 超过最大限制，删除 ${toDelete.length} 条旧记录`);
  }
  if (lastResponseTime.size > MAX_CACHE_SIZE) {
    const entries = Array.from(lastResponseTime.entries())
      .sort((a, b) => a[1] - b[1]);
    const toDelete = entries.slice(0, Math.ceil(entries.length * 0.2));
    toDelete.forEach(([key]) => lastResponseTime.delete(key));
    logger.warn(`lastResponseTime 超过最大限制，删除 ${toDelete.length} 条旧记录`);
  }
}

// ============================================
// 响应拦截包装器
// ============================================
export function createConditionalOutput(config: OutputControlConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  return (req: Request, res: Response, next: NextFunction) => {
    // 保存原始方法
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);
    
    // 获取浏览状态
    const browseState: BrowseState = (req as any).browseState || 'active';
    const isBot = isRequestFromBot(req);
    const clientKey = getClientKey(req);
    
    // 检查是否阻止爬虫
    if (mergedConfig.blockBots && isBot) {
      logger.debug('阻止爬虫访问', { path: req.path, ip: req.ip });
      res.status(403).json({
        success: false,
        error: {
          code: 'SEC_007',
          message: '爬虫访问被禁止',
          details: '本资源仅对人类用户开放',
        },
      });
      return;
    }
    
    // 检查是否仅在浏览状态输出
    if (mergedConfig.browseOnly && !isInBrowseState(req)) {
      logger.debug('非浏览状态，跳过数据输出', { 
        path: req.path, 
        browseState 
      });
      res.status(204).end();
      return;
    }
    
    // 检查最小响应间隔
    const minInterval = mergedConfig.minInterval ?? 0;
    if (minInterval > 0) {
      const lastTime = lastResponseTime.get(clientKey) || 0;
      const now = Date.now();
      
      if (now - lastTime < minInterval) {
        const cached = getCachedResponse(clientKey, mergedConfig.cacheTTL || 60);
        if (cached) {
          logger.debug('命中缓存（间隔限制）', { path: req.path });
          originalJson(cached);
          return;
        }
      }
      lastResponseTime.set(clientKey, now);
      enforceCacheLimits();
    }
    
    // 重写响应方法
    res.json = function(data: any) {
      // 检查缓存
      if (mergedConfig.enableCache) {
        const cached = getCachedResponse(clientKey, mergedConfig.cacheTTL || 60);
        if (cached) {
          logger.debug('命中缓存', { path: req.path });
          return originalJson(cached);
        }
        
        // 设置缓存
        setCachedResponse(clientKey, data);
      }
      
      // 记录响应
      logger.debug('数据输出', { 
        path: req.path, 
        browseState, 
        dataSize: JSON.stringify(data).length,
      });
      
      return originalJson(data);
    };
    
    res.send = function(body?: any) {
      return originalSend(body);
    };
    
    next();
  };
}

// ============================================
// 特定路由的条件输出中间件生成器
// ============================================
export function conditionalOutputForRoutes(
  routes: string[],
  config: OutputControlConfig = {}
) {
  const conditionalMiddleware = createConditionalOutput(config);
  
  return (req: Request, res: Response, next: NextFunction) => {
    const requestPath = req.path;
    
    // 检查是否匹配指定路由
    const matches = routes.some(route => {
      if (route.includes('*')) {
        const pattern = new RegExp('^' + route.replace('*', '.*') + '$');
        return pattern.test(requestPath);
      }
      return requestPath === route;
    });
    
    if (matches) {
      return conditionalMiddleware(req, res, next);
    }
    
    next();
  };
}

// ============================================
// 批量数据输出控制
// ============================================
export function batchConditionalOutput(
  req: Request,
  res: Response,
  dataProvider: () => Promise<any>,
  config: OutputControlConfig = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const browseState: BrowseState = (req as any).browseState || 'active';
  const isBot = isRequestFromBot(req);
  const clientKey = getClientKey(req);
  
  // 检查爬虫
  if (mergedConfig.blockBots && isBot) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'SEC_007',
        message: '爬虫访问被禁止',
      },
    });
  }
  
  // 检查浏览状态
  if (mergedConfig.browseOnly && !isInBrowseState(req)) {
    logger.debug('批量输出：非浏览状态跳过', { browseState });
    return res.status(204).end();
  }
  
  // 检查缓存
  if (mergedConfig.enableCache) {
    const cached = getCachedResponse(clientKey, mergedConfig.cacheTTL || 60);
    if (cached) {
      logger.debug('批量输出：命中缓存');
      return res.json(cached);
    }
  }
  
  // 执行数据提供者
  return dataProvider().then(data => {
    if (mergedConfig.enableCache) {
      setCachedResponse(clientKey, data);
    }
    logger.debug('批量输出：数据已生成', { dataSize: JSON.stringify(data).length });
    return res.json(data);
  }).catch(error => {
    logger.error('批量输出失败', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: '数据获取失败',
      },
    });
  });
}

// ============================================
// 响应数据精简器
// ============================================
export function trimResponseData(
  data: any,
  maxDepth: number = 3,
  maxArrayLength: number = 50,
  currentDepth: number = 0
): any {
  if (currentDepth >= maxDepth) {
    return '[深度限制]';
  }
  
  if (Array.isArray(data)) {
    if (data.length > maxArrayLength) {
      return data.slice(0, maxArrayLength).concat(`[...${data.length - maxArrayLength} 项]`);
    }
    return data.map(item => trimResponseData(item, maxDepth, maxArrayLength, currentDepth + 1));
  }
  
  if (typeof data === 'object' && data !== null) {
    const trimmed: Record<string, any> = {};
    const keys = Object.keys(data).slice(0, maxArrayLength);
    
    for (const key of keys) {
      trimmed[key] = trimResponseData(data[key], maxDepth, maxArrayLength, currentDepth + 1);
    }
    
    if (Object.keys(data).length > maxArrayLength) {
      trimmed['_truncated'] = `...${Object.keys(data).length - maxArrayLength} 个字段`;
    }
    
    return trimmed;
  }
  
  return data;
}

// ============================================
// 输出状态检查
// ============================================
export function canOutputData(req: Request, config?: OutputControlConfig): boolean {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const browseState: BrowseState = (req as any).browseState || 'active';
  
  if (mergedConfig.blockBots && isRequestFromBot(req)) {
    return false;
  }
  
  if (mergedConfig.browseOnly && !isInBrowseState(req)) {
    return false;
  }
  
  return true;
}