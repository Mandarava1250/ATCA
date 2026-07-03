IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Activity')
BEGIN
    CREATE DATABASE [Activity];
END
GO
USE [Activity];
GO

-- ============================================
-- 每日打卡记录表
-- ============================================
IF OBJECT_ID('dbo.daily_checkin', 'U') IS NULL
BEGIN
    CREATE TABLE [daily_checkin] (
        [checkin_id] BIGINT IDENTITY(1,1) NOT NULL,
        [user_id] INT NOT NULL,
        [checkin_date] DATE NOT NULL,
        [checkin_time] DATETIME DEFAULT GETDATE(),
        [streak_count] INT DEFAULT 1,
        [points_earned] INT DEFAULT 0,
        [device_type] VARCHAR(20) NULL,
        [device_info] NVARCHAR(255) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_daily_checkin PRIMARY KEY CLUSTERED ([checkin_id]),
        CONSTRAINT UK_user_date UNIQUE ([user_id], [checkin_date])
    );
END
GO

-- 用户打卡统计视图
IF OBJECT_ID('dbo.vw_user_checkin_stats', 'V') IS NULL
BEGIN
    CREATE VIEW [vw_user_checkin_stats] AS
    SELECT
        [user_id],
        COUNT(*) AS total_checkins,
        MAX([streak_count]) AS max_streak,
        SUM([points_earned]) AS total_points,
        MAX([checkin_date]) AS last_checkin_date,
        COUNT(CASE WHEN [checkin_date] >= DATEADD(DAY, -7, GETDATE()) THEN 1 END) AS weekly_checkins,
        COUNT(CASE WHEN [checkin_date] >= DATEADD(DAY, -30, GETDATE()) THEN 1 END) AS monthly_checkins
    FROM [daily_checkin]
    GROUP BY [user_id];
END
GO

-- 索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_checkin_user_date' AND object_id = OBJECT_ID('dbo.daily_checkin'))
    CREATE INDEX idx_checkin_user_date ON [daily_checkin]([user_id], [checkin_date]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_checkin_date' AND object_id = OBJECT_ID('dbo.daily_checkin'))
    CREATE INDEX idx_checkin_date ON [daily_checkin]([checkin_date]);
GO

-- 存储过程：用户打卡
IF OBJECT_ID('dbo.sp_user_checkin', 'P') IS NULL
BEGIN
    CREATE PROCEDURE [dbo].[sp_user_checkin]
        @user_id INT,
        @device_type VARCHAR(20) = NULL,
        @device_info NVARCHAR(255) = NULL,
        @checkin_date DATE = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @target_date DATE = COALESCE(@checkin_date, CAST(GETDATE() AS DATE));
        DECLARE @yesterday DATE = DATEADD(DAY, -1, @target_date);
        DECLARE @streak INT = 1;
        DECLARE @points INT = 10;
        
        IF EXISTS (SELECT 1 FROM [daily_checkin] WHERE [user_id] = @user_id AND [checkin_date] = @target_date)
        BEGIN
            SELECT 
                CAST(0 AS BIT) AS [success],
                N'该日期已打卡' AS [message],
                NULL AS [checkin_id],
                NULL AS [streak_count],
                0 AS [points_earned],
                CAST(1 AS BIT) AS [already_checked];
            RETURN;
        END
        
        SELECT @streak = [streak_count] + 1 
        FROM [daily_checkin] 
        WHERE [user_id] = @user_id AND [checkin_date] = @yesterday;
        
        IF @streak IS NULL OR @streak = 0 SET @streak = 1;
        
        IF @streak >= 7 SET @points = 50;
        ELSE IF @streak >= 5 SET @points = 30;
        ELSE IF @streak >= 3 SET @points = 20;
        
        INSERT INTO [daily_checkin] (
            [user_id], [checkin_date], [checkin_time], 
            [streak_count], [points_earned], [device_type], [device_info]
        ) VALUES (
            @user_id, @target_date, GETDATE(), @streak, @points, @device_type, @device_info
        );
        
        SELECT 
            CAST(1 AS BIT) AS [success],
            N'打卡成功' AS [message],
            SCOPE_IDENTITY() AS [checkin_id],
            @streak AS [streak_count],
            @points AS [points_earned],
            CAST(0 AS BIT) AS [already_checked];
    END
END
GO

-- 存储过程：获取用户打卡记录
IF OBJECT_ID('dbo.sp_get_user_checkins', 'P') IS NULL
BEGIN
    CREATE PROCEDURE [dbo].[sp_get_user_checkins]
        @user_id INT,
        @page INT = 1,
        @limit INT = 30
    AS
    BEGIN
        SET NOCOUNT ON;
        DECLARE @offset INT = (@page - 1) * @limit;
        
        SELECT
            [checkin_id],
            [checkin_date],
            [checkin_time],
            [streak_count],
            [points_earned],
            [device_type],
            [created_at]
        FROM [daily_checkin]
        WHERE [user_id] = @user_id
        ORDER BY [checkin_date] DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    END
END
GO

-- 存储过程：获取用户打卡统计
IF OBJECT_ID('dbo.sp_get_user_checkin_stats', 'P') IS NULL
BEGIN
    CREATE PROCEDURE [dbo].[sp_get_user_checkin_stats]
        @user_id INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT
            ISNULL([total_checkins], 0) AS [total_checkins],
            ISNULL([max_streak], 0) AS [max_streak],
            ISNULL([total_points], 0) AS [total_points],
            [last_checkin_date],
            ISNULL([weekly_checkins], 0) AS [weekly_checkins],
            ISNULL([monthly_checkins], 0) AS [monthly_checkins]
        FROM [vw_user_checkin_stats]
        WHERE [user_id] = @user_id;
    END
END
GO

-- 存储过程：检查今日是否已打卡
IF OBJECT_ID('dbo.sp_check_today_checkin', 'P') IS NULL
BEGIN
    CREATE PROCEDURE [dbo].[sp_check_today_checkin]
        @user_id INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @today DATE = CAST(GETDATE() AS DATE);
        
        SELECT
            CASE WHEN EXISTS (SELECT 1 FROM [daily_checkin] WHERE [user_id] = @user_id AND [checkin_date] = @today) 
                 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS [checked_today];
    END
END
GO

-- 存储过程：获取打卡日历数据
IF OBJECT_ID('dbo.sp_get_checkin_calendar', 'P') IS NULL
BEGIN
    CREATE PROCEDURE [dbo].[sp_get_checkin_calendar]
        @user_id INT,
        @year INT,
        @month INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @startDate DATE = DATEFROMPARTS(@year, @month, 1);
        DECLARE @endDate DATE = DATEADD(DAY, -1, DATEADD(MONTH, 1, @startDate));
        
        SELECT
            [checkin_date],
            [streak_count],
            [points_earned]
        FROM [daily_checkin]
        WHERE [user_id] = @user_id 
            AND [checkin_date] >= @startDate 
            AND [checkin_date] <= @endDate
        ORDER BY [checkin_date];
    END
END
GO

PRINT 'Checkin 数据库初始化完成';
