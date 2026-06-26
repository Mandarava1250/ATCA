# 华夏营造数据库功能模块划分文档

## 一、文档说明

本文档定义了华夏营造项目的数据库功能模块划分方案，旨在确保各模块之间边界清晰、职责明确，支持独立开发、测试和维护。

## 二、模块划分原则

1. **单一职责原则**：每个模块只负责一个业务领域的功能
2. **低耦合高内聚**：模块内部紧密关联，模块间松耦合
3. **数据一致性**：通过外键约束和事务保证数据完整性
4. **可扩展性**：预留扩展空间，支持未来业务增长
5. **安全性**：基于角色的权限控制，最小权限原则

## 三、功能模块划分方案

### 模块总览

| 模块编号 | 模块名称 | 对应数据库 | 核心职责 |
| :--- | :--- | :--- | :--- |
| MOD-01 | 用户模块 | ATCA_User | 用户注册、登录、个人资料、积分管理、收藏、设置 |
| MOD-02 | 建筑内容模块 | Architecture | 古建筑信息、历史发展、技术结构、浏览统计、搜索热词 |
| MOD-03 | 活动与成就模块 | Activity | 活动管理、成就系统、每日打卡 |
| MOD-04 | 答题竞赛模块 | Competition | 题库管理、答题记录、竞赛积分 |
| MOD-05 | 3D工坊模块 | Media_3D | 用户模型、构件定义、模板管理 |
| MOD-06 | 社区社交模块 | Community | 论坛、评论、分享、点赞 |
| MOD-07 | 知识图谱模块 | Knowledge | AI知识、关键词、关系、验证记录 |
| MOD-08 | 翻译管理模块 | Translation | 多语言翻译、审核流程、翻译记忆 |
| MOD-09 | 数据同步模块 | Sync | 设备管理、同步日志、冲突解决 |
| MOD-10 | 系统配置模块 | System | AI配置、系统参数、全局设置 |

---

### MOD-01: 用户模块 (User)

**模块定义**：管理用户身份认证、个人资料、积分系统、收藏和用户设置

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| users | 用户主表 | user_id, username, email, password, role, points, level, exp |
| user_favorites | 用户收藏 | user_id, item_id, item_type |
| user_settings | 用户设置 | user_id, language, theme, notifications_enabled, auto_sync |
| point_transactions | 积分交易记录 | user_id, transaction_type, amount, balance_before, balance_after |

**核心索引**：
- idx_users_username: 用户名索引
- idx_users_email: 邮箱索引
- idx_users_role: 角色索引
- idx_user_favorites_user: 收藏用户索引
- idx_user_favorites_item: 收藏项目索引
- idx_point_transactions_user: 积分交易用户索引
- idx_point_transactions_type: 交易类型索引

**约束条件**：
- points >= 0
- level >= 1
- role IN ('user', 'admin')
- UNIQUE(username), UNIQUE(email)

**存储过程**：
- sp_user_register: 用户注册
- sp_user_login: 用户登录
- sp_user_update: 更新用户信息
- sp_user_update_points: 更新用户积分
- sp_user_add_favorite: 添加收藏
- sp_user_remove_favorite: 删除收藏
- sp_user_get_favorites: 获取收藏列表
- sp_user_get_settings: 获取用户设置
- sp_user_update_settings: 更新用户设置
- sp_user_get_point_transactions: 获取积分交易记录
- sp_user_get_stats: 获取用户统计信息
- sp_user_get_list: 获取用户列表
- sp_user_update_role: 更新用户角色
- sp_user_toggle_active: 锁定/解锁用户
- sp_user_log_login_attempt: 记录登录尝试

---

### MOD-02: 建筑内容模块 (Architecture)

**模块定义**：管理中国古代建筑的基础信息、历史文化和浏览统计

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| ancient_architecture | 建筑基本信息 | architecture_id, name, chinese_name, location, type, founding_dynasty |
| historical_development | 历史发展 | architecture_id, dynasty_period, development_content |
| technical_structure | 技术结构 | architecture_id, structure_name, technical_category |
| architectural_features | 建筑特色 | architecture_id, feature_name, design_philosophy |
| cultural_significance | 文化意义 | architecture_id, significance_aspect, cultural_interpretation |
| expert_quotes | 专家观点 | architecture_id, expert_name, quote_content |
| related_architectures | 相关建筑关系 | primary_architecture_id, related_architecture_id, relation_type |
| dynasty_year_map | 朝代年代映射 | dynasty_name, start_year, end_year |
| architecture_views | 浏览记录 | user_id, architecture_id, view_time |
| architecture_daily_stats | 每日统计 | architecture_id, stat_date, view_count |
| architecture_popularity | 热度统计 | architecture_id, total_views, total_favorites |
| architecture_style_mappings | 风格映射 | architecture_id, style_name |
| popular_search_terms | 热门搜索词 | term, search_count, category |

