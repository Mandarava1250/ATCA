-- ============================================
-- 筑见山河 - 用户模块数据库
-- 管理用户信息、认证、积分、收藏和设置
-- ============================================

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