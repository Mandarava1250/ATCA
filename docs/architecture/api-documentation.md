# 华夏营造 - API接口文档

## 概述

本文档定义了华夏营造平台的后端API接口规范，用于指导前后端团队并行开发。所有接口均返回JSON格式数据，并遵循统一的响应格式。

---

## 基础信息

- **API版本**: v1
- **基础路径**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON
- **字符编码**: UTF-8

---

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

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `data` | any | 返回数据 |
| `meta` | object | 分页元信息（可选） |
| `meta.total` | number | 总记录数 |
| `meta.totalPages` | number | 总页数 |
| `meta.page` | number | 当前页码 |
| `meta.limit` | number | 每页数量 |

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

| 字段 | 类型 | 说明 |
|------|------|------|
| `success` | boolean | 是否成功 |
| `error` | object | 错误信息 |
| `error.code` | string | 错误码 |
| `error.message` | string | 错误描述 |
| `error.details` | string | 详细信息（可选） |

---

## 认证API

### 登录

- **路径**: `/auth/login`
- **方法**: POST
- **认证**: 无需
- **请求体**:

```json
{
  "username": "string (必填)",
  "password": "string (必填)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "user": {
      "userId": 1,
      "username": "admin",
      "nickname": "管理员",
      "role": "admin",
      "email": "admin@example.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

- **失败响应** (401):

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "用户不存在或密码错误",
    "details": "请检查用户名和密码是否正确"
  }
}
```

### 注册

- **路径**: `/auth/register`
- **方法**: POST
- **认证**: 无需
- **请求体**:

```json
{
  "username": "string (必填，3-20字符)",
  "password": "string (必填，6-32字符)",
  "email": "string (必填，有效邮箱格式)",
  "nickname": "string (可选)"
}
```

- **成功响应** (201):

```json
{
  "success": true,
  "data": {
    "userId": 2,
    "username": "newuser",
    "nickname": "新用户",
    "role": "user"
  }
}
```

### 获取当前用户

- **路径**: `/auth/me`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "admin",
    "nickname": "管理员",
    "role": "admin",
    "email": "admin@example.com",
    "avatar": "/uploads/avatars/default.png",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 刷新Token

- **路径**: `/auth/refresh`
- **方法**: POST
- **认证**: 无需
- **请求体**:

```json
{
  "refreshToken": "string (必填)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 退出登录

- **路径**: `/auth/logout`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": "退出成功"
}
```

---

## 古建筑API

### 获取建筑列表

- **路径**: `/architecture`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 10 | 每页数量 |
| `type` | string | 否 | - | 建筑类型 |
| `dynasty` | string | 否 | - | 朝代 |
| `search` | string | 否 | - | 搜索关键词 |

- **成功响应** (200):

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
        "imageUrl": "/images/architecture/foguangsi.jpg",
        "type": "寺庙",
        "yearBuilt": "857年",
        "architecturalStyle": "唐代建筑风格",
        "protectionLevel": "全国重点文物保护单位",
        "latitude": 38.9333,
        "longitude": 113.5667,
        "viewCount": 15600,
        "favoriteCount": 2340,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 获取建筑详情

- **路径**: `/architecture/{id}`
- **方法**: GET
- **认证**: 可选
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 建筑ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "佛光寺东大殿",
    "dynasty": "唐",
    "location": "山西省五台县",
    "description": "中国现存最早的木结构建筑之一",
    "imageUrl": "/images/architecture/foguangsi.jpg",
    "type": "寺庙",
    "yearBuilt": "857年",
    "architecturalStyle": "唐代建筑风格",
    "protectionLevel": "全国重点文物保护单位",
    "latitude": 38.9333,
    "longitude": 113.5667,
    "viewCount": 15600,
    "favoriteCount": 2340,
    "facts": [
      "建筑面积约677平方米",
      "面阔七间，进深四间",
      "采用抬梁式木结构"
    ],
    "relatedBuildings": [2, 3, 5],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-06-19T10:00:00Z"
  }
}
```

### 获取建筑统计

- **路径**: `/architecture/stats`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "totalBuildings": 500,
    "totalViews": 1250000,
    "totalFavorites": 89000,
    "dynastyDistribution": {
      "唐": 35,
      "宋": 68,
      "明": 120,
      "清": 180,
      "其他": 97
    },
    "typeDistribution": {
      "寺庙": 150,
      "宫殿": 80,
      "园林": 120,
      "民居": 100,
      "塔": 50
    }
  }
}
```