**核心索引**：
- idx_ancient_architecture_type: 建筑类型索引
- idx_ancient_architecture_dynasty: 朝代索引
- idx_ancient_architecture_location: 地点索引
- idx_historical_period: 历史时期索引
- idx_technical_category: 技术分类索引
- idx_views_architecture: 浏览建筑索引
- idx_views_time: 浏览时间索引
- idx_stats_date: 统计日期索引
- idx_search_count: 搜索词计数索引

**视图**：
- vw_popular_architectures: 热门建筑视图

**存储过程**：
- sp_architecture_get_list: 获取建筑列表
- sp_architecture_get_detail: 获取建筑详情
- sp_architecture_add: 添加建筑
- sp_architecture_update: 更新建筑
- sp_architecture_delete: 删除建筑
- sp_architecture_search: 搜索建筑
- sp_architecture_log_view: 记录浏览
- sp_architecture_get_popular: 获取热门建筑
- sp_architecture_update_search_term: 更新热门搜索词
- sp_architecture_get_search_terms: 获取热门搜索词
- sp_architecture_get_stats: 获取建筑统计

---

### MOD-03: 活动与成就模块 (Activity)

**模块定义**：管理平台活动、成就系统和每日打卡功能

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| activity | 活动主表 | activity_id, title, start_date, end_date, activity_type |
| achievement | 成就定义 | achievement_id, achievement_name, achievement_type, required_points |
| daily_tasks | 每日任务 | task_id, task_name, points_reward |
| daily_checkin | 每日打卡记录 | checkin_id, user_id, checkin_date, streak_count, points_earned |
| user_activities | 用户活动关联 | user_id, activity_id, joined_at, completed |
| user_activity_participation | 用户参与记录 | external_user_id, activity_id, completion_status |
| user_achievement | 用户成就记录 | external_user_id, achievement_id, obtained_at |

**核心索引**：
- idx_checkin_user_date: 打卡用户日期索引
- idx_activity_type: 活动类型索引
- idx_achievement_type: 成就类型索引

**视图**：
- vw_user_checkin_stats: 用户打卡统计视图

**存储过程**：
- sp_user_checkin: 用户打卡
- sp_get_user_checkins: 获取打卡记录
- sp_get_user_checkin_stats: 获取打卡统计

---

### MOD-04: 答题竞赛模块 (Competition)

**模块定义**：管理题库、答题记录和竞赛积分系统

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| competition_mode | 竞赛模式 | mode_id, title, difficulty, time_limit |
| daily_challenge | 每日挑战 | challenge_id, challenge_date, title, points_reward |
| question | 题目 | question_id, external_building_id, question_text, option_a-d, correct_answer |
| question_tags | 题目标签 | tag_id, tag_name, category |
| question_tag_mappings | 题目-标签关联 | question_id, tag_id |
| user_answer_history | 用户答题记录 | external_user_id, question_id, selected_answer, is_correct |
| user_competition_points | 用户竞赛积分 | external_user_id, total_points, current_level |
| points_transaction | 积分变动记录 | external_user_id, points_change, transaction_type |
| user_question_cache | 防重复答题缓存 | external_user_id, question_id, correct_count |

**核心索引**：
- idx_difficulty: 难度索引
- idx_category: 题目分类索引
- idx_user_question: 用户答题索引

---

### MOD-05: 3D工坊模块 (Workshop)

**模块定义**：管理3D模型、构件定义和建筑模板

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| user_models | 用户模型 | model_id, user_id, model_name, model_data, is_public |
| model_component_definitions | 构件定义 | definition_id, type, category, name, dimensions |
| model_component_instances | 构件实例 | instance_id, model_id, definition_id, position, rotation |
| model_firmware_groups | 固件组 | group_id, group_name, category, era |
| model_firmware_group_components | 固件组构件关联 | group_id, definition_id |
| architecture_models | 经典建筑模型 | model_id, model_name, external_architecture_id |
| three_d_models | 3D模型管理 | model_id, model_name, model_format, model_url |
| building_templates | 建筑模板 | template_id, template_name, category, building_type |
| template_components | 模板构件 | template_id, definition_id, component_role |
| build_steps | 构建步骤记录 | step_id, model_id, user_id, step_number, action_type |
| component_relations | 构件推荐关系 | current_component_type, recommended_component_type |

