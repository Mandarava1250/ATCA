// ============================================
// 性能监控中间件
// 针对 2核2GiB 服务器优化
// ============================================

import express from 'express';
import { logTimerStart } from '../utils/memoryLifecycle';

interface PerformanceStats {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
  uptime: number;
  requestCount: number;
  avgResponseTime: number;
  errorCount: number;
}

// 内存警告阈值（2GiB的80% = 1.6GiB）
const MEMORY_WARNING_THRESHOLD = 1.6 * 1024 * 1024 * 1024; // 1.6GB

// CPU警告阈值（70%）
const CPU_WARNING_THRESHOLD = 0.7;

// 请求统计
let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;
let lastCpuUsage = process.cpuUsage();

// 性能监控中间件
export function performanceMonitor(): express.RequestHandler {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const startTime = Date.now();
    requestCount++;

    // 响应完成后记录
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      totalResponseTime += responseTime;

      if (res.statusCode >= 400) {
        errorCount++;
      }

      // 检查内存使用
      const memUsage = process.memoryUsage();
      if (memUsage.rss > MEMORY_WARNING_THRESHOLD) {
        console.warn(`[Performance] 内存使用超过阈值: ${formatBytes(memUsage.rss)} > ${formatBytes(MEMORY_WARNING_THRESHOLD)}`);
        
        // 尝试触发垃圾回收（如果可用）
        if (global.gc) {
          global.gc();
          console.log('[Performance] 已触发垃圾回收');
        }
      }
    });

    next();
  };
}

// 获取性能统计
export function getPerformanceStats(): PerformanceStats {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage(lastCpuUsage);
  lastCpuUsage = process.cpuUsage();

  return {
    memoryUsage: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    },
    cpuUsage: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    uptime: process.uptime(),
    requestCount,
    avgResponseTime: requestCount > 0 ? totalResponseTime / requestCount : 0,
    errorCount,
  };
}

// 格式化字节
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// 格式化CPU使用率（微秒转百分比）
function formatCpuPercent(cpuUsage: { user: number; system: number }, uptime: number): string {
  const totalCpu = (cpuUsage.user + cpuUsage.system) / 1000000; // 转换为秒
  const percent = (totalCpu / uptime) * 100;
  return percent.toFixed(2) + '%';
}

// 性能监控端点处理器
export function performanceEndpoint(req: express.Request, res: express.Response): void {
  const stats = getPerformanceStats();
  const memPercent = (stats.memoryUsage.rss / MEMORY_WARNING_THRESHOLD) * 100;
  
  res.json({
    success: true,
    data: {
      memory: {
        rss: formatBytes(stats.memoryUsage.rss),
        heapUsed: formatBytes(stats.memoryUsage.heapUsed),
        heapTotal: formatBytes(stats.memoryUsage.heapTotal),
        external: formatBytes(stats.memoryUsage.external),
        percentUsed: memPercent.toFixed(2) + '%',
        warning: stats.memoryUsage.rss > MEMORY_WARNING_THRESHOLD,
      },
      cpu: {
        user: formatCpuPercent(stats.cpuUsage, stats.uptime),
        system: formatCpuPercent({ user: stats.cpuUsage.system, system: 0 }, stats.uptime),
        warning: false, // 需要更复杂的计算才能准确判断
      },
      uptime: formatUptime(stats.uptime),
      requests: {
        total: stats.requestCount,
        errors: stats.errorCount,
        avgResponseTime: stats.avgResponseTime.toFixed(2) + 'ms',
      },
      thresholds: {
        memoryWarning: formatBytes(MEMORY_WARNING_THRESHOLD),
        cpuWarning: CPU_WARNING_THRESHOLD * 100 + '%',
      },
    },
  });
}

// 格式化运行时间
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}天 ${hours}小时 ${minutes}分钟`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟 ${secs}秒`;
  return `${secs}秒`;
}

// 重置统计
export function resetStats(): void {
  requestCount = 0;
  errorCount = 0;
  totalResponseTime = 0;
  lastCpuUsage = process.cpuUsage();
}

// 内存泄漏检测
export function detectMemoryLeak(): void {
  const stats = getPerformanceStats();
  const heapUsedMB = stats.memoryUsage.heapUsed / (1024 * 1024);
  
  // 如果堆内存使用超过500MB，警告可能的内存泄漏
  if (heapUsedMB > 500) {
    console.error(`[Performance] 可能的内存泄漏检测: 堆内存使用 ${heapUsedMB.toFixed(2)}MB`);
  }
}

// 定期性能检查（每分钟）
export function startPeriodicCheck(): void {
  setInterval(() => {
    const stats = getPerformanceStats();
    const memMB = stats.memoryUsage.rss / (1024 * 1024);
    
    console.log(`[Performance] 内存: ${memMB.toFixed(2)}MB | 请求: ${stats.requestCount} | 平均响应: ${stats.avgResponseTime.toFixed(2)}ms`);
    
    detectMemoryLeak();
  }, 60000); // 每分钟检查一次
  logTimerStart('PerformanceMonitor', 'periodic-check', 60000);
}