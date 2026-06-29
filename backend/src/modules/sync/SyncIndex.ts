import { Router } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { getSyncStats, pushToUser } from '../../services/SyncService';

const router = Router();

// ========================
// 同步状态管理
// ========================

// 获取同步服务状态
router.get('/status', authMiddleware, asyncHandler(async (req, res) => {
  const stats = getSyncStats();
  
  res.json({
    success: true,
    data: {
      serviceStatus: 'running',
      ...stats,
    },
  });
}));

// ========================
// 数据同步接口
// ========================

// 获取设备列表
router.get('/devices', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;

  if (isMockMode()) {
    res.json({
      success: true,
      data: [
        { deviceId: 'device_1', deviceName: 'iPhone 14', lastActive: new Date().toISOString(), isOnline: true },
        { deviceId: 'device_2', deviceName: 'MacBook Pro', lastActive: new Date(Date.now() - 3600000).toISOString(), isOnline: false },
      ],
    });
    return;
  }

  try {
    const result = await query(
      'architecture',
      'EXEC sp_get_user_devices @user_id = @uid',
      { uid: userId }
    );
    res.json({ success: true, data: result || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
}));

// 获取同步日志
router.get('/logs', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, startDate, endDate } = req.query;
  const userId = (req as any).user?.userId;

  if (isMockMode()) {
    const mockLogs = [
      { sync_id: 1, user_id: userId, sync_type: 'checkin', device_id: 'device_1', status: 'success', timestamp: new Date().toISOString(), details: '打卡记录同步成功' },
      { sync_id: 2, user_id: userId, sync_type: 'favorite', device_id: 'device_2', status: 'success', timestamp: new Date(Date.now() - 1800000).toISOString(), details: '收藏列表同步成功' },
      { sync_id: 3, user_id: userId, sync_type: 'quiz_progress', device_id: 'device_1', status: 'success', timestamp: new Date(Date.now() - 3600000).toISOString(), details: '答题进度同步成功' },
    ];
    res.json({ success: true, data: { list: mockLogs, total: 3, totalPages: 1 } });
    return;
  }

  try {
    const result = await query(
      'architecture',
      'EXEC sp_get_sync_logs @user_id = @uid, @page = @p, @limit = @l, @start_date = @start, @end_date = @end',
      { uid: userId, p: parseInt(page as string), l: parseInt(limit as string), start: startDate || null, end: endDate || null }
    );
    const list = Array.isArray(result) ? result : [];
    const total = list.length > 0 ? (list[0] as any).total || list.length : 0;
    res.json({ success: true, data: { list, total, totalPages: Math.ceil(total / parseInt(limit as string)) } });
  } catch {
    res.json({ success: true, data: { list: [], total: 0, totalPages: 0 } });
  }
}));

// 触发全量同步
router.post('/full-sync', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { deviceId } = req.body;

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        syncId: `sync_${Date.now()}`,
        status: 'completed',
        syncedData: {
          checkins: 15,
          favorites: 8,
          notes: 3,
          quizProgress: 2,
          settings: 1,
        },
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  try {
    const result = await execute(
      'architecture',
      'EXEC sp_trigger_full_sync @user_id = @uid, @device_id = @did',
      { uid: userId, did: deviceId || null }
    );
    res.json({ success: true, data: { syncId: result, status: 'completed' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '全量同步失败', details: err.message } });
  }
}));

// 获取增量同步数据
router.post('/delta-sync', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { lastSyncTime, deviceId, syncTypes } = req.body;

  if (!lastSyncTime) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 lastSyncTime' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        hasChanges: true,
        syncTime: new Date().toISOString(),
        changes: [
          { type: 'checkin', payload: { checkinDate: new Date().toISOString(), completed: true } },
          { type: 'favorite', payload: { entityId: 5, entityType: 'architecture', action: 'add' } },
        ],
        deviceId,
      },
    });
    return;
  }

  try {
    const typesJson = syncTypes && Array.isArray(syncTypes) ? JSON.stringify(syncTypes) : null;
    const result = await query(
      'architecture',
      'EXEC sp_get_delta_sync @user_id = @uid, @last_sync_time = @time, @device_id = @did, @sync_types = @types',
      { uid: userId, time: new Date(lastSyncTime).toISOString(), did: deviceId || null, types: typesJson }
    );
    res.json({ success: true, data: result || { hasChanges: false, changes: [] } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '增量同步失败', details: err.message } });
  }
}));