**核心索引**：
- idx_user_models_user_id: 用户模型索引
- idx_component_defs_category: 构件分类索引
- idx_instances_model_id: 实例模型索引

**视图**：
- vw_component_definitions: 构件定义视图
- vw_model_details: 模型详情视图

---

### MOD-06: 社区社交模块 (Community)

**模块定义**：管理论坛讨论、用户评论和作品分享

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| forum_boards | 论坛板块 | board_id, board_name, description |
| forum_topics | 论坛主题 | topic_id, board_id, user_id, title, content |
| forum_replies | 论坛回复 | reply_id, topic_id, user_id, content, floor_number |
| building_shares | 建筑分享 | share_id, user_id, model_id, title |
| showcases | 作品展示 | showcase_id, user_id, title, model_data |
| comments | 评论 | comment_id, user_id, target_type, target_id, content |
| likes | 点赞记录 | like_id, user_id, target_type, target_id |
| shares | 分享记录 | share_id, user_id, target_type, target_id |

**核心索引**：
- idx_topics_board: 主题板块索引
- idx_comments_target: 评论目标索引
- idx_likes_target: 点赞目标索引

---

### MOD-07: 知识图谱模块 (Knowledge)

**模块定义**：管理AI知识库、关键词和知识关系，防止AI幻觉

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| kg_topics | 知识主题 | topic_id, topic_key, topic_name, category, content_zh/en |
| kg_keywords | 知识关键词 | keyword_id, topic_id, keyword, weight, language |
| kg_relations | 知识关系 | relation_id, from_topic_id, to_topic_id, relation_type |
| kg_verifications | AI回答验证 | verification_id, question, ai_answer, is_accurate |

**核心索引**：
- idx_kg_topics_category: 知识分类索引
- idx_kg_topics_key: 知识键索引
- idx_kg_keywords_word: 关键词索引
- idx_kg_verifications_topic: 验证主题索引

**存储过程**：
- sp_kg_query: 知识查询
- sp_kg_log_verification: 验证记录
- sp_kg_get_topics: 获取知识主题列表
- sp_kg_upsert_topic: 添加/更新知识主题

---

### MOD-08: 翻译管理模块 (Translation)

**模块定义**：管理多语言翻译、审核流程和翻译记忆

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| translations | 翻译主表 | translation_id, entity_type, entity_id, field_name, language_code |
| translation_versions | 翻译版本 | version_id, translation_id, version_number, translated_text |
| translation_reviews | 翻译审核 | review_id, translation_id, reviewer_id, review_status |
| translation_memory | 翻译记忆 | memory_id, source_text, target_text, source_language, target_language |
| translation_stats | 翻译统计 | stat_id, entity_type, language_code, total_count, approved_count |

**核心索引**：
- idx_translations_entity: 翻译实体索引
- idx_translations_language: 语言索引
- idx_translations_status: 审核状态索引
- idx_translation_memory_source: 记忆源索引
- idx_translation_stats_entity: 统计实体索引

**存储过程**：
- sp_translation_get: 获取实体翻译
- sp_translation_get_by_entity: 获取实体所有翻译
- sp_translation_batch_get: 批量获取翻译
- sp_translation_upsert: 添加/更新翻译（带版本控制）
- sp_translation_review: 审核翻译
- sp_translation_delete: 删除翻译
- sp_translation_search: 搜索翻译
- sp_translation_stats: 获取翻译统计
- sp_translation_get_versions: 获取翻译历史版本
- sp_translation_restore_version: 恢复翻译版本
- sp_translation_memory_add: 添加翻译记忆
- sp_translation_memory_search: 查询翻译记忆
- sp_translation_batch_update: 批量操作翻译
- sp_translation_delete_by_entity: 删除实体的所有翻译

---

### MOD-09: 数据同步模块 (Sync)

