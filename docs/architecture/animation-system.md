# 华夏营造 - 页面转场动画系统

## 概述

华夏营造项目采用现代化的页面转场动画系统，基于 Vue.js 3 和 CSS3 动画实现流畅的页面切换效果。动画系统支持多种动画类型，可根据不同场景灵活配置。

---

## 动画类型

### 1. 淡入淡出 (Fade)

**适用场景**: 页面内容差异较大的场景

```typescript
import { useAnimation } from '@/composables/useAnimation';

const { animateFade } = useAnimation();

// 使用示例
await animateFade({
  element: document.getElementById('app'),
  duration: 300,
  direction: 'in' // 'in' | 'out'
});
```

### 2. 滑动 (Slide)

**适用场景**: 内容相关的页面切换

```typescript
import { useAnimation } from '@/composables/useAnimation';

const { animateSlide } = useAnimation();

// 从右侧滑入
await animateSlide({
  element: document.getElementById('content'),
  direction: 'right', // 'left' | 'right' | 'top' | 'bottom'
  duration: 400
});
```

### 3. 缩放 (Scale)

**适用场景**: 模态框、弹窗等组件

```typescript
import { useAnimation } from '@/composables/useAnimation';

const { animateScale } = useAnimation();

// 缩放动画
await animateScale({
  element: document.getElementById('modal'),
  from: 0.8,
  to: 1,
  duration: 250
});
```

### 4. 旋转 (Rotate)

**适用场景**: 特殊效果、图标动画

```typescript
import { useAnimation } from '@/composables/useAnimation';

const { animateRotate } = useAnimation();

// 360度旋转
await animateRotate({
  element: document.getElementById('icon'),
  degrees: 360,
  duration: 1000
});
```

### 5. 组合动画 (Combine)

**适用场景**: 需要多种效果叠加的场景

```typescript
import { useAnimation } from '@/composables/useAnimation';

const { animateCombine } = useAnimation();

// 同时执行淡入和缩放
await animateCombine([
  {
    type: 'fade',
    options: { duration: 300 }
  },
  {
    type: 'scale',
    options: { from: 0.9, to: 1, duration: 300 }
  }
], document.getElementById('container'));
```

---

## 动画配置

### 默认配置

```typescript
// 默认动画配置
const defaultAnimationConfig = {
  duration: 300,           // 动画时长(ms)
  easing: 'ease-out',      // 缓动函数
  delay: 0,                // 延迟执行(ms)
  fillMode: 'forwards',    // 动画结束后状态
  iterationCount: 1        // 循环次数
};
```

### 缓动函数支持

| 缓动函数 | 说明 | 适用场景 |
|---------|------|----------|
| `linear` | 线性 | 匀速移动 |
| `ease` | 缓入缓出 | 默认 |
| `ease-in` | 缓入 | 退出动画 |
| `ease-out` | 缓出 | 进入动画 |
| `ease-in-out` | 缓入缓出 | 对称动画 |
| `cubic-bezier(x1,y1,x2,y2)` | 自定义 | 精细控制 |

---

## 路由过渡组件

### 基础用法

```vue
<!-- App.vue -->
<router-view v-slot="{ Component }">
  <transition name="fade" mode="out-in">
    <component :is="Component" />
  </transition>
</router-view>
```

### 自定义过渡

```vue
<!-- App.vue -->
<router-view v-slot="{ Component, route }">
  <transition :name="getTransitionName(route)" mode="out-in">
    <component :is="Component" />
  </transition>
</router-view>
```

```typescript
// 动态选择过渡效果
function getTransitionName(route: RouteLocation) {
  const transitionMap: Record<string, string> = {
    'architecture-detail': 'slide-left',
    'quiz': 'scale',
    'profile': 'fade'
  };
  return transitionMap[route.name as string] || 'fade';
}
```

---

## CSS动画类

### 通用动画类

```css
/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑入 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.4s ease-out;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 缩放 */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.25s ease;
}

.scale-enter-from {
  transform: scale(0.8);
  opacity: 0;
}

.scale-leave-to {
  transform: scale(0.8);
  opacity: 0;
}
```

### 弹性动画

```css
.bounce-enter-active {
  animation: bounce-in 0.5s ease;
}

.bounce-leave-active {
  animation: bounce-in 0.3s ease reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## 动画工具函数

### useAnimation Composable

```typescript
// src/composables/useAnimation.ts
import { ref } from 'vue';

