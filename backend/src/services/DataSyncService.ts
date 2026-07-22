// ============================================
// 筑见山河 - 数据同步核心服务
// 实现Competition数据库与Sync数据库的协同工作
// 支持数据校验、冲突解决、日志记录和实时同步
// ============================================

import { query, execute, transaction } from '../config/database';
import { createLogger, ErrorType } from '../utils/logger';
import { pushToUser } from './SyncService';

const logger = createLogger('DataSyncService');

export type SyncEntityType = 'checkin' | 'user_points' | 'answer_history' | 'competition_mode' | 'daily_challenge';
export type SyncOperationType = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'pending' | 'synced' | 'failed';
export type ConflictResolutionStrategy = 'latest_wins' | 'server_wins' | 'merge' | 'user_choice';

export interface SyncRecord {
  user_id: number;
  entity_type: SyncEntityType;
  entity_id: number;
  operation_type: SyncOperationType;
  operation_data: any;
  device_id: string;
  operation_time: Date;
  sync_status: SyncStatus;
}

export interface SyncConflict {
  conflict_id: number;
  user_id: number;
  entity_type: SyncEntityType;
  entity_id: number;
  device_a_id: string;
  device_b_id: string;
  data_a: any;
  data_b: any;
  data_a_time: Date;
  data_b_time: Date;
  conflict_type: string;
  resolved: boolean;
  resolved_at?: Date;
  resolved_choice?: ConflictResolutionStrategy;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SyncResult {
  success: boolean;
  message: string;
  sync_id?: string;
  conflict_count: number;
  synced_count: number;
  failed_count: number;
  latency_ms: number;
}

export interface SyncStatusInfo {
  user_id: number;
  last_sync_at: Date | null;
  last_checkin_sync_at: Date | null;
  last_points_sync_at: Date | null;
  sync_version: number;
  pending_operations: number;
  pending_conflicts: number;
  device_count: number;
}

const SYNC_TIMEOUT = 5000;

export class DataSyncService {
  private static instance: DataSyncService;

  private constructor() {}

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  async validateCheckinData(data: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('打卡数据格式无效');
      return { valid: false, errors, warnings };
    }

    if (!data.user_id || typeof data.user_id !== 'number' || data.user_id <= 0) {
      errors.push('用户ID无效');
    }

    if (!data.checkin_date) {
      errors.push('打卡日期不能为空');
    } else {
      const date = new Date(data.checkin_date);
      if (isNaN(date.getTime())) {
        errors.push('打卡日期格式无效');
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkinDate = new Date(data.checkin_date);
        checkinDate.setHours(0, 0, 0, 0);
        if (checkinDate > today) {
          errors.push('打卡日期不能超过今天');
        }
      }
    }

    if (!data.checkin_time) {
      warnings.push('未提供打卡时间，将使用当前时间');
    } else {
      const time = new Date(data.checkin_time);
      if (isNaN(time.getTime())) {
        warnings.push('打卡时间格式无效，将使用当前时间');
      }
    }

    if (data.streak_count !== undefined) {
      if (typeof data.streak_count !== 'number' || data.streak_count < 0) {
        errors.push('连续打卡次数必须为非负整数');
      }
    }

    if (data.points_earned !== undefined) {
      if (typeof data.points_earned !== 'number' || data.points_earned < 0) {
        errors.push('获得积分必须为非负整数');
      }
    }

