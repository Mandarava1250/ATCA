-- ============================================
-- User Database Initialization Script
-- Compatible with SQL Server 2016+
-- ============================================

-- 创建数据库（不存在时）
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ATCA_User')
BEGIN
    CREATE DATABASE [ATCA_User];
END
GO

USE [ATCA_User];
GO

-- ============================================
-- 1. 用户主表
-- ============================================
IF OBJECT_ID('dbo.atca_user', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.atca_user (
        [user_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [username] VARCHAR(50) NOT NULL,
        [nickname] VARCHAR(50) NULL,
        [password] VARCHAR(255) NOT NULL,
        [email] VARCHAR(100) NOT NULL,
        [avatar] VARCHAR(255) DEFAULT '/images/default-avatar.png',
        [points] INT DEFAULT 0,
        [level] INT DEFAULT 1,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME NULL,
        [last_login] DATETIME NULL,
        [is_active] BIT DEFAULT 1,
        [role] VARCHAR(10) DEFAULT 'user'
    );

    ALTER TABLE dbo.atca_user ADD CONSTRAINT CK_user_points CHECK ([points] >= 0);
    ALTER TABLE dbo.atca_user ADD CONSTRAINT CK_user_level CHECK ([level] >= 1);
    ALTER TABLE dbo.atca_user ADD CONSTRAINT CK_user_role CHECK ([role] IN ('user', 'admin'));
END
GO

-- 索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uk_username' AND object_id = OBJECT_ID('dbo.atca_user'))
    CREATE UNIQUE INDEX [uk_username] ON dbo.atca_user([username]);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uk_email' AND object_id = OBJECT_ID('dbo.atca_user'))
    CREATE UNIQUE INDEX [uk_email] ON dbo.atca_user([email]);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_active' AND object_id = OBJECT_ID('dbo.atca_user'))
    CREATE INDEX [idx_user_active] ON dbo.atca_user([is_active]);
GO

-- ============================================
-- 2. 收藏表
-- ============================================
IF OBJECT_ID('dbo.favorite', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.favorite (
        [favorite_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [external_building_id] INT NOT NULL,
        [favorited_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_favorite_user FOREIGN KEY ([user_id]) REFERENCES dbo.atca_user([user_id]) ON DELETE CASCADE,
        CONSTRAINT UQ_user_building UNIQUE ([user_id], [external_building_id])
    );
END
GO

-- ============================================
-- 3. 用户设置表
-- ============================================
IF OBJECT_ID('dbo.user_settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_settings (
        [setting_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [setting_key] VARCHAR(50) NOT NULL,
        [setting_value] VARCHAR(MAX) NULL,
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_settings_user FOREIGN KEY ([user_id]) REFERENCES dbo.atca_user([user_id]) ON DELETE CASCADE,
        CONSTRAINT UQ_user_setting UNIQUE ([user_id], [setting_key])
    );
END
GO

-- ============================================
-- 4. 积分交易记录表
-- ============================================
IF OBJECT_ID('dbo.points_transaction', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.points_transaction (
        [transaction_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [points_change] INT NOT NULL,
        [transaction_type] VARCHAR(50) NOT NULL,
        [reference_id] VARCHAR(100) NULL,
        [description] VARCHAR(255) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_points_user FOREIGN KEY ([user_id]) REFERENCES dbo.atca_user([user_id]) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_points_transaction_user' AND object_id = OBJECT_ID('dbo.points_transaction'))
    CREATE INDEX [idx_points_transaction_user] ON dbo.points_transaction([user_id], [created_at]);
GO

-- ============================================
-- 5. 用户活动参与表
-- ============================================
IF OBJECT_ID('dbo.user_activity_participation', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_activity_participation (
        [participation_id] INT IDENTITY(1,1) NOT NULL,
        [external_user_id] INT NOT NULL,
        [activity_id] INT NOT NULL,
        [participated_at] DATETIME DEFAULT GETDATE(),
        [completion_status] VARCHAR(20) DEFAULT 'registered',
        [points_earned] INT DEFAULT 0,
        CONSTRAINT PK_user_activity_participation PRIMARY KEY CLUSTERED ([participation_id]),
        CONSTRAINT UQ_user_activity UNIQUE ([external_user_id], [activity_id])
    );

    ALTER TABLE dbo.user_activity_participation ADD CONSTRAINT CK_external_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE dbo.user_activity_participation ADD CONSTRAINT CK_completion_status CHECK ([completion_status] IN ('registered', 'participated', 'completed'));
    ALTER TABLE dbo.user_activity_participation ADD CONSTRAINT CK_points_earned CHECK ([points_earned] >= 0);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_completion_status' AND object_id = OBJECT_ID('dbo.user_activity_participation'))
    CREATE INDEX idx_completion_status ON dbo.user_activity_participation([completion_status]);
GO

-- ============================================
-- 6. 用户成就表
-- ============================================
IF OBJECT_ID('dbo.user_achievement', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_achievement (
        [achievement_record_id] INT IDENTITY(1,1) NOT NULL,
        [external_user_id] INT NOT NULL,
        [achievement_id] INT NOT NULL,
        [obtained_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT PK_user_achievement PRIMARY KEY CLUSTERED ([achievement_record_id]),
        CONSTRAINT UQ_user_achievement UNIQUE ([external_user_id], [achievement_id])
    );

    ALTER TABLE dbo.user_achievement ADD CONSTRAINT CK_achievement_external_user_id CHECK ([external_user_id] > 0);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_obtained_at' AND object_id = OBJECT_ID('dbo.user_achievement'))
    CREATE INDEX idx_obtained_at ON dbo.user_achievement([obtained_at]);
GO

-- ============================================
-- 7. 个人资料设置表
-- ============================================
IF OBJECT_ID('dbo.profile_settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.profile_settings (
        [setting_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [visibility] NVARCHAR(20) NOT NULL DEFAULT 'public',
        [bio] NVARCHAR(500) NULL,
        [location] NVARCHAR(100) NULL,
        [interests] NVARCHAR(MAX) NULL,
        [social_links] NVARCHAR(MAX) NULL,
        [notification_preferences] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_profile_user FOREIGN KEY ([user_id]) REFERENCES dbo.atca_user([user_id]) ON DELETE CASCADE
    );

    ALTER TABLE dbo.profile_settings ADD CONSTRAINT CK_visibility CHECK ([visibility] IN ('public', 'friends', 'private'));
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_profile_settings_user' AND object_id = OBJECT_ID('dbo.profile_settings'))
    CREATE INDEX [idx_profile_settings_user] ON dbo.profile_settings([user_id]);
GO

-- ============================================
-- 8. 管理员账户初始化
-- ============================================
IF NOT EXISTS (SELECT 1 FROM dbo.atca_user WHERE [username] = 'admin')
BEGIN
    INSERT INTO dbo.atca_user ([username], [nickname], [password], [email], [role], [points], [level], [is_active])
    VALUES (
        'admin',
        '管理员',
        '$2b$10$bH3.WAX5668Ze9tDyj2DQuxf5e6Wb3Po3YqjcYhzQFWHsbtYnUWbS',
        'admin@example.com',
        'admin',
        1000,
        10,
        1
    );
    PRINT '管理员账户已创建，请通过应用接口重置密码';
END
ELSE
BEGIN
    PRINT '管理员账户已存在，跳过创建';
END
GO

-- 执行后检查一下
SELECT [username], [password] FROM dbo.atca_user WHERE [username] = 'admin';

-- ============================================
-- 9. 用户表更新触发器
-- ============================================
IF OBJECT_ID('dbo.trg_user_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_user_updated_at;
GO

CREATE TRIGGER dbo.trg_user_updated_at
ON dbo.atca_user
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.atca_user
    SET [updated_at] = GETDATE()
    FROM dbo.atca_user u
    INNER JOIN inserted i ON u.[user_id] = i.[user_id];
END
GO

-- ============================================
-- 10. AI配置表 (ai_config)
-- ============================================
IF OBJECT_ID('dbo.ai_config', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ai_config (
        [ai_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL,
        [provider] VARCHAR(50) NOT NULL DEFAULT 'custom',
        [app_id] NVARCHAR(255) NULL,
        [api_key] NVARCHAR(500) NULL,
        [api_secret] NVARCHAR(500) NULL,
        [version] NVARCHAR(50) NULL,
        [api_endpoint] NVARCHAR(500) NULL,
        [model] NVARCHAR(100) NULL,
        [system_prompt] NVARCHAR(MAX) NULL,
        [description] NVARCHAR(500) NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [is_default] BIT NOT NULL DEFAULT 0,
        [temperature] DECIMAL(3,2) DEFAULT 0.70,
        [max_tokens] INT DEFAULT 2048,
        [max_concurrent] INT DEFAULT 3,
        [max_queue_size] INT DEFAULT 20,
        [queue_timeout] INT DEFAULT 60,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- 添加并发设置字段（如果不存在）
IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'max_concurrent' AND object_id = OBJECT_ID('dbo.ai_config'))
BEGIN
    ALTER TABLE dbo.ai_config ADD [max_concurrent] INT DEFAULT 3;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'max_queue_size' AND object_id = OBJECT_ID('dbo.ai_config'))
BEGIN
    ALTER TABLE dbo.ai_config ADD [max_queue_size] INT DEFAULT 20;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'queue_timeout' AND object_id = OBJECT_ID('dbo.ai_config'))
BEGIN
    ALTER TABLE dbo.ai_config ADD [queue_timeout] INT DEFAULT 60;
END
GO

-- ai_config 表更新触发器
IF OBJECT_ID('tr_ai_config_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_ai_config_updated_at;
GO

CREATE TRIGGER tr_ai_config_updated_at
ON dbo.ai_config
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.ai_config
    SET [updated_at] = GETDATE()
    FROM dbo.ai_config a
    INNER JOIN inserted i ON a.[ai_id] = i.[ai_id];
END
GO

-- 为现有用户创建默认设置
MERGE INTO dbo.profile_settings AS target
USING (SELECT [user_id] FROM dbo.atca_user WHERE [user_id] NOT IN (SELECT [user_id] FROM dbo.profile_settings)) AS source
ON target.[user_id] = source.[user_id]
WHEN NOT MATCHED THEN
    INSERT ([user_id], [visibility])
    VALUES (source.[user_id], 'public');
GO

-- 预设AI配置（含讯飞星火Lite，严格按WebSocket文档配置）
-- 讯飞星火文档: https://www.xfyun.cn/doc/spark/Web.html
-- Spark Lite: wss://spark-api.xf-yun.com/v1.1/chat, domain=lite
MERGE INTO dbo.ai_config AS target
USING (
    VALUES
    (1, N'通用AI助手', 'openai', NULL, NULL, NULL, 'gpt-4o', 'https://api.openai.com/v1/chat/completions', 'gpt-4o', N'你是华夏营造的AI助手，精通中国古代建筑文化。请用专业但易懂的方式回答用户的问题。', N'通用型AI助手，适合解答古建筑知识', 1, 1, 0.70, 2048, 3, 20, 60),
    (2, N'建筑技术专家', 'openai', NULL, NULL, NULL, 'gpt-4o', 'https://api.openai.com/v1/chat/completions', 'gpt-4o', N'你是一位古建筑技术专家，专注于斗拱、榫卯、营造法式等技术细节。请从技术角度详细解答问题。', N'专注建筑技术细节的专家', 1, 0, 0.50, 2048, 3, 20, 60),
    (3, N'历史学者', 'openai', NULL, NULL, NULL, 'gpt-4o', 'https://api.openai.com/v1/chat/completions', 'gpt-4o', N'你是一位研究中国古代建筑史的学者，精通各朝代建筑风格和演变。请从历史角度解答问题。', N'专注历史文化的学者', 1, 0, 0.60, 2048, 3, 20, 60),
    (4, N'讯飞星火Lite', 'spark', NULL, NULL, NULL, 'lite', 'wss://spark-api.xf-yun.com/v1.1/chat', 'lite', N'你是华夏营造的AI助手，精通中国古代建筑文化。请用专业但易懂的方式回答用户的问题。', N'讯飞星火Spark Lite（WebSocket协议）支持自选版本: lite/generalv3/pro-128k/generalv3.5/max-32k/4.0Ultra', 1, 0, 0.50, 2048, 3, 20, 60)
) AS source ([ai_id], [name], [provider], [app_id], [api_key], [api_secret], [version], [api_endpoint], [model], [system_prompt], [description], [is_active], [is_default], [temperature], [max_tokens], [max_concurrent], [max_queue_size], [queue_timeout])
ON target.[ai_id] = source.[ai_id]
WHEN MATCHED THEN
    UPDATE SET
        [name] = source.[name],
        [provider] = source.[provider],
        [app_id] = source.[app_id],
        [api_key] = source.[api_key],
        [api_secret] = source.[api_secret],
        [version] = source.[version],
        [api_endpoint] = source.[api_endpoint],
        [model] = source.[model],
        [system_prompt] = source.[system_prompt],
        [description] = source.[description],
        [is_active] = source.[is_active],
        [is_default] = source.[is_default],
        [temperature] = source.[temperature],
        [max_tokens] = source.[max_tokens],
        [max_concurrent] = source.[max_concurrent],
        [max_queue_size] = source.[max_queue_size],
        [queue_timeout] = source.[queue_timeout]
WHEN NOT MATCHED THEN
    INSERT ([name], [provider], [app_id], [api_key], [api_secret], [version], [api_endpoint], [model], [system_prompt], [description], [is_active], [is_default], [temperature], [max_tokens], [max_concurrent], [max_queue_size], [queue_timeout])
    VALUES (source.[name], source.[provider], source.[app_id], source.[api_key], source.[api_secret], source.[version], source.[api_endpoint], source.[model], source.[system_prompt], source.[description], source.[is_active], source.[is_default], source.[temperature], source.[max_tokens], source.[max_concurrent], source.[max_queue_size], source.[queue_timeout]);
GO

PRINT 'ATCA_User 数据库初始化完成';
PRINT 'ai_config 表初始化完成';