<template>
  <div 
    class="safe-image-container" 
    :class="{ 
      'image-loading': isLoading, 
      'image-failed': hasFailed,
      'is-avatar': isAvatar,
      'is-rounded': rounded,
      'is-circle': circle,
    }"
    :style="containerStyle"
  >
    <!-- 加载中状态 — shimmer 光影动画 -->
    <div v-if="isLoading && !hasFailed" class="loading-shimmer"></div>
    
    <!-- 图片 -->
    <img
      v-show="!hasFailed && currentSrc"
      :src="currentSrc"
      :alt="alt"
      :class="imgClass"
      :style="imgStyle"
      @error="onError"
      @load="onLoad"
    />
    
    <!-- 错误回退显示 -->
    <div v-if="hasFailed || !currentSrc" class="error-fallback" :style="fallbackStyle">
      <slot name="fallback">
        <template v-if="fallbackType === 'initials'">
          <div class="initials-fallback">
            <span class="initials-text">{{ initialsText }}</span>
          </div>
        </template>
        <template v-else-if="fallbackType === 'icon'">
          <div class="icon-fallback">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        </template>
        <template v-else>
          <div class="default-fallback">
            <div class="error-icon-wrapper">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="error-text" v-if="showError">{{ localizedErrorText }}</span>
            <button v-if="showError && retryCount > 0" class="retry-btn" @click="retryLoad">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ t('common.retry') }}
            </button>
          </div>
        </template>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('SafeImage');
const { t } = useI18n();

const props = withDefaults(defineProps<{
  src: string;
  alt?: string;
  fallback?: string;
  imgClass?: string;
  maxRetries?: number;
  retryDelay?: number;
  showError?: boolean;
  errorText?: string;
  timeout?: number;
  isAvatar?: boolean;
  fallbackType?: 'default' | 'initials' | 'icon';
  initialsName?: string;
  rounded?: boolean;
  circle?: boolean;
  width?: string | number;
  height?: string | number;
}>(), {
  alt: '',
  maxRetries: 3,
  retryDelay: 1000,
  showError: true,
  errorText: '',
  timeout: 2000,
  isAvatar: false,
  fallbackType: 'default',
  initialsName: '',
  rounded: false,
  circle: false,
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
    memTrack.untrackTimer('safe-image-timeout');
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
  memTrack.trackTimer('safe-image-timeout', timeoutTimer.value!, props.timeout);
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
const containerStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    style.minWidth = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
    style.minHeight = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  return style;
});

/**
 * 图片样式
 */
const imgStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  if (props.circle) {
    style.borderRadius = '50%';
  } else if (props.rounded) {
    style.borderRadius = 'var(--r-md)';
  }
  return style;
});

/**
 * 错误回退样式
 */
const fallbackStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  return style;
});

/**
 * 国际化错误文本
 */
const localizedErrorText = computed(() => {
  return props.errorText || t('common.imageLoadFailed');
});

/**
 * 首字母文本
 */
const initialsText = computed(() => {
  const name = props.initialsName || props.alt || '';
  if (!name) return '?';
  const trimmed = name.trim();
  const parts = trimmed.split(/[\s_-]+/);
  let initials = '';
  
  if (parts.length >= 2) {
    initials = (parts[0][0] || '') + (parts[parts.length - 1][0] || '');
  } else {
    initials = trimmed.slice(0, 2);
  }
  
  return initials.toUpperCase();
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
    
    const retryHandle = setTimeout(() => {
      // 重新设置超时定时器
      setLoadTimeout();
      target.src = props.src;
    }, props.retryDelay * retryCount.value);
    memTrack.trackTimer('safe-image-retry', retryHandle as unknown as number, props.retryDelay * retryCount.value);
  } else {
    hasFailed.value = true;
    isLoading.value = false;
    emit('error', error.value!);
  }
};

/**
 * 手动重试加载
 */
const retryLoad = () => {
  if (!props.src) return;
  retryCount.value = 0;
  isLoading.value = true;
  hasFailed.value = false;
  error.value = null;
  setLoadTimeout();
  
  const img = document.createElement('img');
  img.onload = onLoad;
  img.onerror = onError as any;
  img.src = props.src;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.safe-image-container img {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: cover;
}

/* 头像模式 */
.is-avatar {
  background: var(--bg-hover);
  border-radius: 50%;
  overflow: hidden;
}

.is-avatar img {
  border-radius: 50%;
  object-fit: cover;
}

.is-rounded {
  border-radius: var(--r-md);
  overflow: hidden;
}

.is-rounded img {
  border-radius: var(--r-md);
}

.is-circle {
  border-radius: 50%;
  overflow: hidden;
}

.is-circle img {
  border-radius: 50%;
}

/* 加载中状态 — shimmer 光影动画 */
.loading-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(201, 169, 110, 0.06) 30%,
    rgba(201, 169, 110, 0.12) 50%,
    rgba(201, 169, 110, 0.06) 70%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 错误状态 */
.image-failed img {
  display: none;
}

.image-failed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--bg-hover);
  border-radius: inherit;
}

/* 默认错误回退 */
.default-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  padding: 12px;
  text-align: center;
}

.error-icon-wrapper {
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.default-fallback:hover .error-icon-wrapper {
  opacity: 0.7;
}

.default-fallback svg {
  width: 48px;
  height: 48px;
}

.error-text {
  font-size: 0.75rem;
  line-height: 1.4;
  max-width: 100%;
  word-break: break-word;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--gold);
  background: rgba(201, 169, 110, 0.1);
  border: 1px solid rgba(201, 169, 110, 0.3);
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: rgba(201, 169, 110, 0.2);
  border-color: var(--gold);
  transform: translateY(-1px);
}

.retry-btn:active {
  transform: translateY(0);
}

/* 首字母回退 */
.initials-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(201, 169, 110, 0.15);
  border-radius: inherit;
}

.initials-text {
  font-family: 'Noto Serif SC', 'STSong', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gold);
  text-transform: uppercase;
}

.is-avatar .initials-text {
  font-size: 2rem;
}

/* 图标回退 */
.icon-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--bg-hover);
  border-radius: inherit;
}

.icon-fallback svg {
  width: 48px;
  height: 48px;
  color: var(--text-muted);
}

.is-avatar .icon-fallback svg {
  width: 50%;
  height: 50%;
}

/* 响应式调整 */
@media screen and (max-width: 599px) {
  .default-fallback svg,
  .icon-fallback svg {
    width: 32px;
    height: 32px;
  }
  
  .error-text {
    font-size: 0.6875rem;
  }
  
  .is-avatar .initials-text {
    font-size: 1.5rem;
  }
}
</style>