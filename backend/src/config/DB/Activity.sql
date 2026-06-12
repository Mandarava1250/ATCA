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

PRINT 'Activity 数据库初始化完成';
