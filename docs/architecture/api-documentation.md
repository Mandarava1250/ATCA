# 华夏营造 - API接口文档

## 概述

本文档定义了华夏营造平台的后端API接口规范，用于指导前后端团队并行开发。所有接口均返回JSON格式数据，并遵循统一的响应格式。

## 基础信息

- **API版本**: v1
- **基础路径**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

## 统一响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "meta": {
    "total": 100,
    "totalPages": 10,
    "page": 1,
    "limit": 10
  }
}
```

### 失败响应
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "错误描述",
    "details": "详细信息"
  }
}
```

## 认证API

### 登录
- **路径**: `/auth/login`
- **方法**: POST
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "user": { "userId": 1, "username": "xxx", ... },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```

### 注册
- **路径**: `/auth/register`
- **方法**: POST
- **请求体**:
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "nickname": "string (可选)"
}
```

### 获取当前用户
- **路径**: `/auth/me`
- **方法**: GET
- **认证**: 需要

### 刷新Token
- **路径**: `/auth/refresh`
- **方法**: POST
- **请求体**:
```json
{
  "refreshToken": "string"
}
```

## 古建筑API

### 获取建筑列表
- **路径**: `/architecture`
- **方法**: GET
- **查询参数**:
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `type`: 建筑类型 (可选)
  - `dynasty`: 朝代 (可选)
  - `search`: 搜索关键词 (可选)

### 获取建筑详情
- **路径**: `/architecture/{id}`
- **方法**: GET

### 获取建筑统计
- **路径**: `/architecture/stats`
- **方法**: GET

### 获取朝代列表
- **路径**: `/architecture/dynasty/list`
- **方法**: GET

### 获取类型列表
- **路径**: `/architecture/type/list`
- **方法**: GET

### 搜索建筑
- **路径**: `/architecture/search/suggestions`
- **方法**: GET
- **查询参数**:
  - `q`: 搜索关键词

### 收藏/取消收藏
- **路径**: `/architecture/{id}/favorite`
- **方法**: POST / DELETE

## 竞赛API

### 获取竞赛模式
- **路径**: `/quiz/modes`
- **方法**: GET

### 获取题目
- **路径**: `/quiz/questions`
- **方法**: GET
- **查询参数**:
  - `mode`: 模式ID

### 提交答案
- **路径**: `/quiz/submit`
- **方法**: POST
- **请求体**:
```json
{
  "sessionId": "string",
  "answers": { "1": "A", "2": "B", ... }
}
```

### 获取用户统计
- **路径**: `/quiz/stats`
- **方法**: GET
- **认证**: 需要

### 获取排行榜
- **路径**: `/quiz/leaderboard`
- **方法**: GET
- **查询参数**:
  - `mode`: 模式ID (可选)

## AI助手API

### 聊天
- **路径**: `/assistant/chat`
- **方法**: POST
- **请求体**:
```json
{
  "message": "string",
  "ai_id": "number (可选)",
  "enhancedCheck": "boolean (可选)"
}
```

### 流式聊天
- **路径**: `/assistant/chat-stream`
- **方法**: POST
- **请求体**: 同上

### 获取聊天历史
- **路径**: `/assistant/history`
- **方法**: GET
- **认证**: 需要

### 清空聊天历史
- **路径**: `/assistant/clear`
- **方法**: DELETE
- **认证**: 需要

## 3D模型API

### 获取模型列表
- **路径**: `/models`
- **方法**: GET
- **查询参数**:
  - `page`: 页码
  - `limit`: 每页数量

### 获取组件列表
- **路径**: `/models/components`
- **方法**: GET
- **查询参数**:
  - `category`: 组件分类 (可选)

### 获取模板列表
- **路径**: `/models/templates`
- **方法**: GET

### 获取单个模板
- **路径**: `/models/templates/{id}`
- **方法**: GET

### 保存模型
- **路径**: `/models`
- **方法**: POST
- **认证**: 需要

### 获取我的模型
- **路径**: `/models/my-models`
- **方法**: GET
- **认证**: 需要

### 删除模型
- **路径**: `/models/{id}`
- **方法**: DELETE
- **认证**: 需要

## 社交API

### 获取评论
- **路径**: `/social/comments`
- **方法**: GET
- **查询参数**:
  - `target_type`: 目标类型
  - `target_id`: 目标ID
  - `page`: 页码
  - `limit`: 每页数量

### 发表评论
- **路径**: `/social/comments`
- **方法**: POST
- **认证**: 需要
- **请求体**:
```json
{
  "target_type": "string",
  "target_id": "number",
  "content": "string",
  "parent_id": "number (可选)"
}
```

