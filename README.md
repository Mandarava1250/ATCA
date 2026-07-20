# 华夏营造 (ATCA)

> **Ancient Traditional Chinese Architecture** - 中国古建筑文化传播平台

<div align="center">  

![Vue.js](https://img.shields.io/badge/Vue.js-3.4-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.165-000000?style=flat&logo=three.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

[在线演示](#) · [功能特性](#功能特性) · [快速开始](#快速开始) · [API文档](#api文档) · [贡献指南](#贡献指南)

</div>

---

## 📋 目录

- [项目概述](#项目概述)
- [功能特性](#功能特性)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
- [API文档](#api文档)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [性能优化](#性能优化)
- [安全策略](#安全策略)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 🎯 项目概述

华夏营造（ATCA）是一个专注于中国古建筑文化传播的创新平台。通过融合**3D交互建模**、**AI知识图谱**、**社区互动**等前沿技术，将传统的斗拱榫卯营造技艺以现代化的方式呈现给广大用户。

### 核心价值

- **文化传承**：数字化保存和传播中国古建筑文化
- **技术赋能**：利用现代技术让传统技艺触手可及
- **教育普及**：通过互动体验降低古建筑学习门槛
- **社区共建**：构建古建筑爱好者的交流与创作平台

### 目标用户

- 古建筑文化研究者和爱好者
- 建筑学相关专业师生
- 传统文化传承工作者
- 对中国古建筑感兴趣的大众用户

### 最新更新

**v1.0.0 (2026-06)**
- ✅ 新增智能榫卯吸附引擎（MortiseTenonSnapEngine）
- ✅ 新增客户端状态存储系统（双模式存储：内存+Redis）
- ✅ 新增数据库查询缓存系统（智能TTL+LRU驱逐）
- ✅ 新增响应压缩优化（Gzip压缩）
- ✅ 新增智能SQL注入检测（多维度评分系统）
- ✅ 新增限流保护（暴力破解防护）
- ✅ 优化3D场景管理器（支持框选、测量、线框模式）
- ✅ 优化P99响应时间至150ms以内

---

## ✨ 功能特性

### 🏗️ 3D交互建模工坊

- **15种标准构件库**：柱、梁、檩、斗拱、屋脊等传统建筑构件
- **智能榫卯吸附引擎**：构件靠近时自动对齐，模拟真实榫卯结构
  - 支持吸附点检测
  - 旋转约束限制
  - 自动对齐预览
- **交互式操作**：
  - 长按鼠标左键放置构件
  - Ctrl+左键旋转视角
  - 支持撤销/重做操作
  - 框选多选功能
- **辅助工具**：
  - 测量工具（距离测量）
  - 线框模式切换
  - Gizmo变换控制
- **项目管理**：保存/加载/导出JSON格式
- **权限控制**：支持公开或私密模型分享

### 🧠 知识竞赛系统

- **五级难度体系**：入门 → 基础 → 挑战 → 进阶 → 专家
- **双模式答题**：
  - 随机新题模式
  - 错题回顾模式
- **智能分析中心**：
  - 正确率趋势分析
  - 能力雷达图展示
  - 错题本自动整理
  - 答题历史回顾
- **每日打卡机制**：完成答题任务获得积分奖励
- **排行榜系统**：实时排名展示

### 🤖 AI智能助手

- **知识图谱驱动**：基于自建知识图谱提供专业回答
- **多模型支持**：
  - 千问（通义千问）
  - DeepSeek
  - 讯飞星火
- **角色配置系统**：
  - 通用助手
  - 技术专家
  - 历史学者
  - 自定义角色
- **智能分析报告**：
  - 知识覆盖率评估（0-100%）
  - 冲突检测与提示
  - 引用来源分析
- **增强检查模式**：AI回答与知识库对比验证
- **访客模式**：无需登录即可使用基础问答功能

### 👥 社区互动平台

- **五大论坛板块**：
  - 综合讨论
  - 营造技艺
  - 建筑赏析
  - 知识问答
  - 社区公告
- **社交功能**：主题发布、回复互动、点赞收藏
- **作品展示**：用户公开3D模型作品
- **笔记系统**：答题记录笔记，支持公开/私密设置

### 🔧 后台管理系统

- **用户管理**：用户信息管理、禁言/解禁、角色分配
- **古建筑管理**：CRUD操作、数据导入导出
- **题库管理**：题目管理、每日打卡配置
- **3D模型管理**：模型导入、精选设置
- **社区管理**：帖子审核、内容管理
- **AI配置**：多角色管理、参数调优
- **性能监控**：实时监控系统状态

---

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue.js** | ^3.4.27 | 渐进式JavaScript框架，使用Composition API |
| **TypeScript** | ^5.4.5 | 提供类型安全和更好的开发体验 |
| **Vite** | ^5.2.13 | 下一代前端构建工具，提供极速开发体验 |
| **Vue Router** | ^4.3.2 | 官方路由管理器 |
| **Pinia** | ^2.1.7 | 新一代状态管理库 |
| **Three.js** | ^0.165.0 | 3D图形库，用于WebGL渲染 |
| **Axios** | ^1.7.2 | HTTP客户端，用于API请求 |
| **vue-i18n** | ^9.13.1 | 国际化插件，支持中英双语 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js** | >= 18.0.0 | JavaScript运行时环境 |
| **Express** | ^4.19.2 | Web应用框架 |
| **TypeScript** | ^5.4.5 | 类型安全的JavaScript超集 |
| **mssql** | ^11.0.0 | SQL Server数据库驱动 |
| **jsonwebtoken** | ^9.0.2 | JWT身份认证 |
| **bcryptjs** | ^2.4.3 | 密码加密库 |
| **Zod** | ^3.23.8 | TypeScript优先的模式验证库 |
| **Multer** | ^1.4.5-lts.1 | 文件上传中间件 |
| **Redis** | ^5.4.1 | 分布式缓存 |

### 数据库架构

采用SQL Server 2019+，按业务领域拆分为6个独立数据库：

| 数据库 | 用途 | 核心表 |
|--------|------|--------|
| **Architecture** | 古建筑数据、社区论坛、知识图谱、翻译 | `ancient_architecture`, `forum_boards`, `kg_topics`, `translations` |
| **ATCA_User** | 用户管理、收藏、积分、AI配置 | `atca_user`, `favorite`, `ai_config` |
| **Media_3D** | 3D模型、构件定义、建筑模板 | `user_models`, `model_component_definitions`, `building_templates` |
| **Competition** | 题库、竞赛、答题记录 | `question`, `user_answer_history`, `competition_mode` |
| **Activity** | 活动、成就、每日任务 | `activity`, `achievement`, `daily_tasks` |
| **Social** | 社交分享、作品展示 | `shares`, `showcases` |

**容错机制**：数据库连接失败后自动降级到Mock模式，确保系统稳定运行。

### 核心模块架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │  Views  │ │Components│ │ Services│ │  Stores │ │  Utils  │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
└───────┼───────────┼───────────┼───────────┼───────────┼───────┘
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway                               │
│                      (Route Manager)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       Backend Layer                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Modules │ │Services │ │ Middleware│ │ Config  │ │  Utils  │  │
│  │(业务模块)│ │(业务逻辑)│ │(安全/限流)│ │(配置管理)│ │(工具函数)│  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
└───────┼───────────┼───────────┼───────────┼───────────┼───────┘
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                             │
│  Architecture │ ATCA_User │ Media_3D │ Competition │ Activity  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **SQL Server**: >= 2019
- **Redis**: >= 6.0（可选，用于分布式缓存）
- **操作系统**: Windows / macOS / Linux
- **浏览器**: Chrome >= 90 / Firefox >= 88 / Safari >= 14 / Edge >= 90

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/ATCA.git
cd ATCA
```

### 2. 数据库初始化

使用SQL Server Management Studio (SSMS)或命令行执行初始化脚本：

```bash
# 使用SSMS打开并执行
sql/InitializedSQL.sql
```

**初始化内容包括**：
- 创建6个业务数据库
- 创建所有表、索引、触发器、存储过程
- 导入初始数据（朝代映射、构件定义、论坛板块等）
- 创建默认管理员账户（`admin / admin123`）

### 3. 安装依赖

```bash
# 安装所有依赖（前端 + 后端）
npm run install:all

# 或者分别安装
npm install              # 根目录依赖
cd frontend && npm install
cd ../backend && npm install
```

### 4. 环境配置

在后端根目录创建`.env`文件：

```env
# 服务器配置
PORT=5000
NODE_ENV=development

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=2h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Architecture数据库配置
ARCH_DB_HOST=localhost
ARCH_DB_PORT=1433
ARCH_DB_NAME=Architecture
ARCH_DB_USER=sa
ARCH_DB_PASSWORD=your_password
ARCH_DB_ENCRYPT=false
ARCH_DB_TRUST_SERVER_CERTIFICATE=true

# User数据库配置
USER_DB_HOST=localhost
USER_DB_PORT=1433
USER_DB_NAME=ATCA_User
USER_DB_USER=sa
USER_DB_PASSWORD=your_password
USER_DB_ENCRYPT=false
USER_DB_TRUST_SERVER_CERTIFICATE=true

# Media数据库配置
MEDIA_DB_HOST=localhost
MEDIA_DB_PORT=1433
MEDIA_DB_NAME=Media_3D
MEDIA_DB_USER=sa
MEDIA_DB_PASSWORD=your_password
MEDIA_DB_ENCRYPT=false
MEDIA_DB_TRUST_SERVER_CERTIFICATE=true

# Competition数据库配置
COMP_DB_HOST=localhost
COMP_DB_PORT=1433
COMP_DB_NAME=Competition
COMP_DB_USER=sa
COMP_DB_PASSWORD=your_password
COMP_DB_ENCRYPT=false
COMP_DB_TRUST_SERVER_CERTIFICATE=true

# Activity数据库配置
ACT_DB_HOST=localhost
ACT_DB_PORT=1433
ACT_DB_NAME=Activity
ACT_DB_USER=sa
ACT_DB_PASSWORD=your_password
ACT_DB_ENCRYPT=false
ACT_DB_TRUST_SERVER_CERTIFICATE=true

# Social数据库配置
SOCIAL_DB_HOST=localhost
SOCIAL_DB_PORT=1433
SOCIAL_DB_NAME=Social
SOCIAL_DB_USER=sa
SOCIAL_DB_PASSWORD=your_password
SOCIAL_DB_ENCRYPT=false
SOCIAL_DB_TRUST_SERVER_CERTIFICATE=true

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI服务配置
QWEN_API_KEY=your-qwen-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
XUNFEI_API_KEY=your-xunfei-api-key

# 文件上传配置
UPLOAD_MAX_SIZE=10MB
UPLOAD_ALLOWED_TYPES=.jpg,.png,.glb,.gltf
```

### 5. 启动开发环境

```bash
# 仅启动前端
npm run dev:frontend

# 仅启动后端
npm run dev:backend

# 同时启动前端和后端
npm run dev
```

### 6. 验证安装

1. 访问 `http://localhost:5173`（前端）
2. 访问 `http://localhost:5000/api/v1/index/dashboard`（后端API）
3. 使用管理员账户登录：`admin / admin123`
4. 首次登录后请立即修改密码

---

## 📖 使用指南

### 3D建模工坊使用

#### 基础操作

```typescript
// 示例：创建基础建筑模型
import { SceneManager } from '@/components/threejs/ThreejsSceneManager';

const sceneManager = new SceneManager({
  container: document.getElementById('canvas-container'),
  enableSnap: true,
  gridSize: 1,
});

// 添加构件
sceneManager.addComponent('column', { x: 0, y: 0, z: 0 });
sceneManager.addComponent('beam', { x: 0, y: 3, z: 0 });

// 保存模型
const modelData = sceneManager.exportModel();
localStorage.setItem('myBuilding', JSON.stringify(modelData));
```

#### 榫卯吸附配置

```typescript
// 配置榫卯吸附参数
const snapConfig = {
  enabled: true,
  distance: 0.5,        // 吸附距离（米）
  autoAlign: true,      // 自动对齐
  showPreview: true,    // 显示预览
  rotationConstraints: true,  // 启用旋转约束
};

sceneManager.setSnapConfig(snapConfig);
```

#### 选择与变换

```typescript
// 选择模式
sceneManager.setTransformMode('select');  // 选择
sceneManager.setTransformMode('translate'); // 平移
sceneManager.setTransformMode('rotate');   // 旋转
sceneManager.setTransformMode('scale');    // 缩放

// 框选
sceneManager.startBoxSelect(startPoint);
sceneManager.updateBoxSelect(currentPoint);
sceneManager.endBoxSelect();

// 测量
sceneManager.enableMeasureTool();
sceneManager.measureDistance(point1, point2);
```

### 知识竞赛使用

#### 答题流程

```typescript
// 开始答题
import { QuizService } from '@/services/api';

const quizService = new QuizService();

// 选择难度级别
const quiz = await quizService.startQuiz({
  difficulty: 'intermediate',  // 入门/basic、基础/easy、挑战/intermediate、进阶/hard、专家/expert
  mode: 'random',              // random/review
  questionCount: 10,
});

// 提交答案
const result = await quizService.submitAnswer({
  quizId: quiz.id,
  questionId: question.id,
  answer: selectedOption,
  timeSpent: 30,  // 秒
});

// 获取统计
const stats = await quizService.getStats();
```

### AI助手使用

#### 基础问答

```typescript
// 发送问题给AI助手
import { AIService } from '@/services/api';

const aiService = new AIService();

const response = await aiService.askQuestion({
  question: '斗拱的作用是什么？',
  model: 'qwen',           // qwen/deepseek/xunfei
  role: 'technical_expert', // general/technical_expert/historian/custom
  enhancedCheck: true,      // 启用知识验证
});

console.log(response.answer);
console.log(response.analysis.knowledgeCoverage);  // 知识覆盖率
console.log(response.analysis.conflicts);           // 冲突检测结果
```

#### 知识覆盖率分析

```typescript
// 获取详细分析报告
const analysis = await aiService.getAnalysisReport({
  conversationId: 'conv_123',
  includeReferences: true,
  includeConflicts: true,
});

// 分析结果包含：
// - 知识覆盖率百分比
// - 引用的知识条目
// - 潜在的冲突点
// - 置信度评估
```

---

## 🔌 API文档

### 认证接口

#### 用户登录

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "nickname": "管理员"
    }
  }
}
```

#### 用户注册

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "nickname": "新用户"
}
```

### 古建筑接口

#### 获取建筑列表

```http
GET /api/v1/architecture?page=1&limit=10&dynasty=唐
Authorization: Bearer {token}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "佛光寺东大殿",
        "dynasty": "唐",
        "location": "山西省五台县",
        "description": "中国现存最早的木结构建筑之一",
        "imageUrl": "/images/architecture/foguangsi.jpg"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 3D模型接口

#### 保存模型

```http
POST /api/v1/models
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "我的第一个建筑",
  "description": "练习作品",
  "components": [
    {
      "type": "column",
      "position": {"x": 0, "y": 0, "z": 0},
      "rotation": {"x": 0, "y": 0, "z": 0},
      "scale": {"x": 1, "y": 1, "z": 1}
    }
  ],
  "isPublic": true
}
```

### AI助手接口

#### 发送问题

```http
POST /api/v1/assistant/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "斗拱的作用是什么？",
  "model": "qwen",
  "role": "technical_expert",
  "enhancedCheck": true
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "answer": "斗拱是中国古代建筑中特有的结构构件...",
    "analysis": {
      "knowledgeCoverage": 85,
      "confidence": 0.92,
      "references": [
        {
          "id": "kg_001",
          "name": "斗拱结构原理",
          "relevance": 0.95
        }
      ],
      "conflicts": []
    }
  }
}
```

### 知识竞赛接口

#### 开始答题

```http
POST /api/v1/quiz/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "difficulty": "intermediate",
  "mode": "random",
  "questionCount": 10
}
```

#### 提交答案

```http
POST /api/v1/quiz/submit
Authorization: Bearer {token}
Content-Type: application/json

