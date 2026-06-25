// ============================================
// 华夏营造 - 数据库查询统计服务
// 实现数据库查询的全面监控和分析
// ============================================

import { createLogger } from '../utils/logger';

const logger = createLogger('QueryStats');

// 查询统计接口
interface QueryRecord {
  id: string;
  dbName: string;
  sql: string;
  params: any;
  duration: number; // 毫秒
  timestamp: number;
  cached: boolean;
  rowCount: number;
  error?: string;
}

// 查询统计摘要
export interface QuerySummary {
  totalQueries: number;
  cachedQueries: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  dbBreakdown: Record<string, { queries: number; duration: number }>;
  topQueries: Array<{ sql: string; count: number; avgDuration: number }>;
  errorCount: number;
}

// 慢查询阈值（毫秒）
const SLOW_QUERY_THRESHOLD = 500;

// 保留的最大记录数
const MAX_RECORDS = 10000;

class QueryStats {
  private records: QueryRecord[] = [];
  private queryCountBySql = new Map<string, number>();
  private totalDurationBySql = new Map<string, number>();
  private startTime = Date.now();

  // 记录查询
  record(
    dbName: string,
    sql: string,
    params: any,
    duration: number,
    cached: boolean,
    rowCount: number,
    error?: string
  ): void {
    const record: QueryRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dbName,
      sql: this.truncateSql(sql),
      params: this.sanitizeParams(params),
      duration,
      timestamp: Date.now(),
      cached,
      rowCount,
      error,
    };

    this.records.push(record);

    // 维护SQL统计
    const sqlKey = this.normalizeSql(sql);
    this.queryCountBySql.set(sqlKey, (this.queryCountBySql.get(sqlKey) || 0) + 1);
    this.totalDurationBySql.set(sqlKey, (this.totalDurationBySql.get(sqlKey) || 0) + duration);

    // 清理旧记录
    if (this.records.length > MAX_RECORDS) {
      this.records = this.records.slice(-MAX_RECORDS);
    }

    // 记录慢查询警告
    if (duration > SLOW_QUERY_THRESHOLD && !cached) {
      logger.warn(`慢查询检测 [${dbName}]: ${duration}ms`, {
        sql: sql.substring(0, 100),
        params: JSON.stringify(params).substring(0, 50),
      });
    }
  }

  // 获取统计摘要
  getSummary(): QuerySummary {
    const totalQueries = this.records.length;
    const cachedQueries = this.records.filter(r => r.cached).length;
    const errors = this.records.filter(r => r.error);
    
    const durations = this.records.map(r => r.duration);
    const totalDuration = durations.reduce((a, b) => a + b, 0);

    // 按数据库分组
    const dbBreakdown: Record<string, { queries: number; duration: number }> = {};
    for (const record of this.records) {
      if (!dbBreakdown[record.dbName]) {
        dbBreakdown[record.dbName] = { queries: 0, duration: 0 };
      }
      dbBreakdown[record.dbName].queries++;
      dbBreakdown[record.dbName].duration += record.duration;
    }

    // 慢查询Top列表
    const topQueries = Array.from(this.queryCountBySql.entries())
      .map(([sql, count]) => ({
        sql,
        count,
        avgDuration: Math.round((this.totalDurationBySql.get(sql) || 0) / count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalQueries,
      cachedQueries,
      totalDuration,
      avgDuration: totalQueries > 0 ? Math.round(totalDuration / totalQueries) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      dbBreakdown,
      topQueries,
      errorCount: errors.length,
    };
  }

  // 获取最近的查询记录
  getRecent(limit: number = 50): QueryRecord[] {
    return [...this.records].reverse().slice(0, limit);
  }

  // 获取慢查询记录
  getSlowQueries(threshold: number = SLOW_QUERY_THRESHOLD): QueryRecord[] {
    return [...this.records]
      .filter(r => r.duration > threshold && !r.cached)
      .sort((a, b) => b.duration - a.duration);
  }

  // 获取按时间分组的统计
  getTimelineStats(minutes: number = 60): Array<{ time: string; queries: number; avgDuration: number }> {
    const now = Date.now();
    const interval = minutes * 60 * 1000 / 60; // 分成60个时间段
    const result: Array<{ time: string; queries: number; avgDuration: number }> = [];

    for (let i = 59; i >= 0; i--) {
      const start = now - (i + 1) * interval;
      const end = now - i * interval;
      const recordsInInterval = this.records.filter(
        r => r.timestamp >= start && r.timestamp < end
      );

      result.push({
        time: new Date(end).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        queries: recordsInInterval.length,
        avgDuration: recordsInInterval.length > 0
          ? Math.round(recordsInInterval.reduce((sum, r) => sum + r.duration, 0) / recordsInInterval.length)
          : 0,
      });
    }

    return result;
  }

  // 重置统计
  reset(): void {
    this.records = [];
    this.queryCountBySql.clear();
    this.totalDurationBySql.clear();
    this.startTime = Date.now();
    logger.info('查询统计已重置');
  }

  // 获取服务运行时间
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  // 截断SQL用于记录
  private truncateSql(sql: string): string {
    return sql.length > 500 ? sql.substring(0, 500) + '...' : sql;
  }

  // 清理参数（避免记录敏感数据）
  private sanitizeParams(params: any): any {
    if (!params) return params;
    const sanitized: any = {};
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 100) + '...';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // 规范化SQL（移除多余空格用于统计）
  private normalizeSql(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
  }
}

// 创建全局实例
export const queryStats = new QueryStats();

// 查询统计装饰器
export function trackQuery(dbName: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const startTime = Date.now();
      const sql = args[0] || '';
      const params = args[1] || {};

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        const cached = result && result.__cached === true;
        
        queryStats.record(dbName, sql, params, duration, cached, result?.length || 0);
        
        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        queryStats.record(dbName, sql, params, duration, false, 0, error.message);
        throw error;
      }
    };

    return descriptor;
  };
}
