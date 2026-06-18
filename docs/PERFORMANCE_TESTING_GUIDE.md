# 高并发性能测试指南

## 📋 概述

本项目包含完整的高并发性能测试套件，用于验证系统在模拟大量用户同时访问时的性能表现。

## 🎯 测试目标

1. **模拟100+并发用户** 同时访问网站核心页面
2. **记录关键性能指标**：
   - 页面首次加载时间 (FCP)
   - 数据渲染完成时间
   - 页面交互响应时间 (FID)
   - API 响应时间
3. **监控服务器资源**：
   - CPU 利用率
   - 内存占用
   - 网络带宽

## 🚀 快速开始

### 前置条件

1. 确保后端服务正在运行
2. Node.js >= 18.0.0

### 启动后端服务

```bash
# 开发环境
npm run dev

# 或生产环境
npm run build
npm start
```

### 运行性能测试

#### 1. 本地测试（50并发用户，30秒）

```bash
npm run test:load:local
```

#### 2. 生产环境测试（100并发用户，60秒）

```bash
npm run test:load:production
```

#### 3. 极限压力测试（200并发用户，60秒）

```bash
npm run test:load:stress
```

## 📊 测试配置

### 测试类型

#### 本地测试 (local)
```typescript
{
  baseUrl: 'http://localhost:5000',
  endpoints: [
    '/api/v1/index/featured',
    '/api/v1/architecture/list',
    '/api/v1/knowledge/categories',
    '/api/v1/activity/list',
  ],
  concurrentUsers: 50,
  durationSeconds: 30,
  serverMetricsInterval: 1000,
}
```

#### 生产环境测试 (production)
```typescript
{
  baseUrl: 'https://atca.xin',
  endpoints: [
    '/api/v1/index/featured',
    '/api/v1/architecture/list',
    '/api/v1/knowledge/categories',
  ],
  concurrentUsers: 100,
  durationSeconds: 60,
  serverMetricsInterval: 2000,
}
```

#### 极限测试 (stress)
```typescript
{
  baseUrl: 'http://localhost:5000',
  endpoints: [
    '/api/v1/index/featured',
    '/api/v1/architecture/list',
    '/api/v1/knowledge/categories',
    '/api/v1/activity/list',
    '/api/v1/architecture/detail',
  ],
  concurrentUsers: 200,
  durationSeconds: 60,
  serverMetricsInterval: 1000,
}
```

## 📈 性能指标评估标准

### 响应时间标准

| 指标 | 优秀 | 良好 | 需优化 | 不合格 |
|------|------|------|--------|--------|
| **平均响应时间** | < 500ms | < 1000ms | < 2000ms | ≥ 2000ms |
| **P50响应时间** | < 300ms | < 600ms | < 1000ms | ≥ 1000ms |
| **P90响应时间** | < 1000ms | < 2000ms | < 3000ms | ≥ 3000ms |
| **P99响应时间** | < 2000ms | < 3000ms | < 5000ms | ≥ 5000ms |

### 成功率标准

| 指标 | 合格 | 不合格 |
|------|------|--------|
| **成功率** | ≥ 95% | < 95% |

### 服务器资源标准

| 资源 | 优秀 | 良好 | 需优化 | 危险 |
|------|------|------|--------|------|
| **CPU使用率** | < 50% | < 70% | < 85% | ≥ 85% |
| **内存使用率** | < 50% | < 70% | < 85% | ≥ 90% |

### 前端性能标准

| 指标 | 优秀 | 良好 | 需优化 |
|------|------|------|--------|
| **FCP** | < 1000ms | < 1800ms | < 3000ms |
| **LCP** | < 1500ms | < 2500ms | < 4000ms |
| **FID** | < 50ms | < 100ms | < 300ms |
| **CLS** | < 0.05 | < 0.1 | < 0.25 |

## 📝 测试报告示例

```
═══════════════════════════════════════════════════════════════
                      📊 性能测试报告
═══════════════════════════════════════════════════════════════

📈 请求统计:
   总请求数:      2450
   成功请求:      2420 (98.78%)
   失败请求:      30 (1.22%)
   测试时长:      30s
   QPS:           81.67 req/s

⏱️  响应时间统计:
   平均响应:      856.23ms
   最小响应:      45ms
   最大响应:      2890ms
   P50 (中位数):  720ms
   P90:           1450ms
   P99:           2100ms

🔍 性能评估:
   ✅ 平均响应时间: 856.23ms
   ✅ P99响应时间: 2100ms
   ✅ 成功率: 98.78%
   ✅ CPU使用率正常: 45.67%
   ✅ 内存使用率正常: 62.34%

═══════════════════════════════════════════════════════════════
                    ✅ 测试通过 - 所有指标达标
═══════════════════════════════════════════════════════════════
```

