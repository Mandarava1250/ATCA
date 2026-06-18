// ============================================
// 华夏营造 - 高并发性能测试套件
// 模拟100+并发用户，测试系统性能表现
// 支持结构化日志输出和HTML报告生成
// ============================================

import http from 'http';
import https from 'https';
import { performance, PerformanceObserver } from 'perf_hooks';
import { cpus, totalmem, freemem } from 'os';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// 日志工具 - 结构化日志输出
// ============================================
interface LogEntry {
  timestamp: string;
  operation: string;
  duration?: number;
  metrics?: {
    memory?: number;
    cpu?: number;
    fps?: number;
    responseTime?: number;
  };
  status: 'START' | 'SUCCESS' | 'FAIL' | 'INFO' | 'WARN';
  message?: string;
}

class PerformanceLogger {
  private logs: LogEntry[] = [];
  private operationStartTimes: Map<string, number> = new Map();

  // 记录日志
  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const fullEntry: LogEntry = {
      timestamp: this.getTimestamp(),
      ...entry,
    };
    this.logs.push(fullEntry);
    this.printLog(fullEntry);
  }

  // 开始操作
  start(operation: string, message?: string): void {
    this.operationStartTimes.set(operation, Date.now());
    this.log({
      operation,
      status: 'START',
      message,
    });
  }

  // 结束操作
  end(operation: string, status: 'SUCCESS' | 'FAIL' = 'SUCCESS', metrics?: LogEntry['metrics']): void {
    const startTime = this.operationStartTimes.get(operation);
    const duration = startTime ? Date.now() - startTime : 0;
    this.operationStartTimes.delete(operation);

    this.log({
      operation,
      duration,
      metrics,
      status,
      message: status === 'SUCCESS' ? `完成` : `失败`,
    });
  }

  // 信息日志
  info(operation: string, message: string, metrics?: LogEntry['metrics']): void {
    this.log({
      operation,
      status: 'INFO',
      message,
      metrics,
    });
  }

  // 警告日志
  warn(operation: string, message: string): void {
    this.log({
      operation,
      status: 'WARN',
      message,
    });
  }

  // 获取带毫秒的精确时间戳
  private getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(3, '0');
    return `${now.toISOString().replace('T', ' ').replace('Z', '')}`;
  }

  // 打印日志到控制台
  private printLog(entry: LogEntry): void {
    const statusIcon = {
      'START': '🔄',
      'SUCCESS': '✅',
      'FAIL': '❌',
      'INFO': 'ℹ️',
      'WARN': '⚠️',
    }[entry.status];

    const metricsStr = entry.metrics
      ? `| 内存: ${entry.metrics.memory?.toFixed(0) || '-'}MB  CPU: ${entry.metrics.cpu?.toFixed(1) || '-'}%`
      : '';

    const durationStr = entry.duration !== undefined
      ? `| 耗时: ${entry.duration}ms`
      : '';

    console.log(
      `[${entry.timestamp}] ${statusIcon} [${entry.operation}] ${entry.message || ''} ${metricsStr} ${durationStr}`
    );
  }

  // 导出所有日志
  getLogs(): LogEntry[] {
    return this.logs;
  }

  // 清除日志
  clear(): void {
    this.logs = [];
    this.operationStartTimes.clear();
  }
}

const logger = new PerformanceLogger();

// ============================================
// 性能指标收集器
// ============================================
interface Metrics {
  timestamp: number;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  endpoint?: string;
  userId?: number;
}

interface ServerMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  freeMemory: number;
}

interface TestResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p90ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  serverMetrics: ServerMetrics[];
  duration: number;
  logs: LogEntry[];
  testType: string;
  timestamp: string;
}

// 全局指标存储
const metrics: Metrics[] = [];
const serverMetricsHistory: ServerMetrics[] = [];
let testStartTime = 0;
let testEndTime = 0;

