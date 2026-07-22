
> 生成时间：2026-07-10  
> 项目仓库：git@github.com:Mandarava1250/ATCA.git  
> 技术栈：Vue 3 + TypeScript + Three.js (前端) | Node.js + Express + MSSQL (后端)

---

## 一、项目概述

**筑见山河（ATCA - Ancient Traditional Chinese Architecture）** 是一个以中国传统古建筑文化为核心的全栈 Web 应用平台。项目融合了**文化科普教育**、**3D 交互建模**、**知识答题闯关**、**多语言国际化**四大核心功能模块，旨在通过数字化手段传承和推广中国传统建筑文化。

### 核心技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3.5 + Composition API | 响应式 UI，`<script setup>` 语法 |
| 状态管理 | Pinia | 全局状态（用户、语言、3D场景） |
| 3D 引擎 | Three.js r168 | 古建3D建模、物理引擎、榫卯吸附 |
| 构建工具 | Vite 5 | 快速 HMR 开发 |
| 后端框架 | Express 4 + TypeScript | RESTful API 服务 |
| 数据库 | SQL Server (MSSQL) | 多数据库架构（ATCA_User, ATCA_Architecture, ATCA_Media3D） |
| 认证 | JWT (access + refresh token) | 双令牌安全机制 |
| 实时通信 | Socket.io | 多端数据同步 |
| 国际化 | vue-i18n | 中/英/日三语支持 |
| 部署 | Docker + Nginx | 容器化部署 |

---

## 二、目录结构与文件功能说明

### 2.1 根目录

```
ATCA/
├── .env.example          # 环境变量模板（DB连接、JWT密钥、端口配置）
├── .gitignore            # Git忽略规则
├── package.json          # 根级脚本（dev/start/docker命令）
├── README.md             # 项目说明文档
├── backend/              # 后端服务
├── frontend/             # 前端应用
├── shared/               # 前后端共享类型/常量/工具
├── sql/                  # 数据库初始化脚本
└── docs/                 # 项目文档
```

### 2.2 后端（backend/）

```
backend/
├── src/
│   ├── index.ts                    # 应用入口，Express 服务启动
│   ├── config/
│   │   └── database.ts             # 数据库连接池管理（多库支持）
│   ├── middleware/
│   │   ├── auth.ts                 # JWT 认证中间件
│   │   ├── validation.ts           # Zod 请求参数校验
│   │   ├── errorHandler.ts         # 全局错误处理
│   │   └── rateLimiter.ts          # API 限流
│   ├── services/
│   │   ├── AuthService.ts          # 认证服务（注册/登录/Token刷新）
│   │   └── SyncService.ts          # Socket.io 多端同步服务
│   ├── modules/
│   │   ├── auth/AuthIndex.ts       # 认证路由模块
│   │   ├── user/UserIndex.ts       # 用户管理路由
│   │   ├── architecture/ArchIndex.ts # 古建筑数据路由
│   │   ├── quiz/QuizIndex.ts       # 答题闯关路由
│   │   ├── model3d/Model3dIndex.ts # 3D工坊路由
│   │   ├── i18n/I18nIndex.ts      # 国际化翻译路由
│   │   └── admin/AdminIndex.ts     # 管理后台路由
│   └── utils/
│       ├── logger.ts               # 日志工具
│       └── mockData.ts             # Mock 降级数据
├── tests/                          # 单元测试
├── test/                           # 集成测试
├── Dockerfile                      # Docker 构建文件
├── jest.config.js                  # Jest 测试配置
├── tsconfig.json                   # TypeScript 配置
└── package.json                    # 后端依赖
```

### 2.3 前端（frontend/）