### 获取朝代列表

- **路径**: `/architecture/dynasty/list`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "唐", "startYear": 618, "endYear": 907},
    {"id": 2, "name": "宋", "startYear": 960, "endYear": 1279},
    {"id": 3, "name": "元", "startYear": 1271, "endYear": 1368},
    {"id": 4, "name": "明", "startYear": 1368, "endYear": 1644},
    {"id": 5, "name": "清", "startYear": 1644, "endYear": 1912}
  ]
}
```

### 获取类型列表

- **路径**: `/architecture/type/list`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "寺庙", "icon": "🏛️"},
    {"id": 2, "name": "宫殿", "icon": "🏯"},
    {"id": 3, "name": "园林", "icon": "🏡"},
    {"id": 4, "name": "民居", "icon": "🏠"},
    {"id": 5, "name": "塔", "icon": "🗼"}
  ]
}
```

### 搜索建筑

- **路径**: `/architecture/search/suggestions`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | 是 | 搜索关键词 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "佛光寺东大殿", "dynasty": "唐"},
    {"id": 2, "name": "应县木塔", "dynasty": "辽"},
    {"id": 3, "name": "故宫太和殿", "dynasty": "清"}
  ]
}
```

### 收藏/取消收藏

- **路径**: `/architecture/{id}/favorite`
- **方法**: POST / DELETE
- **认证**: 需要（Bearer Token）
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 建筑ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "isFavorite": true,
    "favoriteCount": 2341
  }
}
```

---

## AI助手API

### 聊天

- **路径**: `/assistant/chat`
- **方法**: POST
- **认证**: 可选（访客模式可用）
- **请求体**:

```json
{
  "message": "string (必填)",
  "ai_id": "number (可选，AI模型ID)",
  "enhancedCheck": "boolean (可选，是否启用知识验证)",
  "role": "string (可选，角色类型: general/technical_expert/historian)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "answer": "斗拱是中国古代建筑中特有的结构构件...",
    "analysis": {
      "knowledgeCoverage": 85,
      "confidence": 0.92,
      "references": [
        {"id": "kg_001", "name": "斗拱结构原理", "relevance": 0.95},
        {"id": "kg_002", "name": "唐代建筑特征", "relevance": 0.88}
      ],
      "conflicts": []
    },
    "conversationId": "conv_abc123",
    "modelUsed": "qwen"
  }
}
```

### 流式聊天

- **路径**: `/assistant/chat-stream`
- **方法**: POST
- **认证**: 可选
- **请求体**: 同聊天接口
- **响应**: Server-Sent Events (SSE)

### 获取聊天历史

- **路径**: `/assistant/history`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 20 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "conv_abc123",
        "message": "斗拱的作用是什么？",
        "answer": "斗拱是中国古代建筑中特有的结构构件...",
        "createdAt": "2024-06-19T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### 清空聊天历史

- **路径**: `/assistant/clear`
- **方法**: DELETE
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": "聊天历史已清空"
}
```

---

## 3D模型API

### 获取模型列表

- **路径**: `/models`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 10 | 每页数量 |
| `featured` | boolean | 否 | false | 是否精选 |
| `userId` | number | 否 | - | 用户ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "唐代宫殿",
        "description": "练习作品",
        "thumbnail": "/models/thumbnails/1.png",
        "componentCount": 15,
        "isPublic": true,
        "isFeatured": false,
        "viewCount": 520,
        "likeCount": 45,
        "authorId": 1,
        "authorName": "建筑师小王",
        "createdAt": "2024-06-18T15:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 获取组件列表

- **路径**: `/models/components`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `category` | string | 否 | 组件分类 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "柱",
      "category": "support",
      "description": "支撑结构",
      "modelUrl": "/models/components/column.glb",
      "defaultScale": {"x": 1, "y": 1, "z": 1}
    },
    {
      "id": 2,
      "name": "梁",
      "category": "beam",
      "description": "水平承重构件",
      "modelUrl": "/models/components/beam.glb",
      "defaultScale": {"x": 1, "y": 1, "z": 1}
    }
  ]
}
```

### 获取模板列表