    if (data.device_type && typeof data.device_type !== 'string') {
      warnings.push('设备类型应为字符串，将被忽略');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async validateUserPointsData(data: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('用户积分数据格式无效');
      return { valid: false, errors, warnings };
    }

    if (!data.user_id || typeof data.user_id !== 'number' || data.user_id <= 0) {
      errors.push('用户ID无效');
    }

    const pointFields = ['total_points', 'entry_points', 'basic_points', 'challenge_points', 'advanced_points', 'expert_points'];
    for (const field of pointFields) {
      if (data[field] !== undefined) {
        if (typeof data[field] !== 'number' || data[field] < 0) {
          errors.push(`${field}必须为非负整数`);
        }
      }
    }

    if (data.current_level !== undefined) {
      if (typeof data.current_level !== 'number' || data.current_level < 1 || data.current_level > 5) {
        errors.push('当前等级必须在1-5之间');
      }
    }

    if (data.games_played !== undefined) {
      if (typeof data.games_played !== 'number' || data.games_played < 0) {
        errors.push('游戏次数必须为非负整数');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async validateAnswerHistoryData(data: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('答题记录数据格式无效');
      return { valid: false, errors, warnings };
    }

    if (!data.user_id || typeof data.user_id !== 'number' || data.user_id <= 0) {
      errors.push('用户ID无效');
    }

    if (!data.question_id || typeof data.question_id !== 'number' || data.question_id <= 0) {
      errors.push('题目ID无效');
    }

    if (!data.selected_answer || !['A', 'B', 'C', 'D'].includes(data.selected_answer)) {
      errors.push('选择的答案必须是A、B、C或D');
    }

    if (data.is_correct !== undefined && typeof data.is_correct !== 'boolean') {
      errors.push('是否正确必须是布尔值');
    }

    if (data.points_earned !== undefined) {
      if (typeof data.points_earned !== 'number' || data.points_earned < 0) {
        errors.push('获得积分必须为非负整数');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async detectConflict(
    user_id: number,
    entity_type: SyncEntityType,
    entity_id: number,
    new_data: any,
    new_device_id: string,
    new_time: Date
  ): Promise<SyncConflict | null> {
    try {
      const existingRecords = await query('sync',
        'SELECT [device_id], [operation_data], [operation_time] FROM dbo.sync_operations ' +
        'WHERE [user_id] = @uid AND [entity_type] = @et AND [entity_id] = @eid AND [sync_status] = @status ' +
        'ORDER BY [operation_time] DESC',
        { uid: user_id, et: entity_type, eid: entity_id, status: 'pending' }
      );

      if (!existingRecords || existingRecords.length === 0) {
        return null;
      }

      const recentRecord = existingRecords[0];
      const existingDeviceId = recentRecord.device_id;
      const existingData = JSON.parse(recentRecord.operation_data || '{}');
      const existingTime = new Date(recentRecord.operation_time);

      if (existingDeviceId !== new_device_id) {
        return {
          conflict_id: 0,
          user_id,
          entity_type,
          entity_id,
          device_a_id: existingDeviceId,
          device_b_id: new_device_id,
          data_a: existingData,
          data_b: new_data,
          data_a_time: existingTime,
          data_b_time: new_time,
          conflict_type: 'update',
          resolved: false,
        };
      }

      return null;
    } catch (err: any) {
      logger.error('检测冲突失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        entityType: entity_type,
        entityId: entity_id,
        message: err.message,
      });
      return null;
    }
  }

  async resolveConflict(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy = 'latest_wins'
  ): Promise<{ resolved: boolean; chosen_data: any }> {
    try {
      let chosen_data = conflict.data_a;
      let resolved_by = strategy;

      switch (strategy) {
        case 'latest_wins':
          chosen_data = conflict.data_b_time > conflict.data_a_time ? conflict.data_b : conflict.data_a;
          break;
        case 'server_wins':
          chosen_data = conflict.data_a;
          break;
        case 'merge':
          chosen_data = { ...conflict.data_a, ...conflict.data_b };
          break;
        case 'user_choice':
          chosen_data = conflict.data_b;
          break;
        default:
          chosen_data = conflict.data_b_time > conflict.data_a_time ? conflict.data_b : conflict.data_a;
      }

      const result = await execute('sync',
        'EXEC sp_sync_resolve_conflict @conflict_id = @cid, @resolved_by = @rb, @resolved_choice = @rc',
        { cid: conflict.conflict_id, rb: 0, rc: strategy }
      );

      logger.info('冲突已解决', {
        userId: conflict.user_id,
        entityType: conflict.entity_type,
        entityId: conflict.entity_id,
        strategy,
      });

      return { resolved: true, chosen_data };
    } catch (err: any) {
      logger.error('解决冲突失败', {
        errorType: ErrorType.DATABASE_ERROR,
        conflictId: conflict.conflict_id,
        strategy,
        message: err.message,
      });
      return { resolved: false, chosen_data: conflict.data_a };
    }
  }

  async logSyncOperation(
    user_id: number,
    device_id: string,
    operation_type: SyncOperationType,
    entity_type: SyncEntityType,
    entity_id: number,
    operation_data: any
  ): Promise<void> {
    try {
      await execute('sync',
        'EXEC sp_sync_log_operation @user_id = @uid, @device_id = @did, @operation_type = @type, @entity_type = @et, @entity_id = @eid, @operation_data = @data',
        {
          uid: user_id,
          did: device_id,
          type: operation_type,
          et: entity_type,
          eid: entity_id,
          data: JSON.stringify(operation_data),
        }
      );

      logger.info('同步操作已记录', {
        userId: user_id,
        deviceId: device_id,
        operationType: operation_type,
        entityType: entity_type,
        entityId: entity_id,
      });
    } catch (err: any) {
      logger.error('记录同步操作失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        operationType: operation_type,
        message: err.message,
      });
      throw err;
    }
  }

  async logConflict(conflict: SyncConflict): Promise<void> {
    try {
      await execute('sync',
        'EXEC sp_sync_log_conflict @user_id = @uid, @entity_type = @et, @entity_id = @eid, ' +
        '@device_a_id = @daid, @device_b_id = @dbid, @data_a = @da, @data_b = @db, ' +
        '@data_a_time = @dat, @data_b_time = @dbt, @conflict_type = @ct',
        {
          uid: conflict.user_id,
          et: conflict.entity_type,
          eid: conflict.entity_id,
          daid: conflict.device_a_id,
          dbid: conflict.device_b_id,
          da: JSON.stringify(conflict.data_a),
          db: JSON.stringify(conflict.data_b),
          dat: conflict.data_a_time,
          dbt: conflict.data_b_time,
          ct: conflict.conflict_type,
        }
      );

      logger.warn('检测到同步冲突', {
        userId: conflict.user_id,
        entityType: conflict.entity_type,
        entityId: conflict.entity_id,
        deviceA: conflict.device_a_id,
        deviceB: conflict.device_b_id,
      });
    } catch (err: any) {
      logger.error('记录冲突失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: conflict.user_id,
        message: err.message,
      });
    }
  }

  async syncCheckinData(
    user_id: number,
    checkin_data: any,
    device_id: string = 'api_sync'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let conflict_count = 0;
    let synced_count = 0;
    let failed_count = 0;

    try {
      const validation = await this.validateCheckinData(checkin_data);
      if (!validation.valid) {
        return {
          success: false,
          message: `数据验证失败: ${validation.errors.join(', ')}`,
          conflict_count: 0,
          synced_count: 0,
          failed_count: 1,
          latency_ms: Date.now() - startTime,
        };
      }

      const operation_time = new Date(checkin_data.checkin_time || Date.now());

      const conflict = await this.detectConflict(
        user_id,
        'checkin',
        checkin_data.checkin_id || Date.now(),
        checkin_data,
        device_id,
        operation_time
      );

      if (conflict) {
        conflict_count++;
        await this.logConflict(conflict);

        const resolution = await this.resolveConflict(conflict, 'latest_wins');
        if (!resolution.resolved) {
          return {
            success: false,
            message: '冲突解决失败',
            conflict_count,
            synced_count,
            failed_count: 1,
            latency_ms: Date.now() - startTime,
          };
        }
      }

      await execute('sync',
        'EXEC sp_sync_record_checkin @user_id = @uid, @checkin_id = @cid, @checkin_date = @cd, ' +
        '@checkin_time = @ct, @streak_count = @sc, @points_earned = @pe, @device_type = @dt, @device_info = @di',
        {
          uid: user_id,
          cid: checkin_data.checkin_id || Date.now(),
          cd: checkin_data.checkin_date,
          ct: checkin_data.checkin_time || new Date().toISOString(),
          sc: checkin_data.streak_count || 1,
          pe: checkin_data.points_earned || 0,
          dt: checkin_data.device_type || null,
          di: checkin_data.device_info || null,
        }
      );

      await this.logSyncOperation(
        user_id,
        device_id,
        'INSERT',
        'checkin',
        checkin_data.checkin_id || Date.now(),
        checkin_data
      );

      await execute('sync',
        'EXEC sp_sync_update_user_status @user_id = @uid, @sync_type = @type',
        { uid: user_id, type: 'checkin' }
      );

      synced_count++;

      pushToUser(user_id, 'sync:checkin_update', {
        checkins: [checkin_data],
        timestamp: Date.now(),
      });

      const latency = Date.now() - startTime;
      if (latency > SYNC_TIMEOUT) {
        logger.warn('同步延迟超过5秒', {
          userId: user_id,
          latency_ms: latency,
        });
      }

      return {
        success: true,
        message: '打卡数据同步成功',
        sync_id: `sync_${Date.now()}`,
        conflict_count,
        synced_count,
        failed_count,
        latency_ms: latency,
      };
    } catch (err: any) {
      failed_count++;
      logger.error('同步打卡数据失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        message: `同步失败: ${err.message}`,
        conflict_count,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    }
  }

  async syncUserPointsData(
    user_id: number,
    points_data: any,
    device_id: string = 'api_sync'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let conflict_count = 0;
    let synced_count = 0;
    let failed_count = 0;

    try {
      const validation = await this.validateUserPointsData(points_data);
      if (!validation.valid) {
        return {
          success: false,
          message: `数据验证失败: ${validation.errors.join(', ')}`,
          conflict_count: 0,
          synced_count: 0,
          failed_count: 1,
          latency_ms: Date.now() - startTime,
        };
      }

      const operation_time = new Date();

      const conflict = await this.detectConflict(
        user_id,
        'user_points',
        user_id,
        points_data,
        device_id,
        operation_time
      );

      if (conflict) {
        conflict_count++;
        await this.logConflict(conflict);
        await this.resolveConflict(conflict, 'latest_wins');
      }

      await transaction('competition', async (tx) => {
        const existingPoints = await tx.request()
          .input('uid', user_id)
          .query('SELECT * FROM [user_competition_points] WHERE [external_user_id] = @uid');

        if (existingPoints.recordset.length > 0) {
          const setClauses: string[] = [];
          const params: Record<string, any> = { uid: user_id };

          const fields: string[] = ['total_points', 'entry_points', 'basic_points', 'challenge_points', 'advanced_points', 'expert_points', 'current_level', 'games_played', 'total_correct', 'total_questions'];
          for (const field of fields) {
            if (points_data[field] !== undefined) {
              setClauses.push(`[${field}] = @${field}`);
              params[field] = points_data[field];
            }
          }

          if (setClauses.length > 0) {
            setClauses.push('[updated_at] = GETDATE()');
            await tx.request()
              .input('uid', user_id)
              .query(`UPDATE [user_competition_points] SET ${setClauses.join(', ')} WHERE [external_user_id] = @uid`);
          }
        } else {
          await tx.request()
            .input('uid', user_id)
            .input('total_points', points_data.total_points || 0)
            .input('entry_points', points_data.entry_points || 0)
            .input('basic_points', points_data.basic_points || 0)
            .input('challenge_points', points_data.challenge_points || 0)
            .input('advanced_points', points_data.advanced_points || 0)
            .input('expert_points', points_data.expert_points || 0)
            .input('current_level', points_data.current_level || 1)
            .input('games_played', points_data.games_played || 0)
            .input('total_correct', points_data.total_correct || 0)
            .input('total_questions', points_data.total_questions || 0)
            .query(
              'INSERT INTO [user_competition_points] ([external_user_id], [total_points], [entry_points], [basic_points], [challenge_points], [advanced_points], [expert_points], [current_level], [games_played], [total_correct], [total_questions]) ' +
              'VALUES (@uid, @total_points, @entry_points, @basic_points, @challenge_points, @advanced_points, @expert_points, @current_level, @games_played, @total_correct, @total_questions)'
            );
        }
      });

      await this.logSyncOperation(
        user_id,
        device_id,
        'UPDATE',
        'user_points',
        user_id,
        points_data
      );

      await execute('sync',
        'EXEC sp_sync_update_user_status @user_id = @uid, @sync_type = @type',
        { uid: user_id, type: 'activity' }
      );

      synced_count++;

      pushToUser(user_id, 'sync:user_points_update', {
        userId: user_id,
        points: points_data,
        timestamp: Date.now(),
      });

      return {
        success: true,
        message: '用户积分数据同步成功',
        sync_id: `sync_${Date.now()}`,
        conflict_count,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      failed_count++;
      logger.error('同步用户积分数据失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        message: `同步失败: ${err.message}`,
        conflict_count,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    }
  }

  async syncAnswerHistoryData(
    user_id: number,
    answer_data: any,
    device_id: string = 'api_sync'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let conflict_count = 0;
    let synced_count = 0;
    let failed_count = 0;

    try {
      const validation = await this.validateAnswerHistoryData(answer_data);
      if (!validation.valid) {
        return {
          success: false,
          message: `数据验证失败: ${validation.errors.join(', ')}`,
          conflict_count: 0,
          synced_count: 0,
          failed_count: 1,
          latency_ms: Date.now() - startTime,
        };
      }

      const operation_time = new Date();

      const conflict = await this.detectConflict(
        user_id,
        'answer_history',
        answer_data.question_id,
        answer_data,
        device_id,
        operation_time
      );

      if (conflict) {
        conflict_count++;
        await this.logConflict(conflict);
        await this.resolveConflict(conflict, 'server_wins');
      }

      await execute('competition',
        'INSERT INTO [user_answer_history] ([external_user_id], [question_id], [selected_answer], [is_correct], [points_earned], [answered_at], [session_id], [competition_mode], [difficulty_level]) ' +
        'VALUES (@user_id, @question_id, @answer, @is_correct, @points, GETDATE(), @session_id, @mode, @difficulty)',
        {
          user_id: user_id,
          question_id: answer_data.question_id,
          answer: answer_data.selected_answer,
          is_correct: answer_data.is_correct ? 1 : 0,
          points: answer_data.points_earned || 0,
          session_id: answer_data.session_id || null,
          mode: answer_data.competition_mode || null,
          difficulty: answer_data.difficulty_level || null,
        }
      );

      await this.logSyncOperation(
        user_id,
        device_id,
        'INSERT',
        'answer_history',
        answer_data.question_id,
        answer_data
      );

      synced_count++;

      pushToUser(user_id, 'sync:answer_update', {
        userId: user_id,
        answer: answer_data,
        timestamp: Date.now(),
      });

      return {
        success: true,
        message: '答题记录数据同步成功',
        sync_id: `sync_${Date.now()}`,
        conflict_count,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      failed_count++;
      logger.error('同步答题记录数据失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        message: `同步失败: ${err.message}`,
        conflict_count,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    }
  }

  async syncCompetitionModeData(
    mode_data: any,
    device_id: string = 'api_sync'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let synced_count = 0;
    let failed_count = 0;

    try {
      if (!mode_data.mode_id || typeof mode_data.mode_id !== 'string') {
        return {
          success: false,
          message: '竞赛模式ID无效',
          conflict_count: 0,
          synced_count: 0,
          failed_count: 1,
          latency_ms: Date.now() - startTime,
        };
      }

      const existingMode = await query('competition',
        'SELECT * FROM [competition_mode] WHERE [mode_id] = @mid',
        { mid: mode_data.mode_id }
      );

      if (existingMode.length > 0) {
        await execute('competition',
          'UPDATE [competition_mode] SET [title] = @title, [description] = @desc, [difficulty] = @diff, [time_limit] = @tl, [icon] = @icon, [is_active] = @active, [sort_order] = @so ' +
          'WHERE [mode_id] = @mid',
          {
            mid: mode_data.mode_id,
            title: mode_data.title || '',
            desc: mode_data.description || null,
            diff: mode_data.difficulty || null,
            tl: mode_data.time_limit || 600,
            icon: mode_data.icon || null,
            active: mode_data.is_active !== undefined ? (mode_data.is_active ? 1 : 0) : 1,
            so: mode_data.sort_order || 0,
          }
        );
      } else {
        await execute('competition',
          'INSERT INTO [competition_mode] ([mode_id], [title], [description], [difficulty], [time_limit], [icon], [is_active], [sort_order]) ' +
          'VALUES (@mid, @title, @desc, @diff, @tl, @icon, @active, @so)',
          {
            mid: mode_data.mode_id,
            title: mode_data.title || '',
            desc: mode_data.description || null,
            diff: mode_data.difficulty || null,
            tl: mode_data.time_limit || 600,
            icon: mode_data.icon || null,
            active: mode_data.is_active !== undefined ? (mode_data.is_active ? 1 : 0) : 1,
            so: mode_data.sort_order || 0,
          }
        );
      }

      synced_count++;

      pushToUser(0, 'sync:mode_update', {
        mode: mode_data,
        timestamp: Date.now(),
      });

      return {
        success: true,
        message: '竞赛模式数据同步成功',
        sync_id: `sync_${Date.now()}`,
        conflict_count: 0,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      failed_count++;
      logger.error('同步竞赛模式数据失败', {
        errorType: ErrorType.DATABASE_ERROR,
        modeId: mode_data.mode_id,
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        message: `同步失败: ${err.message}`,
        conflict_count: 0,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    }
  }

  async syncDailyChallengeData(
    challenge_data: any,
    device_id: string = 'api_sync'
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let synced_count = 0;
    let failed_count = 0;

    try {
      if (!challenge_data.challenge_date) {
        return {
          success: false,
          message: '挑战日期不能为空',
          conflict_count: 0,
          synced_count: 0,
          failed_count: 1,
          latency_ms: Date.now() - startTime,
        };
      }

      const existingChallenge = await query('competition',
        'SELECT * FROM [daily_challenge] WHERE [challenge_date] = @cd',
        { cd: challenge_data.challenge_date }
      );

      if (existingChallenge.length > 0) {
        await execute('competition',
          'UPDATE [daily_challenge] SET [title] = @title, [description] = @desc, [image_url] = @img, [difficulty] = @diff, [points_reward] = @pr, [question_count] = @qc, [time_limit] = @tl, [external_building_ids] = @ebi ' +
          'WHERE [challenge_date] = @cd',
          {
            cd: challenge_data.challenge_date,
            title: challenge_data.title || '',
            desc: challenge_data.description || null,
            img: challenge_data.image_url || null,
            diff: challenge_data.difficulty || '困难',
            pr: challenge_data.points_reward || 100,
            qc: challenge_data.question_count || 5,
            tl: challenge_data.time_limit || 300,
            ebi: challenge_data.external_building_ids || null,
          }
        );
      } else {
        await execute('competition',
          'INSERT INTO [daily_challenge] ([challenge_date], [title], [description], [image_url], [difficulty], [points_reward], [question_count], [time_limit], [external_building_ids]) ' +
          'VALUES (@cd, @title, @desc, @img, @diff, @pr, @qc, @tl, @ebi)',
          {
            cd: challenge_data.challenge_date,
            title: challenge_data.title || '',
            desc: challenge_data.description || null,
            img: challenge_data.image_url || null,
            diff: challenge_data.difficulty || '困难',
            pr: challenge_data.points_reward || 100,
            qc: challenge_data.question_count || 5,
            tl: challenge_data.time_limit || 300,
            ebi: challenge_data.external_building_ids || null,
          }
        );
      }

      synced_count++;

      pushToUser(0, 'sync:challenge_update', {
        challenge: challenge_data,
        timestamp: Date.now(),
      });

      return {
        success: true,
        message: '每日挑战数据同步成功',
        sync_id: `sync_${Date.now()}`,
        conflict_count: 0,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      failed_count++;
      logger.error('同步每日挑战数据失败', {
        errorType: ErrorType.DATABASE_ERROR,
        challengeDate: challenge_data.challenge_date,
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        message: `同步失败: ${err.message}`,
        conflict_count: 0,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    }
  }

  async getSyncStatus(user_id: number): Promise<SyncStatusInfo | null> {
    try {
      const statusResult = await query('sync',
        'EXEC sp_sync_get_user_status @user_id = @uid',
        { uid: user_id }
      );

      const pendingResult = await query('sync',
        'SELECT COUNT(*) AS pending_count FROM dbo.sync_operations WHERE [user_id] = @uid AND [sync_status] = @status',
        { uid: user_id, status: 'pending' }
      );

      const conflictResult = await query('sync',
        'SELECT COUNT(*) AS conflict_count FROM dbo.sync_conflicts WHERE [user_id] = @uid AND [resolved] = @resolved',
        { uid: user_id, resolved: 0 }
      );

      const deviceResult = await query('sync',
        'EXEC sp_sync_get_user_devices @user_id = @uid',
        { uid: user_id }
      );

      const status = statusResult.length > 0 ? statusResult[0] : null;

      return {
        user_id,
        last_sync_at: status?.last_sync_at || null,
        last_checkin_sync_at: status?.last_checkin_sync_at || null,
        last_points_sync_at: status?.last_activity_sync_at || null,
        sync_version: status?.sync_version || 0,
        pending_operations: pendingResult.length > 0 ? pendingResult[0].pending_count : 0,
        pending_conflicts: conflictResult.length > 0 ? conflictResult[0].conflict_count : 0,
        device_count: deviceResult.length || 0,
      };
    } catch (err: any) {
      logger.error('获取同步状态失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        message: err.message,
      });
      return null;
    }
  }

  async getPendingOperations(user_id: number, device_id: string): Promise<SyncRecord[]> {
    try {
      const result = await query('sync',
        'EXEC sp_sync_get_pending_operations @user_id = @uid, @device_id = @did',
        { uid: user_id, did: device_id }
      );

      return result.map((record: any) => ({
        user_id,
        entity_type: record.entity_type as SyncEntityType,
        entity_id: record.entity_id,
        operation_type: record.operation_type as SyncOperationType,
        operation_data: JSON.parse(record.operation_data || '{}'),
        device_id: record.device_id,
        operation_time: new Date(record.operation_time),
        sync_status: 'pending' as SyncStatus,
      }));
    } catch (err: any) {
      logger.error('获取待同步操作失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        message: err.message,
      });
      return [];
    }
  }

  async getPendingConflicts(user_id: number): Promise<SyncConflict[]> {
    try {
      const result = await query('sync',
        'EXEC sp_sync_get_user_conflicts @user_id = @uid, @resolved = @resolved',
        { uid: user_id, resolved: 0 }
      );

      return result.map((record: any) => ({
        conflict_id: record.conflict_id,
        user_id: record.user_id,
        entity_type: record.entity_type as SyncEntityType,
        entity_id: record.entity_id,
        device_a_id: record.device_a_id,
        device_b_id: record.device_b_id,
        data_a: JSON.parse(record.data_a || '{}'),
        data_b: JSON.parse(record.data_b || '{}'),
        data_a_time: new Date(record.data_a_time),
        data_b_time: new Date(record.data_b_time),
        conflict_type: record.conflict_type,
        resolved: record.resolved === 1,
        resolved_at: record.resolved_at ? new Date(record.resolved_at) : undefined,
        resolved_choice: record.resolved_choice as ConflictResolutionStrategy | undefined,
      }));
    } catch (err: any) {
      logger.error('获取待解决冲突失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        message: err.message,
      });
      return [];
    }
  }

  async markOperationSynced(operation_id: number, device_id?: string): Promise<boolean> {
    try {
      await execute('sync',
        'EXEC sp_sync_mark_synced @operation_id = @oid, @device_id = @did',
        { oid: operation_id, did: device_id || null }
      );
      return true;
    } catch (err: any) {
      logger.error('标记操作已同步失败', {
        errorType: ErrorType.DATABASE_ERROR,
        operationId: operation_id,
        message: err.message,
      });
      return false;
    }
  }

  async performFullSync(user_id: number, device_id: string): Promise<SyncResult> {
    const startTime = Date.now();
    let synced_count = 0;
    let failed_count = 0;

    try {
      const checkins = await query('sync',
        'EXEC sp_sync_get_pending_checkins @user_id = @uid',
        { uid: user_id }
      );

      if (checkins.length > 0) {
        synced_count += checkins.length;
      }

      await execute('sync',
        'EXEC sp_sync_mark_checkins_synced @user_id = @uid, @device_id = @did',
        { uid: user_id, did: device_id }
      );

      await execute('sync',
        'EXEC sp_sync_update_user_status @user_id = @uid, @sync_type = @type',
        { uid: user_id, type: 'checkin' }
      );

      return {
        success: true,
        message: '全量同步完成',
        sync_id: `sync_${Date.now()}`,
        conflict_count: 0,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      failed_count++;
      logger.error('全量同步失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        message: `全量同步失败: ${err.message}`,
        conflict_count: 0,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    }
  }

  async performDeltaSync(user_id: number, lastSyncTime: Date, device_id: string): Promise<SyncResult> {
    const startTime = Date.now();
    let synced_count = 0;
    let failed_count = 0;

    try {
      // 使用 lastSyncTime 过滤，只同步上次同步之后新增的记录
      const pendingCheckins = await query('sync',
        `SELECT [sync_record_id], [checkin_date], [streak_count], [points_earned], [created_at]
         FROM dbo.user_checkin_sync
         WHERE [user_id] = @uid
           AND [sync_status] = 'pending'
           AND [created_at] > @lastSync
         ORDER BY [checkin_date] ASC`,
        { uid: user_id, lastSync: lastSyncTime }
      );

      if (pendingCheckins.length > 0) {
        synced_count += pendingCheckins.length;
      }

      await execute('sync',
        'EXEC sp_sync_mark_checkins_synced @user_id = @uid, @device_id = @did',
        { uid: user_id, did: device_id }
      );

      return {
        success: true,
        message: `增量同步完成: ${synced_count} 条`,
        sync_id: `sync_${Date.now()}`,
        conflict_count: 0,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      failed_count++;
      logger.error('增量同步失败', {
        errorType: ErrorType.DATABASE_ERROR,
        userId: user_id,
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        message: `增量同步失败: ${err.message}`,
        conflict_count: 0,
        synced_count,
        failed_count,
        latency_ms: Date.now() - startTime,
      };
    }
  }
}

export const dataSyncService = DataSyncService.getInstance();