```
frontend/
├── src/
│   ├── main.ts                     # 应用入口
│   ├── App.vue                     # 根组件
│   ├── router/index.ts             # Vue Router 路由配置
│   ├── stores/                     # Pinia 状态管理
│   │   ├── index.ts
│   │   ├── user.ts                 # 用户状态（登录/Token/偏好）
│   │   ├── language.ts             # 语言状态
│   │   └── scene.ts                # 3D场景状态
│   ├── api/                        # API 请求封装
│   │   ├── index.ts                # Axios 实例 + 拦截器
│   │   ├── auth.ts                 # 认证 API
│   │   ├── architecture.ts         # 古建筑 API
│   │   ├── quiz.ts                 # 答题 API
│   │   ├── model3d.ts              # 3D模型 API
│   │   └── i18n.ts                 # 翻译 API
│   ├── composables/                # 组合式函数
│   │   ├── useThreeScene.ts        # Three.js 场景管理 Hook
│   │   ├── useAR.ts                # AR 功能 Hook
│   │   └── useModelLoader.ts       # 模型加载 Hook
│   ├── components/
│   │   ├── threejs/                # 3D 核心组件
│   │   │   ├── ThreejsSceneManager.ts  # 场景管理器（1654行）
│   │   │   ├── SnapEngine.ts           # 榫卯吸附引擎
│   │   │   ├── TouchHandler.ts         # 触摸交互处理
│   │   │   ├── SelectionManager.ts     # 选择管理器
│   │   │   ├── GizmoHelper.ts          # 变换控制器
│   │   │   ├── GridHelper.ts           # 网格辅助
│   │   │   ├── MeasurementTool.ts      # 测量工具
│   │   │   └── ...
│   │   ├── common/                 # 通用 UI 组件
│   │   └── workshop/               # 工坊子组件
│   ├── views/
│   │   ├── HomeView.vue            # 首页
│   │   ├── auth/                   # 登录/注册
│   │   ├── architecture/           # 古建筑浏览
│   │   │   ├── ViewArchitectureList.vue
│   │   │   ├── ViewArchitectureDetail.vue
│   │   │   └── ProvinceMapPage.vue
│   │   ├── workshop/               # 3D 工坊
│   │   │   ├── ViewWorkshop.vue        # 工坊主页
│   │   │   ├── ViewWorkshopHome.vue    # 工坊首页
│   │   │   └── ComponentBuilder.vue    # 构件编辑器
│   │   ├── quiz/                   # 答题闯关
│   │   ├── i18n/                   # 翻译贡献
│   │   └── profile/                # 个人中心
│   ├── i18n/                       # 国际化配置
│   │   ├── index.ts
│   │   └── locales/                # 语言包（zh/en/ja）
│   ├── utils/
│   │   ├── syncService.ts          # 多端同步 SDK
│   │   ├── resourceTracker.ts      # 资源追踪器
│   │   └── offlineManager.ts       # 离线数据管理
│   └── styles/                     # 全局样式
├── public/                         # 静态资源
├── index.html                      # HTML 入口
├── vite.config.ts                  # Vite 配置
├── nginx.conf                      # Nginx 配置
├── Dockerfile                      # Docker 构建
└── package.json                    # 前端依赖
```

### 2.4 共享模块（shared/）

```
shared/
├── types/
│   ├── user.ts          # 用户类型定义
│   ├── architecture.ts  # 古建筑数据类型
│   ├── quiz.ts          # 答题类型
│   ├── model3d.ts       # 3D模型类型（SceneComponent, SnapPoint等）
│   └── api.ts           # API 响应通用类型
├── constants/
│   ├── componentDefs.ts # 构件定义常量（DEFAULT_COMPONENTS）
│   └── categories.ts    # 分类常量
└── utils/
    └── validators.ts    # 共享校验工具
```

---

## 三、核心模块深度分析

### 3.1 认证与安全模块

#### 3.1.1 AuthService.ts — 认证服务

**功能定位**：用户注册、登录、Token 管理的核心安全服务。

**核心方法**：

| 方法 | 功能 | 安全特性 |
|------|------|----------|
| `register()` | 用户注册 | 密码 bcrypt 哈希（10轮）、邮箱唯一校验、SQL注入防护 |
| `login()` | 用户登录 | 失败次数限制（5次锁定15分钟）、密码时序比较 |
| `refreshToken()` | Token 刷新 | 旧 Token 黑名单、IP/UA 绑定检测 |
| `logout()` | 用户登出 | Token 黑名单机制 |
| `verifyToken()` | Token 验证 | JWT 签名验证 + 黑名单检查 |