### 删除评论
- **路径**: `/social/comments/{id}`
- **方法**: DELETE
- **认证**: 需要

### 点赞/取消点赞
- **路径**: `/social/likes`
- **方法**: POST
- **认证**: 需要
- **请求体**:
```json
{
  "target_type": "string",
  "target_id": "number"
}
```

### 获取建筑分享
- **路径**: `/social/building-shares`
- **方法**: GET
- **查询参数**:
  - `search`: 搜索关键词
  - `era`: 年代
  - `building_type`: 建筑类型
  - `featured`: 是否精选
  - `page`: 页码
  - `limit`: 每页数量

### 创建建筑分享
- **路径**: `/social/building-shares`
- **方法**: POST
- **认证**: 需要

### 获取论坛板块
- **路径**: `/social/forum/boards`
- **方法**: GET

### 获取论坛话题
- **路径**: `/social/forum/topics`
- **方法**: GET
- **查询参数**:
  - `board_id`: 板块ID (可选)
  - `page`: 页码
  - `limit`: 每页数量

### 创建论坛话题
- **路径**: `/social/forum/topics`
- **方法**: POST
- **认证**: 需要
- **请求体**:
```json
{
  "board_id": "number",
  "title": "string",
  "content": "string"
}
```

### 获取话题详情
- **路径**: `/social/forum/topics/{id}`
- **方法**: GET

### 创建回复
- **路径**: `/social/forum/replies`
- **方法**: POST
- **认证**: 需要
- **请求体**:
```json
{
  "topic_id": "number",
  "content": "string"
}
```

## 国际化API

### 获取语言列表
- **路径**: `/i18n/languages`
- **方法**: GET
- **查询参数**:
  - `active_only`: 是否仅获取活跃语言 (默认: true)

### 获取翻译
- **路径**: `/i18n/translate/{entityType}/{entityId}`
- **方法**: GET
- **查询参数**:
  - `lang`: 目标语言 (默认: en)

### 批量获取翻译
- **路径**: `/i18n/translate/batch`
- **方法**: POST
- **请求体**:
```json
{
  "entityType": "string",
  "entityIds": [1, 2, 3],
  "language": "string"
}
```

### 自动翻译
- **路径**: `/i18n/translate/auto`
- **方法**: POST
- **请求体**:
```json
{
  "source_text": "string",
  "target_lang": "string (可选)"
}
```

## 个人资料API

### 获取个人资料
- **路径**: `/profile`
- **方法**: GET
- **认证**: 需要

### 获取收藏
- **路径**: `/profile/favorites`
- **方法**: GET
- **认证**: 需要

### 获取用户模型
- **路径**: `/profile/models`
- **方法**: GET
- **认证**: 需要

### 获取积分记录
- **路径**: `/profile/points`
- **方法**: GET
- **认证**: 需要

### 更新设置
- **路径**: `/profile/settings`
- **方法**: PUT
- **认证**: 需要

## 首页API

### 获取仪表盘数据
- **路径**: `/index/dashboard`
- **方法**: GET

### 获取随机卡片
- **路径**: `/index/random-cards`
- **方法**: GET
- **查询参数**:
  - `count`: 数量 (默认: 4)

### 获取首页排行榜
- **路径**: `/index/leaderboard`
- **方法**: GET

### 获取首页统计
- **路径**: `/index/stats`
- **方法**: GET

## 活动API

### 获取活动列表
- **路径**: `/activities`
- **方法**: GET

### 获取活动详情
- **路径**: `/activities/{id}`
- **方法**: GET

### 获取成就列表
- **路径**: `/activities/achievements`
- **方法**: GET

### 获取用户成就
- **路径**: `/activities/user-achievements`
- **方法**: GET
- **认证**: 需要

### 获取每日任务
- **路径**: `/activities/daily-tasks`
- **方法**: GET
- **认证**: 需要

### 参加活动
- **路径**: `/activities/{id}/join`
- **方法**: POST
- **认证**: 需要

## 知识库API

### 获取知识库列表
- **路径**: `/knowledge`
- **方法**: GET
- **查询参数**:
  - `category`: 分类 (可选)

### 获取单个知识
- **路径**: `/knowledge/{id}`
- **方法**: GET

### 搜索知识
- **路径**: `/knowledge/search/query`
- **方法**: GET
- **查询参数**:
  - `q`: 搜索关键词
  - `limit`: 数量限制

### 获取分类列表
- **路径**: `/knowledge/categories`
- **方法**: GET

