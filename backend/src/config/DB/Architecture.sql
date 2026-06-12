-- 创建数据库（不存在时）
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Architecture')
    BEGIN
        CREATE DATABASE [Architecture];
    END
GO

USE [Architecture];
GO

-- ============================================
-- 0. 用户表（镜像，用于跨数据库JOIN兼容性）
--    主表在ATCA_User数据库中，此为冗余备份
-- ============================================
IF OBJECT_ID('dbo.atca_user', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.atca_user (
        [user_id] INT NOT NULL PRIMARY KEY,
        [username] VARCHAR(50) NOT NULL UNIQUE,
        [nickname] VARCHAR(50) NULL,
        [password] VARCHAR(255) NOT NULL,
        [email] VARCHAR(100) NOT NULL UNIQUE,
        [avatar] VARCHAR(255) DEFAULT '/images/default-avatar.png',
        [points] INT DEFAULT 0,
        [level] INT DEFAULT 1,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME NULL,
        [last_login] DATETIME NULL,
        [is_active] BIT DEFAULT 1,
        [role] VARCHAR(10) DEFAULT 'user'
    );
    CREATE INDEX [idx_atca_user_active] ON dbo.atca_user([is_active]);
END
GO

-- ============================================
-- 1. 中国古代建筑基本信息表
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
            [main_image_url] NVARCHAR(255) NULL,
            [created_at] DATETIME DEFAULT GETDATE(),
            [updated_at] DATETIME DEFAULT GETDATE()
        );
    END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_type' AND object_id = OBJECT_ID('dbo.ancient_architecture'))
