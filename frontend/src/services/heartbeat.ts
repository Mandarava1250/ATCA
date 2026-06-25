/**
 * 服务器保活服务
 * 自动维持服务器活跃状态，无需用户手动唤醒
 * 支持异常恢复和自动重连
 */

import { ref, computed, readonly } from 'vue';

// 服务器状态
export type ServerStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// 配置
interface HeartbeatConfig {
  url: string; // 保活端点
  interval: number; // 心跳间隔(ms)，默认5分钟
  timeout: number; // 请求超时(ms)
  retryCount: number; // 失败重试次数
  retryDelay: number; // 重试延迟(ms)
  enabled: boolean; // 是否启用
}

// 默认配置
const defaultConfig: HeartbeatConfig = {
  url: '/api/v1/health',
  interval: 10 * 60 * 1000, // 10分钟（增加间隔减少请求）
  timeout: 10000, // 10秒
  retryCount: 3,
  retryDelay: 5000, // 5秒（增加重试延迟）
  enabled: true,
};

// 服务状态
const config = ref<HeartbeatConfig>({ ...defaultConfig });
const status = ref<ServerStatus>('disconnected');
const lastHeartbeat = ref<number>(0);
const consecutiveFailures = ref<number>(0);
const isRunning = ref<boolean>(false);
const errorMessage = ref<string>('');

// 定时器
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 执行心跳检测
 */
async function performHeartbeat(): Promise<boolean> {
  if (!config.value.enabled) {
    status.value = 'disconnected';
    return false;
  }

  status.value = 'connecting';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.value.timeout);

    const response = await fetch(config.value.url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache',
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      lastHeartbeat.value = Date.now();
      consecutiveFailures.value = 0;
      errorMessage.value = '';
      status.value = 'connected';
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    consecutiveFailures.value++;
    errorMessage.value = error.message || 'Unknown error';
    status.value = 'error';
    return false;
  }
}

/**
 * 重试机制
 */
async function retryWithBackoff(): Promise<void> {
  if (consecutiveFailures.value >= config.value.retryCount) {
    status.value = 'disconnected';
    console.warn(`[Heartbeat] Max retries (${config.value.retryCount}) reached. Will retry after next interval.`);
    return;
  }

  const delay = config.value.retryDelay * Math.pow(2, consecutiveFailures.value - 1);
  
  console.log(`[Heartbeat] Retrying in ${delay}ms (attempt ${consecutiveFailures.value}/${config.value.retryCount})`);
  
  retryTimer = setTimeout(async () => {
    const success = await performHeartbeat();
    if (!success && consecutiveFailures.value < config.value.retryCount) {
      await retryWithBackoff();
    }
  }, delay);
}

/**
 * 启动心跳服务
 */
async function start(): Promise<void> {
  if (isRunning.value) {
    console.log('[Heartbeat] Service is already running');
    return;
  }

  isRunning.value = true;
  console.log('[Heartbeat] Service starting...');

  // 立即执行一次心跳检测
  const success = await performHeartbeat();
  
  if (!success) {
    await retryWithBackoff();
  }

  // 设置定期心跳
  heartbeatTimer = setInterval(async () => {
    const success = await performHeartbeat();
    
    if (!success) {
      console.warn(`[Heartbeat] Heartbeat failed, consecutive failures: ${consecutiveFailures.value}`);
      await retryWithBackoff();
    }
  }, config.value.interval);

  console.log(`[Heartbeat] Service started with interval: ${config.value.interval}ms`);
}

/**
 * 停止心跳服务
 */
function stop(): void {
  if (!isRunning.value) {
    return;
  }

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  isRunning.value = false;
  status.value = 'disconnected';
  console.log('[Heartbeat] Service stopped');
}

/**
 * 手动触发心跳
 */
async function ping(): Promise<boolean> {
  return await performHeartbeat();
}

/**
 * 更新配置
 */
function updateConfig(newConfig: Partial<HeartbeatConfig>): void {
  const wasRunning = isRunning.value;
  
  if (wasRunning) {
    stop();
  }

  config.value = { ...config.value, ...newConfig };

  if (wasRunning) {
    start();
  }
}

/**
 * 重置失败计数
 */
function resetFailures(): void {
  consecutiveFailures.value = 0;
  errorMessage.value = '';
}

/**
 * 获取服务统计信息
 */
const statistics = computed(() => ({
  status: status.value,
  lastHeartbeat: lastHeartbeat.value,
  consecutiveFailures: consecutiveFailures.value,
  isRunning: isRunning.value,
  errorMessage: errorMessage.value,
  config: { ...config.value },
  uptime: lastHeartbeat.value > 0 ? Date.now() - lastHeartbeat.value : 0,
}));

/**
 * 导出服务
 */
export const heartbeatService = {
  // 状态
  status: readonly(status),
  lastHeartbeat: readonly(lastHeartbeat),
  consecutiveFailures: readonly(consecutiveFailures),
  isRunning: readonly(isRunning),
  errorMessage: readonly(errorMessage),
  config: readonly(config),
  statistics,

  // 方法
  start,
  stop,
  ping,
  updateConfig,
  resetFailures,
};

// 响应式版本
export function useHeartbeat() {
  return {
    // 状态
    status,
    lastHeartbeat,
    consecutiveFailures,
    isRunning,
    errorMessage,
    statistics,

    // 方法
    start,
    stop,
    ping,
    updateConfig,
    resetFailures,
  };
}