## 🛠️ 优化建议

### 如果出现性能问题，系统会提供针对性的优化建议：

#### 1. 响应时间过长
```bash
💡 优化建议:
   → 考虑启用或增强数据库查询缓存
   → 优化数据库索引和查询语句
   → 增加服务器缓存策略
   → 考虑使用CDN加速静态资源
```

#### 2. 服务器资源过高
```bash
💡 优化建议:
   → 考虑水平扩展服务器数量
   → 优化内存使用，减少对象创建
   → 使用连接池复用数据库连接
```

#### 3. 请求成功率低
```bash
💡 优化建议:
   → 检查服务器日志定位失败原因
   → 增加超时时间和重试机制
   → 检查网络连接和防火墙设置
```

## 🔧 自定义测试配置

### 修改测试端点

编辑 `backend/src/tests/performance/loadTest.ts` 中的 `TEST_CONFIG`：

```typescript
export const TEST_CONFIG = {
  production: {
    baseUrl: 'https://your-domain.com',
    endpoints: [
      '/api/v1/index/featured',
      '/api/v1/architecture/list',
      '/api/v1/knowledge/categories',
      // 添加更多端点...
    ],
    concurrentUsers: 100,  // 调整并发数
    durationSeconds: 60,   // 调整测试时长
    serverMetricsInterval: 2000,
  },
};
```

### 编写自定义测试

```typescript
import { runLoadTest, printResults, TEST_CONFIG } from './src/tests/performance/loadTest';

async function customTest() {
  const config = {
    baseUrl: 'http://localhost:5000',
    endpoints: [
      '/api/v1/your-endpoint',
    ],
    concurrentUsers: 150,
    durationSeconds: 60,
    serverMetricsInterval: 1000,
  };

  const results = await runLoadTest(config);
  const { passed, issues } = printResults(results);

  if (!passed) {
    console.log('需要优化:', issues);
  }
}

customTest();
```

## 📄 查看详细报告

测试完成后，会在项目根目录生成 JSON 格式的详细报告：

```bash
# 报告文件命名格式
performance-report-{testType}-{timestamp}.json

# 示例
performance-report-local-1718000000000.json
```

### 报告内容

```json
{
  "testConfig": {
    "baseUrl": "http://localhost:5000",
    "concurrentUsers": 50,
    "durationSeconds": 30
  },
  "results": {
    "totalRequests": 2450,
    "successfulRequests": 2420,
    "failedRequests": 30,
    "averageResponseTime": 856.23,
    "p99ResponseTime": 2100,
    "requestsPerSecond": 81.67
  },
  "timestamp": "2024-06-19T12:00:00.000Z"
}
```

## 🎓 测试最佳实践

### 1. 测试环境准备
- 在隔离的测试环境中运行，避免影响生产环境
- 确保测试数据与生产数据相似
- 关闭不必要的应用程序以获得准确的资源监控

### 2. 测试执行策略
```bash
# 推荐测试顺序:
1. 先运行本地测试 (npm run test:load:local)
2. 通过后再运行生产环境测试 (npm run test:load:production)
3. 最后进行极限测试 (npm run test:load:stress)
```

### 3. 结果分析
- 关注 P95 和 P99 指标，而非仅平均值
- 检查是否有性能退化趋势
- 对比不同版本的测试结果

### 4. 性能基线
建议建立性能基线并定期测试：

```bash
# 创建基线测试
npm run test:load:production > baseline-results.txt

# 后续版本对比
npm run test:load:production > new-results.txt
diff baseline-results.txt new-results.txt
```

## 🔍 常见问题排查

### 问题：测试运行缓慢
**原因**: 网络延迟过高或服务器响应慢
**解决**: 检查网络连接，增加预热时间

### 问题：服务器资源显示为 0
**原因**: 监控间隔过长或服务器未启动
**解决**: 减小 `serverMetricsInterval`，确认服务运行

### 问题：大量请求超时
**原因**: 服务器处理能力不足或网络瓶颈
**解决**: 
- 优化服务器配置
- 增加缓存
- 使用负载均衡

### 问题：内存持续增长
**原因**: 内存泄漏
**解决**:
- 检查客户端状态管理
- 增加内存清理频率
- 使用连接池

## 📚 参考资源

### Web 性能
- [Google Web Vitals](https://web.dev/vitals/)
- [MDN Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

### 性能测试工具
- [k6](https://k6.io/)
- [Artillery](https://artillery.io/)
- [Locust](https://locust.io/)

## 📞 获取帮助

如遇问题，请检查：
1. 后端服务是否正常运行
2. Node.js 版本是否 >= 18.0.0
3. 测试端点是否正确配置
4. 网络连接是否正常

---

**文档版本**: 1.0.0  
**最后更新**: 2026-06-19  
**维护者**: ATCA Development Team
