// ============================================
// 华夏营造 - 用户浏览状态检测中间件
// 基于请求模式分析判断用户是否处于浏览状态
// ============================================

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { 
  getClientStateStore, 
  initClientStateStore,
  ClientState, 
  RequestRecord,
  BrowseState,
  StoreConfig 
} from './clientStateStore';

// 重新导出 BrowseState 以保持向后兼容
export { BrowseState } from './clientStateStore';

const logger = createLogger('BrowseState');

// 配置参数
const CONFIG = {
  // 活跃时间窗口（秒）
  ACTIVE_WINDOW: 30,
  // 空闲超时时间（秒）- 用户超过此时间无请求视为空闲（30分钟）
  IDLE_TIMEOUT: 1800,
  // 浏览模式判断阈值 - 连续读取请求数
  BROWSING_READ_THRESHOLD: 3,
  // 活跃模式判断阈值 - 请求频率（每分钟）
  ACTIVE_REQUEST_THRESHOLD: 20,
  // 请求历史保留数量
  MAX_REQUEST_HISTORY: 20,
  // 最大客户端状态存储数量（防止内存溢出）
  MAX_CLIENT_STATES: 10000,
  // 清理间隔（毫秒）- 每3分钟清理一次
  CLEANUP_INTERVAL: 180000,
  // 清理阈值倍数（超过 IDLE_TIMEOUT 的此倍数时清理）
  CLEANUP_THRESHOLD_MULTIPLIER: 1.5,
  // 爬虫用户代理关键字
  BOT_USER_AGENTS: [
    'bot', 'crawler', 'spider', 'scraper', 'bingbot', 'googlebot',
    'slurp', 'duckduckbot', 'yandexbot', 'sogou', 'baiduspider'
  ],
};

// 初始化存储（默认内存存储，可通过配置切换）
let storeInitialized = false;

export function initBrowseStateStore(config?: StoreConfig): void {
  if (config) {
    initClientStateStore(config);
  } else {
    // 默认使用内存存储（适合 2核2G 服务器）
    initClientStateStore({ type: 'memory' });
  }
  storeInitialized = true;
}

// 确保存储已初始化
function ensureStoreInitialized(): void {
  if (!storeInitialized) {
    initBrowseStateStore({ type: 'memory' });
  }
}

// ============================================
// 获取客户端唯一标识
// ============================================
function getClientId(req: Request): string {
  const ip = req.ip || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
             'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  return `${ip}:${userAgent}`;
}

// ============================================
// 检测是否为爬虫
// ============================================
function isBot(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return CONFIG.BOT_USER_AGENTS.some(bot => lowerUA.includes(bot));
}

// ============================================
// 判断请求是否为读取操作
// ============================================
function isReadOperation(method: string, path: string): boolean {
  const readMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (readMethods.includes(method)) {
    return true;
  }
  
  // POST请求但路径包含查询相关的也视为读取
  const readPaths = ['/search', '/query', '/list', '/get', '/find', '/view'];
  return readPaths.some(p => path.toLowerCase().includes(p));
}

// ============================================
// 计算客户端状态（异步版本）
// ============================================
async function calculateBrowseState(clientId: string, request: RequestRecord, userAgent: string): Promise<BrowseState> {
  const store = getClientStateStore();
  const state = await store.get(clientId);
  if (!state) {
    return 'active';
  }
  
  const now = Date.now();
  
  // 检查是否为爬虫
  if (isBot(userAgent)) {
    return 'bot';
  }
  
  // 检查是否空闲（长时间无请求）
  if (now - state.lastActive > CONFIG.IDLE_TIMEOUT * 1000) {
    return 'idle';
  }
  
  // 分析请求模式
  const recentRequests = state.requests.slice(-10);
  const recentReadCount = recentRequests.filter(r => isReadOperation(r.method, r.path)).length;
  const recentWriteCount = recentRequests.length - recentReadCount;
  
  // 判断浏览状态：高读取低写入
  if (state.consecutiveReads >= CONFIG.BROWSING_READ_THRESHOLD && recentWriteCount <= 1) {
    return 'browsing';
  }
  
  // 判断活跃状态：高频率请求
  const oneMinuteAgo = now - 60000;
  const requestsInLastMinute = state.requests.filter(r => r.timestamp >= oneMinuteAgo).length;
  
  if (requestsInLastMinute >= CONFIG.ACTIVE_REQUEST_THRESHOLD) {
    return 'active';
  }
  
  // 默认状态
  return 'active';
}

