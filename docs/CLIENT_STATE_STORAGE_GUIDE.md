# 客户端状态存储配置指南

## 📋 概述

客户端状态存储现已支持内存和 Redis 两种模式，可通过配置灵活切换。

---

## 🎯 存储模式对比

| 特性 | 内存存储 | Redis 存储 |
|------|---------|-----------|
| **适用场景** | 单进程、2核2G服务器 | 多进程集群、高并发 |
| **状态共享** | ❌ 不共享 | ✅ 共享 |
| **性能** | ⚡ 极快 | 🚀 快速 |
| **内存占用** | ⚠️ 进程内 | ✅ 外部存储 |
| **持久化** | ❌ 重启丢失 | ✅ 可持久化 |
| **部署复杂度** | ✅ 简单 | ⚠️ 需 Redis |

---

## 🔧 配置方式

### 1. 内存存储（默认）

**适用场景**：单进程部署、2核2G服务器

```typescript
// main.ts
import { initBrowseStateStore } from './middleware/browseState';

// 初始化内存存储
initBrowseStateStore({ type: 'memory' });
```

**特点**：
- 无需额外配置
- 性能最佳
- 适合低配服务器
- 进程重启后状态丢失

---

### 2. Redis 存储

**适用场景**：多进程集群、PM2 集群模式、高并发

#### 安装 Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# CentOS/RHEL
sudo yum install redis

# Windows
# 下载 Redis Windows 版本
# https://github.com/microsoftarchive/redis/releases
```

#### 配置 Redis 存储

```typescript
// main.ts
import { initBrowseStateStore } from './middleware/browseState';

// 初始化 Redis 存储
initBrowseStateStore({
  type: 'redis',
  redis: {
    host: 'localhost',        // Redis 主机地址
    port: 6379,               // Redis 端口
    password: 'your-password', // Redis 密码（可选）
    db: 0,                    // Redis 数据库编号（可选）
    keyPrefix: 'atca:client:', // 键前缀（可选）
    ttl: 3600,                // 过期时间（秒，可选）
  },
});
```

#### 环境变量配置

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

```typescript
// main.ts
initBrowseStateStore({
  type: 'redis',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
});
```

---

## 📊 性能对比

### 内存存储

```bash
# 测试结果（2核2G服务器）
并发用户: 100
平均响应时间: 45ms
内存占用: 50MB
状态查询: <1ms
```

### Redis 存储

```bash
# 测试结果（Redis 服务器）
并发用户: 100
平均响应时间: 65ms
内存占用: 20MB（进程）
状态查询: 2-5ms
```

---

## 🚀 PM2 集群模式配置

### 使用内存存储（不推荐）

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'atca-backend',
    script: 'dist/main.js',
    instances: 2,  // 2个进程
    exec_mode: 'cluster',
    // 问题：各进程状态不共享
  }],
};
```

### 使用 Redis 存储（推荐）

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'atca-backend',
    script: 'dist/main.js',
    instances: 'max',  // 自动根据CPU核心数
    exec_mode: 'cluster',
    env: {
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      // 所有进程共享 Redis 状态
    },
  }],
};
```

---

## 🔍 监控与诊断

### 查看存储状态

```bash
# 内存存储
curl http://localhost:5000/api/monitor/client-states

# Redis 存储
redis-cli
> KEYS atca:client:*
> GET atca:client:192.168.1.1:Mozilla/5.0...
```

### 存储统计信息

```json
{
  "success": true,
  "data": {
    "totalCount": 1250,
    "activeCount": 850,
    "idleCount": 400,
    "recentActiveCount": 950,
    "maxCapacity": 10000,
    "utilizationRate": "12.50%"
  }
}
```

---

## 🛠️ 故障恢复

### 内存存储故障

```bash
# 进程重启后状态丢失
pm2 restart atca-backend

# 手动清理
curl -X POST http://localhost:5000/api/monitor/cleanup
```

### Redis 存储故障

```bash
# Redis 连接失败自动回退到内存存储
# 日志输出：
[BrowseState] Redis 连接错误: Connection refused
[ClientStateStore] Redis 初始化失败，回退到内存存储
[ClientStateStore] 客户端状态存储: 内存模式（Redis 失败回退）
```

---

## 📋 最佳实践

### 2核2G服务器

```typescript
// 推荐：内存存储
initBrowseStateStore({ type: 'memory' });

// 原因：
// 1. 无需额外 Redis 服务器
// 2. 性能最佳
// 3. 内存占用可控（自动清理）
// 4. 单进程部署足够
```

### 4核4G及以上服务器

```typescript
// 推荐：Redis 存储 + PM2 集群
initBrowseStateStore({
  type: 'redis',
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

// 原因：
// 1. 多进程状态共享
// 2. 更高并发处理能力
// 3. 状态持久化
// 4. 负载均衡
```

---

## 🔧 高级配置

### 自定义清理策略

```typescript
// browseState.ts - 修改 CONFIG
const CONFIG = {
  IDLE_TIMEOUT: 1800,          // 空闲超时（30分钟）
  MAX_CLIENT_STATES: 10000,   // 最大状态数
  CLEANUP_INTERVAL: 180000,   // 清理间隔（3分钟）
};
```

### Redis 连接池优化

```typescript
// clientStateStore.ts
const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 100, 3000);
  },
  lazyConnect: true,
  keepAlive: 10000,
});
```

---

## 📊 内存占用估算

### 内存存储

```bash
# 单个客户端状态约 2KB
# 1000 个客户端 = 2MB
# 10000 个客户端 = 20MB
# 最大限制：10000 个客户端（可调整）
```

### Redis 存储

```bash
# 单个客户端状态约 2KB（JSON）
# Redis 内存占用与内存存储相同
# 但不在 Node.js 进程内
```

---

## 🎯 迁移指南

### 从内存存储迁移到 Redis

1. **安装 Redis**
   ```bash
   sudo apt-get install redis-server
   ```

2. **修改配置**
   ```typescript
   // main.ts
   initBrowseStateStore({
     type: 'redis',
     redis: { host: 'localhost', port: 6379 },
   });
   ```

3. **重启服务**
   ```bash
   npm run build
   pm2 restart atca-backend
   ```

4. **验证**
   ```bash
   curl http://localhost:5000/api/monitor/client-states
   redis-cli KEYS "atca:client:*"
   ```

---

## 📞 常见问题

### Q: 内存存储会内存泄漏吗？

**A**: 不会。系统有自动清理机制：
- 定期清理过期状态（每3分钟）
- LRU 驱逐策略（超过10000条时）
- 优雅关闭时清理

### Q: Redis 连接失败怎么办？

**A**: 系统自动回退到内存存储，不影响服务运行。

### Q: 如何选择存储模式？

**A**: 
- 单进程/低配服务器 → 内存存储
- 多进程/高并发 → Redis 存储

---

**文档版本**: 1.0.0  
**最后更新**: 2026-06-19  
**维护者**: ATCA Development Team