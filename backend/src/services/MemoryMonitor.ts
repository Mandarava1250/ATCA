// ============================================
// 华夏营造 - 内存监控服务
// 监控 Node.js 进程内存使用，检测内存泄漏
// ============================================

import { createLogger } from '../utils/logger';
import { logInit, logDispose, logTimerStart, logTimerStop } from '../utils/memoryLifecycle';

const logger = createLogger('MemoryMonitor');

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsedMB: number;
  rssMB: number;
}

interface MemoryStats {
  snapshots: MemorySnapshot[];
  peakHeapUsedMB: number;
  peakRssMB: number;
  averageGrowthPerMinute: number;
  leakSuspected: boolean;
  leakConfidence: number;
}

const MAX_SNAPSHOTS = 60;
const CHECK_INTERVAL_MS = 60000;
const LEAK_THRESHOLD_MB_PER_HOUR = 50;
const LEAK_CONFIDENCE_THRESHOLD = 0.7;

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private monitorTimer: NodeJS.Timeout | null = null;
  private peakHeapUsed = 0;
  private peakRss = 0;
  private leakSuspected = false;
  private leakConfidence = 0;
  private isRunning = false;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.takeSnapshot();
    this.monitorTimer = setInterval(() => {
      this.takeSnapshot();
      this.analyzeLeak();
    }, CHECK_INTERVAL_MS);
    logTimerStart('MemoryMonitor', 'monitor', CHECK_INTERVAL_MS);

    logInit('MemoryMonitor', '内存监控服务已启动');
    logger.info('内存监控服务已启动', {
      checkInterval: `${CHECK_INTERVAL_MS / 1000}s`,
      maxSnapshots: MAX_SNAPSHOTS,
    });
  }

  stop(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      logTimerStop('MemoryMonitor', 'monitor');
      this.monitorTimer = null;
    }
    this.isRunning = false;
    logDispose('MemoryMonitor', '内存监控服务已停止');
    logger.info('内存监控服务已停止');
  }

  takeSnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsedMB: +(memUsage.heapUsed / 1024 / 1024).toFixed(2),
      rssMB: +(memUsage.rss / 1024 / 1024).toFixed(2),
    };

    this.peakHeapUsed = Math.max(this.peakHeapUsed, memUsage.heapUsed);
    this.peakRss = Math.max(this.peakRss, memUsage.rss);

    this.snapshots.push(snapshot);
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-MAX_SNAPSHOTS);
    }

    if (this.snapshots.length % 10 === 0) {
      logger.info('内存快照', {
        heapUsedMB: snapshot.heapUsedMB,
        rssMB: snapshot.rssMB,
        peakHeapUsedMB: +(this.peakHeapUsed / 1024 / 1024).toFixed(2),
        peakRssMB: +(this.peakRss / 1024 / 1024).toFixed(2),
        snapshots: this.snapshots.length,
      });
    }

    return snapshot;
  }

  private analyzeLeak(): void {
    if (this.snapshots.length < 10) return;

    const recent = this.snapshots.slice(-20);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const timeDiffHours = (last.timestamp - first.timestamp) / 1000 / 3600;
    if (timeDiffHours < 0.1) return;

    const heapGrowthMB = (last.heapUsed - first.heapUsed) / 1024 / 1024;
    const growthPerHour = heapGrowthMB / timeDiffHours;

    const rssGrowthMB = (last.rss - first.rss) / 1024 / 1024;
    const rssGrowthPerHour = rssGrowthMB / timeDiffHours;

    let increasingCount = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].heapUsed > recent[i - 1].heapUsed) {
        increasingCount++;
      }
    }
    const increasingRatio = increasingCount / (recent.length - 1);

    if (growthPerHour > LEAK_THRESHOLD_MB_PER_HOUR && increasingRatio > 0.6) {
      this.leakConfidence = Math.min(1, this.leakConfidence + 0.15);
      if (this.leakConfidence >= LEAK_CONFIDENCE_THRESHOLD && !this.leakSuspected) {
        this.leakSuspected = true;
        logger.warn('检测到潜在内存泄漏', {
          growthPerHourMB: +growthPerHour.toFixed(2),
          rssGrowthPerHourMB: +rssGrowthPerHour.toFixed(2),
          increasingRatio: +increasingRatio.toFixed(2),
          confidence: +this.leakConfidence.toFixed(2),
          heapUsedMB: last.heapUsedMB,
          peakHeapUsedMB: +(this.peakHeapUsed / 1024 / 1024).toFixed(2),
          recommendation: '建议检查定时器、事件监听器、Map/Set等数据结构的清理逻辑',
        });
      }
    } else if (growthPerHour < 10 && increasingRatio < 0.4) {
      this.leakConfidence = Math.max(0, this.leakConfidence - 0.05);
      if (this.leakConfidence < 0.3 && this.leakSuspected) {
        this.leakSuspected = false;
        logger.info('内存泄漏嫌疑已解除', {
          growthPerHourMB: +growthPerHour.toFixed(2),
          confidence: +this.leakConfidence.toFixed(2),
        });
      }
    }
  }

  getStats(): MemoryStats {
    let avgGrowth = 0;
    if (this.snapshots.length >= 2) {
      const first = this.snapshots[0];
      const last = this.snapshots[this.snapshots.length - 1];
      const timeDiffHours = (last.timestamp - first.timestamp) / 1000 / 3600;
      if (timeDiffHours > 0) {
        avgGrowth = +((last.heapUsed - first.heapUsed) / 1024 / 1024 / timeDiffHours).toFixed(2);
      }
    }

    return {
      snapshots: [...this.snapshots],
      peakHeapUsedMB: +(this.peakHeapUsed / 1024 / 1024).toFixed(2),
      peakRssMB: +(this.peakRss / 1024 / 1024).toFixed(2),
      averageGrowthPerMinute: +(avgGrowth / 60).toFixed(2),
      leakSuspected: this.leakSuspected,
      leakConfidence: +this.leakConfidence.toFixed(2),
    };
  }

  forceGC(): boolean {
    if (typeof (global as any).gc === 'function') {
      (global as any).gc();
      const before = this.snapshots[this.snapshots.length - 1]?.heapUsedMB || 0;
      const after = this.takeSnapshot().heapUsedMB;
      logger.info('手动 GC 执行完成', {
        beforeMB: before,
        afterMB: after,
        freedMB: +(before - after).toFixed(2),
      });
      return true;
    }
    logger.warn('手动 GC 不可用，请使用 --expose-gc 参数启动 Node.js');
    return false;
  }
}

export const memoryMonitor = new MemoryMonitor();

export function getMemoryStats() {
  return memoryMonitor.getStats();
}

export function forceGarbageCollection() {
  return memoryMonitor.forceGC();
}

export function startMemoryMonitor() {
  memoryMonitor.start();
}

export function stopMemoryMonitor() {
  memoryMonitor.stop();
}