{
  "quizId": "quiz_123",
  "questionId": "q_456",
  "answer": "A",
  "timeSpent": 30
}
```

### 完整API文档

请参阅 [docs/architecture/api-documentation.md](docs/architecture/api-documentation.md) 获取完整的API接口列表。

---

## 💻 开发指南

### 项目结构

```
ATCA/
├── frontend/                    # Vue 3 + TypeScript 前端
│   ├── src/
│   │   ├── views/              # 页面视图
│   │   │   ├── home/           # 首页 + 活动详情 + 启动页
│   │   │   ├── architecture/   # 古建筑馆
│   │   │   ├── quiz/           # 知识竞赛
│   │   │   ├── workshop/       # 3D工坊
│   │   │   ├── community/      # 社区
│   │   │   ├── user/           # 用户中心
│   │   │   └── admin/          # 后台管理
│   │   ├── components/
│   │   │   ├── threejs/        # 3D组件
│   │   │   │   ├── ThreejsSceneManager.ts    # 场景管理器
│   │   │   │   ├── ThreejsSelectionManager.ts # 选择管理器
│   │   │   │   ├── ThreejsMeasureTool.ts     # 测量工具
│   │   │   │   └── ThreejsMortiseTenonSnapEngine.ts # 榫卯吸附引擎
│   │   │   └── ai/             # AI组件
│   │   ├── services/           # API服务
│   │   ├── stores/             # Pinia状态管理
│   │   ├── router/             # 路由配置
│   │   ├── i18n/               # 国际化
│   │   └── utils/              # 工具函数
│   ├── public/                 # 静态资源
│   └── vite.config.ts
│
├── backend/                     # Express + TypeScript 后端
│   ├── src/
│   │   ├── config/             # 配置文件
│   │   ├── middleware/         # 中间件
│   │   │   ├── browseState.ts      # 客户端状态存储
│   │   │   ├── rateLimiter.ts      # 限流保护
│   │   │   ├── security.ts         # 安全防护
│   │   │   └── queryCache.ts       # 查询缓存
│   │   ├── modules/            # 业务模块
│   │   │   ├── auth/           # 认证模块
│   │   │   ├── architecture/   # 古建筑模块
│   │   │   ├── quiz/           # 竞赛模块
│   │   │   ├── model3d/        # 3D模型模块
│   │   │   ├── social/         # 社区模块
│   │   │   ├── admin/          # 管理模块
│   │   │   ├── ai/             # AI模块
│   │   │   └── assistant/      # 助手模块
│   │   ├── services/           # 核心服务
│   │   └── utils/              # 工具函数
│   └── package.json
│
├── shared/                      # 共享代码
│   ├── constants/              # 常量定义
│   ├── types/                  # 类型定义
│   └── utils/                  # 共享工具函数
│
├── sql/                         # 数据库脚本
│   └── InitializedSQL.sql
│
├── docs/                        # 技术文档
│   ├── architecture/           # 架构文档
│   ├── deployment/             # 部署文档
│   ├── performance/            # 性能文档
│   └── security/               # 安全文档
│
└── package.json                 # 根目录配置
```

### 开发规范

#### 代码风格

```typescript
// 使用TypeScript类型注解
interface UserModel {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

// 使用Composition API
import { ref, computed } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
```

#### 命名规范

- **文件名**: kebab-case (`user-service.ts`)
- **组件名**: PascalCase (`UserProfile.vue`)
- **变量名**: camelCase (`userName`)
- **常量名**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **类名**: PascalCase (`UserService`)

#### Git提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链相关
```

### 测试

```bash
# 运行前端测试
cd frontend
npm run test

# 运行后端测试
cd backend
npm run test

# 运行性能测试
cd backend
npm run test:load

# 运行端到端测试
npm run test:e2e
```

---

## 🚢 部署指南

### 生产环境构建

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd ../backend
npm run build
```

### Docker部署

```bash
# 使用Docker Compose一键部署
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### Nginx配置

```nginx
server {
    listen 80;
    server_name atca.xin;

    # 前端静态文件
    location / {
        root /var/www/atca/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3D模型资源
    location /models/ {
        root /var/www/atca;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket支持
    location /ws/ {
        proxy_pass http://localhost:5000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 环境变量配置

生产环境需要配置以下环境变量：

```env
# 服务器配置
PORT=5000
NODE_ENV=production

# 数据库配置（6个数据库）
DB_HOST=your-db-host
DB_PORT=1433
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=2h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis配置
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# AI服务配置
QWEN_API_KEY=your-qwen-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
XUNFEI_API_KEY=your-xunfei-api-key

# 文件上传配置
UPLOAD_MAX_SIZE=10MB
UPLOAD_ALLOWED_TYPES=.jpg,.png,.glb,.gltf

# 安全配置
ADMIN_API_KEY=your-admin-api-key
```

---

## ⚡ 性能优化

### 核心优化措施

| 优化项 | 实现位置 | 优化效果 |
|--------|----------|----------|
| **客户端状态存储** | `backend/src/middleware/browseState.ts` | 内存占用减少60% |
| **查询缓存** | `backend/src/services/queryCache.ts` | 缓存命中率75% |
| **响应压缩** | `backend/src/main.ts` | 传输数据减少60-80% |
| **智能SQL检测** | `backend/src/middleware/security.ts` | 误报率<5% |
| **限流保护** | `backend/src/middleware/rateLimiter.ts` | 暴力破解防护100% |

### 性能基准

| API接口 | P50 | P90 | P99 | 吞吐量 |
|---------|-----|-----|-----|--------|
| 建筑列表 | 45ms | 80ms | 150ms | 120 req/s |
| 建筑详情 | 35ms | 65ms | 120ms | 80 req/s |
| 用户登录 | 65ms | 120ms | 200ms | 30 req/s |
| AI聊天 | 180ms | 350ms | 500ms | 15 req/s |

### 详细性能文档

请参阅 [docs/performance/implementation-summary.md](docs/performance/implementation-summary.md) 获取完整的性能优化说明。

---

## 🔒 安全策略

### 安全防护措施

- **SQL注入防护**: 智能检测算法，多维度评分系统
- **XSS防护**: Helmet CSP配置，输入验证和清理
- **CSRF防护**: CORS严格配置，SameSite Cookie设置
- **暴力破解防护**: 登录尝试限制，自动锁定机制
- **API限流**: 请求频率限制，Redis分布式限流
- **路径遍历防护**: 路径规范化，禁止访问敏感目录
- **请求大小限制**: 防止大文件攻击和内存溢出

### 详细安全文档

请参阅 [docs/security/security-policy.md](docs/security/security-policy.md) 获取完整的安全策略说明。

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是代码、文档、bug报告还是功能建议。

### 如何贡献

1. **Fork项目**
   ```bash
   # 点击GitHub页面右上角的Fork按钮
   ```

2. **克隆你的Fork**
   ```bash
   git clone https://github.com/yourusername/ATCA.git
   cd ATCA
   ```

3. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **进行更改**
   - 遵循代码规范
   - 添加必要的测试
   - 更新相关文档

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

6. **推送到你的Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建Pull Request**
   - 在GitHub上创建PR
   - 详细描述你的更改
   - 等待代码审查

### 开发指南

#### 设置开发环境

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/ATCA.git
cd ATCA

# 2. 安装依赖
npm run install:all

# 3. 配置数据库
# 按照快速开始指南配置数据库

# 4. 启动开发服务器
npm run dev
```

#### 代码审查标准

- 代码必须通过ESLint检查
- 新功能必须包含单元测试
- 文档必须同步更新
- 遵循项目的代码风格指南

### 报告问题

如果你发现了bug或有功能建议：

1. 检查[Issues](https://github.com/yourusername/ATCA/issues)确保问题未被报告
2. 创建新的Issue，包含：
   - 清晰的标题
   - 详细的问题描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（操作系统、浏览器版本等）

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

```
MIT License

Copyright (c) 2024 ATCA Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 鸣谢

本项目使用了以下优秀的开源项目：

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Three.js](https://threejs.org/) - 3D图形库
- [Express](https://expressjs.com/) - Web应用框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript超集
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Pinia](https://pinia.vuejs.org/) - 状态管理库
- [Three.js OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls) - 轨道控制
- [Three.js TransformControls](https://threejs.org/docs/#examples/en/controls/TransformControls) - 变换控制

---

**项目版本**: v2.0.1
**最后更新**: 2026-06-22  
**维护团队**: ATCA Development Team