// ============================================
// 更新客户端状态（异步版本）
// ============================================
async function updateClientState(clientId: string, request: RequestRecord, userAgent: string): Promise<void> {
  const store = getClientStateStore();
  let state = await store.get(clientId);
  
  if (!state) {
    state = {
      requests: [],
      lastActive: Date.now(),
      browseState: 'active',
      requestCount: 0,
      consecutiveReads: 0,
      consecutiveWrites: 0,
    };
  }
  
  // 更新请求历史
  state.requests.push(request);
  if (state.requests.length > CONFIG.MAX_REQUEST_HISTORY) {
    state.requests.shift();
  }
  
  // 更新连续读取/写入计数
  const isRead = isReadOperation(request.method, request.path);
  if (isRead) {
    state.consecutiveReads++;
    state.consecutiveWrites = 0;
  } else {
    state.consecutiveWrites++;
    state.consecutiveReads = 0;
  }
  
  // 更新统计
  state.lastActive = Date.now();
  state.requestCount++;
  state.browseState = await calculateBrowseState(clientId, request, userAgent);
  
  await store.set(clientId, state);
  
  logger.debug('客户端状态更新', {
    clientId,
    browseState: state.browseState,
    requestCount: state.requestCount,
    consecutiveReads: state.consecutiveReads,
    requestsInHistory: state.requests.length,
  });
}

// ============================================
// 清理过期状态（定期清理 + LRU驱逐）
// ============================================
async function cleanupExpiredStates(): Promise<number> {
  const store = getClientStateStore();
  const now = Date.now();
  const cleanupThreshold = CONFIG.IDLE_TIMEOUT * 1000 * CONFIG.CLEANUP_THRESHOLD_MULTIPLIER;
  let cleanedCount = 0;

  // 第一步：清理超时的空闲客户端
  const entries = await store.entries();
  for (const [clientId, state] of entries) {
    if (now - state.lastActive > cleanupThreshold) {
      await store.delete(clientId);
      cleanedCount++;
    }
  }

  // 第二步：如果超过最大容量，执行LRU驱逐
  const currentSize = await store.size();
  if (currentSize > CONFIG.MAX_CLIENT_STATES) {
    // 按最后活跃时间排序（最久未活跃的在前）
    const sortedEntries = entries.sort((a, b) => a[1].lastActive - b[1].lastActive);

    // 删除最旧的 20% 条目
    const toDelete = Math.ceil(sortedEntries.length * 0.2);
    for (let i = 0; i < toDelete && i < sortedEntries.length; i++) {
      await store.delete(sortedEntries[i][0]);
      cleanedCount++;
    }

    logger.warn(`LRU驱逐: 客户端数量 ${currentSize} 超过限制，驱逐 ${toDelete} 条`);
  }

  if (cleanedCount > 0) {
    logger.info(`客户端状态清理完成: 清理 ${cleanedCount} 条，当前总数 ${await store.size()}`);
  }
  
  return cleanedCount;
}

// 启动时执行一次清理（异步）
cleanupExpiredStates().catch(err => logger.error('启动清理失败', { error: err }));

// 每3分钟清理一次过期状态
const cleanupTimer = setInterval(() => {
  cleanupExpiredStates().catch(err => logger.error('定时清理失败', { error: err }));
}, CONFIG.CLEANUP_INTERVAL);

// 优雅关闭时清理
process.on('SIGTERM', async () => {
  clearInterval(cleanupTimer);
  const store = getClientStateStore();
  await store.clear();
  logger.info('浏览状态中间件已清理');
});

