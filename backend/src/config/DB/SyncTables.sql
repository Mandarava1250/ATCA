-- ============================================
-- 华夏营造 - 多端数据同步表
-- 支持用户在不同设备间的数据同步
-- ============================================

USE [Architecture];
GO

-- ============================================
-- 1. 同步设备表（记录用户设备信息）
-- ============================================
IF OBJECT_ID('dbo.sync_devices', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_devices (
        [device_id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [device_type] NVARCHAR(20) NOT NULL,         -- pc/mobile/tablet
        [device_name] NVARCHAR(100) NULL,
        [last_active_at] DATETIME DEFAULT GETDATE(),
        [is_active] BIT DEFAULT 1,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_sync_devices_user FOREIGN KEY ([user_id]) REFERENCES dbo.users([user_id])
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_devices_user' AND object_id = OBJECT_ID('dbo.sync_devices'))
    CREATE INDEX [idx_sync_devices_user] ON dbo.sync_devices([user_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_devices_active' AND object_id = OBJECT_ID('dbo.sync_devices'))
    CREATE INDEX [idx_sync_devices_active] ON dbo.sync_devices([user_id], [is_active]);
GO

-- ============================================
-- 2. 同步操作日志表（记录所有同步操作）
-- ============================================
IF OBJECT_ID('dbo.sync_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_logs (
        [log_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [device_id] NVARCHAR(64) NOT NULL,
        [sync_type] NVARCHAR(50) NOT NULL,           -- favorite/note/quiz_progress/user_action
        [entity_type] NVARCHAR(50) NULL,
        [entity_id] INT NULL,
        [action] NVARCHAR(20) NOT NULL,              -- create/update/delete
        [data_snapshot] NVARCHAR(MAX) NULL,          -- 操作数据快照（JSON）
        [sync_status] NVARCHAR(20) DEFAULT 'pending', -- pending/synced/failed
        [sync_latency_ms] INT NULL,                  -- 同步延迟（毫秒）
        [created_at] DATETIME DEFAULT GETDATE(),
        [synced_at] DATETIME NULL,
        CONSTRAINT FK_sync_logs_user FOREIGN KEY ([user_id]) REFERENCES dbo.users([user_id]),
        CONSTRAINT FK_sync_logs_device FOREIGN KEY ([device_id]) REFERENCES dbo.sync_devices([device_id]),
        CONSTRAINT CHK_sync_status CHECK ([sync_status] IN ('pending', 'synced', 'failed'))
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_logs_user' AND object_id = OBJECT_ID('dbo.sync_logs'))
    CREATE INDEX [idx_sync_logs_user] ON dbo.sync_logs([user_id], [created_at] DESC);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_logs_status' AND object_id = OBJECT_ID('dbo.sync_logs'))
    CREATE INDEX [idx_sync_logs_status] ON dbo.sync_logs([sync_status], [created_at]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_logs_type' AND object_id = OBJECT_ID('dbo.sync_logs'))
    CREATE INDEX [idx_sync_logs_type] ON dbo.sync_logs([user_id], [sync_type], [created_at] DESC);
GO

-- ============================================
-- 3. 同步冲突表（记录同步冲突及解决）
-- ============================================
IF OBJECT_ID('dbo.sync_conflicts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_conflicts (
        [conflict_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [entity_type] NVARCHAR(50) NOT NULL,
        [entity_id] INT NOT NULL,
        [device_a] NVARCHAR(64) NOT NULL,
        [device_b] NVARCHAR(64) NOT NULL,
        [data_a] NVARCHAR(MAX) NOT NULL,
        [data_b] NVARCHAR(MAX) NOT NULL,
        [conflict_type] NVARCHAR(20) NOT NULL,       -- update_update/update_delete
        [resolution] NVARCHAR(20) NULL,              -- device_a_wins/device_b_wins/merged/manual
        [resolved_data] NVARCHAR(MAX) NULL,
        [resolved_by] INT NULL,
        [resolved_at] DATETIME NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_sync_conflicts_user FOREIGN KEY ([user_id]) REFERENCES dbo.users([user_id])
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_conflicts_user' AND object_id = OBJECT_ID('dbo.sync_conflicts'))
    CREATE INDEX [idx_sync_conflicts_user] ON dbo.sync_conflicts([user_id], [created_at] DESC);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_conflicts_entity' AND object_id = OBJECT_ID('dbo.sync_conflicts'))
    CREATE INDEX [idx_sync_conflicts_entity] ON dbo.sync_conflicts([entity_type], [entity_id]);
GO

-- ============================================
-- 4. 同步统计表（记录同步性能指标）
-- ============================================
IF OBJECT_ID('dbo.sync_stats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_stats (
        [stat_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [stat_date] DATE NOT NULL,
        [total_syncs] INT DEFAULT 0,
        [successful_syncs] INT DEFAULT 0,
        [failed_syncs] INT DEFAULT 0,
        [avg_latency_ms] INT DEFAULT 0,
        [max_latency_ms] INT DEFAULT 0,
        [min_latency_ms] INT DEFAULT 0,
        [active_devices] INT DEFAULT 0,
        [conflicts_count] INT DEFAULT 0,
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_sync_stats_date UNIQUE ([stat_date])
    );
END
GO

-- ============================================
-- 5. 同步存储过程
-- ============================================

-- 注册/更新设备
IF OBJECT_ID('dbo.sp_register_sync_device', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_register_sync_device;
GO
CREATE PROCEDURE dbo.sp_register_sync_device
    @device_id NVARCHAR(64),
    @user_id INT,
    @device_type NVARCHAR(20),
    @device_name NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM dbo.sync_devices WHERE [device_id] = @device_id)
    BEGIN
        UPDATE dbo.sync_devices
        SET 
            [last_active_at] = GETDATE(),
            [is_active] = 1,
            [device_name] = COALESCE(@device_name, [device_name])
        WHERE [device_id] = @device_id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.sync_devices ([device_id], [user_id], [device_type], [device_name])
        VALUES (@device_id, @user_id, @device_type, @device_name);
    END
    
    SELECT [device_id], [device_type], [last_active_at] FROM dbo.sync_devices WHERE [device_id] = @device_id;
END
GO

-- 记录同步操作
IF OBJECT_ID('dbo.sp_log_sync_operation', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_log_sync_operation;
GO
CREATE PROCEDURE dbo.sp_log_sync_operation
    @user_id INT,
    @device_id NVARCHAR(64),
    @sync_type NVARCHAR(50),
    @entity_type NVARCHAR(50) = NULL,
    @entity_id INT = NULL,
    @action NVARCHAR(20),
    @data_snapshot NVARCHAR(MAX) = NULL,
    @sync_status NVARCHAR(20) = 'pending',
    @sync_latency_ms INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.sync_logs (
        [user_id], [device_id], [sync_type], [entity_type], [entity_id],
        [action], [data_snapshot], [sync_status], [sync_latency_ms]
    )
    VALUES (
        @user_id, @device_id, @sync_type, @entity_type, @entity_id,
        @action, @data_snapshot, @sync_status, @sync_latency_ms
    );
    
    -- 更新设备活跃时间
    UPDATE dbo.sync_devices
    SET [last_active_at] = GETDATE()
    WHERE [device_id] = @device_id;
    
    SELECT SCOPE_IDENTITY() AS [log_id];
END
GO

-- 标记同步完成
IF OBJECT_ID('dbo.sp_mark_sync_complete', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_mark_sync_complete;
GO
CREATE PROCEDURE dbo.sp_mark_sync_complete
    @log_id INT,
    @sync_status NVARCHAR(20),
    @sync_latency_ms INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.sync_logs
    SET 
        [sync_status] = @sync_status,
        [sync_latency_ms] = @sync_latency_ms,
        [synced_at] = GETDATE()
    WHERE [log_id] = @log_id;
    
    -- 更新统计
    DECLARE @today DATE = CAST(GETDATE() AS DATE);
    
    IF NOT EXISTS (SELECT 1 FROM dbo.sync_stats WHERE [stat_date] = @today)
    BEGIN
        INSERT INTO dbo.sync_stats ([stat_date]) VALUES (@today);
    END
    
    IF @sync_status = 'synced'
    BEGIN
        UPDATE dbo.sync_stats
        SET 
            [total_syncs] = [total_syncs] + 1,
            [successful_syncs] = [successful_syncs] + 1,
            [avg_latency_ms] = ([avg_latency_ms] * [successful_syncs] + @sync_latency_ms) / ([successful_syncs] + 1),
            [max_latency_ms] = CASE WHEN @sync_latency_ms > [max_latency_ms] THEN @sync_latency_ms ELSE [max_latency_ms] END,
            [min_latency_ms] = CASE WHEN [min_latency_ms] = 0 OR @sync_latency_ms < [min_latency_ms] THEN @sync_latency_ms ELSE [min_latency_ms] END
        WHERE [stat_date] = @today;
    END
    ELSE
    BEGIN
        UPDATE dbo.sync_stats
        SET 
            [total_syncs] = [total_syncs] + 1,
            [failed_syncs] = [failed_syncs] + 1
        WHERE [stat_date] = @today;
    END
END
GO

-- 获取用户待同步数据
IF OBJECT_ID('dbo.sp_get_pending_syncs', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_pending_syncs;
GO
CREATE PROCEDURE dbo.sp_get_pending_syncs
    @user_id INT,
    @device_id NVARCHAR(64),
    @since_time DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 获取该用户在其他设备上的待同步数据
    SELECT 
        [log_id],
        [sync_type],
        [entity_type],
        [entity_id],
        [action],
        [data_snapshot],
        [device_id] AS [source_device],
        [created_at]
    FROM dbo.sync_logs
    WHERE [user_id] = @user_id
      AND [device_id] != @device_id
      AND [sync_status] = 'synced'
      AND (@since_time IS NULL OR [created_at] > @since_time)
    ORDER BY [created_at] ASC;
END
GO

-- 获取同步统计
IF OBJECT_ID('dbo.sp_get_sync_statistics', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_sync_statistics;
GO
CREATE PROCEDURE dbo.sp_get_sync_statistics
    @days INT = 7
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @start_date DATE = CAST(DATEADD(DAY, -@days, GETDATE()) AS DATE);
    
    SELECT 
        [stat_date],
        [total_syncs],
        [successful_syncs],
        [failed_syncs],
        [avg_latency_ms],
        [max_latency_ms],
        [min_latency_ms],
        [active_devices],
        [conflicts_count],
        CAST([successful_syncs] AS FLOAT) / NULLIF([total_syncs], 0) * 100 AS [success_rate]
    FROM dbo.sync_stats
    WHERE [stat_date] >= @start_date
    ORDER BY [stat_date] DESC;
END
GO

-- 清理过期同步日志（保留30天）
IF OBJECT_ID('dbo.sp_cleanup_sync_logs', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_cleanup_sync_logs;
GO
CREATE PROCEDURE dbo.sp_cleanup_sync_logs
    @days_to_keep INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @cutoff_date DATETIME = DATEADD(DAY, -@days_to_keep, GETDATE());
    
    DELETE FROM dbo.sync_logs
    WHERE [created_at] < @cutoff_date
      AND [sync_status] = 'synced';
    
    SELECT @@ROWCOUNT AS [deleted_count];
END
GO