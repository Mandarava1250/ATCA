-- ============================================
-- 华夏营造 - 多语言翻译表
-- 支持将数据库内容翻译为英文等多语言
-- ============================================

-- 创建数据库（不存在时）
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Architecture')
BEGIN
    CREATE DATABASE [Architecture];;
END
GO
USE [Architecture];
GO

-- 翻译表：统一管理所有可翻译内容
IF OBJECT_ID('dbo.translations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translations (
        [translation_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [entity_type] NVARCHAR(50) NOT NULL,          -- 实体类型：architecture / dynasty / structure_type / component / etc.
        [entity_id] INT NOT NULL,                     -- 实体ID（关联到对应表的主键）
        [field_name] NVARCHAR(50) NOT NULL,           -- 字段名：name / description / brief / etc.
        [language_code] NVARCHAR(10) NOT NULL,        -- 语言代码：en / ja / ko 等
        [source_text] NVARCHAR(MAX) NOT NULL,         -- 原文（中文）
        [translated_text] NVARCHAR(MAX) NOT NULL,     -- 翻译后的文本
        [is_machine_translated] BIT DEFAULT 1,        -- 是否为机器翻译（1=是，0=人工校对）
        [review_status] NVARCHAR(20) DEFAULT 'pending', -- 审核状态：pending / approved / rejected
        [quality_score] INT NULL,                     -- 质量评分 0-100
        [review_notes] NVARCHAR(MAX) NULL,            -- 审核备注
        [reviewed_by] INT NULL,                       -- 审核人ID
        [reviewed_at] DATETIME NULL,                  -- 审核时间
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_translations UNIQUE ([entity_type], [entity_id], [field_name], [language_code])
    );
END
GO

-- 如果已存在表，添加缺失的字段
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
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_entity' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE INDEX [idx_translations_entity] ON dbo.translations([entity_type], [entity_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_lang' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE INDEX [idx_translations_lang] ON dbo.translations([language_code]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_status' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE INDEX [idx_translations_status] ON dbo.translations([review_status]);
GO

-- 翻译历史版本表
IF OBJECT_ID('dbo.translation_versions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_versions (
        [version_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [translation_id] INT NOT NULL,
        [version_number] INT NOT NULL,
        [source_text] NVARCHAR(MAX) NOT NULL,
        [translated_text] NVARCHAR(MAX) NOT NULL,
        [edited_by] INT NULL,
        [edit_reason] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_tv_translation FOREIGN KEY ([translation_id]) REFERENCES dbo.translations([translation_id]) ON DELETE CASCADE
    );
END
GO

-- 翻译记忆表
IF OBJECT_ID('dbo.translation_memory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.translation_memory (
        [memory_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [source_text] NVARCHAR(MAX) NOT NULL,
        [source_language] NVARCHAR(10) NOT NULL,
        [target_language] NVARCHAR(10) NOT NULL,
        [translated_text] NVARCHAR(MAX) NOT NULL,
        [quality_score] INT DEFAULT 80,
        [usage_count] INT DEFAULT 1,
        [last_used_at] DATETIME DEFAULT GETDATE(),
        [created_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_translation_memory UNIQUE ([source_text], [target_language])
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tv_translation' AND object_id = OBJECT_ID('dbo.translation_versions'))
    CREATE INDEX [idx_tv_translation] ON dbo.translation_versions([translation_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tm_source' AND object_id = OBJECT_ID('dbo.translation_memory'))
    CREATE INDEX [idx_tm_source] ON dbo.translation_memory([source_text], [target_language]);
GO

-- 语言配置表
IF OBJECT_ID('dbo.supported_languages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.supported_languages (
        [language_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [language_code] NVARCHAR(10) NOT NULL UNIQUE,  -- en / zh-CN / ja
        [language_name] NVARCHAR(50) NOT NULL,          -- English / 中文 / 日本語
        [native_name] NVARCHAR(50) NOT NULL,            -- 语言自描述名称
        [is_active] BIT DEFAULT 1,                      -- 是否启用
        [is_default] BIT DEFAULT 0,                     -- 是否为默认语言
        [sort_order] INT DEFAULT 0,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- 插入默认支持的语言
IF NOT EXISTS (SELECT 1 FROM dbo.supported_languages WHERE [language_code] = 'zh-CN')
    INSERT INTO dbo.supported_languages ([language_code], [language_name], [native_name], [is_default], [sort_order])
    VALUES ('zh-CN', N'Chinese (Simplified)', N'简体中文', 1, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.supported_languages WHERE [language_code] = 'en')
    INSERT INTO dbo.supported_languages ([language_code], [language_name], [native_name], [is_default], [sort_order])
    VALUES ('en', N'English', N'English', 0, 2);
GO

-- ============================================
-- 翻译存储过程
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

-- 批量获取翻译（用于列表页）
IF OBJECT_ID('dbo.sp_get_translations_batch', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_get_translations_batch;
GO
CREATE PROCEDURE dbo.sp_get_translations_batch
    @entity_type NVARCHAR(50),
    @entity_ids NVARCHAR(MAX),    -- JSON数组 [1,2,3]
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

-- 批量删除翻译
IF OBJECT_ID('dbo.sp_batch_delete_translations', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_batch_delete_translations;
GO
CREATE PROCEDURE dbo.sp_batch_delete_translations
    @translation_ids NVARCHAR(MAX)  -- JSON数组 [1,2,3]
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
    UPDATE dbo.translations
    SET 
        review_status = @review_status,
        reviewed_by = @reviewer_id,
        reviewed_at = GETDATE(),
        review_notes = @review_notes,
        quality_score = @quality_score
    WHERE translation_id = @translation_id;
    SELECT @@ROWCOUNT AS updated_count;
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

-- 翻译记忆查询
IF OBJECT_ID('dbo.sp_lookup_translation_memory', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_lookup_translation_memory;
GO
CREATE PROCEDURE dbo.sp_lookup_translation_memory
    @source_text NVARCHAR(MAX),
    @target_language NVARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        memory_id, source_text, translated_text, source_language, target_language,
        quality_score, usage_count, last_used_at
    FROM dbo.translation_memory
    WHERE source_text = @source_text
      AND target_language = @target_language
    ORDER BY quality_score DESC, usage_count DESC;
END
GO

-- 保存翻译记忆
IF OBJECT_ID('dbo.sp_upsert_translation_memory', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_upsert_translation_memory;
GO
CREATE PROCEDURE dbo.sp_upsert_translation_memory
    @source_text NVARCHAR(MAX),
    @source_language NVARCHAR(10),
    @target_language NVARCHAR(10),
    @translated_text NVARCHAR(MAX),
    @quality_score INT = 80
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM dbo.translation_memory
        WHERE source_text = @source_text AND target_language = @target_language
    )
    BEGIN
        UPDATE dbo.translation_memory
        SET translated_text = @translated_text,
            quality_score = @quality_score,
            usage_count = usage_count + 1,
            last_used_at = GETDATE()
        WHERE source_text = @source_text AND target_language = @target_language;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.translation_memory (source_text, source_language, target_language, translated_text, quality_score)
        VALUES (@source_text, @source_language, @target_language, @translated_text, @quality_score);
    END
END
GO