**双令牌机制**：
- **Access Token**：有效期 15 分钟，用于 API 请求认证
- **Refresh Token**：有效期 7 天，用于无感刷新 Access Token
- Token 黑名单存储在 `token_blacklist` 表中，防止已登出/已刷新 Token 被重用

**数据库设计**：
```sql
-- 用户表（ATCA_User 库）
atca_user (user_id, username, email, password_hash, role, status, 
           login_fail_count, lock_until, last_login_ip, ...)
-- Token 黑名单
token_blacklist (token_id, token_jti, user_id, token_type, expires_at)
```

#### 3.1.2 auth.ts — 认证中间件

**功能**：Express 中间件，从请求头提取 Bearer Token 并验证。

**关键逻辑**：
- 支持 `Authorization: Bearer <token>` 标准格式
- 验证失败返回 401，Token 有效但用户不存在返回 401
- 通过 `AuthRequest` 类型扩展，将用户信息注入到 `req.user`

### 3.2 3D 建模核心模块（最核心模块）

#### 3.2.1 ThreejsSceneManager.ts — 场景管理器（1654行）

**功能定位**：整个 3D 工坊的核心引擎，管理 Three.js 场景的所有状态和操作。

**类结构**：

```
ThreejsSceneManager
├── 初始化与生命周期
│   ├── constructor()          # 场景/相机/渲染器/控制器初始化
│   ├── initScene()            # 灯光、地面、环境配置
│   ├── animate()              # 渲染循环（requestAnimationFrame）
│   ├── onResize()             # 窗口自适应
│   └── destroy()              # 资源释放（防内存泄漏）
│
├── 构件管理（CRUD）
│   ├── addComponent()         # 添加构件（支持参数化几何体 + 自定义顶点）
│   ├── removeComponent()      # 删除构件（含资源释放）
│   ├── cloneComponent()       # 克隆构件
│   ├── clearScene()           # 清空场景
│   ├── moveComponent()        # 移动
│   ├── rotateComponent()      # 旋转
│   ├── scaleComponent()       # 缩放
│   ├── setVisibility()        # 可见性
│   └── setLocked()            # 锁定
│
├── 几何体生成
│   ├── createGeometry()       # 根据类型创建几何体
│   ├── createCustomGeometry() # 自定义顶点生成几何体
│   └── 支持类型: pillar_round, pillar_square, beam, bracket, 
│       roof_tile, wall, door, window, base, decoration
│
├── 交互系统
│   ├── onPointerDown/Move/Up  # 指针事件处理
│   ├── onKeyDown/Up            # 键盘快捷键
│   ├── 框选（SelectionBox）    # 批量选择
│   ├── 长按放置               # 移动端长按交互
│   └── TransformControls      # Gizmo 变换控制
│
├── 物理引擎
│   ├── applyGravity()         # 重力模拟
│   ├── checkCollision()       # AABB 碰撞检测
│   ├── snapComponents()       # 榫卯吸附
│   └── checkStructuralIntegrity() # 结构完整性检查
│
├── 导入导出
│   ├── exportToJSON()         # JSON 格式导出
│   ├── exportToGLTF()         # GLTF/GLB 格式导出
│   ├── importFromJSON()       # JSON 导入（兼容多版本格式）
│   └── importGLTF()           # GLTF 模型导入
│
└── 回调系统
    ├── onSelect()             # 选择变更
    ├── onTransform()          # 变换完成
    ├── onUndo/Redo/Clone/Delete # 操作回调
    └── onToolChange()         # 工具切换
```

**关键数据结构**：

