-- ============================================
-- 筑见山河 - 翻译管理模块数据库
-- 管理所有文本内容的多语言翻译和审核流程
-- ============================================

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