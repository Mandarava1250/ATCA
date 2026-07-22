# 筑见山河 - 高并发性能测试指南

## 概述

本文档详细介绍筑见山河项目的性能测试方法论、测试场景和工具使用指南，帮助开发团队进行系统性的性能评估。

---

## 测试架构

```
┌──────────────────────────────────────────────────────────────────┐
│                     性能测试架构                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    HTTP    ┌─────────────────────────────┐    │
│  │  测试工具    │ ─────────→ │         负载均衡器          │    │
│  │ (k6/Artillery)│           └────────────┬────────────────┘    │
│  └──────────────┘                        │                      │
│                                          │                      │
│                        ┌─────────────────┼─────────────────┐    │
│                        │                 │                 │    │
│                        ▼                 ▼                 ▼    │
│                  ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│                  │  后端1   │    │  后端2   │    │  后端3   │   │
│                  └────┬─────┘    └────┬─────┘    └────┬─────┘   │
│                       │               │               │        │
│                       └───────────────┼───────────────┘        │
│                                       │                        │
│                                       ▼                        │
│                               ┌──────────────┐                 │
│                               │   数据库    │                 │
│                               └──────────────┘                 │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 测试工具

### 推荐工具列表

| 工具 | 类型 | 用途 |
|------|------|------|
| **k6** | 负载测试 | 高并发压测 |
| **Artillery** | 负载测试 | 场景化测试 |
| **cURL** | 接口测试 | 单接口验证 |
| **Chrome DevTools** | 前端性能 | 首屏加载分析 |
| **Lighthouse** | 性能审计 | 综合性能评分 |
| **New Relic** | APM | 生产环境监控 |

---

## 测试场景

### 场景1：首页加载性能

**测试目标**: 评估首页首屏加载时间

**测试步骤**:
1. 清空浏览器缓存
2. 访问首页
3. 记录关键指标

**关键指标**:
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- TTI (Time to Interactive)

```bash
# 使用 Lighthouse 测试
lighthouse https://atca.xin --view --preset=performance
```

### 场景2：API 接口性能

**测试目标**: 评估 API 接口响应时间和并发处理能力

**测试配置** (k6):

```javascript
// tests/api-performance.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // 30秒内增加到100并发
    { duration: '1m', target: 100 },  // 维持100并发1分钟
    { duration: '30s', target: 200 }, // 增加到200并发
    { duration: '1m', target: 200 },  // 维持200并发1分钟
    { duration: '30s', target: 0 },   // 逐渐停止
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get('https://api.atca.xin/v1/architecture');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### 场景3：数据库查询性能

**测试目标**: 评估数据库查询响应时间

**测试配置**:

```javascript
// tests/database-performance.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 50,
  duration: '1m',
};

export default function () {
  // 测试复杂查询
  const response = http.get('https://api.atca.xin/v1/architecture/search?q=唐代');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'query time < 300ms': (r) => r.timings.duration < 300,
  });
  
  sleep(0.5);
}
```

### 场景4：AI 助手响应性能

**测试目标**: 评估 AI 助手对话响应时间

**测试配置**:

```javascript
// tests/ai-assistant-performance.js
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 10 },
  ],
};

export default function () {
  const payload = JSON.stringify({
    message: '斗拱的作用是什么？',
    ai_id: 1,
    enhancedCheck: true
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + __ENV.API_TOKEN,
    },
  };
  
  const response = http.post('https://api.atca.xin/v1/assistant/chat', payload, params);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'AI response time < 3s': (r) => r.timings.duration < 3000,
  });
  
  sleep(2);
}
```

### 场景5：3D 模型加载性能

**测试目标**: 评估 3D 模型加载和渲染性能

**测试步骤**:
1. 打开 3D 编辑器页面
2. 加载预设模型
3. 记录加载时间和帧率

**关键指标**:
- 模型加载时间
- 首帧渲染时间
- 平均帧率 (FPS)
- GPU 内存占用

---

## 测试执行

### 1. 安装 k6

```bash
# macOS
brew install k6

# Linux
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows
choco install k6
```

### 2. 运行测试