- **路径**: `/models/templates`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "唐代寺庙基础模板",
      "description": "包含基本的柱、梁、斗拱布局",
      "thumbnail": "/models/templates/1.png",
      "componentCount": 20
    }
  ]
}
```

### 获取单个模板

- **路径**: `/models/templates/{id}`
- **方法**: GET
- **认证**: 可选
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 模板ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "唐代寺庙基础模板",
    "description": "包含基本的柱、梁、斗拱布局",
    "components": [
      {"type": "column", "position": {"x": 0, "y": 0, "z": 0}},
      {"type": "column", "position": {"x": 4, "y": 0, "z": 0}},
      {"type": "beam", "position": {"x": 2, "y": 3, "z": 0}}
    ]
  }
}
```

### 保存模型

- **路径**: `/models`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "name": "string (必填)",
  "description": "string (可选)",
  "components": "array (必填，构件数组)",
  "isPublic": "boolean (可选，默认true)",
  "thumbnail": "string (可选，Base64图片)"
}
```

- **成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": 101,
    "name": "我的作品",
    "isPublic": true,
    "createdAt": "2024-06-19T10:00:00Z"
  }
}
```

### 获取我的模型

- **路径**: `/models/my-models`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 10 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

### 删除模型

- **路径**: `/models/{id}`
- **方法**: DELETE
- **认证**: 需要（Bearer Token）
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 模型ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": "模型已删除"
}
```

---

## 知识竞赛API

### 获取竞赛模式

- **路径**: `/quiz/modes`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "easy",
      "name": "入门",
      "description": "适合初学者的简单题目",
      "difficulty": 1,
      "pointMultiplier": 1
    },
    {
      "id": "basic",
      "name": "基础",
      "description": "基础难度题目",
      "difficulty": 2,
      "pointMultiplier": 1.5
    },
    {
      "id": "intermediate",
      "name": "挑战",
      "description": "中等难度题目",
      "difficulty": 3,
      "pointMultiplier": 2
    },
    {
      "id": "hard",
      "name": "进阶",
      "description": "较高难度题目",
      "difficulty": 4,
      "pointMultiplier": 3
    },
    {
      "id": "expert",
      "name": "专家",
      "description": "最高难度题目",
      "difficulty": 5,
      "pointMultiplier": 5
    }
  ]
}
```

### 开始答题

- **路径**: `/quiz/start`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "difficulty": "string (必填，难度级别)",
  "mode": "string (可选，random/review，默认random)",
  "questionCount": "number (可选，默认10)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "quizId": "quiz_abc123",
    "questions": [
      {
        "id": "q_001",
        "question": "斗拱主要用于什么结构？",
        "options": ["A. 装饰", "B. 承重", "C. 通风", "D. 排水"],
        "difficulty": "intermediate",
        "category": "结构"
      }
    ],
    "startTime": "2024-06-19T10:00:00Z"
  }
}
```

### 提交答案

- **路径**: `/quiz/submit`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "quizId": "string (必填)",
  "questionId": "string (必填)",
  "answer": "string (必填，选项如'A')",
  "timeSpent": "number (可选，答题耗时秒数)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": "B",
    "explanation": "斗拱是中国古代建筑中特有的结构构件，主要用于承重和传递荷载...",
    "pointsEarned": 20,
    "totalScore": 150
  }
}
```

### 获取用户统计

- **路径**: `/quiz/stats`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "totalQuestions": 500,
    "correctAnswers": 420,
    "accuracy": 84,
    "totalPoints": 15600,
    "streak": 7,
    "achievements": ["first_blood", "streak_7", "perfect_score"],
    "difficultyStats": {
      "easy": {"total": 100, "correct": 95},
      "basic": {"total": 150, "correct": 130},
      "intermediate": {"total": 150, "correct": 120},
      "hard": {"total": 80, "correct": 60},
      "expert": {"total": 20, "correct": 15}
    },
    "trend": [75, 80, 82, 78, 85, 84, 88]
  }
}
```

### 获取排行榜

- **路径**: `/quiz/leaderboard`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `mode` | string | 否 | 模式ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"rank": 1, "userId": 1, "username": "建筑大师", "points": 50000, "accuracy": 95},
    {"rank": 2, "userId": 2, "username": "文化爱好者", "points": 45000, "accuracy": 92},
    {"rank": 3, "userId": 3, "username": "历史学者", "points": 42000, "accuracy": 90}
  ]
}
```

