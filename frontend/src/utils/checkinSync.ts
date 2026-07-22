import { activityApi } from '@/services/api';

interface SyncError {
  date: string;
  message: string;
}

// 指数退避配置
const BACKOFF_CONFIG = {
  initialDelay: 1000,    // 1秒
  maxDelay: 30000,       // 30秒
  factor: 2,             // 倍增因子
  maxRetries: 5,         // 最大重试次数
};

/**
 * 带指数退避的同步 pending 打卡
 * 每次重试间隔递增：1s → 2s → 4s → 8s → 16s → 30s(max)
 */
export async function syncPendingCheckins(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  const pending = JSON.parse(localStorage.getItem('atca_pending_checkins') || '[]');
  if (!Array.isArray(pending) || pending.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  const errors: SyncError[] = [];
  let syncedCount = 0;

  for (const date of pending) {
    let retryCount = 0;
    let success = false;

    while (!success && retryCount <= BACKOFF_CONFIG.maxRetries) {
      try {
        const res = await activityApi.checkin({
          device_type: getDeviceType(),
          device_info: navigator.userAgent.substring(0, 200),
          checkin_date: date,
        });

        if (res.success || res.already_checked) {
          syncedCount++;
          success = true;
        } else {
          // 服务器返回错误，重试
          retryCount++;
          if (retryCount > BACKOFF_CONFIG.maxRetries) {
            errors.push({ date, message: `日期 ${date} 同步失败: ${res.message}` });
          } else {
            await wait(calculateBackoff(retryCount));
          }
        }
      } catch (e: any) {
        // 网络异常，重试
        retryCount++;
        if (retryCount > BACKOFF_CONFIG.maxRetries) {
          errors.push({ date, message: `日期 ${date} 同步异常: ${e.message}` });
        } else {
          await wait(calculateBackoff(retryCount));
        }
      }
    }
  }

  if (syncedCount > 0) {
    const remaining = pending.filter((d: string) => !errors.some(e => e.date === d));
    if (remaining.length === 0) {
      localStorage.removeItem('atca_pending_checkins');
    } else {
      localStorage.setItem('atca_pending_checkins', JSON.stringify(remaining));
    }
  }

  return {
    success: errors.length === 0,
    syncedCount,
    errors: errors.map(e => e.message),
  };
}

/**
 * 计算指数退避延迟
 */
function calculateBackoff(retryCount: number): number {
  const delay = BACKOFF_CONFIG.initialDelay * Math.pow(BACKOFF_CONFIG.factor, retryCount - 1);
  return Math.min(delay, BACKOFF_CONFIG.maxDelay);
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getDeviceType(): string {
  if (/Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return 'mobile';
  } else if (/Tablet|iPad/.test(navigator.userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

export function scheduleCheckinSync(): () => void {
  const handleOnline = async () => { await syncPendingCheckins(); };
  window.addEventListener('online', handleOnline);

  const intervalId = setInterval(() => {
    const lastSync = parseInt(localStorage.getItem('atca_checkin_sync_time') || '0');
    const now = Date.now();
    if (now - lastSync > 300000) {
      syncPendingCheckins().catch(() => {});
    }
  }, 60000);

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
}