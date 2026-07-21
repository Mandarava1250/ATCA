-- ============================================================
-- 华夏营造 (ATCA) - 全量数据库初始化脚本
-- 文件: InitializedSQL.sql
-- 说明: 只需执行本文件即可正确初始化所有数据库
-- 包含: ATCA_User, Architecture, Media_3D, Knowledge,
--       System, Translation, Activity, Competition, Social, Sync
-- ============================================================

-- ============================================================
-- [1/10] 用户模块数据库 (ATCA_User)
-- 说明: 必须最先创建，其他数据库(Sync等)通过外键引用此库
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ATCA_User')
BEGIN
    CREATE DATABASE [ATCA_User];
END
GO
USE [ATCA_User];
GO
-- ============================================
-- 1. 用户主表 (users)
-- ============================================
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        [user_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [username] VARCHAR(50) NOT NULL UNIQUE,
        [nickname] VARCHAR(50) NULL,
        [password] VARCHAR(255) NOT NULL,
        [email] VARCHAR(100) NOT NULL UNIQUE,
        [avatar] VARCHAR(255) DEFAULT '/images/default-avatar.svg',
        [points] INT DEFAULT 0,
        [level] INT DEFAULT 1,
        [exp] INT DEFAULT 0,
        [role] VARCHAR(10) DEFAULT 'user',
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME NULL,
        [last_login] DATETIME NULL,
        [is_active] BIT DEFAULT 1,
        [is_verified] BIT DEFAULT 0,
        [verification_token] VARCHAR(255) NULL,
        [reset_token] VARCHAR(255) NULL,
        [reset_token_expire] DATETIME NULL,
        [login_attempts] INT DEFAULT 0,
        [lockout_until] DATETIME NULL
    );
END
GO
-- ============================================
-- 1.1 用户表约束条件
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_user_points' AND parent_object_id = OBJECT_ID('dbo.users'))
    ALTER TABLE dbo.users ADD CONSTRAINT CK_user_points CHECK ([points] >= 0);
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_user_level' AND parent_object_id = OBJECT_ID('dbo.users'))
    ALTER TABLE dbo.users ADD CONSTRAINT CK_user_level CHECK ([level] >= 1);
GO
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_user_role' AND parent_object_id = OBJECT_ID('dbo.users'))
    ALTER TABLE dbo.users ADD CONSTRAINT CK_user_role CHECK ([role] IN ('user', 'admin'));
