# P99 响应时间超过 2 秒排查指南

## 📋 问题概述

P99 响应时间超过 2 秒意味着 **99% 的请求都能在 2 秒内完成，但有 1% 的请求响应时间超过 2 秒**。这通常表示系统存在偶发性性能瓶颈。

---

## 🔍 排查优先级

### 第一优先级：数据库查询日志

#### 1. 检查慢查询日志

```bash
# MSSQL 查询慢查询
SELECT 
    qs.execution_count,
    qs.total_elapsed_time / qs.execution_count as avg_elapsed_time_ms,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1, 
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) as query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qs.total_elapsed_time / qs.execution_count > 2000  -- 超过2秒
ORDER BY avg_elapsed_time_ms DESC;
```

#### 2. 检查数据库连接池状态

```bash
# 查看连接池使用情况
SELECT 
    DB_NAME(dbid) as database_name,
    COUNT(*) as connection_count,
    SUM(CASE WHEN status = 'sleeping' THEN 1 ELSE 0 END) as sleeping_connections,
    SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running_connections
FROM sys.sysprocesses
GROUP BY DB_NAME(dbid);
```

#### 3. 检查数据库锁等待

```bash
# 查看锁等待情况
SELECT 
    request_session_id,
    resource_type,
    resource_database_id,
    resource_associated_entity_id,
    request_mode,
    request_status,
    wait_time_ms
FROM sys.dm_tran_locks
WHERE request_status = 'WAIT';
```

---

### 第二优先级：服务器日志

#### 1. 检查 Express 应用日志

```bash
# 查看 Express 日志文件
tail -f logs/app.log | grep -E "(error|timeout|slow)"

# 或使用 grep 搜索慢请求
grep "response-time > 2000" logs/app.log
```

#### 2. 检查 Morgan 日志（请求日志）

```bash
# 查看响应时间超过 2 秒的请求
grep -E "response-time: [2-9][0-9]{3,}" logs/access.log

# 统计慢请求分布
awk '{print $7}' logs/access.log | grep "response-time" | sort | uniq -c
```

#### 3. 检查错误日志

```bash
# 查看最近的错误
tail -100 logs/error.log

# 搜索特定错误类型
grep -E "(ECONNREFUSED|ETIMEDOUT|ENOMEM)" logs/error.log
```

---

### 第三优先级：系统资源监控

#### 1. CPU 使用情况

```bash
# 实时监控 CPU
top -p $(pgrep -f "node.*main.js")

# 或使用 htop（更直观）
htop -p $(pgrep -f "node")
```

#### 2. 内存使用情况

```bash
# 查看内存使用
free -h

# 查看 Node.js 进程内存
ps aux | grep node

# 使用 Node.js 内置监控
node --inspect dist/main.js
# 然后在 Chrome DevTools 中查看内存使用
```

#### 3. 网络连接状态

```bash
# 查看网络连接数
netstat -an | grep :5000 | wc -l

# 查看 TCP 连接状态分布
netstat -an | grep :5000 | awk '{print $6}' | sort | uniq -c

# 查看网络流量
iftop -i eth0
```

---

## 🎯 具体排查步骤

### 步骤 1：定位慢请求端点

```bash
# 分析测试报告中的慢请求分布
cat performance-report-production-*.json | jq '.results.serverMetrics[] | select(.responseTime > 2000)'
```

**关键指标**：
- 哪个端点响应最慢？
- 慢请求集中在什么时间段？
- 是否有特定的请求参数导致慢响应？

---

### 步骤 2：检查数据库查询缓存命中率

```bash
# 查看缓存统计
curl http://localhost:5000/api/monitor/cache-stats

# 或直接查看日志
grep "cache hit" logs/app.log | wc -l
grep "cache miss" logs/app.log | wc -l
```

**判断标准**：
- 缓存命中率 < 50%：需要优化缓存策略
- 缓存命中率 > 80%：缓存工作正常，问题在其他地方

