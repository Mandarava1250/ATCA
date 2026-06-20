<template>
  <img
    :src="currentSrc"
    :alt="alt"
    :class="imgClass"
    @error="onError"
    @load="onLoad"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  src: string;
  alt?: string;
  fallback?: string;
  imgClass?: string;
}>();

const emit = defineEmits<{
  (e: 'error'): void;
  (e: 'load'): void;
}>();

const retryCount = ref(0);
const maxRetries = 3;
const hasFailed = ref(false);

/**
 * 默认头像 - 使用内联 SVG，避免外部资源依赖
 */
const defaultAvatarSvg = `data:image/svg+xml,
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <circle cx="50" cy="50" r="45" fill="%23f0f0f0" stroke="%23ddd" stroke-width="2"/>
  <circle cx="50" cy="35" r="12" fill="%23ddd"/>
  <circle cx="42" cy="32" r="2" fill="%23666"/>
  <circle cx="58" cy="32" r="2" fill="%23666"/>
  <path d="M40 55 Q50 65 60 55" stroke="%23666" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="50" cy="75" rx="18" ry="12" fill="%23ddd"/>
</svg>`;

/**
 * 当前显示的图片地址
 */
const currentSrc = computed(() => {
  if (hasFailed.value) {
    return props.fallback || defaultAvatarSvg;
  }
  if (!props.src || props.src === 'null' || props.src === 'undefined') {
    return props.fallback || defaultAvatarSvg;
  }
  return props.src;
});

/**
 * 图片加载失败处理
 */
function onError() {
  retryCount.value++;
  emit('error');
  
  if (retryCount.value <= maxRetries) {
    // 延迟重试，递增间隔
    setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        hasFailed.value = false;
      };
      img.onerror = () => {
        if (retryCount.value >= maxRetries) {
          hasFailed.value = true;
        }
      };
      img.src = props.src;
    }, retryCount.value * 500);
  } else {
    hasFailed.value = true;
  }
}

/**
 * 图片加载成功处理
 */
function onLoad() {
  retryCount.value = 0;
  hasFailed.value = false;
  emit('load');
}
</script>

<style scoped>
img {
  display: block;
}
</style>
