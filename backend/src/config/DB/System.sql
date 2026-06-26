-- ============================================
-- 华夏营造 - 系统配置模块数据库
-- 管理AI服务配置、系统参数和全局设置
-- ============================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'System')
BEGIN
    CREATE DATABASE [System];
END
GO

USE [System];
GO

-- ============================================
-- 1. AI配置表 (ai_config)
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

-- ============================================
-- 2. 系统设置表 (system_settings)
-- ============================================
IF OBJECT_ID('dbo.system_settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.system_settings (
        [setting_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [setting_key] VARCHAR(100) NOT NULL UNIQUE,
        [setting_value] NVARCHAR(MAX) NULL,
        [description] NVARCHAR(500) NULL,
        [setting_type] VARCHAR(20) DEFAULT 'string',
        [is_public] BIT DEFAULT 0,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- 系统设置表更新触发器
IF OBJECT_ID('tr_system_settings_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_system_settings_updated_at;
GO

CREATE TRIGGER tr_system_settings_updated_at
ON dbo.system_settings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.system_settings
    SET [updated_at] = GETDATE()
    FROM dbo.system_settings s
    INNER JOIN inserted i ON s.[setting_id] = i.[setting_id];
END
GO

-- ============================================
-- 3. 预设AI配置数据（幂等插入）
-- ============================================
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

-- ============================================
-- 4. 预设系统设置数据（幂等插入）
-- ============================================
MERGE INTO dbo.system_settings AS target
USING (
    VALUES
    ('site_name', N'华夏营造', N'网站名称', 'string', 1),
    ('site_description', N'探索中国古代建筑文化的数字平台', N'网站描述', 'string', 1),
    ('default_language', 'zh-CN', N'默认语言', 'string', 1),
    ('max_upload_size_mb', '50', N'最大上传文件大小(MB)', 'number', 1),
    ('points_per_checkin', '10', N'每日打卡积分奖励', 'number', 1),
    ('points_per_correct_answer', '5', N'答对一题积分奖励', 'number', 1),
    ('max_daily_points', '100', N'每日最大积分获取上限', 'number', 1),
    ('activity_points_multiplier', '2', N'活动期间积分倍率', 'number', 1),
    ('email_notifications', 'true', N'是否启用邮件通知', 'boolean', 1),
    ('maintenance_mode', 'false', N'是否维护模式', 'boolean', 1),
    ('registration_enabled', 'true', N'是否允许新用户注册', 'boolean', 1),
    ('guest_access_enabled', 'true', N'是否允许访客访问', 'boolean', 1),
    ('search_enabled', 'true', N'是否启用搜索功能', 'boolean', 1),
    ('ai_enabled', 'true', N'是否启用AI助手', 'boolean', 1),
    ('sync_enabled', 'true', N'是否启用以数据同步', 'boolean', 1),
    ('max_models_per_user', '10', N'用户最大模型数量', 'number', 1),
    ('max_comments_per_post', '100', N'帖子最大评论数', 'number', 1),
    ('session_timeout_minutes', '120', N'会话超时时间(分钟)', 'number', 1),
    ('password_expiry_days', '90', N'密码过期天数', 'number', 1),
    ('cache_ttl_hours', '24', N'缓存过期时间(小时)', 'number', 1)
) AS source ([setting_key], [setting_value], [description], [setting_type], [is_public])
ON target.[setting_key] = source.[setting_key]
WHEN MATCHED THEN
    UPDATE SET
        [setting_value] = source.[setting_value],
        [description] = source.[description],
        [setting_type] = source.[setting_type],
        [is_public] = source.[is_public]
WHEN NOT MATCHED THEN
    INSERT ([setting_key], [setting_value], [description], [setting_type], [is_public])
    VALUES (source.[setting_key], source.[setting_value], source.[description], [setting_type], source.[is_public]);
GO

-- ============================================
-- 5. 存储过程
-- ============================================

-- 获取AI配置列表
IF OBJECT_ID('dbo.sp_get_ai_configs', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_ai_configs;
GO
CREATE PROCEDURE dbo.sp_get_ai_configs
    @active_only BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [ai_id], [name], [provider], [api_endpoint], [model], [is_active], [is_default], [temperature], [max_tokens], [description]
    FROM dbo.ai_config
    WHERE (@active_only = 0 OR [is_active] = 1)
    ORDER BY [is_default] DESC, [name];
END
GO

-- 获取默认AI配置
IF OBJECT_ID('dbo.sp_get_default_ai_config', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_default_ai_config;
GO
CREATE PROCEDURE dbo.sp_get_default_ai_config
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 [ai_id], [name], [provider], [app_id], [api_key], [api_secret], [version], [api_endpoint], [model], [system_prompt], [is_active], [temperature], [max_tokens], [max_concurrent], [max_queue_size], [queue_timeout]
    FROM dbo.ai_config
    WHERE [is_default] = 1 AND [is_active] = 1
    ORDER BY [ai_id];
END
GO

-- 获取系统设置
IF OBJECT_ID('dbo.sp_get_system_settings', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_system_settings;
GO
CREATE PROCEDURE dbo.sp_get_system_settings
    @public_only BIT = 0,
    @setting_key VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [setting_key], [setting_value], [description], [setting_type], [is_public]
    FROM dbo.system_settings
    WHERE (@public_only = 0 OR [is_public] = 1)
      AND (@setting_key IS NULL OR [setting_key] = @setting_key);
END
GO

-- 更新系统设置
IF OBJECT_ID('dbo.sp_update_system_setting', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_update_system_setting;
GO
CREATE PROCEDURE dbo.sp_update_system_setting
    @setting_key VARCHAR(100),
    @setting_value NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.system_settings
    SET [setting_value] = @setting_value, [updated_at] = GETDATE()
    WHERE [setting_key] = @setting_key;
    SELECT @@ROWCOUNT AS [updated];
END
GO

PRINT 'System 数据库初始化完成';