// ============================================
// 筑见山河 - 内存生命周期日志工具（前端）
// 在关键生命周期节点记录内存使用快照，便于泄漏模式识别
// ============================================

type LifecycleStage =
  | 'mount'
  | 'unmount'
  | 'init'
  | 'dispose'
  | 'timer_start'
  | 'timer_stop'
  | 'listener_add'
  | 'listener_remove'
  | 'resource_alloc'
  | 'resource_release';

type RiskLevel = 'safe' | 'low' | 'medium' | 'high';

interface MemorySnapshot {
  timestamp: string;
  epoch: number;
  usedJSHeapMB: number;
  totalJSHeapMB: number;
  jsHeapLimitMB: number;
  domNodes: number;
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
}

const snapshots: LifecycleLogEntry[] = [];
const MAX_LOG_ENTRIES = 500;
const refRegistry = new Map<string, number>();

function getMemorySnapshot(): MemorySnapshot {
  const perf = performance as any;
  const mem = perf.memory || {};
  const domNodes = typeof document !== 'undefined'
    ? document.querySelectorAll('*').length
    : 0;
  return {
    timestamp: new Date().toISOString(),
    epoch: Date.now(),
    usedJSHeapMB: mem.usedJSHeapSize ? +(mem.usedJSHeapSize / 1024 / 1024).toFixed(2) : 0,
    totalJSHeapMB: mem.totalJSHeapSize ? +(mem.totalJSHeapSize / 1024 / 1024).toFixed(2) : 0,
    jsHeapLimitMB: mem.jsHeapSizeLimit ? +(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2) : 0,
    domNodes,
  };
}

function assessRisk(
  stage: LifecycleStage,
  prevMemory: MemorySnapshot | null,
  currentMemory: MemorySnapshot
): { level: RiskLevel; note: string } {
  if (stage === 'unmount' || stage === 'dispose' || stage === 'timer_stop' ||
      stage === 'listener_remove' || stage === 'resource_release') {
    if (prevMemory && currentMemory.usedJSHeapMB > prevMemory.usedJSHeapMB + 5) {
      return {
        level: 'high',
        note: `资源释放后堆内存反而增加 ${currentMemory.usedJSHeapMB - (prevMemory?.usedJSHeapMB || 0)} MB，疑似泄漏`,
      };
    }
    return { level: 'safe', note: '资源已正常释放' };
  }

  if (stage === 'mount' || stage === 'init' || stage === 'timer_start' ||
      stage === 'listener_add' || stage === 'resource_alloc') {
    if (prevMemory) {
      const growth = currentMemory.usedJSHeapMB - prevMemory.usedJSHeapMB;
      if (growth > 20) {
        return { level: 'high', note: `分配内存 ${growth.toFixed(2)} MB，增长过大` };
      }
      if (growth > 10) {
        return { level: 'medium', note: `分配内存 ${growth.toFixed(2)} MB，需关注` };
      }
      if (growth > 2) {
        return { level: 'low', note: `分配内存 ${growth.toFixed(2)} MB` };
      }
    }
    return { level: 'safe', note: '内存分配在合理范围' };
  }

  return { level: 'safe', note: '' };
}

function log(
  module: string,
  stage: LifecycleStage,
  opts?: { refCount?: number; detail?: string }
): void {
  if (!import.meta.env.DEV) return;

  const mem = getMemorySnapshot();
  const lastEntry = snapshots[snapshots.length - 1];
  const prevMem = lastEntry ? lastEntry.memory : null;
  const { level, note } = assessRisk(stage, prevMem, mem);

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
  };

  snapshots.push(entry);
  if (snapshots.length > MAX_LOG_ENTRIES) {
    snapshots.splice(0, snapshots.length - MAX_LOG_ENTRIES);
  }

  const tag = level === 'high' ? '🚨'
    : level === 'medium' ? '⚠️'
    : level === 'low' ? 'ℹ️'
    : '✅';

  console.log(
    `[MEM Lifecycle] ${tag} [${mem.timestamp}] [${module}] ${stage.toUpperCase()} | ` +
    `heap=${mem.usedJSHeapMB}MB/${mem.totalJSHeapMB}MB nodes=${mem.domNodes} | ` +
    `refs=${opts?.refCount ?? '-'} risk=${level} | ${note}` +
    (opts?.detail ? ` | ${opts.detail}` : '')
  );

  if (level === 'high') {
    console.warn(`[MEM Lifecycle] 高风险: ${module} 在 ${stage} 阶段可能存在内存泄漏`);
  }
}

export function logMount(module: string, detail?: string): void {
  log(module, 'mount', { detail });
}

export function logUnmount(module: string, detail?: string): void {
  log(module, 'unmount', { detail });
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

function countRefsByModule(module: string): number {
  let count = 0;
  for (const key of refRegistry.keys()) {
    if (key.startsWith(`${module}:`) || key.includes(`:${module}:`)) {
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

export function clearLifecycleLogs(): void {
  snapshots.length = 0;
  refRegistry.clear();
}

export function getRefCount(module: string): number {
  return countRefsByModule(module);
}
