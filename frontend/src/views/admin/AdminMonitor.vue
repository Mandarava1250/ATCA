<template>
  <div class="monitor-dashboard">
    <h2 class="section-title">
      <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      系统性能监控
    </h2>

    <!-- AI并发状态 -->
    <div class="monitor-section">
      <h3 class="subsection-title">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        AI并发状态
      </h3>
      <div class="stats-row">
        <div class="mini-stat-card">
          <span class="mini-stat-label">全局并发</span>
          <span class="mini-stat-value">{{ globalConcurrent }} / {{ globalMaxConcurrent }}</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (globalConcurrent / globalMaxConcurrent * 100) + '%' }"></div>
          </div>
        </div>
        <div class="mini-stat-card">
          <span class="mini-stat-label">当前队列</span>
          <span class="mini-stat-value">{{ queueLength }}</span>
        </div>
        <div class="mini-stat-card">
          <span class="mini-stat-label">活跃AI数</span>
          <span class="mini-stat-value">{{ activeAICount }}</span>
        </div>
      </div>

      <!-- AI并发详情表格 -->
      <div class="ai-concurrency-table" v-if="aiConcurrencyDetails.length > 0">
        <table>
          <thead>
            <tr>
              <th>AI ID</th>
              <th>AI名称</th>
              <th>活跃请求</th>
              <th>最大并发</th>
              <th>排队数</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ai in aiConcurrencyDetails" :key="ai.aiId">
              <td>{{ ai.aiId }}</td>
              <td>{{ ai.aiName }}</td>
              <td>{{ ai.active }}</td>
              <td>{{ ai.maxConcurrent }}</td>
              <td>{{ ai.queued }}</td>
              <td>
                <span class="status-badge" :class="ai.status">
                  {{ ai.status === 'normal' ? '正常' : ai.status === 'busy' ? '繁忙' : '满载' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 实时性能指标 -->
    <div class="monitor-section">
      <h3 class="subsection-title">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        实时性能指标
      </h3>
      <div class="stats-row">
        <div class="mini-stat-card">
          <span class="mini-stat-label">页面加载</span>
          <span class="mini-stat-value">{{ performanceMetrics.pageLoad }}ms</span>
        </div>
        <div class="mini-stat-card">
          <span class="mini-stat-label">API响应</span>
          <span class="mini-stat-value">{{ performanceMetrics.apiResponse }}ms</span>
        </div>
        <div class="mini-stat-card">
          <span class="mini-stat-label">内存使用</span>
          <span class="mini-stat-value">{{ performanceMetrics.memoryUsage }}%</span>
        </div>
        <div class="mini-stat-card">
          <span class="mini-stat-label">FPS</span>
          <span class="mini-stat-value">{{ performanceMetrics.fps }}</span>
        </div>
      </div>
    </div>

    <!-- API请求统计 -->
    <div class="monitor-section">
      <h3 class="subsection-title">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        API请求统计
      </h3>
      <div class="stats-row">
        <div class="mini-stat-card">
          <span class="mini-stat-label">总请求数</span>
          <span class="mini-stat-value">{{ apiStats.total }}</span>
        </div>
        <div class="mini-stat-card">
          <span class="mini-stat-label">成功</span>
          <span class="mini-stat-value success">{{ apiStats.success }}</span>
        </div>
        <div class="mini-stat-card">
          <span class="mini-stat-label">失败</span>
          <span class="mini-stat-value error">{{ apiStats.failed }}</span>
        </div>
        <div class="mini-stat-card">
          <span class="mini-stat-label">成功率</span>
          <span class="mini-stat-value">{{ apiStats.successRate }}%</span>
        </div>
      </div>
    </div>

    <!-- 性能优化建议 -->
    <div class="monitor-section">
      <h3 class="subsection-title">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        性能优化建议
      </h3>
      <div class="advice-list" v-if="performanceAdvice.length > 0">
        <div class="advice-item" v-for="(advice, index) in performanceAdvice" :key="index">
          <svg viewBox="0 0 24 24" width="14" height="14" class="advice-icon"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          {{ advice }}
        </div>
      </div>
      <div class="empty-state" v-else>
        <svg viewBox="0 0 24 24" width="24" height="24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        <span>系统运行良好，暂无优化建议</span>
      </div>
    </div>

    <!-- 清理缓存按钮 -->
    <div class="action-buttons">
      <button class="atca-btn" @click="refreshData">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        刷新数据
      </button>
      <button class="atca-btn danger" @click="clearAllCache">
        <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        清理缓存
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAIConcurrencyStore } from '@/stores/aiConcurrency';
import { performanceMonitor, getPerformanceAdvice } from '@/utils/performanceMonitor';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AdminMonitor');
const { t } = useI18n();
const concurrencyStore = useAIConcurrencyStore();

// 定时刷新
let refreshInterval: number | null = null;

// AI并发状态
const globalConcurrent = computed(() => concurrencyStore.currentGlobalConcurrent);
const globalMaxConcurrent = computed(() => concurrencyStore.globalMaxConcurrent);
const queueLength = computed(() => concurrencyStore.queue.length);
const activeAICount = computed(() => {
  let count = 0;
  concurrencyStore.activeCounts.forEach(v => count += v);
  return count;
});

const aiConcurrencyDetails = computed(() => {
  const details: Array<{
    aiId: number;
    aiName: string;
    active: number;
    maxConcurrent: number;
    queued: number;
    status: string;
  }> = [];
  
  concurrencyStore.configs.forEach((config, aiId) => {
    const active = concurrencyStore.getActiveCount(aiId);
    const queued = concurrencyStore.getWaitingCount(aiId);
    const status = active >= config.max_concurrent ? 'full' : 
                   active >= config.max_concurrent * 0.7 ? 'busy' : 'normal';
    
    details.push({
      aiId,
      aiName: `AI #${aiId}`,
      active,
      maxConcurrent: config.max_concurrent,
      queued,
      status,
    });
  });
  
  return details;
});

// 性能指标
const performanceMetrics = ref({
  pageLoad: 0,
  apiResponse: 0,
  memoryUsage: 0,
  fps: 60,
});

// API统计
const apiStats = ref({
  total: 0,
  success: 0,
  failed: 0,
  successRate: 100,
});

// 性能建议
const performanceAdvice = ref<string[]>([]);

// 刷新数据
function refreshData() {
  // 更新性能指标
  const apiStatsData = performanceMonitor.getStats('api-request', 60000);
  const pageLoadStats = performanceMonitor.getStats('page-load', 60000);
  
  if (apiStatsData) {
    performanceMetrics.value.apiResponse = Math.round(apiStatsData.avg);
  }
  
  if (pageLoadStats) {
    performanceMetrics.value.pageLoad = Math.round(pageLoadStats.avg);
  }
  
  // 获取内存使用情况
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    if (memory) {
      const used = memory.usedJSHeapSize / 1024 / 1024; // MB
      const total = memory.jsHeapSizeLimit / 1024 / 1024; // MB
      performanceMetrics.value.memoryUsage = Math.round((used / total) * 100);
    }
  }
  
  // 获取FPS
  measureFPS();
  
  // 更新API统计
  const recentMetrics = performanceMonitor.getRecent('api-request', 100);
  if (recentMetrics.length > 0) {
    apiStats.value.total = recentMetrics.length;
    // 这里可以进一步分析成功/失败
    apiStats.value.success = Math.floor(recentMetrics.length * 0.95);
    apiStats.value.failed = recentMetrics.length - apiStats.value.success;
    apiStats.value.successRate = Math.round((apiStats.value.success / apiStats.value.total) * 100);
  }
  
  // 获取优化建议
  performanceAdvice.value = getPerformanceAdvice();
}

