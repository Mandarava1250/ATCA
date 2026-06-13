// AI并发管理器 - 改进版
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface AIConcurrencyConfig {
  ai_id: number;
  max_concurrent: number;
  max_queue_size: number;
  queue_timeout: number;
}

export interface QueuedRequest {
  id: string;
  ai_id: number;
  timestamp: number;
  executor: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export const useAIConcurrencyStore = defineStore('aiConcurrency', () => {
  // 每个AI的并发配置
  const configs = ref<Map<number, AIConcurrencyConfig>>(new Map());
  
  // 当前正在进行的请求计数
  const activeCounts = ref<Map<number, number>>(new Map());
  
  // 等待队列
  const queue = ref<QueuedRequest[]>([]);
  
  // 全局并发限制（默认5个）
  const globalMaxConcurrent = ref(5);
  
  // 当前全局并发计数
  const currentGlobalCount = ref(0);
  
  // 计算当前总并发数
  const currentGlobalConcurrent = computed(() => currentGlobalCount.value);

  // 获取某个AI的配置
  function getConfig(aiId: number): AIConcurrencyConfig {
    return configs.value.get(aiId) || {
      ai_id: aiId,
      max_concurrent: 3,
      max_queue_size: 20,
      queue_timeout: 60000,
    };
  }

  // 获取某个AI的当前并发数
  function getActiveCount(aiId: number): number {
    return activeCounts.value.get(aiId) || 0;
  }

  // 检查是否可以立即执行
  function canExecute(aiId: number): boolean {
    const config = getConfig(aiId);
    const aiActiveCount = getActiveCount(aiId);
    const globalActiveCount = currentGlobalCount.value;
    
    return aiActiveCount < config.max_concurrent && globalActiveCount < globalMaxConcurrent.value;
  }

  // 获取队列位置
  function getQueuePosition(requestId: string): number {
    return queue.value.findIndex(r => r.id === requestId) + 1;
  }

  // 获取等待中的请求数
  function getWaitingCount(aiId?: number): number {
    if (aiId !== undefined) {
      return queue.value.filter(r => r.ai_id === aiId).length;
    }
    return queue.value.length;
  }

  // 请求执行
  async function execute<T>(
    aiId: number,
    executor: () => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = `req_${aiId}_${Date.now()}_${Math.random()}`;
      
      // 如果可以立即执行
      if (canExecute(aiId)) {
        // 增加计数
        activeCounts.value.set(aiId, getActiveCount(aiId) + 1);
        currentGlobalCount.value++;
        
        executor()
          .then(result => {
            activeCounts.value.set(aiId, Math.max(0, getActiveCount(aiId) - 1));
            currentGlobalCount.value = Math.max(0, currentGlobalCount.value - 1);
            resolve(result);
            // 处理队列中的下一个请求
            processNextInQueue();
          })
          .catch(error => {
            activeCounts.value.set(aiId, Math.max(0, getActiveCount(aiId) - 1));
            currentGlobalCount.value = Math.max(0, currentGlobalCount.value - 1);
            reject(error);
            // 即使出错也要处理队列中的下一个请求
            processNextInQueue();
          });
      } else {
        // 加入队列
        const config = getConfig(aiId);
        const aiQueueSize = getWaitingCount(aiId);
        
        if (aiQueueSize >= config.max_queue_size) {
          reject(new Error('Queue is full, please try again later'));
          return;
        }
        
        const queuedRequest: QueuedRequest = {
          id: requestId,
          ai_id: aiId,
          timestamp: Date.now(),
          executor,
          resolve,
          reject,
        };
        
        queue.value.push(queuedRequest);
        
        // 设置超时
        const timeout = setTimeout(() => {
          const index = queue.value.findIndex(r => r.id === requestId);
          if (index !== -1) {
            queue.value.splice(index, 1);
            reject(new Error('Request timeout'));
            // 处理队列中的下一个请求
            processNextInQueue();
          }
        }, config.queue_timeout);
        
        // 覆盖resolve/reject来清除超时
        queuedRequest.resolve = (value) => {
          clearTimeout(timeout);
          // 从队列中移除
          const index = queue.value.findIndex(r => r.id === requestId);
          if (index !== -1) {
            queue.value.splice(index, 1);
          }
          resolve(value);
        };
        queuedRequest.reject = (error) => {
          clearTimeout(timeout);
          // 从队列中移除
          const index = queue.value.findIndex(r => r.id === requestId);
          if (index !== -1) {
            queue.value.splice(index, 1);
          }
          reject(error);
          // 处理队列中的下一个请求
          processNextInQueue();
        };
      }
    });
  }

  // 处理队列中的下一个请求
  function processNextInQueue() {
    if (queue.value.length === 0) return;
    
    // 直接遍历队列（队列已按时间戳顺序排列，FIFO）
    // 找到第一个可执行的请求
    for (const request of queue.value) {
      if (canExecute(request.ai_id)) {
        // 增加计数
        activeCounts.value.set(request.ai_id, getActiveCount(request.ai_id) + 1);
        currentGlobalCount.value++;
        
        // 从队列中移除
        const index = queue.value.findIndex(r => r.id === request.id);
        if (index !== -1) {
          queue.value.splice(index, 1);
        }
        
        // 执行请求
        request.executor()
          .then(result => {
            activeCounts.value.set(request.ai_id, Math.max(0, getActiveCount(request.ai_id) - 1));
            currentGlobalCount.value = Math.max(0, currentGlobalCount.value - 1);
            request.resolve(result);
            // 递归处理队列中的下一个
            processNextInQueue();
          })
          .catch(error => {
            activeCounts.value.set(request.ai_id, Math.max(0, getActiveCount(request.ai_id) - 1));
            currentGlobalCount.value = Math.max(0, currentGlobalCount.value - 1);
            request.reject(error);
            // 即使出错也要处理队列中的下一个
            processNextInQueue();
          });
        
        // 只处理队列中的第一个可用请求
        break;
      }
    }
  }

  // 更新配置
  function updateConfig(aiId: number, config: Partial<AIConcurrencyConfig>) {
    const current = getConfig(aiId);
    configs.value.set(aiId, { ...current, ...config });
  }

  // 设置全局并发限制
  function setGlobalMaxConcurrent(max: number) {
    globalMaxConcurrent.value = max;
    // 尝试处理队列
    processNextInQueue();
  }

  // 从服务器加载配置
  function loadConfigs(serverConfigs: AIConcurrencyConfig[]) {
    configs.value.clear();
    serverConfigs.forEach(config => {
      configs.value.set(config.ai_id, config);
    });
  }

  // 清除某个AI的队列
  function clearQueue(aiId?: number) {
    if (aiId !== undefined) {
      const requests = queue.value.filter(r => r.ai_id === aiId);
      requests.forEach(r => r.reject(new Error('Queue cleared')));
      queue.value = queue.value.filter(r => r.ai_id !== aiId);
    } else {
      queue.value.forEach(r => r.reject(new Error('Queue cleared')));
      queue.value = [];
    }
    // 尝试处理剩余的队列
    processNextInQueue();
  }

  return {
    configs,
    activeCounts,
    queue,
    globalMaxConcurrent,
    currentGlobalConcurrent,
    getConfig,
    getActiveCount,
    canExecute,
    getQueuePosition,
    getWaitingCount,
    execute,
    processNextInQueue,
    updateConfig,
    setGlobalMaxConcurrent,
    loadConfigs,
    clearQueue,
  };
});
