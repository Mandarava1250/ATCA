// ============================================
// 筑见山河 - 前端性能测试工具
// 模拟用户操作，测量页面性能指标
// ============================================

interface PerformanceMetrics {
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  fid: number;  // First Input Delay
  cls: number;  // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  domLoad: number;
  windowLoad: number;
  apiResponseTime: number;
}

// ============================================
// 浏览器性能指标收集
// ============================================
class PerformanceCollector {
  private metrics: PerformanceMetrics = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    domLoad: 0,
    windowLoad: 0,
    apiResponseTime: 0,
  };

  collect(): PerformanceMetrics {
    // 获取 Navigation Timing API 数据
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.domLoad = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      this.metrics.windowLoad = navigation.loadEventEnd - navigation.fetchStart;
    }

    // 获取 Paint Timing API 数据
    const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      this.metrics.fcp = fcpEntry.startTime;
    }

    // 获取 LCP 数据
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as LargestContentfulPaint[];
    if (lcpEntries.length > 0) {
      this.metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;
    }

    // 获取 FID 数据
    const fidEntries = performance.getEntriesByType('first-input') as PerformanceEventTiming[];
    if (fidEntries.length > 0) {
      this.metrics.fid = fidEntries[0].processingStart - fidEntries[0].startTime;
    }

    // 获取 CLS 数据
    const layoutShiftEntries = performance.getEntriesByType('layout-shift');
    if (layoutShiftEntries.length > 0) {
      this.metrics.cls = layoutShiftEntries.reduce((sum, entry: any) => sum + (entry.value || 0), 0);
    }

    return this.metrics;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 测量 API 响应时间
  async measureApiCall(apiUrl: string): Promise<number> {
    const startTime = performance.now();
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        await response.json();
      }
      const endTime = performance.now();
      this.metrics.apiResponseTime = endTime - startTime;
      return this.metrics.apiResponseTime;
    } catch (error) {
      console.error('API调用失败:', error);
      return -1;
    }
  }

  // 批量测量 API
  async measureBatchApiCalls(apiUrls: string[]): Promise<{ times: number[]; average: number; max: number; min: number }> {
    const times: number[] = [];
    
    for (const url of apiUrls) {
      const time = await this.measureApiCall(url);
      if (time > 0) {
        times.push(time);
      }
    }

    return {
      times,
      average: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      max: times.length > 0 ? Math.max(...times) : 0,
      min: times.length > 0 ? Math.min(...times) : 0,
    };
  }
}

// ============================================
// 性能测试报告生成
// ============================================
function generateReport(metrics: PerformanceMetrics, apiMetrics: any): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                   📊 前端性能测试报告');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // FCP 评估
  console.log('⏱️  页面加载指标:');
  console.log(`   首次内容绘制 (FCP):  ${metrics.fcp.toFixed(2)}ms`);
  if (metrics.fcp > 3000) {
    issues.push(`FCP超过3秒: ${metrics.fcp.toFixed(2)}ms`);
    console.log(`   ❌ FCP 性能较差 (目标: <1.8s)`);
  } else if (metrics.fcp > 1800) {
    console.log(`   ⚠️  FCP 需要优化 (目标: <1.8s)`);
  } else {
    console.log(`   ✅ FCP 性能良好 (目标: <1.8s)`);
  }

  // LCP 评估
  console.log(`   最大内容绘制 (LCP):  ${metrics.lcp.toFixed(2)}ms`);
  if (metrics.lcp > 4000) {
    issues.push(`LCP超过4秒: ${metrics.lcp.toFixed(2)}ms`);
    console.log(`   ❌ LCP 性能较差 (目标: <2.5s)`);
  } else if (metrics.lcp > 2500) {
    console.log(`   ⚠️  LCP 需要优化 (目标: <2.5s)`);
  } else {
    console.log(`   ✅ LCP 性能良好 (目标: <2.5s)`);
  }

  // FID 评估
  console.log(`   首次输入延迟 (FID):  ${metrics.fid.toFixed(2)}ms`);
  if (metrics.fid > 300) {
    issues.push(`FID超过300ms: ${metrics.fid.toFixed(2)}ms`);
    console.log(`   ❌ FID 性能较差 (目标: <100ms)`);
  } else if (metrics.fid > 100) {
    console.log(`   ⚠️  FID 需要优化 (目标: <100ms)`);
  } else {
    console.log(`   ✅ FID 性能良好 (目标: <100ms)`);
  }

  // CLS 评估
  console.log(`   累积布局偏移 (CLS): ${metrics.cls.toFixed(4)}`);
  if (metrics.cls > 0.25) {
    issues.push(`CLS超过0.25: ${metrics.cls.toFixed(4)}`);
    console.log(`   ❌ CLS 性能较差 (目标: <0.1)`);
  } else if (metrics.cls > 0.1) {
    console.log(`   ⚠️  CLS 需要优化 (目标: <0.1)`);
  } else {
    console.log(`   ✅ CLS 性能良好 (目标: <0.1)`);
  }

  // API 响应时间
  if (apiMetrics) {
    console.log('\n🌐 API 响应时间:');
    console.log(`   平均响应时间: ${apiMetrics.average.toFixed(2)}ms`);
    console.log(`   最大响应时间: ${apiMetrics.max.toFixed(2)}ms`);
    console.log(`   最小响应时间: ${apiMetrics.min.toFixed(2)}ms`);
    
    if (apiMetrics.average > 2000) {
      issues.push(`API平均响应时间超过2秒: ${apiMetrics.average.toFixed(2)}ms`);
      console.log(`   ❌ API 响应时间过长`);
    } else if (apiMetrics.average > 1000) {
      console.log(`   ⚠️  API 响应时间偏高`);
    } else {
      console.log(`   ✅ API 响应时间正常`);
    }
  }

  // DOM 和 Window Load
  console.log('\n📦 资源加载时间:');
  console.log(`   DOM Ready:    ${metrics.domLoad.toFixed(2)}ms`);
  console.log(`   Window Load:  ${metrics.windowLoad.toFixed(2)}ms`);

  console.log('\n═══════════════════════════════════════════════════════════════');

  if (issues.length === 0) {
    console.log('                     ✅ 测试通过 - 所有指标达标');
    console.log('═══════════════════════════════════════════════════════════════\n');
    return { passed: true, issues: [] };
  } else {
    console.log(`             ❌ 测试发现问题 - 发现 ${issues.length} 项性能问题`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    return { passed: false, issues };
  }
}

// ============================================
// 导出类和函数供测试使用
// ============================================
export { PerformanceCollector, generateReport };
export type { PerformanceMetrics };
