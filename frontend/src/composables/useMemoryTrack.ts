// ============================================
// 内存生命周期追踪 Composable
// 一行代码即可为组件添加完整的内存生命周期日志
// ============================================

import { onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import {
  logMount,
  logUnmount,
  logTimerStart,
  logTimerStop,
  logListenerAdd,
  logListenerRemove,
  logResourceAlloc,
  logResourceRelease,
} from '@/utils/memoryLifecycle';

interface TimerRecord {
  id: string;
  handle: number;
  intervalMs: number;
}

interface ListenerRecord {
  type: string;
  target: string;
}

export function useMemoryTrack(moduleName: string) {
  const timers = new Map<string, TimerRecord>();
  const listeners = new Map<string, ListenerRecord>();
  const resources = new Set<string>();

  onMounted(() => {
    logMount(moduleName);
  });

  onUnmounted(() => {
    for (const [id, record] of timers) {
      if (record.intervalMs > 0) {
        clearInterval(record.handle);
      } else {
        clearTimeout(record.handle);
      }
      logTimerStop(moduleName, id);
    }
    for (const [key, record] of listeners) {
      logListenerRemove(moduleName, record.type, record.target);
    }
    for (const res of resources) {
      logResourceRelease(moduleName, res);
    }
    logUnmount(moduleName);
  });

  function trackTimer(id: string, handle: number, intervalMs: number = 0): void {
    timers.set(id, { id, handle, intervalMs });
    logTimerStart(moduleName, id, intervalMs);
  }

  function untrackTimer(id: string): void {
    const record = timers.get(id);
    if (record) {
      if (record.intervalMs > 0) {
        clearInterval(record.handle);
      } else {
        clearTimeout(record.handle);
      }
      logTimerStop(moduleName, id);
      timers.delete(id);
    }
  }

  function trackListener(eventType: string, target: string = 'window'): void {
    const key = `${eventType}@${target}`;
    listeners.set(key, { type: eventType, target });
    logListenerAdd(moduleName, eventType, target);
  }

  function untrackListener(eventType: string, target: string = 'window'): void {
    const key = `${eventType}@${target}`;
    if (listeners.has(key)) {
      logListenerRemove(moduleName, eventType, target);
      listeners.delete(key);
    }
  }

  function trackResource(resourceType: string): void {
    resources.add(resourceType);
    logResourceAlloc(moduleName, resourceType);
  }

  function untrackResource(resourceType: string): void {
    if (resources.has(resourceType)) {
      logResourceRelease(moduleName, resourceType);
      resources.delete(resourceType);
    }
  }

  return {
    trackTimer,
    untrackTimer,
    trackListener,
    untrackListener,
    trackResource,
    untrackResource,
  };
}
