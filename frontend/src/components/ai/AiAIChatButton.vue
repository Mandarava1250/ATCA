<template>
  <button 
    v-if="shouldShow" 
    class="ai-float-btn" 
    :class="{ active: aiStore.isOpen }" 
    @click="aiStore.toggle" 
    :aria-label="aiStore.isOpen ? '关闭AI智能导览' : '打开AI智能导览'"
    :aria-expanded="aiStore.isOpen"
    :title="aiStore.isOpen ? '关闭AI智能导览' : '打开AI智能导览'"
  >
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
  z-index: 1500;
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
  border: 2px solid rgba(255, 255, 255, 0.1);
}
.ai-float-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(139, 37, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}
.ai-float-btn:active {
  transform: scale(1.02);
}
.ai-float-btn.active {
  background: var(--color-text);
  transform: rotate(90deg);
  border-color: rgba(255, 255, 255, 0.3);
}
.ai-float-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(201, 169, 110, 0.3), 0 6px 24px rgba(139, 37, 0, 0.4);
}

/* ===== 响应式适配 ===== */

/* 平板端 (768px - 1024px) */
@media screen and (max-width: 1024px) {
  .ai-float-btn {
    width: 52px;
    height: 52px;
    bottom: 24px;
    right: 24px;
  }
  
  .ai-float-btn svg {
    width: 26px;
    height: 26px;
  }
}

/* 移动端 (< 768px) */
@media screen and (max-width: 767px) {
  .ai-float-btn {
    width: 48px;
    height: 48px;
    bottom: 80px;
    right: 16px;
  }
  
  .ai-float-btn svg {
    width: 24px;
    height: 24px;
  }
}

/* 小屏移动端 (< 360px) */
@media screen and (max-width: 359px) {
  .ai-float-btn {
    width: 44px;
    height: 44px;
    bottom: 70px;
    right: 12px;
  }
  
  .ai-float-btn svg {
    width: 22px;
    height: 22px;
  }
}

/* 横屏模式优化 */
@media screen and (max-height: 500px) and (orientation: landscape) {
  .ai-float-btn {
    width: 44px;
    height: 44px;
    bottom: 16px;
    right: 20px;
  }
}
</style>
