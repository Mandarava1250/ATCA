import { Router } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { getSyncStats, pushToUser } from '../../services/SyncService';

const router = Router();

const logger = {
  info: (msg: string, data?: any) => console.log(`[Sync] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[Sync] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[Sync] ${msg}`, data || ''),
};

// ========================
// 同步状态管理
// ========================

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
      'sync',
      'EXEC sp_sync_get_user_devices @user_id = @uid',
      { uid: userId }
    );
    res.json({ success: true, data: result || [] });
  } catch (err: any) {
    logger.error(`获取设备列表失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.json({ success: true, data: [] });
  }
}));

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
      'sync',
      'SELECT [operation_id] AS sync_id, [user_id], [operation_type] AS sync_type, [device_id], [sync_status] AS status, [operation_time] AS timestamp, [operation_data] AS details FROM dbo.sync_operations WHERE [user_id] = @uid ORDER BY [operation_time] DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY',
      { uid: userId, offset: (parseInt(page as string) - 1) * parseInt(limit as string), limit: parseInt(limit as string) }
    );
    
    const countResult = await query(
      'sync',
      'SELECT COUNT(*) AS total FROM dbo.sync_operations WHERE [user_id] = @uid',
      { uid: userId }
    );
    
    const list = Array.isArray(result) ? result : [];
    const total = countResult.length > 0 ? (countResult[0] as any).total : list.length;
    
    res.json({ success: true, data: { list, total, totalPages: Math.ceil(total / parseInt(limit as string)) } });
  } catch (err: any) {
    logger.error(`获取同步日志失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.json({ success: true, data: { list: [], total: 0, totalPages: 0 } });
  }
}));

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
    const checkinsResult = await query(
      'sync',
      'EXEC sp_sync_get_user_checkins @user_id = @uid',
      { uid: userId }
    );
    
    await execute(
      'sync',
      'EXEC sp_sync_mark_checkins_synced @user_id = @uid, @device_id = @did',
      { uid: userId, did: deviceId || 'unknown' }
    );

    await execute(
      'sync',
      'EXEC sp_sync_update_user_status @user_id = @uid, @sync_type = @type',
      { uid: userId, type: 'checkin' }
    );

    logger.info(`全量同步完成 - 用户: ${userId}, 设备: ${deviceId}`);

    res.json({ 
      success: true, 
      data: { 
        syncId: `sync_${Date.now()}`, 
        status: 'completed',
        syncedData: { checkins: Array.isArray(checkinsResult) ? checkinsResult.length : 0 }
      } 
    });
  } catch (err: any) {
    logger.error(`全量同步失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '全量同步失败', details: err.message } });
  }
}));

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
    let changes: any[] = [];
    
    const includeCheckins = !syncTypes || syncTypes.includes('checkin');
    if (includeCheckins) {
      const pendingCheckins = await query(
        'sync',
        'EXEC sp_sync_get_pending_checkins @user_id = @uid',
        { uid: userId }
      );
      
      if (Array.isArray(pendingCheckins) && pendingCheckins.length > 0) {
        changes.push(...pendingCheckins.map((c: any) => ({
          type: 'checkin',
          payload: {
            checkinId: c.checkin_id,
            checkinDate: c.checkin_date,
            streakCount: c.streak_count,
            pointsEarned: c.points_earned,
          },
        })));
      }
    }

    await execute(
      'sync',
      'EXEC sp_sync_mark_checkins_synced @user_id = @uid, @device_id = @did',
      { uid: userId, did: deviceId || 'unknown' }
    );

    res.json({ 
      success: true, 
      data: { 
        hasChanges: changes.length > 0,
        syncTime: new Date().toISOString(),
        changes,
        deviceId,
      } 
    });
  } catch (err: any) {
    logger.error(`增量同步失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '增量同步失败', details: err.message } });
  }
}));

