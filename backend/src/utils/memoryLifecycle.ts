// ============================================
// 华夏营造 - 内存生命周期日志工具（后端）
// 在关键生命周期节点记录内存使用快照，便于泄漏模式识别
// ============================================

import { createLogger } from '../utils/logger';

const logger = createLogger('MemLifecycle');

type LifecycleStage =
  | 'init'
  | 'dispose'
  | 'timer_start'
  | 'timer_stop'
  | 'listener_add'
  | 'listener_remove'
  | 'resource_alloc'
  | 'resource_release'
  | 'cache_cleanup';

type RiskLevel = 'safe' | 'low' | 'medium' | 'high';

interface MemorySnapshot {
  timestamp: string;
  epoch: number;
  heapUsedMB: number;
  heapTotalMB: number;
  rssMB: number;
  externalMB: number;
}

interface LifecycleLogEntry {
  timestamp: string;
  epoch: number;
  module: string;
  stage: LifecycleStage;
  memory: MemorySnapshot;
  refCount?: number;
  detail?: string;
  riskLevel: RiskLevel;
  riskNote: string;
  heapDeltaMB?: number;
}

const snapshots: LifecycleLogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;
const refRegistry = new Map<string, number>();

function getMemorySnapshot(): MemorySnapshot {
  const mem = process.memoryUsage();
  return {
    timestamp: new Date().toISOString(),
    epoch: Date.now(),
    heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
    heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(2),
    rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
    externalMB: +(mem.external / 1024 / 1024).toFixed(2),
  };
}

function assessRisk(
  stage: LifecycleStage,
  prevMemory: MemorySnapshot | null,
  currentMemory: MemorySnapshot
): { level: RiskLevel; note: string; delta: number } {
  const prevHeap = prevMemory?.heapUsedMB ?? 0;
  const delta = +(currentMemory.heapUsedMB - prevHeap).toFixed(2);

  if (stage === 'dispose' || stage === 'timer_stop' ||
      stage === 'listener_remove' || stage === 'resource_release' || stage === 'cache_cleanup') {
    if (delta > 10) {
      return {
        level: 'high',
        note: `资源释放后堆内存反而增加 ${delta} MB，疑似泄漏`,
        delta,
      };
    }
    if (delta > 3) {
      return {
        level: 'medium',
        note: `资源释放后堆内存增加 ${delta} MB，需关注`,
        delta,
      };
    }
    return { level: 'safe', note: `资源已正常释放，内存变化 ${delta} MB`, delta };
  }

  if (stage === 'init' || stage === 'timer_start' ||
      stage === 'listener_add' || stage === 'resource_alloc') {
    if (delta > 50) {
      return { level: 'high', note: `分配内存 ${delta} MB，增长过大`, delta };
    }
    if (delta > 20) {
      return { level: 'medium', note: `分配内存 ${delta} MB，需关注`, delta };
    }
    if (delta > 5) {
      return { level: 'low', note: `分配内存 ${delta} MB`, delta };
    }
    return { level: 'safe', note: '内存分配在合理范围', delta };
  }

  return { level: 'safe', note: '', delta };
}

function log(
  module: string,
  stage: LifecycleStage,
  opts?: { refCount?: number; detail?: string }
): void {
  const mem = getMemorySnapshot();
  const lastEntry = snapshots[snapshots.length - 1];
  const prevMem = lastEntry ? lastEntry.memory : null;
  const { level, note, delta } = assessRisk(stage, prevMem, mem);

  const entry: LifecycleLogEntry = {
    timestamp: mem.timestamp,
    epoch: mem.epoch,
    module,
    stage,
    memory: mem,
    refCount: opts?.refCount,
    detail: opts?.detail,
    riskLevel: level,
    riskNote: note,
    heapDeltaMB: delta,
  };

  snapshots.push(entry);
  if (snapshots.length > MAX_LOG_ENTRIES) {
    snapshots.splice(0, snapshots.length - MAX_LOG_ENTRIES);
  }

  const logMsg = `${stage.toUpperCase()} | module=${module} | ` +
    `heap=${mem.heapUsedMB}MB/${mem.heapTotalMB}MB rss=${mem.rssMB}MB | ` +
    `delta=${delta}MB | refs=${opts?.refCount ?? '-'} | risk=${level} | ${note}` +
    (opts?.detail ? ` | ${opts.detail}` : '');

  if (level === 'high') {
    logger.warn(logMsg);
  } else if (level === 'medium') {
    logger.warn(logMsg);
  } else {
    logger.info(logMsg);
  }
}