```typescript
interface SceneComponent {
  uuid: string;                    // 唯一标识
  definitionId: number;            // 关联构件定义ID
  type: string;                    // 构件类型
  category: string;                // 分类
  name: string;                    // 名称
  position: { x, y, z };          // 位置
  rotation: { x, y, z };          // 旋转
  scale: { x, y, z };             // 缩放
  material?: MaterialConfig;       // 材质配置
  visible: boolean;                // 可见性
  locked: boolean;                 // 锁定状态
  vertices?: number[][];           // 自定义顶点数据
  snapPoints?: SnapPoint[];        // 榫卯吸附点
  rotationConstraints?: any[];     // 旋转约束
  isSnapped?: boolean;             // 是否已吸附
  snappedTo?: string;              // 吸附目标UUID
  mesh?: THREE.Mesh;               // Three.js 网格对象
}
```

**物理引擎实现细节**：

1. **重力模拟**：逐构件检测下方支撑，无支撑时执行带动画的下落（缓动函数 `1 - (1-t)²`）
2. **碰撞检测**：AABB 包围盒 + 安全边距（collisionMargin），O(n²) 遍历检测
3. **榫卯吸附**：委托 `SnapEngine` 进行吸附点匹配，支持旋转约束和方向检测
4. **结构完整性**：检查悬空构件（底部 Y > 0.05 且无下方支撑）

#### 3.2.2 SnapEngine.ts — 榫卯吸附引擎

**功能定位**：实现中国传统建筑榫卯结构的数字化吸附逻辑。

**核心算法**：
- 吸附点类型：`mortise`（卯眼）、`tenon`（榫头）、`any`（通用）
- 匹配规则：榫头-卯眼配对，距离阈值检测，方向约束校验
- 支持旋转约束：限制构件在特定轴上的旋转角度范围

#### 3.2.3 useThreeScene.ts — 场景组合式函数

**功能定位**：Vue 3 Composition API 桥接层，将 ThreejsSceneManager 集成到 Vue 响应式系统。

**核心功能**：
- 场景初始化与容器绑定
- 撤销/重做栈管理（History Pattern，最大50步）
- 构件 CRUD 操作的响应式封装
- 自动保存（防抖 3 秒）
- 模型加载（从 API 获取 + JSON 解析）
- 截图功能

**撤销/重做实现**：
```typescript
// 操作栈结构
interface HistoryEntry {
  type: 'add' | 'remove' | 'modify' | 'batch';
  data: any;           // 操作数据
  inverse: any;        // 逆操作数据
  timestamp: number;
}
// push → 执行操作并压栈
// undo → 弹出栈顶并执行逆操作
// redo → 从 redo 栈恢复
```

### 3.3 古建筑文化模块

#### 3.3.1 ArchIndex.ts — 古建筑数据 API

**功能**：提供古建筑信息的 CRUD 接口。

**数据表结构**：
- `building_info` — 建筑基本信息（名称、朝代、位置、描述）
- `building_shares` — 建筑分享/展示数据
- `building_favorites` — 用户收藏
- `building_notes` — 用户笔记

