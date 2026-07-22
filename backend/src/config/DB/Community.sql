-- ============================================
-- 筑见山河 - 社区活动数据库
-- 论坛讨论 / 建筑分享 / 用户评论 / 作品展示
-- ============================================

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
