// ============================================
// 华夏营造 - 前端内存泄漏检测工具
// 监控前端内存使用，检测内存泄漏
// ============================================

interface MemorySnapshot {
  timestamp: number;
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
  usedJSHeapMB?: number;
  nodes: number;
  listeners: number;
}

interface LeakPattern {
  name: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  check: () => boolean;
}

const MAX_SNAPSHOTS = 100;
const CHECK_INTERVAL_MS = 10000;
const LEAK_THRESHOLD_MB_PER_10MIN = 20;

class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private monitorTimer: number | null = null;
  private isRunning = false;
  private suspectedLeaks: string[] = [];
  private listeners: Map<string, Set<string>> = new Map();

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.takeSnapshot();
    this.monitorTimer = window.setInterval(() => {
      this.takeSnapshot();
      this.analyzeLeaks();
    }, CHECK_INTERVAL_MS);

    console.info('[MemoryLeakDetector] 内存泄漏检测已启动');
  }

  stop(): void {
    if (this.monitorTimer) {
      window.clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
    this.isRunning = false;
    console.info('[MemoryLeakDetector] 内存泄漏检测已停止');
  }

  takeSnapshot(): MemorySnapshot {
    const perf = performance as any;
    const memory = perf.memory || {};

    const nodes = this.countNodes();
    const listeners = this.estimateListeners();

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      usedJSHeapMB: memory.usedJSHeapSize
        ? +(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
        : undefined,
      nodes,
      listeners,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-MAX_SNAPSHOTS);
    }

    return snapshot;
  }

  private countNodes(): number {
    return document.querySelectorAll('*').length;
  }

  private estimateListeners(): number {
    let count = 0;
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      const props = Object.keys(el) as (keyof Element)[];
      props.forEach((prop) => {
        if (prop.startsWith('on')) {
          const handler = (el as any)[prop];
          if (typeof handler === 'function') {
            count++;
          }
        }
      });
    });
    return count;
  }

  private analyzeLeaks(): void {
    if (this.snapshots.length < 10) return;

    const recent = this.snapshots.slice(-30);
    const first = recent[0];
    const last = recent[recent.length - 1];

    const timeDiffMin = (last.timestamp - first.timestamp) / 1000 / 60;
    if (timeDiffMin < 1) return;

    if (first.usedJSHeapSize && last.usedJSHeapSize) {
      const growthMB = (last.usedJSHeapSize - first.usedJSHeapSize) / 1024 / 1024;
      const growthPer10Min = (growthMB / timeDiffMin) * 10;

      if (growthPer10Min > LEAK_THRESHOLD_MB_PER_10MIN) {
        const msg = `检测到堆内存持续增长: 每10分钟约 +${growthPer10Min.toFixed(2)} MB`;
        if (!this.suspectedLeaks.includes(msg)) {
          this.suspectedLeaks.push(msg);
          console.warn('[MemoryLeakDetector]', msg);
        }
      }
    }

    if (last.nodes > first.nodes * 1.5 && last.nodes > 5000) {
      const msg = `DOM节点数量异常增长: ${first.nodes} -> ${last.nodes} (${timeDiffMin.toFixed(1)}分钟内)`;
      if (!this.suspectedLeaks.includes(msg)) {
        this.suspectedLeaks.push(msg);
        console.warn('[MemoryLeakDetector]', msg);
      }
    }

    this.checkKnownPatterns();
  }

  private checkKnownPatterns(): void {
    const patterns: LeakPattern[] = [
      {
        name: 'setInterval未清理',
        severity: 'high',
        description: '检查是否有组件卸载时未清理的定时器',
        check: () => false,
      },
    ];
    patterns.forEach(() => { /* placeholder */ });
  }

  getStats() {
    const current = this.snapshots[this.snapshots.length - 1];
    const first = this.snapshots[0];
    let growthPerMin = 0;

    if (current?.usedJSHeapSize && first?.usedJSHeapSize && first.timestamp !== current.timestamp) {
      const timeMin = (current.timestamp - first.timestamp) / 1000 / 60;
      if (timeMin > 0) {
        growthPerMin = +(((current.usedJSHeapSize - first.usedJSHeapSize) / 1024 / 1024) / timeMin).toFixed(3);
      }
    }

    return {
      snapshots: this.snapshots.length,
      currentNodes: current?.nodes ?? 0,
      currentListeners: current?.listeners ?? 0,
      currentHeapMB: current?.usedJSHeapMB ?? 0,
      heapLimitMB: current?.jsHeapSizeLimit ? +(current.jsHeapSizeLimit / 1024 / 1024).toFixed(2) : 0,
      heapGrowthPerMinMB: growthPerMin,
      suspectedLeaks: [...this.suspectedLeaks],
      snapshotHistory: this.snapshots.slice(-20),
    };
  }

  getSuspectedLeaks(): string[] {
    return [...this.suspectedLeaks];
  }

  reset(): void {
    this.snapshots = [];
    this.suspectedLeaks = [];
  }
}

export const memoryLeakDetector = new MemoryLeakDetector();

export function initMemoryLeakDetection(): void {
  if (typeof window !== 'undefined' && !memoryLeakDetector['isRunning']) {
    memoryLeakDetector.start();
  }
}

export function getMemoryLeakStats() {
  return memoryLeakDetector.getStats();
}

export default memoryLeakDetector;