**API 端点**：
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/architecture` | 获取建筑列表（分页、分类筛选） |
| GET | `/api/architecture/:id` | 获取建筑详情 |
| POST | `/api/architecture/:id/favorite` | 收藏/取消收藏 |
| POST | `/api/architecture/:id/note` | 添加笔记 |
| GET | `/api/architecture/:id/notes` | 获取笔记列表 |

#### 3.3.2 ProvinceMapPage.vue — 省份地图页

**功能**：以中国地图为载体的古建筑分布可视化。

**技术亮点**：
- SVG 地图渲染
- 省份高亮交互
- 按省份聚合古建筑数据
- 响应式布局适配

### 3.4 答题闯关模块

#### 3.4.1 QuizIndex.ts — 答题 API

**功能**：古建筑知识答题闯关系统。

**数据表**：
- `quiz_questions` — 题库（题目、选项、答案、解析、难度）
- `quiz_records` — 答题记录
- `quiz_achievements` — 成就系统

**核心逻辑**：
- 随机组卷（按难度、分类权重）
- 计时答题
- 成绩排行
- 成就解锁

### 3.5 国际化模块

#### 3.5.1 I18nIndex.ts — 翻译 API

**功能**：支持用户贡献翻译的国际化系统。

**特性**：
- 三语支持：中文（zh）、英文（en）、日文（ja）
- 翻译贡献审核流程（pending → approved/rejected）
- 翻译覆盖率统计
- 社区翻译排行榜

**数据表**：
- `i18n_translations` — 翻译条目
- `i18n_contributions` — 翻译贡献记录

### 3.6 多端同步模块

#### 3.6.1 SyncService.ts（后端）— Socket.io 同步服务

**功能**：基于 Socket.io 实现多设备间实时数据同步。

**同步事件类型**：
- `user_action` — 用户操作
- `favorite_change` — 收藏变更
- `note_change` — 笔记变更
- `quiz_progress` — 答题进度
- `translation_update` — 翻译更新
- `settings_change` — 设置变更
- `checkin_update` — 打卡更新

**连接管理**：
- JWT Token 认证连接
- 设备 ID 绑定
- 多设备在线状态追踪
- 断线重连机制

#### 3.6.2 syncService.ts（前端）— 同步客户端 SDK

**功能**：前端多端同步客户端，封装 Socket.io 连接和消息收发。

**特性**：
- 单例模式
- 离线消息缓存（pendingMessages 队列）
- 自动重连（最大 5 次，间隔 3 秒）
- 同步延迟监测
- 设备 ID 持久化（localStorage）

### 3.7 管理后台模块

#### 3.7.1 AdminIndex.ts — 管理 API

**功能**：系统管理功能，包括：
- 用户管理（列表、禁用、角色变更）
- 内容审核
- 数据统计
- 批量导入（建筑数据、3D模型）

### 3.8 数据库配置

#### 3.8.1 database.ts — 多库连接管理

**功能**：管理三个独立数据库的连接池。

| 数据库 | 用途 | 连接池大小 |
|--------|------|-----------|
| ATCA_User | 用户认证、个人信息 | 10 |
| ATCA_Architecture | 古建筑数据、收藏、笔记 | 10 |
| ATCA_Media3D | 3D模型、构件定义、模板 | 10 |

**特性**：
- 连接池复用（mssql ConnectionPool）
- Mock 模式降级（无数据库时使用内存数据）
- 事务支持（`transaction()` 封装）
- 参数化查询（防 SQL 注入）

---

## 四、模块间依赖关系与数据流

### 4.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 古建筑   │ │ 3D工坊   │ │ 答题闯关 │ │ 翻译贡献 │   │
│  │ 浏览     │ │ 建模     │ │ 系统     │ │ 平台     │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       │            │            │            │          │
│  ┌────┴────────────┴────────────┴────────────┴────┐     │
│  │              API Layer (Axios)                  │     │
│  │         + SyncService (Socket.io)               │     │
│  └────────────────────┬───────────────────────────┘     │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────┐     │
│  │           Pinia Stores (状态管理)               │     │
│  │   userStore | languageStore | sceneStore        │     │
│  └────────────────────────────────────────────────┘     │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────┴─────────────────────────────────┐
│                  Backend (Express)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Middleware Layer                        │   │
│  │   auth | validation | errorHandler | rateLimiter  │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────┐ ┌──────┐ ┌────┴───┐ ┌──────┐ ┌──────┐       │
│  │ Auth │ │ User │ │ Arch   │ │Model3D│ │ I18n │       │
│  │Module│ │Module│ │ Module │ │Module │ │Module│       │
│  └──┬───┘ └──┬───┘ └───┬────┘ └──┬───┘ └──┬───┘       │
│     │        │         │         │        │             │
│  ┌──┴────────┴─────────┴─────────┴────────┴──┐         │
│  │         Services Layer                     │         │
│  │   AuthService | SyncService                │         │
│  └──────────────────┬────────────────────────┘         │
│                     │                                    │
│  ┌──────────────────┴────────────────────────┐         │
│  │      Database Config (连接池管理)          │         │
│  └──┬──────────────┬──────────────┬──────────┘         │
└─────┼──────────────┼──────────────┼────────────────────┘
      │              │              │
┌─────┴─────┐ ┌──────┴──────┐ ┌────┴──────┐
│ ATCA_User │ │ATCA_Archite-│ │ATCA_Media │
│  (用户)   │ │ cture(建筑) │ │  3D(模型) │
└───────────┘ └─────────────┘ └───────────┘
```

