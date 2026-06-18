// ============================================
// 华夏营造 - 前端性能优化工具
// ============================================

import { ref, onMounted, onUnmounted } from 'vue';

// ============================================
// 性能指标监控
// ============================================
export interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadEventEnd: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

export const usePerformanceMetrics = () => {
  const metrics = ref<PerformanceMetrics | null>(null);
  const isLoading = ref(true);

  const collectMetrics = () => {
    if (!window.performance) {
      console.warn('浏览器不支持Performance API');
      return;
    }

    const perf = window.performance;
    const timing = perf.timing;
    
    metrics.value = {
      navigationStart: timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadEventEnd: timing.loadEventEnd - timing.navigationStart,
      firstContentfulPaint: 0,
      timeToInteractive: 0,
      totalBlockingTime: 0,
    };

    // 获取Paint Timing
    perf.getEntriesByType('paint').forEach((entry: any) => {
      if (entry.name === 'first-contentful-paint') {
        metrics.value!.firstContentfulPaint = entry.startTime;
      }
    });

    // 获取Long Tasks
    perf.getEntriesByType('longtask').forEach((entry: any) => {
      metrics.value!.totalBlockingTime += entry.duration;
    });

    isLoading.value = false;
  };

  onMounted(() => {
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('load', collectMetrics);
  });

  return {
    metrics,
    isLoading,
  };
};

// ============================================
// 图片懒加载
// ============================================
export const useLazyLoad = () => {
  const observer = ref<IntersectionObserver | null>(null);

  const initLazyLoad = () => {
    if ('IntersectionObserver' in window) {
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                observer.value?.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '100px',
          threshold: 0.1,
        }
      );
    }
  };

  const observe = (element: HTMLElement) => {
    if (observer.value) {
      observer.value.observe(element);
    }
  };

  onMounted(() => {
    initLazyLoad();
  });

  onUnmounted(() => {
    observer.value?.disconnect();
  });

  return {
    observe,
  };
};

// ============================================
// 请求缓存
// ============================================
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const requestCache = new Map<string, CacheEntry>();

export const useRequestCache = () => {
  const get = (key: string): any | null => {
    const entry = requestCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      requestCache.delete(key);
      return null;
    }

    return entry.data;
  };

  const set = (key: string, data: any, ttl: number = 300000): void => {
    requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  };

  const clear = (key?: string): void => {
    if (key) {
      requestCache.delete(key);
    } else {
      requestCache.clear();
    }
  };

  const getStats = () => {
    return {
      size: requestCache.size,
    };
  };

  return {
    get,
    set,
    clear,
    getStats,
  };
};

// ============================================
// 防抖函数
// ============================================
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ============================================
// 节流函数
// ============================================
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================
// 组件加载状态管理
// ============================================
export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

export const useLoadingState = <T>(
  fetcher: () => Promise<T>,
  autoLoad: boolean = true
) => {
  const state = ref<LoadingState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const load = async () => {
    state.value.isLoading = true;
    state.value.error = null;

    try {
      const data = await fetcher();
      state.value.data = data;
    } catch (error) {
      state.value.error = error as Error;
    } finally {
      state.value.isLoading = false;
    }
  };

  onMounted(() => {
    if (autoLoad) {
      load();
    }
  });

  return {
    state,
    load,
  };
};

// ============================================
// 内存优化工具
// ============================================
export const memoryTools = {
  getMemoryUsage: (): number | null => {
    if (window.performance && (window.performance as any).memory) {
      return ((window.performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return null;
  },

  forceGC: (): void => {
    if ((window as any).gc) {
      (window as any).gc();
    }
  },

  logMemoryUsage: (label: string = ''): void => {
    const usage = memoryTools.getMemoryUsage();
    if (usage !== null) {
      console.log(`[Memory] ${label}: ${usage.toFixed(2)} MB`);
    }
  },
};

// ============================================
// 资源预加载
// ============================================
export const preloadResources = (resources: Array<{
  url: string;
  type: 'script' | 'style' | 'image' | 'font';
}>): Promise<void[]> => {
  const promises = resources.map((resource) => {
    return new Promise<void>((resolve, reject) => {
      if (resource.type === 'script') {
        const script = document.createElement('script');
        script.src = resource.url;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${resource.url}`));
        document.head.appendChild(script);
      } else if (resource.type === 'style') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = resource.url;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load style: ${resource.url}`));
        document.head.appendChild(link);
      } else if (resource.type === 'image') {
        const img = new Image();
        img.src = resource.url;
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${resource.url}`));
      } else if (resource.type === 'font') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.url;
        link.as = 'font';
        link.onload = () => resolve();
        link.onerror = () => resolve(); // 字体加载失败不影响页面
        document.head.appendChild(link);
      } else {
        resolve();
      }
    });
  });

  return Promise.all(promises);
};

// ============================================
// 性能监控钩子
// ============================================
export const usePerformanceMonitor = () => {
  const startTime = ref(Date.now());
  const pageLoadTime = ref(0);

  const start = () => {
    startTime.value = Date.now();
  };

  const stop = () => {
    pageLoadTime.value = Date.now() - startTime.value;
    console.log(`[Performance] Page load time: ${pageLoadTime.value}ms`);
  };

  onMounted(() => {
    window.addEventListener('load', stop);
  });

  onUnmounted(() => {
    window.removeEventListener('load', stop);
  });

  return {
    startTime,
    pageLoadTime,
    start,
    stop,
  };
};