---

### 步骤 3：检查客户端状态管理

```bash
# 查看客户端状态统计
curl http://localhost:5000/api/monitor/client-states

# 查看内存清理日志
grep "客户端状态清理" logs/app.log
```

**关键指标**：
- 客户端状态数量是否过多？
- 内存清理是否正常执行？
- 是否有内存泄漏迹象？

---

### 步骤 4：检查并发连接数

```bash
# 查看当前连接数
ss -s | grep TCP

# 查看数据库连接池状态
curl http://localhost:5000/api/monitor/db-pool-status
```

**判断标准**：
- 连接数接近上限：需要增加连接池大小
- 连接数正常：问题可能在查询效率

---

## 📊 关键日志文件位置

### 后端日志

| 日志类型 | 文件位置 | 内容 |
|---------|---------|------|
| **应用日志** | `logs/app.log` | 应用运行日志 |
| **访问日志** | `logs/access.log` | HTTP请求日志（Morgan） |
| **错误日志** | `logs/error.log` | 错误和异常日志 |
| **数据库日志** | `logs/db.log` | 数据库连接和查询日志 |

### 系统日志

| 日志类型 | 文件位置 | 内容 |
|---------|---------|------|
| **系统日志** | `/var/log/syslog` | 系统运行日志 |
| **Nginx日志** | `/var/log/nginx/access.log` | Nginx访问日志 |
| **Nginx错误** | `/var/log/nginx/error.log` | Nginx错误日志 |

---

## 🛠️ 常见问题诊断

### 问题 1：数据库查询慢

**症状**：
- P99 响应时间集中在数据库查询端点
- 缓存命中率低
- 数据库连接数高

**排查命令**：
```bash
# 1. 查看慢查询
SELECT * FROM sys.dm_exec_query_stats WHERE total_elapsed_time > 2000;

# 2. 查看缺失索引
SELECT 
    OBJECT_NAME(object_id) as table_name,
    equality_columns,
    inequality_columns,
    included_columns
FROM sys.dm_db_missing_index_details;

# 3. 查看索引使用情况
SELECT 
    OBJECT_NAME(i.object_id) as table_name,
    i.name as index_name,
    user_seeks,
    user_scans,
    user_lookups
FROM sys.dm_db_index_usage_stats s
JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id;
```

**解决方案**：
- 添加缺失的索引
- 优化查询语句
- 增加查询缓存 TTL
- 使用批量查询减少数据库访问

---

### 问题 2：内存泄漏

**症状**：
- 内存使用持续增长
- 客户端状态数量过多
- 系统响应逐渐变慢

**排查命令**：
```bash
# 1. 查看内存增长趋势
ps aux | grep node | awk '{print $6}' | tee memory-history.txt

# 2. 查看客户端状态数量
curl http://localhost:5000/api/monitor/client-states | jq '.totalCount'

# 3. 查看内存清理日志
grep "清理" logs/app.log | tail -20
```

**解决方案**：
- 手动触发内存清理：`curl -X POST http://localhost:5000/api/monitor/cleanup`
- 减小 `MAX_CLIENT_STATES` 配置
- 缩短 `IDLE_TIMEOUT` 时间
- 增加清理频率

---

### 问题 3：连接池耗尽

**症状**：
- 请求超时错误增多
- 数据库连接数达到上限
- 系统并发处理能力下降

**排查命令**：
```bash
# 1. 查看连接池状态
SELECT COUNT(*) FROM sys.sysprocesses WHERE DB_NAME(dbid) = 'your_database';

# 2. 查看等待连接的请求
SELECT * FROM sys.dm_exec_requests WHERE status = 'running' AND wait_type IS NOT NULL;

# 3. 查看连接超时日志
grep "connection timeout" logs/error.log
```