### 4.2 关键数据流

#### 4.2.1 用户登录流程
```
用户输入 → LoginView.vue → authApi.login() → POST /api/auth/login
→ AuthIndex.ts → AuthService.login() → 数据库验证 → 生成 JWT 对
→ 返回 {accessToken, refreshToken} → userStore.setTokens()
→ Axios 拦截器自动附加 Bearer Token → 后续请求自动认证
→ Token 过期 → 拦截器 401 → 自动 refreshToken → 重试原请求
```

#### 4.2.2 3D 模型保存流程
```
用户点击保存 → ViewWorkshop.vue → useThreeScene.saveModel()
→ sceneManager.exportToJSON() → 序列化场景为 JSON
→ sceneManager.takeScreenshot() → Canvas 截图
→ model3dApi.saveModel() → POST /api/model3d
→ Model3dIndex.ts → 事务写入 user_models 表
→ 若公开 → 同步写入 building_shares 表（跨库）
```

#### 4.2.3 榫卯吸附流程
```
用户拖拽构件 → ThreejsSceneManager.onPointerUp()
→ 检测附近构件 → snapComponents(uuidA, uuidB)
→ SnapEngine.detectSnap() → 吸附点匹配 + 旋转约束校验
→ alignToSnapPoint() → 动画对齐（10步缓动）
→ 更新 isSnapped/snappedTo 状态 → 触发 onTransform 回调
→ useThreeScene 记录历史 + 触发自动保存
```

#### 4.2.4 多端同步流程
```
设备A操作 → syncService.sync('favorite_change', payload)
→ Socket.io emit('sync:favorite_change') → 后端 SyncService
→ 广播给同用户其他设备 → 设备B syncService 接收
→ handleSyncMessage() → emit('favorite_change') 
→ 设备B UI 响应更新
```

---

## 五、核心代码片段解析

### 5.1 JWT 双令牌刷新机制

```typescript
// AuthService.ts - refreshToken 方法
async refreshToken(oldRefreshToken: string, ip?: string, userAgent?: string) {
  // 1. 验证 Refresh Token 有效性
  const decoded = jwt.verify(oldRefreshToken, secret) as any;
  
  // 2. 检查是否在黑名单中
  const blacklisted = await this.isTokenBlacklisted(decoded.jti);
  if (blacklisted) throw new Error('Token已失效');
  
  // 3. 安全检测：IP/UA 变更告警
  if (ip && decoded.ip && ip !== decoded.ip) {
    logger.warn('Token刷新IP不一致', { old: decoded.ip, new: ip });
  }
  
  // 4. 旧 Token 加入黑名单（防止重放）
  await this.blacklistToken(decoded.jti, userId, 'refresh', exp);
  
  // 5. 生成新令牌对
  const newAccessToken = this.generateAccessToken(userId, username, role);
  const newRefreshToken = this.generateRefreshToken(userId, ip, userAgent);
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

### 5.2 参数化几何体生成

```typescript
// ThreejsSceneManager.ts - createGeometry 方法
private createGeometry(type: string, dims: any): THREE.BufferGeometry {
  switch (type) {
    case 'pillar_round':
      // 圆柱：32段近似圆
      return new THREE.CylinderGeometry(dims.radius, dims.radius, dims.height, 32);
    case 'beam':
      // 梁：长方体
      return new THREE.BoxGeometry(dims.length, dims.height, dims.width);
    case 'bracket':
      // 斗拱：组合几何体（简化为盒体）
      return new THREE.BoxGeometry(dims.length, dims.height, dims.width);
    case 'roof_tile':
      // 屋瓦：弧形几何体
      return this.createCurvedTileGeometry(dims);
    // ... 更多类型
  }
}
```

### 5.3 AABB 碰撞检测

```typescript
// ThreejsSceneManager.ts - checkCollision 方法
checkCollision(uuid: string): { collided: boolean; conflicts: string[] } {
  const bbox = new THREE.Box3().setFromObject(comp.mesh);
  for (const other of this.components.values()) {
    const otherBox = new THREE.Box3().setFromObject(other.mesh);
    // 六面体相交判定
    if (bbox.min.x < otherBox.max.x + margin &&
        bbox.max.x > otherBox.min.x - margin &&
        bbox.min.y < otherBox.max.y + margin &&
        bbox.max.y > otherBox.min.y - margin &&
        bbox.min.z < otherBox.max.z + margin &&
        bbox.max.z > otherBox.min.z - margin) {
      conflicts.push(other.name);
    }
  }
}
```

### 5.4 撤销/重做系统

```typescript
// useThreeScene.ts - 历史管理模式
const history = ref<HistoryEntry[]>([]);
const historyIndex = ref(-1);
const MAX_HISTORY = 50;

