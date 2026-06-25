// ============================================
// 华夏营造 - 服务器保活服务
// ============================================
// 此服务用于防止2核2GiB服务器在长时间空闲后进入休眠状态
// 通过定期执行轻量级内部操作来保持进程活跃

import { createLogger } from '../utils/logger';
import { getClientStateStats } from '../middleware/browseState';

const logger = createLogger('ServerKeepAlive');

/**
 * 服务器保活服务配置
 */
interface KeepAliveConfig {
  enabled: boolean;
  interval: number; // 保活间隔（毫秒）
  healthCheckInterval: number; // 健康检查间隔（毫秒）
  maxIdleTime: number; // 最大空闲时间（毫秒）
}

/**
 * 保活服务状态
 */
type KeepAliveStatus = 'idle' | 'active' | 'paused';

// 默认配置
const defaultConfig: KeepAliveConfig = {
  enabled: true,
  interval: 30000, // 30秒执行一次保活操作
  healthCheckInterval: 120000, // 2分钟执行一次健康检查
  maxIdleTime: 1800000, // 30分钟最大空闲时间
};

// 服务状态
let config: KeepAliveConfig = { ...defaultConfig };
let status: KeepAliveStatus = 'idle';
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
let lastActivityTime = Date.now();
let requestCount = 0;

/**
 * 轻量级保活操作
 * 执行一些不产生外部请求的内部操作
 */
async function performKeepAlive(): Promise<void> {
  if (status !== 'active') return;

  try {
    // 1. 检查当前时间，更新最后活动时间
    lastActivityTime = Date.now();

    // 2. 执行轻量级内存操作（保持进程活跃）
    performMemoryOperation();

    // 3. 更新内部统计信息
    await updateInternalStats();

    // 4. 执行极轻量的数据库连接保持（如果有数据库连接）
    await maintainDbConnection();

    logger.debug('服务器保活操作执行成功', {
      timestamp: new Date().toISOString(),
      requestCount,
    });
  } catch (error) {
    logger.warn('服务器保活操作执行失败', {
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 轻量级内存操作
 * 执行一些简单的计算来保持CPU活跃
 */
function performMemoryOperation(): void {
  // 简单的数学计算，保持CPU活跃
  let result = 0;
  for (let i = 0; i < 1000; i++) {
    result += Math.sin(i) * Math.cos(i);
  }
  // 使用结果防止优化器移除这段代码
  if (result > 0) {
    // 空操作，仅为了使用result
  }
}

/**
 * 更新内部统计信息
 */
async function updateInternalStats(): Promise<void> {
  try {
    // 获取客户端状态统计（内部操作，不产生外部请求）
    await getClientStateStats();
  } catch {
    // 如果失败，静默处理
  }
}

/**
 * 保持数据库连接活跃
 */
async function maintainDbConnection(): Promise<void> {
  try {
    // 如果有数据库连接池，执行一个简单的查询来保持连接活跃
    // 这里只做检查，不执行实际查询
    const { isMockMode } = await import('../config/database');
    if (!isMockMode()) {
      // 在非mock模式下，可以执行一个简单的SELECT 1查询
      // 但这里我们不执行实际查询，只是检查连接状态
    }
  } catch {
    // 如果失败，静默处理
  }
}

/**
 * 执行健康检查
 */
async function performHealthCheck(): Promise<void> {
  if (status !== 'active') return;

  try {
    const currentTime = Date.now();
    const idleDuration = currentTime - lastActivityTime;

    logger.info('服务器健康检查', {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      idleDuration: Math.floor(idleDuration / 1000),
      requestCount,
      memoryUsage: process.memoryUsage(),
    });

    // 如果空闲时间过长，执行额外的保活操作
    if (idleDuration > config.maxIdleTime) {
      logger.warn('服务器空闲时间过长，执行增强保活操作', {
        idleDuration: Math.floor(idleDuration / 1000),
      });
      // 执行多次保活操作来唤醒系统
      for (let i = 0; i < 3; i++) {
        performMemoryOperation();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    logger.error('服务器健康检查失败', {
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 记录请求活动
 */
export function recordRequestActivity(): void {
  requestCount++;
  lastActivityTime = Date.now();
}

/**
 * 启动保活服务
 */
export function startKeepAliveService(customConfig?: Partial<KeepAliveConfig>): void {
  if (status === 'active') {
    logger.warn('服务器保活服务已在运行中');
    return;
  }

  // 应用自定义配置
  if (customConfig) {
    config = { ...config, ...customConfig };
  }

  if (!config.enabled) {
    logger.info('服务器保活服务已禁用');
    return;
  }

  logger.info('启动服务器保活服务', {
    interval: config.interval,
    healthCheckInterval: config.healthCheckInterval,
    maxIdleTime: config.maxIdleTime,
  });

  status = 'active';
  lastActivityTime = Date.now();

  // 启动保活定时器
  keepAliveTimer = setInterval(performKeepAlive, config.interval);

  // 启动健康检查定时器
  healthCheckTimer = setInterval(performHealthCheck, config.healthCheckInterval);

  // 立即执行一次保活操作
  performKeepAlive();

  logger.info('服务器保活服务启动成功');
}

/**
 * 停止保活服务
 */
export function stopKeepAliveService(): void {
  if (status !== 'active') {
    logger.warn('服务器保活服务未在运行');
    return;
  }

  logger.info('停止服务器保活服务');

  // 清除定时器
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }

  status = 'idle';

  logger.info('服务器保活服务停止成功');
}

/**
 * 获取保活服务状态
 */
export function getKeepAliveStatus(): {
  status: KeepAliveStatus;
  config: KeepAliveConfig;
  lastActivityTime: number;
  requestCount: number;
} {
  return {
    status,
    config,
    lastActivityTime,
    requestCount,
  };
}

/**
 * 暂停保活服务
 */
export function pauseKeepAliveService(): void {
  if (status !== 'active') {
    logger.warn('服务器保活服务未在运行');
    return;
  }

  status = 'paused';
  logger.info('服务器保活服务已暂停');
}

/**
 * 恢复保活服务
 */
export function resumeKeepAliveService(): void {
  if (status !== 'paused') {
    logger.warn('服务器保活服务未暂停');
    return;
  }

  status = 'active';
  lastActivityTime = Date.now();
  logger.info('服务器保活服务已恢复');
}