// 上报客户端同步状态
router.post('/client-status', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { deviceId, status, lastSyncTime, syncErrors } = req.body;

  if (isMockMode()) {
    res.json({ success: true, data: { acknowledged: true } });
    return;
  }

  try {
    await execute(
      'architecture',
      'EXEC sp_update_device_status @user_id = @uid, @device_id = @did, @status = @status, @last_sync_time = @time, @sync_errors = @errors',
      { uid: userId, did: deviceId, status, time: lastSyncTime ? new Date(lastSyncTime).toISOString() : null, errors: syncErrors || 0 }
    );
    res.json({ success: true, data: { acknowledged: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '更新设备状态失败', details: err.message } });
  }
}));

// ========================
// 手动同步触发
// ========================

// 同步打卡记录
router.post('/sync-checkins', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { checkins } = req.body;

  if (!checkins || !Array.isArray(checkins)) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 checkins' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        syncedCount: checkins.length,
        conflicts: 0,
      },
    });
    return;
  }

  try {
    const checkinsJson = JSON.stringify(checkins);
    const result = await query(
      'architecture',
      'EXEC sp_sync_checkins @user_id = @uid, @checkins = @data',
      { uid: userId, data: checkinsJson }
    );
    const syncedCount = Array.isArray(result) && result.length > 0 ? (result[0] as any).synced_count : checkins.length;
    
    pushToUser(userId, 'sync:checkin_update', { checkins, timestamp: Date.now() });
    
    res.json({ success: true, data: { syncedCount, conflicts: 0 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '同步打卡记录失败', details: err.message } });
  }
}));

// 同步收藏列表
router.post('/sync-favorites', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { favorites } = req.body;

  if (!favorites || !Array.isArray(favorites)) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 favorites' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        syncedCount: favorites.length,
        conflicts: 0,
      },
    });
    return;
  }

  try {
    const favoritesJson = JSON.stringify(favorites);
    const result = await query(
      'architecture',
      'EXEC sp_sync_favorites @user_id = @uid, @favorites = @data',
      { uid: userId, data: favoritesJson }
    );
    const syncedCount = Array.isArray(result) && result.length > 0 ? (result[0] as any).synced_count : favorites.length;
    
    pushToUser(userId, 'sync:favorite_change', { favorites, timestamp: Date.now() });
    
    res.json({ success: true, data: { syncedCount, conflicts: 0 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '同步收藏列表失败', details: err.message } });
  }
}));

// 同步笔记
router.post('/sync-notes', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { notes } = req.body;

  if (!notes || !Array.isArray(notes)) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 notes' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        syncedCount: notes.length,
        conflicts: 0,
      },
    });
    return;
  }

  try {
    const notesJson = JSON.stringify(notes);
    const result = await query(
      'architecture',
      'EXEC sp_sync_notes @user_id = @uid, @notes = @data',
      { uid: userId, data: notesJson }
    );
    const syncedCount = Array.isArray(result) && result.length > 0 ? (result[0] as any).synced_count : notes.length;
    
    pushToUser(userId, 'sync:note_change', { notes, timestamp: Date.now() });
    
    res.json({ success: true, data: { syncedCount, conflicts: 0 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '同步笔记失败', details: err.message } });
  }
}));

// 同步设置
router.post('/sync-settings', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 settings' } });
    return;
  }

  if (isMockMode()) {
    res.json({ success: true, data: { synced: true } });
    return;
  }

  try {
    const settingsJson = JSON.stringify(settings);
    await execute(
      'architecture',
      'EXEC sp_sync_settings @user_id = @uid, @settings = @data',
      { uid: userId, data: settingsJson }
    );
    
    pushToUser(userId, 'sync:settings_change', { settings, timestamp: Date.now() });
    
    res.json({ success: true, data: { synced: true } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: '同步设置失败', details: err.message } });
  }
}));

export default router;