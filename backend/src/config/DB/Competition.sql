IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Competition')
BEGIN
    CREATE DATABASE [Competition];
END
GO
USE [Competition];
GO

-- ============================================
-- 1. 竞赛模式表
-- ============================================
IF OBJECT_ID('dbo.competition_mode', 'U') IS NULL
BEGIN
    CREATE TABLE [competition_mode] (
        [mode_id] VARCHAR(50) NOT NULL PRIMARY KEY,
        [title] NVARCHAR(50) NOT NULL,
        [description] NVARCHAR(255) NULL,
        [difficulty] NVARCHAR(20) NULL,
        [time_limit] INT NOT NULL DEFAULT 600,
        [icon] NVARCHAR(20) NULL,
        [is_active] BIT NOT NULL DEFAULT 1,
        [sort_order] INT NOT NULL DEFAULT 0
    );
    ALTER TABLE [competition_mode] ADD CONSTRAINT CK_time_limit CHECK ([time_limit] >= 0);
END
GO

-- ============================================
-- 2. 每日挑战表
-- ============================================
IF OBJECT_ID('dbo.daily_challenge', 'U') IS NULL
BEGIN
    CREATE TABLE [daily_challenge] (
        [challenge_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [challenge_date] DATE NOT NULL UNIQUE,
        [title] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(MAX) NULL,
        [image_url] VARCHAR(255) NULL,
        [difficulty] NVARCHAR(20) NOT NULL DEFAULT N'困难',
        [points_reward] INT NOT NULL DEFAULT 100,
        [question_count] INT NOT NULL DEFAULT 5,
        [time_limit] INT NOT NULL DEFAULT 300,
        [external_building_ids] NVARCHAR(MAX) NULL
    );
    ALTER TABLE [daily_challenge] ADD CONSTRAINT CK_challenge_points_reward CHECK ([points_reward] >= 0);
    ALTER TABLE [daily_challenge] ADD CONSTRAINT CK_challenge_question_count CHECK ([question_count] > 0);
    ALTER TABLE [daily_challenge] ADD CONSTRAINT CK_challenge_time_limit CHECK ([time_limit] >= 0);
END
GO

-- ============================================
-- 3. 竞赛题目表
-- ============================================
IF OBJECT_ID('dbo.question', 'U') IS NULL
BEGIN
    CREATE TABLE [question] (
        [question_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_building_id] INT NOT NULL,
        [question_text] NVARCHAR(MAX) NOT NULL,
        [option_a] NVARCHAR(255) NOT NULL,
        [option_b] NVARCHAR(255) NOT NULL,
        [option_c] NVARCHAR(255) NULL,
        [option_d] NVARCHAR(255) NULL,
        [correct_answer] CHAR(1) NOT NULL,
        [explanation] NVARCHAR(MAX) NULL,
        [difficulty] NVARCHAR(20) NOT NULL DEFAULT 'medium',
        [points] INT NOT NULL DEFAULT 5,
        [created_at] DATETIME DEFAULT GETDATE(),
        [category] VARCHAR(50) NULL
    );
    ALTER TABLE [question] ADD CONSTRAINT CK_question_building_id CHECK ([external_building_id] > 0);
    ALTER TABLE [question] ADD CONSTRAINT CK_correct_answer CHECK ([correct_answer] IN ('A','B','C','D'));
    ALTER TABLE [question] ADD CONSTRAINT CK_question_difficulty CHECK ([difficulty] IN (N'入门', N'基础', N'挑战', N'进阶', N'资深'));
    ALTER TABLE [question] ADD CONSTRAINT CK_question_points CHECK ([points] >= 0);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_difficulty' AND object_id = OBJECT_ID('dbo.question'))
    CREATE INDEX [idx_difficulty] ON dbo.[question]([difficulty]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_category' AND object_id = OBJECT_ID('dbo.question'))
    CREATE INDEX [idx_category] ON dbo.[question]([category]);
GO

-- ============================================
-- 4. 题目标签表
-- ============================================
IF OBJECT_ID('dbo.question_tags', 'U') IS NULL
BEGIN
    CREATE TABLE [question_tags] (
        [tag_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [tag_name] NVARCHAR(50) NOT NULL UNIQUE,
        [category] VARCHAR(50) NULL
    );
END
GO

-- ============================================
-- 5. 题目-标签关联表
-- ============================================
IF OBJECT_ID('dbo.question_tag_mappings', 'U') IS NULL
BEGIN
    CREATE TABLE [question_tag_mappings] (
        [question_id] INT NOT NULL,
        [tag_id] INT NOT NULL,
        CONSTRAINT [PK_question_tag_mappings] PRIMARY KEY ([question_id], [tag_id]),
        CONSTRAINT [FK_question_tag_mappings_question]
        FOREIGN KEY ([question_id]) REFERENCES [question]([question_id]) ON DELETE CASCADE
    );
END
GO

-- ============================================
-- 6. 用户答题记录表
-- ============================================
IF OBJECT_ID('dbo.user_answer_history', 'U') IS NULL
BEGIN
    CREATE TABLE [user_answer_history] (
        [record_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_user_id] INT NOT NULL,
        [question_id] INT NOT NULL,
        [selected_answer] CHAR(1) NOT NULL,
        [is_correct] BIT NOT NULL,
        [points_earned] INT NOT NULL DEFAULT 0,
        [answered_at] DATETIME DEFAULT GETDATE(),
        [session_id] VARCHAR(100) NULL,
        [competition_mode] VARCHAR(50) NULL,
        [difficulty_level] NVARCHAR(20) NULL
    );
    ALTER TABLE [user_answer_history] ADD CONSTRAINT CK_answer_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE [user_answer_history] ADD CONSTRAINT CK_selected_answer CHECK ([selected_answer] IN ('A','B','C','D'));
    ALTER TABLE [user_answer_history] ADD CONSTRAINT CK_points_earned CHECK ([points_earned] >= 0);
    ALTER TABLE [user_answer_history] ADD CONSTRAINT CK_difficulty_level CHECK ([difficulty_level] IS NULL OR [difficulty_level] IN (N'入门', N'基础', N'挑战', N'进阶', N'资深'));
    ALTER TABLE [user_answer_history]
        ADD CONSTRAINT [FK_user_answer_history_question]
        FOREIGN KEY ([question_id]) REFERENCES [question]([question_id]) ON DELETE CASCADE;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_question' AND object_id = OBJECT_ID('dbo.user_answer_history'))
    CREATE INDEX [idx_user_question] ON dbo.[user_answer_history]([external_user_id], [question_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_time' AND object_id = OBJECT_ID('dbo.user_answer_history'))
    CREATE INDEX [idx_user_time] ON dbo.[user_answer_history]([external_user_id], [answered_at]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_question' AND object_id = OBJECT_ID('dbo.user_answer_history'))
    CREATE INDEX [idx_question] ON dbo.[user_answer_history]([question_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_difficulty_level' AND object_id = OBJECT_ID('dbo.user_answer_history'))
    CREATE INDEX [idx_difficulty_level] ON dbo.[user_answer_history]([difficulty_level]);
GO

-- ============================================
-- 7. 用户竞赛积分总表
-- ============================================
IF OBJECT_ID('dbo.user_competition_points', 'U') IS NULL
BEGIN
    CREATE TABLE [user_competition_points] (
        [record_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_user_id] INT NOT NULL,
        [total_points] INT NOT NULL DEFAULT 0,
        [entry_points] INT NOT NULL DEFAULT 0,
        [basic_points] INT NOT NULL DEFAULT 0,
        [challenge_points] INT NOT NULL DEFAULT 0,
        [advanced_points] INT NOT NULL DEFAULT 0,
        [expert_points] INT NOT NULL DEFAULT 0,
        [current_level] INT NOT NULL DEFAULT 1,
        [games_played] INT NOT NULL DEFAULT 0,
        [total_correct] INT NOT NULL DEFAULT 0,
        [total_questions] INT NOT NULL DEFAULT 0,
        [updated_at] DATETIME DEFAULT GETDATE()
    );
    ALTER TABLE [user_competition_points] ADD CONSTRAINT UQ_user_competition_points_user UNIQUE ([external_user_id]);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_ucp_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_total_points CHECK ([total_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_entry_points CHECK ([entry_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_basic_points CHECK ([basic_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_challenge_points CHECK ([challenge_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_advanced_points CHECK ([advanced_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_expert_points CHECK ([expert_points] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_current_level CHECK ([current_level] >= 1 AND [current_level] <= 5);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_games_played CHECK ([games_played] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_total_correct CHECK ([total_correct] >= 0);
    ALTER TABLE [user_competition_points] ADD CONSTRAINT CK_total_questions CHECK ([total_questions] >= 0);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_points' AND object_id = OBJECT_ID('dbo.user_competition_points'))
    CREATE INDEX [idx_user_points] ON dbo.[user_competition_points]([external_user_id], [total_points]);
GO

-- ============================================
-- 8. 积分变动记录表
-- ============================================
IF OBJECT_ID('dbo.points_transaction', 'U') IS NULL
BEGIN
    CREATE TABLE [points_transaction] (
        [transaction_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_user_id] INT NOT NULL,
        [points_change] INT NOT NULL,
        [transaction_type] VARCHAR(50) NOT NULL,
        [reference_id] VARCHAR(100) NULL,
        [difficulty_level] NVARCHAR(20) NULL,
        [description] NVARCHAR(255) NULL,
        [created_at] DATETIME DEFAULT GETDATE()
    );
    ALTER TABLE [points_transaction] ADD CONSTRAINT CK_pt_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE [points_transaction] ADD CONSTRAINT CK_transaction_type CHECK ([transaction_type] IN ('game_complete', 'daily_bonus', 'achievement', 'difficulty_bonus', 'streak_bonus'));
    ALTER TABLE [points_transaction] ADD CONSTRAINT CK_pt_difficulty_level CHECK ([difficulty_level] IS NULL OR [difficulty_level] IN (N'入门', N'基础', N'挑战', N'进阶', N'资深'));
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_transaction' AND object_id = OBJECT_ID('dbo.points_transaction'))
    CREATE INDEX [idx_user_transaction] ON dbo.[points_transaction]([external_user_id], [created_at]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_transaction_type' AND object_id = OBJECT_ID('dbo.points_transaction'))
    CREATE INDEX [idx_transaction_type] ON dbo.[points_transaction]([transaction_type]);
GO

-- ============================================
-- 9. 防重复答题缓存表
-- ============================================
IF OBJECT_ID('dbo.user_question_cache', 'U') IS NULL
BEGIN
    CREATE TABLE [user_question_cache] (
        [cache_id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [external_user_id] INT NOT NULL,
        [question_id] INT NOT NULL,
        [last_answered_at] DATETIME DEFAULT GETDATE(),
        [correct_count] INT NOT NULL DEFAULT 0,
        [total_attempts] INT NOT NULL DEFAULT 1
    );
    ALTER TABLE [user_question_cache] ADD CONSTRAINT CK_cache_user_id CHECK ([external_user_id] > 0);
    ALTER TABLE [user_question_cache] ADD CONSTRAINT CK_correct_count CHECK ([correct_count] >= 0);
    ALTER TABLE [user_question_cache] ADD CONSTRAINT CK_total_attempts CHECK ([total_attempts] > 0);
    ALTER TABLE [user_question_cache] ADD CONSTRAINT [UQ_user_question] UNIQUE ([external_user_id], [question_id]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_cache_user' AND object_id = OBJECT_ID('dbo.user_question_cache'))
    CREATE INDEX [idx_user] ON [user_question_cache]([external_user_id]);
GO

-- ============================================
-- 10. 默认模式数据
-- ============================================
MERGE INTO [competition_mode] AS target
USING (
    VALUES
    ('entry', N'入门模式', N'5道简单题目，适合初学者', N'入门', 180, N'🌱', 1, 1),
    ('basic', N'基础模式', N'8道基础题目，巩固知识', N'基础', 240, N'📚', 1, 2),
    ('challenge', N'挑战模式', N'10道中等难度题目', N'挑战', 300, N'⚡', 1, 3),
    ('advanced', N'进阶模式', N'12道较难题目，考验深度', N'进阶', 360, N'🏛️', 1, 4),
    ('expert', N'专家模式', N'15道高难度题目，大师挑战', N'资深', 480, N'👑', 1, 5)
) AS source ([mode_id], [title], [description], [difficulty], [time_limit], [icon], [is_active], [sort_order])
ON target.[mode_id] = source.[mode_id]
WHEN NOT MATCHED THEN
    INSERT ([mode_id], [title], [description], [difficulty], [time_limit], [icon], [is_active], [sort_order])
    VALUES (source.[mode_id], source.[title], source.[description], source.[difficulty], source.[time_limit], source.[icon], source.[is_active], source.[sort_order]);
GO

PRINT 'Competition 数据库初始化完成';
