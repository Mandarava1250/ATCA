// ============================================
// 为 ai_config 表添加并发设置字段
// ============================================

import sql = require('mssql');

// 数据库配置接口
interface DBConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
}

// 列信息接口
interface ColumnInfo {
  name: string;
}

async function addColumns(): Promise<void> {
  const config: DBConfig = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'Atca_User',
    user: process.env.DB_USER || 'ATCA',
    password: process.env.DB_PASSWORD || 'Atca@123.-',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  let pool: sql.ConnectionPool | undefined;

  try {
    console.log('连接数据库...');
    pool = await sql.connect(config);
    console.log('数据库连接成功');

    const sqlQuery = `
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'max_concurrent' AND object_id = OBJECT_ID('ai_config'))
      BEGIN
        ALTER TABLE [ai_config] ADD [max_concurrent] INT DEFAULT 3;
        PRINT '已添加 max_concurrent 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'max_queue_size' AND object_id = OBJECT_ID('ai_config'))
      BEGIN
        ALTER TABLE [ai_config] ADD [max_queue_size] INT DEFAULT 20;
        PRINT '已添加 max_queue_size 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'queue_timeout' AND object_id = OBJECT_ID('ai_config'))
      BEGIN
        ALTER TABLE [ai_config] ADD [queue_timeout] INT DEFAULT 60;
        PRINT '已添加 queue_timeout 字段';
      END
    `;

    console.log('执行SQL语句...');
    const result = await pool.request().query(sqlQuery);
    console.log('SQL执行完成');
    
    // 验证字段是否存在
    const checkResult = await pool.request().query(`
      SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('ai_config') 
      AND name IN ('max_concurrent', 'max_queue_size', 'queue_timeout')
    `);
    
    console.log('\n验证结果 - 已存在的字段:');
    (checkResult.recordset as ColumnInfo[]).forEach(col => console.log(`  ✓ ${col.name}`));
    
  } catch (err: unknown) {
    console.error('执行失败:', err instanceof Error ? err.message : '未知错误');
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n数据库连接已关闭');
    }
  }
}

addColumns();
