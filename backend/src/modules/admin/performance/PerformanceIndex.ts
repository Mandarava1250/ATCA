// ============================================
// 筑见山河 - 性能监控管理模块
// 提供数据库查询性能监控和分析功能
// ============================================

import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../../../middleware/auth';
import { asyncHandler } from '../../../middleware/errorHandler';
import { getPerformanceStats, resetStats } from '../../../middleware/performanceMonitor';
import { getCacheStats } from '../../../services/queryCache';
import { queryStats } from '../../../services/queryStats';
import { dataAccessService } from '../../../services/dataAccess';

const router = Router();
router.use(authMiddleware as any, adminMiddleware as any);

// ============ 系统性能概览 ============

/**
 * 获取系统性能概览
 * GET /admin/performance/overview
 */
router.get('/overview', asyncHandler(async (_req, res) => {
  const systemStats = getPerformanceStats();
  const cacheStats = getCacheStats();
  const queryStatsData = queryStats.getSummary();
  const timelineStats = queryStats.getTimelineStats(60);

  res.json({
    success: true,
    data: {
      system: systemStats,
      cache: cacheStats,
      queries: queryStatsData,
      timeline: timelineStats,
    },
  });
}));

// ============ 缓存统计 ============

/**
 * 获取缓存统计信息
 * GET /admin/performance/cache
 */
router.get('/cache', asyncHandler(async (_req, res) => {
  const stats = getCacheStats();
  
  res.json({
    success: true,
    data: {
      ...stats,
      hitRate: parseFloat(stats.hitRate),
    },
  });
}));

/**
 * 清除缓存
 * POST /admin/performance/cache/clear
 */
router.post('/cache/clear', asyncHandler(async (req: any, res) => {
  const { dbName } = req.body;
  
  if (dbName) {
    // 清除特定数据库的缓存
    dataAccessService.invalidateCache(dbName as any);
    res.json({ success: true, message: `已清除 ${dbName} 数据库缓存` });
  } else {
    // 清除所有缓存
    const queryCache = require('../../../services/queryCache').queryCache;
    queryCache.clear();
    res.json({ success: true, message: '已清除所有缓存' });
  }
}));

// ============ 查询统计 ============

/**
 * 获取查询统计摘要
 * GET /admin/performance/queries
 */
router.get('/queries', asyncHandler(async (_req, res) => {
  const summary = queryStats.getSummary();
  
  res.json({
    success: true,
    data: summary,
  });
}));

/**
 * 获取最近查询记录
 * GET /admin/performance/queries/recent
 */
router.get('/queries/recent', asyncHandler(async (req: any, res) => {
  const { limit = '50' } = req.query;
  const records = queryStats.getRecent(parseInt(limit));
  
  res.json({
    success: true,
    data: records,
  });
}));

/**
 * 获取慢查询记录
 * GET /admin/performance/queries/slow
 */
router.get('/queries/slow', asyncHandler(async (req: any, res) => {
  const { threshold = '500' } = req.query;
  const records = queryStats.getSlowQueries(parseInt(threshold));
  
  res.json({
    success: true,
    data: records,
  });
}));

/**
 * 获取查询时间线统计
 * GET /admin/performance/queries/timeline
 */
router.get('/queries/timeline', asyncHandler(async (req: any, res) => {
  const { minutes = '60' } = req.query;
  const timeline = queryStats.getTimelineStats(parseInt(minutes));
  
  res.json({
    success: true,
    data: timeline,
  });
}));

/**
 * 重置查询统计
 * POST /admin/performance/queries/reset
 */
router.post('/queries/reset', asyncHandler(async (_req, res) => {
  queryStats.reset();
  res.json({ success: true, message: '查询统计已重置' });
}));

// ============ 系统监控 ============

/**
 * 获取系统资源使用情况
 * GET /admin/performance/system
 */
router.get('/system', asyncHandler(async (_req, res) => {
  const stats = getPerformanceStats();
  
  const memPercent = (stats.memoryUsage.rss / (1.6 * 1024 * 1024 * 1024)) * 100;
  
  res.json({
    success: true,
    data: {
      memory: {
        rss: (stats.memoryUsage.rss / (1024 * 1024)).toFixed(2) + ' MB',
        heapUsed: (stats.memoryUsage.heapUsed / (1024 * 1024)).toFixed(2) + ' MB',
        heapTotal: (stats.memoryUsage.heapTotal / (1024 * 1024)).toFixed(2) + ' MB',
        external: (stats.memoryUsage.external / (1024 * 1024)).toFixed(2) + ' MB',
        percentUsed: memPercent.toFixed(2) + '%',
      },
      uptime: formatUptime(stats.uptime),
      requests: {
        total: stats.requestCount,
        errors: stats.errorCount,
        avgResponseTime: stats.avgResponseTime.toFixed(2) + ' ms',
      },
    },
  });
}));

/**
 * 重置系统统计
 * POST /admin/performance/system/reset
 */
router.post('/system/reset', asyncHandler(async (_req, res) => {
  resetStats();
  res.json({ success: true, message: '系统统计已重置' });
}));

// ============ 性能优化建议 ============

/**
 * 获取性能优化建议
 * GET /admin/performance/suggestions
 */
router.get('/suggestions', asyncHandler(async (_req, res) => {
  const cacheStats = getCacheStats();
  const queryStatsData = queryStats.getSummary();
  const systemStats = getPerformanceStats();

  const suggestions: Array<{
    level: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    action: string;
  }> = [];

  // 缓存命中率建议
  const hitRate = parseFloat(cacheStats.hitRate);
  if (hitRate < 50) {
    suggestions.push({
      level: 'warning',
      title: '缓存命中率较低',
      description: `当前缓存命中率为 ${hitRate}%，建议增加缓存时间或优化缓存策略`,
      action: '检查缓存TTL设置，考虑对频繁查询的数据增加缓存时间',
    });
  }

  // 慢查询建议
  const slowQueries = queryStats.getSlowQueries(500);
  if (slowQueries.length > 10) {
    suggestions.push({
      level: 'critical',
      title: '存在大量慢查询',
      description: `检测到 ${slowQueries.length} 条慢查询，可能影响系统性能`,
      action: '查看慢查询列表，优化SQL语句或添加索引',
    });
  }

  // 内存使用建议
  const memMB = systemStats.memoryUsage.rss / (1024 * 1024);
  if (memMB > 1500) {
    suggestions.push({
      level: 'warning',
      title: '内存使用较高',
      description: `当前内存使用 ${memMB.toFixed(2)} MB，接近警告阈值`,
      action: '检查内存泄漏，考虑优化缓存大小限制',
    });
  }

  // 请求量建议
  if (systemStats.avgResponseTime > 500) {
    suggestions.push({
      level: 'warning',
      title: '平均响应时间较高',
      description: `当前平均响应时间为 ${systemStats.avgResponseTime.toFixed(2)} ms`,
      action: '分析慢查询，优化数据库查询或增加缓存',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      level: 'info',
      title: '系统性能良好',
      description: '未检测到需要优化的性能问题',
      action: '继续保持当前配置',
    });
  }

  res.json({
    success: true,
    data: suggestions,
  });
}));

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

export default router;