```bash
# 运行单个测试
k6 run tests/api-performance.js

# 运行测试并输出报告
k6 run tests/api-performance.js --out json=results.json

# 运行测试并发送到 New Relic
k6 run tests/api-performance.js --out newrelic

# 指定环境变量
API_TOKEN=abc123 k6 run tests/ai-assistant-performance.js
```

### 3. 分布式测试

```bash
# 启动主节点
k6 coordinator --address localhost:5678

# 启动从节点
k6 agent --coordinator http://localhost:5678

# 运行分布式测试
k6 run --coordinator http://localhost:5678 tests/api-performance.js
```

---

## 测试结果分析

### 结果报告

```javascript
// k6 输出示例
✓ status is 200
✓ response time < 500ms

     data_received..................: 12 MB  120 kB/s
     data_sent......................: 1.2 MB 12 kB/s
     http_req_blocked...............: avg=1.23ms  min=1.01ms  med=1.15ms  max=5.32ms  p(90)=1.56ms  p(95)=2.34ms
     http_req_connecting............: avg=0.87ms  min=0.72ms  med=0.81ms  max=4.12ms  p(90)=1.12ms  p(95)=1.87ms
     http_req_duration..............: avg=123.45ms min=89.12ms med=115.67ms max=456.78ms p(90)=189.34ms p(95)=234.56ms
     http_req_failed................: 0.00%  ✓ 0        ✗ 1200
     http_req_receiving.............: avg=2.34ms  min=1.87ms  med=2.12ms  max=8.91ms  p(90)=3.45ms  p(95)=4.56ms
     http_req_sending...............: avg=0.56ms  min=0.41ms  med=0.51ms  max=2.34ms  p(90)=0.78ms  p(95)=0.98ms
     http_req_tls_handshaking.......: avg=0.00ms  min=0.00ms  med=0.00ms  max=0.00ms  p(90)=0.00ms  p(95)=0.00ms
     http_req_waiting...............: avg=120.55ms min=86.78ms med=112.34ms max=452.12ms p(90)=185.67ms p(95)=230.12ms
     http_reqs......................: 1200   12/s
     iteration_duration.............: avg=1.12s   min=1.01s   med=1.08s   max=1.56s   p(90)=1.23s   p(95)=1.34s
     iterations.....................: 1200   12/s
     vus............................: 100    min=100    max=100
     vus_max........................: 100    min=100    max=100
```

### 关键指标解读

| 指标 | 说明 | 阈值建议 |
|------|------|----------|
| `http_req_duration` | 请求总耗时 | P95 < 500ms |
| `http_req_waiting` | 服务器响应时间 | P95 < 400ms |
| `http_req_failed` | 请求失败率 | < 1% |
| `vus` | 并发用户数 | 根据业务需求 |
| `iterations` | 迭代次数 | 测试总次数 |

---

## 性能调优流程

```
性能测试 → 分析瓶颈 → 实施优化 → 验证效果 → 回归测试
```

### 常见瓶颈及优化方案

| 瓶颈类型 | 表现 | 优化方案 |
|----------|------|----------|
| **数据库慢查询** | P99响应时间高 | 添加索引、优化SQL、缓存查询 |
| **内存不足** | 服务器频繁GC | 增加内存、优化内存使用 |
| **连接池耗尽** | 大量连接等待 | 增加连接池大小、连接复用 |
| **前端资源过大** | 首屏加载慢 | 代码分割、资源压缩、CDN加速 |
| **网络延迟** | 请求耗时高 | 使用CDN、就近接入、压缩传输 |

---

## 测试环境配置

### 环境隔离

```bash
# 测试环境配置
export NODE_ENV=test
export DB_HOST=test-db.atca.xin
export REDIS_URL=redis://test-redis.atca.xin:6379
```

### 数据准备

```bash
# 生成测试数据
npm run generate-test-data -- --count 10000

# 初始化测试环境
npm run setup-test-env
```

---

## 持续性能监控

### 集成到 CI/CD

```yaml
# .github/workflows/performance-test.yml
name: Performance Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: |
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6
      
      - name: Run performance tests
        run: k6 run tests/api-performance.js
```