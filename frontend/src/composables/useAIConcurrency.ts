// AI并发管理Hook - 改进版
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAIConcurrencyStore, type AIConcurrencyConfig } from '@/stores/aiConcurrency';
import { assistantApi } from '@/services/api';

export function useAIConcurrency() {
  const { t } = useI18n();
  const concurrencyStore = useAIConcurrencyStore();
  
  // 排队状态
  const isInQueue = ref(false);
  const queuePosition = ref(0);
  const waitingCount = ref(0);
  
  // 当前AI状态
  const currentAIId = ref<number | null>(null);
  const currentAIConcurrent = computed(() => {
    if (!currentAIId.value) return 0;
    return concurrencyStore.getActiveCount(currentAIId.value);
  });
  
  // 全局并发状态
  const globalConcurrent = computed(() => concurrencyStore.currentGlobalConcurrent);
  const globalMaxConcurrent = computed(() => concurrencyStore.globalMaxConcurrent);
  
  // 加载AI并发配置
  async function loadConfigs() {
    try {
      const res = await assistantApi.getAIList();
      if (res.success && res.data) {
        // 从AI列表中提取并发配置
        const configs: AIConcurrencyConfig[] = res.data.map((ai: any) => ({
          ai_id: ai.ai_id,
          max_concurrent: ai.max_concurrent || 3,
          max_queue_size: ai.max_queue_size || 20,
          queue_timeout: (ai.queue_timeout || 60) * 1000, // 转换为毫秒
        }));
        concurrencyStore.loadConfigs(configs);
      }
    } catch (error) {
      console.error('加载AI并发配置失败:', error);
    }
  }
  
  // 更新AI并发配置
  async function updateConfig(aiId: number, config: Partial<AIConcurrencyConfig>) {
    try {
      // TODO: 调用API保存配置到服务器
      concurrencyStore.updateConfig(aiId, config);
      return true;
    } catch (error) {
      console.error('更新AI并发配置失败:', error);
      return false;
    }
  }
  
  // 执行AI请求（带并发控制）
  async function executeWithConcurrency<T>(
    aiId: number,
    executor: () => Promise<T>,
    options?: {
      showQueueInfo?: boolean;
      onQueueUpdate?: (position: number, total: number) => void;
    }
  ): Promise<T> {
    currentAIId.value = aiId;
    
    // 监听队列更新
    const updateQueueInfo = () => {
      const total = concurrencyStore.getWaitingCount(aiId);
      if (isInQueue.value) {
        const position = concurrencyStore.getQueuePosition(`req_${aiId}_${Date.now()}`);
        queuePosition.value = position;
        waitingCount.value = total;
        options?.onQueueUpdate?.(position, total);
        
        // 继续更新直到不在队列中
        if (isInQueue.value) {
          setTimeout(updateQueueInfo, 500);
        }
      }
    };
    
    try {
      const result = await concurrencyStore.execute(aiId, executor);
      
      // 成功时重置状态
      isInQueue.value = false;
      queuePosition.value = 0;
      waitingCount.value = 0;
      
      return result;
    } catch (error) {
      // 失败时重置状态
      isInQueue.value = false;
      queuePosition.value = 0;
      waitingCount.value = 0;
      throw error;
    }
  }
  
  // 获取排队状态文本
  const queueStatusText = computed(() => {
    if (!isInQueue.value) return '';
    return t('ai.queueStatus', { position: queuePosition.value, total: waitingCount.value });
  });
  
  return {
    // 状态
    isInQueue,
    queuePosition,
    waitingCount,
    queueStatusText,
    currentAIId,
    currentAIConcurrent,
    globalConcurrent,
    globalMaxConcurrent,
    
    // 方法
    loadConfigs,
    updateConfig,
    executeWithConcurrency,
  };
}
