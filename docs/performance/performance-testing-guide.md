# 高并发性能测试指南

## 📋 概述

本指南提供系统化的性能测试方法，帮助评估系统在高并发场景下的表现，确保服务质量。

---

## 🎯 测试目标

### 性能指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **P50响应时间** | < 50ms | 50%请求响应时间 |
| **P90响应时间** | < 100ms | 90%请求响应时间 |
| **P99响应时间** | < 150ms | 99%请求响应时间 |
| **吞吐量** | > 100 req/s | 每秒处理请求数 |
| **并发用户** | > 100 | 同时在线用户数 |
| **错误率** | < 1% | 请求失败率 |

---

## 🚀 测试工具

### 1. 内置测试套件

**位置**: [backend/src/tests/performance/loadTest.ts](../../backend/src/tests/performance/loadTest.ts)

**特点**:
- 结构化日志输出
- HTML报告生成
- 实时性能监控
- 多场景测试

**运行方法**:
```bash
cd backend
npm run test:performance
```

### 2. 外部测试工具

#### Apache Bench (ab)

```bash
# 安装
sudo apt-get install apache2-utils

# 测试100并发用户
ab -n 1000 -c 100 http://localhost:5000/api/v1/architecture

# 测试结果分析
ab -n 1000 -c 100 -g output.tsv http://localhost:5000/api/v1/architecture
```

#### wrk

```bash
# 安装
sudo apt-get install wrk

# 测试30秒，12线程，100并发
wrk -t12 -c100 -d30s http://localhost:5000/api/v1/architecture

# 测试结果
wrk -t12 -c100 -d30s --latency http://localhost:5000/api/v1/architecture
```

---

## 📊 测试场景

### 场景1：建筑列表查询

**测试目标**: 评估建筑列表API在高并发下的表现

**测试配置**:
```typescript
const testConfig = {
  url: '/api/v1/architecture',
  method: 'GET',
  concurrentUsers: 100,
  duration: 30000,  // 30秒
  rampUp: 5000,     // 5秒逐步增加
};
```

**预期结果**:
```json
{
  "p50": 45ms,
  "p90": 80ms,
  "p99": 150ms,
  "throughput": 120 req/s,
  "errorRate": 0.5%
}
```

---

### 场景2：建筑详情查询

**测试目标**: 评估建筑详情API在高并发下的表现

**测试配置**:
```typescript
const testConfig = {
  url: '/api/v1/architecture/:id',
  method: 'GET',
  concurrentUsers: 50,
  duration: 30000,
};
```

**预期结果**:
```json
{
  "p50": 35ms,
  "p90": 65ms,
  "p99": 120ms,
  "throughput": 80 req/s,
  "errorRate": 0.3%
}
```

---

### 场景3：用户登录

**测试目标**: 评估登录API在高并发下的表现和限流效果

**测试配置**:
```typescript
const testConfig = {
  url: '/api/v1/auth/login',
  method: 'POST',
  concurrentUsers: 20,
  duration: 60000,  // 60秒
  body: {
    username: 'testuser',
    password: 'testpass',
  },
};
```

**预期结果**:
```json
{
  "p50": 65ms,
  "p90": 120ms,
  "p99": 200ms,
  "throughput": 30 req/s,
  "errorRate": 2%  // 包含限流拦截
}
```

---

### 场景4：AI聊天

**测试目标**: 评估AI聊天API在高并发下的表现和降级策略

**测试配置**:
```typescript
const testConfig = {
  url: '/api/v1/assistant/chat',
  method: 'POST',
  concurrentUsers: 10,
  duration: 60000,
  body: {
    message: '测试消息',
  },
};
```

**预期结果**:
```json
{
  "p50": 180ms,
  "p90": 350ms,
  "p99": 500ms,
  "throughput": 15 req/s,
  "errorRate": 1%  // 包含超时降级
}
```

---

### 场景5：混合场景测试

**测试目标**: 模拟真实用户行为，测试多种API混合场景

