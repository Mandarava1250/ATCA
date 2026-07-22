<template>
  <div class="sync-status-indicator" :class="statusClass" @click="toggleDetails" :title="tooltipText">
    <!-- 连接状态圆点 -->
    <span class="sync-dot" :class="statusClass"></span>
    <span class="sync-label">{{ statusLabel }}</span>

    <!-- 展开详情 -->
    <div v-if="showDetails" class="sync-details" @click.stop>
      <div class="sync-detail-row">
        <span class="detail-label">同步服务</span>
        <span class="detail-value" :class="statusClass">{{ statusLabel }}</span>
      </div>
      <div class="sync-detail-row" v-if="isConnected">
        <span class="detail-label">延迟</span>
        <span class="detail-value">{{ syncLatency }}ms</span>
      </div>
      <div class="sync-detail-row" v-if="pendingCount > 0">
        <span class="detail-label">待同步</span>
        <span class="detail-value warning">{{ pendingCount }} 条</span>
      </div>
      <div class="sync-detail-row" v-if="lastSyncTime">
        <span class="detail-label">上次同步</span>
        <span class="detail-value">{{ lastSyncTime }}</span>
      </div>
      <div class="sync-detail-row" v-if="syncError">
        <span class="detail-label">错误</span>
        <span class="detail-value error">{{ syncError }}</span>
      </div>
      <div class="sync-actions">
        <button v-if="pendingCount > 0" class="sync-retry-btn" @click.stop="handleRetry" :disabled="retrying">
          {{ retrying ? '同步中...' : '手动同步' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getSyncService } from '@/utils/syncService';
import { useCheckinStore } from '@/stores';

const checkinStore = useCheckinStore();
const showDetails = ref(false);
const retrying = ref(false);
const syncLatency = ref(0);
const lastSyncTime = ref('');
const syncError = ref('');
const isConnected = ref(false);
const isHealthy = ref(false);
const pendingCount = computed(() => checkinStore.pendingCheckins.length);

let healthInterval: ReturnType<typeof setInterval> | null = null;

const statusClass = computed(() => {
  if (pendingCount.value > 0) return 'warning';
  if (isConnected.value && isHealthy.value) return 'connected';
  if (isConnected.value && !isHealthy.value) return 'degraded';
  return 'disconnected';
});

const statusLabel = computed(() => {
  if (pendingCount.value > 0) return '待同步';
  if (isConnected.value && isHealthy.value) return '已同步';
  if (isConnected.value && !isHealthy.value) return '连接不稳定';
  return '未连接';
});

const tooltipText = computed(() => {
  const lines = [`状态: ${statusLabel.value}`];
  if (syncLatency.value > 0) lines.push(`延迟: ${syncLatency.value}ms`);
  if (pendingCount.value > 0) lines.push(`待同步: ${pendingCount.value} 条`);
  return lines.join(' | ');
});

function toggleDetails() {
  showDetails.value = !showDetails.value;
}

function updateHealth() {
  try {
    const syncService = getSyncService();
    const health = syncService.getHealthStatus();
    isConnected.value = health.connected;
    isHealthy.value = health.healthy;
    syncLatency.value = health.latency;
    syncError.value = checkinStore.syncError || '';

    const cacheTime = parseInt(localStorage.getItem('atca_checkin_sync_time') || '0');
    if (cacheTime > 0) {
      lastSyncTime.value = new Date(cacheTime).toLocaleTimeString('zh-CN');
    } else {
      lastSyncTime.value = '';
    }
  } catch {
    isConnected.value = false;
    isHealthy.value = false;
  }
}

async function handleRetry() {
  retrying.value = true;
  try {
    await checkinStore.syncPending();
    await checkinStore.loadCheckin(true);
    updateHealth();
  } catch { /* ignore */ }
  retrying.value = false;
  showDetails.value = false;
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.sync-status-indicator')) {
    showDetails.value = false;
  }
}

onMounted(() => {
  updateHealth();
  healthInterval = setInterval(updateHealth, 5000);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  if (healthInterval) {
    clearInterval(healthInterval);
    healthInterval = null;
  }
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.sync-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  cursor: pointer;
  position: relative;
  user-select: none;
  transition: background var(--t-fast);
  font-size: 0.75rem;
}
.sync-status-indicator:hover {
  background: var(--bg-hover);
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background var(--t-fast), box-shadow var(--t-fast);
}
.sync-dot.connected {
  background: #7CB342;
  box-shadow: 0 0 6px rgba(124, 179, 66, 0.5);
}
.sync-dot.degraded {
  background: #FDD835;
  box-shadow: 0 0 6px rgba(253, 216, 53, 0.5);
  animation: pulse 1.5s ease-in-out infinite;
}
.sync-dot.warning {
  background: #FF8A65;
  box-shadow: 0 0 6px rgba(255, 138, 101, 0.5);
  animation: pulse 1s ease-in-out infinite;
}
.sync-dot.disconnected {
  background: #9E9E9E;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.sync-label {
  color: var(--text-muted);
  font-size: 0.6875rem;
  font-weight: 500;
}

.sync-details {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 12px 16px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  animation: slideDown 0.15s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.sync-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.8125rem;
}
.detail-label {
  color: var(--text-muted);
}
.detail-value {
  color: var(--text);
  font-weight: 500;
}
.detail-value.warning {
  color: #FF8A65;
}
.detail-value.error {
  color: #EF5350;
}

.sync-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
.sync-retry-btn {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid var(--gold-dim);
  border-radius: var(--r-md);
  background: transparent;
  color: var(--gold);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--t-fast);
}
.sync-retry-btn:hover:not(:disabled) {
  background: rgba(201, 169, 110, 0.1);
}
.sync-retry-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>