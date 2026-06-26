-- ============================================
-- 华夏营造 - 建筑内容模块数据库
-- 管理古代建筑信息、历史发展、技术结构和文化意义
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
        [main_image_url] NVARCHAR(255) NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [updated_at] DATETIME DEFAULT GETDATE()
    );
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
-- 14. 创建索引
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
GO

-- ============================================
-- 15. 删除相关建筑级联触发器
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
-- 16. 更新时间触发器
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
-- 17. 热门建筑视图
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
-- 18. 初始化朝代数据（幂等插入）
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
-- 19. 存储过程
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
    @main_image_url NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.ancient_architecture ([name], [chinese_name], [location], [coordinates], [type],
        [founding_dynasty], [completed_dynasty], [protection_level], [brief_description],
        [full_description], [main_image_url])
    VALUES (@name, @chinese_name, @location, @coordinates, @type,
        @founding_dynasty, @completed_dynasty, @protection_level, @brief_description,
        @full_description, @main_image_url);
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
    @main_image_url NVARCHAR(255) = NULL
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
        [main_image_url] = COALESCE(@main_image_url, [main_image_url])
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

PRINT 'Architecture 数据库初始化完成';