function pushHistory(entry: HistoryEntry) {
  // 截断当前位置之后的记录
  history.value = history.value.slice(0, historyIndex.value + 1);
  history.value.push(entry);
  // 超出上限则移除最早的
  if (history.value.length > MAX_HISTORY) history.value.shift();
  else historyIndex.value++;
}

function undo() {
  if (historyIndex.value < 0) return;
  const entry = history.value[historyIndex.value];
  // 执行逆操作
  if (entry.type === 'add') sceneManager.removeComponent(entry.data.uuid);
  else if (entry.type === 'remove') sceneManager.addComponent(entry.inverse);
  historyIndex.value--;
}
```

---

## 六、数据库设计概览

### 6.1 数据库分布

| 数据库 | 核心表 | 用途 |
|--------|--------|------|
| ATCA_User | `atca_user`, `token_blacklist`, `user_profiles` | 用户认证与个人信息 |
| ATCA_Architecture | `building_info`, `building_shares`, `building_favorites`, `building_notes` | 古建筑数据与用户交互 |
| ATCA_Media3D | `model_component_definitions`, `building_templates`, `user_models`, `model_component_instances` | 3D建模与构件管理 |
| ATCA_Architecture | `quiz_questions`, `quiz_records`, `quiz_achievements` | 答题闯关系统 |
| ATCA_Architecture | `i18n_translations`, `i18n_contributions` | 国际化翻译 |

### 6.2 关键表关系

```
atca_user (1) ──── (N) user_models
atca_user (1) ──── (N) building_favorites
atca_user (1) ──── (N) building_notes
atca_user (1) ──── (N) quiz_records

building_info (1) ──── (N) building_favorites
building_info (1) ──── (N) building_notes
building_info (1) ──── (N) building_shares

