/**
 * 服务管理器
 * 统一管理心跳和API保活服务，提供智能协调
 */

import { ref, onMounted, onUnmounted, readonly } from 'vue';
import { heartbeatService } from './heartbeat';
import { keepAliveService } from './keepAlive';

// 全局状态
const isInitialized = ref(false);
const globalEnabled = ref(true);
const activityDetected = ref(false);

// 活动检测定时器
let activityTimer: ReturnType<typeof setTimeout> | null = null;
let managerTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 用户活动检测
 */
function handleUserActivity(): void {
  activityDetected.value = true;
  
  // 清除现有定时器
  if (activityTimer) {
    clearTimeout(activityTimer);
  }
  
  // 5分钟无活动后标记为非活跃
  activityTimer = setTimeout(() => {
    activityDetected.value = false;
  }, 5 * 60 * 1000);
  
  // 如果处于非活跃状态，尝试预热连接
  if (keepAliveService.status.value !== 'connected') {
    keepAliveService.prewarm();
  }
}

/**
 * 初始化服务
 */
function initialize(): void {
  if (isInitialized.value) {
    console.log('[ServiceManager] Already initialized');
    return;
  }

  console.log('[ServiceManager] Initializing services...');
  
  // 绑定用户活动监听
  if (typeof window !== 'undefined') {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });
  }
  
  // 延迟启动心跳服务（仅用于检测服务器状态，不用于保活）
  // 服务器保活已在后端实现，前端不再发送频繁请求
  setTimeout(() => {
    heartbeatService.start();
    console.log('[ServiceManager] Heartbeat service started (delayed)');
  }, 60000); // 60秒后启动（进一步延迟，减少初始请求压力）
  
  // 注意：API保活服务已禁用，服务器保活机制已在后端实现
  // 避免前端发送过多请求导致服务器压力
  
  isInitialized.value = true;
  console.log('[ServiceManager] Services initialized successfully (KeepAlive disabled - handled by backend)');
}

/**
 * 协调两个服务
 */
async function coordinate(): Promise<void> {
  if (!globalEnabled.value) {
    return;
  }

  // 如果心跳服务失败但保活服务正常，确保至少有一个服务在运行
  if (heartbeatService.status.value === 'error' && 
      keepAliveService.status.value === 'connected') {
    console.log('[ServiceManager] Heartbeat degraded, relying on KeepAlive service');
    heartbeatService.resetFailures();
    await heartbeatService.ping();
  }

  // 如果用户活跃，增加检测频率
  if (activityDetected.value) {
    if (keepAliveService.status.value !== 'connected') {
      await keepAliveService.refresh();
    }
  }
}

/**
 * 清理服务
 */
function cleanup(): void {
  console.log('[ServiceManager] Cleaning up services...');
  
  // 移除事件监听
  if (typeof window !== 'undefined') {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      window.removeEventListener(event, handleUserActivity);
    });
  }
  
  // 清除定时器
  if (activityTimer) {
    clearTimeout(activityTimer);
    activityTimer = null;
  }
  
  if (managerTimer) {
    clearInterval(managerTimer);
    managerTimer = null;
  }
  
  // 停止所有服务
  heartbeatService.stop();
  keepAliveService.stop();
  
  isInitialized.value = false;
  console.log('[ServiceManager] Services cleaned up');
}

/**
 * 启用/禁用服务
 */
function setEnabled(enabled: boolean): void {
  globalEnabled.value = enabled;
  
  if (enabled) {
    heartbeatService.start();
    keepAliveService.start();
  } else {
    heartbeatService.stop();
    keepAliveService.stop();
  }
}

/**
 * 手动触发刷新
 */
async function refresh(): Promise<void> {
  await Promise.all([
    heartbeatService.ping(),
    keepAliveService.refresh(),
  ]);
}

/**
 * 获取综合状态
 */
const status = {
  initialized: isInitialized,
  enabled: globalEnabled,
  activity: activityDetected,
  heartbeat: heartbeatService.status,
  keepAlive: keepAliveService.status,
  heartbeatLastCheck: heartbeatService.lastHeartbeat,
  keepAliveLastCheck: keepAliveService.lastConnection,
};

/**
 * 获取统计信息
 */
const statistics = {
  heartbeat: heartbeatService.statistics,
  keepAlive: keepAliveService.statistics,
};

/**
 * 导出管理器
 */
export const serviceManager = {
  // 状态
  isInitialized: readonly(isInitialized),
  isEnabled: readonly(globalEnabled),
  status,
  statistics,

  // 方法
  initialize,
  cleanup,
  setEnabled,
  refresh,
  heartbeat: heartbeatService,
  keepAlive: keepAliveService,
};

/**
 * 组合式API - 自动在组件中启用和清理服务
 */
export function useServiceManager() {
  onMounted(() => {
    if (!isInitialized.value) {
      initialize();
    }
  });

  onUnmounted(() => {
    // 不在组件卸载时清理，因为服务需要在全局运行
    // cleanup();
  });

  return {
    status,
    statistics,
    refresh,
    heartbeat: heartbeatService,
    keepAlive: keepAliveService,
  };
}