GO
-- ============================================
-- 2. 用户收藏表 (user_favorites)
-- ============================================
IF OBJECT_ID('dbo.user_favorites', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_favorites (
        [favorite_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [item_id] INT NOT NULL,
        [item_type] VARCHAR(50) NOT NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_user_favorites_user FOREIGN KEY ([user_id]) REFERENCES dbo.users([user_id]) ON DELETE CASCADE,
        CONSTRAINT UQ_user_favorites UNIQUE ([user_id], [item_id], [item_type])
    );
END
GO
-- ============================================
-- 3. 用户设置表 (user_settings)
-- ============================================
IF OBJECT_ID('dbo.user_settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_settings (
        [setting_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [language] VARCHAR(10) DEFAULT 'zh-CN',
        [theme] VARCHAR(20) DEFAULT 'light',
        [notifications_enabled] BIT DEFAULT 1,
        [email_notifications] BIT DEFAULT 1,
        [push_notifications] BIT DEFAULT 1,
        [auto_sync] BIT DEFAULT 1,
        [daily_checkin_reminder] BIT DEFAULT 1,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_user_settings_user FOREIGN KEY ([user_id]) REFERENCES dbo.users([user_id]) ON DELETE CASCADE
    );
END
GO
-- ============================================
-- 4. 积分交易记录表 (point_transactions)
-- ============================================
IF OBJECT_ID('dbo.point_transactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.point_transactions (
        [transaction_id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [transaction_type] VARCHAR(50) NOT NULL,
        [amount] INT NOT NULL,
        [balance_before] INT NOT NULL,
        [balance_after] INT NOT NULL,
        [description] NVARCHAR(500) NULL,
        [reference_id] INT NULL,
        [reference_type] VARCHAR(50) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_point_transactions_user FOREIGN KEY ([user_id]) REFERENCES dbo.users([user_id]) ON DELETE CASCADE
    );
END
GO
-- ============================================
-- 5. 创建索引
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uk_username' AND object_id = OBJECT_ID('dbo.users'))
    CREATE UNIQUE INDEX [uk_username] ON dbo.users([username]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'uk_email' AND object_id = OBJECT_ID('dbo.users'))
    CREATE UNIQUE INDEX [uk_email] ON dbo.users([email]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_active' AND object_id = OBJECT_ID('dbo.users'))
    CREATE INDEX [idx_user_active] ON dbo.users([is_active]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_role' AND object_id = OBJECT_ID('dbo.users'))
    CREATE NONCLUSTERED INDEX [idx_users_role] ON dbo.users([role]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_favorites_user' AND object_id = OBJECT_ID('dbo.user_favorites'))
    CREATE NONCLUSTERED INDEX [idx_user_favorites_user] ON dbo.user_favorites([user_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_favorites_item' AND object_id = OBJECT_ID('dbo.user_favorites'))
    CREATE NONCLUSTERED INDEX [idx_user_favorites_item] ON dbo.user_favorites([item_type], [item_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_point_transactions_user' AND object_id = OBJECT_ID('dbo.point_transactions'))
    CREATE NONCLUSTERED INDEX [idx_point_transactions_user] ON dbo.point_transactions([user_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_point_transactions_type' AND object_id = OBJECT_ID('dbo.point_transactions'))
    CREATE NONCLUSTERED INDEX [idx_point_transactions_type] ON dbo.point_transactions([transaction_type]);
GO
-- ============================================
-- 6. 更新时间触发器
-- ============================================
IF OBJECT_ID('tr_users_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_users_updated_at;
GO
CREATE TRIGGER tr_users_updated_at
ON dbo.users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.users
    SET [updated_at] = GETDATE()
    FROM dbo.users u
    INNER JOIN inserted i ON u.[user_id] = i.[user_id];
END
GO
IF OBJECT_ID('tr_user_settings_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_user_settings_updated_at;
GO
CREATE TRIGGER tr_user_settings_updated_at
ON dbo.user_settings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.user_settings
    SET [updated_at] = GETDATE()
    FROM dbo.user_settings s
    INNER JOIN inserted i ON s.[setting_id] = i.[setting_id];
END
GO
-- ============================================
-- 7. 存储过程
-- ============================================
-- 用户注册
IF OBJECT_ID('dbo.sp_user_register', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_register;
GO
CREATE PROCEDURE dbo.sp_user_register
    @username VARCHAR(50),
    @email VARCHAR(100),
    @password VARCHAR(255),
    @nickname VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.users ([username], [email], [password], [nickname])
    VALUES (@username, @email, @password, COALESCE(@nickname, @username));
    SELECT SCOPE_IDENTITY() AS [user_id];
END
GO
-- 用户登录
IF OBJECT_ID('dbo.sp_user_login', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_login;
GO
CREATE PROCEDURE dbo.sp_user_login
    @username VARCHAR(50),
    @password VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [user_id], [username], [email], [nickname], [avatar], [points], [level], [role], [is_active]
    FROM dbo.users
    WHERE ([username] = @username OR [email] = @username) AND [password] = @password;
END
GO
-- 更新用户信息
IF OBJECT_ID('dbo.sp_user_update', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_update;
GO
CREATE PROCEDURE dbo.sp_user_update
    @user_id INT,
    @nickname VARCHAR(50) = NULL,
    @avatar VARCHAR(255) = NULL,
    @email VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.users
    SET [nickname] = COALESCE(@nickname, [nickname]),
        [avatar] = COALESCE(@avatar, [avatar]),
        [email] = COALESCE(@email, [email])
    WHERE [user_id] = @user_id;
END
GO
-- 更新用户积分
IF OBJECT_ID('dbo.sp_user_update_points', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_update_points;
GO
CREATE PROCEDURE dbo.sp_user_update_points
    @user_id INT,
    @amount INT,
    @transaction_type VARCHAR(50),
    @description NVARCHAR(500) = NULL,
    @reference_id INT = NULL,
    @reference_type VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @balance_before INT;
    DECLARE @balance_after INT;
    SELECT @balance_before = [points] FROM dbo.users WHERE [user_id] = @user_id;
    SET @balance_after = @balance_before + @amount;
    UPDATE dbo.users
    SET [points] = @balance_after
    WHERE [user_id] = @user_id;
    INSERT INTO dbo.point_transactions ([user_id], [transaction_type], [amount], [balance_before],
        [balance_after], [description], [reference_id], [reference_type])
    VALUES (@user_id, @transaction_type, @amount, @balance_before, @balance_after,
        @description, @reference_id, @reference_type);
    SELECT @balance_after AS [new_balance];
END
GO
-- 添加收藏
IF OBJECT_ID('dbo.sp_user_add_favorite', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_add_favorite;
GO
CREATE PROCEDURE dbo.sp_user_add_favorite
    @user_id INT,
    @item_id INT,
    @item_type VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.user_favorites WHERE [user_id] = @user_id AND [item_id] = @item_id AND [item_type] = @item_type)
    BEGIN
        INSERT INTO dbo.user_favorites ([user_id], [item_id], [item_type])
        VALUES (@user_id, @item_id, @item_type);
    END
END
GO
-- 删除收藏
IF OBJECT_ID('dbo.sp_user_remove_favorite', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_remove_favorite;
GO
CREATE PROCEDURE dbo.sp_user_remove_favorite
    @user_id INT,
    @item_id INT,
    @item_type VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.user_favorites
    WHERE [user_id] = @user_id AND [item_id] = @item_id AND [item_type] = @item_type;
END
GO
-- 获取用户收藏列表
IF OBJECT_ID('dbo.sp_user_get_favorites', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_get_favorites;
GO
CREATE PROCEDURE dbo.sp_user_get_favorites
    @user_id INT,
    @item_type VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [favorite_id], [item_id], [item_type], [created_at]
    FROM dbo.user_favorites
    WHERE [user_id] = @user_id AND (@item_type IS NULL OR [item_type] = @item_type)
    ORDER BY [created_at] DESC;
END
GO
-- 获取用户设置
IF OBJECT_ID('dbo.sp_user_get_settings', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_get_settings;
GO
CREATE PROCEDURE dbo.sp_user_get_settings
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [language], [theme], [notifications_enabled], [email_notifications],
           [push_notifications], [auto_sync], [daily_checkin_reminder]
    FROM dbo.user_settings
    WHERE [user_id] = @user_id;
END
GO
-- 更新用户设置
IF OBJECT_ID('dbo.sp_user_update_settings', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_update_settings;
GO
CREATE PROCEDURE dbo.sp_user_update_settings
    @user_id INT,
    @language VARCHAR(10) = NULL,
    @theme VARCHAR(20) = NULL,
    @notifications_enabled BIT = NULL,
    @email_notifications BIT = NULL,
    @push_notifications BIT = NULL,
    @auto_sync BIT = NULL,
    @daily_checkin_reminder BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.user_settings WHERE [user_id] = @user_id)
    BEGIN
        INSERT INTO dbo.user_settings ([user_id]) VALUES (@user_id);
    END
    UPDATE dbo.user_settings
    SET [language] = COALESCE(@language, [language]),
        [theme] = COALESCE(@theme, [theme]),
        [notifications_enabled] = COALESCE(@notifications_enabled, [notifications_enabled]),
        [email_notifications] = COALESCE(@email_notifications, [email_notifications]),
        [push_notifications] = COALESCE(@push_notifications, [push_notifications]),
        [auto_sync] = COALESCE(@auto_sync, [auto_sync]),
        [daily_checkin_reminder] = COALESCE(@daily_checkin_reminder, [daily_checkin_reminder])
    WHERE [user_id] = @user_id;
END
GO
-- 获取用户积分交易记录
IF OBJECT_ID('dbo.sp_user_get_point_transactions', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_get_point_transactions;
GO
CREATE PROCEDURE dbo.sp_user_get_point_transactions
    @user_id INT,
    @page INT = 1,
    @page_size INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;
    SELECT [transaction_id], [transaction_type], [amount], [balance_before], [balance_after],
           [description], [reference_id], [reference_type], [created_at]
    FROM dbo.point_transactions
    WHERE [user_id] = @user_id
    ORDER BY [created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
END
GO
-- 获取用户统计信息
IF OBJECT_ID('dbo.sp_user_get_stats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_get_stats;
GO
CREATE PROCEDURE dbo.sp_user_get_stats
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.[user_id], u.[username], u.[nickname], u.[avatar], u.[points], u.[level], u.[exp], u.[role],
        (SELECT COUNT(*) FROM dbo.user_favorites WHERE [user_id] = u.[user_id]) AS favorite_count,
        (SELECT COUNT(*) FROM dbo.point_transactions WHERE [user_id] = u.[user_id]) AS transaction_count,
        u.[created_at], u.[last_login]
    FROM dbo.users u
    WHERE u.[user_id] = @user_id;
END
GO
-- 获取用户列表
IF OBJECT_ID('dbo.sp_user_get_list', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_get_list;
GO
CREATE PROCEDURE dbo.sp_user_get_list
    @role VARCHAR(10) = NULL,
    @is_active BIT = NULL,
    @page INT = 1,
    @page_size INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;
    SELECT [user_id], [username], [nickname], [email], [avatar], [points], [level], [role],
           [is_active], [created_at], [last_login]
    FROM dbo.users
    WHERE (@role IS NULL OR [role] = @role) AND (@is_active IS NULL OR [is_active] = @is_active)
    ORDER BY [created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
END
GO
-- 更新用户角色
IF OBJECT_ID('dbo.sp_user_update_role', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_update_role;
GO
CREATE PROCEDURE dbo.sp_user_update_role
    @user_id INT,
    @role VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.users
    SET [role] = @role
    WHERE [user_id] = @user_id;
END
GO
-- 锁定/解锁用户
IF OBJECT_ID('dbo.sp_user_toggle_active', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_toggle_active;
GO
CREATE PROCEDURE dbo.sp_user_toggle_active
    @user_id INT,
    @is_active BIT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.users
    SET [is_active] = @is_active
    WHERE [user_id] = @user_id;
END
GO
-- 记录登录尝试
IF OBJECT_ID('dbo.sp_user_log_login_attempt', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_log_login_attempt;
GO
CREATE PROCEDURE dbo.sp_user_log_login_attempt
    @username VARCHAR(50),
    @success BIT
AS
BEGIN
    SET NOCOUNT ON;
    IF @success = 0
    BEGIN
        UPDATE dbo.users
        SET [login_attempts] = [login_attempts] + 1,
            [lockout_until] = CASE WHEN [login_attempts] >= 5 THEN DATEADD(MINUTE, 15, GETDATE()) ELSE [lockout_until] END
        WHERE [username] = @username OR [email] = @username;
    END
    ELSE
    BEGIN
        UPDATE dbo.users
        SET [login_attempts] = 0, [lockout_until] = NULL, [last_login] = GETDATE()
        WHERE [username] = @username OR [email] = @username;
    END
END
GO
PRINT 'ATCA_User 数据库初始化完成';
GO


-- ============================================================
-- [2/10] 建筑内容模块数据库 (Architecture)
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Architecture')
BEGIN
    CREATE DATABASE [Architecture];
END
GO
USE [Architecture];
GO

-- ============================================
-- 1. 中国古代建筑基本信息表 (ancient_architecture)
-- ============================================
IF OBJECT_ID('dbo.ancient_architecture', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ancient_architecture (
        [architecture_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL,
        [chinese_name] NVARCHAR(100) NULL,
        [location] NVARCHAR(100) NULL,
        [coordinates] NVARCHAR(50) NULL,
        [type] NVARCHAR(50) NOT NULL,
        [founding_dynasty] NVARCHAR(50) NULL,
        [completed_dynasty] NVARCHAR(50) NULL,
        [protection_level] NVARCHAR(100) NULL,
        [brief_description] NVARCHAR(MAX) NULL,
        [full_description] NVARCHAR(MAX) NULL,
        [main_image_url] NVARCHAR(MAX) NULL,
        [structural_features] NVARCHAR(MAX) NULL,
        [historical_significance] NVARCHAR(MAX) NULL,
        [current_status] NVARCHAR(MAX) NULL,
        [tags] NVARCHAR(500) NULL,
        [image_gallery] NVARCHAR(MAX) NULL,
        [model_3d_url] NVARCHAR(MAX) NULL,
        [vr_panorama_url] NVARCHAR(MAX) NULL,
        [construction_date] NVARCHAR(50) NULL,
        [architect] NVARCHAR(100) NULL,
        [is_featured] BIT DEFAULT 0,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'structural_features' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [structural_features] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'historical_significance' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [historical_significance] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'current_status' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [current_status] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'tags' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [tags] NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'image_gallery' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [image_gallery] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'model_3d_url' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [model_3d_url] NVARCHAR(MAX) NULL;
END
ELSE
BEGIN
    ALTER TABLE [ancient_architecture] ALTER COLUMN [model_3d_url] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'vr_panorama_url' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [vr_panorama_url] NVARCHAR(MAX) NULL;
END
ELSE
BEGIN
    ALTER TABLE [ancient_architecture] ALTER COLUMN [vr_panorama_url] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'main_image_url' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [main_image_url] NVARCHAR(MAX) NULL;
END
ELSE
BEGIN
    ALTER TABLE [ancient_architecture] ALTER COLUMN [main_image_url] NVARCHAR(MAX) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'construction_date' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [construction_date] NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'architect' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [architect] NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'is_featured' AND object_id = OBJECT_ID('ancient_architecture'))
BEGIN
    ALTER TABLE [ancient_architecture] ADD [is_featured] BIT DEFAULT 0;
END
GO

-- ============================================
-- 2. 历史发展表 (historical_development)
-- ============================================
IF OBJECT_ID('dbo.historical_development', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.historical_development (
        [development_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [architecture_id] INT NOT NULL,
        [dynasty_period] NVARCHAR(50) NOT NULL,
        [start_year] INT NULL,
        [end_year] INT NULL,
        [development_title] NVARCHAR(100) NOT NULL,
        [development_content] NVARCHAR(MAX) NOT NULL,
        [architectural_changes] NVARCHAR(MAX) NULL,
        [historical_context] NVARCHAR(MAX) NULL,
        CONSTRAINT FK_historical_architecture FOREIGN KEY ([architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 3. 技术结构表 (technical_structure)
-- ============================================
IF OBJECT_ID('dbo.technical_structure', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.technical_structure (
        [structure_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [architecture_id] INT NOT NULL,
        [structure_name] NVARCHAR(100) NOT NULL,
        [technical_category] NVARCHAR(50) NOT NULL,
        [technical_description] NVARCHAR(MAX) NOT NULL,
        [technical_principles] NVARCHAR(MAX) NULL,
        [historical_value] NVARCHAR(MAX) NULL,
        [heritage_status] NVARCHAR(100) NULL,
        CONSTRAINT FK_technical_architecture FOREIGN KEY ([architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 4. 建筑特色表 (architectural_features)
-- ============================================
IF OBJECT_ID('dbo.architectural_features', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.architectural_features (
        [feature_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [architecture_id] INT NOT NULL,
        [feature_name] NVARCHAR(100) NOT NULL,
        [design_philosophy] NVARCHAR(100) NULL,
        [spatial_organization] NVARCHAR(MAX) NULL,
        [aesthetic_characteristics] NVARCHAR(MAX) NULL,
        [functional_aspects] NVARCHAR(MAX) NULL,
        CONSTRAINT FK_features_architecture FOREIGN KEY ([architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 5. 文化意义表 (cultural_significance)
-- ============================================
IF OBJECT_ID('dbo.cultural_significance', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.cultural_significance (
        [significance_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [architecture_id] INT NOT NULL,
        [significance_aspect] NVARCHAR(100) NOT NULL,
        [philosophical_basis] NVARCHAR(100) NULL,
        [cultural_interpretation] NVARCHAR(MAX) NOT NULL,
        [social_influence] NVARCHAR(MAX) NULL,
        [contemporary_value] NVARCHAR(MAX) NULL,
        CONSTRAINT FK_culture_architecture FOREIGN KEY ([architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 6. 专家观点表 (expert_quotes)
-- ============================================
IF OBJECT_ID('dbo.expert_quotes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.expert_quotes (
        [quote_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [architecture_id] INT NOT NULL,
        [expert_name] NVARCHAR(100) NOT NULL,
        [expert_title] NVARCHAR(100) NULL,
        [quote_content] NVARCHAR(MAX) NOT NULL,
        [source] NVARCHAR(200) NULL,
        CONSTRAINT FK_quotes_architecture FOREIGN KEY ([architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 7. 相关建筑关系表 (related_architectures)
-- ============================================
IF OBJECT_ID('dbo.related_architectures', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.related_architectures (
        [relation_id] INT IDENTITY(1,1) PRIMARY KEY,
        [primary_architecture_id] INT NOT NULL,
        [related_architecture_id] INT NOT NULL,
        [relation_type] NVARCHAR(50) NOT NULL,
        [relation_description] NVARCHAR(MAX) NULL,
        CONSTRAINT CK_no_self_reference CHECK ([primary_architecture_id] <> [related_architecture_id]),
        CONSTRAINT FK_related_primary FOREIGN KEY ([primary_architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE NO ACTION,
        CONSTRAINT FK_related_secondary FOREIGN KEY ([related_architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE NO ACTION
    );
END
GO

-- ============================================
-- 8. 朝代年代映射表 (dynasty_year_map)
-- ============================================
IF OBJECT_ID('dbo.dynasty_year_map', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.dynasty_year_map (
        [dynasty_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [dynasty_name] NVARCHAR(100) NOT NULL UNIQUE,
        [start_year] INT NOT NULL,
        [end_year] INT NOT NULL,
        [description] NVARCHAR(255) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================
-- 9. 建筑浏览记录表 (architecture_views)
-- ============================================
IF OBJECT_ID('dbo.architecture_views', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.architecture_views (
        [view_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NULL,
        [architecture_id] INT NOT NULL,
        [view_time] DATETIME DEFAULT GETDATE(),
        [ip_address] NVARCHAR(45) NULL,
        [device_info] NVARCHAR(100) NULL,
        [session_id] NVARCHAR(100) NULL,
        CONSTRAINT FK_views_architecture FOREIGN KEY ([architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 10. 建筑访问统计表 (architecture_daily_stats)
-- ============================================
IF OBJECT_ID('dbo.architecture_daily_stats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.architecture_daily_stats (
        [stat_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [architecture_id] INT NOT NULL,
        [stat_date] DATE NOT NULL,
        [view_count] INT DEFAULT 0,
        [favorite_count] INT DEFAULT 0,
        [search_count] INT DEFAULT 0,
        [last_updated] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_stats_architecture FOREIGN KEY ([architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE,
        CONSTRAINT UQ_architecture_daily_stats UNIQUE ([architecture_id], [stat_date])
    );
END
GO

-- ============================================
-- 11. 建筑风格映射表 (architecture_style_mappings)
-- ============================================
IF OBJECT_ID('dbo.architecture_style_mappings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.architecture_style_mappings (
        [mapping_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [architecture_id] INT NOT NULL,
        [style_name] NVARCHAR(100) NOT NULL,
        [style_description] NVARCHAR(500) NULL,
        [period] NVARCHAR(100) NULL,
        [region] NVARCHAR(100) NULL,
        [characteristics] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_styles_architecture FOREIGN KEY ([architecture_id])
           REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 12. 建筑热度统计表 (architecture_popularity)
-- ============================================
IF OBJECT_ID('dbo.architecture_popularity', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.architecture_popularity (
        [popularity_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [architecture_id] INT NOT NULL,
        [total_views] INT DEFAULT 0,
        [total_favorites] INT DEFAULT 0,
        [total_searches] INT DEFAULT 0,
        [last_updated] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_popularity_architecture FOREIGN KEY ([architecture_id])
        REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 13. 热门搜索词汇总表 (popular_search_terms)
-- ============================================
IF OBJECT_ID('dbo.popular_search_terms', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.popular_search_terms (
        [term_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [term] NVARCHAR(100) NOT NULL UNIQUE,
        [search_count] INT DEFAULT 1,
        [last_searched] DATETIME DEFAULT GETDATE(),
        [category] NVARCHAR(20) NULL,
        CONSTRAINT CK_search_category CHECK ([category] IN ('dynasty', 'type', 'location', 'feature', 'general'))
    );
END
GO

-- ============================================
-- 14. 翻译主表 (translations)
-- ============================================
IF OBJECT_ID('dbo.translations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translations (
        [translation_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [entity_type] NVARCHAR(50) NOT NULL,
        [entity_id] INT NOT NULL,
        [field_name] NVARCHAR(50) NOT NULL,
        [language_code] NVARCHAR(10) NOT NULL,
        [source_text] NVARCHAR(MAX) NOT NULL,
        [translated_text] NVARCHAR(MAX) NOT NULL,
        [is_machine_translated] BIT DEFAULT 1,
        [review_status] NVARCHAR(20) DEFAULT 'pending',
        [quality_score] INT NULL,
        [review_notes] NVARCHAR(MAX) NULL,
        [reviewed_by] INT NULL,
        [reviewed_at] DATETIME NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_translations UNIQUE ([entity_type], [entity_id], [field_name], [language_code])
    );
END
GO

IF OBJECT_ID('dbo.translations', 'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'source_text' AND object_id = OBJECT_ID('dbo.translations'))
        ALTER TABLE dbo.translations ADD [source_text] NVARCHAR(MAX) NOT NULL DEFAULT '';
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'review_status' AND object_id = OBJECT_ID('dbo.translations'))
        ALTER TABLE dbo.translations ADD [review_status] NVARCHAR(20) DEFAULT 'pending';
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'quality_score' AND object_id = OBJECT_ID('dbo.translations'))
        ALTER TABLE dbo.translations ADD [quality_score] INT NULL;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'review_notes' AND object_id = OBJECT_ID('dbo.translations'))
        ALTER TABLE dbo.translations ADD [review_notes] NVARCHAR(MAX) NULL;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.translations') AND name = 'review_status')
    BEGIN
        ALTER TABLE dbo.translations ADD [review_status] NVARCHAR(20) DEFAULT 'pending';
        ALTER TABLE dbo.translations ADD CONSTRAINT CHK_trans_review_status CHECK ([review_status] IN ('pending', 'approved', 'rejected'));
    END
END
GO

-- ============================================
-- 15. 翻译版本表 (translation_versions)
-- ============================================
IF OBJECT_ID('dbo.translation_versions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_versions (
        [version_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [translation_id] INT NOT NULL,
        [version_number] INT NOT NULL,
        [translated_text] NVARCHAR(MAX) NOT NULL,
        [is_machine_translated] BIT DEFAULT 1,
        [review_status] NVARCHAR(20) DEFAULT 'pending',
        [quality_score] INT NULL,
        [review_notes] NVARCHAR(MAX) NULL,
        [reviewed_by] INT NULL,
        [reviewed_at] DATETIME NULL,
        [edited_by] INT NULL,
        [edit_reason] NVARCHAR(200) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_translation_versions_translation FOREIGN KEY ([translation_id]) REFERENCES dbo.translations([translation_id]) ON DELETE CASCADE,
        CONSTRAINT UQ_translation_versions UNIQUE ([translation_id], [version_number])
    );
END
GO

-- ============================================
-- 16. 翻译审核记录表 (translation_reviews)
-- ============================================
IF OBJECT_ID('dbo.translation_reviews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_reviews (
        [review_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [translation_id] INT NOT NULL,
        [reviewer_id] INT NOT NULL,
        [review_status] NVARCHAR(20) NOT NULL,
        [review_notes] NVARCHAR(500) NULL,
        [quality_score] INT NULL,
        [reviewed_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_translation_reviews_translation FOREIGN KEY ([translation_id]) REFERENCES dbo.translations([translation_id]),
        CONSTRAINT CHK_review_status CHECK ([review_status] IN ('pending', 'approved', 'rejected'))
    );
END
GO

-- ============================================
-- 17. 翻译记忆库表 (translation_memory)
-- ============================================
IF OBJECT_ID('dbo.translation_memory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_memory (
        [memory_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [source_text_hash] NVARCHAR(64) NULL,
        [source_text] NVARCHAR(MAX) NOT NULL,
        [target_text] NVARCHAR(MAX) NOT NULL,
        [source_language] NVARCHAR(10) NOT NULL,
        [target_language] NVARCHAR(10) NOT NULL,
        [entity_type] NVARCHAR(50) NULL,
        [context] NVARCHAR(200) NULL,
        [usage_count] INT DEFAULT 1,
        [last_used_at] DATETIME DEFAULT GETDATE(),
        [quality_score] INT DEFAULT 80,
        [created_at] DATETIME DEFAULT GETDATE(),
        -- 移除 UQ_translation_memory，因为 source_text 是 NVARCHAR(MAX) 不能作为索引键列
        CONSTRAINT UQ_translation_memory_hash UNIQUE ([source_text_hash], [target_language])
    );
END
GO

-- ============================================
-- 18. 翻译统计信息表 (translation_stats)
-- ============================================
IF OBJECT_ID('dbo.translation_stats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_stats (
        [stat_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [entity_type] NVARCHAR(50) NOT NULL,
        [language_code] NVARCHAR(10) NOT NULL,
        [total_count] INT DEFAULT 0,
        [pending_count] INT DEFAULT 0,
        [approved_count] INT DEFAULT 0,
        [rejected_count] INT DEFAULT 0,
        [machine_translated_count] INT DEFAULT 0,
        [human_translated_count] INT DEFAULT 0,
        [average_quality_score] DECIMAL(5,2) NULL,
        [last_update] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_translation_stats UNIQUE ([entity_type], [language_code])
    );
END
GO

-- ============================================
-- 19. 语言配置表 (supported_languages)
-- ============================================
IF OBJECT_ID('dbo.supported_languages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.supported_languages (
        [language_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [language_code] NVARCHAR(10) NOT NULL UNIQUE,
        [language_name] NVARCHAR(50) NOT NULL,
        [native_name] NVARCHAR(50) NOT NULL,
        [is_active] BIT DEFAULT 1,
        [is_default] BIT DEFAULT 0,
        [sort_order] INT DEFAULT 0,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================
-- 20. 创建索引
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_type' AND object_id = OBJECT_ID('dbo.ancient_architecture'))
    CREATE INDEX [idx_type] ON dbo.ancient_architecture([type]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_founding_dynasty' AND object_id = OBJECT_ID('dbo.ancient_architecture'))
    CREATE INDEX [idx_founding_dynasty] ON dbo.ancient_architecture([founding_dynasty]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_location' AND object_id = OBJECT_ID('dbo.ancient_architecture'))
    CREATE INDEX [idx_location] ON dbo.ancient_architecture([location]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_historical_period' AND object_id = OBJECT_ID('dbo.historical_development'))
    CREATE INDEX [idx_historical_period] ON dbo.historical_development([dynasty_period]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_technical_category' AND object_id = OBJECT_ID('dbo.technical_structure'))
    CREATE INDEX [idx_technical_category] ON dbo.technical_structure([technical_category]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_design_philosophy' AND object_id = OBJECT_ID('dbo.architectural_features'))
    CREATE INDEX [idx_design_philosophy] ON dbo.architectural_features([design_philosophy]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_cultural_aspect' AND object_id = OBJECT_ID('dbo.cultural_significance'))
    CREATE INDEX [idx_cultural_aspect] ON dbo.cultural_significance([significance_aspect]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_relation_type' AND object_id = OBJECT_ID('dbo.related_architectures'))
    CREATE INDEX [idx_relation_type] ON dbo.related_architectures([relation_type]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_views_architecture' AND object_id = OBJECT_ID('dbo.architecture_views'))
    CREATE INDEX [idx_views_architecture] ON dbo.architecture_views([architecture_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_views_time' AND object_id = OBJECT_ID('dbo.architecture_views'))
    CREATE INDEX [idx_views_time] ON dbo.architecture_views([view_time]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_stats_date' AND object_id = OBJECT_ID('dbo.architecture_daily_stats'))
    CREATE INDEX [idx_stats_date] ON dbo.architecture_daily_stats([stat_date]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_search_count' AND object_id = OBJECT_ID('dbo.popular_search_terms'))
    CREATE INDEX [idx_search_count] ON dbo.popular_search_terms([search_count] DESC);

-- 翻译相关索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_entity' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE NONCLUSTERED INDEX [idx_translations_entity] ON dbo.translations([entity_type], [entity_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_language' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE NONCLUSTERED INDEX [idx_translations_language] ON dbo.translations([language_code]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_status' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE NONCLUSTERED INDEX [idx_translations_status] ON dbo.translations([review_status]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_lang' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE INDEX [idx_translations_lang] ON dbo.translations([language_code]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tv_translation' AND object_id = OBJECT_ID('dbo.translation_versions'))
    CREATE INDEX [idx_tv_translation] ON dbo.translation_versions([translation_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_versions_tid' AND object_id = OBJECT_ID('dbo.translation_versions'))
    CREATE INDEX [idx_translation_versions_tid] ON dbo.translation_versions([translation_id]);

-- 修复：移除 idx_tm_source 索引，因为 source_text 是 NVARCHAR(MAX) 不能作为索引键列
-- 使用 source_text_hash 索引代替
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_memory_hash' AND object_id = OBJECT_ID('dbo.translation_memory'))
    CREATE INDEX [idx_translation_memory_hash] ON dbo.translation_memory([source_text_hash]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_memory_lang' AND object_id = OBJECT_ID('dbo.translation_memory'))
    CREATE INDEX [idx_translation_memory_lang] ON dbo.translation_memory([source_language], [target_language]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_memory_source' AND object_id = OBJECT_ID('dbo.translation_memory'))
    CREATE NONCLUSTERED INDEX [idx_translation_memory_source] ON dbo.translation_memory([source_language], [target_language]);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_stats_entity' AND object_id = OBJECT_ID('dbo.translation_stats'))
    CREATE NONCLUSTERED INDEX [idx_translation_stats_entity] ON dbo.translation_stats([entity_type]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_reviews_status' AND object_id = OBJECT_ID('dbo.translation_reviews'))
    CREATE INDEX [idx_translation_reviews_status] ON dbo.translation_reviews([review_status]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_reviews_tid' AND object_id = OBJECT_ID('dbo.translation_reviews'))
    CREATE INDEX [idx_translation_reviews_tid] ON dbo.translation_reviews([translation_id]);
GO

-- ============================================
-- 21. 删除相关建筑级联触发器
-- ============================================
IF OBJECT_ID('dbo.trg_delete_related_architectures', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_delete_related_architectures;
GO

CREATE TRIGGER dbo.trg_delete_related_architectures
ON dbo.ancient_architecture
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.related_architectures
    WHERE [primary_architecture_id] IN (SELECT [architecture_id] FROM deleted)
       OR [related_architecture_id] IN (SELECT [architecture_id] FROM deleted);
    DELETE FROM dbo.ancient_architecture
    WHERE [architecture_id] IN (SELECT [architecture_id] FROM deleted);
END
GO

-- ============================================
-- 22. 更新时间触发器
-- ============================================
IF OBJECT_ID('dbo.trg_update_timestamp', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_update_timestamp;
GO

CREATE TRIGGER dbo.trg_update_timestamp
ON dbo.ancient_architecture
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.ancient_architecture
    SET [updated_at] = GETDATE()
    FROM dbo.ancient_architecture a
    INNER JOIN inserted i ON a.[architecture_id] = i.[architecture_id];
END
GO

-- ============================================
-- 23. 翻译更新时间触发器
-- ============================================
IF OBJECT_ID('tr_translations_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_translations_updated_at;
GO

CREATE TRIGGER tr_translations_updated_at
ON dbo.translations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.translations
    SET [updated_at] = GETDATE()
    FROM dbo.translations t
    INNER JOIN inserted i ON t.[translation_id] = i.[translation_id];
END
GO

-- ============================================
-- 24. 热门建筑视图
-- ============================================
IF OBJECT_ID('dbo.vw_popular_architectures', 'V') IS NOT NULL
    DROP VIEW dbo.vw_popular_architectures;
GO

CREATE VIEW dbo.vw_popular_architectures AS
SELECT
    a.architecture_id AS id,
    a.name,
    a.chinese_name,
    a.type,
    a.founding_dynasty AS dynasty,
    a.location AS region,
    a.brief_description AS description,
    a.main_image_url AS image,
    a.protection_level,
    ISNULL(pop.total_views, 0) AS view_count,
    ISNULL(pop.total_favorites, 0) AS favorite_count,
    (ISNULL(pop.total_views, 0) * 0.7 + ISNULL(pop.total_favorites, 0) * 0.3) AS popularity_score
FROM dbo.ancient_architecture a
LEFT JOIN dbo.architecture_popularity pop ON a.architecture_id = pop.architecture_id;
GO

-- ============================================
-- 25. 初始化朝代数据（幂等插入）
-- ============================================
MERGE INTO dbo.dynasty_year_map AS target
USING (VALUES
    (N'先秦', -2070, -221, '夏商周时期'),
    (N'秦汉', -221, 220, '秦朝、西汉、东汉'),
    (N'魏晋南北朝', 220, 589, '三国、两晋、南北朝'),
    (N'隋唐', 581, 907, '隋朝、唐朝'),
    (N'宋', 960, 1279, '北宋、南宋'),
    (N'元', 1271, 1368, '元朝'),
    (N'明', 1368, 1644, '明朝'),
    (N'清', 1644, 1912, '清朝'),
    (N'民国', 1912, 1949, '中华民国'),
    (N'现代', 1949, 2025, '中华人民共和国')
) AS source ([dynasty_name], [start_year], [end_year], [description])
ON target.[dynasty_name] = source.[dynasty_name]
WHEN NOT MATCHED THEN
    INSERT ([dynasty_name], [start_year], [end_year], [description])
    VALUES (source.[dynasty_name], source.[start_year], source.[end_year], source.[description]);
GO

-- ============================================
-- 26. 初始化语言数据（幂等插入）
-- ============================================
IF NOT EXISTS (SELECT 1 FROM dbo.supported_languages WHERE [language_code] = 'zh-CN')
    INSERT INTO dbo.supported_languages ([language_code], [language_name], [native_name], [is_default], [sort_order])
    VALUES ('zh-CN', N'Chinese (Simplified)', N'简体中文', 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.supported_languages WHERE [language_code] = 'en')
    INSERT INTO dbo.supported_languages ([language_code], [language_name], [native_name], [is_default], [sort_order])
    VALUES ('en', N'English', N'English', 0, 2);
IF NOT EXISTS (SELECT 1 FROM dbo.supported_languages WHERE [language_code] = 'ja')
    INSERT INTO dbo.supported_languages ([language_code], [language_name], [native_name], [is_default], [sort_order])
    VALUES ('ja', N'Japanese', N'日本語', 0, 3);
GO

-- ============================================
-- 27. 建筑管理存储过程
-- ============================================
-- 获取建筑列表
IF OBJECT_ID('dbo.sp_architecture_get_list', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_get_list;
GO
CREATE PROCEDURE dbo.sp_architecture_get_list
    @type NVARCHAR(50) = NULL,
    @dynasty NVARCHAR(50) = NULL,
    @location NVARCHAR(100) = NULL,
    @page INT = 1,
    @page_size INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;
    SELECT [architecture_id], [name], [chinese_name], [type], [founding_dynasty],
           [location], [protection_level], [brief_description], [main_image_url], [created_at]
    FROM dbo.ancient_architecture
    WHERE (@type IS NULL OR [type] = @type)
      AND (@dynasty IS NULL OR [founding_dynasty] = @dynasty)
      AND (@location IS NULL OR [location] LIKE '%' + @location + '%')
    ORDER BY [created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
END
GO

-- 获取建筑详情
IF OBJECT_ID('dbo.sp_architecture_get_detail', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_get_detail;
GO
CREATE PROCEDURE dbo.sp_architecture_get_detail
    @architecture_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.ancient_architecture WHERE [architecture_id] = @architecture_id;
END
GO

-- 添加建筑
IF OBJECT_ID('dbo.sp_architecture_add', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_add;
GO
CREATE PROCEDURE dbo.sp_architecture_add
    @name NVARCHAR(100),
    @chinese_name NVARCHAR(100) = NULL,
    @location NVARCHAR(100) = NULL,
    @coordinates NVARCHAR(50) = NULL,
    @type NVARCHAR(50),
    @founding_dynasty NVARCHAR(50) = NULL,
    @completed_dynasty NVARCHAR(50) = NULL,
    @protection_level NVARCHAR(100) = NULL,
    @brief_description NVARCHAR(MAX) = NULL,
    @full_description NVARCHAR(MAX) = NULL,
    @main_image_url NVARCHAR(MAX) = NULL,
    @structural_features NVARCHAR(MAX) = NULL,
    @historical_significance NVARCHAR(MAX) = NULL,
    @current_status NVARCHAR(MAX) = NULL,
    @tags NVARCHAR(500) = NULL,
    @image_gallery NVARCHAR(MAX) = NULL,
    @model_3d_url NVARCHAR(MAX) = NULL,
    @vr_panorama_url NVARCHAR(MAX) = NULL,
    @construction_date NVARCHAR(50) = NULL,
    @architect NVARCHAR(100) = NULL,
    @is_featured BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.ancient_architecture ([name], [chinese_name], [location], [coordinates], [type],
        [founding_dynasty], [completed_dynasty], [protection_level], [brief_description],
        [full_description], [main_image_url], [structural_features], [historical_significance],
        [current_status], [tags], [image_gallery], [model_3d_url], [vr_panorama_url],
        [construction_date], [architect], [is_featured])
    VALUES (@name, @chinese_name, @location, @coordinates, @type,
        @founding_dynasty, @completed_dynasty, @protection_level, @brief_description,
        @full_description, @main_image_url, @structural_features, @historical_significance,
        @current_status, @tags, @image_gallery, @model_3d_url, @vr_panorama_url,
        @construction_date, @architect, @is_featured);
    SELECT SCOPE_IDENTITY() AS [architecture_id];
END
GO

-- 更新建筑
IF OBJECT_ID('dbo.sp_architecture_update', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_update;
GO
CREATE PROCEDURE dbo.sp_architecture_update
    @architecture_id INT,
    @name NVARCHAR(100) = NULL,
    @chinese_name NVARCHAR(100) = NULL,
    @location NVARCHAR(100) = NULL,
    @coordinates NVARCHAR(50) = NULL,
    @type NVARCHAR(50) = NULL,
    @founding_dynasty NVARCHAR(50) = NULL,
    @completed_dynasty NVARCHAR(50) = NULL,
    @protection_level NVARCHAR(100) = NULL,
    @brief_description NVARCHAR(MAX) = NULL,
    @full_description NVARCHAR(MAX) = NULL,
    @main_image_url NVARCHAR(MAX) = NULL,
    @structural_features NVARCHAR(MAX) = NULL,
    @historical_significance NVARCHAR(MAX) = NULL,
    @current_status NVARCHAR(MAX) = NULL,
    @tags NVARCHAR(500) = NULL,
    @image_gallery NVARCHAR(MAX) = NULL,
    @model_3d_url NVARCHAR(MAX) = NULL,
    @vr_panorama_url NVARCHAR(MAX) = NULL,
    @construction_date NVARCHAR(50) = NULL,
    @architect NVARCHAR(100) = NULL,
    @is_featured BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.ancient_architecture
    SET [name] = COALESCE(@name, [name]),
        [chinese_name] = COALESCE(@chinese_name, [chinese_name]),
        [location] = COALESCE(@location, [location]),
        [coordinates] = COALESCE(@coordinates, [coordinates]),
        [type] = COALESCE(@type, [type]),
        [founding_dynasty] = COALESCE(@founding_dynasty, [founding_dynasty]),
        [completed_dynasty] = COALESCE(@completed_dynasty, [completed_dynasty]),
        [protection_level] = COALESCE(@protection_level, [protection_level]),
        [brief_description] = COALESCE(@brief_description, [brief_description]),
        [full_description] = COALESCE(@full_description, [full_description]),
        [main_image_url] = COALESCE(@main_image_url, [main_image_url]),
        [structural_features] = COALESCE(@structural_features, [structural_features]),
        [historical_significance] = COALESCE(@historical_significance, [historical_significance]),
        [current_status] = COALESCE(@current_status, [current_status]),
        [tags] = COALESCE(@tags, [tags]),
        [image_gallery] = COALESCE(@image_gallery, [image_gallery]),
        [model_3d_url] = COALESCE(@model_3d_url, [model_3d_url]),
        [vr_panorama_url] = COALESCE(@vr_panorama_url, [vr_panorama_url]),
        [construction_date] = COALESCE(@construction_date, [construction_date]),
        [architect] = COALESCE(@architect, [architect]),
        [is_featured] = COALESCE(@is_featured, [is_featured])
    WHERE [architecture_id] = @architecture_id;
END
GO

-- 删除建筑
IF OBJECT_ID('dbo.sp_architecture_delete', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_delete;
GO
CREATE PROCEDURE dbo.sp_architecture_delete
    @architecture_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.ancient_architecture WHERE [architecture_id] = @architecture_id;
    SELECT @@ROWCOUNT AS [deleted];
END
GO

-- 搜索建筑
IF OBJECT_ID('dbo.sp_architecture_search', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_search;
GO
CREATE PROCEDURE dbo.sp_architecture_search
    @keyword NVARCHAR(200),
    @page INT = 1,
    @page_size INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;
    SELECT [architecture_id], [name], [chinese_name], [type], [founding_dynasty],
           [location], [protection_level], [brief_description], [main_image_url]
    FROM dbo.ancient_architecture
    WHERE [name] LIKE '%' + @keyword + '%' OR [chinese_name] LIKE '%' + @keyword + '%'
      OR [brief_description] LIKE '%' + @keyword + '%' OR [location] LIKE '%' + @keyword + '%'
    ORDER BY [name]
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
END
GO

-- 记录浏览
IF OBJECT_ID('dbo.sp_architecture_log_view', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_log_view;
GO
CREATE PROCEDURE dbo.sp_architecture_log_view
    @architecture_id INT,
    @user_id INT = NULL,
    @ip_address NVARCHAR(45) = NULL,
    @device_info NVARCHAR(100) = NULL,
    @session_id NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.architecture_views ([user_id], [architecture_id], [ip_address], [device_info], [session_id])
    VALUES (@user_id, @architecture_id, @ip_address, @device_info, @session_id);
    UPDATE dbo.architecture_popularity
    SET [total_views] = [total_views] + 1, [last_updated] = GETDATE()
    WHERE [architecture_id] = @architecture_id;
    IF @@ROWCOUNT = 0
    BEGIN
        INSERT INTO dbo.architecture_popularity ([architecture_id], [total_views])
        VALUES (@architecture_id, 1);
    END
END
GO

-- 获取热门建筑
IF OBJECT_ID('dbo.sp_architecture_get_popular', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_get_popular;
GO
CREATE PROCEDURE dbo.sp_architecture_get_popular
    @limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit) * FROM dbo.vw_popular_architectures ORDER BY [popularity_score] DESC;
END
GO

-- 更新热门搜索词
IF OBJECT_ID('dbo.sp_architecture_update_search_term', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_update_search_term;
GO
CREATE PROCEDURE dbo.sp_architecture_update_search_term
    @term NVARCHAR(100),
    @category NVARCHAR(20) = 'general'
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.popular_search_terms WHERE [term] = @term)
    BEGIN
        UPDATE dbo.popular_search_terms
        SET [search_count] = [search_count] + 1, [last_searched] = GETDATE(), [category] = @category
        WHERE [term] = @term;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.popular_search_terms ([term], [category]) VALUES (@term, @category);
    END
END
GO

-- 获取热门搜索词
IF OBJECT_ID('dbo.sp_architecture_get_search_terms', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_get_search_terms;
GO
CREATE PROCEDURE dbo.sp_architecture_get_search_terms
    @limit INT = 10,
    @category NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit) [term], [search_count], [last_searched], [category]
    FROM dbo.popular_search_terms
    WHERE (@category IS NULL OR [category] = @category)
    ORDER BY [search_count] DESC;
END
GO

-- 获取建筑统计
IF OBJECT_ID('dbo.sp_architecture_get_stats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_architecture_get_stats;
GO
CREATE PROCEDURE dbo.sp_architecture_get_stats
    @architecture_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.architecture_popularity WHERE [architecture_id] = @architecture_id;
END
GO

-- ============================================
-- 28. 翻译管理存储过程
-- ============================================
-- 获取实体翻译
IF OBJECT_ID('dbo.sp_get_translation', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_translation;
GO
CREATE PROCEDURE dbo.sp_get_translation
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @language_code NVARCHAR(10) = 'en'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT t.[field_name], t.[translated_text], t.[is_machine_translated]
    FROM dbo.translations t
    WHERE t.[entity_type] = @entity_type
      AND t.[entity_id] = @entity_id
      AND t.[language_code] = @language_code;
END
GO

-- 获取实体所有翻译
IF OBJECT_ID('dbo.sp_translation_get_by_entity', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_get_by_entity;
GO
CREATE PROCEDURE dbo.sp_translation_get_by_entity
    @entity_type NVARCHAR(50),
    @entity_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [translation_id], [entity_type], [entity_id], [field_name], [language_code], 
           [source_text], [translated_text], [is_machine_translated], [review_status], 
           [quality_score], [reviewed_by], [reviewed_at], [created_at], [updated_at]
    FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [entity_id] = @entity_id
    ORDER BY [language_code], [field_name];
END
GO

-- 批量获取翻译（用于列表页）
IF OBJECT_ID('dbo.sp_get_translations_batch', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_translations_batch;
GO
CREATE PROCEDURE dbo.sp_get_translations_batch
    @entity_type NVARCHAR(50),
    @entity_ids NVARCHAR(MAX),
    @language_code NVARCHAR(10) = 'en'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idTable TABLE (id INT);
    INSERT INTO @idTable
    SELECT value FROM OPENJSON(@entity_ids);
    SELECT t.[entity_id], t.[field_name], t.[translated_text], t.[is_machine_translated]
    FROM dbo.translations t
    INNER JOIN @idTable ids ON t.[entity_id] = ids.id
    WHERE t.[entity_type] = @entity_type
      AND t.[language_code] = @language_code;
END
GO

-- 批量获取翻译
IF OBJECT_ID('dbo.sp_translation_batch_get', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_batch_get;
GO
CREATE PROCEDURE dbo.sp_translation_batch_get
    @entity_type NVARCHAR(50),
    @language_code NVARCHAR(10) = 'en'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [entity_id], [field_name], [translated_text], [review_status], [is_machine_translated]
    FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [language_code] = @language_code
    ORDER BY [entity_id], [field_name];
END
GO

-- 保存/更新翻译
IF OBJECT_ID('dbo.sp_upsert_translation', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_upsert_translation;
GO
CREATE PROCEDURE dbo.sp_upsert_translation
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @field_name NVARCHAR(50),
    @language_code NVARCHAR(10),
    @translated_text NVARCHAR(MAX),
    @is_machine_translated BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM dbo.translations
        WHERE [entity_type] = @entity_type
          AND [entity_id] = @entity_id
          AND [field_name] = @field_name
          AND [language_code] = @language_code
    )
    BEGIN
        UPDATE dbo.translations
        SET [translated_text] = @translated_text,
            [is_machine_translated] = @is_machine_translated,
            [updated_at] = GETDATE()
        WHERE [entity_type] = @entity_type
          AND [entity_id] = @entity_id
          AND [field_name] = @field_name
          AND [language_code] = @language_code;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.translations ([entity_type], [entity_id], [field_name], [language_code], [translated_text], [is_machine_translated])
        VALUES (@entity_type, @entity_id, @field_name, @language_code, @translated_text, @is_machine_translated);
    END
END
GO

-- 添加/更新翻译（带版本控制）
IF OBJECT_ID('dbo.sp_translation_upsert', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_upsert;
GO
CREATE PROCEDURE dbo.sp_translation_upsert
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @field_name NVARCHAR(50),
    @language_code NVARCHAR(10),
    @source_text NVARCHAR(MAX),
    @translated_text NVARCHAR(MAX),
    @is_machine_translated BIT = 1,
    @review_status NVARCHAR(20) = 'pending'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @existing_id INT;
    DECLARE @version_number INT;
    SELECT @existing_id = [translation_id]
    FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [entity_id] = @entity_id 
      AND [field_name] = @field_name AND [language_code] = @language_code;
    IF @existing_id IS NOT NULL
    BEGIN
        SELECT @version_number = COALESCE(MAX([version_number]), 0) + 1
        FROM dbo.translation_versions
        WHERE [translation_id] = @existing_id;
        INSERT INTO dbo.translation_versions ([translation_id], [version_number], [translated_text], 
            [is_machine_translated], [review_status])
        SELECT @existing_id, @version_number, [translated_text], [is_machine_translated], [review_status]
        FROM dbo.translations
        WHERE [translation_id] = @existing_id;
        UPDATE dbo.translations
        SET [translated_text] = @translated_text, [is_machine_translated] = @is_machine_translated,
            [review_status] = @review_status, [source_text] = @source_text
        WHERE [translation_id] = @existing_id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.translations ([entity_type], [entity_id], [field_name], [language_code], 
            [source_text], [translated_text], [is_machine_translated], [review_status])
        VALUES (@entity_type, @entity_id, @field_name, @language_code, 
            @source_text, @translated_text, @is_machine_translated, @review_status);
    END
END
GO

-- 获取支持的语言列表
IF OBJECT_ID('dbo.sp_get_languages', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_languages;
GO
CREATE PROCEDURE dbo.sp_get_languages
    @active_only BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [language_code], [language_name], [native_name], [is_active], [is_default], [sort_order]
    FROM dbo.supported_languages
    WHERE (@active_only = 0 OR [is_active] = 1)
    ORDER BY [sort_order];
END
GO

-- 获取翻译统计
IF OBJECT_ID('dbo.sp_get_translation_stats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_translation_stats;
GO
CREATE PROCEDURE dbo.sp_get_translation_stats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(*) AS total_translations,
        SUM(CASE WHEN review_status = 'pending' THEN 1 ELSE 0 END) AS pending_reviews,
        SUM(CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END) AS approved_translations,
        SUM(CASE WHEN review_status = 'rejected' THEN 1 ELSE 0 END) AS rejected_translations,
        SUM(CASE WHEN is_machine_translated = 1 THEN 1 ELSE 0 END) AS machine_translations,
        SUM(CASE WHEN is_machine_translated = 0 THEN 1 ELSE 0 END) AS human_translations,
        (SELECT COUNT(*) FROM dbo.translation_memory) AS memory_entries,
        (SELECT COUNT(DISTINCT entity_type) FROM dbo.translations) AS entity_types,
        (SELECT COUNT(*) FROM dbo.supported_languages WHERE is_active = 1) AS languages
    FROM dbo.translations;
END
GO

-- 获取翻译统计（扩展）
IF OBJECT_ID('dbo.sp_translation_stats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_stats;
GO
CREATE PROCEDURE dbo.sp_translation_stats
    @entity_type NVARCHAR(50) = NULL,
    @language_code NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        [entity_type],
        [language_code],
        COUNT(*) AS total_count,
        SUM(CASE WHEN [review_status] = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN [review_status] = 'approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN [review_status] = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN [is_machine_translated] = 1 THEN 1 ELSE 0 END) AS machine_translated_count,
        SUM(CASE WHEN [is_machine_translated] = 0 THEN 1 ELSE 0 END) AS human_translated_count,
        AVG(CAST([quality_score] AS DECIMAL(5,2))) AS average_quality_score
    FROM dbo.translations
    WHERE (@entity_type IS NULL OR [entity_type] = @entity_type)
      AND (@language_code IS NULL OR [language_code] = @language_code)
    GROUP BY [entity_type], [language_code];
END
GO

-- 搜索翻译（支持关键词搜索）
IF OBJECT_ID('dbo.sp_search_translations', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_search_translations;
GO
CREATE PROCEDURE dbo.sp_search_translations
    @search_text NVARCHAR(100) = NULL,
    @entity_type NVARCHAR(50) = NULL,
    @language_code NVARCHAR(10) = NULL,
    @review_status NVARCHAR(20) = NULL,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;
    
    SELECT 
        t.[translation_id], t.[entity_type], t.[entity_id], t.[field_name],
        t.[language_code], t.[source_text], t.[translated_text],
        t.[is_machine_translated], t.[review_status], t.[quality_score],
        t.[reviewed_by], t.[reviewed_at], t.[created_at], t.[updated_at],
        (SELECT COUNT(*) FROM dbo.translations WHERE 
            (@search_text IS NULL OR source_text LIKE '%' + @search_text + '%' OR translated_text LIKE '%' + @search_text + '%')
            AND (@entity_type IS NULL OR entity_type = @entity_type)
            AND (@language_code IS NULL OR language_code = @language_code)
            AND (@review_status IS NULL OR review_status = @review_status)
        ) AS total
    FROM dbo.translations t
    WHERE 
        (@search_text IS NULL OR t.source_text LIKE '%' + @search_text + '%' OR t.translated_text LIKE '%' + @search_text + '%')
        AND (@entity_type IS NULL OR t.entity_type = @entity_type)
        AND (@language_code IS NULL OR t.language_code = @language_code)
        AND (@review_status IS NULL OR t.review_status = @review_status)
    ORDER BY t.created_at DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- 搜索翻译
IF OBJECT_ID('dbo.sp_translation_search', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_search;
GO
CREATE PROCEDURE dbo.sp_translation_search
    @keyword NVARCHAR(200),
    @language_code NVARCHAR(10) = NULL,
    @review_status NVARCHAR(20) = NULL,
    @entity_type NVARCHAR(50) = NULL,
    @page INT = 1,
    @page_size INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;
    SELECT [translation_id], [entity_type], [entity_id], [field_name], [language_code],
           [source_text], [translated_text], [is_machine_translated], [review_status],
           [quality_score], [reviewed_by], [reviewed_at], [created_at], [updated_at]
    FROM dbo.translations
    WHERE ([source_text] LIKE '%' + @keyword + '%' OR [translated_text] LIKE '%' + @keyword + '%')
      AND (@language_code IS NULL OR [language_code] = @language_code)
      AND (@review_status IS NULL OR [review_status] = @review_status)
      AND (@entity_type IS NULL OR [entity_type] = @entity_type)
    ORDER BY [created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
END
GO

-- 删除翻译
IF OBJECT_ID('dbo.sp_delete_translation', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_delete_translation;
GO
CREATE PROCEDURE dbo.sp_delete_translation
    @translation_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.translations
    WHERE translation_id = @translation_id;
    SELECT @@ROWCOUNT AS deleted_count;
END
GO

-- 删除翻译（级联删除版本和审核记录）
IF OBJECT_ID('dbo.sp_translation_delete', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_delete;
GO
CREATE PROCEDURE dbo.sp_translation_delete
    @translation_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.translations WHERE [translation_id] = @translation_id;
    SELECT @@ROWCOUNT AS deleted;
END
GO

-- 删除实体的所有翻译
IF OBJECT_ID('dbo.sp_translation_delete_by_entity', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_delete_by_entity;
GO
CREATE PROCEDURE dbo.sp_translation_delete_by_entity
    @entity_type NVARCHAR(50),
    @entity_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [entity_id] = @entity_id;
    SELECT @@ROWCOUNT AS deleted;
END
GO

-- 批量删除翻译
IF OBJECT_ID('dbo.sp_batch_delete_translations', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_batch_delete_translations;
GO
CREATE PROCEDURE dbo.sp_batch_delete_translations
    @translation_ids NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idTable TABLE (id INT);
    INSERT INTO @idTable
    SELECT value FROM OPENJSON(@translation_ids);
    
    DELETE FROM dbo.translations
    WHERE translation_id IN (SELECT id FROM @idTable);
    SELECT @@ROWCOUNT AS deleted_count;
END
GO

-- 提交翻译审核
IF OBJECT_ID('dbo.sp_submit_translation_review', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_submit_translation_review;
GO
CREATE PROCEDURE dbo.sp_submit_translation_review
    @translation_id INT,
    @reviewer_id INT,
    @review_status NVARCHAR(20),
    @review_notes NVARCHAR(MAX) = NULL,
    @quality_score INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO dbo.translation_reviews (
        [translation_id], [reviewer_id], [review_status], [review_notes], [quality_score]
    )
    VALUES (
        @translation_id, @reviewer_id, @review_status, @review_notes, @quality_score
    );
    
    UPDATE dbo.translations
    SET 
        [review_status] = @review_status,
        [quality_score] = @quality_score,
        [reviewed_by] = @reviewer_id,
        [reviewed_at] = GETDATE(),
        [is_machine_translated] = 0
    WHERE [translation_id] = @translation_id;
    
    SELECT SCOPE_IDENTITY() AS [review_id];
END
GO

-- 审核翻译
IF OBJECT_ID('dbo.sp_translation_review', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_review;
GO
CREATE PROCEDURE dbo.sp_translation_review
    @translation_id INT,
    @reviewer_id INT,
    @review_status NVARCHAR(20),
    @review_notes NVARCHAR(500) = NULL,
    @quality_score INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.translation_reviews ([translation_id], [reviewer_id], [review_status], [review_notes], [quality_score])
    VALUES (@translation_id, @reviewer_id, @review_status, @review_notes, @quality_score);
    UPDATE dbo.translations
    SET [review_status] = @review_status, [review_notes] = @review_notes,
        [quality_score] = @quality_score, [reviewed_by] = @reviewer_id, [reviewed_at] = GETDATE()
    WHERE [translation_id] = @translation_id;
END
GO

-- 查询待审核翻译列表
IF OBJECT_ID('dbo.sp_get_pending_reviews', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_pending_reviews;
GO
CREATE PROCEDURE dbo.sp_get_pending_reviews
    @entity_type NVARCHAR(50) = NULL,
    @language_code NVARCHAR(10) = NULL,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @offset INT = (@page - 1) * @limit;
    
    SELECT 
        t.[translation_id],
        t.[entity_type],
        t.[entity_id],
        t.[field_name],
        t.[language_code],
        t.[translated_text],
        t.[is_machine_translated],
        t.[created_at],
        (SELECT COUNT(*) FROM dbo.translation_reviews r WHERE r.[translation_id] = t.[translation_id]) AS [review_count]
    FROM dbo.translations t
    WHERE t.[review_status] = 'pending'
      AND (@entity_type IS NULL OR t.[entity_type] = @entity_type)
      AND (@language_code IS NULL OR t.[language_code] = @language_code)
    ORDER BY t.[created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    
    SELECT COUNT(*) AS [total]
    FROM dbo.translations t
    WHERE t.[review_status] = 'pending'
      AND (@entity_type IS NULL OR t.[entity_type] = @entity_type)
      AND (@language_code IS NULL OR t.[language_code] = @language_code);
END
GO

-- 获取翻译历史版本
IF OBJECT_ID('dbo.sp_get_translation_versions', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_translation_versions;
GO
CREATE PROCEDURE dbo.sp_get_translation_versions
    @translation_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        version_id, version_number, translated_text, edited_by, edit_reason, created_at
    FROM dbo.translation_versions
    WHERE translation_id = @translation_id
    ORDER BY version_number DESC;
END
GO

-- 获取翻译历史版本（扩展）
IF OBJECT_ID('dbo.sp_translation_get_versions', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_get_versions;
GO
CREATE PROCEDURE dbo.sp_translation_get_versions
    @translation_id INT,
    @page INT = 1,
    @page_size INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;
    SELECT [version_id], [version_number], [translated_text], [is_machine_translated],
           [review_status], [quality_score], [review_notes], [reviewed_by], [reviewed_at], [created_at]
    FROM dbo.translation_versions
    WHERE [translation_id] = @translation_id
    ORDER BY [version_number] DESC
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
END
GO

-- 恢复翻译版本
IF OBJECT_ID('dbo.sp_translation_restore_version', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_restore_version;
GO
CREATE PROCEDURE dbo.sp_translation_restore_version
    @translation_id INT,
    @version_number INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @translated_text NVARCHAR(MAX);
    SELECT @translated_text = [translated_text]
    FROM dbo.translation_versions
    WHERE [translation_id] = @translation_id AND [version_number] = @version_number;
    IF @translated_text IS NOT NULL
    BEGIN
        UPDATE dbo.translations
        SET [translated_text] = @translated_text, [review_status] = 'pending', [reviewed_by] = NULL, [reviewed_at] = NULL
        WHERE [translation_id] = @translation_id;
    END
END
GO

-- 创建翻译版本
IF OBJECT_ID('dbo.sp_create_translation_version', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_create_translation_version;
GO
CREATE PROCEDURE dbo.sp_create_translation_version
    @translation_id INT,
    @translated_text NVARCHAR(MAX),
    @edited_by INT = NULL,
    @edit_reason NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @max_version INT;
    SELECT @max_version = ISNULL(MAX([version_number]), 0) 
    FROM dbo.translation_versions 
    WHERE [translation_id] = @translation_id;
    
    INSERT INTO dbo.translation_versions (
        [translation_id], [version_number], [translated_text], [edited_by], [edit_reason]
    )
    VALUES (
        @translation_id, @max_version + 1, @translated_text, @edited_by, @edit_reason
    );
    
    SELECT SCOPE_IDENTITY() AS [version_id], @max_version + 1 AS [version_number];
END
GO

-- 添加翻译记忆
IF OBJECT_ID('dbo.sp_translation_memory_add', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_memory_add;
GO
CREATE PROCEDURE dbo.sp_translation_memory_add
    @source_text NVARCHAR(MAX),
    @target_text NVARCHAR(MAX),
    @source_language NVARCHAR(10),
    @target_language NVARCHAR(10),
    @entity_type NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.translation_memory WHERE [source_text] = @source_text 
               AND [source_language] = @source_language AND [target_language] = @target_language)
    BEGIN
        UPDATE dbo.translation_memory
        SET [target_text] = @target_text, [usage_count] = [usage_count] + 1, 
            [last_used_at] = GETDATE()
        WHERE [source_text] = @source_text AND [source_language] = @source_language 
          AND [target_language] = @target_language;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.translation_memory ([source_text], [target_text], [source_language], 
            [target_language], [entity_type])
        VALUES (@source_text, @target_text, @source_language, @target_language, @entity_type);
    END
END
GO

-- 查询翻译记忆
IF OBJECT_ID('dbo.sp_translation_memory_search', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_memory_search;
GO
CREATE PROCEDURE dbo.sp_translation_memory_search
    @source_text NVARCHAR(MAX),
    @source_language NVARCHAR(10),
    @target_language NVARCHAR(10),
    @max_results INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@max_results) [memory_id], [source_text], [target_text], [quality_score], [usage_count], [last_used_at]
    FROM dbo.translation_memory
    WHERE [source_language] = @source_language AND [target_language] = @target_language
      AND [source_text] LIKE '%' + @source_text + '%'
    ORDER BY [usage_count] DESC, [quality_score] DESC;
END
GO

-- 翻译记忆查询（哈希版）
IF OBJECT_ID('dbo.sp_lookup_translation_memory', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_lookup_translation_memory;
GO
CREATE PROCEDURE dbo.sp_lookup_translation_memory
    @source_text NVARCHAR(MAX),
    @target_language NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @hash NVARCHAR(64);
    SET @hash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', CONVERT(NVARCHAR(MAX), @source_text)), 2);
    
    SELECT 
        m.[memory_id],
        m.[source_text],
        m.[target_text],
        m.[quality_score],
        m.[usage_count]
    FROM dbo.translation_memory m
    WHERE m.[source_text_hash] = @hash
      AND m.[target_language] = @target_language
    ORDER BY m.[quality_score] DESC, m.[usage_count] DESC;
END
GO

-- 保存翻译记忆（哈希版）
IF OBJECT_ID('dbo.sp_upsert_translation_memory', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_upsert_translation_memory;
GO
CREATE PROCEDURE dbo.sp_upsert_translation_memory
    @source_text NVARCHAR(MAX),
    @source_language NVARCHAR(10),
    @target_language NVARCHAR(10),
    @translated_text NVARCHAR(MAX),
    @quality_score INT = 80,
    @context NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @hash NVARCHAR(64);
    SET @hash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', CONVERT(NVARCHAR(MAX), @source_text)), 2);
    
    IF EXISTS (
        SELECT 1 FROM dbo.translation_memory 
        WHERE [source_text_hash] = @hash AND [target_language] = @target_language
    )
    BEGIN
        UPDATE dbo.translation_memory
        SET 
            [usage_count] = [usage_count] + 1,
            [last_used_at] = GETDATE(),
            [quality_score] = CASE WHEN @quality_score > [quality_score] THEN @quality_score ELSE [quality_score] END
        WHERE [source_text_hash] = @hash AND [target_language] = @target_language;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.translation_memory (
            [source_text_hash], [source_text], [source_language], [target_language],
            [target_text], [quality_score], [context]
        )
        VALUES (
            @hash, @source_text, @source_language, @target_language, 
            @translated_text, @quality_score, @context
        );
    END
END
GO

-- 批量操作翻译
IF OBJECT_ID('dbo.sp_translation_batch_update', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_batch_update;
GO
CREATE PROCEDURE dbo.sp_translation_batch_update
    @entity_type NVARCHAR(50),
    @language_code NVARCHAR(10),
    @review_status NVARCHAR(20),
    @entity_ids NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idTable TABLE (id INT);
    INSERT INTO @idTable SELECT value FROM STRING_SPLIT(@entity_ids, ',');
    UPDATE dbo.translations
    SET [review_status] = @review_status
    WHERE [entity_type] = @entity_type AND [language_code] = @language_code
      AND [entity_id] IN (SELECT id FROM @idTable);
    SELECT @@ROWCOUNT AS updated;
END
GO

-- ============================================
-- 16. 同步设备表 (sync_devices)
-- ============================================
IF OBJECT_ID('dbo.sync_devices', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_devices (
        [device_id] NVARCHAR(64) NOT NULL PRIMARY KEY,
        [device_name] NVARCHAR(100) NOT NULL,
        [device_type] NVARCHAR(50) DEFAULT 'mobile',
        [user_id] INT NOT NULL,
        [last_sync_time] DATETIME NULL,
        [sync_status] NVARCHAR(20) DEFAULT 'active',
        [last_ip_address] NVARCHAR(45) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_sync_devices_user_id ON dbo.sync_devices([user_id]);
END
GO

-- ============================================
-- 17. 同步冲突表 (sync_conflicts)
-- ============================================
IF OBJECT_ID('dbo.sync_conflicts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_conflicts (
        [conflict_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [sync_id] NVARCHAR(64) NOT NULL,
        [entity_type] NVARCHAR(50) NOT NULL,
        [entity_id] INT NOT NULL,
        [conflict_type] NVARCHAR(20) NOT NULL,
        [server_version] INT NOT NULL,
        [client_version] INT NOT NULL,
        [server_data] NVARCHAR(MAX) NULL,
        [client_data] NVARCHAR(MAX) NULL,
        [resolved] BIT DEFAULT 0,
        [resolved_by] INT NULL,
        [resolved_at] DATETIME NULL,
        [resolution_action] NVARCHAR(50) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_sync_conflicts_entity ON dbo.sync_conflicts([entity_type], [entity_id]);
    CREATE INDEX IX_sync_conflicts_resolved ON dbo.sync_conflicts([resolved]);
END
GO

-- ============================================
-- 18. 同步日志表 (sync_logs)
-- ============================================
IF OBJECT_ID('dbo.sync_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_logs (
        [log_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [sync_id] NVARCHAR(64) NOT NULL,
        [user_id] INT NOT NULL,
        [device_id] NVARCHAR(64) NULL,
        [operation_type] NVARCHAR(20) NOT NULL,
        [entity_type] NVARCHAR(50) NOT NULL,
        [entity_id] INT NOT NULL,
        [status] NVARCHAR(20) NOT NULL,
        [message] NVARCHAR(MAX) NULL,
        [duration_ms] INT NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_sync_logs_sync_id ON dbo.sync_logs([sync_id]);
    CREATE INDEX IX_sync_logs_user_id ON dbo.sync_logs([user_id]);
    CREATE INDEX IX_sync_logs_entity ON dbo.sync_logs([entity_type], [entity_id]);
END
GO

-- ============================================
-- 19. 同步统计信息表 (sync_stats)
-- ============================================
IF OBJECT_ID('dbo.sync_stats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.sync_stats (
        [stat_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [device_id] NVARCHAR(64) NULL,
        [date] DATE NOT NULL,
        [sync_count] INT DEFAULT 0,
        [data_uploaded_bytes] BIGINT DEFAULT 0,
        [data_downloaded_bytes] BIGINT DEFAULT 0,
        [conflict_count] INT DEFAULT 0,
        [average_sync_duration_ms] INT NULL,
        [updated_at] DATETIME DEFAULT GETDATE()
    );
    CREATE UNIQUE INDEX UQ_sync_stats_user_date ON dbo.sync_stats([user_id], [date]);
    CREATE INDEX IX_sync_stats_device_id ON dbo.sync_stats([device_id]);
END
GO

-- 注册设备
IF OBJECT_ID('dbo.sp_sync_register_device', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_register_device;
GO
CREATE PROCEDURE dbo.sp_sync_register_device
    @device_id NVARCHAR(64),
    @device_name NVARCHAR(100),
    @device_type NVARCHAR(50),
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM dbo.sync_devices WHERE [device_id] = @device_id)
    BEGIN
        UPDATE dbo.sync_devices
        SET [device_name] = @device_name, [device_type] = @device_type, [updated_at] = GETDATE()
        WHERE [device_id] = @device_id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.sync_devices ([device_id], [device_name], [device_type], [user_id])
        VALUES (@device_id, @device_name, @device_type, @user_id);
    END
END
GO

-- 记录同步日志
IF OBJECT_ID('dbo.sp_sync_log_add', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_log_add;
GO
CREATE PROCEDURE dbo.sp_sync_log_add
    @sync_id NVARCHAR(64),
    @user_id INT,
    @device_id NVARCHAR(64),
    @operation_type NVARCHAR(20),
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @status NVARCHAR(20),
    @message NVARCHAR(MAX) = NULL,
    @duration_ms INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.sync_logs (
        [sync_id], [user_id], [device_id], [operation_type], [entity_type], 
        [entity_id], [status], [message], [duration_ms]
    )
    VALUES (
        @sync_id, @user_id, @device_id, @operation_type, @entity_type, 
        @entity_id, @status, @message, @duration_ms
    );
END
GO

-- 记录同步冲突
IF OBJECT_ID('dbo.sp_sync_conflict_add', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_conflict_add;
GO
CREATE PROCEDURE dbo.sp_sync_conflict_add
    @sync_id NVARCHAR(64),
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @conflict_type NVARCHAR(20),
    @server_version INT,
    @client_version INT,
    @server_data NVARCHAR(MAX) = NULL,
    @client_data NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.sync_conflicts (
        [sync_id], [entity_type], [entity_id], [conflict_type], 
        [server_version], [client_version], [server_data], [client_data]
    )
    VALUES (
        @sync_id, @entity_type, @entity_id, @conflict_type, 
        @server_version, @client_version, @server_data, @client_data
    );
END
GO

-- 解决冲突
IF OBJECT_ID('dbo.sp_sync_conflict_resolve', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_conflict_resolve;
GO
CREATE PROCEDURE dbo.sp_sync_conflict_resolve
    @conflict_id INT,
    @resolved_by INT,
    @resolution_action NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.sync_conflicts
    SET [resolved] = 1, [resolved_by] = @resolved_by, [resolved_at] = GETDATE(), [resolution_action] = @resolution_action
    WHERE [conflict_id] = @conflict_id;
END
GO

-- 获取用户待解决冲突
IF OBJECT_ID('dbo.sp_sync_get_user_conflicts', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_user_conflicts;
GO
CREATE PROCEDURE dbo.sp_sync_get_user_conflicts
    @user_id INT,
    @limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit) [conflict_id], [sync_id], [entity_type], [entity_id], [conflict_type],
           [server_version], [client_version], [server_data], [client_data], [created_at]
    FROM dbo.sync_conflicts
    WHERE [resolved] = 0
    ORDER BY [created_at] DESC;
END
GO

-- 更新同步统计
IF OBJECT_ID('dbo.sp_sync_stats_update', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_stats_update;
GO
CREATE PROCEDURE dbo.sp_sync_stats_update
    @user_id INT,
    @device_id NVARCHAR(64) = NULL,
    @data_uploaded_bytes BIGINT = 0,
    @data_downloaded_bytes BIGINT = 0,
    @conflict_count INT = 0,
    @duration_ms INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @today DATE = GETDATE();
    
    IF EXISTS (SELECT 1 FROM dbo.sync_stats WHERE [user_id] = @user_id AND [date] = @today)
    BEGIN
        UPDATE dbo.sync_stats
        SET 
            [sync_count] = [sync_count] + 1,
            [data_uploaded_bytes] = [data_uploaded_bytes] + @data_uploaded_bytes,
            [data_downloaded_bytes] = [data_downloaded_bytes] + @data_downloaded_bytes,
            [conflict_count] = [conflict_count] + @conflict_count,
            [average_sync_duration_ms] = ([average_sync_duration_ms] * ([sync_count]) + @duration_ms) / ([sync_count] + 1),
            [updated_at] = GETDATE()
        WHERE [user_id] = @user_id AND [date] = @today;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.sync_stats (
            [user_id], [device_id], [date], [sync_count], 
            [data_uploaded_bytes], [data_downloaded_bytes], 
            [conflict_count], [average_sync_duration_ms]
        )
        VALUES (
            @user_id, @device_id, @today, 1, 
            @data_uploaded_bytes, @data_downloaded_bytes, 
            @conflict_count, @duration_ms
        );
    END
END
GO

-- 更新设备最后同步时间
IF OBJECT_ID('dbo.sp_sync_update_device_last_sync', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_update_device_last_sync;
GO
CREATE PROCEDURE dbo.sp_sync_update_device_last_sync
    @device_id NVARCHAR(64),
    @sync_status NVARCHAR(20) = 'success'
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.sync_devices
    SET [last_sync_time] = GETDATE(), [sync_status] = @sync_status, [updated_at] = GETDATE()
    WHERE [device_id] = @device_id;
END
GO

-- ============================================
-- 20. AI知识图谱数据表
-- 防止AI幻觉，确保回答准确率
-- ============================================
-- 知识主题表
IF OBJECT_ID('dbo.kg_topics', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.kg_topics (
        [topic_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [topic_key] NVARCHAR(100) NOT NULL UNIQUE,
        [topic_name] NVARCHAR(200) NOT NULL,
        [category] NVARCHAR(50) NOT NULL,
        [content_zh] NVARCHAR(MAX) NOT NULL,
        [content_en] NVARCHAR(MAX) NULL,
        [source] NVARCHAR(200) NOT NULL,
        [confidence] DECIMAL(3,2) DEFAULT 0.95,
        [verified] BIT DEFAULT 0,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- 知识关键词关联表（用于快速匹配）
IF OBJECT_ID('dbo.kg_keywords', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.kg_keywords (
        [keyword_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [topic_id] INT NOT NULL,
        [keyword] NVARCHAR(100) NOT NULL,
        [weight] DECIMAL(3,2) DEFAULT 1.0,
        [language] NVARCHAR(10) DEFAULT 'zh',
        CONSTRAINT FK_kg_keywords_topic FOREIGN KEY ([topic_id]) REFERENCES dbo.kg_topics([topic_id]) ON DELETE CASCADE,
        CONSTRAINT UQ_kg_keywords UNIQUE ([topic_id], [keyword], [language])
    );
END
GO

-- 知识关系表（主题之间的关联）
IF OBJECT_ID('dbo.kg_relations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.kg_relations (
        [relation_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [from_topic_id] INT NOT NULL,
        [to_topic_id] INT NOT NULL,
        [relation_type] NVARCHAR(50) NOT NULL,
        [description] NVARCHAR(500) NULL,
        CONSTRAINT FK_kg_rel_from FOREIGN KEY ([from_topic_id]) REFERENCES dbo.kg_topics([topic_id]),
        CONSTRAINT FK_kg_rel_to FOREIGN KEY ([to_topic_id]) REFERENCES dbo.kg_topics([topic_id]),
        CONSTRAINT UQ_kg_relations UNIQUE ([from_topic_id], [to_topic_id], [relation_type])
    );
END
GO

-- AI回答验证记录表（追踪AI回答质量）
IF OBJECT_ID('dbo.kg_verifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.kg_verifications (
        [verification_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [question] NVARCHAR(MAX) NOT NULL,
        [ai_answer] NVARCHAR(MAX) NOT NULL,
        [ai_provider] NVARCHAR(50) NOT NULL,
        [matched_topic_id] INT NULL,
        [match_score] DECIMAL(5,2) NULL,
        [is_accurate] BIT NULL,
        [feedback] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_topics_category' AND object_id = OBJECT_ID('dbo.kg_topics'))
    CREATE INDEX [idx_kg_topics_category] ON dbo.kg_topics([category]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_topics_key' AND object_id = OBJECT_ID('dbo.kg_topics'))
    CREATE INDEX [idx_kg_topics_key] ON dbo.kg_topics([topic_key]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_keywords_word' AND object_id = OBJECT_ID('dbo.kg_keywords'))
    CREATE INDEX [idx_kg_keywords_word] ON dbo.kg_keywords([keyword]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_verifications_topic' AND object_id = OBJECT_ID('dbo.kg_verifications'))
    CREATE INDEX [idx_kg_verifications_topic] ON dbo.kg_verifications([matched_topic_id]);
GO

-- 根据关键词查询知识
IF OBJECT_ID('dbo.sp_kg_query', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_query;
GO
CREATE PROCEDURE dbo.sp_kg_query
    @keywords NVARCHAR(MAX),
    @language NVARCHAR(10) = 'zh',
    @max_results INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @keywordTable TABLE (word NVARCHAR(100));
    INSERT INTO @keywordTable
    SELECT value FROM STRING_SPLIT(@keywords, ',');
    SELECT TOP (@max_results)
        t.[topic_id], t.[topic_key], t.[topic_name], t.[category],
        CASE WHEN @language = 'en' AND t.[content_en] IS NOT NULL THEN t.[content_en] ELSE t.[content_zh] END AS [content],
        t.[source], t.[confidence], t.[verified],
        COUNT(DISTINCT kw.[keyword_id]) AS [match_count],
        SUM(kw.[weight]) AS [total_weight]
    FROM dbo.kg_topics t
    INNER JOIN dbo.kg_keywords kw ON t.[topic_id] = kw.[topic_id]
    INNER JOIN @keywordTable kt ON kw.[keyword] LIKE '%' + kt.word + '%' OR kt.word LIKE '%' + kw.[keyword] + '%'
    GROUP BY t.[topic_id], t.[topic_key], t.[topic_name], t.[category],
             t.[content_zh], t.[content_en], t.[source], t.[confidence], t.[verified]
    ORDER BY [total_weight] DESC, t.[confidence] DESC, t.[verified] DESC;
END
GO

-- 记录验证结果
IF OBJECT_ID('dbo.sp_kg_log_verification', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_log_verification;
GO
CREATE PROCEDURE dbo.sp_kg_log_verification
    @question NVARCHAR(MAX),
    @ai_answer NVARCHAR(MAX),
    @ai_provider NVARCHAR(50),
    @matched_topic_id INT = NULL,
    @match_score DECIMAL(5,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.kg_verifications ([question], [ai_answer], [ai_provider], [matched_topic_id], [match_score])
    VALUES (@question, @ai_answer, @ai_provider, @matched_topic_id, @match_score);
    SELECT SCOPE_IDENTITY() AS [verification_id];
END
GO

-- 查询实体的直接邻居（关系查询）
IF OBJECT_ID('dbo.sp_kg_get_neighbors', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_get_neighbors;
GO
CREATE PROCEDURE dbo.sp_kg_get_neighbors
    @topic_id INT,
    @relation_type NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        r.relation_id, r.to_topic_id AS neighbor_id, t.topic_name AS neighbor_name,
        t.category AS neighbor_category, r.relation_type, r.description AS relation_description
    FROM dbo.kg_relations r
    INNER JOIN dbo.kg_topics t ON r.to_topic_id = t.topic_id
    WHERE r.from_topic_id = @topic_id AND (@relation_type IS NULL OR r.relation_type = @relation_type)
    UNION ALL
    SELECT 
        r.relation_id, r.from_topic_id AS neighbor_id, t.topic_name AS neighbor_name,
        t.category AS neighbor_category, r.relation_type, r.description AS relation_description
    FROM dbo.kg_relations r
    INNER JOIN dbo.kg_topics t ON r.from_topic_id = t.topic_id
    WHERE r.to_topic_id = @topic_id AND (@relation_type IS NULL OR r.relation_type = @relation_type);
END
GO

-- 根据主题名称查询主题ID
IF OBJECT_ID('dbo.sp_kg_find_topic', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_find_topic;
GO
CREATE PROCEDURE dbo.sp_kg_find_topic
    @topic_name NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.kg_topics 
    WHERE topic_name LIKE '%' + @topic_name + '%' OR topic_key LIKE '%' + @topic_name + '%';
END
GO

-- 查询所有实体（支持分页和过滤）
IF OBJECT_ID('dbo.sp_kg_get_topics', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_get_topics;
GO
CREATE PROCEDURE dbo.sp_kg_get_topics
    @category NVARCHAR(50) = NULL,
    @page INT = 1,
    @page_size INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;
    SELECT * FROM dbo.kg_topics
    WHERE (@category IS NULL OR category = @category)
    ORDER BY topic_id
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
    SELECT COUNT(*) AS total FROM dbo.kg_topics
    WHERE (@category IS NULL OR category = @category);
END
GO

PRINT 'Architecture 数据库初始化完成';

-- ============================================================
-- [3/10] 3D模型模块数据库 (Media_3D)
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Media_3D')
    BEGIN
        CREATE DATABASE [Media_3D];
    END
GO
USE [Media_3D];
GO
IF OBJECT_ID('dbo.user_models', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_models (
            [model_id] INT IDENTITY(1,1) PRIMARY KEY,
            [user_id] INT NOT NULL,
            [model_name] NVARCHAR(255) NOT NULL,
            [model_data] NVARCHAR(MAX) NULL,
            [thumbnail_url] NVARCHAR(500) NULL,
            [is_public] BIT DEFAULT 0,
            [download_count] INT DEFAULT 0,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE(),
            [is_featured] BIT NOT NULL DEFAULT 0
        );
    END
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_models_user_id' AND object_id = OBJECT_ID('dbo.user_models'))
    CREATE INDEX [idx_user_models_user_id] ON dbo.user_models([user_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_models_is_public' AND object_id = OBJECT_ID('dbo.user_models'))
    CREATE INDEX [idx_user_models_is_public] ON dbo.user_models([is_public]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_models_created_at' AND object_id = OBJECT_ID('dbo.user_models'))
    CREATE INDEX [idx_user_models_created_at] ON dbo.user_models([created_at]);
GO
IF OBJECT_ID('dbo.tr_user_models_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_user_models_updated_at;
GO
CREATE TRIGGER dbo.tr_user_models_updated_at
ON dbo.user_models
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.user_models
    SET [updated_at] = GETDATE()
    WHERE [model_id] IN (SELECT DISTINCT [model_id] FROM inserted);
END;
GO
IF OBJECT_ID('dbo.model_component_definitions', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.model_component_definitions (
            [definition_id] INT IDENTITY(1,1) PRIMARY KEY,
            [type] NVARCHAR(100) NOT NULL UNIQUE,
            [category] NVARCHAR(50) NOT NULL,
            [name] NVARCHAR(255) NOT NULL,
            [description] NVARCHAR(MAX) NULL,
            [dimensions] NVARCHAR(MAX) NULL,
            [material] NVARCHAR(MAX) NULL,
            [snap_points] NVARCHAR(MAX) NULL,
            [era] NVARCHAR(MAX) NULL,
            [complexity] NVARCHAR(20) DEFAULT 'simple',
            [tags] NVARCHAR(MAX) NULL,
            [is_active] BIT DEFAULT 1,
            [created_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_component_defs_category' AND object_id = OBJECT_ID('dbo.model_component_definitions'))
    CREATE INDEX [idx_component_defs_category] ON dbo.model_component_definitions([category]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_component_defs_type' AND object_id = OBJECT_ID('dbo.model_component_definitions'))
    CREATE INDEX [idx_component_defs_type] ON dbo.model_component_definitions([type]);
GO
IF OBJECT_ID('dbo.model_component_instances', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.model_component_instances (
            [instance_id] INT IDENTITY(1,1) PRIMARY KEY,
            [model_id] INT NOT NULL,
            [definition_id] INT NOT NULL,
            [instance_uuid] NVARCHAR(100) NOT NULL,
            [position] NVARCHAR(MAX) NOT NULL,
            [rotation] NVARCHAR(MAX) NOT NULL,
            [scale] NVARCHAR(MAX) DEFAULT '{"x": 1, "y": 1, "z": 1}',
            [custom_material] NVARCHAR(MAX) NULL,
            [parent_instance_id] INT NULL,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE(),
            CONSTRAINT fk_instances_model FOREIGN KEY ([model_id]) REFERENCES dbo.user_models([model_id]) ON DELETE CASCADE,
            CONSTRAINT fk_instances_definition FOREIGN KEY ([definition_id]) REFERENCES dbo.model_component_definitions([definition_id])
        );
    END
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_instances_model_id' AND object_id = OBJECT_ID('dbo.model_component_instances'))
    CREATE INDEX [idx_instances_model_id] ON dbo.model_component_instances([model_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_instances_instance_uuid' AND object_id = OBJECT_ID('dbo.model_component_instances'))
    CREATE INDEX [idx_instances_instance_uuid] ON dbo.model_component_instances([instance_uuid]);
GO
IF OBJECT_ID('dbo.tr_component_instances_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_component_instances_updated_at;
GO
CREATE TRIGGER dbo.tr_component_instances_updated_at
ON dbo.model_component_instances
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.model_component_instances
    SET [updated_at] = GETDATE()
    WHERE [instance_id] IN (SELECT DISTINCT [instance_id] FROM inserted);
END;
GO
IF OBJECT_ID('dbo.model_firmware_groups', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.model_firmware_groups (
            [group_id] INT IDENTITY(1,1) PRIMARY KEY,
            [group_name] NVARCHAR(255) NOT NULL,
            [description] NVARCHAR(MAX) NULL,
            [category] NVARCHAR(100) NOT NULL,
            [era] NVARCHAR(100) NULL,
            [component_types] NVARCHAR(MAX) NULL,
            [thumbnail_url] NVARCHAR(500) NULL,
            [complexity_level] INT DEFAULT 1,
            [is_active] BIT DEFAULT 1,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO
IF OBJECT_ID('dbo.tr_firmware_groups_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_firmware_groups_updated_at;
GO
CREATE TRIGGER dbo.tr_firmware_groups_updated_at
ON dbo.model_firmware_groups
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.model_firmware_groups
    SET [updated_at] = GETDATE()
    WHERE [group_id] IN (SELECT DISTINCT [group_id] FROM inserted);
END;
GO
IF OBJECT_ID('dbo.model_firmware_group_components', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.model_firmware_group_components (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [group_id] INT NOT NULL,
            [definition_id] INT NOT NULL,
            [relative_position] NVARCHAR(MAX) NOT NULL,
            [relative_rotation] NVARCHAR(MAX) DEFAULT '{"x": 0, "y": 0, "z": 0}',
            [scale] NVARCHAR(MAX) DEFAULT '{"x": 1, "y": 1, "z": 1}',
            [order_index] INT DEFAULT 0,
            CONSTRAINT fk_group_components_group FOREIGN KEY ([group_id]) REFERENCES dbo.model_firmware_groups([group_id]) ON DELETE CASCADE,
            CONSTRAINT fk_group_components_definition FOREIGN KEY ([definition_id]) REFERENCES dbo.model_component_definitions([definition_id])
        );
    END
GO
IF OBJECT_ID('dbo.architecture_models', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.architecture_models (
            [model_id] INT IDENTITY(1,1) PRIMARY KEY,
            [model_name] NVARCHAR(255) NOT NULL,
            [external_architecture_id] INT NULL,
            [model_format] NVARCHAR(20) NOT NULL DEFAULT 'gltf',
            [file_size] BIGINT DEFAULT 0,
            [model_url] NVARCHAR(500) NULL,
            [preview_image_url] NVARCHAR(500) NULL,
            [is_public] BIT DEFAULT 1,
            [is_featured] BIT DEFAULT 0,
            [era] NVARCHAR(50) NULL,
            [complexity_level] INT DEFAULT 1,
            [description] NVARCHAR(MAX) NULL,
            [download_count] INT DEFAULT 0,
            [created_by] INT NULL,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO
IF OBJECT_ID('dbo.tr_architecture_models_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_architecture_models_updated_at;
GO
CREATE TRIGGER dbo.tr_architecture_models_updated_at
ON dbo.architecture_models
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.architecture_models
    SET [updated_at] = GETDATE()
    WHERE [model_id] IN (SELECT DISTINCT [model_id] FROM inserted);
END;
GO
IF OBJECT_ID('dbo.three_d_models', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.three_d_models (
            [model_id] INT IDENTITY(1,1) PRIMARY KEY,
            [model_name] NVARCHAR(255) NOT NULL,
            [external_architecture_id] INT NULL,
            [model_format] NVARCHAR(20) NOT NULL DEFAULT 'gltf',
            [file_size] BIGINT DEFAULT 0,
            [model_url] NVARCHAR(500) NULL,
            [preview_image_url] NVARCHAR(500) NULL,
            [is_public] BIT DEFAULT 1,
            [is_featured] BIT DEFAULT 0,
            [era] NVARCHAR(50) NULL,
            [complexity_level] INT DEFAULT 1,
            [description] NVARCHAR(MAX) NULL,
            [download_count] INT DEFAULT 0,
            [created_by] INT NULL,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO
IF OBJECT_ID('dbo.tr_three_d_models_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_three_d_models_updated_at;
GO
CREATE TRIGGER dbo.tr_three_d_models_updated_at
ON dbo.three_d_models
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.three_d_models
    SET [updated_at] = GETDATE()
    WHERE [model_id] IN (SELECT DISTINCT [model_id] FROM inserted);
END;
GO
IF OBJECT_ID('dbo.building_templates', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.building_templates (
            [template_id] INT IDENTITY(1,1) PRIMARY KEY,
            [template_name] NVARCHAR(255) NOT NULL,
            [description] NVARCHAR(MAX) NULL,
            [category] NVARCHAR(100) NOT NULL,
            [building_type] NVARCHAR(100) NOT NULL,
            [era] NVARCHAR(50) NULL,
            [complexity_level] INT DEFAULT 1,
            [thumbnail_url] NVARCHAR(500) NULL,
            [template_structure] NVARCHAR(MAX) NOT NULL,
            [default_dimensions] NVARCHAR(MAX) NULL,
            [is_featured] BIT DEFAULT 0,
            [is_active] BIT DEFAULT 1,
            [created_by] INT NULL,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO
IF OBJECT_ID('dbo.tr_building_templates_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_building_templates_updated_at;
GO
CREATE TRIGGER dbo.tr_building_templates_updated_at
ON dbo.building_templates
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.building_templates
    SET [updated_at] = GETDATE()
    WHERE [template_id] IN (SELECT DISTINCT [template_id] FROM inserted);
END;
GO
IF OBJECT_ID('dbo.template_components', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.template_components (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [template_id] INT NOT NULL,
            [definition_id] INT NOT NULL,
            [component_role] NVARCHAR(100) NOT NULL,
            [build_order] INT NOT NULL,
            [build_stage] NVARCHAR(50) NOT NULL,
            [relative_position] NVARCHAR(MAX) NOT NULL,
            [relative_rotation] NVARCHAR(MAX) DEFAULT '{"x": 0, "y": 0, "z": 0}',
            [scale] NVARCHAR(MAX) DEFAULT '{"x": 1, "y": 1, "z": 1}',
            [is_required] BIT DEFAULT 1,
            [placement_hint] NVARCHAR(500) NULL,
            CONSTRAINT fk_template_components_template FOREIGN KEY ([template_id]) REFERENCES dbo.building_templates([template_id]) ON DELETE CASCADE,
            CONSTRAINT fk_template_components_definition FOREIGN KEY ([definition_id]) REFERENCES dbo.model_component_definitions([definition_id])
        );
    END
GO
IF OBJECT_ID('dbo.build_steps', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.build_steps (
            [step_id] INT IDENTITY(1,1) PRIMARY KEY,
            [model_id] INT NOT NULL,
            [user_id] INT NOT NULL,
            [step_number] INT NOT NULL,
            [action_type] NVARCHAR(50) NOT NULL,
            [component_type] NVARCHAR(100) NULL,
            [component_id] NVARCHAR(100) NULL,
            [definition_id] INT NULL,
            [position_before] NVARCHAR(MAX) NULL,
            [position_after] NVARCHAR(MAX) NULL,
            [rotation_before] NVARCHAR(MAX) NULL,
            [rotation_after] NVARCHAR(MAX) NULL,
            [scale_before] NVARCHAR(MAX) NULL,
            [scale_after] NVARCHAR(MAX) NULL,
            [build_stage] NVARCHAR(50) NULL,
            [step_description] NVARCHAR(500) NULL,
            [is_validated] BIT DEFAULT 0,
            [validation_message] NVARCHAR(500) NULL,
            [created_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO
IF OBJECT_ID('dbo.component_relations', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.component_relations (
            [relation_id] INT IDENTITY(1,1) PRIMARY KEY,
            [current_component_type] NVARCHAR(100) NOT NULL,
            [current_category] NVARCHAR(50) NOT NULL,
            [recommended_component_type] NVARCHAR(100) NOT NULL,
            [recommended_category] NVARCHAR(50) NOT NULL,
            [recommended_definition_id] INT NULL,
            [build_stage] NVARCHAR(50) NOT NULL,
            [relation_type] NVARCHAR(50) DEFAULT 'sequential',
            [priority] INT DEFAULT 1,
            [reason] NVARCHAR(500) NULL,
            [condition_description] NVARCHAR(500) NULL,
            [is_active] BIT DEFAULT 1,
            [created_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO
MERGE INTO dbo.model_component_definitions AS target
USING (VALUES
           ('pillar_round', 'pillar', N'圆柱', N'传统圆形木柱，用于主要承重', '{"x": 0.3, "y": 3, "z": 0.3}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "top", "localPosition": [0, 1.5, 0], "type": "mortise"}, {"id": "bottom", "localPosition": [0, -1.5, 0], "type": "tenon"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["承重", "主要构件"]'),
           ('pillar_square', 'pillar', N'方柱', N'方形石柱或木柱', '{"x": 0.35, "y": 3, "z": 0.35}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "top", "localPosition": [0, 1.5, 0], "type": "mortise"}, {"id": "bottom", "localPosition": [0, -1.5, 0], "type": "tenon"}]', '["song", "yuan", "ming", "qing"]', 'simple', '["承重", "主要构件"]'),
           ('pillar_corner', 'pillar', N'角柱', N'建筑角落的柱子', '{"x": 0.35, "y": 3, "z": 0.35}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "top", "localPosition": [0, 1.5, 0], "type": "mortise"}, {"id": "bottom", "localPosition": [0, -1.5, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'medium', '["承重", "转角"]'),
           ('beam_main', 'beam', N'主梁', N'主要水平承重构件', '{"x": 4, "y": 0.4, "z": 0.3}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "left", "localPosition": [-2, 0, 0], "type": "tenon"}, {"id": "right", "localPosition": [2, 0, 0], "type": "tenon"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["承重", "主要构件"]'),
           ('beam_cross', 'beam', N'横梁', N'横向连接梁', '{"x": 3, "y": 0.3, "z": 0.25}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "left", "localPosition": [-1.5, 0, 0], "type": "tenon"}, {"id": "right", "localPosition": [1.5, 0, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'simple', '["承重", "连接"]'),
           ('beam_purlin', 'beam', N'檩条', N'支撑屋顶的梁', '{"x": 3.5, "y": 0.25, "z": 0.2}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "left", "localPosition": [-1.75, 0, 0], "type": "tenon"}, {"id": "right", "localPosition": [1.75, 0, 0], "type": "tenon"}]', '["song", "yuan", "ming", "qing"]', 'simple', '["承重", "屋顶"]'),
           ('roof_hipped', 'roof', N'歇山顶', N'四坡屋顶', '{"x": 4, "y": 1.5, "z": 4}', '{"type": "tile", "color": 3090452, "roughness": 0.7, "metalness": 0.0}', '[{"id": "bottom", "localPosition": [0, -0.75, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'complex', '["屋顶", "高级"]'),
           ('roof_gable', 'roof', N'悬山顶', N'两面坡屋顶', '{"x": 4, "y": 1.2, "z": 3}', '{"type": "tile", "color": 3090452, "roughness": 0.7, "metalness": 0.0}', '[{"id": "bottom", "localPosition": [0, -0.6, 0], "type": "tenon"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'medium', '["屋顶", "常见"]'),
           ('base_platform', 'base', N'台基', N'建筑基础平台', '{"x": 6, "y": 0.8, "z": 5}', '{"type": "stone", "color": 8421504, "roughness": 0.9, "metalness": 0.0}', '[{"id": "top", "localPosition": [0, 0.4, 0], "type": "mortise"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["基础", "主要构件"]'),
           ('base_stairs', 'base', N'台阶', N'台基台阶', '{"x": 2, "y": 0.6, "z": 1.5}', '{"type": "stone", "color": 8421504, "roughness": 0.9, "metalness": 0.0}', '[{"id": "top", "localPosition": [0, 0.3, -0.5], "type": "mortise"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["基础", "通道"]'),
           ('wall_plain', 'wall', N'实墙', N'普通承重墙体', '{"x": 3, "y": 2.8, "z": 0.3}', '{"type": "brick", "color": 10516397, "roughness": 0.85, "metalness": 0.0}', '[{"id": "top", "localPosition": [0, 1.4, 0], "type": "mortise"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["围护", "承重"]'),
           ('door_main', 'door', N'大门', N'主要出入口', '{"x": 2, "y": 2.5, "z": 0.15}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "top", "localPosition": [0, 1.25, 0], "type": "tenon"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'medium', '["出入口", "主要构件"]'),
           ('window_lattice', 'window', N'花窗', N'带花纹的窗户', '{"x": 1, "y": 1.2, "z": 0.1}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "center", "localPosition": [0, 0, 0], "type": "any"}]', '["song", "yuan", "ming", "qing"]', 'medium', '["采光", "装饰"]'),
           ('decoration_dougong', 'decoration', N'斗拱', N'柱头与梁之间的过渡构件', '{"x": 0.8, "y": 0.5, "z": 0.8}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "bottom", "localPosition": [0, -0.25, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'complex', '["装饰", "结构", "高级"]'),
           ('decoration_ridge', 'decoration', N'屋脊', N'屋顶正脊装饰', '{"x": 3, "y": 0.4, "z": 0.3}', '{"type": "tile", "color": 16766720, "roughness": 0.7, "metalness": 0.0}', '[{"id": "center", "localPosition": [0, 0, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'medium', '["装饰", "屋顶"]')
) AS source ([type], [category], [name], [description], [dimensions], [material], [snap_points], [era], [complexity], [tags])
ON target.[type] = source.[type]
WHEN NOT MATCHED THEN
    INSERT ([type], [category], [name], [description], [dimensions], [material], [snap_points], [era], [complexity], [tags])
    VALUES (source.[type], source.[category], source.[name], source.[description], source.[dimensions], source.[material], source.[snap_points], source.[era], source.[complexity], source.[tags]);
GO
IF OBJECT_ID('dbo.vw_component_definitions', 'V') IS NOT NULL
    DROP VIEW dbo.vw_component_definitions;
GO
CREATE VIEW dbo.vw_component_definitions AS
SELECT [definition_id], [type], [category], [name], [description],
       JSON_QUERY([dimensions]) AS dimensions,
       JSON_QUERY([material]) AS material,
       JSON_QUERY([snap_points]) AS snap_points,
       JSON_QUERY([era]) AS era,
       [complexity], JSON_QUERY([tags]) AS tags,
       [is_active], [created_at]
FROM dbo.model_component_definitions
WHERE [is_active] = 1;
GO
IF OBJECT_ID('dbo.vw_model_details', 'V') IS NOT NULL
    DROP VIEW dbo.vw_model_details;
GO
CREATE VIEW dbo.vw_model_details AS
SELECT m.[model_id], m.[user_id], m.[model_name], m.[model_data], m.[thumbnail_url],
       m.[is_public], m.[download_count], m.[created_at], m.[updated_at],
       (SELECT COUNT(*) FROM dbo.model_component_instances WHERE [model_id] = m.[model_id]) AS component_count
FROM dbo.user_models m;
GO
MERGE INTO dbo.component_relations AS target
USING (VALUES
           ('base_platform', 'base', 'base_stairs', 'base', 'foundation', 'adjacent', 8, N'台基完成后需要添加台阶'),
           ('base_stairs', 'base', 'pillar_round', 'pillar', 'pillar', 'sequential', 9, N'台基完成后开始立柱'),
           ('pillar_round', 'pillar', 'beam_main', 'beam', 'beam', 'sequential', 9, N'柱网完成后需要架梁'),
           ('beam_main', 'beam', 'beam_cross', 'beam', 'beam', 'adjacent', 7, N'主梁需要横梁连接'),
           ('beam_cross', 'beam', 'decoration_dougong', 'decoration', 'bracket', 'sequential', 8, N'梁架完成后可添加斗拱'),
           ('decoration_dougong', 'decoration', 'roof_hipped', 'roof', 'roof', 'sequential', 9, N'斗拱完成后可以盖屋顶'),
           ('roof_hipped', 'roof', 'door_main', 'door', 'door_window', 'sequential', 7, N'屋顶完成后安装门窗'),
           ('roof_hipped', 'roof', 'decoration_ridge', 'decoration', 'decoration', 'adjacent', 6, N'屋脊上可添加脊饰'),
           ('door_main', 'door', 'window_lattice', 'window', 'door_window', 'adjacent', 6, N'大门后可安装窗户')
) AS source ([current_component_type], [current_category], [recommended_component_type], [recommended_category], [build_stage], [relation_type], [priority], [reason])
ON target.[current_component_type] = source.[current_component_type]
    AND target.[recommended_component_type] = source.[recommended_component_type]
WHEN NOT MATCHED THEN
    INSERT ([current_component_type], [current_category], [recommended_component_type], [recommended_category], [build_stage], [relation_type], [priority], [reason])
    VALUES (source.[current_component_type], source.[current_category], source.[recommended_component_type], source.[recommended_category], source.[build_stage], source.[relation_type], source.[priority], source.[reason]);
GO
PRINT 'Media_3D 数据库初始化完成';
GO


-- ============================================================
-- [4/10] 知识图谱模块数据库 (Knowledge)
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Knowledge')
BEGIN
    CREATE DATABASE [Knowledge];
END
GO
USE [Knowledge];
GO
IF OBJECT_ID('dbo.kg_topics', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.kg_topics (
        [topic_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [topic_key] NVARCHAR(100) NOT NULL UNIQUE,
        [topic_name] NVARCHAR(200) NOT NULL,
        [category] NVARCHAR(50) NOT NULL,
        [content_zh] NVARCHAR(MAX) NOT NULL,
        [content_en] NVARCHAR(MAX) NULL,
        [source] NVARCHAR(200) NOT NULL,
        [confidence] DECIMAL(3,2) DEFAULT 0.95,
        [verified] BIT DEFAULT 0,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
END
GO
IF OBJECT_ID('dbo.kg_keywords', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.kg_keywords (
        [keyword_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [topic_id] INT NOT NULL,
        [keyword] NVARCHAR(100) NOT NULL,
        [weight] DECIMAL(3,2) DEFAULT 1.0,
        [language] NVARCHAR(10) DEFAULT 'zh',
        CONSTRAINT FK_kg_keywords_topic FOREIGN KEY ([topic_id]) REFERENCES dbo.kg_topics([topic_id]) ON DELETE CASCADE,
        CONSTRAINT UQ_kg_keywords UNIQUE ([topic_id], [keyword], [language])
    );
END
GO
IF OBJECT_ID('dbo.kg_relations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.kg_relations (
        [relation_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [from_topic_id] INT NOT NULL,
        [to_topic_id] INT NOT NULL,
        [relation_type] NVARCHAR(50) NOT NULL,
        [description] NVARCHAR(500) NULL,
        CONSTRAINT FK_kg_rel_from FOREIGN KEY ([from_topic_id]) REFERENCES dbo.kg_topics([topic_id]),
        CONSTRAINT FK_kg_rel_to FOREIGN KEY ([to_topic_id]) REFERENCES dbo.kg_topics([topic_id]),
        CONSTRAINT UQ_kg_relations UNIQUE ([from_topic_id], [to_topic_id], [relation_type])
    );
END
GO
IF OBJECT_ID('dbo.kg_verifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.kg_verifications (
        [verification_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [question] NVARCHAR(MAX) NOT NULL,
        [ai_answer] NVARCHAR(MAX) NOT NULL,
        [ai_provider] NVARCHAR(50) NOT NULL,
        [matched_topic_id] INT NULL,
        [match_score] DECIMAL(5,2) NULL,
        [is_accurate] BIT NULL,
        [feedback] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_topics_category' AND object_id = OBJECT_ID('dbo.kg_topics'))
    CREATE INDEX [idx_kg_topics_category] ON dbo.kg_topics([category]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_topics_key' AND object_id = OBJECT_ID('dbo.kg_topics'))
    CREATE INDEX [idx_kg_topics_key] ON dbo.kg_topics([topic_key]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_keywords_word' AND object_id = OBJECT_ID('dbo.kg_keywords'))
    CREATE INDEX [idx_kg_keywords_word] ON dbo.kg_keywords([keyword]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_verifications_topic' AND object_id = OBJECT_ID('dbo.kg_verifications'))
    CREATE INDEX [idx_kg_verifications_topic] ON dbo.kg_verifications([matched_topic_id]);
GO
IF OBJECT_ID('tr_kg_topics_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_kg_topics_updated_at;
GO
CREATE TRIGGER tr_kg_topics_updated_at
ON dbo.kg_topics
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.kg_topics
    SET [updated_at] = GETDATE()
    FROM dbo.kg_topics t
    INNER JOIN inserted i ON t.[topic_id] = i.[topic_id];
END
GO
IF OBJECT_ID('dbo.sp_kg_query', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_query;
GO
CREATE PROCEDURE dbo.sp_kg_query
    @keywords NVARCHAR(MAX),
    @language NVARCHAR(10) = 'zh',
    @max_results INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @keywordTable TABLE (word NVARCHAR(100));
    INSERT INTO @keywordTable
    SELECT value FROM STRING_SPLIT(@keywords, ',');
    SELECT TOP (@max_results)
        t.[topic_id], t.[topic_key], t.[topic_name], t.[category],
        CASE WHEN @language = 'en' AND t.[content_en] IS NOT NULL THEN t.[content_en] ELSE t.[content_zh] END AS [content],
        t.[source], t.[confidence], t.[verified],
        COUNT(DISTINCT kw.[keyword_id]) AS [match_count],
        SUM(kw.[weight]) AS [total_weight]
    FROM dbo.kg_topics t
    INNER JOIN dbo.kg_keywords kw ON t.[topic_id] = kw.[topic_id]
    INNER JOIN @keywordTable kt ON kw.[keyword] LIKE '%' + kt.word + '%' OR kt.word LIKE '%' + kw.[keyword] + '%'
    GROUP BY t.[topic_id], t.[topic_key], t.[topic_name], t.[category],
             t.[content_zh], t.[content_en], t.[source], t.[confidence], t.[verified]
    ORDER BY [total_weight] DESC, t.[confidence] DESC, t.[verified] DESC;
END
GO
IF OBJECT_ID('dbo.sp_kg_log_verification', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_log_verification;
GO
CREATE PROCEDURE dbo.sp_kg_log_verification
    @question NVARCHAR(MAX),
    @ai_answer NVARCHAR(MAX),
    @ai_provider NVARCHAR(50),
    @matched_topic_id INT = NULL,
    @match_score DECIMAL(5,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.kg_verifications ([question], [ai_answer], [ai_provider], [matched_topic_id], [match_score])
    VALUES (@question, @ai_answer, @ai_provider, @matched_topic_id, @match_score);
    SELECT SCOPE_IDENTITY() AS [verification_id];
END
GO
IF OBJECT_ID('dbo.sp_kg_get_topics', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_get_topics;
GO
CREATE PROCEDURE dbo.sp_kg_get_topics
    @category NVARCHAR(50) = NULL,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT t.[topic_id], t.[topic_key], t.[topic_name], t.[category], t.[source], t.[confidence], t.[verified], t.[created_at]
    FROM dbo.kg_topics t
    WHERE (@category IS NULL OR t.[category] = @category)
    ORDER BY t.[created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO
IF OBJECT_ID('dbo.sp_kg_upsert_topic', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_upsert_topic;
GO
CREATE PROCEDURE dbo.sp_kg_upsert_topic
    @topic_key NVARCHAR(100),
    @topic_name NVARCHAR(200),
    @category NVARCHAR(50),
    @content_zh NVARCHAR(MAX),
    @content_en NVARCHAR(MAX) = NULL,
    @source NVARCHAR(200),
    @confidence DECIMAL(3,2) = 0.95,
    @verified BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.kg_topics WHERE [topic_key] = @topic_key)
    BEGIN
        UPDATE dbo.kg_topics
        SET [topic_name] = @topic_name, [category] = @category, [content_zh] = @content_zh,
            [content_en] = @content_en, [source] = @source, [confidence] = @confidence, [verified] = @verified
        WHERE [topic_key] = @topic_key;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.kg_topics ([topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified])
        VALUES (@topic_key, @topic_name, @category, @content_zh, @content_en, @source, @confidence, @verified);
    END
END
GO
DELETE FROM dbo.kg_relations;
DELETE FROM dbo.kg_keywords;
DELETE FROM dbo.kg_topics;
GO
SET IDENTITY_INSERT dbo.kg_topics ON;
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(1, 'tailiang', '抬梁式结构', 'structure', N'抬梁式（叠梁式）是中国古建筑最主要的木结构形式。特点：柱上承梁，梁上抬梁，逐层缩短，最上层立脊瓜柱承脊檩。适用于宫殿、庙宇等大型建筑。代表：北京故宫太和殿。', N'Tailiang (post-and-beam) is the primary structural form of traditional Chinese architecture.', N'《华夏营造知识库》', 0.98, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(2, 'chuandou', '穿斗式结构', 'structure', N'穿斗式（立贴式）是南方常见木结构形式。特点：柱距较密，柱头直接承檩，以穿枋连接各柱形成框架。', N'Chuandou (column-and-tie) style is common in southern China.', N'《华夏营造知识库》', 0.98, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(3, 'wudian', '庑殿顶', 'structure', N'庑殿顶（四阿顶）是中国古建筑最高等级的屋顶形制。', N'Wudian (hip) roof is the highest-ranking roof style.', N'《华夏营造知识库》', 0.99, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(4, 'xieshan', '歇山顶', 'structure', N'歇山顶（九脊顶）等级仅次于庑殿顶。', N'Xieshan (hip-and-gable) roof ranks second to wudian.', N'《华夏营造知识库》', 0.98, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(5, 'dougong', '斗拱（铺作）', 'component', N'斗拱是中国古建筑特有的结构构件。', N'Dougong (bracket sets) is a unique structural component.', N'《华夏营造知识库》', 0.99, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(6, 'caifen', '材分制', 'philosophy', N'材分制是宋《营造法式》确立的模数制度。', N'The Cai-fen modular system was established in Song Dynasty.', N'《营造法式》', 0.98, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(7, 'tang_architecture', '唐代建筑特征', 'period', N'唐代建筑特征：气魄宏伟、斗拱硕大、屋面坡度平缓。', N'Tang Dynasty architecture features: grand scale, large bracket sets.', N'《华夏营造知识库》', 0.99, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(8, 'foguangsi', '佛光寺东大殿', 'famous', N'佛光寺东大殿（857年）位于山西五台山，是中国现存最早的木构建筑。', N'Foguang Temple East Hall (857 AD) is the earliest existing wooden structure.', N'《华夏营造知识库》', 0.99, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(9, 'sunmao', '榫卯结构', 'component', N'榫卯是中国古建筑木构件连接方式，不用钉子。', N'Mortise and tenon is the joining method without nails.', N'《华夏营造知识库》', 0.98, 1);
INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(10, 'yingxian', '应县木塔', 'famous', N'佛宫寺释迦塔（应县木塔）建于辽清宁二年（1056年），是世界现存最高最古的木塔。', N'Yingxian Wooden Pagoda (1056 AD) is the tallest existing wooden pagoda.', N'《华夏营造知识库》', 0.99, 1);
SET IDENTITY_INSERT dbo.kg_topics OFF;
GO
INSERT INTO dbo.kg_keywords ([topic_id], [keyword], [weight], [language]) VALUES
(1, '抬梁', 1.5, 'zh'), (1, '抬梁式', 1.5, 'zh'), (1, '叠梁', 1.2, 'zh'), (1, '梁柱', 1.0, 'zh'),
(2, '穿斗', 1.5, 'zh'), (2, '穿斗式', 1.5, 'zh'), (2, '立贴', 1.2, 'zh'), (2, '穿枋', 1.0, 'zh'),
(3, '庑殿', 1.5, 'zh'), (3, '庑殿顶', 1.5, 'zh'), (3, '四阿顶', 1.2, 'zh'), (3, '五脊顶', 1.0, 'zh'),
(4, '歇山', 1.5, 'zh'), (4, '歇山顶', 1.5, 'zh'), (4, '九脊顶', 1.2, 'zh'),
(5, '斗拱', 1.5, 'zh'), (5, '铺作', 1.5, 'zh'), (5, '斗口', 1.2, 'zh'), (5, '斗科', 1.0, 'zh'),
(6, '材分制', 1.5, 'zh'), (6, '营造法式', 1.2, 'zh'), (6, '模数', 1.0, 'zh'),
(7, '唐代', 1.5, 'zh'), (7, '唐', 1.0, 'zh'), (7, '佛光寺', 1.2, 'zh'),
(8, '佛光寺', 1.5, 'zh'), (8, '东大殿', 1.5, 'zh'), (8, '五台山', 1.0, 'zh'),
(9, '榫卯', 1.5, 'zh'), (9, '燕尾榫', 1.2, 'zh'), (9, '馒头榫', 1.0, 'zh'),
(10, '应县木塔', 1.5, 'zh'), (10, '释迦塔', 1.2, 'zh'), (10, '佛宫寺', 1.0, 'zh');
GO
INSERT INTO dbo.kg_relations ([from_topic_id], [to_topic_id], [relation_type], [description]) VALUES
(8, 7, 'belongs_to', '佛光寺东大殿是唐代建筑的典型代表'),
(10, 7, 'belongs_to', '应县木塔是辽代建筑，继承唐代风格'),
(1, 5, 'related_to', '抬梁式结构使用斗拱'),
(2, 5, 'related_to', '穿斗式结构使用斗拱'),
(3, 5, 'related_to', '庑殿顶使用斗拱'),
(4, 5, 'related_to', '歇山顶使用斗拱'),
(6, 5, 'related_to', '材分制以斗口为基本模数'),
(9, 1, 'related_to', '榫卯用于抬梁式结构'),
(9, 2, 'related_to', '榫卯用于穿斗式结构');
GO
PRINT 'Knowledge 数据库初始化完成';
GO

-- ============================================================
-- [5/10] 系统配置模块数据库 (System)
-- ============================================================
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

-- ============================================================
-- [6/10] 翻译管理模块数据库 (Translation)
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Translation')
BEGIN
    CREATE DATABASE [Translation];
END
GO

USE [Translation];
GO

-- ============================================
-- 1. 翻译主表 (translations)
-- ============================================
IF OBJECT_ID('dbo.translations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translations (
        [translation_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [entity_type] NVARCHAR(50) NOT NULL,
        [entity_id] INT NOT NULL,
        [field_name] NVARCHAR(50) NOT NULL,
        [language_code] NVARCHAR(10) NOT NULL,
        [source_text] NVARCHAR(MAX) NOT NULL,
        [translated_text] NVARCHAR(MAX) NOT NULL,
        [is_machine_translated] BIT DEFAULT 1,
        [review_status] NVARCHAR(20) DEFAULT 'pending',
        [quality_score] INT NULL,
        [review_notes] NVARCHAR(MAX) NULL,
        [reviewed_by] INT NULL,
        [reviewed_at] DATETIME NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_translations UNIQUE ([entity_type], [entity_id], [field_name], [language_code])
    );
END
GO

-- ============================================
-- 2. 翻译历史版本表 (translation_versions)
-- ============================================
IF OBJECT_ID('dbo.translation_versions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_versions (
        [version_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [translation_id] INT NOT NULL,
        [version_number] INT NOT NULL,
        [translated_text] NVARCHAR(MAX) NOT NULL,
        [is_machine_translated] BIT DEFAULT 1,
        [review_status] NVARCHAR(20) DEFAULT 'pending',
        [quality_score] INT NULL,
        [review_notes] NVARCHAR(MAX) NULL,
        [reviewed_by] INT NULL,
        [reviewed_at] DATETIME NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_translation_versions_translation FOREIGN KEY ([translation_id]) REFERENCES dbo.translations([translation_id]) ON DELETE CASCADE,
        CONSTRAINT UQ_translation_versions UNIQUE ([translation_id], [version_number])
    );
END
GO

-- ============================================
-- 3. 翻译审核记录表 (translation_reviews)
-- ============================================
IF OBJECT_ID('dbo.translation_reviews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_reviews (
        [review_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [translation_id] INT NOT NULL,
        [reviewer_id] INT NOT NULL,
        [review_status] NVARCHAR(20) NOT NULL,
        [review_notes] NVARCHAR(500) NULL,
        [quality_score] INT NULL,
        [reviewed_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_translation_reviews_translation FOREIGN KEY ([translation_id]) REFERENCES dbo.translations([translation_id]),
        CONSTRAINT CHK_review_status CHECK ([review_status] IN ('pending', 'approved', 'rejected'))
    );
END
GO

-- ============================================
-- 4. 翻译记忆库表 (translation_memory)
-- ============================================
IF OBJECT_ID('dbo.translation_memory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_memory (
        [memory_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [source_text] NVARCHAR(MAX) NOT NULL,
        [target_text] NVARCHAR(MAX) NOT NULL,
        [source_language] NVARCHAR(10) NOT NULL,
        [target_language] NVARCHAR(10) NOT NULL,
        [entity_type] NVARCHAR(50) NULL,
        [usage_count] INT DEFAULT 1,
        [last_used_at] DATETIME DEFAULT GETDATE(),
        [quality_score] INT DEFAULT 100,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================
-- 5. 翻译统计信息表 (translation_stats)
-- ============================================
IF OBJECT_ID('dbo.translation_stats', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_stats (
        [stat_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [entity_type] NVARCHAR(50) NOT NULL,
        [language_code] NVARCHAR(10) NOT NULL,
        [total_count] INT DEFAULT 0,
        [pending_count] INT DEFAULT 0,
        [approved_count] INT DEFAULT 0,
        [rejected_count] INT DEFAULT 0,
        [machine_translated_count] INT DEFAULT 0,
        [human_translated_count] INT DEFAULT 0,
        [average_quality_score] DECIMAL(5,2) NULL,
        [last_update] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_translation_stats UNIQUE ([entity_type], [language_code])
    );
END
GO

-- ============================================
-- 6. 创建索引
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_entity' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE NONCLUSTERED INDEX [idx_translations_entity] ON dbo.translations([entity_type], [entity_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_language' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE NONCLUSTERED INDEX [idx_translations_language] ON dbo.translations([language_code]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_status' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE NONCLUSTERED INDEX [idx_translations_status] ON dbo.translations([review_status]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_memory_source' AND object_id = OBJECT_ID('dbo.translation_memory'))
    CREATE NONCLUSTERED INDEX [idx_translation_memory_source] ON dbo.translation_memory([source_language], [target_language]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_stats_entity' AND object_id = OBJECT_ID('dbo.translation_stats'))
    CREATE NONCLUSTERED INDEX [idx_translation_stats_entity] ON dbo.translation_stats([entity_type]);
GO

-- ============================================
-- 7. 更新时间触发器
-- ============================================
IF OBJECT_ID('tr_translations_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_translations_updated_at;
GO

CREATE TRIGGER tr_translations_updated_at
ON dbo.translations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.translations
    SET [updated_at] = GETDATE()
    FROM dbo.translations t
    INNER JOIN inserted i ON t.[translation_id] = i.[translation_id];
END
GO

-- ============================================
-- 8. 存储过程
-- ============================================

-- 获取实体翻译
IF OBJECT_ID('dbo.sp_translation_get', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_get;
GO
CREATE PROCEDURE dbo.sp_translation_get
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @language_code NVARCHAR(10) = 'en'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [translation_id], [entity_type], [entity_id], [field_name], [language_code], 
           [source_text], [translated_text], [is_machine_translated], [review_status], 
           [quality_score], [reviewed_by], [reviewed_at]
    FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [entity_id] = @entity_id AND [language_code] = @language_code;
END
GO

-- 获取实体所有翻译
IF OBJECT_ID('dbo.sp_translation_get_by_entity', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_get_by_entity;
GO
CREATE PROCEDURE dbo.sp_translation_get_by_entity
    @entity_type NVARCHAR(50),
    @entity_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [translation_id], [entity_type], [entity_id], [field_name], [language_code], 
           [source_text], [translated_text], [is_machine_translated], [review_status], 
           [quality_score], [reviewed_by], [reviewed_at], [created_at], [updated_at]
    FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [entity_id] = @entity_id
    ORDER BY [language_code], [field_name];
END
GO

-- 批量获取翻译
IF OBJECT_ID('dbo.sp_translation_batch_get', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_batch_get;
GO
CREATE PROCEDURE dbo.sp_translation_batch_get
    @entity_type NVARCHAR(50),
    @language_code NVARCHAR(10) = 'en'
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [entity_id], [field_name], [translated_text], [review_status], [is_machine_translated]
    FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [language_code] = @language_code
    ORDER BY [entity_id], [field_name];
END
GO

-- 添加/更新翻译（带版本控制）
IF OBJECT_ID('dbo.sp_translation_upsert', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_upsert;
GO
CREATE PROCEDURE dbo.sp_translation_upsert
    @entity_type NVARCHAR(50),
    @entity_id INT,
    @field_name NVARCHAR(50),
    @language_code NVARCHAR(10),
    @source_text NVARCHAR(MAX),
    @translated_text NVARCHAR(MAX),
    @is_machine_translated BIT = 1,
    @review_status NVARCHAR(20) = 'pending'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @existing_id INT;
    DECLARE @version_number INT;

    SELECT @existing_id = [translation_id]
    FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [entity_id] = @entity_id 
      AND [field_name] = @field_name AND [language_code] = @language_code;

    IF @existing_id IS NOT NULL
    BEGIN
        SELECT @version_number = COALESCE(MAX([version_number]), 0) + 1
        FROM dbo.translation_versions
        WHERE [translation_id] = @existing_id;

        INSERT INTO dbo.translation_versions ([translation_id], [version_number], [translated_text], 
            [is_machine_translated], [review_status])
        SELECT @existing_id, @version_number, [translated_text], [is_machine_translated], [review_status]
        FROM dbo.translations
        WHERE [translation_id] = @existing_id;

        UPDATE dbo.translations
        SET [translated_text] = @translated_text, [is_machine_translated] = @is_machine_translated,
            [review_status] = @review_status, [source_text] = @source_text
        WHERE [translation_id] = @existing_id;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.translations ([entity_type], [entity_id], [field_name], [language_code], 
            [source_text], [translated_text], [is_machine_translated], [review_status])
        VALUES (@entity_type, @entity_id, @field_name, @language_code, 
            @source_text, @translated_text, @is_machine_translated, @review_status);
    END
END
GO

-- 审核翻译
IF OBJECT_ID('dbo.sp_translation_review', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_review;
GO
CREATE PROCEDURE dbo.sp_translation_review
    @translation_id INT,
    @reviewer_id INT,
    @review_status NVARCHAR(20),
    @review_notes NVARCHAR(500) = NULL,
    @quality_score INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.translation_reviews ([translation_id], [reviewer_id], [review_status], [review_notes], [quality_score])
    VALUES (@translation_id, @reviewer_id, @review_status, @review_notes, @quality_score);

    UPDATE dbo.translations
    SET [review_status] = @review_status, [review_notes] = @review_notes,
        [quality_score] = @quality_score, [reviewed_by] = @reviewer_id, [reviewed_at] = GETDATE()
    WHERE [translation_id] = @translation_id;
END
GO

-- 删除翻译（级联删除版本和审核记录）
IF OBJECT_ID('dbo.sp_translation_delete', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_delete;
GO
CREATE PROCEDURE dbo.sp_translation_delete
    @translation_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.translations WHERE [translation_id] = @translation_id;
    SELECT @@ROWCOUNT AS deleted;
END
GO

-- 搜索翻译
IF OBJECT_ID('dbo.sp_translation_search', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_search;
GO
CREATE PROCEDURE dbo.sp_translation_search
    @keyword NVARCHAR(200),
    @language_code NVARCHAR(10) = NULL,
    @review_status NVARCHAR(20) = NULL,
    @entity_type NVARCHAR(50) = NULL,
    @page INT = 1,
    @page_size INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;

    SELECT [translation_id], [entity_type], [entity_id], [field_name], [language_code],
           [source_text], [translated_text], [is_machine_translated], [review_status],
           [quality_score], [reviewed_by], [reviewed_at], [created_at], [updated_at]
    FROM dbo.translations
    WHERE ([source_text] LIKE '%' + @keyword + '%' OR [translated_text] LIKE '%' + @keyword + '%')
      AND (@language_code IS NULL OR [language_code] = @language_code)
      AND (@review_status IS NULL OR [review_status] = @review_status)
      AND (@entity_type IS NULL OR [entity_type] = @entity_type)
    ORDER BY [created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
END
GO

-- 获取翻译统计
IF OBJECT_ID('dbo.sp_translation_stats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_stats;
GO
CREATE PROCEDURE dbo.sp_translation_stats
    @entity_type NVARCHAR(50) = NULL,
    @language_code NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        [entity_type],
        [language_code],
        COUNT(*) AS total_count,
        SUM(CASE WHEN [review_status] = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN [review_status] = 'approved' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN [review_status] = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN [is_machine_translated] = 1 THEN 1 ELSE 0 END) AS machine_translated_count,
        SUM(CASE WHEN [is_machine_translated] = 0 THEN 1 ELSE 0 END) AS human_translated_count,
        AVG(CAST([quality_score] AS DECIMAL(5,2))) AS average_quality_score
    FROM dbo.translations
    WHERE (@entity_type IS NULL OR [entity_type] = @entity_type)
      AND (@language_code IS NULL OR [language_code] = @language_code)
    GROUP BY [entity_type], [language_code];
END
GO

-- 获取翻译历史版本
IF OBJECT_ID('dbo.sp_translation_get_versions', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_get_versions;
GO
CREATE PROCEDURE dbo.sp_translation_get_versions
    @translation_id INT,
    @page INT = 1,
    @page_size INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @page_size;

    SELECT [version_id], [version_number], [translated_text], [is_machine_translated],
           [review_status], [quality_score], [review_notes], [reviewed_by], [reviewed_at], [created_at]
    FROM dbo.translation_versions
    WHERE [translation_id] = @translation_id
    ORDER BY [version_number] DESC
    OFFSET @offset ROWS FETCH NEXT @page_size ROWS ONLY;
END
GO

-- 恢复翻译版本
IF OBJECT_ID('dbo.sp_translation_restore_version', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_restore_version;
GO
CREATE PROCEDURE dbo.sp_translation_restore_version
    @translation_id INT,
    @version_number INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @translated_text NVARCHAR(MAX);

    SELECT @translated_text = [translated_text]
    FROM dbo.translation_versions
    WHERE [translation_id] = @translation_id AND [version_number] = @version_number;

    IF @translated_text IS NOT NULL
    BEGIN
        UPDATE dbo.translations
        SET [translated_text] = @translated_text, [review_status] = 'pending', [reviewed_by] = NULL, [reviewed_at] = NULL
        WHERE [translation_id] = @translation_id;
    END
END
GO

-- 添加翻译记忆
IF OBJECT_ID('dbo.sp_translation_memory_add', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_memory_add;
GO
CREATE PROCEDURE dbo.sp_translation_memory_add
    @source_text NVARCHAR(MAX),
    @target_text NVARCHAR(MAX),
    @source_language NVARCHAR(10),
    @target_language NVARCHAR(10),
    @entity_type NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.translation_memory WHERE [source_text] = @source_text 
               AND [source_language] = @source_language AND [target_language] = @target_language)
    BEGIN
        UPDATE dbo.translation_memory
        SET [target_text] = @target_text, [usage_count] = [usage_count] + 1, 
            [last_used_at] = GETDATE()
        WHERE [source_text] = @source_text AND [source_language] = @source_language 
          AND [target_language] = @target_language;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.translation_memory ([source_text], [target_text], [source_language], 
            [target_language], [entity_type])
        VALUES (@source_text, @target_text, @source_language, @target_language, @entity_type);
    END
END
GO

-- 查询翻译记忆
IF OBJECT_ID('dbo.sp_translation_memory_search', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_memory_search;
GO
CREATE PROCEDURE dbo.sp_translation_memory_search
    @source_text NVARCHAR(MAX),
    @source_language NVARCHAR(10),
    @target_language NVARCHAR(10),
    @max_results INT = 5
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@max_results) [memory_id], [source_text], [target_text], [quality_score], [usage_count], [last_used_at]
    FROM dbo.translation_memory
    WHERE [source_language] = @source_language AND [target_language] = @target_language
      AND [source_text] LIKE '%' + @source_text + '%'
    ORDER BY [usage_count] DESC, [quality_score] DESC;
END
GO

-- 批量操作翻译
IF OBJECT_ID('dbo.sp_translation_batch_update', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_batch_update;
GO
CREATE PROCEDURE dbo.sp_translation_batch_update
    @entity_type NVARCHAR(50),
    @language_code NVARCHAR(10),
    @review_status NVARCHAR(20),
    @entity_ids NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @idTable TABLE (id INT);
    INSERT INTO @idTable SELECT value FROM STRING_SPLIT(@entity_ids, ',');

    UPDATE dbo.translations
    SET [review_status] = @review_status
    WHERE [entity_type] = @entity_type AND [language_code] = @language_code
      AND [entity_id] IN (SELECT id FROM @idTable);

    SELECT @@ROWCOUNT AS updated;
END
GO

-- 删除实体的所有翻译
IF OBJECT_ID('dbo.sp_translation_delete_by_entity', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_translation_delete_by_entity;
GO
CREATE PROCEDURE dbo.sp_translation_delete_by_entity
    @entity_type NVARCHAR(50),
    @entity_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.translations
    WHERE [entity_type] = @entity_type AND [entity_id] = @entity_id;
    SELECT @@ROWCOUNT AS deleted;
END
GO

PRINT 'Translation 数据库初始化完成';

-- ============================================================
-- [7/10] 活动模块数据库 (Activity)
-- ============================================================
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
IF OBJECT_ID('dbo.vw_user_checkin_stats', 'V') IS NOT NULL
    DROP VIEW dbo.vw_user_checkin_stats;
GO

CREATE VIEW dbo.vw_user_checkin_stats AS
SELECT
    [user_id],
    COUNT(*) AS total_checkins,
    MAX([streak_count]) AS max_streak,
    SUM([points_earned]) AS total_points,
    MAX([checkin_date]) AS last_checkin_date,
    COUNT(CASE WHEN [checkin_date] >= DATEADD(DAY, -7, GETDATE()) THEN 1 END) AS weekly_checkins,
    COUNT(CASE WHEN [checkin_date] >= DATEADD(DAY, -30, GETDATE()) THEN 1 END) AS monthly_checkins
FROM dbo.daily_checkin
GROUP BY [user_id];
GO

-- 打卡索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_checkin_user_date' AND object_id = OBJECT_ID('dbo.daily_checkin'))
    CREATE INDEX idx_checkin_user_date ON [daily_checkin]([user_id], [checkin_date]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_checkin_date' AND object_id = OBJECT_ID('dbo.daily_checkin'))
    CREATE INDEX idx_checkin_date ON [daily_checkin]([checkin_date]);
GO

-- 存储过程：用户打卡
IF OBJECT_ID('dbo.sp_user_checkin', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_user_checkin;
GO

CREATE PROCEDURE dbo.sp_user_checkin
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

    -- 检查是否已打卡
    IF EXISTS (SELECT 1 FROM dbo.daily_checkin WHERE [user_id] = @user_id AND [checkin_date] = @target_date)
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

    -- 获取连续打卡天数
    SELECT @streak = [streak_count] + 1
    FROM dbo.daily_checkin
    WHERE [user_id] = @user_id AND [checkin_date] = @yesterday;

    IF @streak IS NULL OR @streak = 0 SET @streak = 1;

    -- 根据连续打卡天数计算积分
    IF @streak >= 7 SET @points = 50;
    ELSE IF @streak >= 5 SET @points = 30;
    ELSE IF @streak >= 3 SET @points = 20;

    -- 插入打卡记录
    INSERT INTO dbo.daily_checkin (
        [user_id], [checkin_date], [checkin_time],
        [streak_count], [points_earned], [device_type], [device_info]
    ) VALUES (
                 @user_id, @target_date, GETDATE(), @streak, @points, @device_type, @device_info
             );

    -- 返回成功结果
    SELECT
        CAST(1 AS BIT) AS [success],
        N'打卡成功' AS [message],
        SCOPE_IDENTITY() AS [checkin_id],
        @streak AS [streak_count],
        @points AS [points_earned],
        CAST(0 AS BIT) AS [already_checked];
END
GO

-- 存储过程：获取用户打卡记录
IF OBJECT_ID('dbo.sp_get_user_checkins', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_get_user_checkins;
GO

CREATE PROCEDURE dbo.sp_get_user_checkins
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
    FROM dbo.daily_checkin
    WHERE [user_id] = @user_id
    ORDER BY [checkin_date] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- 存储过程：获取用户打卡统计
IF OBJECT_ID('dbo.sp_get_user_checkin_stats', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_get_user_checkin_stats;
GO

CREATE PROCEDURE dbo.sp_get_user_checkin_stats
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
    FROM dbo.vw_user_checkin_stats
    WHERE [user_id] = @user_id;
END
GO

-- 存储过程：检查今日是否已打卡
IF OBJECT_ID('dbo.sp_check_today_checkin', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_check_today_checkin;
GO

CREATE PROCEDURE dbo.sp_check_today_checkin
@user_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @today DATE = CAST(GETDATE() AS DATE);

    SELECT
        CASE WHEN EXISTS (
            SELECT 1 FROM dbo.daily_checkin
            WHERE [user_id] = @user_id AND [checkin_date] = @today
        )
                 THEN CAST(1 AS BIT)
             ELSE CAST(0 AS BIT)
            END AS [checked_today];
END
GO

-- 存储过程：获取打卡日历数据
IF OBJECT_ID('dbo.sp_get_checkin_calendar', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_get_checkin_calendar;
GO

CREATE PROCEDURE dbo.sp_get_checkin_calendar
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
    FROM dbo.daily_checkin
    WHERE [user_id] = @user_id
      AND [checkin_date] >= @startDate
      AND [checkin_date] <= @endDate
    ORDER BY [checkin_date];
END
GO

PRINT 'Activity 数据库初始化完成';

-- ============================================================
-- [8/10] 竞赛模块数据库 (Competition)
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Competition')
BEGIN
    CREATE DATABASE [Competition];
END
GO
USE [Competition];
GO

-- ============================================
-- 1. 竞赛模式表
-- ============================================
IF OBJECT_ID('dbo.competition_mode', 'U') IS NULL
BEGIN
    CREATE TABLE [competition_mode] (
        [mode_id] VARCHAR(50) NOT NULL PRIMARY KEY,
        [title] NVARCHAR(50) NOT NULL,
        [description] NVARCHAR(255) NULL,
        [difficulty] NVARCHAR(20) NULL,
        [time_limit] INT NOT NULL DEFAULT 600,
        [icon] NVARCHAR(20) NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [sort_order] INT NOT NULL DEFAULT 0
    );
    ALTER TABLE [competition_mode] ADD CONSTRAINT CK_time_limit CHECK ([time_limit] >= 0);
END
GO

-- ============================================
-- 2. 每日挑战表
-- ============================================
IF OBJECT_ID('dbo.daily_challenge', 'U') IS NULL
BEGIN
    CREATE TABLE [daily_challenge] (
        [challenge_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [challenge_date] DATE NOT NULL UNIQUE,
        [title] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [image_url] VARCHAR(255) NULL,
        [difficulty] NVARCHAR(20) NOT NULL DEFAULT N'困难',
        [points_reward] INT NOT NULL DEFAULT 100,
        [question_count] INT NOT NULL DEFAULT 5,
        [time_limit] INT NOT NULL DEFAULT 300,
        [external_building_ids] NVARCHAR(MAX) NULL
    );
    ALTER TABLE [daily_challenge] ADD CONSTRAINT CK_challenge_points_reward CHECK ([points_reward] >= 0);
    ALTER TABLE [daily_challenge] ADD CONSTRAINT CK_challenge_question_count CHECK ([question_count] > 0);
    ALTER TABLE [daily_challenge] ADD CONSTRAINT CK_challenge_time_limit CHECK ([time_limit] >= 0);
END
GO

-- ============================================
-- 3. 竞赛题目表
-- ============================================
IF OBJECT_ID('dbo.question', 'U') IS NULL
BEGIN
    CREATE TABLE [question] (
        [question_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_building_id] INT NOT NULL,
        [question_text] NVARCHAR(MAX) NOT NULL,
        [option_a] NVARCHAR(255) NOT NULL,
        [option_b] NVARCHAR(255) NOT NULL,
        [option_c] NVARCHAR(255) NULL,
        [option_d] NVARCHAR(255) NULL,
        [correct_answer] CHAR(1) NOT NULL,
        [explanation] NVARCHAR(MAX) NULL,
        [difficulty] NVARCHAR(20) NOT NULL DEFAULT 'medium',
        [points] INT NOT NULL DEFAULT 5,
        [created_at] DATETIME DEFAULT GETDATE(),
        [category] VARCHAR(50) NULL
    );
    ALTER TABLE [question] ADD CONSTRAINT CK_question_building_id CHECK ([external_building_id] > 0);
    ALTER TABLE [question] ADD CONSTRAINT CK_correct_answer CHECK ([correct_answer] IN ('A','B','C','D'));
    ALTER TABLE [question] ADD CONSTRAINT CK_question_difficulty CHECK ([difficulty] IN (N'入门', N'基础', N'挑战', N'进阶', N'资深'));
    ALTER TABLE [question] ADD CONSTRAINT CK_question_points CHECK ([points] >= 0);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_difficulty' AND object_id = OBJECT_ID('dbo.question'))
    CREATE INDEX [idx_difficulty] ON dbo.[question]([difficulty]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_category' AND object_id = OBJECT_ID('dbo.question'))
    CREATE INDEX [idx_category] ON dbo.[question]([category]);
GO

-- ============================================
-- 4. 题目标签表
-- ============================================
IF OBJECT_ID('dbo.question_tags', 'U') IS NULL
BEGIN
    CREATE TABLE [question_tags] (
        [tag_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [tag_name] NVARCHAR(50) NOT NULL UNIQUE,
        [category] VARCHAR(50) NULL
    );
END
GO

-- ============================================
-- 5. 题目-标签关联表
-- ============================================
IF OBJECT_ID('dbo.question_tag_mappings', 'U') IS NULL
BEGIN
    CREATE TABLE [question_tag_mappings] (
        [question_id] INT NOT NULL,
        [tag_id] INT NOT NULL,
        CONSTRAINT [PK_question_tag_mappings] PRIMARY KEY ([question_id], [tag_id]),
        CONSTRAINT [FK_question_tag_mappings_question]
        FOREIGN KEY ([question_id]) REFERENCES [question]([question_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 6. 用户答题记录表
-- ============================================
IF OBJECT_ID('dbo.user_answer_history', 'U') IS NULL
BEGIN
    CREATE TABLE [user_answer_history] (
        [record_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_user_id] INT NOT NULL,
        [question_id] INT NOT NULL,
        [selected_answer] CHAR(1) NOT NULL,
        [is_correct] BIT NOT NULL,
        [points_earned] INT NOT NULL DEFAULT 0,
        [answered_at] DATETIME DEFAULT GETDATE(),
        [session_id] VARCHAR(100) NULL,
        [competition_mode] VARCHAR(50) NULL,
        [difficulty_level] NVARCHAR(20) NULL
    );
    ALTER TABLE [user_answer_history] ADD CONSTRAINT CK_answer_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE [user_answer_history] ADD CONSTRAINT CK_selected_answer CHECK ([selected_answer] IN ('A','B','C','D'));
    ALTER TABLE [user_answer_history] ADD CONSTRAINT CK_points_earned CHECK ([points_earned] >= 0);
    ALTER TABLE [user_answer_history] ADD CONSTRAINT CK_difficulty_level CHECK ([difficulty_level] IS NULL OR [difficulty_level] IN (N'入门', N'基础', N'挑战', N'进阶', N'资深'));
    ALTER TABLE [user_answer_history]
        ADD CONSTRAINT [FK_user_answer_history_question]
        FOREIGN KEY ([question_id]) REFERENCES [question]([question_id]) ON DELETE CASCADE;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_question' AND object_id = OBJECT_ID('dbo.user_answer_history'))
    CREATE INDEX [idx_user_question] ON dbo.[user_answer_history]([external_user_id], [question_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_time' AND object_id = OBJECT_ID('dbo.user_answer_history'))
    CREATE INDEX [idx_user_time] ON dbo.[user_answer_history]([external_user_id], [answered_at]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_question' AND object_id = OBJECT_ID('dbo.user_answer_history'))
    CREATE INDEX [idx_question] ON dbo.[user_answer_history]([question_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_difficulty_level' AND object_id = OBJECT_ID('dbo.user_answer_history'))
    CREATE INDEX [idx_difficulty_level] ON dbo.[user_answer_history]([difficulty_level]);
GO

-- ============================================
-- 7. 用户竞赛积分总表
-- ============================================
IF OBJECT_ID('dbo.user_competition_points', 'U') IS NULL
BEGIN
    CREATE TABLE [user_competition_points] (
        [record_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_user_id] INT NOT NULL,
        [total_points] INT NOT NULL DEFAULT 0,
        [entry_points] INT NOT NULL DEFAULT 0,
        [basic_points] INT NOT NULL DEFAULT 0,
        [challenge_points] INT NOT NULL DEFAULT 0,
        [advanced_points] INT NOT NULL DEFAULT 0,
        [expert_points] INT NOT NULL DEFAULT 0,
        [current_level] INT NOT NULL DEFAULT 1,
        [games_played] INT NOT NULL DEFAULT 0,
        [total_correct] INT NOT NULL DEFAULT 0,
        [total_questions] INT NOT NULL DEFAULT 0,
        [updated_at] DATETIME DEFAULT GETDATE()
    );
    ALTER TABLE [user_competition_points] ADD CONSTRAINT UQ_user_competition_points_user UNIQUE ([external_user_id]);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_ucp_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_total_points CHECK ([total_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_entry_points CHECK ([entry_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_basic_points CHECK ([basic_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_challenge_points CHECK ([challenge_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_advanced_points CHECK ([advanced_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_expert_points CHECK ([expert_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_current_level CHECK ([current_level] >= 1 AND [current_level] <= 5);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_games_played CHECK ([games_played] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_total_correct CHECK ([total_correct] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_total_questions CHECK ([total_questions] >= 0);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_points' AND object_id = OBJECT_ID('dbo.user_competition_points'))
    CREATE INDEX [idx_user_points] ON dbo.[user_competition_points]([external_user_id], [total_points]);
GO

-- ============================================
-- 8. 积分变动记录表
-- ============================================
IF OBJECT_ID('dbo.points_transaction', 'U') IS NULL
BEGIN
    CREATE TABLE [points_transaction] (
        [transaction_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_user_id] INT NOT NULL,
        [points_change] INT NOT NULL,
        [transaction_type] VARCHAR(50) NOT NULL,
        [reference_id] VARCHAR(100) NULL,
        [difficulty_level] NVARCHAR(20) NULL,
        [description] NVARCHAR(255) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
    ALTER TABLE [points_transaction] ADD CONSTRAINT CK_pt_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE [points_transaction] ADD CONSTRAINT CK_transaction_type CHECK ([transaction_type] IN ('game_complete', 'daily_bonus', 'achievement', 'difficulty_bonus', 'streak_bonus'));
    ALTER TABLE [points_transaction] ADD CONSTRAINT CK_pt_difficulty_level CHECK ([difficulty_level] IS NULL OR [difficulty_level] IN (N'入门', N'基础', N'挑战', N'进阶', N'资深'));
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_transaction' AND object_id = OBJECT_ID('dbo.points_transaction'))
    CREATE INDEX [idx_user_transaction] ON dbo.[points_transaction]([external_user_id], [created_at]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_transaction_type' AND object_id = OBJECT_ID('dbo.points_transaction'))
    CREATE INDEX [idx_transaction_type] ON dbo.[points_transaction]([transaction_type]);
GO

-- ============================================
-- 9. 防重复答题缓存表
-- ============================================
IF OBJECT_ID('dbo.user_question_cache', 'U') IS NULL
BEGIN
    CREATE TABLE [user_question_cache] (
        [cache_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_user_id] INT NOT NULL,
        [question_id] INT NOT NULL,
        [last_answered_at] DATETIME DEFAULT GETDATE(),
        [correct_count] INT NOT NULL DEFAULT 0,
        [total_attempts] INT NOT NULL DEFAULT 1
    );
    ALTER TABLE [user_question_cache] ADD CONSTRAINT CK_cache_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE [user_question_cache] ADD CONSTRAINT CK_correct_count CHECK ([correct_count] >= 0);
    ALTER TABLE [user_question_cache] ADD CONSTRAINT CK_total_attempts CHECK ([total_attempts] > 0);
    ALTER TABLE [user_question_cache] ADD CONSTRAINT [UQ_user_question] UNIQUE ([external_user_id], [question_id]);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'idx_user'
      AND object_id = OBJECT_ID('dbo.user_question_cache')
)
    BEGIN
        CREATE NONCLUSTERED INDEX idx_user
            ON dbo.user_question_cache (user_id);
    END
GO

-- ============================================
-- 10. 默认模式数据
-- ============================================
MERGE INTO [competition_mode] AS target
USING (
    VALUES
    ('entry', N'入门模式', N'5道简单题目，适合初学者', N'入门', 180, N'🌱', 1, 1),
    ('basic', N'基础模式', N'8道基础题目，巩固知识', N'基础', 240, N'📚', 1, 2),
    ('challenge', N'挑战模式', N'10道中等难度题目', N'挑战', 300, N'⚡', 1, 3),
    ('advanced', N'进阶模式', N'12道较难题目，考验深度', N'进阶', 360, N'🏛️', 1, 4),
    ('expert', N'专家模式', N'15道高难度题目，大师挑战', N'资深', 480, N'👑', 1, 5)
) AS source ([mode_id], [title], [description], [difficulty], [time_limit], [icon], [is_active], [sort_order])
ON target.[mode_id] = source.[mode_id]
WHEN NOT MATCHED THEN
    INSERT ([mode_id], [title], [description], [difficulty], [time_limit], [icon], [is_active], [sort_order])
    VALUES (source.[mode_id], source.[title], source.[description], source.[difficulty], source.[time_limit], source.[icon], source.[is_active], source.[sort_order]);
GO

PRINT 'Competition 数据库初始化完成';

-- ============================================================
-- [9/10] 社区模块数据库 (Social)
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Social')
BEGIN
    CREATE DATABASE [Social];
END
GO

USE [Social];
GO

-- ============================================
-- 论坛板块表
-- ============================================
IF OBJECT_ID('dbo.forum_boards', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.forum_boards (
        [board_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [board_name] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(500) NULL,
        [icon] VARCHAR(50) NULL,
        [sort_order] INT DEFAULT 0,
        [topic_count] INT DEFAULT 0,
        [post_count] INT DEFAULT 0,
        [is_active] BIT DEFAULT 1,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- 初始化论坛板块
IF NOT EXISTS (SELECT 1 FROM dbo.forum_boards)
BEGIN
    INSERT INTO dbo.forum_boards ([board_name], [description], [sort_order]) VALUES
    (N'古建知识', N'探讨中国古建筑的历史、结构与文化内涵', 1),
    (N'3D建模交流', N'分享3D建模技巧、作品与经验', 2),
    (N'建筑赏析', N'赏析经典古建筑，分享心得体会', 3),
    (N'技术问答', N'提问与解答古建筑相关的技术问题', 4),
    (N'社区公告', N'网站更新、活动通知与社区规则', 5);
END
GO

-- ============================================
-- 论坛主题表
-- ============================================
IF OBJECT_ID('dbo.forum_topics', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.forum_topics (
        [topic_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [board_id] INT NOT NULL,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(50) NOT NULL,
        [title] NVARCHAR(200) NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [is_pinned] BIT DEFAULT 0,
        [is_locked] BIT DEFAULT 0,
        [view_count] INT DEFAULT 0,
        [reply_count] INT DEFAULT 0,
        [last_reply_at] DATETIME DEFAULT GETDATE(),
        [last_reply_user] NVARCHAR(50) NULL,
        [status] NVARCHAR(20) DEFAULT 'approved',
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_topics_board FOREIGN KEY ([board_id]) REFERENCES dbo.forum_boards([board_id]) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_topics_board' AND object_id = OBJECT_ID('dbo.forum_topics'))
    CREATE INDEX [idx_topics_board] ON dbo.forum_topics([board_id], [is_pinned] DESC, [last_reply_at] DESC);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_topics_user' AND object_id = OBJECT_ID('dbo.forum_topics'))
    CREATE INDEX [idx_topics_user] ON dbo.forum_topics([user_id]);
GO

-- ============================================
-- 论坛回复表
-- ============================================
IF OBJECT_ID('dbo.forum_replies', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.forum_replies (
        [reply_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [topic_id] INT NOT NULL,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(50) NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [floor_number] INT NOT NULL,
        [status] NVARCHAR(20) DEFAULT 'approved',
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_replies_topic FOREIGN KEY ([topic_id]) REFERENCES dbo.forum_topics([topic_id]) ON DELETE CASCADE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_replies_topic' AND object_id = OBJECT_ID('dbo.forum_replies'))
    CREATE INDEX [idx_replies_topic] ON dbo.forum_replies([topic_id], [floor_number]);
GO

-- ============================================
-- 建筑分享表（用户公开的3D模型在这里展示）
-- ============================================
IF OBJECT_ID('dbo.building_shares', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.building_shares (
        [share_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(50) NOT NULL,
        [model_id] INT NULL,                -- 关联user_models
        [title] NVARCHAR(200) NOT NULL,
        [description] NVARCHAR(1000) NULL,
        [thumbnail_url] VARCHAR(500) NULL,
        [model_data] NVARCHAR(MAX) NULL,    -- 3D模型JSON
        [era] NVARCHAR(50) NULL,            -- 朝代
        [building_type] NVARCHAR(50) NULL,  -- 建筑类型
        [tags] NVARCHAR(200) NULL,
        [likes] INT DEFAULT 0,
        [views] INT DEFAULT 0,
        [downloads] INT DEFAULT 0,
        [is_featured] BIT DEFAULT 0,
        [status] NVARCHAR(20) DEFAULT 'approved',
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_shares_featured' AND object_id = OBJECT_ID('dbo.building_shares'))
    CREATE INDEX [idx_shares_featured] ON dbo.building_shares([is_featured] DESC, [created_at] DESC);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_shares_user' AND object_id = OBJECT_ID('dbo.building_shares'))
    CREATE INDEX [idx_shares_user] ON dbo.building_shares([user_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_shares_search' AND object_id = OBJECT_ID('dbo.building_shares'))
    CREATE INDEX [idx_shares_search] ON dbo.building_shares([title], [building_type], [era]);
GO

-- ============================================
-- 评论表（扩展之前的，支持建筑/模型/分享）
-- ============================================
IF OBJECT_ID('dbo.comments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.comments (
        [comment_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(50) NOT NULL,
        [target_type] NVARCHAR(20) NOT NULL,    -- architecture / model / share / topic
        [target_id] INT NOT NULL,
        [parent_id] INT NULL,
        [content] NVARCHAR(1000) NOT NULL,
        [likes] INT DEFAULT 0,
        [is_deleted] BIT DEFAULT 0,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_comments_parent FOREIGN KEY ([parent_id]) REFERENCES dbo.comments([comment_id])
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_comments_target' AND object_id = OBJECT_ID('dbo.comments'))
    CREATE INDEX [idx_comments_target] ON dbo.comments([target_type], [target_id], [is_deleted], [created_at] DESC);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_comments_user' AND object_id = OBJECT_ID('dbo.comments'))
    CREATE INDEX [idx_comments_user] ON dbo.comments([user_id], [is_deleted]);
GO

-- ============================================
-- 点赞记录表
-- ============================================
IF OBJECT_ID('dbo.likes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.likes (
        [like_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [target_type] NVARCHAR(20) NOT NULL,    -- share / topic / reply / comment
        [target_id] INT NOT NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_likes UNIQUE ([user_id], [target_type], [target_id])
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_likes_target' AND object_id = OBJECT_ID('dbo.likes'))
    CREATE INDEX [idx_likes_target] ON dbo.likes([target_type], [target_id]);
GO

-- ============================================
-- 存储过程
-- ============================================

-- 获取论坛板块列表
IF OBJECT_ID('dbo.sp_forum_boards', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_forum_boards;
GO
CREATE PROCEDURE dbo.sp_forum_boards
AS
BEGIN
    SET NOCOUNT ON;
    SELECT b.*, (SELECT COUNT(*) FROM dbo.forum_topics t WHERE t.[board_id] = b.[board_id] AND t.[status] = 'approved') AS [topic_count]
    FROM dbo.forum_boards b
    WHERE b.[is_active] = 1
    ORDER BY b.[sort_order];
END
GO

-- 获取主题列表
IF OBJECT_ID('dbo.sp_forum_topics', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_forum_topics;
GO
CREATE PROCEDURE dbo.sp_forum_topics
    @board_id INT = NULL,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT * FROM dbo.forum_topics
    WHERE [status] = 'approved' AND (@board_id IS NULL OR [board_id] = @board_id)
    ORDER BY [is_pinned] DESC, [last_reply_at] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- 获取建筑分享列表
IF OBJECT_ID('dbo.sp_building_shares', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_building_shares;
GO
CREATE PROCEDURE dbo.sp_building_shares
    @search NVARCHAR(200) = NULL,
    @era NVARCHAR(50) = NULL,
    @building_type NVARCHAR(50) = NULL,
    @featured_only BIT = 0,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT * FROM dbo.building_shares
    WHERE [status] = 'approved'
      AND (@featured_only = 0 OR [is_featured] = 1)
      AND (@search IS NULL OR [title] LIKE '%' + @search + '%' OR [description] LIKE '%' + @search + '%' OR [tags] LIKE '%' + @search + '%')
      AND (@era IS NULL OR [era] = @era)
      AND (@building_type IS NULL OR [building_type] = @building_type)
    ORDER BY [is_featured] DESC, [created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- 获取用户评论
IF OBJECT_ID('dbo.sp_user_comments', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_user_comments;
GO
CREATE PROCEDURE dbo.sp_user_comments
    @user_id INT,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT c.*,
        CASE c.[target_type]
            WHEN 'architecture' THEN (SELECT name FROM dbo.architecture_basic WHERE id = c.[target_id])
            WHEN 'share' THEN (SELECT title FROM dbo.building_shares WHERE share_id = c.[target_id])
            ELSE NULL
        END AS [target_title]
    FROM dbo.comments c
    WHERE c.[user_id] = @user_id AND c.[is_deleted] = 0
    ORDER BY c.[created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- 删除评论（软删除）
IF OBJECT_ID('dbo.sp_delete_comment', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_delete_comment;
GO
CREATE PROCEDURE dbo.sp_delete_comment
    @comment_id INT,
    @user_id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.comments SET [is_deleted] = 1 WHERE [comment_id] = @comment_id AND [user_id] = @user_id;
    SELECT @@ROWCOUNT AS [affected];
END
GO

-- ============================================
-- 分享记录表（用户分享到社交平台）
-- ============================================
IF OBJECT_ID('dbo.shares', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.shares (
        [share_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(50) NOT NULL,
        [target_type] NVARCHAR(20) NOT NULL,            -- architecture / model
        [target_id] INT NOT NULL,
        [target_title] NVARCHAR(200) NOT NULL,          -- 分享目标的标题
        [share_url] NVARCHAR(500) NULL,                 -- 分享链接
        [share_message] NVARCHAR(500) NULL,             -- 分享附言
        [platform] NVARCHAR(20) NULL,                   -- 分享平台：wechat/weibo/link
        [view_count] INT DEFAULT 0,                     -- 被查看次数
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_shares_target' AND object_id = OBJECT_ID('dbo.shares'))
    CREATE INDEX [idx_shares_target] ON dbo.shares([target_type], [target_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_shares_user' AND object_id = OBJECT_ID('dbo.shares'))
    CREATE INDEX [idx_shares_user] ON dbo.shares([user_id]);
GO

-- ============================================
-- 作品展示表（用户上传的作品，可点赞评论）
-- ============================================
IF OBJECT_ID('dbo.showcases', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.showcases (
        [showcase_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [username] NVARCHAR(50) NOT NULL,
        [title] NVARCHAR(200) NOT NULL,                 -- 作品标题
        [description] NVARCHAR(1000) NULL,              -- 作品描述
        [thumbnail_url] VARCHAR(500) NULL,              -- 缩略图
        [model_data] NVARCHAR(MAX) NULL,                -- 模型JSON数据
        [tags] NVARCHAR(200) NULL,                      -- 标签，逗号分隔
        [category] NVARCHAR(50) DEFAULT 'model',        -- 类别：model / artwork / design
        [likes] INT DEFAULT 0,                          -- 点赞数
        [views] INT DEFAULT 0,                          -- 浏览数
        [is_featured] BIT DEFAULT 0,                    -- 是否精选
        [is_public] BIT DEFAULT 1,                      -- 是否公开
        [status] NVARCHAR(20) DEFAULT 'approved',       -- pending / approved / rejected
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_showcases_featured' AND object_id = OBJECT_ID('dbo.showcases'))
    CREATE INDEX [idx_showcases_featured] ON dbo.showcases([is_featured], [created_at] DESC);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_showcases_user' AND object_id = OBJECT_ID('dbo.showcases'))
    CREATE INDEX [idx_showcases_user] ON dbo.showcases([user_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_showcases_status' AND object_id = OBJECT_ID('dbo.showcases'))
    CREATE INDEX [idx_showcases_status] ON dbo.showcases([status]);
GO

-- 获取评论列表
IF OBJECT_ID('dbo.sp_comments_list', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_comments_list;
GO
CREATE PROCEDURE dbo.sp_comments_list
    @target_type NVARCHAR(20),
    @target_id INT,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT c.*,
        (SELECT COUNT(*) FROM dbo.comments r WHERE r.[parent_id] = c.[comment_id] AND r.[is_deleted] = 0) AS reply_count
    FROM dbo.comments c
    WHERE c.[target_type] = @target_type AND c.[target_id] = @target_id
      AND c.[parent_id] IS NULL AND c.[is_deleted] = 0
    ORDER BY c.[created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- 获取评论回复
IF OBJECT_ID('dbo.sp_comments_replies', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_comments_replies;
GO
CREATE PROCEDURE dbo.sp_comments_replies
    @parent_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.comments WHERE [parent_id] = @parent_id AND [is_deleted] = 0 ORDER BY [created_at] ASC;
END
GO

-- 获取作品展示列表
IF OBJECT_ID('dbo.sp_showcases_list', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_showcases_list;
GO
CREATE PROCEDURE dbo.sp_showcases_list
    @category NVARCHAR(50) = NULL,
    @featured_only BIT = 0,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT * FROM dbo.showcases
    WHERE [status] = 'approved' AND [is_public] = 1
      AND (@category IS NULL OR [category] = @category)
      AND (@featured_only = 0 OR [is_featured] = 1)
    ORDER BY [is_featured] DESC, [created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- ============================================================
-- [10/10] 数据同步模块数据库 (Sync)
-- ============================================================
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
            [device_id] NVARCHAR(64) NOT NULL,
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
            CONSTRAINT PK_sync_devices PRIMARY KEY CLUSTERED ([device_id])
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
        [updated_at] DATETIME DEFAULT GETDATE()
        -- 移除了跨库外键：CONSTRAINT FK_user_sync_status_user FOREIGN KEY ([user_id]) REFERENCES [ATCA_User].[dbo].[users]([user_id])
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
        [created_at] DATETIME DEFAULT GETDATE()
        -- 移除了跨库外键：CONSTRAINT FK_sync_conflicts_user FOREIGN KEY ([user_id]) REFERENCES [ATCA_User].[dbo].[users]([user_id])
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
IF OBJECT_ID('tr_user_sync_status_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_user_sync_status_updated_at;
GO

CREATE TRIGGER tr_user_sync_status_updated_at
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
IF OBJECT_ID('dbo.sp_sync_register_device', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_register_device;
GO
CREATE PROCEDURE dbo.sp_sync_register_device
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
            @device_model, @os_type, @os_version, @app_version);
    END
END
GO

-- 获取用户设备列表
IF OBJECT_ID('dbo.sp_sync_get_user_devices', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_user_devices;
GO
CREATE PROCEDURE dbo.sp_sync_get_user_devices
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
IF OBJECT_ID('dbo.sp_sync_log_operation', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_log_operation;
GO
CREATE PROCEDURE dbo.sp_sync_log_operation
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
IF OBJECT_ID('dbo.sp_sync_get_pending_operations', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_pending_operations;
GO
CREATE PROCEDURE dbo.sp_sync_get_pending_operations
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
IF OBJECT_ID('dbo.sp_sync_mark_synced', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_mark_synced;
GO
CREATE PROCEDURE dbo.sp_sync_mark_synced
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
IF OBJECT_ID('dbo.sp_sync_log_conflict', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_log_conflict;
GO
CREATE PROCEDURE dbo.sp_sync_log_conflict
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
IF OBJECT_ID('dbo.sp_sync_get_user_conflicts', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_user_conflicts;
GO
CREATE PROCEDURE dbo.sp_sync_get_user_conflicts
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
IF OBJECT_ID('dbo.sp_sync_resolve_conflict', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_resolve_conflict;
GO
CREATE PROCEDURE dbo.sp_sync_resolve_conflict
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
IF OBJECT_ID('dbo.sp_sync_get_user_status', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_user_status;
GO
CREATE PROCEDURE dbo.sp_sync_get_user_status
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
IF OBJECT_ID('dbo.sp_sync_update_user_status', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_update_user_status;
GO
CREATE PROCEDURE dbo.sp_sync_update_user_status
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
IF OBJECT_ID('dbo.sp_sync_get_stats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_stats;
GO
CREATE PROCEDURE dbo.sp_sync_get_stats
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
IF OBJECT_ID('dbo.sp_sync_deactivate_device', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_deactivate_device;
GO
CREATE PROCEDURE dbo.sp_sync_deactivate_device
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
IF OBJECT_ID('dbo.sp_sync_cleanup_logs', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_cleanup_logs;
GO
CREATE PROCEDURE dbo.sp_sync_cleanup_logs
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
        CONSTRAINT UK_user_checkin_date_sync UNIQUE ([user_id], [checkin_date])
        -- 移除了跨库外键：CONSTRAINT FK_user_checkin_sync_user FOREIGN KEY ([user_id]) REFERENCES [ATCA_User].[dbo].[users]([user_id])
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
IF OBJECT_ID('dbo.sp_sync_record_checkin', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_record_checkin;
GO
CREATE PROCEDURE dbo.sp_sync_record_checkin
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
IF OBJECT_ID('dbo.sp_sync_get_user_checkins', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_user_checkins;
GO
CREATE PROCEDURE dbo.sp_sync_get_user_checkins
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
IF OBJECT_ID('dbo.sp_sync_get_pending_checkins', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_pending_checkins;
GO
CREATE PROCEDURE dbo.sp_sync_get_pending_checkins
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
IF OBJECT_ID('dbo.sp_sync_mark_checkin_synced', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_mark_checkin_synced;
GO
CREATE PROCEDURE dbo.sp_sync_mark_checkin_synced
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
IF OBJECT_ID('dbo.sp_sync_mark_checkins_synced', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_mark_checkins_synced;
GO
CREATE PROCEDURE dbo.sp_sync_mark_checkins_synced
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
IF OBJECT_ID('dbo.sp_sync_get_checkin_stats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_sync_get_checkin_stats;
GO
CREATE PROCEDURE dbo.sp_sync_get_checkin_stats
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
IF OBJECT_ID('tr_user_checkin_sync_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_user_checkin_sync_updated_at;
GO

CREATE TRIGGER tr_user_checkin_sync_updated_at
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

-- ============================================================
-- 初始化 ATCA 管理员账户
-- ============================================================

-- 检测并创建 SQL Server 登录名 ATCA（若不存在）
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'ATCA')
    BEGIN
        CREATE LOGIN [ATCA] WITH PASSWORD = N'Atca@123.-', CHECK_POLICY = OFF, CHECK_EXPIRATION = OFF;
        PRINT N'登录名 [ATCA] 已创建';
    END
ELSE
    BEGIN
        PRINT N'登录名 [ATCA] 已存在，跳过创建';
    END
GO

-- 检测并创建数据库用户 ATCA（若不存在），并赋予 db_owner 角色
DECLARE @dbName NVARCHAR(128);
DECLARE @sql NVARCHAR(MAX);

DECLARE db_cursor CURSOR FOR
    SELECT name FROM sys.databases
    WHERE name IN (N'ATCA_User', N'System', N'Architecture', N'Media_3D',
                   N'Competition', N'Activity', N'Social', N'Knowledge',
                   N'Sync', N'Translation');

OPEN db_cursor;
FETCH NEXT FROM db_cursor INTO @dbName;

WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @sql = N'
    USE [' + @dbName + N'];
    IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N''ATCA'')
    BEGIN
        CREATE USER [ATCA] FOR LOGIN [ATCA];
        ALTER ROLE [db_owner] ADD MEMBER [ATCA];
        PRINT N''数据库 [' + @dbName + N'] 中用户 [ATCA] 已创建并赋予 db_owner 角色'';
    END
    ELSE
    BEGIN
        PRINT N''数据库 [' + @dbName + N'] 中用户 [ATCA] 已存在，跳过创建'';
    END';
        EXEC sp_executesql @sql;
        FETCH NEXT FROM db_cursor INTO @dbName;
    END

CLOSE db_cursor;
DEALLOCATE db_cursor;
GO

-- ============================================================
-- 全部数据库初始化完成！
-- ============================================================
PRINT '========================================';
PRINT ' 华夏营造 全部10个数据库初始化完成！';
PRINT '========================================';