---

## 社交API

### 获取评论

- **路径**: `/social/comments`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `target_type` | string | 是 | - | 目标类型 |
| `target_id` | number | 是 | - | 目标ID |
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 20 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "userId": 1,
        "username": "用户A",
        "avatar": "/uploads/avatars/1.png",
        "content": "非常棒的建筑！",
        "likes": 15,
        "replies": 3,
        "createdAt": "2024-06-19T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### 发表评论

- **路径**: `/social/comments`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "target_type": "string (必填)",
  "target_id": "number (必填)",
  "content": "string (必填)",
  "parent_id": "number (可选，回复评论ID)"
}
```

- **成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": 101,
    "content": "评论内容",
    "createdAt": "2024-06-19T10:00:00Z"
  }
}
```

### 删除评论

- **路径**: `/social/comments/{id}`
- **方法**: DELETE
- **认证**: 需要（Bearer Token）
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 评论ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": "评论已删除"
}
```

### 点赞/取消点赞

- **路径**: `/social/likes`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "target_type": "string (必填)",
  "target_id": "number (必填)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likeCount": 16
  }
}
```

### 获取论坛板块

- **路径**: `/social/forum/boards`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "综合讨论", "description": "综合话题讨论", "topicCount": 500, "postCount": 2500},
    {"id": 2, "name": "营造技艺", "description": "古建筑营造技术讨论", "topicCount": 300, "postCount": 1500},
    {"id": 3, "name": "建筑赏析", "description": "优秀建筑作品赏析", "topicCount": 200, "postCount": 800},
    {"id": 4, "name": "知识问答", "description": "知识问答交流", "topicCount": 400, "postCount": 2000},
    {"id": 5, "name": "社区公告", "description": "社区公告和通知", "topicCount": 50, "postCount": 100}
  ]
}
```

### 获取论坛话题

- **路径**: `/social/forum/topics`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `board_id` | number | 否 | - | 板块ID |
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 20 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "boardId": 1,
        "boardName": "综合讨论",
        "title": "关于唐代建筑的一些思考",
        "content": "最近研究唐代建筑...",
        "authorId": 1,
        "authorName": "建筑爱好者",
        "replyCount": 45,
        "viewCount": 520,
        "createdAt": "2024-06-18T15:00:00Z",
        "updatedAt": "2024-06-19T10:00:00Z"
      }
    ],
    "total": 500,
    "page": 1,
    "limit": 20
  }
}
```

### 创建论坛话题

- **路径**: `/social/forum/topics`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "board_id": "number (必填)",
  "title": "string (必填)",
  "content": "string (必填)"
}
```

- **成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": 501,
    "title": "新话题",
    "createdAt": "2024-06-19T10:00:00Z"
  }
}
```

### 获取话题详情

- **路径**: `/social/forum/topics/{id}`
- **方法**: GET
- **认证**: 可选
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 话题ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "boardId": 1,
    "boardName": "综合讨论",
    "title": "关于唐代建筑的一些思考",
    "content": "最近研究唐代建筑...",
    "authorId": 1,
    "authorName": "建筑爱好者",
    "replyCount": 45,
    "viewCount": 520,
    "createdAt": "2024-06-18T15:00:00Z",
    "updatedAt": "2024-06-19T10:00:00Z",
    "replies": [...],
    "isLiked": false,
    "likeCount": 23
  }
}
```

### 创建回复

- **路径**: `/social/forum/replies`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "topic_id": "number (必填)",
  "content": "string (必填)"
}
```

- **成功响应** (201):

```json
{
  "success": true,
  "data": {
    "id": 1001,
    "content": "回复内容",
    "createdAt": "2024-06-19T10:00:00Z"
  }
}
```

---

## 个人资料API

### 获取个人资料

- **路径**: `/profile`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "admin",
    "nickname": "管理员",
    "email": "admin@example.com",
    "avatar": "/uploads/avatars/1.png",
    "role": "admin",
    "points": 15600,
    "level": 10,
    "bio": "古建筑爱好者",
    "location": "北京",
    "joinedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 更新个人资料

