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

const retryCount = ref(0);
const maxRetries = 3;
const hasFailed = ref(false);

const currentSrc = computed(() => {
  if (hasFailed.value) return props.fallback || '/images/default-avatar.png';
  return props.src || props.fallback || '/images/default-avatar.png';
});

function onError() {
  retryCount.value++;
  if (retryCount.value <= maxRetries) {
    // 延迟重试，递增间隔
    setTimeout(() => {
      const img = new Image();
      img.src = props.src;
      img.onload = () => { hasFailed.value = false; };
      img.onerror = () => { if (retryCount.value >= maxRetries) hasFailed.value = true; };
    }, retryCount.value * 500);
  } else {
    hasFailed.value = true;
  }
}

function onLoad() {
  retryCount.value = 0;
}
</script>