**模块定义**：管理跨设备数据同步、同步日志和冲突解决

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| sync_devices | 同步设备 | device_id, user_id, device_type, is_active |
| user_sync_status | 用户同步状态 | user_id, last_sync_at, sync_version |
| sync_operations | 同步操作日志 | operation_id, user_id, device_id, operation_type, entity_type, entity_id |
| sync_conflicts | 同步冲突 | conflict_id, user_id, entity_type, entity_id, resolved |

**核心索引**：
- idx_sync_devices_user: 设备用户索引
- idx_sync_devices_active: 活跃设备索引
- idx_sync_operations_user: 操作用户索引
- idx_sync_operations_status: 操作状态索引
- idx_sync_conflicts_user: 冲突用户索引
- idx_sync_conflicts_resolved: 已解决冲突索引

**存储过程**：
- sp_sync_register_device: 注册同步设备
- sp_sync_get_user_devices: 获取用户设备列表
- sp_sync_log_operation: 记录同步操作
- sp_sync_get_pending_operations: 获取待同步操作
- sp_sync_mark_synced: 标记操作已同步
- sp_sync_log_conflict: 记录同步冲突
- sp_sync_get_user_conflicts: 获取用户冲突列表
- sp_sync_resolve_conflict: 解决冲突
- sp_sync_get_user_status: 获取用户同步状态
- sp_sync_update_user_status: 更新用户同步状态
- sp_sync_get_stats: 获取同步统计
- sp_sync_deactivate_device: 停用设备
- sp_sync_cleanup_logs: 清理过期同步日志

---

### MOD-10: 系统配置模块 (System)

**模块定义**：管理系统全局配置、AI服务配置和参数设置

**包含表结构**：

| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| ai_config | AI配置 | ai_id, name, provider, api_key, api_endpoint, model, temperature, max_tokens |
| system_settings | 系统设置 | setting_id, setting_key, setting_value, description, setting_type, is_public |

**核心索引**：
- idx_ai_config_active: 激活的AI配置索引

**存储过程**：
- sp_get_ai_configs: 获取AI配置列表
- sp_get_default_ai_config: 获取默认AI配置
- sp_get_system_settings: 获取系统设置
- sp_update_system_setting: 更新系统设置

---

## 四、模块间关系图

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    系统配置模块 (System)                │
                    │              ai_config | system_settings               │
                    └───────────────────────┬─────────────────────────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
              ▼                             ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
    │  用户模块 (User) │           │ 知识图谱模块     │           │ 翻译管理模块     │
    │                  │           │ (Knowledge)     │           │ (Translation)   │
    │  users          │           │                 │           │                 │
    │  user_favorites │           │  kg_topics      │           │  translations   │
    │  user_settings  │           │  kg_keywords    │           │  translation_   │
    │  point_transactions│         │  kg_relations   │           │    versions     │
    │                 │           │  kg_verifications│          │  translation_   │
    └────────┬────────┘           └────────┬────────┘           └────────┬────────┘
             │                             │                             │
             │                             │                             │
    ┌────────┼────────┐                   │                             │
    │        │        │                   │                             │
    ▼        ▼        ▼                   │                             │
┌─────────┐┌─────────┐┌─────────────┐      │                             │
│活动成就  ││答题竞赛  ││社区社交      │      │                             │
│ (Activity)││(Competition)││(Community) │      │                             │
│          ││          ││             │      │                             │
│activity  ││question ││forum_topics │      │                             │
│achievement││user_answer││comments    │      │                             │
│daily_checkin││_history   ││likes       │      │                             │
│user_activities││competition_ ││showcases  │      │                             │
│            ││ points     ││            │      │                             │
└───────────┘└───────────┘└─────────────┘      │                             │
                                               │                             │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
          ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
          │ 建筑内容模块     │         │ 3D工坊模块       │         │ 数据同步模块     │
          │ (Architecture)   │         │ (Workshop)      │         │ (Sync)          │
          │                  │         │                 │         │                 │
          │ancient_architec-│         │user_models      │         │sync_devices     │
          │ ture            │         │model_component_ │         │sync_operations  │
          │historical_devel-│         │ definitions     │         │sync_conflicts   │
          │ opment          │         │model_component_ │         │user_sync_status │
          │technical_struc- │         │ instances       │         │                 │
          │ ture            │         │building_templates│         │                 │
          │architecture_    │         │build_steps      │         │                 │
          │ views           │         │                 │         │                 │
          └─────────────────┘         └─────────────────┘         └─────────────────┘
