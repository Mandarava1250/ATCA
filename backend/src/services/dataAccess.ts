// ============================================
// 华夏营造 - 数据访问层优化服务
// 实现高效的数据库查询策略，减少不必要的数据库访问
// ============================================

import { createLogger } from '../utils/logger';
import { query as dbQuery, execute, dbConfigs } from '../config/database';
import { queryCache, cachedBatchQuery } from './queryCache';
import { queryStats } from './queryStats';

const logger = createLogger('DataAccess');

// 分页结果接口
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 查询选项
export interface QueryOptions {
  useCache?: boolean;
  ttl?: number;
  bypassCache?: boolean;
}

// 批量查询结果
export interface BatchQueryResult<T = any> {
  success: boolean;
  data: T[];
  errors: Array<{ index: number; error: string }>;
}

class DataAccessService {
  // 智能查询（自动选择最佳策略）
  async smartQuery<T = any>(
    dbName: keyof typeof dbConfigs,
    sql: string,
    params: any = {},
    options: QueryOptions = {}
  ): Promise<T[]> {
    const { useCache = true, ttl } = options;

    // 先尝试缓存
    if (useCache) {
      const cachedData = queryCache.get(dbName, sql, params);
      if (cachedData !== null) {
        queryStats.record(dbName, sql, params, 0, true, cachedData.length);
        return cachedData;
      }
    }

    // 执行数据库查询
    const startTime = Date.now();
    const result = await dbQuery(dbName, sql, params, false);
    const duration = Date.now() - startTime;

    // 记录统计
    queryStats.record(dbName, sql, params, duration, false, result.length);

    // 更新缓存
    if (useCache && result.length > 0) {
      queryCache.set(dbName, sql, params, result, ttl);
    }

    return result;
  }