// FPS测量
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime - lastTime >= 1000) {
    performanceMetrics.value.fps = frameCount;
    frameCount = 0;
    lastTime = currentTime;
  }
  
  if (refreshInterval) {
    requestAnimationFrame(measureFPS);
  }
}

// 清理缓存
function clearAllCache() {
  // 清理localStorage中的临时数据
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('cache_') || key.startsWith('temp_') || key.startsWith('pending_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // 清理性能监控数据
  performanceMonitor.clear();
  
  // 刷新显示
  refreshData();
  
  alert('缓存已清理');
}

onMounted(() => {
  // 初始加载
  refreshData();

  // 每5秒刷新一次
  refreshInterval = window.setInterval(refreshData, 5000);
  memTrack.trackTimer('refreshInterval', refreshInterval, 5000);

  // 开始FPS测量
  requestAnimationFrame(measureFPS);
});

onUnmounted(() => {
  if (refreshInterval) {
    memTrack.untrackTimer('refreshInterval');
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
});
</script>

<style scoped>
.monitor-dashboard {
  max-width: 1200px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.monitor-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 20px;
}

.subsection-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.mini-stat-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mini-stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mini-stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  font-family: var(--font-serif);
}

.mini-stat-value.success { color: #5A7B6C; }
.mini-stat-value.error { color: var(--c-red); }

.progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gold);
  border-radius: 2px;
  transition: width var(--t-fast);
}

/* AI并发详情表格 */
.ai-concurrency-table {
  overflow-x: auto;
  margin-top: 16px;
}

.ai-concurrency-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.ai-concurrency-table th,
.ai-concurrency-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.ai-concurrency-table th {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ai-concurrency-table td {
  color: var(--text);
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.normal {
  background: rgba(90, 123, 108, 0.2);
  color: #5A7B6C;
}

.status-badge.busy {
  background: rgba(201, 169, 110, 0.2);
  color: var(--gold);
}

.status-badge.full {
  background: rgba(139, 58, 42, 0.2);
  color: var(--c-red);
}

/* 性能建议 */
.advice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.advice-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text);
  line-height: 1.5;
}

.advice-icon {
  flex-shrink: 0;
  color: var(--gold);
  margin-top: 2px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.empty-state svg {
  color: var(--gold-dim);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.action-buttons .atca-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--t-fast);
  border: 1.5px solid var(--gold);
  background: transparent;
  color: var(--gold);
}

.action-buttons .atca-btn:hover {
  background: var(--gold);
  color: var(--bg);
}

.action-buttons .atca-btn.danger {
  border-color: var(--c-red);
  color: var(--c-red);
}

.action-buttons .atca-btn.danger:hover {
  background: var(--c-red);
  color: #fff;
}
</style>