```

## 五、模块间关联关系

### 核心关联路径

| 关联路径 | 源模块 | 目标模块 | 关联字段 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| 用户→活动 | User | Activity | user_id | 用户参与活动 |
| 用户→竞赛 | User | Competition | external_user_id | 用户答题记录 |
| 用户→社区 | User | Community | user_id | 用户发表评论/帖子 |
| 用户→3D工坊 | User | Workshop | user_id | 用户创建模型 |
| 用户→同步 | User | Sync | user_id | 用户设备管理 |
| 建筑→知识 | Architecture | Knowledge | architecture_id ↔ topic_key | 建筑关联知识 |
| 建筑→翻译 | Architecture | Translation | entity_type='architecture' | 建筑内容翻译 |
| 竞赛→建筑 | Competition | Architecture | external_building_id | 题目关联建筑 |
| 3D工坊→建筑 | Workshop | Architecture | external_architecture_id | 模型关联建筑 |
| 社区→建筑 | Community | Architecture | target_type='architecture' | 评论/分享建筑 |
| 活动→用户成就 | Activity | User | external_user_id | 用户获得成就 |
| 知识→翻译 | Knowledge | Translation | entity_type='knowledge' | 知识内容翻译 |

### 跨数据库外键策略

由于使用多数据库架构，跨数据库外键通过以下方式保证一致性：

1. **应用层验证**：在API层验证关联数据的存在性
2. **事务处理**：使用分布式事务或两阶段提交
3. **定期数据校验**：定时任务检查数据一致性
4. **软外键**：记录关联ID但不创建物理外键约束

## 六、模块命名规范

### 表命名规范

```
{模块前缀}_{功能描述}_{类型后缀}
```

| 模块 | 前缀 | 示例 |
| :--- | :--- | :--- |
| 用户模块 | user | user_settings, user_favorites |
| 建筑内容 | architecture | architecture_views |
| 活动成就 | activity | activity_main |
| 答题竞赛 | competition | competition_questions |
| 3D工坊 | workshop | workshop_models |
| 社区社交 | community | community_topics |
| 知识图谱 | kg | kg_topics, kg_keywords |
| 翻译管理 | translation | translation_entries |
| 数据同步 | sync | sync_devices, sync_logs |
| 系统配置 | system | system_settings, system_ai_config |

### 存储过程命名规范

```
sp_{模块缩写}_{功能}_{操作}
```

示例：
- sp_user_checkin: 用户打卡
- sp_architecture_query: 建筑查询
- sp_competition_get_questions: 获取竞赛题目

### 视图命名规范

```
vw_{模块缩写}_{视图描述}
```

示例：
- vw_user_checkin_stats: 用户打卡统计
- vw_architecture_popular: 热门建筑

## 七、数据访问权限策略

### 角色定义

| 角色 | 权限等级 | 说明 |
| :--- | :--- | :--- |
| admin | 管理员 | 所有模块的完整权限 |
| content_manager | 内容管理 | 建筑、知识、翻译模块的编辑权限 |
| moderator | 版主 | 社区模块的管理权限 |
| developer | 开发者 | 系统配置模块的访问权限 |
| user | 普通用户 | 自己数据的读写权限 |
| guest | 访客 | 只读访问公共数据 |

### 权限矩阵

| 模块 | admin | content_manager | moderator | developer | user | guest |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 用户模块 | CRUD | R | R | R | CR(own) | R |
| 建筑内容 | CRUD | CRUD | R | R | R | R |
| 活动成就 | CRUD | R | R | R | R(create) | R |
| 答题竞赛 | CRUD | R | R | R | R(create) | R |
| 3D工坊 | CRUD | R | R | R | CR(own) | R |
| 社区社交 | CRUD | R | CRUD | R | CR(own) | R |
| 知识图谱 | CRUD | CRUD | R | R | R | R |
| 翻译管理 | CRUD | CRUD | R | R | R | R |
| 数据同步 | CRUD | R | R | R | CR(own) | - |
| 系统配置 | CRUD | - | - | CRUD | - | - |

### 权限控制实现

1. **数据库级别**：使用SQL Server角色和权限
2. **应用级别**：中间件验证用户角色和资源权限
3. **API级别**：基于RBAC的路由权限控制
4. **数据级别**：行级权限过滤（仅访问自己的数据）

### 数据库用户权限配置

```sql
-- 创建数据库角色
CREATE ROLE [db_user] AUTHORIZATION [dbo];
CREATE ROLE [db_content_manager] AUTHORIZATION [dbo];
CREATE ROLE [db_moderator] AUTHORIZATION [dbo];
CREATE ROLE [db_developer] AUTHORIZATION [dbo];