- **路径**: `/profile`
- **方法**: PUT
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "nickname": "string (可选)",
  "bio": "string (可选)",
  "location": "string (可选)",
  "avatar": "string (可选，Base64图片)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": "资料更新成功"
}
```

### 获取收藏

- **路径**: `/profile/favorites`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 20 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### 获取用户模型

- **路径**: `/profile/models`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 20 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### 获取积分记录

- **路径**: `/profile/points`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 20 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {"id": 1, "type": "quiz", "points": 20, "description": "答题得分", "createdAt": "2024-06-19T10:00:00Z"},
      {"id": 2, "type": "daily", "points": 50, "description": "每日打卡", "createdAt": "2024-06-19T08:00:00Z"}
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPoints": 15600
  }
}
```

### 更新设置

- **路径**: `/profile/settings`
- **方法**: PUT
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "notifications": "boolean (可选)",
  "emailNotifications": "boolean (可选)",
  "language": "string (可选，zh/en)",
  "theme": "string (可选，light/dark)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": "设置更新成功"
}
```

---

## 首页API

### 获取仪表盘数据

- **路径**: `/index/dashboard`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "todayVisitors": 1250,
    "totalUsers": 50000,
    "totalBuildings": 500,
    "totalModels": 2000,
    "activeUsers": 320,
    "trendingBuildings": [1, 3, 5, 7],
    "latestModels": [101, 102, 103],
    "dailyQuizStats": {
      "participants": 520,
      "avgScore": 75,
      "topScore": 100
    }
  }
}
```

### 获取随机卡片

- **路径**: `/index/random-cards`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `count` | number | 否 | 4 | 数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": 1, "type": "building", "title": "佛光寺东大殿", "image": "/images/card1.jpg"},
    {"id": 2, "type": "model", "title": "唐代宫殿", "image": "/images/card2.jpg"}
  ]
}
```

### 获取首页排行榜

- **路径**: `/index/leaderboard`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "weekly": [...],
    "monthly": [...],
    "allTime": [...]
  }
}
```

---

## 活动API

### 获取活动列表

- **路径**: `/activities`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 10 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "古建筑知识竞赛",
        "description": "参与答题赢积分",
        "startDate": "2024-06-01T00:00:00Z",
        "endDate": "2024-06-30T23:59:59Z",
        "participants": 5200,
        "image": "/images/activity1.jpg"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

### 获取活动详情

- **路径**: `/activities/{id}`
- **方法**: GET
- **认证**: 可选
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 活动ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "古建筑知识竞赛",
    "description": "参与答题赢积分",
    "rules": "每日答题获得积分...",
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-06-30T23:59:59Z",
    "participants": 5200,
    "prizes": ["一等奖: 1000积分", "二等奖: 500积分"],
    "image": "/images/activity1.jpg"
  }
}
```

### 获取成就列表

- **路径**: `/activities/achievements`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "初出茅庐", "description": "完成第一次答题", "icon": "🌟", "points": 10},
    {"id": 2, "name": "持之以恒", "description": "连续打卡7天", "icon": "🔥", "points": 50},
    {"id": 3, "name": "完美答题", "description": "连续答对10题", "icon": "💯", "points": 100}
  ]
}
```

### 获取用户成就

- **路径**: `/activities/user-achievements`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "unlocked": [1, 2],
    "locked": [3],
    "progress": {
      "3": {"current": 5, "target": 10}
    }
  }
}
```

### 获取每日任务

- **路径**: `/activities/daily-tasks`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "每日登录", "description": "登录平台", "points": 10, "completed": true},
    {"id": 2, "name": "答题挑战", "description": "完成5道题", "points": 20, "completed": false, "progress": {"current": 3, "target": 5}},
    {"id": 3, "name": "浏览建筑", "description": "浏览3个古建筑", "points": 15, "completed": false}
  ]
}
```

### 参加活动

- **路径**: `/activities/{id}/join`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 活动ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": "已成功参加活动"
}
```

---

## 知识库API

### 获取知识库列表

- **路径**: `/knowledge`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `category` | string | 否 | - | 分类 |
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 20 | 每页数量 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "斗拱结构原理",
        "category": "structure",
        "summary": "斗拱是中国古代建筑中特有的结构构件...",
        "viewCount": 5000,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 200,
    "page": 1,
    "limit": 20
  }
}
```

### 获取单个知识

- **路径**: `/knowledge/{id}`
- **方法**: GET
- **认证**: 可选
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 知识ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "斗拱结构原理",
    "category": "structure",
    "content": "斗拱是中国古代建筑中特有的结构构件...",
    "relatedTopics": [2, 3, 5],
    "viewCount": 5000,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 搜索知识

