import { Router } from 'express';
import { query, execute, isMockMode } from '../../config/database';
import { authMiddleware } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/errorHandler';
import { getSyncStats, pushToUser } from '../../services/SyncService';
import { dataSyncService, SyncStatusInfo, SyncConflict } from '../../services/DataSyncService';

const router = Router();

const logger = {
  info: (msg: string, data?: any) => console.log(`[Sync] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`[Sync] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`[Sync] ${msg}`, data || ''),
};

router.get('/status', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const stats = getSyncStats();
  
  let userStatus: SyncStatusInfo | null = null;
  if (!isMockMode() && userId) {
    userStatus = await dataSyncService.getSyncStatus(userId);
  }

  res.json({
    success: true,
    data: {
      serviceStatus: 'running',
      ...stats,
      userStatus,
    },
  });
}));

router.get('/detailed-status', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: { message: '未登录' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        user_id: userId,
        last_sync_at: new Date().toISOString(),
        last_checkin_sync_at: new Date().toISOString(),
        last_points_sync_at: new Date(Date.now() - 3600000).toISOString(),
        sync_version: 15,
        pending_operations: 0,
        pending_conflicts: 0,
        device_count: 2,
        sync_latency_ms: 120,
        sync_health: 'healthy',
      },
    });
    return;
  }

  const status = await dataSyncService.getSyncStatus(userId);
  if (status) {
    const latency = status.last_sync_at ? Date.now() - new Date(status.last_sync_at).getTime() : 0;
    res.json({
      success: true,
      data: {
        ...status,
        sync_latency_ms: latency,
        sync_health: latency < 30000 ? 'healthy' : latency < 60000 ? 'warning' : 'critical',
      },
    });
  } else {
    res.json({
      success: true,
      data: {
        user_id: userId,
        last_sync_at: null,
        last_checkin_sync_at: null,
        last_points_sync_at: null,
        sync_version: 0,
        pending_operations: 0,
        pending_conflicts: 0,
        device_count: 0,
        sync_latency_ms: 0,
        sync_health: 'unknown',
      },
    });
  }
}));

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
    let queryStr = 'SELECT [operation_id] AS sync_id, [user_id], [operation_type] AS sync_type, [device_id], [sync_status] AS status, [operation_time] AS timestamp, [operation_data] AS details FROM dbo.sync_operations WHERE [user_id] = @uid';
    const params: Record<string, any> = { uid: userId };

    if (startDate) {
      queryStr += ' AND [operation_time] >= @startDate';
      params.startDate = startDate;
    }
    if (endDate) {
      queryStr += ' AND [operation_time] <= @endDate';
      params.endDate = endDate;
    }

    queryStr += ' ORDER BY [operation_time] DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    params.offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    params.limit = parseInt(limit as string);

    const result = await query('sync', queryStr, params);
    
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

  const result = await dataSyncService.performFullSync(userId, deviceId || 'api_sync');
  
  if (result.success) {
    res.json({ 
      success: true, 
      data: { 
        syncId: result.sync_id, 
        status: 'completed',
        syncedData: { checkins: result.synced_count },
        latency_ms: result.latency_ms,
      } 
    });
  } else {
    res.status(500).json({ success: false, error: { message: result.message } });
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

  const lastSyncDate = new Date(lastSyncTime);
  const result = await dataSyncService.performDeltaSync(userId, lastSyncDate, deviceId || 'api_sync');
  
  if (result.success) {
    const pendingOps = await dataSyncService.getPendingOperations(userId, deviceId || 'api_sync');
    
    res.json({ 
      success: true, 
      data: { 
        hasChanges: pendingOps.length > 0,
        syncTime: new Date().toISOString(),
        changes: pendingOps,
        deviceId,
        latency_ms: result.latency_ms,
      } 
    });
  } else {
    res.status(500).json({ success: false, error: { message: result.message } });
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

router.post('/sync-checkins', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { checkins, deviceId } = req.body;

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
        latency_ms: 50,
      },
    });
    return;
  }

  let syncedCount = 0;
  let conflictCount = 0;
  const results = [];

  for (const checkin of checkins) {
    const result = await dataSyncService.syncCheckinData(userId, checkin, deviceId || 'api_sync');
    results.push(result);
    if (result.success) {
      syncedCount++;
    }
    conflictCount += result.conflict_count;
  }

  logger.info(`批量同步打卡完成 - 用户: ${userId}, 同步数量: ${syncedCount}, 冲突数量: ${conflictCount}`);
  
  res.json({ 
    success: syncedCount > 0, 
    data: { 
      syncedCount, 
      conflicts: conflictCount,
      failedCount: checkins.length - syncedCount,
      latency_ms: results.reduce((acc, r) => acc + r.latency_ms, 0) / results.length,
    } 
  });
}));

router.post('/sync-points', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { pointsData, deviceId } = req.body;

  if (!pointsData || typeof pointsData !== 'object') {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 pointsData' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        synced: true,
        conflicts: 0,
        latency_ms: 30,
      },
    });
    return;
  }

  const result = await dataSyncService.syncUserPointsData(userId, pointsData, deviceId || 'api_sync');
  
  if (result.success) {
    res.json({ 
      success: true, 
      data: { 
        synced: true, 
        conflicts: result.conflict_count,
        latency_ms: result.latency_ms,
      } 
    });
  } else {
    res.status(500).json({ success: false, error: { message: result.message } });
  }
}));

