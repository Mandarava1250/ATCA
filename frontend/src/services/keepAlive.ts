/**
 * API保活服务
 * 主动维持API连接活跃，支持智能预热和异常恢复
 */

import { ref, computed, readonly } from 'vue';
import { http } from './api';

// API健康检查端点（使用已存在的后端API）
const HEALTH_ENDPOINTS = [
  '/api/v1/health',
  '/api/v1/index/stats',
  '/api/v1/social/health',
];

// 配置
interface KeepAliveConfig {
  enabled: boolean;
  interval: number; // 检测间隔(ms)
  endpointIndex: number; // 当前使用的端点索引
  maxEndpointIndex: number; // 最大端点索引
  onStatusChange?: (status: ConnectionStatus) => void;
}

// 连接状态
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

// 服务状态
const config = ref<KeepAliveConfig>({
  enabled: true,
  interval: 3 * 60 * 1000, // 3分钟
  endpointIndex: 0,
  maxEndpointIndex: HEALTH_ENDPOINTS.length - 1,
});

const status = ref<ConnectionStatus>('idle');
const lastConnection = ref<number>(0);
const connectionAttempts = ref<number>(0);
const maxConsecutiveErrors = ref<number>(3);
const consecutiveErrors = ref<number>(0);
const isActive = ref<boolean>(false);
const errorLog = ref<string[]>([]);

// 定时器
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
let recoveryTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 记录错误日志
 */
function logError(message: string): void {
  const timestamp = new Date().toISOString();
  errorLog.value.push(`[${timestamp}] ${message}`);
  
  // 保留最近10条错误记录
  if (errorLog.value.length > 10) {
    errorLog.value.shift();
  }
}

/**
 * 状态变更通知
 */
function notifyStatusChange(newStatus: ConnectionStatus): void {
  if (config.value.onStatusChange) {
    config.value.onStatusChange(newStatus);
  }
}

/**
 * 执行健康检测
 */
async function checkHealth(): Promise<boolean> {
  const endpoint = HEALTH_ENDPOINTS[config.value.endpointIndex];
  
  try {
    status.value = 'connecting';
    connectionAttempts.value++;
    
    // 使用原生fetch实现超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      credentials: 'include',
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 检查API响应格式
    if (data && (data.success !== undefined || data.code === 200)) {
      lastConnection.value = Date.now();
      consecutiveErrors.value = 0;
      status.value = 'connected';
      notifyStatusChange('connected');
      return true;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error: any) {
    consecutiveErrors.value++;
    const errorMsg = error.message || 'Unknown error';
    logError(`Health check failed: ${errorMsg}`);
    
    // 尝试下一个端点
    if (config.value.endpointIndex < config.value.maxEndpointIndex) {
      config.value.endpointIndex++;
      logError(`Switching to endpoint: ${HEALTH_ENDPOINTS[config.value.endpointIndex]}`);
    } else {
      config.value.endpointIndex = 0; // 重置到第一个端点
    }
    
    if (consecutiveErrors.value >= maxConsecutiveErrors.value) {
      status.value = 'error';
      notifyStatusChange('error');
    } else {
      status.value = 'disconnected';
      notifyStatusChange('disconnected');
    }
    
    return false;
  }
}

/**
 * 智能预热 - 在用户活动时提前建立连接
 */
async function prewarm(): Promise<void> {
  if (!config.value.enabled || status.value === 'connected') {
    return;
  }
  
  console.log('[KeepAlive] Prewarming connection...');
  await checkHealth();
}

/**
 * 启动服务
 */
async function start(): Promise<void> {
  if (isActive.value) {
    console.log('[KeepAlive] Service is already active');
    return;
  }

  isActive.value = true;
  console.log('[KeepAlive] Starting API Keep-Alive service...');

  // 立即执行一次健康检测
  await checkHealth();

  // 设置定期检测
  keepAliveTimer = setInterval(async () => {
    if (!config.value.enabled) {
      return;
    }
    
    const success = await checkHealth();
    
    if (!success && consecutiveErrors.value < maxConsecutiveErrors.value) {
      // 触发恢复机制
      scheduleRecovery();
    }
  }, config.value.interval);

  console.log(`[KeepAlive] Service started with interval: ${config.value.interval}ms`);
}

/**
 * 停止服务
 */
function stop(): void {
  if (!isActive.value) {
    return;
  }

  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  if (recoveryTimer) {
    clearTimeout(recoveryTimer);
    recoveryTimer = null;
  }

  isActive.value = false;
  status.value = 'idle';
  console.log('[KeepAlive] Service stopped');
}

/**
 * 调度恢复机制
 */
function scheduleRecovery(): void {
  if (recoveryTimer) {
    return; // 已有恢复计划
  }

  const delay = Math.min(30000, Math.pow(2, consecutiveErrors.value) * 5000); // 指数退避，最大30秒
  
  console.log(`[KeepAlive] Scheduling recovery in ${delay}ms`);
  
  recoveryTimer = setTimeout(async () => {
    recoveryTimer = null;
    console.log('[KeepAlive] Attempting recovery...');
    await checkHealth();
    
    if (status.value !== 'connected') {
      scheduleRecovery(); // 继续尝试
    }
  }, delay);
}

/**
 * 手动刷新连接
 */
async function refresh(): Promise<boolean> {
  return await checkHealth();
}

/**
 * 更新配置
 */
function updateConfig(newConfig: Partial<KeepAliveConfig>): void {
  const wasActive = isActive.value;
  
  if (wasActive) {
    stop();
  }

  config.value = { ...config.value, ...newConfig };

  if (wasActive && config.value.enabled) {
    start();
  }
}

/**
 * 重置错误计数
 */
function resetErrors(): void {
  consecutiveErrors.value = 0;
  errorLog.value = [];
}

/**
 * 获取服务统计
 */
const statistics = computed(() => ({
  status: status.value,
  lastConnection: lastConnection.value,
  connectionAttempts: connectionAttempts.value,
  consecutiveErrors: consecutiveErrors.value,
  isActive: isActive.value,
  errorLog: [...errorLog.value],
  endpoint: HEALTH_ENDPOINTS[config.value.endpointIndex],
  nextCheckIn: lastConnection.value > 0 
    ? Math.max(0, config.value.interval - (Date.now() - lastConnection.value))
    : 0,
}));

/**
 * 导出服务
 */
export const keepAliveService = {
  // 状态
  status: readonly(status),
  lastConnection: readonly(lastConnection),
  connectionAttempts: readonly(connectionAttempts),
  consecutiveErrors: readonly(consecutiveErrors),
  isActive: readonly(isActive),
  errorLog: readonly(errorLog),
  config: readonly(config),
  statistics,

  // 方法
  start,
  stop,
  refresh,
  prewarm,
  updateConfig,
  resetErrors,
};

// 组合式API版本
export function useKeepAlive() {
  return {
    // 状态
    status,
    lastConnection,
    connectionAttempts,
    consecutiveErrors,
    isActive,
    errorLog,
    statistics,

    // 方法
    start,
    stop,
    refresh,
    prewarm,
    updateConfig,
    resetErrors,
  };
}
