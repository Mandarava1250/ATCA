import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { activityApi } from '@/services/api';
import { getSyncService } from '@/utils/syncService';
import { syncPendingCheckins } from '@/utils/checkinSync';
import { createLogger } from '@/utils/logger';

const logger = createLogger('CheckinStore');

interface CheckinState {
  todayChecked: boolean;
  streak: number;
  lastCheckin: string;
  pointsEarned: number;
  pending: boolean;
  confirmed: boolean;
  loading: boolean;
  syncError: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

interface CheckinRecord {
  checkin_date: string;
  checkin_time: string;
  streak_count: number;
  points_earned: number;
  device_type?: string;
}

export const useCheckinStore = defineStore('checkin', () => {
  const todayChecked = ref(false);
  const streak = ref(0);
  const lastCheckin = ref('');
  const pointsEarned = ref(0);
  const pending = ref(false);
  const confirmed = ref(false);
  const loading = ref(false);
  const syncError = ref<string | null>(null);
  const syncStatus = ref<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const pendingCheckins = ref<string[]>([]);
  const syncTimerRef = ref<() => void | null>(null);
  const listeners = ref<Set<(state: CheckinState) => void>>(new Set());
  const checkinInProgress = ref(false);  // 并发防护：防止重复打卡请求
  const retryCount = ref(0);             // 重试计数器：用于指数退避
  const loadingCheckin = ref(false);     // 并发防护：防止 loadCheckin 重复调用

  const today = computed(() => new Date().toISOString().split('T')[0]);

  const stateSnapshot = computed<CheckinState>(() => ({
    todayChecked: todayChecked.value,
    streak: streak.value,
    lastCheckin: lastCheckin.value,
    pointsEarned: pointsEarned.value,
    pending: pending.value,
    confirmed: confirmed.value,
    loading: loading.value,
    syncError: syncError.value,
    syncStatus: syncStatus.value,
  }));

  function notifyListeners() {
    listeners.value.forEach(cb => cb(stateSnapshot.value));
  }

  function subscribe(callback: (state: CheckinState) => void): () => void {
    listeners.value.add(callback);
    return () => listeners.value.delete(callback);
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('atca_checkin');
      if (saved) {
        const data = JSON.parse(saved);
        todayChecked.value = data.todayChecked || data.lastCheckin === today.value;
        streak.value = data.streak || 0;
        lastCheckin.value = data.lastCheckin || '';
        pointsEarned.value = data.pointsEarned || 0;
        pending.value = data.pending === true;
        confirmed.value = data.confirmed === true;
      }

      const pendingSaved = localStorage.getItem('atca_pending_checkins');
      if (pendingSaved) {
        pendingCheckins.value = JSON.parse(pendingSaved);
      }
    } catch (e) {
      logger.error('从本地存储加载打卡状态失败', { error: (e as Error).message });
    }
  }

  function saveToStorage() {
    try {
      const data = {
        todayChecked: todayChecked.value,
        streak: streak.value,
        lastCheckin: lastCheckin.value,
        pointsEarned: pointsEarned.value,
        pending: pending.value,
        confirmed: confirmed.value,
      };
      localStorage.setItem('atca_checkin', JSON.stringify(data));
      localStorage.setItem('atca_checkin_sync_time', Date.now().toString());

      if (pendingCheckins.value.length > 0) {
        localStorage.setItem('atca_pending_checkins', JSON.stringify(pendingCheckins.value));
      } else {
        localStorage.removeItem('atca_pending_checkins');
      }
    } catch (e) {
      logger.error('保存打卡状态到本地存储失败', { error: (e as Error).message });
    }
  }

  async function loadCheckin(force = false) {
    if (loadingCheckin.value) {
      logger.debug('loadCheckin 已在执行中，跳过重复调用');
      return;
    }
    loadingCheckin.value = true;
    loading.value = true;
    syncError.value = null;

    const cacheTime = parseInt(localStorage.getItem('atca_checkin_sync_time') || '0');
    const cacheAge = Date.now() - cacheTime;

    if (!force && todayChecked.value && !pending.value && cacheAge < 30000) {
      logger.info('使用本地缓存的已打卡状态（30秒内有效）');
      loading.value = false;
      loadingCheckin.value = false;
      return;
    }

    try {
      const [statusRes, statsRes] = await Promise.all([
        activityApi.checkTodayCheckin(),
        activityApi.getCheckinStats(),
      ]);

      let backendChecked = false;
      let backendStreak = 0;
      let backendLastCheckin = '';

      if (statusRes.success && statusRes.data) {
        backendChecked = statusRes.data.checked_today;
      }
      if (statsRes.success && statsRes.data) {
        backendStreak = statsRes.data.max_streak || 0;
        backendLastCheckin = statsRes.data.last_checkin_date || '';
      }

      const localChecked = todayChecked.value;
      const wsCheckinTime = parseInt(localStorage.getItem('atca_ws_checkin_time') || '0');

      // 状态冲突处理：当后端返回未打卡，但本地有打卡记录时
      if (localChecked && !backendChecked) {
        if (confirmed.value) {
          // 本地已确认打卡，但后端返回未打卡
          // 保留本地正确状态，后台重试确认
          // 多端场景：设备B通过 WebSocket 确认打卡后，不会被后端过期数据覆盖
          logger.warn('本地已确认打卡但后端返回未打卡，保留本地状态并后台重试');
          scheduleRetry();
        } else if (wsCheckinTime > cacheTime) {
          // WebSocket 同步记录比后端 API 调用更新，信任 WebSocket 数据
          logger.info('WebSocket 同步记录比后端数据更新，信任本地状态');
          confirmed.value = true;
          pending.value = false;
          scheduleRetry();
        } else {
          // 本地乐观更新未确认，保留并重试
          // 多端场景：设备B未收到 WebSocket 消息，但本地有乐观更新标记
          logger.warn('状态不一致：本地已打卡但后端未同步，保留本地状态并延迟刷新');
          scheduleRetry();
        }
      } else {
        todayChecked.value = backendChecked;
        streak.value = backendStreak;
        lastCheckin.value = backendLastCheckin || (backendChecked ? today.value : '');
        confirmed.value = backendChecked;
      }

      pending.value = false;
      syncStatus.value = 'synced';
      retryCount.value = 0; // 重置重试计数器
      saveToStorage();
      notifyListeners();

      logger.info('打卡状态已从后端同步', stateSnapshot.value);
    } catch (e: any) {
      syncError.value = e.message;
      syncStatus.value = 'error';
      logger.warn('打卡状态同步失败，保持当前状态', { error: e.message });
    } finally {
      loading.value = false;
      loadingCheckin.value = false;
    }
  }

  function scheduleRetry() {
    retryCount.value++;
    // 指数退避：1s → 3s → 9s → 27s → 60s(max)
    const delay = Math.min(1000 * Math.pow(3, retryCount.value - 1), 60000);
    const maxRetries = 4;

    if (retryCount.value > maxRetries) {
      logger.warn('重试次数已达上限，停止自动重试', { retryCount: retryCount.value });
      syncStatus.value = 'error';
      syncError.value = '同步失败，请手动刷新';
      return;
    }

    logger.info(`计划在 ${Math.round(delay / 1000)} 秒后重试 (第 ${retryCount.value} 次)`);
    setTimeout(() => {
      loadCheckin(true);
    }, delay);
  }

  async function performCheckin(deviceInfo?: { device_type?: string; device_info?: string }) {
    // 并发防护：如果已有打卡请求正在进行，忽略后续请求
    if (checkinInProgress.value) {
      logger.warn('打卡请求正在进行中，忽略重复请求');
      return { success: false, already_checked: false, message: '打卡请求正在进行中' };
    }

    if (todayChecked.value && confirmed.value) {
      logger.info('今日已打卡，无需重复打卡');
      return { success: true, already_checked: true };
    }

    loading.value = true;
    pending.value = true;
    confirmed.value = false;
    syncStatus.value = 'syncing';
    checkinInProgress.value = true;

    const optimisticStreak = todayChecked.value ? streak.value : streak.value + 1;

    todayChecked.value = true;
    streak.value = optimisticStreak;
    lastCheckin.value = today.value;
    saveToStorage();
    notifyListeners();

    try {
      const device_type = deviceInfo?.device_type || getDeviceType();
      const device_info = deviceInfo?.device_info || navigator.userAgent.substring(0, 200);

      const res = await activityApi.checkin({ device_type, device_info });

      if (res.success) {
        streak.value = res.streak_count || optimisticStreak;
        pointsEarned.value = res.points_earned || 0;
        pending.value = false;
        confirmed.value = true;
        syncStatus.value = 'synced';
        saveToStorage();
        notifyListeners();

        syncToOtherDevices({
          checkin_date: today.value,
          streak_count: streak.value,
          points_earned: pointsEarned.value,
          device_type,
        });

        logger.info('打卡成功', { streak: streak.value, points: pointsEarned.value });
        return { success: true, already_checked: false, streak: streak.value, points_earned: pointsEarned.value };
      } else if (res.already_checked) {
        const statsRes = await activityApi.getCheckinStats();
        if (statsRes.success && statsRes.data) {
          streak.value = statsRes.data.max_streak || optimisticStreak;
        }
        pending.value = false;
        confirmed.value = true;
        syncStatus.value = 'synced';
        saveToStorage();
        notifyListeners();

        logger.info('今日已打卡（重复打卡）', { streak: streak.value });
        return { success: true, already_checked: true, streak: streak.value };
      } else {
        todayChecked.value = false;
        streak.value = optimisticStreak - 1;
        pending.value = false;
        confirmed.value = false;
        syncStatus.value = 'error';
        syncError.value = res.message || '打卡失败';
        saveToStorage();
        notifyListeners();

        logger.error('打卡失败', { message: res.message });
        return { success: false, already_checked: false, message: res.message };
      }
    } catch (e: any) {
      logger.error('打卡网络异常，将在下次同步时重试', { error: e.message });

      if (!pendingCheckins.value.includes(today.value)) {
        pendingCheckins.value.push(today.value);
      }

      syncStatus.value = 'error';
      syncError.value = e.message;
      saveToStorage();
      notifyListeners();

      return { success: false, already_checked: false, message: '网络异常，已缓存待同步' };
    } finally {
      loading.value = false;
      checkinInProgress.value = false;
    }
  }

  async function syncPending() {
    if (pendingCheckins.value.length === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    syncStatus.value = 'syncing';
    loading.value = true;

    try {
      const result = await syncPendingCheckins();

      if (result.syncedCount > 0) {
        const remaining = pendingCheckins.value.filter(
          date => !result.errors.some(err => err.includes(date))
        );
        pendingCheckins.value = remaining;

        if (remaining.length === 0) {
          confirmed.value = true;
          syncStatus.value = 'synced';
        }

        saveToStorage();
        notifyListeners();
      }

      if (result.errors.length > 0) {
        syncStatus.value = 'error';
        syncError.value = result.errors.join('; ');
      }

      return result;
    } catch (e: any) {
      syncStatus.value = 'error';
      syncError.value = e.message;
      return { success: false, syncedCount: 0, errors: [e.message] };
    } finally {
      loading.value = false;
    }
  }

  function syncToOtherDevices(checkinData: {
    checkin_date: string;
    streak_count: number;
    points_earned: number;
    device_type?: string;
  }) {
    try {
      const syncService = getSyncService();
      if (syncService.isReady()) {
        syncService.syncCheckin(checkinData).catch(() => {
          logger.warn('WebSocket同步推送失败');
        });
      }
    } catch (e) {
      logger.warn('同步服务未初始化', { error: (e as Error).message });
    }
  }

  function handleSyncUpdate(data: any) {
    if (data.payload?.checkin_date === today.value) {
      todayChecked.value = true;
      streak.value = data.payload.streak_count || streak.value;
      lastCheckin.value = today.value;
      pending.value = false;
      confirmed.value = true;
      syncStatus.value = 'synced';
      // 记录 WebSocket 同步时间戳，用于 loadCheckin 判断
      localStorage.setItem('atca_ws_checkin_time', Date.now().toString());
      saveToStorage();
      notifyListeners();

      logger.info('通过 WebSocket 同步更新打卡状态', { checked: true, streak: streak.value });
    }
  }

  function initSyncListener() {
    const syncService = getSyncService();
    syncService.on('checkin_update', handleSyncUpdate);
    logger.info('签到WebSocket同步监听器已注册');
  }

  function removeSyncListener() {
    const syncService = getSyncService();
    syncService.off('checkin_update', handleSyncUpdate);
    logger.info('签到WebSocket同步监听器已移除');
  }

  function getCheckinHistory(): CheckinRecord[] {
    try {
      const history = localStorage.getItem('checkin_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  function addCheckinRecord(record: CheckinRecord) {
    try {
      const history = getCheckinHistory();
      const existingIndex = history.findIndex(h => h.checkin_date === record.checkin_date);
      if (existingIndex >= 0) {
        history[existingIndex] = record;
      } else {
        history.push(record);
      }
      history.sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime());
      if (history.length > 365) {
        history.splice(365);
      }
      localStorage.setItem('checkin_history', JSON.stringify(history));
    } catch (e) {
      logger.error('保存打卡历史记录失败', { error: (e as Error).message });
    }
  }

  return {
    todayChecked,
    streak,
    lastCheckin,
    pointsEarned,
    pending,
    confirmed,
    loading,
    loadingCheckin,
    syncError,
    syncStatus,
    pendingCheckins,
    checkinInProgress,
    retryCount,
    today,
    stateSnapshot,
    loadFromStorage,
    saveToStorage,
    loadCheckin,
    performCheckin,
    syncPending,
    handleSyncUpdate,
    initSyncListener,
    removeSyncListener,
    subscribe,
    notifyListeners,
    getCheckinHistory,
    addCheckinRecord,
  };
});

function getDeviceType(): string {
  if (/Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent)) {
    return 'mobile';
  } else if (/Tablet|iPad/.test(navigator.userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}