// ============================================
// 服务器资源监控
// ============================================
function getServerMetrics(): ServerMetrics {
  const cpuLoad = cpus().map(cpu => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return ((total - idle) / total) * 100;
  });

  const avgCpuUsage = cpuLoad.reduce((a, b) => a + b, 0) / cpuLoad.length;
  const memUsage = ((totalmem() - freemem()) / totalmem()) * 100;

  return {
    timestamp: Date.now(),
    cpuUsage: parseFloat(avgCpuUsage.toFixed(2)),
    memoryUsage: parseFloat(memUsage.toFixed(2)),
    freeMemory: Math.round(freemem() / 1024 / 1024), // MB
  };
}

// ============================================
// HTTP请求封装
// ============================================
function makeRequest(
  url: string,
  method: string = 'GET',
  userId?: number,
  endpoint?: string
): Promise<{ time: number; status: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.request(url, { method }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          time: responseTime,
          status: res.statusCode || 0,
          error: res.statusCode && res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
        });
      });
    });

    req.on('error', (err) => {
      const responseTime = Date.now() - startTime;
      resolve({
        time: responseTime,
        status: 0,
        error: err.message,
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        time: Date.now() - startTime,
        status: 0,
        error: 'Request timeout',
      });
    });

    req.end();
  });
}

// ============================================
// 单个虚拟用户模拟
// ============================================
async function simulateUser(
  userId: number,
  baseUrl: string,
  endpoints: string[],
  duration: number,
  progressCallback?: (completed: number, total: number) => void
): Promise<void> {
  const startTime = Date.now();
  let requestCount = 0;
  const maxRequests = Math.floor(duration / 1000) * 2; // 估算每秒2个请求

  while (Date.now() - startTime < duration) {
    const requestStartTime = Date.now();

    // 随机选择端点
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const url = `${baseUrl}${endpoint}`;

    // 添加随机参数模拟真实用户
    const finalUrl = `${url}?userId=${userId}&ts=${Date.now()}`;

    // 记录请求开始
    logger.start(`HTTP_REQUEST`, `用户${userId} 请求 ${endpoint}`);

    const result = await makeRequest(finalUrl, 'GET', userId, endpoint);

    // 记录请求完成
    logger.end(
      `HTTP_REQUEST`,
      result.error === undefined ? 'SUCCESS' : 'FAIL',
      {
        responseTime: result.time,
        cpu: getServerMetrics().cpuUsage,
        memory: getServerMetrics().freeMemory,
      }
    );

    metrics.push({
      timestamp: Date.now(),
      responseTime: result.time,
      statusCode: result.status,
      success: result.error === undefined,
      error: result.error,
      endpoint,
      userId,
    });

    requestCount++;

    // 更新进度
    if (progressCallback) {
      progressCallback(requestCount, maxRequests);
    }

    // 模拟用户思考时间（0.5-2秒）
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
  }
}

// ============================================
// 性能指标计算
// ============================================
function calculateResults(testType: string): TestResults {
  const successfulMetrics = metrics.filter(m => m.success);
  const responseTimes = successfulMetrics.map(m => m.responseTime).sort((a, b) => a - b);

  const totalRequests = metrics.length;
  const successfulRequests = successfulMetrics.length;
  const failedRequests = totalRequests - successfulRequests;

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  const p50Index = Math.floor(responseTimes.length * 0.5);
  const p90Index = Math.floor(responseTimes.length * 0.9);
  const p99Index = Math.floor(responseTimes.length * 0.99);

  const duration = (testEndTime - testStartTime) / 1000;
  const requestsPerSecond = totalRequests / duration;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
    minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
    maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    p50ResponseTime: responseTimes.length > 0 ? responseTimes[p50Index] || 0 : 0,
    p90ResponseTime: responseTimes.length > 0 ? responseTimes[p90Index] || 0 : 0,
    p99ResponseTime: responseTimes.length > 0 ? responseTimes[p99Index] || 0 : 0,
    requestsPerSecond: parseFloat(requestsPerSecond.toFixed(2)),
    serverMetrics: serverMetricsHistory,
    duration: parseFloat(duration.toFixed(2)),
    logs: logger.getLogs(),
    testType,
    timestamp: new Date().toISOString(),
  };
}