export function logInit(module: string, detail?: string): void {
  log(module, 'init', { detail });
}

export function logDispose(module: string, detail?: string): void {
  log(module, 'dispose', { detail });
}

export function logTimerStart(module: string, timerId: string, intervalMs: number): void {
  refRegistry.set(`timer:${module}:${timerId}`, Date.now());
  log(module, 'timer_start', {
    refCount: countRefsByModule(module),
    detail: `timer=${timerId} interval=${intervalMs}ms`,
  });
}

export function logTimerStop(module: string, timerId: string): void {
  refRegistry.delete(`timer:${module}:${timerId}`);
  log(module, 'timer_stop', {
    refCount: countRefsByModule(module),
    detail: `timer=${timerId}`,
  });
}

export function logListenerAdd(module: string, eventType: string, target: string): void {
  refRegistry.set(`listener:${module}:${eventType}:${target}`, Date.now());
  log(module, 'listener_add', {
    refCount: countRefsByModule(module),
    detail: `${eventType}@${target}`,
  });
}

export function logListenerRemove(module: string, eventType: string, target: string): void {
  refRegistry.delete(`listener:${module}:${eventType}:${target}`);
  log(module, 'listener_remove', {
    refCount: countRefsByModule(module),
    detail: `${eventType}@${target}`,
  });
}

export function logResourceAlloc(module: string, resourceType: string, size?: number): void {
  refRegistry.set(`resource:${module}:${resourceType}`, Date.now());
  log(module, 'resource_alloc', {
    refCount: countRefsByModule(module),
    detail: `${resourceType}${size ? ` (${size})` : ''}`,
  });
}

export function logResourceRelease(module: string, resourceType: string): void {
  refRegistry.delete(`resource:${module}:${resourceType}`);
  log(module, 'resource_release', {
    refCount: countRefsByModule(module),
    detail: `${resourceType}`,
  });
}

export function logCacheCleanup(module: string, cleanedCount: number, remainingCount: number): void {
  log(module, 'cache_cleanup', {
    refCount: remainingCount,
    detail: `cleaned=${cleanedCount} remaining=${remainingCount}`,
  });
}

function countRefsByModule(module: string): number {
  let count = 0;
  for (const key of refRegistry.keys()) {
    if (key.includes(`:${module}:`)) {
      count++;
    }
  }
  return count;
}

export function getLifecycleLogs(): LifecycleLogEntry[] {
  return [...snapshots];
}

export function getHighRiskEntries(): LifecycleLogEntry[] {
  return snapshots.filter(e => e.riskLevel === 'high' || e.riskLevel === 'medium');
}

export function getLifecycleStats() {
  const high = snapshots.filter(e => e.riskLevel === 'high');
  const medium = snapshots.filter(e => e.riskLevel === 'medium');
  const modules = new Set(snapshots.map(e => e.module));
  return {
    totalEntries: snapshots.length,
    highRiskCount: high.length,
    mediumRiskCount: medium.length,
    trackedModules: Array.from(modules),
    activeRefs: refRegistry.size,
    highRiskEntries: high.slice(-20),
    recentEntries: snapshots.slice(-50),
  };
}

export function clearLifecycleLogs(): void {
  snapshots.length = 0;
  refRegistry.clear();
}
