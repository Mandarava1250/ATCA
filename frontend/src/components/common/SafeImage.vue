<template>
  <div class="safe-image-container" :class="{ 'image-loading': isLoading, 'image-failed': hasFailed }">
    <!-- 加载中状态 -->
    <div v-if="isLoading && !hasFailed" class="loading-spinner">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <circle class="spinner" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"/>
      </svg>
    </div>
    
    <!-- 图片 -->
    <img
      v-show="!hasFailed"
      :src="currentSrc"
      :alt="alt"
      :class="imgClass"
      :style="imgStyle"
      @error="onError"
      @load="onLoad"
    />
    
    <!-- 错误显示 -->
    <div v-if="hasFailed" class="error-fallback" :style="fallbackStyle">
      <slot name="fallback">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <span class="error-text">{{ errorText }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = withDefaults(defineProps<{
  src: string;
  alt?: string;
  fallback?: string;
  imgClass?: string;
  maxRetries?: number;
  retryDelay?: number;
  showError?: boolean;
  errorText?: string;
  timeout?: number; // 加载超时时间（毫秒）
}>(), {
  alt: 'Image',
  maxRetries: 3,
  retryDelay: 1000,
  showError: true,
  errorText: '图片加载失败',
  timeout: 2000 // 默认2秒超时
});

const emit = defineEmits<{
  (e: 'error', error: Error): void;
  (e: 'load'): void;
  (e: 'timeout'): void;
}>();

const retryCount = ref(0);
const isLoading = ref(true);
const hasFailed = ref(false);
const error = ref<Error | null>(null);
const timeoutTimer = ref<number | null>(null);
const loadStartTime = ref<number>(0);

/**
 * 清除超时定时器
 */
const clearTimeoutTimer = () => {
  if (timeoutTimer.value) {
    window.clearTimeout(timeoutTimer.value);
    timeoutTimer.value = null;
  }
};

/**
 * 设置加载超时定时器
 */
const setLoadTimeout = () => {
  clearTimeoutTimer();
  loadStartTime.value = Date.now();
  
  timeoutTimer.value = window.setTimeout(() => {
    if (isLoading.value && !hasFailed.value) {
      console.warn(`[SafeImage] Image load timeout after ${props.timeout}ms: ${props.src}`);
      error.value = new Error(`Image load timeout: ${props.src}`);
      hasFailed.value = true;
      isLoading.value = false;
      clearTimeoutTimer();
      emit('timeout');
      emit('error', error.value!);
    }
  }, props.timeout);
};

/**
 * 当前显示的图片地址
 */
const currentSrc = computed(() => {
  if (hasFailed.value && props.fallback) {
    return props.fallback;
  }
  if (!props.src || props.src === 'null' || props.src === 'undefined') {
    return props.fallback || '';
  }
  return props.src;
});

/**
 * 容器样式
 */
const imgStyle = computed(() => {
  return {};
});

/**
 * 错误回退样式
 */
const fallbackStyle = computed(() => {
  return {};
});

/**
 * 图片加载失败处理
 */
const onError = (e: Event) => {
  clearTimeoutTimer();
  const target = e.target as HTMLImageElement;
  error.value = new Error(`Image load failed: ${props.src}`);
  
  if (retryCount.value < props.maxRetries) {
    retryCount.value++;
    isLoading.value = true;
    
    setTimeout(() => {
      // 重新设置超时定时器
      setLoadTimeout();
      target.src = props.src;
    }, props.retryDelay * retryCount.value);
  } else {
    hasFailed.value = true;
    isLoading.value = false;
    emit('error', error.value!);
  }
};

/**
 * 图片加载成功处理
 */
const onLoad = () => {
  clearTimeoutTimer();
  const loadTime = Date.now() - loadStartTime.value;
  console.log(`[SafeImage] Image loaded in ${loadTime}ms: ${props.src}`);
  isLoading.value = false;
  hasFailed.value = false;
  emit('load');
};

// 监听src变化，重置状态并设置超时
watch(() => props.src, (newSrc) => {
  if (newSrc && newSrc !== 'null' && newSrc !== 'undefined') {
    isLoading.value = true;
    hasFailed.value = false;
    retryCount.value = 0;
    error.value = null;
    setLoadTimeout();
  }
});

// 组件挂载时设置超时
onMounted(() => {
  if (props.src && props.src !== 'null' && props.src !== 'undefined') {
    setLoadTimeout();
  }
});

// 组件卸载时清除定时器
onUnmounted(() => {
  clearTimeoutTimer();
});
</script>

<style scoped>
.safe-image-container {
  position: relative;
  display: inline-block;
}

.safe-image-container img {
  display: block;
  max-width: 100%;
  height: auto;
}

/* 加载中状态 */
.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--text-muted);
  z-index: 1;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.image-failed img {
  display: none;
}

.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border: 1px dashed var(--border);
  border-radius: var(--r-md);
  min-height: 100px;
  min-width: 100px;
}

.error-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
}

.error-text {
  font-size: 0.75rem;
}

/* 响应式调整 */
@media screen and (max-width: 599px) {
  .error-fallback {
    min-height: 80px;
    min-width: 80px;
  }
  
  .error-icon svg {
    width: 32px;
    height: 32px;
  }
  
  .error-text {
    font-size: 0.6875rem;
  }
}
</style>