// ============================================
// 为 ai_config 表添加并发设置字段
// ============================================

const sql = require('mssql');

async function addColumns() {
  const config = {
    server: 'localhost',
    port: 1433,
    database: 'Atca_User',
    user: 'ATCA',
    password: 'Atca@123.-',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  try {
    console.log('连接数据库...');
    await sql.connect(config);
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
    const result = await sql.query(sqlQuery);
    console.log('SQL执行完成');
    
    // 验证字段是否存在
    const checkResult = await sql.query(`
      SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('ai_config') 
      AND name IN ('max_concurrent', 'max_queue_size', 'queue_timeout')
    `);
    
    console.log('\n验证结果 - 已存在的字段:');
    checkResult.recordset.forEach(col => console.log(`  ✓ ${col.name}`));
    
  } catch (err) {
    console.error('执行失败:', err.message);
    process.exit(1);
  } finally {
    await sql.close();
    console.log('\n数据库连接已关闭');
  }
}

addColumns();