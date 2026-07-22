/**
 * 筑见山河 - 增强检查开关组件
 * 符合Web可访问性标准，支持键盘操作与屏幕阅读器
 */

<template>
  <div class="enhanced-check-wrapper">
    <button
      class="enhanced-check-toggle"
      role="switch"
      :aria-checked="isEnabled"
      :aria-describedby="tooltipId"
      :disabled="disabled || isLoading"
      @click="toggle"
      @keydown.space.prevent="toggle"
      @keydown.enter.prevent="toggle"
      @mouseenter="showTooltip"
      @mouseleave="hideTooltip"
      @focus="showTooltip"
      @blur="hideTooltip"
    >
      <span class="toggle-track" :class="{ enabled: isEnabled, disabled: disabled || isLoading }">
        <span class="toggle-thumb"></span>
      </span>
      <span class="toggle-label">
        <span class="toggle-text">{{ isEnabled ? '增强检查模式' : '标准模式' }}</span>
        <span v-if="isLoading" class="loading-indicator">
          <svg class="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10" />
          </svg>
        </span>
      </span>
    </button>
    
    <!-- 工具提示 -->
    <Transition name="tooltip-fade">
      <div 
        v-if="showTip && tooltipText"
        :id="tooltipId"
        class="tooltip"
        role="tooltip"
        :style="tooltipStyle"
      >
        {{ tooltipText }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('EnhancedCheckToggle');

// Props定义
interface Props {
  modelValue?: boolean;
  disabled?: boolean;
  tooltipText?: string;
  persistKey?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  tooltipText: '思考时间将大幅度增加',
  persistKey: 'atca_enhanced_check',
  loading: false,
});

// Emits定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', value: boolean): void;
}>();

// 状态
const isEnabled = ref(props.modelValue);
const showTip = ref(false);
const isLoading = ref(props.loading);
let showTimeout: number | null = null;
let hideTimeout: number | null = null;

// Tooltip ID
const tooltipId = `enhanced-check-tooltip-${Date.now()}`;

// Tooltip样式
const tooltipStyle = ref({
  position: 'absolute' as const,
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginTop: '8px',
  zIndex: 1000,
});

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  isEnabled.value = newVal;
});

watch(() => props.loading, (newVal) => {
  isLoading.value = newVal;
});

// 切换状态
function toggle() {
  if (props.disabled || isLoading.value) return;
  
  isEnabled.value = !isEnabled.value;
  emit('update:modelValue', isEnabled.value);
  emit('change', isEnabled.value);
  
  // 持久化到localStorage
  try {
    localStorage.setItem(props.persistKey, JSON.stringify({
      enabled: isEnabled.value,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to persist enhanced check state:', e);
  }
}

// 显示提示（500ms延迟）
function showTooltip() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
  
  showTimeout = window.setTimeout(() => {
    showTip.value = true;
  }, 500);
}

// 隐藏提示（200ms延迟）
function hideTooltip() {
  if (showTimeout) {
    clearTimeout(showTimeout);
    showTimeout = null;
  }
  
  hideTimeout = window.setTimeout(() => {
    showTip.value = false;
  }, 200);
}

// 从localStorage恢复状态
onMounted(() => {
  try {
    const saved = localStorage.getItem(props.persistKey);
    if (saved) {
      const data = JSON.parse(saved);
      // 状态在24小时内有效
      if (Date.now() - data.timestamp < 86400000) {
        isEnabled.value = data.enabled;
        emit('update:modelValue', data.enabled);
      }
    }
  } catch (e) {
    console.warn('Failed to restore enhanced check state:', e);
  }
});

// 清理定时器
onUnmounted(() => {
  if (showTimeout) {
    memTrack.untrackTimer('enhanced-check-show');
    clearTimeout(showTimeout);
  }
  if (hideTimeout) {
    memTrack.untrackTimer('enhanced-check-hide');
    clearTimeout(hideTimeout);
  }
});
</script>

<style scoped>
.enhanced-check-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.enhanced-check-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  font-size: 12px;
  color: rgba(255,255,255,0.9);
  min-width: 100px;
}

.enhanced-check-toggle:hover:not(:disabled) {
  background: rgba(255,255,255,0.25);
  border-color: rgba(255,215,0,0.5);
}

.enhanced-check-toggle:focus {
  outline: 2px solid rgba(255,215,0,0.6);
  outline-offset: 2px;
}

.enhanced-check-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-track {
  position: relative;
  width: 32px;
  height: 18px;
  background: rgba(255,255,255,0.3);
  border-radius: 9px;
  transition: background 0.3s ease;
  flex-shrink: 0;
}

.toggle-track.enabled {
  background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
}

.toggle-track.disabled {
  background: rgba(255,255,255,0.2);
}

.toggle-thumb {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-track.enabled .toggle-thumb {
  transform: translateX(14px);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toggle-text {
  font-weight: 500;
}

.loading-indicator {
  display: flex;
  align-items: center;
}

.spinner {
  width: 14px;
  height: 14px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 工具提示样式 */
.tooltip {
  background-color: #F8F9FA;
  color: #333333;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  max-width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  white-space: normal;
}

.tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #E0E0E0;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid #F8F9FA;
}

/* 过渡动画 */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-4px);
}

</style>
