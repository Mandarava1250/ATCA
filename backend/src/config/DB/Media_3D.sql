IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'Media_3D')
    BEGIN
        CREATE DATABASE [Media_3D];
    END
GO

USE [Media_3D];
GO

-- ============================================
-- 1. 用户模型表 (user_models)
-- ============================================
IF OBJECT_ID('dbo.user_models', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.user_models (
            [model_id] INT IDENTITY(1,1) PRIMARY KEY,
            [user_id] INT NOT NULL,
            [model_name] NVARCHAR(255) NOT NULL,
            [model_data] NVARCHAR(MAX) NULL,
            [thumbnail_url] NVARCHAR(500) NULL,
            [is_public] BIT DEFAULT 0,
            [download_count] INT DEFAULT 0,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE(),
            [is_featured] BIT NOT NULL DEFAULT 0
        );
    END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_models_user_id' AND object_id = OBJECT_ID('dbo.user_models'))
    CREATE INDEX [idx_user_models_user_id] ON dbo.user_models([user_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_models_is_public' AND object_id = OBJECT_ID('dbo.user_models'))
    CREATE INDEX [idx_user_models_is_public] ON dbo.user_models([is_public]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_models_created_at' AND object_id = OBJECT_ID('dbo.user_models'))
    CREATE INDEX [idx_user_models_created_at] ON dbo.user_models([created_at]);
GO

IF OBJECT_ID('dbo.tr_user_models_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_user_models_updated_at;
GO

CREATE TRIGGER dbo.tr_user_models_updated_at
ON dbo.user_models
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.user_models
    SET [updated_at] = GETDATE()
    WHERE [model_id] IN (SELECT DISTINCT [model_id] FROM inserted);
END;
GO

-- ============================================
-- 2. 构件定义表 (model_component_definitions)
-- ============================================
IF OBJECT_ID('dbo.model_component_definitions', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.model_component_definitions (
            [definition_id] INT IDENTITY(1,1) PRIMARY KEY,
            [type] NVARCHAR(100) NOT NULL UNIQUE,
            [category] NVARCHAR(50) NOT NULL,
            [name] NVARCHAR(255) NOT NULL,
            [description] NVARCHAR(MAX) NULL,
            [dimensions] NVARCHAR(MAX) NULL,
            [material] NVARCHAR(MAX) NULL,
            [snap_points] NVARCHAR(MAX) NULL,
            [era] NVARCHAR(MAX) NULL,
            [complexity] NVARCHAR(20) DEFAULT 'simple',
            [tags] NVARCHAR(MAX) NULL,
            [is_active] BIT DEFAULT 1,
            [created_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_component_defs_category' AND object_id = OBJECT_ID('dbo.model_component_definitions'))
    CREATE INDEX [idx_component_defs_category] ON dbo.model_component_definitions([category]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_component_defs_type' AND object_id = OBJECT_ID('dbo.model_component_definitions'))
    CREATE INDEX [idx_component_defs_type] ON dbo.model_component_definitions([type]);
GO

-- ============================================
-- 3. 模型构件实例表 (model_component_instances)
-- ============================================
IF OBJECT_ID('dbo.model_component_instances', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.model_component_instances (
            [instance_id] INT IDENTITY(1,1) PRIMARY KEY,
            [model_id] INT NOT NULL,
            [definition_id] INT NOT NULL,
            [instance_uuid] NVARCHAR(100) NOT NULL,
            [position] NVARCHAR(MAX) NOT NULL,
            [rotation] NVARCHAR(MAX) NOT NULL,
            [scale] NVARCHAR(MAX) DEFAULT '{"x": 1, "y": 1, "z": 1}',
            [custom_material] NVARCHAR(MAX) NULL,
            [parent_instance_id] INT NULL,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE(),
            CONSTRAINT fk_instances_model FOREIGN KEY ([model_id]) REFERENCES dbo.user_models([model_id]) ON DELETE CASCADE,
            CONSTRAINT fk_instances_definition FOREIGN KEY ([definition_id]) REFERENCES dbo.model_component_definitions([definition_id])
        );
    END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_instances_model_id' AND object_id = OBJECT_ID('dbo.model_component_instances'))
    CREATE INDEX [idx_instances_model_id] ON dbo.model_component_instances([model_id]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_instances_instance_uuid' AND object_id = OBJECT_ID('dbo.model_component_instances'))
    CREATE INDEX [idx_instances_instance_uuid] ON dbo.model_component_instances([instance_uuid]);
GO

IF OBJECT_ID('dbo.tr_component_instances_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_component_instances_updated_at;
GO

CREATE TRIGGER dbo.tr_component_instances_updated_at
ON dbo.model_component_instances
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.model_component_instances
    SET [updated_at] = GETDATE()
    WHERE [instance_id] IN (SELECT DISTINCT [instance_id] FROM inserted);
END;
GO

-- ============================================
-- 4. 固件组表 (model_firmware_groups)
-- ============================================
IF OBJECT_ID('dbo.model_firmware_groups', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.model_firmware_groups (
            [group_id] INT IDENTITY(1,1) PRIMARY KEY,
            [group_name] NVARCHAR(255) NOT NULL,
            [description] NVARCHAR(MAX) NULL,
            [category] NVARCHAR(100) NOT NULL,
            [era] NVARCHAR(100) NULL,
            [component_types] NVARCHAR(MAX) NULL,
            [thumbnail_url] NVARCHAR(500) NULL,
            [complexity_level] INT DEFAULT 1,
            [is_active] BIT DEFAULT 1,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO

IF OBJECT_ID('dbo.tr_firmware_groups_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_firmware_groups_updated_at;
GO

CREATE TRIGGER dbo.tr_firmware_groups_updated_at
ON dbo.model_firmware_groups
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.model_firmware_groups
    SET [updated_at] = GETDATE()
    WHERE [group_id] IN (SELECT DISTINCT [group_id] FROM inserted);
END;
GO

-- ============================================
-- 5. 固件组构件关联表 (model_firmware_group_components)
-- ============================================
IF OBJECT_ID('dbo.model_firmware_group_components', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.model_firmware_group_components (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [group_id] INT NOT NULL,
            [definition_id] INT NOT NULL,
            [relative_position] NVARCHAR(MAX) NOT NULL,
            [relative_rotation] NVARCHAR(MAX) DEFAULT '{"x": 0, "y": 0, "z": 0}',
            [scale] NVARCHAR(MAX) DEFAULT '{"x": 1, "y": 1, "z": 1}',
            [order_index] INT DEFAULT 0,
            CONSTRAINT fk_group_components_group FOREIGN KEY ([group_id]) REFERENCES dbo.model_firmware_groups([group_id]) ON DELETE CASCADE,
            CONSTRAINT fk_group_components_definition FOREIGN KEY ([definition_id]) REFERENCES dbo.model_component_definitions([definition_id])
        );
    END
GO

-- ============================================
-- 6. 经典古建筑库模型表 (architecture_models)
-- ============================================
IF OBJECT_ID('dbo.architecture_models', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.architecture_models (
            [model_id] INT IDENTITY(1,1) PRIMARY KEY,
            [model_name] NVARCHAR(255) NOT NULL,
            [external_architecture_id] INT NULL,
            [model_format] NVARCHAR(20) NOT NULL DEFAULT 'gltf',
            [file_size] BIGINT DEFAULT 0,
            [model_url] NVARCHAR(500) NULL,
            [preview_image_url] NVARCHAR(500) NULL,
            [is_public] BIT DEFAULT 1,
            [is_featured] BIT DEFAULT 0,
            [era] NVARCHAR(50) NULL,
            [complexity_level] INT DEFAULT 1,
            [description] NVARCHAR(MAX) NULL,
            [download_count] INT DEFAULT 0,
            [created_by] INT NULL,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO

IF OBJECT_ID('dbo.tr_architecture_models_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_architecture_models_updated_at;
GO

CREATE TRIGGER dbo.tr_architecture_models_updated_at
ON dbo.architecture_models
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.architecture_models
    SET [updated_at] = GETDATE()
    WHERE [model_id] IN (SELECT DISTINCT [model_id] FROM inserted);
END;
GO

-- ============================================
-- 7. 3D模型管理表 (three_d_models)
-- ============================================
IF OBJECT_ID('dbo.three_d_models', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.three_d_models (
            [model_id] INT IDENTITY(1,1) PRIMARY KEY,
            [model_name] NVARCHAR(255) NOT NULL,
            [external_architecture_id] INT NULL,
            [model_format] NVARCHAR(20) NOT NULL DEFAULT 'gltf',
            [file_size] BIGINT DEFAULT 0,
            [model_url] NVARCHAR(500) NULL,
            [preview_image_url] NVARCHAR(500) NULL,
            [is_public] BIT DEFAULT 1,
            [is_featured] BIT DEFAULT 0,
            [era] NVARCHAR(50) NULL,
            [complexity_level] INT DEFAULT 1,
            [description] NVARCHAR(MAX) NULL,
            [download_count] INT DEFAULT 0,
            [created_by] INT NULL,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO

IF OBJECT_ID('dbo.tr_three_d_models_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_three_d_models_updated_at;
GO

CREATE TRIGGER dbo.tr_three_d_models_updated_at
ON dbo.three_d_models
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.three_d_models
    SET [updated_at] = GETDATE()
    WHERE [model_id] IN (SELECT DISTINCT [model_id] FROM inserted);
END;
GO

-- ============================================
-- 8. 建筑模板表 (building_templates)
-- ============================================
IF OBJECT_ID('dbo.building_templates', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.building_templates (
            [template_id] INT IDENTITY(1,1) PRIMARY KEY,
            [template_name] NVARCHAR(255) NOT NULL,
            [description] NVARCHAR(MAX) NULL,
            [category] NVARCHAR(100) NOT NULL,
            [building_type] NVARCHAR(100) NOT NULL,
            [era] NVARCHAR(50) NULL,
            [complexity_level] INT DEFAULT 1,
            [thumbnail_url] NVARCHAR(500) NULL,
            [template_structure] NVARCHAR(MAX) NOT NULL,
            [default_dimensions] NVARCHAR(MAX) NULL,
            [is_featured] BIT DEFAULT 0,
            [is_active] BIT DEFAULT 1,
            [created_by] INT NULL,
            [created_at] DATETIME2 DEFAULT GETDATE(),
            [updated_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO

IF OBJECT_ID('dbo.tr_building_templates_updated_at', 'TR') IS NOT NULL
    DROP TRIGGER dbo.tr_building_templates_updated_at;
GO

CREATE TRIGGER dbo.tr_building_templates_updated_at
ON dbo.building_templates
    AFTER UPDATE
    AS
BEGIN
    SET NOCOUNT ON;
        UPDATE dbo.building_templates
    SET [updated_at] = GETDATE()
    WHERE [template_id] IN (SELECT DISTINCT [template_id] FROM inserted);
END;
GO

-- ============================================
-- 9. 模板构件关联表 (template_components)
-- ============================================
IF OBJECT_ID('dbo.template_components', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.template_components (
            [id] INT IDENTITY(1,1) PRIMARY KEY,
            [template_id] INT NOT NULL,
            [definition_id] INT NOT NULL,
            [component_role] NVARCHAR(100) NOT NULL,
            [build_order] INT NOT NULL,
            [build_stage] NVARCHAR(50) NOT NULL,
            [relative_position] NVARCHAR(MAX) NOT NULL,
            [relative_rotation] NVARCHAR(MAX) DEFAULT '{"x": 0, "y": 0, "z": 0}',
            [scale] NVARCHAR(MAX) DEFAULT '{"x": 1, "y": 1, "z": 1}',
            [is_required] BIT DEFAULT 1,
            [placement_hint] NVARCHAR(500) NULL,
            CONSTRAINT fk_template_components_template FOREIGN KEY ([template_id]) REFERENCES dbo.building_templates([template_id]) ON DELETE CASCADE,
            CONSTRAINT fk_template_components_definition FOREIGN KEY ([definition_id]) REFERENCES dbo.model_component_definitions([definition_id])
        );
    END
GO

-- ============================================
-- 10. 构建步骤记录表 (build_steps)
-- ============================================
IF OBJECT_ID('dbo.build_steps', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.build_steps (
            [step_id] INT IDENTITY(1,1) PRIMARY KEY,
            [model_id] INT NOT NULL,
            [user_id] INT NOT NULL,
            [step_number] INT NOT NULL,
            [action_type] NVARCHAR(50) NOT NULL,
            [component_type] NVARCHAR(100) NULL,
            [component_id] NVARCHAR(100) NULL,
            [definition_id] INT NULL,
            [position_before] NVARCHAR(MAX) NULL,
            [position_after] NVARCHAR(MAX) NULL,
            [rotation_before] NVARCHAR(MAX) NULL,
            [rotation_after] NVARCHAR(MAX) NULL,
            [scale_before] NVARCHAR(MAX) NULL,
            [scale_after] NVARCHAR(MAX) NULL,
            [build_stage] NVARCHAR(50) NULL,
            [step_description] NVARCHAR(500) NULL,
            [is_validated] BIT DEFAULT 0,
            [validation_message] NVARCHAR(500) NULL,
            [created_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO

-- ============================================
-- 11. 构件推荐关系表 (component_relations)
-- ============================================
IF OBJECT_ID('dbo.component_relations', 'U') IS NULL
    BEGIN
        CREATE TABLE dbo.component_relations (
            [relation_id] INT IDENTITY(1,1) PRIMARY KEY,
            [current_component_type] NVARCHAR(100) NOT NULL,
            [current_category] NVARCHAR(50) NOT NULL,
            [recommended_component_type] NVARCHAR(100) NOT NULL,
            [recommended_category] NVARCHAR(50) NOT NULL,
            [recommended_definition_id] INT NULL,
            [build_stage] NVARCHAR(50) NOT NULL,
            [relation_type] NVARCHAR(50) DEFAULT 'sequential',
            [priority] INT DEFAULT 1,
            [reason] NVARCHAR(500) NULL,
            [condition_description] NVARCHAR(500) NULL,
            [is_active] BIT DEFAULT 1,
            [created_at] DATETIME2 DEFAULT GETDATE()
        );
    END
GO

-- ============================================
-- 插入默认构件定义数据（幂等方式）
-- ============================================
MERGE INTO dbo.model_component_definitions AS target
USING (VALUES
           ('pillar_round', 'pillar', N'圆柱', N'传统圆形木柱，用于主要承重', '{"x": 0.3, "y": 3, "z": 0.3}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "top", "localPosition": [0, 1.5, 0], "type": "mortise"}, {"id": "bottom", "localPosition": [0, -1.5, 0], "type": "tenon"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["承重", "主要构件"]'),
           ('pillar_square', 'pillar', N'方柱', N'方形石柱或木柱', '{"x": 0.35, "y": 3, "z": 0.35}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "top", "localPosition": [0, 1.5, 0], "type": "mortise"}, {"id": "bottom", "localPosition": [0, -1.5, 0], "type": "tenon"}]', '["song", "yuan", "ming", "qing"]', 'simple', '["承重", "主要构件"]'),
           ('pillar_corner', 'pillar', N'角柱', N'建筑角落的柱子', '{"x": 0.35, "y": 3, "z": 0.35}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "top", "localPosition": [0, 1.5, 0], "type": "mortise"}, {"id": "bottom", "localPosition": [0, -1.5, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'medium', '["承重", "转角"]'),
           ('beam_main', 'beam', N'主梁', N'主要水平承重构件', '{"x": 4, "y": 0.4, "z": 0.3}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "left", "localPosition": [-2, 0, 0], "type": "tenon"}, {"id": "right", "localPosition": [2, 0, 0], "type": "tenon"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["承重", "主要构件"]'),
           ('beam_cross', 'beam', N'横梁', N'横向连接梁', '{"x": 3, "y": 0.3, "z": 0.25}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "left", "localPosition": [-1.5, 0, 0], "type": "tenon"}, {"id": "right", "localPosition": [1.5, 0, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'simple', '["承重", "连接"]'),
           ('beam_purlin', 'beam', N'檩条', N'支撑屋顶的梁', '{"x": 3.5, "y": 0.25, "z": 0.2}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "left", "localPosition": [-1.75, 0, 0], "type": "tenon"}, {"id": "right", "localPosition": [1.75, 0, 0], "type": "tenon"}]', '["song", "yuan", "ming", "qing"]', 'simple', '["承重", "屋顶"]'),
           ('roof_hipped', 'roof', N'歇山顶', N'四坡屋顶', '{"x": 4, "y": 1.5, "z": 4}', '{"type": "tile", "color": 3090452, "roughness": 0.7, "metalness": 0.0}', '[{"id": "bottom", "localPosition": [0, -0.75, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'complex', '["屋顶", "高级"]'),
           ('roof_gable', 'roof', N'悬山顶', N'两面坡屋顶', '{"x": 4, "y": 1.2, "z": 3}', '{"type": "tile", "color": 3090452, "roughness": 0.7, "metalness": 0.0}', '[{"id": "bottom", "localPosition": [0, -0.6, 0], "type": "tenon"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'medium', '["屋顶", "常见"]'),
           ('base_platform', 'base', N'台基', N'建筑基础平台', '{"x": 6, "y": 0.8, "z": 5}', '{"type": "stone", "color": 8421504, "roughness": 0.9, "metalness": 0.0}', '[{"id": "top", "localPosition": [0, 0.4, 0], "type": "mortise"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["基础", "主要构件"]'),
           ('base_stairs', 'base', N'台阶', N'台基台阶', '{"x": 2, "y": 0.6, "z": 1.5}', '{"type": "stone", "color": 8421504, "roughness": 0.9, "metalness": 0.0}', '[{"id": "top", "localPosition": [0, 0.3, -0.5], "type": "mortise"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["基础", "通道"]'),
           ('wall_plain', 'wall', N'实墙', N'普通承重墙体', '{"x": 3, "y": 2.8, "z": 0.3}', '{"type": "brick", "color": 10516397, "roughness": 0.85, "metalness": 0.0}', '[{"id": "top", "localPosition": [0, 1.4, 0], "type": "mortise"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'simple', '["围护", "承重"]'),
           ('door_main', 'door', N'大门', N'主要出入口', '{"x": 2, "y": 2.5, "z": 0.15}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "top", "localPosition": [0, 1.25, 0], "type": "tenon"}]', '["han", "tang", "song", "yuan", "ming", "qing"]', 'medium', '["出入口", "主要构件"]'),
           ('window_lattice', 'window', N'花窗', N'带花纹的窗户', '{"x": 1, "y": 1.2, "z": 0.1}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "center", "localPosition": [0, 0, 0], "type": "any"}]', '["song", "yuan", "ming", "qing"]', 'medium', '["采光", "装饰"]'),
           ('decoration_dougong', 'decoration', N'斗拱', N'柱头与梁之间的过渡构件', '{"x": 0.8, "y": 0.5, "z": 0.8}', '{"type": "wood", "color": 9043968, "roughness": 0.8, "metalness": 0.1}', '[{"id": "bottom", "localPosition": [0, -0.25, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'complex', '["装饰", "结构", "高级"]'),
           ('decoration_ridge', 'decoration', N'屋脊', N'屋顶正脊装饰', '{"x": 3, "y": 0.4, "z": 0.3}', '{"type": "tile", "color": 16766720, "roughness": 0.7, "metalness": 0.0}', '[{"id": "center", "localPosition": [0, 0, 0], "type": "tenon"}]', '["tang", "song", "yuan", "ming", "qing"]', 'medium', '["装饰", "屋顶"]')
) AS source ([type], [category], [name], [description], [dimensions], [material], [snap_points], [era], [complexity], [tags])
ON target.[type] = source.[type]
WHEN NOT MATCHED THEN
    INSERT ([type], [category], [name], [description], [dimensions], [material], [snap_points], [era], [complexity], [tags])
    VALUES (source.[type], source.[category], source.[name], source.[description], source.[dimensions], source.[material], source.[snap_points], source.[era], source.[complexity], source.[tags]);
GO

-- ============================================
-- 创建视图
-- ============================================
IF OBJECT_ID('dbo.vw_component_definitions', 'V') IS NOT NULL
    DROP VIEW dbo.vw_component_definitions;
GO

CREATE VIEW dbo.vw_component_definitions AS
SELECT [definition_id], [type], [category], [name], [description],
       JSON_QUERY([dimensions]) AS dimensions,
       JSON_QUERY([material]) AS material,
       JSON_QUERY([snap_points]) AS snap_points,
       JSON_QUERY([era]) AS era,
       [complexity], JSON_QUERY([tags]) AS tags,
       [is_active], [created_at]
FROM dbo.model_component_definitions
WHERE [is_active] = 1;
GO

IF OBJECT_ID('dbo.vw_model_details', 'V') IS NOT NULL
    DROP VIEW dbo.vw_model_details;
GO

CREATE VIEW dbo.vw_model_details AS
SELECT m.[model_id], m.[user_id], m.[model_name], m.[model_data], m.[thumbnail_url],
       m.[is_public], m.[download_count], m.[created_at], m.[updated_at],
       (SELECT COUNT(*) FROM dbo.model_component_instances WHERE [model_id] = m.[model_id]) AS component_count
FROM dbo.user_models m;
GO

-- ============================================
-- 推荐关系数据
-- ============================================
MERGE INTO dbo.component_relations AS target
USING (VALUES
           ('base_platform', 'base', 'base_stairs', 'base', 'foundation', 'adjacent', 8, N'台基完成后需要添加台阶'),
           ('base_stairs', 'base', 'pillar_round', 'pillar', 'pillar', 'sequential', 9, N'台基完成后开始立柱'),
           ('pillar_round', 'pillar', 'beam_main', 'beam', 'beam', 'sequential', 9, N'柱网完成后需要架梁'),
           ('beam_main', 'beam', 'beam_cross', 'beam', 'beam', 'adjacent', 7, N'主梁需要横梁连接'),
           ('beam_cross', 'beam', 'decoration_dougong', 'decoration', 'bracket', 'sequential', 8, N'梁架完成后可添加斗拱'),
           ('decoration_dougong', 'decoration', 'roof_hipped', 'roof', 'roof', 'sequential', 9, N'斗拱完成后可以盖屋顶'),
           ('roof_hipped', 'roof', 'door_main', 'door', 'door_window', 'sequential', 7, N'屋顶完成后安装门窗'),
           ('roof_hipped', 'roof', 'decoration_ridge', 'decoration', 'decoration', 'adjacent', 6, N'屋脊上可添加脊饰'),
           ('door_main', 'door', 'window_lattice', 'window', 'door_window', 'adjacent', 6, N'大门后可安装窗户')
) AS source ([current_component_type], [current_category], [recommended_component_type], [recommended_category], [build_stage], [relation_type], [priority], [reason])
ON target.[current_component_type] = source.[current_component_type]
    AND target.[recommended_component_type] = source.[recommended_component_type]
WHEN NOT MATCHED THEN
    INSERT ([current_component_type], [current_category], [recommended_component_type], [recommended_category], [build_stage], [relation_type], [priority], [reason])
    VALUES (source.[current_component_type], source.[current_category], source.[recommended_component_type], source.[recommended_category], source.[build_stage], source.[relation_type], source.[priority], source.[reason]);
GO

PRINT 'Media_3D 数据库初始化完成';