- **路径**: `/knowledge/search/query`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `q` | string | 是 | - | 搜索关键词 |
| `limit` | number | 否 | 10 | 数量限制 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": 1, "title": "斗拱结构原理", "relevance": 0.95},
    {"id": 2, "title": "唐代斗拱特征", "relevance": 0.88}
  ]
}
```

### 获取分类列表

- **路径**: `/knowledge/categories`
- **方法**: GET
- **认证**: 可选
- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"id": "structure", "name": "建筑结构", "count": 50},
    {"id": "history", "name": "历史文化", "count": 40},
    {"id": "materials", "name": "建筑材料", "count": 30}
  ]
}
```

---

## 管理员API

### 获取仪表盘

- **路径**: `/admin/dashboard`
- **方法**: GET
- **认证**: 需要管理员权限
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "totalUsers": 50000,
    "activeUsers": 320,
    "newUsersToday": 50,
    "totalBuildings": 500,
    "totalModels": 2000,
    "totalTopics": 1500,
    "pendingReviews": 15,
    "systemStatus": "healthy"
  }
}
```

### 获取用户列表

- **路径**: `/admin/users`
- **方法**: GET
- **认证**: 需要管理员权限
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码 |
| `limit` | number | 否 | 20 | 每页数量 |
| `search` | string | 否 | - | 搜索关键词 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50000,
    "page": 1,
    "limit": 20
  }
}
```

### 更新用户

- **路径**: `/admin/users/{id}`
- **方法**: PUT
- **认证**: 需要管理员权限
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 用户ID |

- **请求体**:

```json
{
  "username": "string (可选)",
  "email": "string (可选)",
  "role": "string (可选)",
  "status": "string (可选)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": "用户信息已更新"
}
```

### 删除用户

- **路径**: `/admin/users/{id}`
- **方法**: DELETE
- **认证**: 需要管理员权限
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 用户ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": "用户已删除"
}
```

### 用户禁言管理

- **路径**: `/admin/users/{id}/mute`
- **方法**: PUT
- **认证**: 需要管理员权限
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 用户ID |

- **请求体**:

```json
{
  "is_muted": "boolean (必填)",
  "mute_reason": "string (可选)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": "用户禁言状态已更新"
}
```

### 古建筑管理

| 操作 | 路径 | 方法 | 认证 |
|------|------|------|------|
| 获取列表 | `/admin/architectures` | GET | 管理员 |
| 创建 | `/admin/architectures` | POST | 管理员 |
| 更新 | `/admin/architectures/{id}` | PUT | 管理员 |
| 删除 | `/admin/architectures/{id}` | DELETE | 管理员 |

### 题库管理

| 操作 | 路径 | 方法 | 认证 |
|------|------|------|------|
| 获取列表 | `/admin/questions` | GET | 管理员 |
| 创建 | `/admin/questions` | POST | 管理员 |
| 更新 | `/admin/questions/{id}` | PUT | 管理员 |
| 删除 | `/admin/questions/{id}` | DELETE | 管理员 |

### AI配置管理

| 操作 | 路径 | 方法 | 认证 |
|------|------|------|------|
| 获取列表 | `/admin/ai-configs` | GET | 管理员 |
| 创建 | `/admin/ai-configs` | POST | 管理员 |
| 更新 | `/admin/ai-configs/{id}` | PUT | 管理员 |
| 删除 | `/admin/ai-configs/{id}` | DELETE | 管理员 |

### 活动管理

| 操作 | 路径 | 方法 | 认证 |
|------|------|------|------|
| 获取列表 | `/admin/activities` | GET | 管理员 |
| 创建 | `/admin/activities` | POST | 管理员 |
| 更新 | `/admin/activities/{id}` | PUT | 管理员 |
| 删除 | `/admin/activities/{id}` | DELETE | 管理员 |

### 每日挑战管理

| 操作 | 路径 | 方法 | 认证 |
|------|------|------|------|
| 获取列表 | `/admin/daily-challenges` | GET | 管理员 |
| 创建 | `/admin/daily-challenges` | POST | 管理员 |
| 更新 | `/admin/daily-challenges/{id}` | PUT | 管理员 |
| 删除 | `/admin/daily-challenges/{id}` | DELETE | 管理员 |

---

## 国际化API

### 获取语言列表

- **路径**: `/i18n/languages`
- **方法**: GET
- **认证**: 可选
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `active_only` | boolean | 否 | true | 是否仅获取活跃语言 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": [
    {"code": "zh", "name": "中文", "nativeName": "中文"},
    {"code": "en", "name": "English", "nativeName": "English"}
  ]
}
```