  // 分页查询（优化版）
  async paginatedQuery<T = any>(
    dbName: keyof typeof dbConfigs,
    baseSql: string,
    params: any = {},
    page: number = 1,
    limit: number = 20,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    const { useCache = true } = options;
    const offset = (page - 1) * limit;

    // 构建分页查询和总数查询
    const countSql = `SELECT COUNT(*) as total FROM (${baseSql}) as t`;
    const pageSql = `${baseSql} ORDER BY (SELECT NULL) OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    // 使用批量查询优化
    const results = await cachedBatchQuery(dbName, [
      { sql: countSql, params, ttl: 60 }, // 总数缓存1分钟
      { sql: pageSql, params, ttl: options.ttl },
    ]);

    const countResult = results[0] as { total: number }[];
    const dataResult = results[1] as T[];

    const total = countResult.length > 0 ? countResult[0].total : 0;

    return {
      data: dataResult,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 批量查询（支持并行）
  async batchQuery<T = any>(
    dbName: keyof typeof dbConfigs,
    queries: Array<{ sql: string; params?: any; ttl?: number }>
  ): Promise<BatchQueryResult<T>> {
    const errors: Array<{ index: number; error: string }> = [];
    const results: T[] = [];

    try {
      // 使用缓存批量查询
      const cachedResults = await cachedBatchQuery(dbName, queries);

      for (let i = 0; i < queries.length; i++) {
        try {
          results.push(cachedResults[i]);
        } catch (error: any) {
          errors.push({ index: i, error: error.message });
          results.push(null as any);
        }
      }

      return {
        success: errors.length === 0,
        data: results,
        errors,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        errors: [{ index: 0, error: error.message }],
      };
    }
  }

  // 批量获取（IN查询优化）
  async batchGet<T = any>(
    dbName: keyof typeof dbConfigs,
    tableName: string,
    ids: number[],
    options: {
      fields?: string[];
      whereField?: string;
      ttl?: number;
    } = {}
  ): Promise<T[]> {
    if (ids.length === 0) return [];

    const { fields = ['*'], whereField = 'id', ttl } = options;

    // 检查缓存中已有的数据
    const cachedData: T[] = [];
    const uncachedIds: number[] = [];

    for (const id of ids) {
      const sql = `SELECT ${fields.join(',')} FROM ${tableName} WHERE ${whereField} = @id`;
      const cached = queryCache.get(dbName, sql, { id });
      if (cached && cached.length > 0) {
        cachedData.push(cached[0]);
      } else {
        uncachedIds.push(id);
      }
    }

    // 如果所有ID都在缓存中，直接返回
    if (uncachedIds.length === 0) {
      return cachedData;
    }

    // 使用IN查询批量获取未缓存的数据
    const placeholders = uncachedIds.map((_, i) => `@id${i}`).join(',');
    const params: Record<string, number> = {};
    uncachedIds.forEach((id, i) => {
      params[`id${i}`] = id;
    });

    const sql = `SELECT ${fields.join(',')} FROM ${tableName} WHERE ${whereField} IN (${placeholders})`;
    const startTime = Date.now();
    const dbResults = await dbQuery(dbName, sql, params, false);
    const duration = Date.now() - startTime;

    queryStats.record(dbName, sql, params, duration, false, dbResults.length);

    // 更新缓存
    for (const item of dbResults) {
      const id = item[whereField];
      const singleSql = `SELECT ${fields.join(',')} FROM ${tableName} WHERE ${whereField} = @id`;
      queryCache.set(dbName, singleSql, { id: item[whereField] }, [item], ttl);
    }

    // 合并结果并保持原始顺序
    const allData = [...cachedData, ...dbResults];
    const idMap = new Map(allData.map(item => [item[whereField], item]));
    
    return ids.map(id => idMap.get(id)).filter(Boolean) as T[];
  }

  // 条件查询（带缓存策略）
  async conditionalQuery<T = any>(
    dbName: keyof typeof dbConfigs,
    baseSql: string,
    conditions: Record<string, any> = {},
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      ttl?: number;
    } = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 20, sortBy, sortOrder = 'ASC', ttl } = options;

    // 构建WHERE子句
    const whereClauses: string[] = [];
    const params: Record<string, any> = {};

    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            const placeholders = value.map((_, i) => `@${key}${i}`).join(',');
            whereClauses.push(`${key} IN (${placeholders})`);
            value.forEach((v, i) => {
              params[`${key}${i}`] = v;
            });
          }
        } else {
          whereClauses.push(`${key} = @${key}`);
          params[key] = value;
        }
      }
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orderClause = sortBy ? `ORDER BY ${sortBy} ${sortOrder}` : '';

    const countSql = `SELECT COUNT(*) as total FROM (${baseSql} ${whereClause}) as t`;
    const dataSql = `${baseSql} ${whereClause} ${orderClause} OFFSET ${(page - 1) * limit} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const results = await cachedBatchQuery(dbName, [
      { sql: countSql, params, ttl: ttl || 60 },
      { sql: dataSql, params, ttl },
    ]);

    const countResult = results[0] as { total: number }[];
    const dataResult = results[1] as T[];

    return {
      data: dataResult,
      meta: {
        total: countResult.length > 0 ? countResult[0].total : 0,
        page,
        limit,
        totalPages: Math.ceil((countResult.length > 0 ? countResult[0].total : 0) / limit),
      },
    };
  }

  // 缓存预热
  async warmupCache(dbName: keyof typeof dbConfigs, queries: Array<{ sql: string; params?: any; ttl?: number }>): Promise<void> {
    logger.info(`开始缓存预热: ${dbName}, ${queries.length} 条查询`);
    
    const startTime = Date.now();
    await cachedBatchQuery(dbName, queries);
    const duration = Date.now() - startTime;
    
    logger.info(`缓存预热完成: ${dbName}, 耗时 ${duration}ms`);
  }

  // 清除相关缓存
  invalidateCache(dbName: keyof typeof dbConfigs, tableName?: string): void {
    if (tableName) {
      // 清除与特定表相关的缓存
      for (const key of queryCache['cache'].keys()) {
        if (key.includes(dbName) && key.toLowerCase().includes(tableName.toLowerCase())) {
          queryCache['cache'].delete(key);
        }
      }
      logger.debug(`清除 ${dbName}.${tableName} 相关缓存`);
    } else {
      queryCache.clear(dbName);
    }
  }

  // 获取缓存统计
  getCacheStats() {
    return queryCache.getStats();
  }

  // 获取查询统计
  getQueryStats() {
    return queryStats.getSummary();
  }
}

// 创建全局实例
export const dataAccessService = new DataAccessService();
