-- ============================================
-- 华夏营造 - 知识图谱模块数据库
-- 管理AI知识库、关键词和知识关系，防止AI幻觉
-- ============================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Knowledge')
BEGIN
    CREATE DATABASE [Knowledge];
END
GO

USE [Knowledge];
GO

-- ============================================
-- 1. 知识主题表 (kg_topics)
-- ============================================
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

-- ============================================
-- 2. 知识关键词关联表 (kg_keywords)
-- ============================================
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

-- ============================================
-- 3. 知识关系表 (kg_relations)
-- ============================================
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

-- ============================================
-- 4. AI回答验证记录表 (kg_verifications)
-- ============================================
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

-- ============================================
-- 5. 知识图谱导入历史表 (knowledge_graph_import_history)
-- ============================================
IF OBJECT_ID('dbo.knowledge_graph_import_history', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.knowledge_graph_import_history (
        [import_id] NVARCHAR(50) NOT NULL PRIMARY KEY,
        [format] NVARCHAR(20) NOT NULL,
        [status] NVARCHAR(20) NOT NULL,
        [conflict_strategy] NVARCHAR(20) NOT NULL,
        [total_records] INT DEFAULT 0,
        [success_count] INT DEFAULT 0,
        [failed_count] INT DEFAULT 0,
        [skipped_count] INT DEFAULT 0,
        [created_by] NVARCHAR(100) NOT NULL,
        [created_at] DATETIME DEFAULT GETDATE(),
        [duration] INT NULL,
        [error_message] NVARCHAR(MAX) NULL,
        [report] NVARCHAR(MAX) NULL,
        [errors] NVARCHAR(MAX) NULL
    );
END
GO

-- ============================================
-- 6. 知识图谱实体表 (knowledge_graph_entity)
-- ============================================
IF OBJECT_ID('dbo.knowledge_graph_entity', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.knowledge_graph_entity (
        [entity_id] NVARCHAR(100) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(200) NOT NULL,
        [type] NVARCHAR(50) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [data] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================
-- 7. 知识图谱关系表 (knowledge_graph_relation)
-- ============================================
IF OBJECT_ID('dbo.knowledge_graph_relation', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.knowledge_graph_relation (
        [relation_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [source_id] NVARCHAR(100) NOT NULL,
        [relation_type] NVARCHAR(50) NOT NULL,
        [target_id] NVARCHAR(100) NOT NULL,
        [data] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================
-- 8. 知识图谱审计日志表 (knowledge_graph_audit_log)
-- ============================================
IF OBJECT_ID('dbo.knowledge_graph_audit_log', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.knowledge_graph_audit_log (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [action] NVARCHAR(50) NOT NULL,
        [user] NVARCHAR(100) NOT NULL,
        [user_id] INT NOT NULL,
        [target_type] NVARCHAR(50) NOT NULL,
        [target_id] NVARCHAR(100) NULL,
        [details] NVARCHAR(MAX) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
END
GO

-- ============================================
-- 9. 知识图谱关系类型表 (knowledge_graph_relation_type)
-- ============================================
IF OBJECT_ID('dbo.knowledge_graph_relation_type', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.knowledge_graph_relation_type (
        [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL,
        [name_en] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(500) NULL,
        [domain] NVARCHAR(100) NULL,
        [range] NVARCHAR(100) NULL
    );
END
GO

-- ============================================
-- 10. 创建索引
-- ============================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_topics_category' AND object_id = OBJECT_ID('dbo.kg_topics'))
    CREATE INDEX [idx_kg_topics_category] ON dbo.kg_topics([category]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_topics_key' AND object_id = OBJECT_ID('dbo.kg_topics'))
    CREATE INDEX [idx_kg_topics_key] ON dbo.kg_topics([topic_key]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_keywords_word' AND object_id = OBJECT_ID('dbo.kg_keywords'))
    CREATE INDEX [idx_kg_keywords_word] ON dbo.kg_keywords([keyword]);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_kg_verifications_topic' AND object_id = OBJECT_ID('dbo.kg_verifications'))
    CREATE INDEX [idx_kg_verifications_topic] ON dbo.kg_verifications([matched_topic_id]);
GO

-- ============================================
-- 6. 更新时间触发器
-- ============================================
IF OBJECT_ID('tr_kg_topics_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER tr_kg_topics_updated_at;
GO

CREATE TRIGGER tr_kg_topics_updated_at
ON dbo.kg_topics
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.kg_topics
    SET [updated_at] = GETDATE()
    FROM dbo.kg_topics t
    INNER JOIN inserted i ON t.[topic_id] = i.[topic_id];
END
GO

-- ============================================
-- 7. 存储过程
-- ============================================

-- 根据关键词查询知识
IF OBJECT_ID('dbo.sp_kg_query', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_query;
GO
CREATE PROCEDURE dbo.sp_kg_query
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
        t.[topic_id],
        t.[topic_key],
        t.[topic_name],
        t.[category],
        CASE WHEN @language = 'en' AND t.[content_en] IS NOT NULL THEN t.[content_en] ELSE t.[content_zh] END AS [content],
        t.[source],
        t.[confidence],
        t.[verified],
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
IF OBJECT_ID('dbo.sp_kg_log_verification', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_log_verification;
GO
CREATE PROCEDURE dbo.sp_kg_log_verification
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

-- 获取知识主题列表
IF OBJECT_ID('dbo.sp_kg_get_topics', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_get_topics;
GO
CREATE PROCEDURE dbo.sp_kg_get_topics
    @category NVARCHAR(50) = NULL,
    @page INT = 1,
    @limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @offset INT = (@page - 1) * @limit;
    SELECT t.[topic_id], t.[topic_key], t.[topic_name], t.[category], t.[source], t.[confidence], t.[verified], t.[created_at]
    FROM dbo.kg_topics t
    WHERE (@category IS NULL OR t.[category] = @category)
    ORDER BY t.[created_at] DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
END
GO

-- 添加/更新知识主题
IF OBJECT_ID('dbo.sp_kg_upsert_topic', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_kg_upsert_topic;
GO
CREATE PROCEDURE dbo.sp_kg_upsert_topic
    @topic_key NVARCHAR(100),
    @topic_name NVARCHAR(200),
    @category NVARCHAR(50),
    @content_zh NVARCHAR(MAX),
    @content_en NVARCHAR(MAX) = NULL,
    @source NVARCHAR(200),
    @confidence DECIMAL(3,2) = 0.95,
    @verified BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.kg_topics WHERE [topic_key] = @topic_key)
    BEGIN
        UPDATE dbo.kg_topics
        SET [topic_name] = @topic_name, [category] = @category, [content_zh] = @content_zh,
            [content_en] = @content_en, [source] = @source, [confidence] = @confidence, [verified] = @verified
        WHERE [topic_key] = @topic_key;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.kg_topics ([topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified])
        VALUES (@topic_key, @topic_name, @category, @content_zh, @content_en, @source, @confidence, @verified);
    END
END
GO

-- ============================================
-- 8. 初始化核心知识数据（幂等插入）
-- ============================================

-- 先清空关联数据
DELETE FROM dbo.kg_relations;
DELETE FROM dbo.kg_keywords;
DELETE FROM dbo.kg_topics;
GO

-- 插入核心知识
SET IDENTITY_INSERT dbo.kg_topics ON;

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(1, 'tailiang', '抬梁式结构', 'structure',
'抬梁式（叠梁式）是中国古建筑最主要的木结构形式。特点：柱上承梁，梁上抬梁，逐层缩短，最上层立脊瓜柱承脊檩。适用于宫殿、庙宇等大型建筑。代表：北京故宫太和殿。',
'Tailiang (post-and-beam) is the primary structural form of traditional Chinese architecture. Characteristics: beams supported by columns, with each successive beam shorter, culminating in a ridge post supporting the ridge purlin. Used for palaces, temples, and large-scale buildings. Representative: Hall of Supreme Harmony in the Forbidden City.',
'《华夏营造知识库》', 0.98, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(2, 'chuandou', '穿斗式结构', 'structure',
'穿斗式（立贴式）是南方常见木结构形式。特点：柱距较密，柱头直接承檩，以穿枋连接各柱形成框架。用料省、整体性强，适用于民居等中小型建筑。',
'Chuandou (column-and-tie) style is common in southern China. Characteristics: closely spaced columns directly supporting purlins, connected by tie beams to form a frame. Economical in material, strong integrity, suitable for residential and small-scale buildings.',
'《华夏营造知识库》', 0.98, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(3, 'wudian', '庑殿顶', 'structure',
'庑殿顶（四阿顶）是中国古建筑最高等级的屋顶形制，有一条正脊和四条垂脊，四面斜坡。用于皇宫、庙宇主殿。重檐庑殿顶为最高等级，如太和殿。',
'Wudian (hip) roof is the highest-ranking roof style in Chinese architecture, with one main ridge and four descending ridges forming four slopes. Used for imperial palaces and main temple halls. Double-eave wudian is the highest rank.',
'《华夏营造知识库》', 0.99, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(4, 'xieshan', '歇山顶', 'structure',
'歇山顶（九脊顶）等级仅次于庑殿顶，由正脊、垂脊、戗脊组成，上半部为悬山或硬山式，下半部为四面坡。常用于宫殿次要建筑和庙宇。',
'Xieshan (hip-and-gable) roof ranks second to wudian, composed of main ridge, descending ridges, and hip ridges, with an upper gable section and lower hipped section. Commonly used for secondary palace buildings and temples.',
'《华夏营造知识库》', 0.98, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(5, 'dougong', '斗拱（铺作）', 'component',
'斗拱是中国古建筑特有的结构构件，位于柱头与梁架之间，由斗、拱、昂等构件组成。功能：承托屋檐重量、传递荷载、增加出檐深度。清代称斗科。斗口为模数单位。',
'Dougong (bracket sets) is a unique structural component of Chinese architecture, located between columns and beams, composed of blocks, arms, and levers. Functions: supporting eaves, transferring loads, increasing overhang depth.',
'《华夏营造知识库》', 0.99, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(6, 'caifen', '材分制', 'philosophy',
'材分制是宋《营造法式》确立的模数制度。材为基本模数，按拱高分为八等（一等材高9寸，八等材高4.5寸）。所有构件尺寸均以材的倍数确定。实现了标准化设计与施工。',
'The Cai-fen modular system was established in Song Dynasty''s Yingzao Fashi. Cai is the basic module, divided into eight grades. All component dimensions are multiples of cai, enabling standardized design and construction.',
'《营造法式》', 0.98, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(7, 'tang_architecture', '唐代建筑特征', 'period',
'唐代建筑特征：气魄宏伟、斗拱硕大（柱高约50%）、屋面坡度平缓、出檐深远、直棱窗、梭柱。现存唐构：五台山佛光寺东大殿（857年，最早木构）、南禅寺大殿。',
'Tang Dynasty architecture features: grand scale, large bracket sets (about 50% of column height), gentle roof slope, deep overhangs, straight lattice windows, and spindle-shaped columns. Existing examples: Foguang Temple East Hall (857 AD).',
'《华夏营造知识库》', 0.99, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(8, 'foguangsi', '佛光寺东大殿', 'famous',
'佛光寺东大殿（857年）位于山西五台山，是中国现存最早的木构建筑。面阔七间，进深八架椽，单檐庑殿顶。殿内有唐代彩塑、壁画和题记。梁思成、林徽因于1937年发现。',
'Foguang Temple East Hall (857 AD) at Mount Wutai, Shanxi, is the earliest existing wooden structure in China. Seven bays wide, eight rafters deep, single-eave wudian roof. Contains Tang Dynasty sculptures, murals, and inscriptions.',
'《华夏营造知识库》', 0.99, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(9, 'sunmao', '榫卯结构', 'component',
'榫卯是中国古建筑木构件连接方式，不用钉子。常见类型：燕尾榫（抗拉）、馒头榫（承压）、箍头榫（转角连接）、透榫（穿通固定）。体现了以柔克刚的哲学。',
'Mortise and tenon is the joining method for wooden components in Chinese architecture, without nails. Common types: dovetail (tension-resistant), round tenon (compression), scarf joint (corner connection), through tenon (penetrating fixation).',
'《华夏营造知识库》', 0.98, 1);

INSERT INTO dbo.kg_topics ([topic_id], [topic_key], [topic_name], [category], [content_zh], [content_en], [source], [confidence], [verified]) VALUES
(10, 'yingxian', '应县木塔', 'famous',
'佛宫寺释迦塔（应县木塔）位于山西应县，建于辽清宁二年（1056年），是世界现存最高最古的木塔。高67.31米，平面八角形，外观五层六檐，内部九层。纯木结构，无钉无铆。',
'Yingxian Wooden Pagoda (1056 AD) in Shanxi is the tallest and oldest existing wooden pagoda in the world. 67.31 meters high, octagonal plan, five exterior stories with six eaves, nine interior levels. Pure wooden structure without nails.',
'《华夏营造知识库》', 0.99, 1);

SET IDENTITY_INSERT dbo.kg_topics OFF;
GO

-- 插入关键词
INSERT INTO dbo.kg_keywords ([topic_id], [keyword], [weight], [language]) VALUES
(1, '抬梁', 1.5, 'zh'), (1, '抬梁式', 1.5, 'zh'), (1, '叠梁', 1.2, 'zh'), (1, '梁柱', 1.0, 'zh'),
(2, '穿斗', 1.5, 'zh'), (2, '穿斗式', 1.5, 'zh'), (2, '立贴', 1.2, 'zh'), (2, '穿枋', 1.0, 'zh'),
(3, '庑殿', 1.5, 'zh'), (3, '庑殿顶', 1.5, 'zh'), (3, '四阿顶', 1.2, 'zh'), (3, '五脊顶', 1.0, 'zh'),
(4, '歇山', 1.5, 'zh'), (4, '歇山顶', 1.5, 'zh'), (4, '九脊顶', 1.2, 'zh'),
(5, '斗拱', 1.5, 'zh'), (5, '铺作', 1.5, 'zh'), (5, '斗口', 1.2, 'zh'), (5, '斗科', 1.0, 'zh'),
(6, '材分制', 1.5, 'zh'), (6, '营造法式', 1.2, 'zh'), (6, '模数', 1.0, 'zh'),
(7, '唐代', 1.5, 'zh'), (7, '唐', 1.0, 'zh'), (7, '佛光寺', 1.2, 'zh'),
(8, '佛光寺', 1.5, 'zh'), (8, '东大殿', 1.5, 'zh'), (8, '五台山', 1.0, 'zh'),
(9, '榫卯', 1.5, 'zh'), (9, '燕尾榫', 1.2, 'zh'), (9, '馒头榫', 1.0, 'zh'),
(10, '应县木塔', 1.5, 'zh'), (10, '释迦塔', 1.2, 'zh'), (10, '佛宫寺', 1.0, 'zh');
GO

-- 插入关系
INSERT INTO dbo.kg_relations ([from_topic_id], [to_topic_id], [relation_type], [description]) VALUES
(8, 7, 'belongs_to', '佛光寺东大殿是唐代建筑的典型代表'),
(10, 7, 'belongs_to', '应县木塔是辽代建筑，继承唐代风格'),
(1, 5, 'related_to', '抬梁式结构使用斗拱'),
(2, 5, 'related_to', '穿斗式结构使用斗拱'),
(3, 5, 'related_to', '庑殿顶使用斗拱'),
(4, 5, 'related_to', '歇山顶使用斗拱'),
(6, 5, 'related_to', '材分制以斗口为基本模数'),
(9, 1, 'related_to', '榫卯用于抬梁式结构'),
(9, 2, 'related_to', '榫卯用于穿斗式结构');
GO

PRINT 'Knowledge 数据库初始化完成';