### 获取翻译

- **路径**: `/i18n/translate/{entityType}/{entityId}`
- **方法**: GET
- **认证**: 可选
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `entityType` | string | 实体类型 |
| `entityId` | number | 实体ID |

- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `lang` | string | 否 | en | 目标语言 |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "name": "East Main Hall of Foguang Temple",
    "description": "One of the earliest wooden structures in China..."
  }
}
```

### 批量获取翻译

- **路径**: `/i18n/translate/batch`
- **方法**: POST
- **认证**: 可选
- **请求体**:

```json
{
  "entityType": "string (必填)",
  "entityIds": "array (必填)",
  "language": "string (可选，默认en)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "1": {"name": "Translation 1"},
    "2": {"name": "Translation 2"}
  }
}
```

---

## 监控API

### 性能监控

- **路径**: `/monitor/performance`
- **方法**: GET
- **认证**: 需要管理员权限
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "responseTime": {"p50": 45, "p90": 80, "p99": 150},
    "throughput": {"requestsPerSecond": 100, "concurrentUsers": 200},
    "cache": {"hitRate": 75, "size": 850},
    "memory": {"used": 80, "free": 120, "utilization": 40}
  }
}
```

### 安全统计

- **路径**: `/monitor/security-stats`
- **方法**: GET
- **认证**: 需要管理员权限
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "sqlInjectionAttempts": 0,
    "rateLimitHits": 5,
    "authFailures": 10,
    "blockedRequests": 2,
    "securityScore": 95
  }
}
```

---

## 健康检查

### 检查服务状态

- **路径**: `/health`
- **方法**: GET
- **认证**: 无需
- **成功响应** (200):

```json
{
  "status": "ok",
  "timestamp": "2024-06-19T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "ai": "healthy"
  }
}
```

---

## 错误码表

| 错误码 | 含义 | HTTP状态码 |
|--------|------|-----------|
| `AUTH_001` | 用户不存在或密码错误 | 401 |
| `AUTH_002` | 密码错误 | 401 |
| `AUTH_003` | 未提供认证令牌 | 401 |
| `AUTH_004` | 令牌已过期或无效 | 401 |
| `AUTH_005` | 权限不足 | 403 |
| `AUTH_006` | 用户已被禁用 | 403 |
| `MUTE_001` | 用户已被禁言 | 403 |
| `VALID_001` | 参数验证失败 | 400 |
| `VALID_002` | 请求体格式错误 | 400 |
| `VALID_003` | 文件大小超过限制 | 400 |
| `VALID_004` | 不支持的文件类型 | 400 |
| `DB_001` | 数据库操作失败 | 500 |
| `DB_002` | 数据不存在 | 404 |
| `DB_003` | 数据重复 | 409 |
| `AI_001` | AI服务不可用 | 503 |
| `AI_002` | AI服务超时 | 504 |
| `RATE_001` | 请求过于频繁 | 429 |
| `RATE_002` | 登录尝试次数过多 | 429 |
| `SEC_001` | SQL注入检测 | 400 |
| `SEC_002` | 非法路径访问 | 400 |
| `SEC_003` | 不支持的HTTP方法 | 405 |
| `FILE_001` | 文件上传失败 | 500 |
| `FILE_002` | 文件不存在 | 404 |

---

## 3D交互工具API

### 获取测量工具状态

- **路径**: `/tools/measure/status`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "isEnabled": true,
    "mode": "distance",
    "units": "meter",
    "precision": 2
  }
}
```

### 设置测量工具模式

- **路径**: `/tools/measure/settings`
- **方法**: PUT
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "mode": "string (必填，distance/angle/area)",
  "units": "string (可选，meter/feet)",
  "precision": "number (可选，默认2)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": "测量工具设置已更新"
}
```

### 获取吸附引擎状态

- **路径**: `/tools/snap/status`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "isEnabled": true,
    "snapDistance": 0.5,
    "snapTypes": ["endpoint", "midpoint", "vertex", "grid"],
    "mortiseTenonSnap": true
  }
}
```