**测试配置**:
```typescript
const mixedScenario = {
  scenarios: [
    { url: '/api/v1/architecture', weight: 40, users: 40 },
    { url: '/api/v1/architecture/:id', weight: 30, users: 30 },
    { url: '/api/v1/auth/login', weight: 10, users: 10 },
    { url: '/api/v1/assistant/chat', weight: 20, users: 20 },
  ],
  totalUsers: 100,
  duration: 60000,
};
```

**预期结果**:
```json
{
  "overall": {
    "p50": 60ms,
    "p90": 120ms,
    "p99": 180ms,
    "throughput": 100 req/s,
    "errorRate": 1%
  },
  "breakdown": {
    "architecture": { "p99": 150ms },
    "architecture/:id": { "p99": 120ms },
    "auth/login": { "p99": 200ms },
    "assistant/chat": { "p99": 500ms },
  }
}
```

---

## 🔧 测试执行步骤

### 第一步：环境准备

```bash
# 1. 启动后端服务
cd backend
npm run dev

# 2. 确认服务状态
curl http://localhost:5000/health

# 3. 检查系统资源
curl http://localhost:5000/api/monitor/memory-stats
```

---

### 第二步：运行测试

#### 使用内置测试套件

```bash
# 运行完整测试套件
npm run test:performance

# 运行特定场景
npm run test:performance -- --scenario=architecture-list

# 查看实时日志
tail -f performance.log
```

#### 使用外部工具

```bash
# 使用Apache Bench
ab -n 1000 -c 100 http://localhost:5000/api/v1/architecture

# 使用wrk
wrk -t12 -c100 -d30s http://localhost:5000/api/v1/architecture
```

---

### 第三步：分析结果

#### 1. 查看HTML报告

```bash
# 打开性能测试报告
open performance-report.html

# 或使用浏览器查看
firefox performance-report.html
```

#### 2. 分析性能指标

```bash
# 查看性能摘要
grep "Performance Summary" performance.log

# 查看P99指标
grep "P99" performance.log

# 查看错误率
grep "Error Rate" performance.log
```

#### 3. 检查系统资源

```bash
# 查看内存使用
curl http://localhost:5000/api/monitor/memory-stats

# 查看缓存命中率
curl http://localhost:5000/api/monitor/cache-stats

# 查看客户端状态
curl http://localhost:5000/api/monitor/client-states
```

---

## 📊 性能基准

### 2核2G服务器基准

| 测试场景 | P50 | P90 | P99 | 吞吐量 | 并发用户 |
|----------|-----|-----|-----|--------|----------|
| 建筑列表 | 45ms | 80ms | 150ms | 120 req/s | 100 |
| 建筑详情 | 35ms | 65ms | 120ms | 80 req/s | 50 |
| 用户登录 | 65ms | 120ms | 200ms | 30 req/s | 20 |
| AI聊天 | 180ms | 350ms | 500ms | 15 req/s | 10 |
| 混合场景 | 60ms | 120ms | 180ms | 100 req/s | 100 |

### 4核4G服务器基准

| 测试场景 | P50 | P90 | P99 | 吞吐量 | 并发用户 |
|----------|-----|-----|-----|--------|----------|
| 建筑列表 | 30ms | 60ms | 100ms | 200 req/s | 200 |
| 建筑详情 | 25ms | 50ms | 90ms | 150 req/s | 100 |
| 用户登录 | 50ms | 100ms | 150ms | 50 req/s | 40 |
| AI聊天 | 150ms | 300ms | 450ms | 25 req/s | 20 |
| 混合场景 | 45ms | 90ms | 140ms | 180 req/s | 200 |

---

## 🐛 性能问题诊断

### 问题1：P99响应时间过高

**诊断步骤**:
```bash
# 1. 查看慢请求日志
grep "responseTime>200" performance.log

# 2. 分析慢请求类型
grep "responseTime>200" performance.log | \
  awk '{print $5}' | sort | uniq -c

# 3. 检查数据库查询
grep "slow query" database.log
```

**解决方案**: 参考 [P99诊断指南](p99-diagnosis-guide.md)

---

### 问题2：吞吐量不足

