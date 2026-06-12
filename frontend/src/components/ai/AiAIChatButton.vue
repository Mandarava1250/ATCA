<template>
  <button v-if="shouldShow" class="ai-float-btn" :class="{ active: aiStore.isOpen }" @click="aiStore.toggle" aria-label="AI助手">
    <svg v-if="!aiStore.isOpen" viewBox="0 0 24 24" width="28" height="28">
      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="#fff" fill="none" stroke-width="1.5"/>
    </svg>
    <svg v-else viewBox="0 0 24 24" width="24" height="24">
      <path d="M6 18L18 6M6 6l12 12" stroke="#fff" fill="none" stroke-width="2"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAIStore } from '@/stores';
const aiStore = useAIStore();
const route = useRoute();

const shouldShow = computed(() => {
  const hiddenPaths = ['/', '/splash'];
  return !hiddenPaths.includes(route.path);
});
</script>

<style scoped>
.ai-float-btn {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(139, 37, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.ai-float-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(139, 37, 0, 0.4);
}
.ai-float-btn.active {
  background: var(--color-text);
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .ai-float-btn { bottom: 16px; right: 16px; width: 48px; height: 48px; }
}
</style>
