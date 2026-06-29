-- ============================================
-- 华夏营造 - 社交功能数据库表
-- 用户评论、建筑分享、作品展示
-- ============================================

USE [Social];
GO

-- 用户评论表
IF OBJECT_ID('dbo.comments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.comments (
        [comment_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,                         -- 评论用户ID
        [username] NVARCHAR(50) NOT NULL,               -- 评论用户名（冗余，方便查询）
        [target_type] NVARCHAR(20) NOT NULL,            -- 目标类型：architecture / model / showcase
        [target_id] INT NOT NULL,                       -- 目标ID
        [parent_id] INT NULL,                           -- 父评论ID（回复功能）
        [content] NVARCHAR(1000) NOT NULL,              -- 评论内容
        [likes] INT DEFAULT 0,                          -- 点赞数
        [is_deleted] BIT DEFAULT 0,                     -- 软删除
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_comments_parent FOREIGN KEY ([parent_id]) REFERENCES dbo.comments([comment_id])
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_comments_target' AND object_id = OBJECT_ID('dbo.comments'))
    CREATE INDEX [idx_comments_target] ON dbo.comments([target_type], [target_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_comments_user' AND object_id = OBJECT_ID('dbo.comments'))
    CREATE INDEX [idx_comments_user] ON dbo.comments([user_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_comments_parent' AND object_id = OBJECT_ID('dbo.comments'))
    CREATE INDEX [idx_comments_parent] ON dbo.comments([parent_id]);
GO

-- 分享记录表
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

-- 作品展示表（用户上传的作品，可点赞评论）
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

-- 点赞记录表
IF OBJECT_ID('dbo.likes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.likes (
        [like_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] INT NOT NULL,
        [target_type] NVARCHAR(20) NOT NULL,            -- showcase / comment
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
    -- 获取顶层评论
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