**诊断步骤**:
```bash
# 1. 检查并发连接数
netstat -an | grep :5000 | wc -l

# 2. 检查系统资源
top
iostat -x 1

# 3. 检查后端进程数
ps aux | grep node
```

**解决方案**:
```bash
# 1. 增加worker进程数
pm2 scale atca-backend 4

# 2. 优化数据库连接池
# config/database.ts
const poolConfig = {
  max: 20,  // 增加连接池大小
  min: 5,
};
```

---

### 问题3：错误率过高

**诊断步骤**:
```bash
# 1. 查看错误日志
grep "ERROR" performance.log

# 2. 分析错误类型
grep "ERROR" performance.log | \
  awk '{print $6}' | sort | uniq -c

# 3. 检查限流日志
grep "Rate limit" performance.log
```

**解决方案**:
```bash
# 1. 调整限流阈值
# middleware/rateLimiter.ts
const MAX_ATTEMPTS = 10;  // 增加尝试次数

# 2. 优化错误处理
# middleware/errorHandler.ts
app.use(errorHandler);
```

---

## 🎯 性能优化建议

### 1. 针对2核2G服务器

**优化策略**:
- 使用内存存储而非Redis
- 限制最大并发用户数（100）
- 启用查询缓存和响应压缩
- 定期清理过期数据

**配置示例**:
```typescript
// browseState.ts
const CONFIG = {
  MAX_CLIENT_STATES: 5000,
  IDLE_TIMEOUT: 900,
};

// queryCache.ts
const DEFAULT_CONFIG = {
  maxSize: 1000,
  ttl: 300,
};
```

---

### 2. 针对4核4G服务器

**优化策略**:
- 使用Redis存储实现状态共享
- 支持更高并发用户数（200）
- 启用PM2集群模式
- 实现分布式缓存

**配置示例**:
```bash
# PM2集群配置
pm2 start dist/main.js -i max

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 📝 测试报告模板

### 性能测试报告

```markdown
# 性能测试报告

## 测试环境
- 服务器配置: 2核2G
- 测试时间: 2026-06-19 10:00
- 测试工具: 内置测试套件

## 测试结果

### 建筑列表查询
- P50: 45ms ✅
- P90: 80ms ✅
- P99: 150ms ✅
- 吞吐量: 120 req/s ✅
- 错误率: 0.5% ✅

### 建筑详情查询
- P50: 35ms ✅
- P90: 65ms ✅
- P99: 120ms ✅
- 吞吐量: 80 req/s ✅
- 错误率: 0.3% ✅

### 用户登录
- P50: 65ms ✅
- P90: 120ms ✅
- P99: 200ms ⚠️ (接近阈值)
- 吞吐量: 30 req/s ✅
- 错误率: 2% ⚠️ (包含限流)

### AI聊天
- P50: 180ms ⚠️
- P90: 350ms ⚠️
- P99: 500ms ⚠️
- 吞吐量: 15 req/s ⚠️
- 错误率: 1% ✅

## 总体评估
- 性能等级: 良好
- 建议优化: AI聊天响应时间

## 优化建议
1. 实现AI响应缓存
2. 增加AI服务超时时间
3. 实现降级策略
```

---

## 📞 常见问题

### Q: 如何选择测试工具？

**A**: 
- **内置测试套件**: 功能完整，报告详细
- **Apache Bench**: 简单快速，适合基础测试
- **wrk**: 高性能，适合压力测试

### Q: 测试结果如何解读？

**A**: 
- **P50**: 关注大多数用户体验
- **P90**: 关注较好用户体验
- **P99**: 关注最慢用户体验（关键指标）
- **吞吐量**: 关注系统处理能力
- **错误率**: 关注系统稳定性

### Q: 性能不达标怎么办？

**A**: 
1. 参考 [P99诊断指南](p99-diagnosis-guide.md)
2. 参考 [实现总结](implementation-summary.md)
3. 根据服务器配置调整优化策略

---

**文档版本**: 1.0.0  
**最后更新**: 2026-06-19  
**维护者**: ATCA Development Team