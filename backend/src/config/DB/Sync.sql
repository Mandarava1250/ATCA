-- ============================================
-- 筑见山河 - 数据同步模块数据库
-- 管理跨设备数据同步、冲突处理和同步日志
-- ============================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Sync')
BEGIN
    CREATE DATABASE [Sync];
END
GO

USE [Sync];
GO

-- ============================================
-- 1. 同步设备表 (sync_devices)
-- ============================================
IF OBJECT_ID('dbo.sync_devices', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_devices (
        [device_id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [device_type] NVARCHAR(20) NOT NULL,
        [device_name] NVARCHAR(100) NULL,
        [device_model] NVARCHAR(100) NULL,
        [os_type] NVARCHAR(20) NULL,
        [os_version] NVARCHAR(20) NULL,
        [app_version] NVARCHAR(20) NULL,
        [last_active_at] DATETIME DEFAULT GETDATE(),
        [is_active] BIT DEFAULT 1,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_sync_devices_user FOREIGN KEY ([user_id]) REFERENCES [ATCA_User].[dbo].[users]([user_id])
    );
END
GO

-- ============================================
-- 2. 用户同步状态表 (user_sync_status)
-- ============================================
IF OBJECT_ID('dbo.user_sync_status', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_sync_status (
        [user_id] INT NOT NULL PRIMARY KEY,
        [last_sync_at] DATETIME NULL,
        [last_checkin_sync_at] DATETIME NULL,
        [last_activity_sync_at] DATETIME NULL,
        [last_model_sync_at] DATETIME NULL,
        [last_forum_sync_at] DATETIME NULL,
        [sync_version] INT DEFAULT 0,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_user_sync_status_user FOREIGN KEY ([user_id]) REFERENCES [ATCA_User].[dbo].[users]([user_id])
    );
END
GO

-- ============================================
-- 3. 同步操作日志表 (sync_operations)
-- ============================================
IF OBJECT_ID('dbo.sync_operations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_operations (
        [operation_id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [device_id] NVARCHAR(64) NOT NULL,
        [operation_type] NVARCHAR(20) NOT NULL,
        [entity_type] NVARCHAR(50) NOT NULL,
        [entity_id] INT NOT NULL,
        [operation_data] NVARCHAR(MAX) NULL,
        [operation_time] DATETIME DEFAULT GETDATE(),
        [sync_status] NVARCHAR(20) DEFAULT 'pending',
        [synced_at] DATETIME NULL,
        [sync_error] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_sync_operations_device FOREIGN KEY ([device_id]) REFERENCES dbo.sync_devices([device_id])
    );
END
GO

-- ============================================
-- 4. 同步冲突表 (sync_conflicts)
-- ============================================
IF OBJECT_ID('dbo.sync_conflicts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_conflicts (
        [conflict_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [entity_type] NVARCHAR(50) NOT NULL,
        [entity_id] INT NOT NULL,
        [device_a_id] NVARCHAR(64) NOT NULL,
        [device_b_id] NVARCHAR(64) NOT NULL,
        [data_a] NVARCHAR(MAX) NULL,
        [data_b] NVARCHAR(MAX) NULL,
        [data_a_time] DATETIME NULL,
        [data_b_time] DATETIME NULL,
        [conflict_type] NVARCHAR(20) NOT NULL,
        [resolved] BIT DEFAULT 0,
        [resolved_by] INT NULL,
        [resolved_at] DATETIME NULL,
        [resolved_choice] NVARCHAR(20) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_sync_conflicts_user FOREIGN KEY ([user_id]) REFERENCES [ATCA_User].[dbo].[users]([user_id])
    );
END
GO

-- ============================================
-- 5. 创建索引
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_devices_user' AND object_id = OBJECT_ID('dbo.sync_devices'))
    CREATE NONCLUSTERED INDEX [idx_sync_devices_user] ON dbo.sync_devices([user_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_devices_active' AND object_id = OBJECT_ID('dbo.sync_devices'))
    CREATE NONCLUSTERED INDEX [idx_sync_devices_active] ON dbo.sync_devices([is_active]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_operations_user' AND object_id = OBJECT_ID('dbo.sync_operations'))
    CREATE NONCLUSTERED INDEX [idx_sync_operations_user] ON dbo.sync_operations([user_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_operations_status' AND object_id = OBJECT_ID('dbo.sync_operations'))
    CREATE NONCLUSTERED INDEX [idx_sync_operations_status] ON dbo.sync_operations([sync_status]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_conflicts_user' AND object_id = OBJECT_ID('dbo.sync_conflicts'))
    CREATE NONCLUSTERED INDEX [idx_sync_conflicts_user] ON dbo.sync_conflicts([user_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_sync_conflicts_resolved' AND object_id = OBJECT_ID('dbo.sync_conflicts'))
    CREATE NONCLUSTERED INDEX [idx_sync_conflicts_resolved] ON dbo.sync_conflicts([resolved]);
GO

-- ============================================
-- 6. 更新时间触发器
-- ============================================
GO
CREATE OR ALTER TRIGGER tr_user_sync_status_updated_at
ON dbo.user_sync_status
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.user_sync_status
    SET [updated_at] = GETDATE()
    FROM dbo.user_sync_status s
    INNER JOIN inserted i ON s.[user_id] = i.[user_id];
END
GO

-- ============================================
-- 7. 存储过程
-- ============================================

-- 注册同步设备
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_register_device
    @device_id NVARCHAR(64),
    @user_id INT,
    @device_type NVARCHAR(20),
    @device_name NVARCHAR(100) = NULL,
    @device_model NVARCHAR(100) = NULL,
    @os_type NVARCHAR(20) = NULL,
    @os_version NVARCHAR(20) = NULL,
    @app_version NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.sync_devices WHERE [device_id] = @device_id)
    BEGIN
        UPDATE dbo.sync_devices
        SET [user_id] = @user_id, [device_type] = @device_type, [device_name] = @device_name,
            [device_model] = @device_model, [os_type] = @os_type, [os_version] = @os_version,
            [app_version] = @app_version, [last_active_at] = GETDATE(), [is_active] = 1
        WHERE [device_id] = @device_id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.sync_devices ([device_id], [user_id], [device_type], [device_name],
            [device_model], [os_type], [os_version], [app_version])
        VALUES (@device_id, @user_id, @device_type, @device_name,
            [device_model], @os_type, @os_version, @app_version);
    END
END
GO

-- 获取用户设备列表
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_user_devices
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [device_id], [device_type], [device_name], [device_model], [os_type], [os_version],
           [app_version], [last_active_at], [is_active], [created_at]
    FROM dbo.sync_devices
    WHERE [user_id] = @user_id
    ORDER BY [last_active_at] DESC;
END
GO

-- 记录同步操作
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_log_operation
    @user_id INT,
    @device_id NVARCHAR(64),
    @operation_type NVARCHAR(20),
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @operation_data NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.sync_operations ([user_id], [device_id], [operation_type], [entity_type],
        [entity_id], [operation_data])
    VALUES (@user_id, @device_id, @operation_type, @entity_type, @entity_id, @operation_data);

    UPDATE dbo.sync_devices
    SET [last_active_at] = GETDATE()
    WHERE [device_id] = @device_id;

    UPDATE dbo.user_sync_status
    SET [last_sync_at] = GETDATE(), [sync_version] = [sync_version] + 1
    WHERE [user_id] = @user_id;
END
GO

-- 获取待同步操作
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_pending_operations
    @user_id INT,
    @device_id NVARCHAR(64),
    @sync_version INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [operation_id], [operation_type], [entity_type], [entity_id], [operation_data], [operation_time]
    FROM dbo.sync_operations
    WHERE [user_id] = @user_id AND [device_id] != @device_id AND [sync_status] = 'pending'
    ORDER BY [operation_time] ASC;
END
GO

-- 标记操作已同步
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_mark_synced
    @operation_id BIGINT,
    @device_id NVARCHAR(64) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.sync_operations
    SET [sync_status] = 'synced', [synced_at] = GETDATE()
    WHERE [operation_id] = @operation_id;

    IF @device_id IS NOT NULL
    BEGIN
        UPDATE dbo.sync_devices
        SET [last_active_at] = GETDATE()
        WHERE [device_id] = @device_id;
    END
END
GO

-- 记录同步冲突
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_log_conflict
    @user_id INT,
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @device_a_id NVARCHAR(64),
    @device_b_id NVARCHAR(64),
    @data_a NVARCHAR(MAX) = NULL,
    @data_b NVARCHAR(MAX) = NULL,
    @data_a_time DATETIME = NULL,
    @data_b_time DATETIME = NULL,
    @conflict_type NVARCHAR(20) = 'update'
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.sync_conflicts ([user_id], [entity_type], [entity_id], [device_a_id], [device_b_id],
        [data_a], [data_b], [data_a_time], [data_b_time], [conflict_type])
    VALUES (@user_id, @entity_type, @entity_id, @device_a_id, @device_b_id,
        @data_a, @data_b, @data_a_time, @data_b_time, @conflict_type);
END
GO

-- 获取用户冲突列表
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_user_conflicts
    @user_id INT,
    @resolved BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [conflict_id], [entity_type], [entity_id], [device_a_id], [device_b_id],
           [data_a], [data_b], [data_a_time], [data_b_time], [conflict_type],
           [resolved], [resolved_at], [resolved_choice]
    FROM dbo.sync_conflicts
    WHERE [user_id] = @user_id AND [resolved] = @resolved
    ORDER BY [created_at] DESC;
END
GO

-- 解决冲突
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_resolve_conflict
    @conflict_id INT,
    @resolved_by INT,
    @resolved_choice NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.sync_conflicts
    SET [resolved] = 1, [resolved_by] = @resolved_by, [resolved_at] = GETDATE(), [resolved_choice] = @resolved_choice
    WHERE [conflict_id] = @conflict_id;
END
GO

-- 获取用户同步状态
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_user_status
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [last_sync_at], [last_checkin_sync_at], [last_activity_sync_at],
           [last_model_sync_at], [last_forum_sync_at], [sync_version]
    FROM dbo.user_sync_status
    WHERE [user_id] = @user_id;
END
GO

-- 更新用户同步状态
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_update_user_status
    @user_id INT,
    @sync_type NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.user_sync_status WHERE [user_id] = @user_id)
    BEGIN
        INSERT INTO dbo.user_sync_status ([user_id]) VALUES (@user_id);
    END

    UPDATE dbo.user_sync_status
    SET [last_sync_at] = GETDATE(),
        [sync_version] = [sync_version] + 1,
        [last_checkin_sync_at] = CASE WHEN @sync_type = 'checkin' THEN GETDATE() ELSE [last_checkin_sync_at] END,
        [last_activity_sync_at] = CASE WHEN @sync_type = 'activity' THEN GETDATE() ELSE [last_activity_sync_at] END,
        [last_model_sync_at] = CASE WHEN @sync_type = 'model' THEN GETDATE() ELSE [last_model_sync_at] END,
        [last_forum_sync_at] = CASE WHEN @sync_type = 'forum' THEN GETDATE() ELSE [last_forum_sync_at] END
    WHERE [user_id] = @user_id;
END
GO

-- 获取同步统计
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_stats
    @user_id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        COUNT(DISTINCT [device_id]) AS device_count,
        COUNT(*) AS operation_count,
        SUM(CASE WHEN [sync_status] = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN [sync_status] = 'synced' THEN 1 ELSE 0 END) AS synced_count
    FROM dbo.sync_operations
    WHERE (@user_id IS NULL OR [user_id] = @user_id);
END
GO

-- 停用设备
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_deactivate_device
    @device_id NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.sync_devices
    SET [is_active] = 0
    WHERE [device_id] = @device_id;
END
GO

-- 清理过期同步日志
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_cleanup_logs
    @days_to_keep INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.sync_operations
    WHERE [sync_status] = 'synced' AND [synced_at] < DATEADD(DAY, -@days_to_keep, GETDATE());
    SELECT @@ROWCOUNT AS deleted;
END
GO

-- ============================================
-- 8. 用户打卡同步记录表 (user_checkin_sync)
-- ============================================
IF OBJECT_ID('dbo.user_checkin_sync', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_checkin_sync (
        [sync_record_id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [checkin_id] BIGINT NOT NULL,
        [checkin_date] DATE NOT NULL,
        [checkin_time] DATETIME NOT NULL,
        [streak_count] INT DEFAULT 1,
        [points_earned] INT DEFAULT 0,
        [device_type] VARCHAR(20) NULL,
        [device_info] NVARCHAR(255) NULL,
        [sync_status] NVARCHAR(20) DEFAULT 'pending',
        [synced_devices] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UK_user_checkin_date_sync UNIQUE ([user_id], [checkin_date]),
        CONSTRAINT FK_user_checkin_sync_user FOREIGN KEY ([user_id]) REFERENCES [ATCA_User].[dbo].[users]([user_id])
    );
END
GO

-- ============================================
-- 9. 创建打卡同步索引
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_checkin_sync_user' AND object_id = OBJECT_ID('dbo.user_checkin_sync'))
    CREATE NONCLUSTERED INDEX [idx_user_checkin_sync_user] ON dbo.user_checkin_sync([user_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_checkin_sync_date' AND object_id = OBJECT_ID('dbo.user_checkin_sync'))
    CREATE NONCLUSTERED INDEX [idx_user_checkin_sync_date] ON dbo.user_checkin_sync([checkin_date]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_checkin_sync_status' AND object_id = OBJECT_ID('dbo.user_checkin_sync'))
    CREATE NONCLUSTERED INDEX [idx_user_checkin_sync_status] ON dbo.user_checkin_sync([sync_status]);
GO

-- ============================================
-- 10. 打卡同步存储过程
-- ============================================

-- 记录打卡同步数据
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_record_checkin
    @user_id INT,
    @checkin_id BIGINT,
    @checkin_date DATE,
    @checkin_time DATETIME,
    @streak_count INT,
    @points_earned INT,
    @device_type VARCHAR(20) = NULL,
    @device_info NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @existing_id BIGINT;

    SELECT @existing_id = [sync_record_id]
    FROM dbo.user_checkin_sync
    WHERE [user_id] = @user_id AND [checkin_date] = @checkin_date;

    IF @existing_id IS NOT NULL
    BEGIN
        UPDATE dbo.user_checkin_sync
        SET [checkin_id] = @checkin_id,
            [checkin_time] = @checkin_time,
            [streak_count] = @streak_count,
            [points_earned] = @points_earned,
            [device_type] = COALESCE(@device_type, [device_type]),
            [device_info] = COALESCE(@device_info, [device_info]),
            [sync_status] = 'pending',
            [updated_at] = GETDATE()
        WHERE [sync_record_id] = @existing_id;

        SELECT @existing_id AS [sync_record_id], CAST(1 AS BIT) AS [success], N'更新成功' AS [message];
    END
    ELSE
    BEGIN
        INSERT INTO dbo.user_checkin_sync (
            [user_id], [checkin_id], [checkin_date], [checkin_time],
            [streak_count], [points_earned], [device_type], [device_info]
        ) VALUES (
            @user_id, @checkin_id, @checkin_date, @checkin_time,
            @streak_count, @points_earned, @device_type, @device_info
        );

        SELECT SCOPE_IDENTITY() AS [sync_record_id], CAST(1 AS BIT) AS [success], N'记录成功' AS [message];
    END
END
GO

-- 获取用户打卡同步记录
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_user_checkins
    @user_id INT,
    @page INT = 1,
    @limit INT = 30,
    @sync_status NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;

    SELECT
        [sync_record_id],
        [checkin_id],
        [checkin_date],
        [checkin_time],
        [streak_count],
        [points_earned],
        [device_type],
        [device_info],
        [sync_status],
        [synced_devices],
        [created_at],
        [updated_at]
    FROM dbo.user_checkin_sync
    WHERE [user_id] = @user_id
        AND (@sync_status IS NULL OR [sync_status] = @sync_status)
    ORDER BY [checkin_date] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- 获取用户待同步打卡记录
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_pending_checkins
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        [sync_record_id],
        [checkin_id],
        [checkin_date],
        [checkin_time],
        [streak_count],
        [points_earned],
        [device_type],
        [device_info]
    FROM dbo.user_checkin_sync
    WHERE [user_id] = @user_id AND [sync_status] = 'pending'
    ORDER BY [checkin_date] DESC;
END
GO

-- 标记打卡已同步到设备
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_mark_checkin_synced
    @user_id INT,
    @checkin_date DATE,
    @device_id NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.user_checkin_sync
    SET [synced_devices] = CASE 
            WHEN [synced_devices] IS NULL THEN @device_id
            WHEN [synced_devices] LIKE '%' + @device_id + '%' THEN [synced_devices]
            ELSE [synced_devices] + ',' + @device_id
        END,
        [updated_at] = GETDATE()
    WHERE [user_id] = @user_id AND [checkin_date] = @checkin_date;
END
GO

-- 批量标记打卡已同步
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_mark_checkins_synced
    @user_id INT,
    @device_id NVARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.user_checkin_sync
    SET [synced_devices] = CASE 
            WHEN [synced_devices] IS NULL THEN @device_id
            WHEN [synced_devices] LIKE '%' + @device_id + '%' THEN [synced_devices]
            ELSE [synced_devices] + ',' + @device_id
        END,
        [sync_status] = 'synced',
        [updated_at] = GETDATE()
    WHERE [user_id] = @user_id AND [sync_status] = 'pending';

    SELECT @@ROWCOUNT AS [updated_count];
END
GO

-- 获取用户打卡同步统计
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_checkin_stats
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COUNT(*) AS [total_records],
        SUM(CASE WHEN [sync_status] = 'pending' THEN 1 ELSE 0 END) AS [pending_count],
        SUM(CASE WHEN [sync_status] = 'synced' THEN 1 ELSE 0 END) AS [synced_count],
        MAX([checkin_date]) AS [last_checkin_date],
        MAX([updated_at]) AS [last_sync_time]
    FROM dbo.user_checkin_sync
    WHERE [user_id] = @user_id;
END
GO

-- ============================================
-- 11. 更新时间触发器
-- ============================================
GO
CREATE OR ALTER TRIGGER tr_user_checkin_sync_updated_at
ON dbo.user_checkin_sync
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.user_checkin_sync
    SET [updated_at] = GETDATE()
    FROM dbo.user_checkin_sync s
    INNER JOIN inserted i ON s.[sync_record_id] = i.[sync_record_id];
END
GO

PRINT 'Sync 数据库初始化完成';