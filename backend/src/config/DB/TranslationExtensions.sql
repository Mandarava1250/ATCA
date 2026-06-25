-- ============================================
-- 华夏营造 - 翻译管理扩展表
-- 支持版本管理、审核流程、翻译记忆
-- ============================================

USE [Architecture];
GO

-- ============================================
-- 1. 翻译版本表（支持历史记录和回滚）
-- ============================================
IF OBJECT_ID('dbo.translation_versions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_versions (
        [version_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [translation_id] INT NOT NULL,                -- 关联到 translations 表
        [version_number] INT NOT NULL,                -- 版本号（递增）
        [translated_text] NVARCHAR(MAX) NOT NULL,     -- 该版本的翻译内容
        [edited_by] INT NULL,                         -- 编辑人ID
        [edit_reason] NVARCHAR(200) NULL,             -- 编辑原因
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_translation_versions_translation 
            FOREIGN KEY ([translation_id]) REFERENCES dbo.translations([translation_id])
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_versions_tid' AND object_id = OBJECT_ID('dbo.translation_versions'))
    CREATE INDEX [idx_translation_versions_tid] ON dbo.translation_versions([translation_id]);
GO

-- ============================================
-- 2. 翻译审核表（单级审核流程）
-- ============================================
IF OBJECT_ID('dbo.translation_reviews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_reviews (
        [review_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [translation_id] INT NOT NULL,                -- 关联到 translations 表
        [reviewer_id] INT NOT NULL,                   -- 审核人ID
        [review_status] NVARCHAR(20) NOT NULL,        -- pending/approved/rejected
        [review_notes] NVARCHAR(500) NULL,            -- 审核备注
        [quality_score] INT NULL,                     -- 翻译质量评分（1-100）
        [reviewed_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_translation_reviews_translation 
            FOREIGN KEY ([translation_id]) REFERENCES dbo.translations([translation_id]),
        CONSTRAINT CHK_review_status CHECK ([review_status] IN ('pending', 'approved', 'rejected'))
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_reviews_status' AND object_id = OBJECT_ID('dbo.translation_reviews'))
    CREATE INDEX [idx_translation_reviews_status] ON dbo.translation_reviews([review_status]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_reviews_tid' AND object_id = OBJECT_ID('dbo.translation_reviews'))
    CREATE INDEX [idx_translation_reviews_tid] ON dbo.translation_reviews([translation_id]);
GO

-- ============================================
-- 3. 翻译记忆表（避免重复翻译）
-- ============================================
IF OBJECT_ID('dbo.translation_memory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_memory (
        [memory_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [source_text_hash] NVARCHAR(64) NOT NULL,     -- 源文本SHA256哈希
        [source_text] NVARCHAR(MAX) NOT NULL,         -- 原文
        [source_language] NVARCHAR(10) NOT NULL,      -- 源语言
        [target_language] NVARCHAR(10) NOT NULL,      -- 目标语言
        [translated_text] NVARCHAR(MAX) NOT NULL,     -- 翻译结果
        [context] NVARCHAR(200) NULL,                 -- 上下文（可选）
        [quality_score] INT DEFAULT 0,                -- 质量评分
        [usage_count] INT DEFAULT 1,                  -- 使用次数
        [last_used_at] DATETIME DEFAULT GETDATE(),
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_translation_memory_hash UNIQUE ([source_text_hash], [target_language])
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_memory_hash' AND object_id = OBJECT_ID('dbo.translation_memory'))
    CREATE INDEX [idx_translation_memory_hash] ON dbo.translation_memory([source_text_hash]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translation_memory_lang' AND object_id = OBJECT_ID('dbo.translation_memory'))
    CREATE INDEX [idx_translation_memory_lang] ON dbo.translation_memory([source_language], [target_language]);
GO

-- ============================================
-- 4. 扩展 translations 表（添加审核状态字段）
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.translations') AND name = 'review_status')
BEGIN
    ALTER TABLE dbo.translations ADD [review_status] NVARCHAR(20) DEFAULT 'pending';
    ALTER TABLE dbo.translations ADD CONSTRAINT CHK_trans_review_status CHECK ([review_status] IN ('pending', 'approved', 'rejected'));
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.translations') AND name = 'quality_score')
BEGIN
    ALTER TABLE dbo.translations ADD [quality_score] INT NULL;
END
GO

-- ============================================
-- 5. 翻译存储过程扩展
-- ============================================

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
    
    -- 获取当前最大版本号
    DECLARE @max_version INT;
    SELECT @max_version = ISNULL(MAX([version_number]), 0) 
    FROM dbo.translation_versions 
    WHERE [translation_id] = @translation_id;
    
    -- 插入新版本
    INSERT INTO dbo.translation_versions (
        [translation_id], [version_number], [translated_text], [edited_by], [edit_reason]
    )
    VALUES (
        @translation_id, @max_version + 1, @translated_text, @edited_by, @edit_reason
    );
    
    -- 返回新版本ID
    SELECT SCOPE_IDENTITY() AS [version_id], @max_version + 1 AS [version_number];
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
        v.[version_id],
        v.[version_number],
        v.[translated_text],
        v.[edited_by],
        v.[edit_reason],
        v.[created_at]
    FROM dbo.translation_versions v
    WHERE v.[translation_id] = @translation_id
    ORDER BY v.[version_number] DESC;
END
GO

-- 提交翻译审核
IF OBJECT_ID('dbo.sp_submit_translation_review', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_submit_translation_review;
GO
CREATE PROCEDURE dbo.sp_submit_translation_review
    @translation_id INT,
    @reviewer_id INT,
    @review_status NVARCHAR(20),
    @review_notes NVARCHAR(500) = NULL,
    @quality_score INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 插入审核记录
    INSERT INTO dbo.translation_reviews (
        [translation_id], [reviewer_id], [review_status], [review_notes], [quality_score]
    )
    VALUES (
        @translation_id, @reviewer_id, @review_status, @review_notes, @quality_score
    );
    
    -- 更新翻译表的审核状态
    UPDATE dbo.translations
    SET 
        [review_status] = @review_status,
        [quality_score] = @quality_score,
        [reviewed_by] = @reviewer_id,
        [reviewed_at] = GETDATE(),
        [is_machine_translated] = 0  -- 审核后标记为人工翻译
    WHERE [translation_id] = @translation_id;
    
    SELECT SCOPE_IDENTITY() AS [review_id];
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
    
    -- 返回总数
    SELECT COUNT(*) AS [total]
    FROM dbo.translations t
    WHERE t.[review_status] = 'pending'
      AND (@entity_type IS NULL OR t.[entity_type] = @entity_type)
      AND (@language_code IS NULL OR t.[language_code] = @language_code);
END
GO

-- 翻译记忆查询
IF OBJECT_ID('dbo.sp_lookup_translation_memory', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_lookup_translation_memory;
GO
CREATE PROCEDURE dbo.sp_lookup_translation_memory
    @source_text NVARCHAR(MAX),
    @target_language NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- 计算源文本哈希
    DECLARE @hash NVARCHAR(64);
    SET @hash = CONVERT(NVARCHAR(64), HASHBYTES('SHA2_256', CONVERT(NVARCHAR(MAX), @source_text)), 2);
    
    -- 查询匹配的翻译记忆
    SELECT 
        m.[memory_id],
        m.[source_text],
        m.[translated_text],
        m.[quality_score],
        m.[usage_count]
    FROM dbo.translation_memory m
    WHERE m.[source_text_hash] = @hash
      AND m.[target_language] = @target_language
    ORDER BY m.[quality_score] DESC, m.[usage_count] DESC;
END
GO

-- 添加/更新翻译记忆
IF OBJECT_ID('dbo.sp_upsert_translation_memory', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_upsert_translation_memory;
GO
CREATE PROCEDURE dbo.sp_upsert_translation_memory
    @source_text NVARCHAR(MAX),
    @source_language NVARCHAR(10),
    @target_language NVARCHAR(10),
    @translated_text NVARCHAR(MAX),
    @quality_score INT = 0,
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
        -- 更新使用次数
        UPDATE dbo.translation_memory
        SET 
            [usage_count] = [usage_count] + 1,
            [last_used_at] = GETDATE(),
            [quality_score] = CASE WHEN @quality_score > [quality_score] THEN @quality_score ELSE [quality_score] END
        WHERE [source_text_hash] = @hash AND [target_language] = @target_language;
    END
    ELSE
    BEGIN
        -- 插入新记忆
        INSERT INTO dbo.translation_memory (
            [source_text_hash], [source_text], [source_language], [target_language], 
            [translated_text], [quality_score], [context]
        )
        VALUES (
            @hash, @source_text, @source_language, @target_language, 
            @translated_text, @quality_score, @context
        );
    END
END
GO

-- 添加日语支持
IF NOT EXISTS (SELECT 1 FROM dbo.supported_languages WHERE [language_code] = 'ja')
    INSERT INTO dbo.supported_languages ([language_code], [language_name], [native_name], [is_default], [sort_order])
    VALUES ('ja', N'Japanese', N'日本語', 0, 3);
GO

-- ============================================
-- 6. 翻译统计存储过程
-- ============================================

-- 获取翻译统计
IF OBJECT_ID('dbo.sp_get_translation_stats', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_translation_stats;
GO
CREATE PROCEDURE dbo.sp_get_translation_stats
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM dbo.translations) AS [total_translations],
        (SELECT COUNT(*) FROM dbo.translations WHERE [review_status] = 'pending') AS [pending_reviews],
        (SELECT COUNT(*) FROM dbo.translations WHERE [review_status] = 'approved') AS [approved_translations],
        (SELECT COUNT(*) FROM dbo.translations WHERE [review_status] = 'rejected') AS [rejected_translations],
        (SELECT COUNT(*) FROM dbo.translations WHERE [is_machine_translated] = 1) AS [machine_translations],
        (SELECT COUNT(*) FROM dbo.translations WHERE [is_machine_translated] = 0) AS [human_translations],
        (SELECT COUNT(*) FROM dbo.translation_memory) AS [memory_entries],
        (SELECT COUNT(DISTINCT [entity_type]) FROM dbo.translations) AS [entity_types],
        (SELECT COUNT(DISTINCT [language_code]) FROM dbo.translations) AS [languages];
END
GO