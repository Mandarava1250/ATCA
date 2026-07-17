// ============================================
// 华夏营造 - 数据库配置与连接池管理
// 支持5个独立数据库配置，从 process.env 读取
// 连接失败时自动降级到 Mock 模式
// ============================================

import sql from 'mssql';
import { queryCache } from '../services/queryCache';
import { queryStats } from '../services/queryStats';

export interface DbConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
}

// Mock 模式标志
let mockMode = process.env.MOCK_MODE === 'true';
// 连接失败的数据库记录
const failedDbs: Set<string> = new Set();

// 如果环境变量设置了MOCK_MODE=true，直接启用Mock模式
if (mockMode) {
  console.warn('[DB] 环境变量 MOCK_MODE=true，已启用 Mock 模式，所有数据为模拟数据');
}

export function isMockMode(): boolean {
  return mockMode;
}

export function setMockMode(enabled: boolean): void {
  mockMode = enabled;
  if (enabled) {
    console.warn('[DB] 已切换到 Mock 模式，所有数据为模拟数据');
  }
}

// 检查指定数据库是否连接失败
export function isDbFailed(dbName: string): boolean {
  return failedDbs.has(dbName);
}

// 全局连接池配置（从环境变量读取，支持动态调优）
const globalPoolMax = parseInt(process.env.DB_POOL_MAX || '3', 10);
const globalPoolMin = parseInt(process.env.DB_POOL_MIN || '0', 10);
const globalPoolIdleTimeout = parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '15000', 10);
const globalConnectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10);
const globalRequestTimeout = parseInt(process.env.DB_REQUEST_TIMEOUT || '20000', 10);

function buildConfig(
    hostEnv: string,
    portEnv: string,
    nameEnv: string,
    userEnv: string,
    passEnv: string,
    encryptEnv: string,
    trustEnv: string
): DbConfig {
  return {
    server: process.env[hostEnv] || 'localhost',
    port: parseInt(process.env[portEnv] || '1433', 10),
    database: process.env[nameEnv] || '',
    user: process.env[userEnv] || '',
    password: process.env[passEnv] || '',
    options: {
      encrypt: process.env[encryptEnv] === 'true',
      trustServerCertificate: process.env[trustEnv] === 'true',
    },
    pool: {
      max: globalPoolMax,
      min: globalPoolMin,
      idleTimeoutMillis: globalPoolIdleTimeout,
    },
  };
}

export const dbConfigs = {
  user: buildConfig(
      'USER_DB_HOST', 'USER_DB_PORT', 'USER_DB_NAME',
      'USER_DB_USER', 'USER_DB_PASSWORD',
      'USER_DB_ENCRYPT', 'USER_DB_TRUST_SERVER_CERTIFICATE'
  ),
  architecture: buildConfig(
      'ARCH_DB_HOST', 'ARCH_DB_PORT', 'ARCH_DB_NAME',
      'ARCH_DB_USER', 'ARCH_DB_PASSWORD',
      'ARCH_DB_ENCRYPT', 'ARCH_DB_TRUST_SERVER_CERTIFICATE'
  ),
  competition: buildConfig(
      'COMP_DB_HOST', 'COMP_DB_PORT', 'COMP_DB_NAME',
      'COMP_DB_USER', 'COMP_DB_PASSWORD',
      'COMP_DB_ENCRYPT', 'COMP_DB_TRUST_SERVER_CERTIFICATE'
  ),
  activity: buildConfig(
      'ACT_DB_HOST', 'ACT_DB_PORT', 'ACT_DB_NAME',
      'ACT_DB_USER', 'ACT_DB_PASSWORD',
      'ACT_DB_ENCRYPT', 'ACT_DB_TRUST_SERVER_CERTIFICATE'
  ),
  media3d: buildConfig(
      'MEDIA_DB_HOST', 'MEDIA_DB_PORT', 'MEDIA_DB_NAME',
      'MEDIA_DB_USER', 'MEDIA_DB_PASSWORD',
      'MEDIA_DB_ENCRYPT', 'MEDIA_DB_TRUST_SERVER_CERTIFICATE'
  ),
  social: buildConfig(
      'SOCIAL_DB_HOST', 'SOCIAL_DB_PORT', 'SOCIAL_DB_NAME',
      'SOCIAL_DB_USER', 'SOCIAL_DB_PASSWORD',
      'SOCIAL_DB_ENCRYPT', 'SOCIAL_DB_TRUST_SERVER_CERTIFICATE'
  ),
};

