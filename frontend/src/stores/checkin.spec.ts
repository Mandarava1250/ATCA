import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCheckinStore } from './checkin';
import { activityApi } from '@/services/api';

vi.mock('@/services/api', () => ({
  activityApi: {
    checkTodayCheckin: vi.fn(),
    getCheckinStats: vi.fn(),
    checkin: vi.fn(),
  },
}));

vi.mock('@/utils/syncService', () => ({
  getSyncService: vi.fn(() => ({
    isReady: vi.fn(() => true),
    syncCheckin: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

vi.mock('@/utils/checkinSync', () => ({
  syncPendingCheckins: vi.fn(() => Promise.resolve({ success: true, syncedCount: 0, errors: [] })),
}));

describe('Checkin Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadFromStorage', () => {
    it('should load checkin state from localStorage', () => {
      const store = useCheckinStore();
      const savedData = {
        todayChecked: true,
        streak: 5,
        lastCheckin: '2024-01-15',
        pointsEarned: 50,
        pending: false,
        confirmed: true,
      };
      localStorage.setItem('atca_checkin', JSON.stringify(savedData));

      store.loadFromStorage();

      expect(store.todayChecked).toBe(true);
      expect(store.streak).toBe(5);
      expect(store.lastCheckin).toBe('2024-01-15');
      expect(store.pointsEarned).toBe(50);
      expect(store.pending).toBe(false);
      expect(store.confirmed).toBe(true);
    });

    it('should load pending checkins from localStorage', () => {
      const store = useCheckinStore();
      localStorage.setItem('atca_pending_checkins', JSON.stringify(['2024-01-14', '2024-01-15']));

      store.loadFromStorage();

      expect(store.pendingCheckins).toEqual(['2024-01-14', '2024-01-15']);
    });

    it('should handle corrupted localStorage data', () => {
      const store = useCheckinStore();
      localStorage.setItem('atca_checkin', 'invalid json');

      store.loadFromStorage();

      expect(store.todayChecked).toBe(false);
      expect(store.streak).toBe(0);
    });
  });

  describe('saveToStorage', () => {
    it('should save checkin state to localStorage', () => {
      const store = useCheckinStore();
      store.todayChecked = true;
      store.streak = 3;
      store.lastCheckin = '2024-01-15';
      store.pointsEarned = 30;
      store.pending = false;
      store.confirmed = true;

      store.saveToStorage();

      const saved = JSON.parse(localStorage.getItem('atca_checkin') || '{}');
      expect(saved.todayChecked).toBe(true);
      expect(saved.streak).toBe(3);
      expect(saved.lastCheckin).toBe('2024-01-15');
      expect(saved.pointsEarned).toBe(30);
      expect(saved.pending).toBe(false);
      expect(saved.confirmed).toBe(true);
    });

    it('should save pending checkins to localStorage', () => {
      const store = useCheckinStore();
      store.pendingCheckins = ['2024-01-14', '2024-01-15'];

      store.saveToStorage();

      const saved = JSON.parse(localStorage.getItem('atca_pending_checkins') || '[]');
      expect(saved).toEqual(['2024-01-14', '2024-01-15']);
    });
  });

  describe('loadCheckin', () => {
    it('should use local cache if fresh (within 30 seconds)', async () => {
      const store = useCheckinStore();
      store.todayChecked = true;
      store.confirmed = true;
      localStorage.setItem('atca_checkin_sync_time', Date.now().toString());

      const checkTodaySpy = vi.spyOn(activityApi, 'checkTodayCheckin');
      const getStatsSpy = vi.spyOn(activityApi, 'getCheckinStats');

      await store.loadCheckin();

      expect(checkTodaySpy).not.toHaveBeenCalled();
      expect(getStatsSpy).not.toHaveBeenCalled();
    });

    it('should sync from backend when cache is stale', async () => {
      const store = useCheckinStore();
      localStorage.setItem('atca_checkin_sync_time', '0');

      vi.mocked(activityApi.checkTodayCheckin).mockResolvedValue({
        success: true,
        data: { checked_today: true },
      });
      vi.mocked(activityApi.getCheckinStats).mockResolvedValue({
        success: true,
        data: { total_checkins: 20, max_streak: 5, total_points: 100, last_checkin_date: '2024-01-15', weekly_checkins: 5, monthly_checkins: 15 },
      });

      await store.loadCheckin();

      expect(store.todayChecked).toBe(true);
      expect(store.streak).toBe(5);
      expect(store.lastCheckin).toBe('2024-01-15');
      expect(store.confirmed).toBe(true);
    });

    it('should handle state conflict: local checked but backend not synced', async () => {
      const store = useCheckinStore();
      store.todayChecked = true;
      store.confirmed = false;
      localStorage.setItem('atca_checkin_sync_time', '0');

      vi.mocked(activityApi.checkTodayCheckin).mockResolvedValue({
        success: true,
        data: { checked_today: false },
      });
      vi.mocked(activityApi.getCheckinStats).mockResolvedValue({
        success: true,
        data: { total_checkins: 19, max_streak: 4, total_points: 95, last_checkin_date: '2024-01-14', weekly_checkins: 4, monthly_checkins: 14 },
      });

      await store.loadCheckin();

      expect(store.todayChecked).toBe(true);
      expect(store.confirmed).toBe(false);
    });

    it('should handle network error gracefully', async () => {
      const store = useCheckinStore();
      store.todayChecked = true;
      store.streak = 5;
      localStorage.setItem('atca_checkin_sync_time', '0');

      vi.mocked(activityApi.checkTodayCheckin).mockRejectedValue(new Error('Network error'));

      await store.loadCheckin();

      expect(store.todayChecked).toBe(true);
      expect(store.streak).toBe(5);
      expect(store.syncError).toBe('Network error');
    });
  });

  describe('performCheckin', () => {
    it('should perform checkin successfully', async () => {
      const store = useCheckinStore();
      vi.mocked(activityApi.checkin).mockResolvedValue({
        success: true,
        message: 'Checkin successful',
        streak_count: 5,
        points_earned: 10,
      });

      const result = await store.performCheckin({ device_type: 'desktop' });

      expect(result.success).toBe(true);
      expect(result.already_checked).toBe(false);
      expect(result.streak).toBe(5);
      expect(result.points_earned).toBe(10);
      expect(store.todayChecked).toBe(true);
      expect(store.streak).toBe(5);
      expect(store.confirmed).toBe(true);
    });

    it('should handle already checked scenario', async () => {
      const store = useCheckinStore();
      vi.mocked(activityApi.checkin).mockResolvedValue({
        success: false,
        message: 'Already checked in today',
        already_checked: true,
      });
      vi.mocked(activityApi.getCheckinStats).mockResolvedValue({
        success: true,
        data: { total_checkins: 20, max_streak: 5, total_points: 100, last_checkin_date: '2024-01-15', weekly_checkins: 5, monthly_checkins: 15 },
      });

      const result = await store.performCheckin();

      expect(result.success).toBe(true);
      expect(result.already_checked).toBe(true);
      expect(store.todayChecked).toBe(true);
      expect(store.confirmed).toBe(true);
    });

    it('should handle checkin failure', async () => {
      const store = useCheckinStore();
      vi.mocked(activityApi.checkin).mockResolvedValue({
        success: false,
        already_checked: false,
        message: 'Checkin failed',
      });

      const result = await store.performCheckin();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Checkin failed');
      expect(store.todayChecked).toBe(false);
      expect(store.confirmed).toBe(false);
    });

    it('should cache pending checkin on network error', async () => {
      const store = useCheckinStore();
      vi.mocked(activityApi.checkin).mockRejectedValue(new Error('Network error'));

      const result = await store.performCheckin();

      expect(result.success).toBe(false);
      expect(result.message).toBe('网络异常，已缓存待同步');
      expect(store.pendingCheckins).toContain(store.today);
      expect(store.todayChecked).toBe(true);
      expect(store.confirmed).toBe(false);
    });

    it('should skip checkin if already checked and confirmed', async () => {
      const store = useCheckinStore();
      store.todayChecked = true;
      store.confirmed = true;

      const result = await store.performCheckin();

      expect(result.success).toBe(true);
      expect(result.already_checked).toBe(true);
      expect(activityApi.checkin).not.toHaveBeenCalled();
    });
  });

  describe('syncPending', () => {
    it('should sync pending checkins', async () => {
      const store = useCheckinStore();
      store.pendingCheckins = ['2024-01-14'];

      const result = await store.syncPending();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(0);
    });
  });

  describe('handleSyncUpdate', () => {
    it('should update state on WebSocket sync for today', () => {
      const store = useCheckinStore();
      const today = new Date().toISOString().split('T')[0];

      store.handleSyncUpdate({
        payload: {
          checkin_date: today,
          streak_count: 10,
          points_earned: 100,
        },
      });

      expect(store.todayChecked).toBe(true);
      expect(store.streak).toBe(10);
      expect(store.lastCheckin).toBe(today);
      expect(store.confirmed).toBe(true);
    });

    it('should ignore sync update for non-today dates', () => {
      const store = useCheckinStore();
      store.todayChecked = false;
      store.streak = 5;

      store.handleSyncUpdate({
        payload: {
          checkin_date: '2024-01-10',
          streak_count: 10,
        },
      });

      expect(store.todayChecked).toBe(false);
      expect(store.streak).toBe(5);
    });
  });

  describe('getCheckinHistory', () => {
    it('should return empty array when no history', () => {
      const store = useCheckinStore();
      const history = store.getCheckinHistory();
      expect(history).toEqual([]);
    });

    it('should return parsed history from localStorage', () => {
      const store = useCheckinStore();
      const mockHistory = [
        { checkin_date: '2024-01-15', checkin_time: '08:00', streak_count: 5, points_earned: 10 },
      ];
      localStorage.setItem('checkin_history', JSON.stringify(mockHistory));

      const history = store.getCheckinHistory();
      expect(history).toEqual(mockHistory);
    });
  });

  describe('addCheckinRecord', () => {
    it('should add new checkin record to history', () => {
      const store = useCheckinStore();
      const record = {
        checkin_date: '2024-01-15',
        checkin_time: '08:00',
        streak_count: 5,
        points_earned: 10,
      };

      store.addCheckinRecord(record);

      const history = JSON.parse(localStorage.getItem('checkin_history') || '[]');
      expect(history).toContainEqual(record);
    });

    it('should update existing record for same date', () => {
      const store = useCheckinStore();
      const oldRecord = {
        checkin_date: '2024-01-15',
        checkin_time: '08:00',
        streak_count: 5,
        points_earned: 10,
      };
      localStorage.setItem('checkin_history', JSON.stringify([oldRecord]));

      const newRecord = {
        checkin_date: '2024-01-15',
        checkin_time: '09:00',
        streak_count: 6,
        points_earned: 20,
      };
      store.addCheckinRecord(newRecord);

      const history = JSON.parse(localStorage.getItem('checkin_history') || '[]');
      expect(history).toHaveLength(1);
      expect(history[0].checkin_time).toBe('09:00');
      expect(history[0].streak_count).toBe(6);
    });

    it('should limit history to 365 records', () => {
      const store = useCheckinStore();
      const records = Array.from({ length: 400 }, (_, i) => ({
        checkin_date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        checkin_time: '08:00',
        streak_count: 1,
        points_earned: 10,
      }));
      localStorage.setItem('checkin_history', JSON.stringify(records));

      store.addCheckinRecord({
        checkin_date: '2024-02-01',
        checkin_time: '08:00',
        streak_count: 1,
        points_earned: 10,
      });

      const history = JSON.parse(localStorage.getItem('checkin_history') || '[]');
      expect(history).toHaveLength(365);
    });
  });

  describe('multi-device concurrent check-in', () => {
    it('should prevent concurrent check-in requests', async () => {
      vi.useFakeTimers();
      const store = useCheckinStore();

      // 模拟慢速 API 响应（500ms 延迟）
      vi.mocked(activityApi.checkin).mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ success: true, message: 'Checkin successful', streak_count: 5, points_earned: 10, already_checked: false });
          }, 500);
        });
      });

      // 同时发起两个打卡请求
      const promise1 = store.performCheckin({ device_type: 'desktop' });
      const promise2 = store.performCheckin({ device_type: 'mobile' });

      // 第二个请求应该被拒绝（并发防护）
      const result2 = await promise2;
      expect(result2.success).toBe(false);
      expect(result2.message).toBe('打卡请求正在进行中');

      // 推进时间完成第一个请求
      await vi.advanceTimersByTimeAsync(500);
      const result1 = await promise1;
      expect(result1.success).toBe(true);

      vi.useRealTimers();
    });

    it('should handle checkin from two different devices sequentially', async () => {
      const store = useCheckinStore();

      // 设备A打卡
      vi.mocked(activityApi.checkin).mockResolvedValueOnce({
        success: true, message: 'Checkin A', streak_count: 3, points_earned: 20, already_checked: false,
      });

      const resultA = await store.performCheckin({ device_type: 'desktop' });
      expect(resultA.success).toBe(true);
      expect(resultA.streak).toBe(3);
      expect(store.todayChecked).toBe(true);

      // 设备B确认已打卡
      store.todayChecked = true;
      store.confirmed = true;
      vi.mocked(activityApi.checkin).mockResolvedValueOnce({
        success: false, message: 'Already checked in', already_checked: true,
      });
      vi.mocked(activityApi.getCheckinStats).mockResolvedValueOnce({
        success: true, data: { total_checkins: 10, max_streak: 3, total_points: 100, last_checkin_date: new Date().toISOString().split('T')[0], weekly_checkins: 3, monthly_checkins: 10 },
      });

      // 设备B尝试打卡应返回已打卡
      const resultB = await store.performCheckin({ device_type: 'mobile' });
      expect(resultB.success).toBe(true);
      expect(resultB.already_checked).toBe(true);
    });
  });

  describe('network error recovery', () => {
    it('should cache pending checkin on network error and sync later', async () => {
      const store = useCheckinStore();

      // 模拟网络错误
      vi.mocked(activityApi.checkin).mockRejectedValueOnce(new Error('Network error'));

      const result = await store.performCheckin({ device_type: 'desktop' });

      // 网络错误时，乐观更新保持，但加入 pending 队列
      expect(result.success).toBe(false);
      expect(result.message).toBe('网络异常，已缓存待同步');
      expect(store.todayChecked).toBe(true); // 乐观更新保持
      expect(store.confirmed).toBe(false);   // 未确认
      expect(store.pendingCheckins).toContain(store.today); // 加入待同步队列

      // 模拟网络恢复，同步 pending 记录
      vi.mocked(activityApi.checkin).mockResolvedValueOnce({
        success: true, message: 'Sync successful', streak_count: 5, points_earned: 10, already_checked: false,
      });

      await store.syncPending();

      expect(store.pendingCheckins).not.toContain(store.today);
      expect(store.confirmed).toBe(true);
    });

    it('should handle multiple offline checkins and sync in batch', async () => {
      const store = useCheckinStore();

      // 模拟离线打卡（连续3天）
      const dates = ['2024-01-13', '2024-01-14', '2024-01-15'];
      for (const date of dates) {
        // 模拟网络错误
        vi.mocked(activityApi.checkin).mockRejectedValueOnce(new Error('Offline'));
        vi.mocked(activityApi.checkin).mockRejectedValueOnce(new Error('Offline'));
        vi.mocked(activityApi.checkin).mockRejectedValueOnce(new Error('Offline'));

        // 手动设置 pending 队列
        store.pendingCheckins.push(date);
      }
      expect(store.pendingCheckins.length).toBe(3);

      // 网络恢复，批量同步
      for (const date of ['2024-01-13', '2024-01-14', '2024-01-15']) {
        vi.mocked(activityApi.checkin).mockResolvedValueOnce({
          success: true, message: `Sync ${date}`, streak_count: 1, points_earned: 10, already_checked: false,
        });
      }

      await store.syncPending();

      expect(store.pendingCheckins.length).toBe(0);
    });
  });

  describe('cross-device sync', () => {
    it('should update state when receiving WebSocket sync for today', () => {
      const store = useCheckinStore();
      const today = new Date().toISOString().split('T')[0];

      store.handleSyncUpdate({
        payload: {
          checkin_date: today,
          streak_count: 10,
          points_earned: 100,
          device_type: 'mobile',
        },
      });

      expect(store.todayChecked).toBe(true);
      expect(store.streak).toBe(10);
      expect(store.lastCheckin).toBe(today);
      expect(store.confirmed).toBe(true);
      expect(store.pending).toBe(false);
    });

    it('should ignore sync update for non-today dates', () => {
      const store = useCheckinStore();
      store.todayChecked = false;
      store.streak = 5;

      store.handleSyncUpdate({
        payload: {
          checkin_date: '2024-01-10',
          streak_count: 10,
          points_earned: 100,
        },
      });

      // 非今天日期不应更新状态
      expect(store.todayChecked).toBe(false);
      expect(store.streak).toBe(5);
    });

    it('should handle sync from multiple devices on same day', () => {
      const store = useCheckinStore();
      const today = new Date().toISOString().split('T')[0];

      // 设备A打卡
      store.handleSyncUpdate({
        payload: { checkin_date: today, streak_count: 3, points_earned: 20, device_type: 'desktop' },
      });
      expect(store.streak).toBe(3);

      // 设备B更新（更长的连续天数）
      store.handleSyncUpdate({
        payload: { checkin_date: today, streak_count: 5, points_earned: 30, device_type: 'mobile' },
      });
      expect(store.streak).toBe(5); // 应该更新为更大的值
    });
  });

  describe('conflict resolution', () => {
    it('should keep local state when backend not synced and retry', async () => {
      const store = useCheckinStore();

      // 本地已打卡（乐观更新），但后端未同步
      store.todayChecked = true;
      store.confirmed = false;
      localStorage.setItem('atca_checkin_sync_time', '0');

      vi.mocked(activityApi.checkTodayCheckin).mockResolvedValue({
        success: true, data: { checked_today: false },
      });
      vi.mocked(activityApi.getCheckinStats).mockResolvedValue({
        success: true, data: { total_checkins: 19, max_streak: 4, total_points: 95, last_checkin_date: '2024-01-14', weekly_checkins: 4, monthly_checkins: 14 },
      });

      // 使用 fake timers
      vi.useFakeTimers();

      await store.loadCheckin(true);

      // 应该保留本地状态（因为 confirmed = false）
      expect(store.todayChecked).toBe(true);
      expect(store.confirmed).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('WebSocket reconnection', () => {
    it('should re-register sync listener after reconnection', () => {
      const store = useCheckinStore();
      const mockSyncService = {
        isReady: vi.fn(() => true),
        syncCheckin: vi.fn(() => Promise.resolve()),
        on: vi.fn(),
        off: vi.fn(),
      };

      // 首次注册
      store.initSyncListener();
      expect(mockSyncService.on).toHaveBeenCalledWith('checkin_update', expect.any(Function));

      // 移除监听
      store.removeSyncListener();
      expect(mockSyncService.off).toHaveBeenCalledWith('checkin_update', expect.any(Function));

      // 重新注册
      store.initSyncListener();
      expect(mockSyncService.on).toHaveBeenCalledTimes(2);
    });
  });
});