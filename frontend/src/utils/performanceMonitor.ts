// 性能监控工具
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // 保留最近1000条记录
  
  // 记录性能指标
  record(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });
    
    // 清理旧数据
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }
  
  // 计时开始
  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.record(name, duration);
    };
  }
  
  // 获取指标统计
  getStats(name: string, timeRange?: number) {
    const now = Date.now();
    let metrics = this.metrics.filter(m => m.name === name);
    
    if (timeRange) {
      metrics = metrics.filter(m => now - m.timestamp < timeRange);
    }
    
    if (metrics.length === 0) {
      return null;
    }
    
    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
      count: values.length,
      avg,
      min,
      max,
      sum,
    };
  }
  
  // 获取最近的指标
  getRecent(name: string, limit = 10) {
    return this.metrics
      .filter(m => m.name === name)
      .slice(-limit)
      .reverse();
  }
  
  // 清除所有指标
  clear() {
    this.metrics = [];
  }
  
  // 导出指标
  export() {
    return [...this.metrics];
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 性能优化建议
export function getPerformanceAdvice() {
  const advice: string[] = [];
  
  // 检查API响应时间
  const apiStats = performanceMonitor.getStats('api-request', 60000);
  if (apiStats && apiStats.avg > 3000) {
    advice.push(`API平均响应时间较长 (${apiStats.avg.toFixed(0)}ms)，建议启用缓存或优化请求`);
  }
  
  // 检查页面加载时间
  const loadStats = performanceMonitor.getStats('page-load', 60000);
  if (loadStats && loadStats.avg > 2000) {
    advice.push(`页面平均加载时间较长 (${loadStats.avg.toFixed(0)}ms)，建议使用代码分割和懒加载`);
  }
  
  // 检查内存使用
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    if (memory && memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      advice.push('内存使用接近限制，建议清理不必要的缓存和大对象');
    }
  }
  
  return advice;
}

// React/Vue应用的性能优化技巧
export const performanceTips = {
  // 1. 使用虚拟滚动处理长列表
  useVirtualScroll: '对于超过100项的列表，使用虚拟滚动（如vue-virtual-scroller）来减少DOM节点',
  
  // 2. 合理使用计算属性
  useComputed: '使用计算属性缓存派生数据，避免在模板中进行复杂计算',
  
  // 3. 事件防抖和节流
  useDebounceThrottle: '对于频繁触发的事件（滚动、输入），使用防抖和节流来减少不必要的计算',
  
  // 4. 懒加载组件
  useLazyLoad: '使用import()或defineAsyncComponent进行组件懒加载，减少首屏加载时间',
  
  // 5. 使用Web Worker
  useWebWorker: '对于复杂的计算任务，考虑使用Web Worker避免阻塞主线程',
  
  // 6. 优化图片加载
  optimizeImages: '使用图片懒加载、压缩和适当的图片格式（WebP）来减少加载时间',
  
  // 7. 减少重排和重绘
  reduceReflow: '避免频繁修改DOM样式，使用CSS transform和opacity进行动画以利用GPU加速',
  
  // 8. 使用requestAnimationFrame
  useRAF: '对于需要高频更新的动画，使用requestAnimationFrame而不是setInterval',
  
  // 9. 合理使用缓存
  useCache: '对于不经常变化的数据，使用适当的缓存策略减少重复请求',
  
  // 10. 监控关键指标
  monitorMetrics: '使用Performance API和User Timing API监控关键性能指标，持续优化',
};
