import { activityApi } from '@/services/api';

interface SyncError {
  date: string;
  message: string;
}

export async function syncPendingCheckins(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  const pending = JSON.parse(localStorage.getItem('atca_pending_checkins') || '[]');
  if (!Array.isArray(pending) || pending.length === 0) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  const errors: SyncError[] = [];
  let syncedCount = 0;

  for (const date of pending) {
    try {
      const res = await activityApi.checkin({
        device_type: getDeviceType(),
        device_info: navigator.userAgent.substring(0, 200),
        checkin_date: date,
      });

      if (res.success || res.already_checked) {
        syncedCount++;
      } else {
        errors.push({ date, message: `日期 ${date} 同步失败` });
      }
    } catch (e: any) {
      errors.push({ date, message: `日期 ${date} 同步异常: ${e.message}` });
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