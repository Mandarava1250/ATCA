import sql = require('mssql');

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

interface ColumnInfo {
  name: string;
}

async function addArchitectureColumns(): Promise<void> {
  const config: DBConfig = {
    server: process.env.ARCH_DB_HOST || 'localhost',
    port: parseInt(process.env.ARCH_DB_PORT || '1433', 10),
    database: process.env.ARCH_DB_NAME || 'Architecture',
    user: process.env.ARCH_DB_USER || 'ATCA',
    password: process.env.ARCH_DB_PASSWORD || 'Atca@123.-',
    options: {
      encrypt: process.env.ARCH_DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.ARCH_DB_TRUST_SERVER_CERTIFICATE === 'true' || true
    }
  };

  let pool: sql.ConnectionPool | undefined;

  try {
    console.log('连接数据库...');
    pool = await sql.connect(config);
    console.log('数据库连接成功');

    const sqlQuery = `
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'structural_features' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [structural_features] NVARCHAR(MAX) NULL;
        PRINT '已添加 structural_features 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'historical_significance' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [historical_significance] NVARCHAR(MAX) NULL;
        PRINT '已添加 historical_significance 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'current_status' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [current_status] NVARCHAR(MAX) NULL;
        PRINT '已添加 current_status 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'tags' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [tags] NVARCHAR(500) NULL;
        PRINT '已添加 tags 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'image_gallery' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [image_gallery] NVARCHAR(MAX) NULL;
        PRINT '已添加 image_gallery 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'model_3d_url' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [model_3d_url] NVARCHAR(255) NULL;
        PRINT '已添加 model_3d_url 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'vr_panorama_url' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [vr_panorama_url] NVARCHAR(255) NULL;
        PRINT '已添加 vr_panorama_url 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'construction_date' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [construction_date] NVARCHAR(50) NULL;
        PRINT '已添加 construction_date 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'architect' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [architect] NVARCHAR(100) NULL;
        PRINT '已添加 architect 字段';
      END
      
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'is_featured' AND object_id = OBJECT_ID('ancient_architecture'))
      BEGIN
        ALTER TABLE [ancient_architecture] ADD [is_featured] BIT DEFAULT 0;
        PRINT '已添加 is_featured 字段';
      END
    `;

    console.log('执行SQL语句...');
    const result = await pool.request().query(sqlQuery);
    console.log('SQL执行完成');
    
    const checkResult = await pool.request().query(`
      SELECT name FROM sys.columns WHERE object_id = OBJECT_ID('ancient_architecture') 
      AND name IN ('structural_features', 'historical_significance', 'current_status', 'tags', 'image_gallery', 'model_3d_url', 'vr_panorama_url', 'construction_date', 'architect', 'is_featured')
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

addArchitectureColumns();