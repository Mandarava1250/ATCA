IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Activity')
BEGIN
    CREATE DATABASE [Activity];
END
GO
USE [Activity];
GO

-- ============================================
-- 1. 成就定义表
-- ============================================
IF OBJECT_ID('dbo.achievement', 'U') IS NULL
BEGIN
    CREATE TABLE [achievement] (
        [achievement_id] INT IDENTITY(1,1) NOT NULL,
        [achievement_name] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [achievement_type] VARCHAR(50) NOT NULL,
        [required_points] INT NOT NULL,
        [required_actions] NVARCHAR(MAX) NULL,
        [icon] VARCHAR(255) DEFAULT '/images/achievements/default.png',
        [badge_url] VARCHAR(255) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_achievement PRIMARY KEY CLUSTERED ([achievement_id])
    );
    ALTER TABLE [achievement] ADD CONSTRAINT CK_achievement_type CHECK ([achievement_type] IN ('daily', 'weekly', 'special'));
    ALTER TABLE [achievement] ADD CONSTRAINT CK_required_points CHECK ([required_points] >= 0);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_achievement_type' AND object_id = OBJECT_ID('dbo.achievement'))
    CREATE INDEX idx_achievement_type ON [achievement]([achievement_type]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_required_points' AND object_id = OBJECT_ID('dbo.achievement'))
    CREATE INDEX idx_required_points ON [achievement]([required_points]);
GO

-- ============================================
-- 2. 活动表
-- ============================================
IF OBJECT_ID('dbo.activity', 'U') IS NULL
BEGIN
    CREATE TABLE [activity] (
        [activity_id] INT IDENTITY(1,1) NOT NULL,
        [title] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [start_date] DATETIME NOT NULL,
        [end_date] DATETIME NOT NULL,
        [activity_type] VARCHAR(50) NOT NULL,
        [banner_url] VARCHAR(255) NULL,
        [reward_points] INT DEFAULT 0,
        [max_participants] INT NULL,
        [current_participants] INT DEFAULT 0,
        [is_active] BIT DEFAULT 1,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_activity PRIMARY KEY CLUSTERED ([activity_id])
    );
    ALTER TABLE [activity] ADD CONSTRAINT CK_reward_points CHECK ([reward_points] >= 0);
    ALTER TABLE [activity] ADD CONSTRAINT CK_max_participants CHECK ([max_participants] IS NULL OR [max_participants] > 0);
    ALTER TABLE [activity] ADD CONSTRAINT CK_current_participants CHECK ([current_participants] >= 0);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_activity_type' AND object_id = OBJECT_ID('dbo.activity'))
    CREATE INDEX idx_activity_type ON [activity]([activity_type]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_activity_active' AND object_id = OBJECT_ID('dbo.activity'))
    CREATE INDEX idx_activity_active ON [activity]([is_active]);
GO

-- ============================================
-- 3. 每日任务表
-- ============================================
IF OBJECT_ID('dbo.daily_tasks', 'U') IS NULL
BEGIN
    CREATE TABLE [daily_tasks] (
        [task_id] INT IDENTITY(1,1) NOT NULL,
        [task_name] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [points_reward] INT DEFAULT 10,
        [required_action] VARCHAR(100) NULL,
        [action_count] INT DEFAULT 1,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_daily_tasks PRIMARY KEY CLUSTERED ([task_id])
    );
    ALTER TABLE [daily_tasks] ADD CONSTRAINT CK_task_points_reward CHECK ([points_reward] >= 0);
    ALTER TABLE [daily_tasks] ADD CONSTRAINT CK_action_count CHECK ([action_count] > 0);
END
GO

-- ============================================
-- 4. 用户活动关联表
-- ============================================
IF OBJECT_ID('dbo.user_activities', 'U') IS NULL
BEGIN
    CREATE TABLE [user_activities] (
        [user_activity_id] INT IDENTITY(1,1) NOT NULL,
        [user_id] INT NOT NULL,
        [activity_id] INT NOT NULL,
        [joined_at] DATETIME DEFAULT GETDATE(),
        [completed] BIT DEFAULT 0,
        [completion_time] DATETIME NULL,
        CONSTRAINT PK_user_activities PRIMARY KEY CLUSTERED ([user_activity_id])
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_activity' AND object_id = OBJECT_ID('dbo.user_activities'))
    CREATE INDEX idx_user_activity ON [user_activities]([user_id], [activity_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_activity_user' AND object_id = OBJECT_ID('dbo.user_activities'))
    CREATE INDEX idx_activity_user ON [user_activities]([activity_id], [user_id]);
GO

-- ============================================
-- 5. 默认成就数据
-- ============================================
MERGE INTO [achievement] AS target
USING (
    VALUES
    (N'新手入门', N'完成首次登录', 'special', 0, '/images/achievements/newbie.png'),
    (N'建筑爱好者', N'累计获得100积分', 'daily', 100, '/images/achievements/enthusiast.png'),
    (N'知识达人', N'累计获得500积分', 'weekly', 500, '/images/achievements/expert.png'),
    (N'建筑大师', N'累计获得1000积分', 'special', 1000, '/images/achievements/master.png'),
    (N'每日答题王', N'单日答对10题', 'daily', 50, '/images/achievements/daily-king.png')
) AS source ([achievement_name], [description], [achievement_type], [required_points], [icon])
ON target.[achievement_name] = source.[achievement_name]
WHEN NOT MATCHED THEN
    INSERT ([achievement_name], [description], [achievement_type], [required_points], [icon])
    VALUES (source.[achievement_name], source.[description], source.[achievement_type], source.[required_points], source.[icon]);
GO

-- ============================================
-- 6. 每日打卡记录表
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

-- 打卡索引
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

PRINT 'Activity 数据库初始化完成';