CREATE INDEX [idx_type] ON dbo.ancient_architecture([type]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_founding_dynasty' AND object_id = OBJECT_ID('dbo.ancient_architecture'))
CREATE INDEX [idx_founding_dynasty] ON dbo.ancient_architecture([founding_dynasty]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_location' AND object_id = OBJECT_ID('dbo.ancient_architecture'))
CREATE INDEX [idx_location] ON dbo.ancient_architecture([location]);
GO

-- ============================================
-- 2. 历史发展表
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_historical_period' AND object_id = OBJECT_ID('dbo.historical_development'))
CREATE INDEX [idx_historical_period] ON dbo.historical_development([dynasty_period]);
GO

-- ============================================
-- 3. 技术结构表
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_technical_category' AND object_id = OBJECT_ID('dbo.technical_structure'))
CREATE INDEX [idx_technical_category] ON dbo.technical_structure([technical_category]);
GO

-- ============================================
-- 4. 建筑特色表
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_design_philosophy' AND object_id = OBJECT_ID('dbo.architectural_features'))
CREATE INDEX [idx_design_philosophy] ON dbo.architectural_features([design_philosophy]);
GO

-- ============================================
-- 5. 文化意义表
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_cultural_aspect' AND object_id = OBJECT_ID('dbo.cultural_significance'))
CREATE INDEX [idx_cultural_aspect] ON dbo.cultural_significance([significance_aspect]);
GO

-- ============================================
-- 6. 专家观点表
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
-- 7. 相关建筑关系表
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_relation_type' AND object_id = OBJECT_ID('dbo.related_architectures'))
CREATE INDEX [idx_relation_type] ON dbo.related_architectures([relation_type]);
GO

-- ============================================
-- 8. 朝代年代映射表
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
-- 9. 建筑浏览记录表
-- ============================================
IF OBJECT_ID('dbo.architecture_views', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.architecture_views (
            [view_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
            [external_user_id] INT NULL CHECK ([external_user_id] > 0),
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_views_architecture' AND object_id = OBJECT_ID('dbo.architecture_views'))
CREATE INDEX [idx_views_architecture] ON dbo.architecture_views([architecture_id]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_views_time' AND object_id = OBJECT_ID('dbo.architecture_views'))
CREATE INDEX [idx_views_time] ON dbo.architecture_views([view_time]);
GO

-- ============================================
-- 10. 建筑收藏表
-- ============================================
IF OBJECT_ID('dbo.architecture_favorites', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.architecture_favorites (
            [favorite_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
            [user_id] INT NOT NULL,
            [architecture_id] INT NOT NULL,
            [favorite_time] DATETIME DEFAULT GETDATE(),
            CONSTRAINT FK_favorites_architecture FOREIGN KEY ([architecture_id])
            REFERENCES dbo.ancient_architecture([architecture_id]) ON DELETE CASCADE,
            CONSTRAINT UQ_user_architecture_favorite UNIQUE ([user_id], [architecture_id])
        );
    END
GO

-- ============================================
-- 11. 搜索历史表
-- ============================================
IF OBJECT_ID('dbo.search_history', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.search_history (
            [history_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
            [user_id] INT NULL,
            [keyword] NVARCHAR(100) NOT NULL,
            [search_time] DATETIME DEFAULT GETDATE(),
            [ip_address] NVARCHAR(45) NULL,
            [session_id] NVARCHAR(100) NULL
        );
    END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_search_time' AND object_id = OBJECT_ID('dbo.search_history'))
CREATE INDEX [idx_search_time] ON dbo.search_history([search_time]);
GO

-- ============================================
-- 12. 建筑访问统计表
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_stats_date' AND object_id = OBJECT_ID('dbo.architecture_daily_stats'))
CREATE INDEX [idx_stats_date] ON dbo.architecture_daily_stats([stat_date]);
GO

-- ============================================
-- 13. 建筑风格映射表
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
-- 14. 建筑热度统计表
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
-- 15. 热门搜索词汇总表
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_search_count' AND object_id = OBJECT_ID('dbo.popular_search_terms'))
CREATE INDEX [idx_search_count] ON dbo.popular_search_terms([search_count] DESC);
GO

-- ============================================
-- 16. 用户筛选预设表
-- ============================================
IF OBJECT_ID('dbo.user_filter_presets', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_filter_presets (
            [preset_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
            [user_id] INT NOT NULL,
            [preset_name] NVARCHAR(100) NOT NULL,
            [filter_json] NVARCHAR(MAX) NOT NULL,
            [created_at] DATETIME DEFAULT GETDATE(),
            [updated_at] DATETIME DEFAULT GETDATE(),
            [view_count] INT DEFAULT 1,
            CONSTRAINT UQ_user_preset UNIQUE ([user_id], [preset_name])
        );
    END
GO

-- ============================================
-- 17. 触发器
-- ============================================

-- 删除相关建筑级联触发器
IF OBJECT_ID('dbo.trg_delete_related_architectures', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_delete_related_architectures;
GO

CREATE TRIGGER dbo.trg_delete_related_architectures
ON dbo.ancient_architecture
INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- 清理双向关联关系
    DELETE FROM dbo.related_architectures
    WHERE [primary_architecture_id] IN (SELECT [architecture_id] FROM deleted)
       OR [related_architecture_id] IN (SELECT [architecture_id] FROM deleted);

    -- 执行主表删除（触发其他表 CASCADE 级联）
    DELETE FROM dbo.ancient_architecture
    WHERE [architecture_id] IN (SELECT [architecture_id] FROM deleted);
END
GO

-- 更新时间触发器
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
-- 18. 热门建筑视图
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
    ISNULL(view_stats.total_views, 0) AS view_count,
    ISNULL(fav_stats.total_favorites, 0) AS favorite_count,
    (ISNULL(view_stats.total_views, 0) * 0.7 + ISNULL(fav_stats.total_favorites, 0) * 0.3) AS popularity_score
FROM dbo.ancient_architecture a
         LEFT JOIN (
    SELECT architecture_id, COUNT(*) AS total_views
    FROM dbo.architecture_views
    GROUP BY architecture_id
) view_stats ON a.architecture_id = view_stats.architecture_id
         LEFT JOIN (
    SELECT architecture_id, COUNT(*) AS total_favorites
    FROM dbo.architecture_favorites
    GROUP BY architecture_id
) fav_stats ON a.architecture_id = fav_stats.architecture_id;
GO

-- ============================================
-- 19. 初始化朝代数据（幂等插入）
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
           (N'现代', 1949, 2023, '中华人民共和国')
) AS source ([dynasty_name], [start_year], [end_year], [description])
ON target.[dynasty_name] = source.[dynasty_name]
WHEN NOT MATCHED THEN
    INSERT ([dynasty_name], [start_year], [end_year], [description])
    VALUES (source.[dynasty_name], source.[start_year], source.[end_year], source.[description]);
GO

PRINT 'Architecture 数据库初始化完成';

SELECT * FROM ancient_architecture;