// 连接池缓存
const pools: Record<string, sql.ConnectionPool> = {};

// 带重试的连接函数
async function connectWithRetry(
  dbName: string,
  config: DbConfig,
  maxRetries = 3
): Promise<sql.ConnectionPool> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pool = new sql.ConnectionPool({
        server: config.server,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        options: config.options,
        pool: config.pool,
        connectionTimeout: globalConnectionTimeout,
        requestTimeout: globalRequestTimeout,
      });

      const connected = await pool.connect();
      console.log(`[DB] Connected to ${dbName} (${config.database}) - 第${attempt}次尝试成功`);
      return connected;
    } catch (err: any) {
      lastError = err;
      console.error(`[DB] 连接 ${dbName} (${config.database}) 第${attempt}/${maxRetries}次失败: ${err.message || err}`);
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // 递增延迟
        console.log(`[DB] ${delay}ms后重试...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError || new Error(`无法连接到数据库 ${dbName}`);
}

export async function getPool(dbName: keyof typeof dbConfigs): Promise<sql.ConnectionPool> {
  if (mockMode) {
    throw new Error('Mock mode: no database connection');
  }

  // 如果之前连接失败，直接抛出
  if (failedDbs.has(dbName)) {
    throw new Error(`Database ${dbName} previously failed to connect`);
  }

  if (pools[dbName] && pools[dbName].connected) {
    return pools[dbName];
  }

  const config = dbConfigs[dbName];
  if (!config.database || !config.user) {
    throw new Error(`Database configuration incomplete for ${dbName}`);
  }

  try {
    pools[dbName] = await connectWithRetry(dbName, config);
    return pools[dbName];
  } catch (err: any) {
    failedDbs.add(dbName);
    console.error(`[DB] ${dbName} 数据库连接失败，该数据库相关功能将不可用`);
    throw err;
  }
}

// 启动时预连接所有数据库
export async function preconnectAll(): Promise<void> {
  console.log('[DB] 开始预连接所有数据库...');
  const dbNames = Object.keys(dbConfigs) as (keyof typeof dbConfigs)[];
  const results = await Promise.allSettled(
    dbNames.map(async (name) => {
      try {
        await getPool(name);
        return { name, status: 'success' as const };
      } catch (err: any) {
        return { name, status: 'failed' as const, error: err.message };
      }
    })
  );

  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const r = result.value;
      if (r.status === 'success') {
        successCount++;
      } else {
        failCount++;
        console.warn(`[DB] ${r.name} 连接失败: ${r.error}`);
      }
    } else {
      failCount++;
    }
  }

  console.log(`[DB] 预连接完成: ${successCount}个成功, ${failCount}个失败`);

  if (failCount > 0 && successCount === 0) {
    console.warn('[DB] 所有数据库连接失败，系统将使用Mock模式运行');
    setMockMode(true);
  }
}

export async function query<T = any>(
    dbName: keyof typeof dbConfigs,
    sqlString: string,
    params?: any,
    useCache: boolean = true
): Promise<T[]> {
  const startTime = Date.now();
  
  // 如果启用缓存，先尝试从缓存获取
  if (useCache && !mockMode) {
    const cachedData = queryCache.get(dbName, sqlString, params);
    if (cachedData !== null) {
      const duration = Date.now() - startTime;
      queryStats.record(dbName, sqlString, params, duration, true, cachedData.length);
      return cachedData;
    }
  }

  const pool = await getPool(dbName);
  const request = pool.request();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        request.input(key, sql.NVarChar(sql.MAX), null);
      } else if (typeof value === 'number') {
        request.input(key, sql.Int, value);
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value ? 1 : 0);
      } else {
        request.input(key, sql.NVarChar(sql.MAX), value);
      }
    }
  }

  const result = await request.query(sqlString);
  const data = result.recordset as T[];
  const duration = Date.now() - startTime;

  // 记录查询统计
  queryStats.record(dbName, sqlString, params, duration, false, data.length);

  // 如果启用缓存，将结果存入缓存
  if (useCache && !mockMode) {
    queryCache.set(dbName, sqlString, params, data);
  }

  return data;
}

export async function execute(
    dbName: keyof typeof dbConfigs,
    sqlString: string,
    params?: Record<string, any>
): Promise<sql.IResult<any>> {
  const pool = await getPool(dbName);
  const request = pool.request();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        request.input(key, sql.NVarChar(sql.MAX), null);
      } else if (typeof value === 'number') {
        request.input(key, sql.Int, value);
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value ? 1 : 0);
      } else {
        request.input(key, sql.NVarChar(sql.MAX), value);
      }
    }
  }

  return await request.query(sqlString);
}

export async function transaction<T>(
    dbName: keyof typeof dbConfigs,
    callback: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  const pool = await getPool(dbName);
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function closeAllPools(): Promise<void> {
  for (const [name, pool] of Object.entries(pools)) {
    if (pool.connected) {
      await pool.close();
      console.log(`[DB] Closed connection to ${name}`);
    }
  }
}

import fs from 'fs';
import path from 'path';

const sqlScripts: Record<string, string[]> = {
  user: ['User.sql'],
  architecture: ['Architecture.sql'],
  competition: ['Competition.sql'],
  activity: ['Activity.sql', 'Checkin.sql'],
  media3d: ['Media_3D.sql'],
  social: ['Social.sql', 'Community.sql'],
};

export async function initDatabase(dbName: keyof typeof dbConfigs): Promise<void> {
  if (mockMode) {
    console.log(`[DB] Mock模式下跳过数据库${dbName}的初始化`);
    return;
  }

  const scripts = sqlScripts[dbName];
  if (!scripts || scripts.length === 0) {
    console.log(`[DB] 数据库${dbName}没有配置初始化脚本`);
    return;
  }

  const dbScriptsDir = path.resolve(__dirname, './DB');
  
  try {
    const pool = await getPool(dbName);
    
    for (const scriptName of scripts) {
      const scriptPath = path.join(dbScriptsDir, scriptName);
      if (!fs.existsSync(scriptPath)) {
        console.warn(`[DB] 初始化脚本不存在: ${scriptPath}`);
        continue;
      }

      const sqlContent = fs.readFileSync(scriptPath, 'utf8');
      const batches = sqlContent.split('GO');

      for (const batch of batches) {
        const trimmedBatch = batch.trim();
        if (trimmedBatch && !trimmedBatch.startsWith('--')) {
          try {
            await pool.request().query(trimmedBatch);
          } catch (err: any) {
            if (!err.message.includes('already exists') && 
                !err.message.includes('Cannot drop') &&
                !err.message.includes('Could not find')) {
              console.warn(`[DB] 执行脚本 ${scriptName} 的部分SQL失败（可能是重复执行）: ${err.message.slice(0, 100)}`);
            }
          }
        }
      }

      console.log(`[DB] 数据库${dbName}的初始化脚本 ${scriptName} 执行完成`);
    }
  } catch (err: any) {
    console.error(`[DB] 数据库${dbName}初始化失败: ${err.message}`);
    throw err;
  }
}

export async function initAllDatabases(): Promise<void> {
  console.log('[DB] 开始初始化所有数据库...');
  const dbNames = Object.keys(dbConfigs) as (keyof typeof dbConfigs)[];
  
  for (const dbName of dbNames) {
    if (failedDbs.has(dbName)) {
      console.log(`[DB] 跳过连接失败的数据库${dbName}`);
      continue;
    }
    
    try {
      await initDatabase(dbName);
    } catch (err: any) {
      console.warn(`[DB] 数据库${dbName}初始化失败，但继续启动: ${err.message}`);
    }
  }
  
  console.log('[DB] 数据库初始化完成');
}