-- 用户模块权限
GRANT SELECT ON ATCA_User.dbo.users TO [db_user];
GRANT INSERT, UPDATE ON ATCA_User.dbo.users TO [db_user];
GRANT SELECT ON ATCA_User.dbo.user_favorites TO [db_user];
GRANT INSERT, DELETE ON ATCA_User.dbo.user_favorites TO [db_user];

-- 建筑内容模块权限
GRANT SELECT ON Architecture.dbo.ancient_architecture TO [db_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON Architecture.dbo.ancient_architecture TO [db_content_manager];

-- 社区模块权限
GRANT SELECT ON Community.dbo.forum_topics TO [db_user];
GRANT INSERT, UPDATE ON Community.dbo.forum_topics TO [db_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON Community.dbo.forum_topics TO [db_moderator];

-- 系统配置模块权限（仅admin和developer）
GRANT SELECT, INSERT, UPDATE, DELETE ON System.dbo.ai_config TO [db_developer];
GRANT SELECT, INSERT, UPDATE, DELETE ON System.dbo.system_settings TO [db_developer];

-- 翻译管理模块权限
GRANT SELECT ON Translation.dbo.translations TO [db_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON Translation.dbo.translations TO [db_content_manager];

-- 数据同步模块权限
GRANT SELECT ON Sync.dbo.sync_devices TO [db_user];
GRANT INSERT, UPDATE ON Sync.dbo.sync_devices TO [db_user];
```

## 八、划分依据说明

### 划分原则

1. **业务领域边界**：按照业务功能自然划分，如用户管理、建筑内容、活动系统等
2. **数据生命周期**：数据变化频率相近的表归为同一模块
3. **访问模式**：读写模式相似的表归为同一模块
4. **部署独立性**：考虑未来可能的独立部署需求

### 现有结构问题及优化

| 问题 | 原结构 | 优化方案 |
| :--- | :--- | :--- |
| 数据冗余 | User和Architecture都有atca_user表 | 删除Architecture中的冗余表，使用跨库查询 |
| 模块混杂 | Architecture包含翻译、同步等无关模块 | 翻译→Translation模块，同步→Sync模块 |
| 职责不清 | User包含AI配置 | AI配置→System模块 |
| 命名混乱 | 各模块命名风格不一 | 统一模块前缀命名规范 |
| 收藏分散 | Architecture有architecture_favorites | 统一到User模块的user_favorites表 |
| 用户设置分散 | User有多个设置表 | 合并到统一的user_settings表 |

### 优化后的优势

1. **开发效率**：每个模块可独立开发和测试
2. **维护成本**：问题定位更精准，影响范围更小
3. **扩展性**：支持模块级别的水平扩展
4. **安全性**：权限控制更精细，数据隔离更完善
5. **一致性**：消除数据冗余，保证数据一致性
6. **标准化**：统一的命名规范和存储过程接口

## 九、实施计划

### 第一阶段：文档确认
- [x] 确认模块划分方案
- [x] 确认命名规范
- [x] 确认权限策略

### 第二阶段：数据库重构
- [x] 创建新的数据库脚本结构
- [x] 创建System模块（AI配置+系统设置）
- [x] 创建Knowledge模块（知识图谱）
- [x] 创建Translation模块（翻译管理）
- [x] 创建Sync模块（数据同步）
- [x] 重构User模块（移除AI配置，统一收藏）
- [x] 重构Architecture模块（移除冗余表）
- [ ] 迁移现有数据到新结构
- [ ] 更新存储过程和视图

### 第三阶段：应用层适配
- [ ] 更新API路由和控制器
- [ ] 更新数据库连接配置
- [ ] 更新权限验证逻辑

### 第四阶段：测试验证
- [ ] 模块独立测试
- [ ] 模块集成测试
- [ ] 数据一致性验证

---

**文档版本**: v1.1  
**创建日期**: 2026-06-26  
**更新日期**: 2026-06-26  
**适用项目**: 华夏营造 (ATCA)  
**技术栈**: SQL Server 2016+