**解决方案**：
- 增加连接池最大连接数
- 缩短连接空闲超时时间
- 使用连接复用策略
- 实施请求排队机制

---

### 问题 4：网络延迟

**症状**：
- 响应时间波动大
- 特定时间段响应慢
- 外部 API 调用超时

**排查命令**：
```bash
# 1. 测试网络延迟
ping -c 100 your-database-server | tail -5

# 2. 查看网络流量
iftop -i eth0 -n

# 3. 查看网络错误
netstat -s | grep -E "(failed|timeout|dropped)"
```

**解决方案**：
- 优化网络配置
- 使用 CDN 加速静态资源
- 增加请求超时时间
- 实施请求重试机制

---

## 📈 性能分析工具

### 1. Node.js 内置分析

```bash
# 启动 Node.js 性能分析
node --inspect dist/main.js

# 在 Chrome DevTools 中：
# 1. 打开 chrome://inspect
# 2. 点击 "Inspect"
# 3. 使用 Performance 和 Memory 标签页分析
```

### 2. 使用 Clinic.js

```bash
# 安装 Clinic.js
npm install -g clinic

# 运行性能分析
clinic doctor -- on-port 'autocannon -c 100 -d 30 localhost:5000' -- node dist/main.js

# 查看结果
clinic doctor -- visualize clinic-doctor.html
```

### 3. 使用 autocannon

```bash
# 安装 autocannon
npm install -g autocannon

# 运行压力测试
autocannon -c 100 -d 30 -p 10 localhost:5000

# 输出详细统计
autocannon -c 100 -d 30 -p 10 -j localhost:5000 > results.json
```

---

## 🔧 快速诊断脚本

创建一个快速诊断脚本：

```bash
#!/bin/bash
# 文件: diagnose-p99.sh

echo "=== P99 响应时间诊断 ==="
echo ""

echo "1. 检查慢请求日志..."
grep "response-time > 2000" logs/access.log | tail -10

echo ""
echo "2. 检查数据库连接数..."
curl -s http://localhost:5000/api/monitor/db-status

echo ""
echo "3. 检查客户端状态..."
curl -s http://localhost:5000/api/monitor/client-states

echo ""
echo "4. 检查缓存命中率..."
curl -s http://localhost:5000/api/monitor/cache-stats

echo ""
echo "5. 检查系统资源..."
echo "CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}')"
echo "内存: $(free -h | grep Mem | awk '{print $3}')"
echo "连接数: $(netstat -an | grep :5000 | wc -l)"

echo ""
echo "=== 诊断完成 ==="
```

使用方法：
```bash
chmod +x diagnose-p99.sh
./diagnose-p99.sh
```

---

## 📋 排查清单

### 立即检查（5分钟内）

- [ ] 查看测试报告中的慢请求分布
- [ ] 检查数据库慢查询日志
- [ ] 查看缓存命中率
- [ ] 检查客户端状态数量

### 深入分析（30分钟内）

- [ ] 分析数据库索引使用情况
- [ ] 检查数据库连接池状态
- [ ] 查看网络连接和延迟
- [ ] 分析内存使用趋势

### 长期优化（持续监控）

- [ ] 建立性能基线
- [ ] 设置自动告警
- [ ] 定期性能测试
- [ ] 持续优化查询

---

## 🎯 总结

当 P99 响应时间超过 2 秒时，按以下优先级排查：

1. **数据库查询**（最常见原因）
   - 检查慢查询日志
   - 分析索引使用情况
   - 查看缓存命中率

2. **服务器资源**（次要原因）
   - CPU 使用率
   - 内存占用
   - 网络连接数

3. **应用日志**（辅助诊断）
   - 错误日志
   - 访问日志
   - 性能监控日志

4. **系统配置**（优化方向）
   - 连接池大小
   - 缓存策略
   - 内存管理

---

**文档版本**: 1.0.0  
**最后更新**: 2026-06-19  
**维护者**: ATCA Development Team