// 获取客户端状态统计信息（用于监控）
export async function getClientStateStats() {
  ensureStoreInitialized();
  const store = getClientStateStore();
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  let activeCount = 0;
  let idleCount = 0;
  let recentActiveCount = 0;

  const entries = await store.entries();
  for (const state of entries.map(e => e[1])) {
    const timeSinceLastActive = now - state.lastActive;
    if (timeSinceLastActive < CONFIG.IDLE_TIMEOUT * 1000) {
      activeCount++;
    } else {
      idleCount++;
    }

    if (state.lastActive > oneHourAgo) {
      recentActiveCount++;
    }
  }

  const currentSize = await store.size();
  return {
    totalCount: currentSize,
    activeCount,
    idleCount,
    recentActiveCount,
    maxCapacity: CONFIG.MAX_CLIENT_STATES,
    utilizationRate: ((currentSize / CONFIG.MAX_CLIENT_STATES) * 100).toFixed(2) + '%',
  };
}

// 手动触发清理（供外部调用）
export async function triggerCleanup(): Promise<number> {
  ensureStoreInitialized();
  const sizeBefore = await getClientStateStore().size();
  await cleanupExpiredStates();
  const sizeAfter = await getClientStateStore().size();
  return sizeBefore - sizeAfter;
}

// 清除所有客户端状态（慎用）
export async function clearAllClientStates(): Promise<void> {
  ensureStoreInitialized();
  const store = getClientStateStore();
  await store.clear();
  logger.info('已清除所有客户端状态');
}

// ============================================
// 浏览状态检测中间件
// ============================================
export function browseStateDetection(req: Request, res: Response, next: NextFunction): void {
  ensureStoreInitialized();
  
  const clientId = getClientId(req);
  const userAgent = req.headers['user-agent'] || '';
  
  // 创建请求记录
  const requestRecord: RequestRecord = {
    timestamp: Date.now(),
    path: req.path,
    method: req.method,
  };
  
  // 异步更新客户端状态（不阻塞请求）
  updateClientState(clientId, requestRecord, userAgent)
    .then(async () => {
      // 获取当前浏览状态
      const store = getClientStateStore();
      const state = await store.get(clientId);
      const browseState = state?.browseState || 'active';
      
      // 将状态注入请求对象
      (req as any).browseState = browseState;
      (req as any).isBot = isBot(userAgent);
      
      logger.debug('浏览状态检测', {
        clientId: clientId.substring(0, 20) + '...',
        browseState,
        path: req.path,
        method: req.method,
        isBot: isBot(userAgent),
      });
      
      next();
    })
    .catch(err => {
      logger.error('浏览状态检测失败', { error: err });
      // 失败时使用默认状态，不阻塞请求
      (req as any).browseState = 'active';
      (req as any).isBot = isBot(userAgent);
      next();
    });
}

// ============================================
// 条件性数据输出包装器
// ============================================
export interface ConditionalResponseOptions {
  onlyInBrowseState?: boolean;
  onlyInActiveState?: boolean;
  skipForBots?: boolean;
  cacheTTL?: number; // 缓存时间（秒）
}

export function conditionalResponse(options: ConditionalResponseOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const req = args[0];
      const res = args[1];
      
      // 获取浏览状态
      const browseState: BrowseState = req.browseState || 'active';
      const isBotUser = req.isBot || false;
      
      // 检查是否跳过爬虫
      if (options.skipForBots && isBotUser) {
        logger.debug('跳过爬虫请求', { path: req.path });
        return res.status(204).send();
      }
      
      // 检查是否仅在浏览状态输出
      if (options.onlyInBrowseState && browseState !== 'browsing') {
        logger.debug('非浏览状态，跳过数据输出', { 
          path: req.path, 
          browseState 
        });
        return res.status(204).send();
      }
      
      // 检查是否仅在活跃状态输出
      if (options.onlyInActiveState && browseState === 'idle') {
        logger.debug('空闲状态，跳过数据输出', { 
          path: req.path, 
          browseState 
        });
        return res.status(204).send();
      }
      
      // 执行原始方法
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

// ============================================
// 快速检查函数
// ============================================
export function isInBrowseState(req: Request): boolean {
  return (req as any).browseState === 'browsing';
}

export function isInActiveState(req: Request): boolean {
  return (req as any).browseState === 'active';
}

export function isInIdleState(req: Request): boolean {
  return (req as any).browseState === 'idle';
}

export function isRequestFromBot(req: Request): boolean {
  return (req as any).isBot === true;
}