model_component_definitions (1) ──── (N) model_component_instances
building_templates (1) ──── (N) template_components
```

---

## 七、潜在优化点评估

### 7.1 性能优化

| 问题 | 位置 | 建议 |
|------|------|------|
| 碰撞检测 O(n²) | ThreejsSceneManager.checkCollision() | 引入空间分区（BVH/Octree）降低复杂度 |
| 重力检测遍历全量构件 | applyGravityToComponent() | 使用空间索引加速支撑面查找 |
| 大场景渲染无 LOD | animate() | 实现 LOD（Level of Detail）分级渲染 |
| 构件数量大时 Map 遍历 | getAllComponents() | 考虑分块管理或 WebWorker 计算 |
| 前端 API 无请求缓存 | api/*.ts | 引入 SWR/请求级缓存策略 |
| 无虚拟列表 | 建筑列表/构件列表 | 大数据量列表使用虚拟滚动 |

### 7.2 安全优化

| 问题 | 位置 | 建议 |
|------|------|------|
| 缩略图 URL 截断处理 | Model3dIndex.ts L120 | 应在前端限制上传长度，后端截断可能丢失有效数据 |
| Mock 模式安全隐患 | 各模块 isMockMode() | 生产环境应彻底禁用 Mock 路径 |
| 跨库事务非原子性 | Model3dIndex.ts 保存/删除 | building_shares 同步失败仅记录日志，可能导致数据不一致 |
| 密码策略缺失 | AuthService.register() | 建议增加密码强度校验（长度、复杂度） |
| CORS 配置 | index.ts | 应限制为特定域名而非 `*` |

### 7.3 架构优化

| 问题 | 位置 | 建议 |
|------|------|------|
| ThreejsSceneManager 过大 | 1654行单文件 | 拆分为 SceneCore、PhysicsEngine、ImportExport、InteractionManager |
| 前后端类型重复 | shared/ 与各处 | 统一使用 shared/types 并自动生成 API 客户端 |
| 缺少 API 版本管理 | 路由前缀 | 引入 `/api/v1/` 版本前缀 |
| 错误码不统一 | 各模块 | 建立统一错误码注册表 |
| 缺少 API 文档 | 全局 | 引入 Swagger/OpenAPI 自动生成 |

### 7.4 用户体验优化

| 问题 | 位置 | 建议 |
|------|------|------|
| 3D 场景无加载进度 | useThreeScene | 增加加载进度条和骨架屏 |
| 离线功能不完整 | offlineManager.ts | 完善 Service Worker + IndexedDB 离线方案 |
| 无操作引导 | ComponentBuilder.vue | 增加新手引导和工具提示 |
| 移动端适配 | 全局 | 3D 工坊移动端交互需专门优化（触摸手势） |
| 无障碍支持 | 全局 | 增加 ARIA 标签和键盘导航 |

### 7.5 测试覆盖

| 现状 | 建议 |
|------|------|
| 后端有 AuthService 单元测试 | 扩展至所有 Service 层 |
| 前端无测试 | 引入 Vitest + Vue Test Utils |
| 无 E2E 测试 | 引入 Playwright/Cypress |
| 无 3D 场景测试 | 关键逻辑（吸附、碰撞）增加单元测试 |

---

## 八、第三方库集成清单

### 8.1 前端依赖

| 库 | 版本 | 用途 |
|----|------|------|
| vue | 3.5.x | 核心框架 |
| vue-router | 4.x | 路由管理 |
| pinia | 2.x | 状态管理 |
| three | 0.168.x | 3D 渲染引擎 |
| axios | 1.x | HTTP 客户端 |
| vue-i18n | 9.x | 国际化 |
| socket.io-client | 4.x | WebSocket 通信 |
| echarts | 5.x | 数据可视化图表 |
| @vueuse/core | 10.x | Vue 组合式工具集 |

### 8.2 后端依赖

| 库 | 版本 | 用途 |
|----|------|------|
| express | 4.x | Web 框架 |
| mssql | 10.x | SQL Server 驱动 |
| jsonwebtoken | 9.x | JWT 令牌 |
| bcryptjs | 2.x | 密码哈希 |
| zod | 3.x | 请求参数校验 |
| socket.io | 4.x | WebSocket 服务 |
| cors | 2.x | 跨域处理 |
| helmet | 7.x | HTTP 安全头 |
| express-rate-limit | 7.x | API 限流 |
| multer | 1.x | 文件上传 |
| dotenv | 16.x | 环境变量 |

---

## 九、总结

ATCA（筑见山河）是一个功能丰富、架构清晰的全栈文化教育平台。项目采用前后端分离架构，通过 RESTful API 和 WebSocket 实现数据交互，使用 Three.js 构建了具有物理引擎和榫卯吸附系统的 3D 建模工坊。代码整体质量较高，TypeScript 类型覆盖完整，安全防护（JWT双令牌、SQL参数化、输入校验）到位。

**核心亮点**：
1. 榫卯吸附引擎（SnapEngine）实现了传统建筑结构的数字化模拟
2. 多数据库架构设计支持业务隔离
3. Mock 降级机制保障开发环境可用性
4. 多端同步系统支持跨设备实时协作

**主要改进方向**：
1. 3D 引擎性能优化（空间分区、LOD）
2. 大文件拆分（ThreejsSceneManager 模块化）
3. 测试覆盖率提升