### 设置吸附引擎配置

- **路径**: `/tools/snap/settings`
- **方法**: PUT
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "isEnabled": "boolean (可选)",
  "snapDistance": "number (可选，吸附距离)",
  "snapTypes": "array (可选，吸附类型列表)",
  "mortiseTenonSnap": "boolean (可选，榫卯吸附)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": "吸附引擎配置已更新"
}
```

### 获取选择状态

- **路径**: `/tools/selection/status`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "selectedIds": [1, 2, 3],
    "transformMode": "translate",
    "pivotMode": "center"
  }
}
```

### 批量选择

- **路径**: `/tools/selection/batch`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **请求体**:

```json
{
  "ids": "array (必填，构件ID列表)",
  "mode": "string (可选，add/remove/replace，默认replace)"
}
```

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "selectedIds": [1, 2, 3, 4],
    "count": 4
  }
}
```

### 清空选择

- **路径**: `/tools/selection/clear`
- **方法**: POST
- **认证**: 需要（Bearer Token）
- **成功响应** (200):

```json
{
  "success": true,
  "data": "选择已清空"
}
```

---

## 模型导出API

### 导出模型为GLB

- **路径**: `/models/{id}/export/glb`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 模型ID |

- **成功响应** (200):
  - Content-Type: `model/gltf-binary`
  - 返回GLB二进制文件

### 导出模型为JSON

- **路径**: `/models/{id}/export/json`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 模型ID |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "name": "模型名称",
    "components": [
      {"type": "column", "position": {"x": 0, "y": 0, "z": 0}, "rotation": {"x": 0, "y": 0, "z": 0}, "scale": {"x": 1, "y": 1, "z": 1}}
    ],
    "metadata": {"createdAt": "2024-06-19T10:00:00Z", "version": "1.0"}
  }
}
```

### 导出模型为图片

- **路径**: `/models/{id}/export/image`
- **方法**: GET
- **认证**: 需要（Bearer Token）
- **路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | number | 模型ID |

- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `width` | number | 否 | 1920 | 图片宽度 |
| `height` | number | 否 | 1080 | 图片高度 |
| `format` | string | 否 | png | 图片格式(png/jpeg/webp) |

- **成功响应** (200):
  - Content-Type: `image/png` (或对应格式)
  - 返回图片二进制文件

---

## 统计与分析API

### 获取用户活跃度统计

- **路径**: `/analytics/user-activity`
- **方法**: GET
- **认证**: 需要管理员权限
- **查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `startDate` | string | 否 | 7天前 | 开始日期(YYYY-MM-DD) |
| `endDate` | string | 否 | 今天 | 结束日期(YYYY-MM-DD) |

- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "totalUsers": 50000,
    "activeUsers": 3200,
    "newUsers": 500,
    "returningUsers": 2700,
    "avgSessionDuration": 15.5,
    "dailyActiveUsers": [2800, 3200, 3500, 3100, 2900, 2600, 2400],
    "weeklyActiveUsers": 12000,
    "monthlyActiveUsers": 35000
  }
}
```

### 获取内容消费统计

- **路径**: `/analytics/content-consumption`
- **方法**: GET
- **认证**: 需要管理员权限
- **成功响应** (200):

```json
{
  "success": true,
  "data": {
    "totalViews": 1250000,
    "totalModelsCreated": 2000,
    "totalQuizAttempts": 50000,
    "totalComments": 25000,
    "totalLikes": 89000,
    "topContent": [
      {"id": 1, "type": "building", "views": 50000, "title": "佛光寺东大殿"},
      {"id": 2, "type": "model", "views": 25000, "title": "唐代宫殿"}
    ]
  }
}
```

---

## 开发环境注意事项

1. **跨域配置**: 开发环境允许 `http://localhost:3000`, `http://localhost:3100`, `http://localhost:5173`
2. **Mock模式**: 设置环境变量 `USE_MOCK=true` 可启用Mock数据模式
3. **API文档**: 访问 `/api-docs` 查看Swagger文档
4. **健康检查**: 访问 `/health` 检查服务状态
5. **调试模式**: 设置环境变量 `DEBUG=true` 可启用详细日志输出