### 获取统计数据
- **路径**: `/knowledge/stats`
- **方法**: GET

## 管理员API

### 获取仪表盘
- **路径**: `/admin/dashboard`
- **方法**: GET
- **认证**: 需要管理员权限

### 获取用户列表
- **路径**: `/admin/users`
- **方法**: GET
- **认证**: 需要管理员权限
- **查询参数**:
  - `page`: 页码
  - `limit`: 每页数量
  - `search`: 搜索关键词

### 更新用户
- **路径**: `/admin/users/{id}`
- **方法**: PUT
- **认证**: 需要管理员权限

### 删除用户
- **路径**: `/admin/users/{id}`
- **方法**: DELETE
- **认证**: 需要管理员权限

### 获取建筑列表
- **路径**: `/admin/architectures`
- **方法**: GET
- **认证**: 需要管理员权限

### 创建建筑
- **路径**: `/admin/architectures`
- **方法**: POST
- **认证**: 需要管理员权限

### 更新建筑
- **路径**: `/admin/architectures/{id}`
- **方法**: PUT
- **认证**: 需要管理员权限

### 删除建筑
- **路径**: `/admin/architectures/{id}`
- **方法**: DELETE
- **认证**: 需要管理员权限

### 获取题目列表
- **路径**: `/admin/questions`
- **方法**: GET
- **认证**: 需要管理员权限

### 创建题目
- **路径**: `/admin/questions`
- **方法**: POST
- **认证**: 需要管理员权限

### 更新题目
- **路径**: `/admin/questions/{id}`
- **方法**: PUT
- **认证**: 需要管理员权限

### 删除题目
- **路径**: `/admin/questions/{id}`
- **方法**: DELETE
- **认证**: 需要管理员权限

### 获取AI配置
- **路径**: `/admin/ai-configs`
- **方法**: GET
- **认证**: 需要管理员权限

### 创建AI配置
- **路径**: `/admin/ai-configs`
- **方法**: POST
- **认证**: 需要管理员权限

### 更新AI配置
- **路径**: `/admin/ai-configs/{id}`
- **方法**: PUT
- **认证**: 需要管理员权限

### 删除AI配置
- **路径**: `/admin/ai-configs/{id}`
- **方法**: DELETE
- **认证**: 需要管理员权限

### 获取活动列表
- **路径**: `/admin/activities`
- **方法**: GET
- **认证**: 需要管理员权限

### 创建活动
- **路径**: `/admin/activities`
- **方法**: POST
- **认证**: 需要管理员权限

### 更新活动
- **路径**: `/admin/activities/{id}`
- **方法**: PUT
- **认证**: 需要管理员权限

### 删除活动
- **路径**: `/admin/activities/{id}`
- **方法**: DELETE
- **认证**: 需要管理员权限

### 获取每日挑战
- **路径**: `/admin/daily-challenges`
- **方法**: GET
- **认证**: 需要管理员权限

### 创建每日挑战
- **路径**: `/admin/daily-challenges`
- **方法**: POST
- **认证**: 需要管理员权限

### 更新每日挑战
- **路径**: `/admin/daily-challenges/{id}`
- **方法**: PUT
- **认证**: 需要管理员权限

### 删除每日挑战
- **路径**: `/admin/daily-challenges/{id}`
- **方法**: DELETE
- **认证**: 需要管理员权限

### 用户禁言管理
- **路径**: `/admin/users/{id}/mute`
- **方法**: PUT
- **认证**: 需要管理员权限
- **请求体**:
```json
{
  "is_muted": "boolean",
  "mute_reason": "string (可选)"
}
```

## 错误码表

| 错误码 | 含义 |
|--------|------|
| AUTH_001 | 用户不存在 |
| AUTH_002 | 密码错误 |
| AUTH_003 | 未提供认证令牌 |
| AUTH_004 | 令牌已过期或无效 |
| AUTH_005 | 权限不足 |
| MUTE_001 | 用户已被禁言 |
| VALID_001 | 参数验证失败 |
| DB_001 | 数据库操作失败 |
| AI_001 | AI服务不可用 |

## 健康检查

### 检查服务状态
- **路径**: `/health`
- **方法**: GET
- **响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

## 开发环境注意事项

1. **跨域配置**: 开发环境允许 `http://localhost:3000`, `http://localhost:3100`, `http://localhost:5173`
2. **Mock模式**: 设置环境变量 `USE_MOCK=true` 可启用Mock数据模式
3. **API文档**: 访问 `/api-docs` 查看Swagger文档