router.post('/sync-answer', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { answerData, deviceId } = req.body;

  if (!answerData || typeof answerData !== 'object') {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 answerData' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        synced: true,
        conflicts: 0,
        latency_ms: 25,
      },
    });
    return;
  }

  const result = await dataSyncService.syncAnswerHistoryData(userId, answerData, deviceId || 'api_sync');
  
  if (result.success) {
    res.json({ 
      success: true, 
      data: { 
        synced: true, 
        conflicts: result.conflict_count,
        latency_ms: result.latency_ms,
      } 
    });
  } else {
    res.status(500).json({ success: false, error: { message: result.message } });
  }
}));

router.post('/sync-mode', authMiddleware, asyncHandler(async (req, res) => {
  const { modeData, deviceId } = req.body;

  if (!modeData || typeof modeData !== 'object') {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 modeData' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        synced: true,
        latency_ms: 20,
      },
    });
    return;
  }

  const result = await dataSyncService.syncCompetitionModeData(modeData, deviceId || 'api_sync');
  
  if (result.success) {
    res.json({ 
      success: true, 
      data: { 
        synced: true,
        latency_ms: result.latency_ms,
      } 
    });
  } else {
    res.status(500).json({ success: false, error: { message: result.message } });
  }
}));

router.post('/sync-challenge', authMiddleware, asyncHandler(async (req, res) => {
  const { challengeData, deviceId } = req.body;

  if (!challengeData || typeof challengeData !== 'object') {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 challengeData' } });
    return;
  }

  if (isMockMode()) {
    res.json({
      success: true,
      data: {
        synced: true,
        latency_ms: 22,
      },
    });
    return;
  }

  const result = await dataSyncService.syncDailyChallengeData(challengeData, deviceId || 'api_sync');
  
  if (result.success) {
    res.json({ 
      success: true, 
      data: { 
        synced: true,
        latency_ms: result.latency_ms,
      } 
    });
  } else {
    res.status(500).json({ success: false, error: { message: result.message } });
  }
}));

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

router.get('/conflicts', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { resolved = '0' } = req.query as Record<string, string>;

  if (isMockMode()) {
    res.json({ success: true, data: [] });
    return;
  }

  try {
    const conflicts: SyncConflict[] = await dataSyncService.getPendingConflicts(userId);
    res.json({ success: true, data: conflicts });
  } catch (err: any) {
    logger.error(`获取冲突列表失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.json({ success: true, data: [] });
  }
}));

router.post('/resolve-conflict', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { conflictId, strategy } = req.body;

  if (!conflictId) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 conflictId' } });
    return;
  }

  if (isMockMode()) {
    res.json({ success: true, data: { resolved: true, strategy: strategy || 'latest_wins' } });
    return;
  }

  try {
    const conflicts = await dataSyncService.getPendingConflicts(userId);
    const conflict = conflicts.find(c => c.conflict_id === conflictId);

    if (!conflict) {
      res.status(404).json({ success: false, error: { message: '冲突不存在或已解决' } });
      return;
    }

    const resolution = await dataSyncService.resolveConflict(conflict, strategy || 'latest_wins');
    
    if (resolution.resolved) {
      res.json({ success: true, data: { resolved: true, strategy: strategy || 'latest_wins' } });
    } else {
      res.status(500).json({ success: false, error: { message: '冲突解决失败' } });
    }
  } catch (err: any) {
    logger.error(`解决冲突失败 - 用户: ${userId}, 冲突ID: ${conflictId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '冲突解决失败', details: err.message } });
  }
}));

router.get('/pending-operations', authMiddleware, asyncHandler(async (req, res) => {
  const userId = (req as any).user?.userId;
  const { deviceId } = req.query;

  if (isMockMode()) {
    res.json({ success: true, data: [] });
    return;
  }

  try {
    const operations = await dataSyncService.getPendingOperations(userId, deviceId as string || 'api_sync');
    res.json({ success: true, data: operations });
  } catch (err: any) {
    logger.error(`获取待同步操作失败 - 用户: ${userId}, 错误: ${err.message}`);
    res.json({ success: true, data: [] });
  }
}));

router.post('/mark-synced', authMiddleware, asyncHandler(async (req, res) => {
  const { operationId, deviceId } = req.body;

  if (!operationId) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 operationId' } });
    return;
  }

  if (isMockMode()) {
    res.json({ success: true, data: { marked: true } });
    return;
  }

  try {
    const success = await dataSyncService.markOperationSynced(operationId, deviceId);
    res.json({ success, data: { marked: success } });
  } catch (err: any) {
    logger.error(`标记操作已同步失败 - 操作ID: ${operationId}, 错误: ${err.message}`);
    res.status(500).json({ success: false, error: { message: '标记失败', details: err.message } });
  }
}));

router.post('/validate-checkin', authMiddleware, asyncHandler(async (req, res) => {
  const { checkinData } = req.body;

  if (!checkinData) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 checkinData' } });
    return;
  }

  const validation = await dataSyncService.validateCheckinData(checkinData);
  
  res.json({
    success: true,
    data: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    },
  });
}));

router.post('/validate-points', authMiddleware, asyncHandler(async (req, res) => {
  const { pointsData } = req.body;

  if (!pointsData) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 pointsData' } });
    return;
  }

  const validation = await dataSyncService.validateUserPointsData(pointsData);
  
  res.json({
    success: true,
    data: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    },
  });
}));

router.post('/validate-answer', authMiddleware, asyncHandler(async (req, res) => {
  const { answerData } = req.body;

  if (!answerData) {
    res.status(400).json({ success: false, error: { message: '缺少必要参数 answerData' } });
    return;
  }

  const validation = await dataSyncService.validateAnswerHistoryData(answerData);
  
  res.json({
    success: true,
    data: {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    },
  });
}));

export default router;