router.post('/client-status', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { deviceId, status, lastSyncTime, syncErrors } = req.body;

  if (isMockMode()) {
    res.json({ success: true, data: { acknowledged: true } });
    return;
  }

  try {
    await execute(
      'sync',
      'EXEC sp_sync_register_device @device_id = @did, @user_id = @uid, @device_type = @dt',
      { did: deviceId, uid: userId, dt: status || 'unknown' }
    );
    
    res.json({ success: true, data: { acknowledged: true } });
  } catch (err: any) {
    logger.error(`更新设备状态失败 - 用户: ${userId}, 设备: ${deviceId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '更新设备状态失败', details: err.message } });
  }
}));

// ========================
// 手动同步触发
// ========================

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
    let syncedCount = 0;
    for (const checkin of checkins) {
      try {
        await execute(
          'sync',
          'EXEC sp_sync_record_checkin @user_id = @uid, @checkin_id = @cid, @checkin_date = @cd, @checkin_time = @ct, @streak_count = @sc, @points_earned = @pe, @device_type = @dt, @device_info = @di',
          {
            uid: userId,
            cid: checkin.checkin_id || Date.now(),
            cd: checkin.checkin_date,
            ct: checkin.checkin_time || new Date().toISOString(),
            sc: checkin.streak_count || 1,
            pe: checkin.points_earned || 10,
            dt: checkin.device_type || null,
            di: checkin.device_info || null,
          }
        );
        syncedCount++;
      } catch (err: any) {
        logger.warn(`同步单条打卡失败 - 用户: ${userId}, 日期: ${checkin.checkin_date}, 错误: ${err.message}`);
      }
    }
    
    pushToUser(userId, 'sync:checkin_update', { checkins, timestamp: Date.now() });
    
    logger.info(`批量同步打卡完成 - 用户: ${userId}, 同步数量: ${syncedCount}`);
    
    res.json({ success: true, data: { syncedCount, conflicts: checkins.length - syncedCount } });
  } catch (err: any) {
    logger.error(`批量同步打卡失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '同步打卡记录失败', details: err.message } });
  }
}));

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
    for (const favorite of favorites) {
      await execute(
        'sync',
        'EXEC sp_sync_log_operation @user_id = @uid, @device_id = @did, @operation_type = @type, @entity_type = @et, @entity_id = @eid, @operation_data = @data',
        {
          uid: userId,
          did: 'api_sync',
          type: favorite.action === 'remove' ? 'DELETE' : 'INSERT',
          et: favorite.entityType || 'architecture',
          eid: favorite.entityId,
          data: JSON.stringify(favorite),
        }
      );
    }
    
    pushToUser(userId, 'sync:favorite_change', { favorites, timestamp: Date.now() });
    
    res.json({ success: true, data: { syncedCount: favorites.length, conflicts: 0 } });
  } catch (err: any) {
    logger.error(`同步收藏列表失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '同步收藏列表失败', details: err.message } });
  }
}));

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
    for (const note of notes) {
      await execute(
        'sync',
        'EXEC sp_sync_log_operation @user_id = @uid, @device_id = @did, @operation_type = @type, @entity_type = @et, @entity_id = @eid, @operation_data = @data',
        {
          uid: userId,
          did: 'api_sync',
          type: note.note_id ? 'UPDATE' : 'INSERT',
          et: 'note',
          eid: note.note_id || Date.now(),
          data: JSON.stringify(note),
        }
      );
    }
    
    pushToUser(userId, 'sync:note_change', { notes, timestamp: Date.now() });
    
    res.json({ success: true, data: { syncedCount: notes.length, conflicts: 0 } });
  } catch (err: any) {
    logger.error(`同步笔记失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '同步笔记失败', details: err.message } });
  }
}));

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
    await execute(
      'sync',
      'EXEC sp_sync_log_operation @user_id = @uid, @device_id = @did, @operation_type = @type, @entity_type = @et, @entity_id = @eid, @operation_data = @data',
      {
        uid: userId,
        did: 'api_sync',
        type: 'UPDATE',
        et: 'settings',
        eid: userId,
        data: JSON.stringify(settings),
      }
    );
    
    pushToUser(userId, 'sync:settings_change', { settings, timestamp: Date.now() });
    
    res.json({ success: true, data: { synced: true } });
  } catch (err: any) {
    logger.error(`同步设置失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '同步设置失败', details: err.message } });
  }
}));

// ========================
// 打卡同步查询接口
// ========================

router.get('/checkins', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { page = '1', limit = '30', sync_status } = req.query as Record<string, string>;

  if (isMockMode()) {
    const mockCheckins = [
      { sync_record_id: 1, checkin_id: 1001, checkin_date: new Date().toISOString().split('T')[0], streak_count: 5, points_earned: 30, sync_status: 'synced', created_at: new Date().toISOString() },
      { sync_record_id: 2, checkin_id: 1002, checkin_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], streak_count: 4, points_earned: 20, sync_status: 'synced', created_at: new Date(Date.now() - 86400000).toISOString() },
    ];
    res.json({ success: true, data: { list: mockCheckins, total: mockCheckins.length, totalPages: 1 } });
    return;
  }

  try {
    const result = await query(
      'sync',
      'EXEC sp_sync_get_user_checkins @user_id = @uid, @page = @p, @limit = @l, @sync_status = @status',
      { uid: userId, p: parseInt(page), l: parseInt(limit), status: sync_status || null }
    );

    const countResult = await query(
      'sync',
      'SELECT COUNT(*) AS total FROM dbo.user_checkin_sync WHERE [user_id] = @uid AND (@status IS NULL OR [sync_status] = @status)',
      { uid: userId, status: sync_status || null }
    );

    const list = Array.isArray(result) ? result : [];
    const total = countResult.length > 0 ? (countResult[0] as any).total : list.length;

    res.json({ success: true, data: { list, total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err: any) {
    logger.error(`获取打卡同步记录失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.json({ success: true, data: { list: [], total: 0, totalPages: 0 } });
  }
}));

router.get('/checkins/pending', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;

  if (isMockMode()) {
    res.json({ success: true, data: [] });
    return;
  }

  try {
    const result = await query(
      'sync',
      'EXEC sp_sync_get_pending_checkins @user_id = @uid',
      { uid: userId }
    );

    res.json({ success: true, data: Array.isArray(result) ? result : [] });
  } catch (err: any) {
    logger.error(`获取待同步打卡记录失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.json({ success: true, data: [] });
  }
}));

router.get('/checkins/stats', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;

  if (isMockMode()) {
    res.json({ success: true, data: { total_records: 10, pending_count: 0, synced_count: 10, last_checkin_date: new Date().toISOString().split('T')[0], last_sync_time: new Date().toISOString() } });
    return;
  }

  try {
    const result = await query(
      'sync',
      'EXEC sp_sync_get_checkin_stats @user_id = @uid',
      { uid: userId }
    );

    const stats = Array.isArray(result) && result.length > 0 ? result[0] : {
      total_records: 0,
      pending_count: 0,
      synced_count: 0,
      last_checkin_date: null,
      last_sync_time: null,
    };

    res.json({ success: true, data: stats });
  } catch (err: any) {
    logger.error(`获取打卡同步统计失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.json({ success: true, data: { total_records: 0, pending_count: 0, synced_count: 0, last_checkin_date: null, last_sync_time: null } });
  }
}));

export default router;
