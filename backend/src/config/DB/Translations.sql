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
        [translated_text] NVARCHAR(MAX) NOT NULL,     -- 翻译后的文本
        [is_machine_translated] BIT DEFAULT 1,        -- 是否为机器翻译（1=是，0=人工校对）
        [reviewed_by] INT NULL,                       -- 审核人ID
        [reviewed_at] DATETIME NULL,                  -- 审核时间
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_translations UNIQUE ([entity_type], [entity_id], [field_name], [language_code])
    );
END
GO

-- 创建索引
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_entity' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE INDEX [idx_translations_entity] ON dbo.translations([entity_type], [entity_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_translations_lang' AND object_id = OBJECT_ID('dbo.translations'))
    CREATE INDEX [idx_translations_lang] ON dbo.translations([language_code]);
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