// ============================================
// HTML报告生成器
// ============================================
function generateHTMLReport(results: TestResults): string {
  const successRate = results.totalRequests > 0
    ? ((results.successfulRequests / results.totalRequests) * 100).toFixed(2)
    : '0';

  const avgCpu = results.serverMetrics.length > 0
    ? (results.serverMetrics.reduce((a, b) => a + b.cpuUsage, 0) / results.serverMetrics.length).toFixed(2)
    : '0';

  const maxCpu = results.serverMetrics.length > 0
    ? Math.max(...results.serverMetrics.map(m => m.cpuUsage)).toFixed(2)
    : '0';

  const avgMemory = results.serverMetrics.length > 0
    ? (results.serverMetrics.reduce((a, b) => a + b.memoryUsage, 0) / results.serverMetrics.length).toFixed(2)
    : '0';

  const maxMemory = results.serverMetrics.length > 0
    ? Math.max(...results.serverMetrics.map(m => m.memoryUsage)).toFixed(2)
    : '0';

  // 生成CPU图表数据
  const cpuChartData = results.serverMetrics.map((m, i) =>
    `{ x: ${i}, y: ${m.cpuUsage.toFixed(2)} }`
  ).join(', ');

  // 生成内存图表数据
  const memoryChartData = results.serverMetrics.map((m, i) =>
    `{ x: ${i}, y: ${m.memoryUsage.toFixed(2)} }`
  ).join(', ');

  // 生成响应时间分布
  const responseTimeDistribution = [
    { label: '< 100ms', count: metrics.filter(m => m.responseTime < 100).length },
    { label: '100-300ms', count: metrics.filter(m => m.responseTime >= 100 && m.responseTime < 300).length },
    { label: '300-500ms', count: metrics.filter(m => m.responseTime >= 300 && m.responseTime < 500).length },
    { label: '500-1000ms', count: metrics.filter(m => m.responseTime >= 500 && m.responseTime < 1000).length },
    { label: '1-2s', count: metrics.filter(m => m.responseTime >= 1000 && m.responseTime < 2000).length },
    { label: '> 2s', count: metrics.filter(m => m.responseTime >= 2000).length },
  ];

  // 判断测试结果
  const passed = results.averageResponseTime < 2000 &&
    results.p99ResponseTime < 5000 &&
    parseFloat(successRate) >= 95;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>华夏营造 - 性能测试报告 - ${results.testType}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            color: white;
            padding: 30px 0;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        .card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #333;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 1.2em;
        }
        .status-pass {
            background: #4caf50;
            color: white;
        }
        .status-fail {
            background: #f44336;
            color: white;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .metric-card.success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .metric-card.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .metric-card.danger {
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .chart-container {
            height: 250px;
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .log-table {
            max-height: 400px;
            overflow-y: auto;
        }
        .log-entry {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.85em;
        }
        .log-start { color: #2196f3; }
        .log-success { color: #4caf50; }
        .log-fail { color: #f44336; }
        .log-warn { color: #ff9800; }
        .log-info { color: #9e9e9e; }
        .distribution-bar {
            display: flex;
            height: 30px;
            border-radius: 8px;
            overflow: hidden;
            margin: 10px 0;
        }
        .distribution-segment {
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8em;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            color: white;
            padding: 20px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ 华夏营造 - 性能测试报告</h1>
            <p>测试类型: ${results.testType} | 测试时间: ${new Date(results.timestamp).toLocaleString('zh-CN')}</p>
            <p style="margin-top: 15px;">
                <span class="status-badge ${passed ? 'status-pass' : 'status-fail'}">
                    ${passed ? '✅ 测试通过' : '❌ 测试未通过'}
                </span>
            </p>
        </div>

        <div class="card">
            <h2>📊 测试配置</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${results.totalRequests}</div>
                    <div class="metric-label">总请求数</div>
                </div>
                <div class="metric-card success">
                    <div class="metric-value">${successRate}%</div>
                    <div class="metric-label">成功率</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${results.duration}s</div>
                    <div class="metric-label">测试时长</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${results.requestsPerSecond}</div>
                    <div class="metric-label">QPS</div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>⏱️ 响应时间统计</h2>
            <div class="metrics-grid">
                <div class="metric-card ${results.averageResponseTime < 500 ? 'success' : results.averageResponseTime < 2000 ? 'warning' : 'danger'}">
                    <div class="metric-value">${results.averageResponseTime}ms</div>
                    <div class="metric-label">平均响应时间</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${results.minResponseTime}ms</div>
                    <div class="metric-label">最小响应时间</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${results.maxResponseTime}ms</div>
                    <div class="metric-label">最大响应时间</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${results.p50ResponseTime}ms</div>
                    <div class="metric-label">P50 (中位数)</div>
                </div>
                <div class="metric-card ${results.p90ResponseTime < 2000 ? 'success' : 'warning'}">
                    <div class="metric-value">${results.p90ResponseTime}ms</div>
                    <div class="metric-label">P90</div>
                </div>
                <div class="metric-card ${results.p99ResponseTime < 3000 ? 'success' : results.p99ResponseTime < 5000 ? 'warning' : 'danger'}">
                    <div class="metric-value">${results.p99ResponseTime}ms</div>
                    <div class="metric-label">P99</div>
                </div>
            </div>

            <h3 style="margin-top: 30px; color: #333;">📈 响应时间分布</h3>
            <div class="distribution-bar">
                ${responseTimeDistribution.map((d, i) => {
                  const percentage = results.totalRequests > 0 ? (d.count / results.totalRequests * 100) : 0;
                  const colors = ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ff9800', '#f44336'];
                  return percentage > 0 ? `<div class="distribution-segment" style="width: ${percentage}%; background: ${colors[i]}">${percentage.toFixed(1)}%</div>` : '';
                }).join('')}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px;">
                ${responseTimeDistribution.map((d, i) => {
                  const colors = ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ff9800', '#f44336'];
                  return `<span style="display: flex; align-items: center; gap: 5px;">
                      <span style="width: 12px; height: 12px; background: ${colors[i]}; border-radius: 2px;"></span>
                      ${d.label}: ${d.count} 请求
                  </span>`;
                }).join('')}
            </div>
        </div>

        <div class="card">
            <h2>🖥️ 服务器资源使用</h2>
            <div class="metrics-grid">
                <div class="metric-card ${parseFloat(avgCpu) < 50 ? 'success' : parseFloat(avgCpu) < 80 ? 'warning' : 'danger'}">
                    <div class="metric-value">${avgCpu}%</div>
                    <div class="metric-label">CPU 平均使用率</div>
                </div>
                <div class="metric-card ${parseFloat(maxCpu) < 70 ? 'success' : parseFloat(maxCpu) < 90 ? 'warning' : 'danger'}">
                    <div class="metric-value">${maxCpu}%</div>
                    <div class="metric-label">CPU 峰值</div>
                </div>
                <div class="metric-card ${parseFloat(avgMemory) < 60 ? 'success' : parseFloat(avgMemory) < 80 ? 'warning' : 'danger'}">
                    <div class="metric-value">${avgMemory}%</div>
                    <div class="metric-label">内存 平均使用率</div>
                </div>
                <div class="metric-card ${parseFloat(maxMemory) < 70 ? 'success' : parseFloat(maxMemory) < 85 ? 'warning' : 'danger'}">
                    <div class="metric-value">${maxMemory}%</div>
                    <div class="metric-label">内存 峰值</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div>
                    <h4 style="color: #333; margin-bottom: 10px;">CPU 使用率趋势</h4>
                    <canvas id="cpuChart" height="150"></canvas>
                </div>
                <div>
                    <h4 style="color: #333; margin-bottom: 10px;">内存 使用率趋势</h4>
                    <canvas id="memoryChart" height="150"></canvas>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>📋 性能日志</h2>
            <p style="color: #666; margin-bottom: 15px;">共 ${results.logs.length} 条日志记录</p>
            <div class="log-table">
                <table>
                    <thead>
                        <tr>
                            <th>时间戳</th>
                            <th>操作</th>
                            <th>状态</th>
                            <th>耗时</th>
                            <th>消息</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.logs.slice(-100).map(log => `
                            <tr class="log-entry">
                                <td>${log.timestamp}</td>
                                <td>[${log.operation}]</td>
                                <td class="log-${log.status.toLowerCase()}">${log.status}</td>
                                <td>${log.duration ? log.duration + 'ms' : '-'}</td>
                                <td>${log.message || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <h2>📁 原始数据</h2>
            <p style="color: #666; margin-bottom: 15px;">JSON 格式的完整测试数据</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.85em;">${JSON.stringify({
              testConfig: {
                testType: results.testType,
                timestamp: results.timestamp,
              },
              summary: {
                totalRequests: results.totalRequests,
                successfulRequests: results.successfulRequests,
                failedRequests: results.failedRequests,
                successRate: successRate + '%',
                averageResponseTime: results.averageResponseTime + 'ms',
                p50ResponseTime: results.p50ResponseTime + 'ms',
                p90ResponseTime: results.p90ResponseTime + 'ms',
                p99ResponseTime: results.p99ResponseTime + 'ms',
                requestsPerSecond: results.requestsPerSecond,
                duration: results.duration + 's',
                avgCpuUsage: avgCpu + '%',
                maxCpuUsage: maxCpu + '%',
                avgMemoryUsage: avgMemory + '%',
                maxMemoryUsage: maxMemory + '%',
              }
            }, null, 2)}</pre>
        </div>

        <div class="footer">
            <p>🏛️ 华夏营造 - 中国古代建筑文化传承平台</p>
            <p>性能测试报告生成时间: ${new Date().toLocaleString('zh-CN')}</p>
            <p style="margin-top: 10px; font-size: 0.9em;">
                评估标准: 平均响应 < 2s | P99 < 5s | 成功率 ≥ 95%
            </p>
        </div>
    </div>

    <script>
        // 简单的图表绘制（使用 Canvas）
        function drawChart(canvasId, data, color, label) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');
            const width = canvas.parentElement.offsetWidth;
            const height = 150;
            canvas.width = width;
            canvas.height = height;

            if (data.length === 0) return;

            const maxY = Math.max(...data.map(d => d.y)) * 1.2;
            const padding = 30;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;

            // 绘制网格
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = padding + (chartHeight / 4) * i;
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(width - padding, y);
                ctx.stroke();

                // Y轴标签
                ctx.fillStyle = '#999';
                ctx.font = '10px sans-serif';
                ctx.fillText((maxY - (maxY / 4) * i).toFixed(0) + '%', 5, y + 3);
            }

            // 绘制折线
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            data.forEach((point, i) => {
                const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
                const y = padding + chartHeight - (point.y / maxY) * chartHeight;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // 填充区域
            ctx.lineTo(padding + chartWidth, padding + chartHeight);
            ctx.lineTo(padding, padding + chartHeight);
            ctx.closePath();
            ctx.fillStyle = color.replace(')', ', 0.1)').replace('rgb', 'rgba');
            ctx.fill();

            // 绘制数据点
            data.forEach((point, i) => {
                const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
                const y = padding + chartHeight - (point.y / maxY) * chartHeight;

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            });
        }

        // 绘制图表
        try {
            drawChart('cpuChart', [${cpuChartData}], 'rgb(102, 126, 234)', 'CPU %');
            drawChart('memoryChart', [${memoryChartData}], 'rgb(118, 75, 162)', 'Memory %');
        } catch (e) {
            console.log('Chart drawing skipped:', e);
        }
    </script>
</body>
</html>`;
}

// ============================================
// 报告保存
// ============================================
async function saveReport(results: TestResults, testType: string): Promise<string> {
  // 创建报告目录
  const logsDir = path.resolve(process.cwd(), 'ATCA', 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logger.info('DIRECTORY_CREATED', `创建报告目录: ${logsDir}`);
  }

  // 生成文件名
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const fileName = `performance-report-${testType}-${dateStr}-${timeStr}`;
  const htmlPath = path.join(logsDir, `${fileName}.html`);
  const jsonPath = path.join(logsDir, `${fileName}.json`);

  // 保存 HTML 报告
  const htmlReport = generateHTMLReport(results);
  fs.writeFileSync(htmlPath, htmlReport, 'utf-8');
  logger.info('HTML_REPORT_SAVED', `HTML报告已保存: ${htmlPath}`, {
    memory: getServerMetrics().freeMemory,
  });

  // 保存 JSON 数据
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');
  logger.info('JSON_REPORT_SAVED', `JSON数据已保存: ${jsonPath}`);

  return htmlPath;
}

// ============================================
// 性能测试执行器
// ============================================
interface LoadTestConfig {
  baseUrl: string;
  endpoints: string[];
  concurrentUsers: number;
  durationSeconds: number;
  serverMetricsInterval: number;
}

export async function runLoadTest(config: LoadTestConfig, testType: string): Promise<TestResults> {
  console.log('\n');
  logger.start('TEST_INITIALIZATION', '初始化性能测试');
  console.log('🚀 启动高并发性能测试...');
  console.log(`📊 配置: ${config.concurrentUsers} 并发用户, ${config.durationSeconds}秒测试时长`);
  console.log(`🎯 目标URL: ${config.baseUrl}`);
  console.log(`📍 测试端点: ${config.endpoints.join(', ')}`);
  console.log('---');

  // 重置指标
  metrics.length = 0;
  serverMetricsHistory.length = 0;
  logger.clear();
  testStartTime = Date.now();

  logger.end('TEST_INITIALIZATION', 'SUCCESS');

  // 阶段1: 数据加载初始化
  logger.start('DATA_LOADING', '阶段1: 数据加载初始化');
  console.log('\n📂 阶段1: 数据加载初始化...');

  // 预热请求
  logger.info('WARMUP_REQUEST', '发送预热请求到各端点');
  for (const endpoint of config.endpoints) {
    const warmupUrl = `${config.baseUrl}${endpoint}`;
    logger.start('WARMUP', `预热: ${endpoint}`);
    try {
      await makeRequest(warmupUrl);
      logger.end('WARMUP', 'SUCCESS');
    } catch (err) {
      logger.end('WARMUP', 'FAIL');
    }
  }
  logger.end('DATA_LOADING', 'SUCCESS');

  // 阶段2: 启动服务器资源监控
  logger.start('RESOURCE_MONITORING', '阶段2: 启动服务器资源监控');
  console.log('\n🖥️  阶段2: 启动服务器资源监控...');

  const metricsInterval = setInterval(() => {
    const serverMetrics = getServerMetrics();
    serverMetricsHistory.push(serverMetrics);

    // 输出实时状态
    process.stdout.write(
      `\r[CPU: ${serverMetrics.cpuUsage}% | 内存: ${serverMetrics.memoryUsage}% | 空闲: ${serverMetrics.freeMemory}MB] `
    );

    // 每10次输出一次结构化日志
    if (serverMetricsHistory.length % 10 === 0) {
      logger.info('RESOURCE_CHECK', `服务器资源监控 #${serverMetricsHistory.length}`, {
        cpu: serverMetrics.cpuUsage,
        memory: serverMetrics.freeMemory,
      });
    }
  }, config.serverMetricsInterval);
  logger.end('RESOURCE_MONITORING', 'SUCCESS');

  // 启动性能监控
  const perfObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    // 记录性能数据
  });
  perfObserver.observe({ entryTypes: ['measure', 'mark'] });

  // 阶段3: 模拟并发用户
  logger.start('USER_SIMULATION', `阶段3: 模拟 ${config.concurrentUsers} 并发用户`);
  console.log(`\n👥 阶段3: 模拟 ${config.concurrentUsers} 并发用户...`);

  const userStartTime = Date.now();
  try {
    // 启动所有虚拟用户
    const userPromises: Promise<void>[] = [];
    for (let i = 0; i < config.concurrentUsers; i++) {
      userPromises.push(simulateUser(
        i + 1,
        config.baseUrl,
        config.endpoints,
        config.durationSeconds * 1000
      ));
    }

    // 等待所有用户完成
    await Promise.all(userPromises);

    const userDuration = Date.now() - userStartTime;
    logger.end('USER_SIMULATION', 'SUCCESS', { memory: getServerMetrics().freeMemory });
    console.log(`\n✅ 所有 ${config.concurrentUsers} 并发用户测试完成，耗时: ${userDuration}ms`);
  } catch (err) {
    logger.end('USER_SIMULATION', 'FAIL');
    throw err;
  } finally {
    clearInterval(metricsInterval);
    perfObserver.disconnect();
    testEndTime = Date.now();
  }

  // 阶段4: 计算结果
  logger.start('RESULT_CALCULATION', '阶段4: 计算性能指标');
  console.log('\n📊 阶段4: 计算性能指标...');

  const results = calculateResults(testType);
  logger.end('RESULT_CALCULATION', 'SUCCESS');

  // 阶段5: 生成报告
  logger.start('REPORT_GENERATION', '阶段5: 生成测试报告');
  console.log('\n📄 阶段5: 生成测试报告...');

  const reportPath = await saveReport(results, testType);
  logger.end('REPORT_GENERATION', 'SUCCESS');

  return results;
}

// ============================================
// 结果输出与评估
// ============================================
export function printResults(results: TestResults): { passed: boolean; issues: string[] } {
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                      📊 性能测试报告');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const issues: string[] = [];

  // 请求统计
  console.log('📈 请求统计:');
  console.log(`   总请求数:      ${results.totalRequests}`);
  console.log(`   成功请求:      ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`   失败请求:      ${results.failedRequests} (${((results.failedRequests / results.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`   测试时长:      ${results.duration}s`);
  console.log(`   QPS:           ${results.requestsPerSecond} req/s`);

  // 响应时间
  console.log('\n⏱️  响应时间统计:');
  console.log(`   平均响应:      ${results.averageResponseTime}ms`);
  console.log(`   最小响应:      ${results.minResponseTime}ms`);
  console.log(`   最大响应:      ${results.maxResponseTime}ms`);
  console.log(`   P50 (中位数):  ${results.p50ResponseTime}ms`);
  console.log(`   P90:           ${results.p90ResponseTime}ms`);
  console.log(`   P99:           ${results.p99ResponseTime}ms`);

  // 性能评估
  console.log('\n🔍 性能评估:');

  // 检查响应时间
  if (results.averageResponseTime > 2000) {
    issues.push(`平均响应时间超过2秒: ${results.averageResponseTime}ms`);
    console.log(`   ❌ 平均响应时间: ${results.averageResponseTime}ms (超过2秒阈值)`);
  } else if (results.averageResponseTime > 1000) {
    console.log(`   ⚠️  平均响应时间: ${results.averageResponseTime}ms (超过1秒，建议优化)`);
  } else {
    console.log(`   ✅ 平均响应时间: ${results.averageResponseTime}ms`);
  }

  if (results.p99ResponseTime > 5000) {
    issues.push(`P99响应时间过高: ${results.p99ResponseTime}ms`);
    console.log(`   ❌ P99响应时间: ${results.p99ResponseTime}ms (严重延迟)`);
  } else if (results.p99ResponseTime > 3000) {
    console.log(`   ⚠️  P99响应时间: ${results.p99ResponseTime}ms (高延迟)`);
  } else {
    console.log(`   ✅ P99响应时间: ${results.p99ResponseTime}ms`);
  }

  // 检查成功率
  const successRate = (results.successfulRequests / results.totalRequests) * 100;
  if (successRate < 95) {
    issues.push(`请求成功率过低: ${successRate.toFixed(2)}%`);
    console.log(`   ❌ 成功率: ${successRate.toFixed(2)}% (低于95%阈值)`);
  } else {
    console.log(`   ✅ 成功率: ${successRate.toFixed(2)}%`);
  }

  // 检查服务器资源
  if (results.serverMetrics.length > 0) {
    const avgCpu = results.serverMetrics.reduce((a, b) => a + b.cpuUsage, 0) / results.serverMetrics.length;
    const avgMemory = results.serverMetrics.reduce((a, b) => a + b.memoryUsage, 0) / results.serverMetrics.length;
    const maxCpu = Math.max(...results.serverMetrics.map(m => m.cpuUsage));
    const maxMemory = Math.max(...results.serverMetrics.map(m => m.memoryUsage));

    console.log('\n🖥️  服务器资源使用:');
    console.log(`   CPU 平均:      ${avgCpu.toFixed(2)}%`);
    console.log(`   CPU 峰值:      ${maxCpu.toFixed(2)}%`);
    console.log(`   内存平均:      ${avgMemory.toFixed(2)}%`);
    console.log(`   内存峰值:      ${maxMemory.toFixed(2)}%`);

    if (avgCpu > 80) {
      issues.push(`CPU平均使用率过高: ${avgCpu.toFixed(2)}%`);
      console.log(`   ❌ CPU使用率过高: ${avgCpu.toFixed(2)}%`);
    } else if (avgCpu > 60) {
      console.log(`   ⚠️  CPU使用率偏高: ${avgCpu.toFixed(2)}%`);
    } else {
      console.log(`   ✅ CPU使用率正常: ${avgCpu.toFixed(2)}%`);
    }

    if (maxMemory > 90) {
      issues.push(`内存使用率峰值过高: ${maxMemory.toFixed(2)}%`);
      console.log(`   ❌ 内存使用率过高: ${maxMemory.toFixed(2)}%`);
    } else if (maxMemory > 75) {
      console.log(`   ⚠️  内存使用率偏高: ${maxMemory.toFixed(2)}%`);
    } else {
      console.log(`   ✅ 内存使用率正常: ${maxMemory.toFixed(2)}%`);
    }
  }

  // 总结
  console.log('\n═══════════════════════════════════════════════════════════════');

  if (issues.length === 0) {
    console.log('                    ✅ 测试通过 - 所有指标达标');
    console.log('═══════════════════════════════════════════════════════════════\n');
    return { passed: true, issues: [] };
  } else {
    console.log(`              ❌ 测试发现问题 - 发现 ${issues.length} 项性能问题`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 问题清单:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });

    console.log('\n💡 优化建议:');
    if (issues.some(i => i.includes('响应时间'))) {
      console.log('   → 考虑启用或增强数据库查询缓存');
      console.log('   → 优化数据库索引和查询语句');
      console.log('   → 增加服务器缓存策略');
      console.log('   → 考虑使用CDN加速静态资源');
    }
    if (issues.some(i => i.includes('CPU') || i.includes('内存'))) {
      console.log('   → 考虑水平扩展服务器数量');
      console.log('   → 优化内存使用，减少对象创建');
      console.log('   → 使用连接池复用数据库连接');
    }
    if (issues.some(i => i.includes('成功率'))) {
      console.log('   → 检查服务器日志定位失败原因');
      console.log('   → 增加超时时间和重试机制');
      console.log('   → 检查网络连接和防火墙设置');
    }

    return { passed: false, issues };
  }
}

// ============================================
// 测试配置
// ============================================
export const TEST_CONFIG = {
  // 本地开发环境
  local: {
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
  },

  // 生产环境压力测试
  production: {
    baseUrl: 'https://atca.xin',
    endpoints: [
      '/api/v1/index/featured',
      '/api/v1/architecture/list',
      '/api/v1/knowledge/categories',
    ],
    concurrentUsers: 100,
    durationSeconds: 60,
    serverMetricsInterval: 2000,
  },

  // 极限测试
  stress: {
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
  },
};

// ============================================
// 主函数
// ============================================
export async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'local';

  const config = TEST_CONFIG[testType as keyof typeof TEST_CONFIG];
  if (!config) {
    console.error(`未知的测试类型: ${testType}`);
    console.log('可用测试类型: local, production, stress');
    process.exit(1);
  }

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     华夏营造 - 高并发性能测试                                  ║');
  console.log('║     模拟真实用户行为，评估系统性能                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // 执行测试
  const results = await runLoadTest(config, testType);
  const { passed, issues } = printResults(results);

  console.log(`\n📄 HTML报告已保存至: ATCA/logs/performance-report-${testType}-*.html\n`);

  process.exit(passed ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}
