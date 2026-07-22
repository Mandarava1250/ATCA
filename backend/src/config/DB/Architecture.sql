-- ============================================
-- 筑见山河 - 建筑内容模块数据库
-- 管理古代建筑信息、历史发展、技术结构和文化意义
-- 包含翻译管理功能
-- ============================================

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
        CONSTRAINT UQ_translation_memory UNIQUE ([source_text], [target_language]),
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
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tm_source' AND object_id = OBJECT_ID('dbo.translation_memory'))
    CREATE INDEX [idx_tm_source] ON dbo.translation_memory([source_text], [target_language]);
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
GO
CREATE OR ALTER TRIGGER dbo.trg_delete_related_architectures
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
GO
CREATE OR ALTER TRIGGER dbo.trg_update_timestamp
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
GO
CREATE OR ALTER TRIGGER tr_translations_updated_at
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
GO
CREATE OR ALTER VIEW dbo.vw_popular_architectures AS
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_get_list
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_get_detail
    @architecture_id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.ancient_architecture WHERE [architecture_id] = @architecture_id;
END
GO

-- 添加建筑
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_add
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_update
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_delete
    @architecture_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.ancient_architecture WHERE [architecture_id] = @architecture_id;
    SELECT @@ROWCOUNT AS [deleted];
END
GO

-- 搜索建筑
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_search
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_log_view
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_get_popular
    @limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@limit) * FROM dbo.vw_popular_architectures ORDER BY [popularity_score] DESC;
END
GO

-- 更新热门搜索词
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_update_search_term
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_get_search_terms
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_architecture_get_stats
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_get_translation
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_get_by_entity
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_get_translations_batch
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_batch_get
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_upsert_translation
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_upsert
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_get_languages
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_get_translation_stats
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_stats
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_search_translations
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_search
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_delete_translation
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_delete
    @translation_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.translations WHERE [translation_id] = @translation_id;
    SELECT @@ROWCOUNT AS deleted;
END
GO

-- 删除实体的所有翻译
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_delete_by_entity
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_batch_delete_translations
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_submit_translation_review
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_review
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_get_pending_reviews
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_get_translation_versions
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_get_versions
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_restore_version
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_create_translation_version
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_memory_add
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_memory_search
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

GO
CREATE OR ALTER PROCEDURE dbo.sp_lookup_translation_memory
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

GO
CREATE OR ALTER PROCEDURE dbo.sp_upsert_translation_memory
    @source_text NVARCHAR(MAX),
    @source_language NVARCHAR(10),
    @target_language NVARCHAR(10),
    @target_text NVARCHAR(MAX),
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
            [target_text] = @target_text,
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
            @target_text, @quality_score, @context
        );
    END
END
GO

GO
CREATE OR ALTER PROCEDURE dbo.sp_translation_batch_update
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_register_device
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_log_add
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_conflict_add
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_conflict_resolve
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_get_user_conflicts
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_stats_update
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_sync_update_device_last_sync
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_kg_query
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_kg_log_verification
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_kg_get_neighbors
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
GO
CREATE OR ALTER PROCEDURE dbo.sp_kg_find_topic
    @topic_name NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM dbo.kg_topics 
    WHERE topic_name LIKE '%' + @topic_name + '%' OR topic_key LIKE '%' + @topic_name + '%';
END
GO

-- 查询所有实体（支持分页和过滤）
GO
CREATE OR ALTER PROCEDURE dbo.sp_kg_get_topics
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