export function useAnimation() {
  const isAnimating = ref(false);

  const animateFade = async (options: {
    element: HTMLElement;
    duration?: number;
    direction?: 'in' | 'out';
  }) => {
    isAnimating.value = true;
    const { element, duration = 300, direction = 'in' } = options;
    
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = direction === 'in' ? '0' : '1';
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    element.style.opacity = direction === 'in' ? '1' : '0';
    
    await new Promise(resolve => setTimeout(resolve, duration));
    isAnimating.value = false;
  };

  // ... 其他动画方法

  return {
    isAnimating,
    animateFade,
    animateSlide,
    animateScale,
    animateRotate,
    animateCombine
  };
}
```

---

## 性能优化

### 硬件加速

```css
/* 使用GPU加速 */
.animate-element {
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform, opacity;
}
```

### 避免重排

```typescript
// 使用transform代替width/height
// 推荐
element.style.transform = 'scale(1.2)';

// 不推荐
element.style.width = '120%';
```

### 节流动画

```typescript
// requestAnimationFrame节流
function animateWithRAF(callback: () => void) {
  let requestId: number;
  
  const animate = () => {
    callback();
    requestId = requestAnimationFrame(animate);
  };
  
  requestId = requestAnimationFrame(animate);
  
  return () => {
    cancelAnimationFrame(requestId);
  };
}
```

---

## 高级动画组件

### 列表过渡

```vue
<!-- ListTransition.vue -->
<template>
  <transition-group name="list">
    <div
      v-for="item in items"
      :key="item.id"
      class="list-item"
    >
      {{ item.name }}
    </div>
  </transition-group>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
```

### 交错动画

```vue
<!-- StaggerAnimation.vue -->
<template>
  <div class="stagger-container">
    <transition-group name="stagger">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        :style="{ '--delay': `${index * 100}ms` }"
        class="stagger-item"
      >
        {{ item.name }}
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.stagger-enter-active {
  transition: all 0.5s ease;
  transition-delay: var(--delay);
}

.stagger-leave-active {
  transition: all 0.3s ease;
}

.stagger-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.stagger-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
```

---

## 使用示例

### 页面级动画

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue'),
      meta: { transition: 'fade' }
    },
    {
      path: '/architecture/:id',
      name: 'architecture-detail',
      component: () => import('@/views/ArchitectureDetail.vue'),
      meta: { transition: 'slide-left' }
    }
  ]
});

// 动态过渡效果
router.beforeEach((to, from) => {
  const toDepth = to.path.split('/').length;
  const fromDepth = from.path.split('/').length;
  to.meta.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left';
});
```

### 组件级动画

```vue
<!-- Modal.vue -->
<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="close">
        <div class="modal-content" @click.stop>
          <slot></slot>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const close = () => {
  emit('close');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-width: 320px;
  max-width: 90vw;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9) translateY(20px);
}
</style>
```

### 3D模型加载动画

```vue
<!-- ModelLoader.vue -->
<template>
  <div class="model-loader">
    <transition name="loader">
      <div v-if="isLoading" class="loading-spinner">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
    </transition>
    <transition name="model">
      <div v-if="!isLoading" class="model-container">
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isLoading: boolean;
}>();
</script>

<style scoped>
.model-loader {
  position: relative;
  width: 100%;
  height: 400px;
}

.loading-spinner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-enter-active,
.loader-leave-active {
  transition: opacity 0.3s ease;
}

.loader-enter-from,
.loader-leave-to {
  opacity: 0;
}

.model-enter-active {
  animation: model-appear 0.5s ease-out;
}

@keyframes model-appear {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
```

---

## 性能优化进阶

### 动画性能监控

```typescript
// src/utils/animationPerf.ts
export function measureAnimationPerformance(element: HTMLElement, animationName: string) {
  const startTime = performance.now();
  
  const observer = new PerformanceObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.entryType === 'animation') {
        const duration = entry.duration;
        const startTime = entry.startTime;
        console.log(`${animationName} animation:`, {
          duration,
          startTime,
          element: element.tagName
        });
      }
    });
  });
  
  observer.observe({ type: 'animation', buffered: true });
  
  return () => {
    observer.disconnect();
    const endTime = performance.now();
    console.log(`${animationName} total time:`, endTime - startTime);
  };
}
```

### 条件动画

```typescript
// 根据设备性能调整动画
export function getAnimationDuration(baseDuration: number): number {
  const performance = window.performance || { hardwareConcurrency: 4 };
  const cores = performance.hardwareConcurrency || 4;
  
  if (cores <= 2) {
    return baseDuration * 0.5; // 低性能设备使用更快的动画
  }
  return baseDuration;
}
```

---

## 最佳实践

### 1. 保持一致性
- 同类页面使用相同的过渡效果
- 保持动画时长一致（200-400ms）

### 2. 避免过度动画
- 只在必要时使用动画
- 避免动画叠加过多

### 3. 考虑用户体验
- 提供动画关闭选项
- 支持减少动画模式（prefers-reduced-motion）

```css
/* 尊重用户的动画偏好设置 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```