<template>
  <Teleport to="body">
    <div class="mobile-nav-menu-wrapper">
      <!-- 遮罩层 -->
      <Transition :name="overlayTransitionName">
        <div 
          v-if="isOpen"
          class="mobile-nav-overlay"
          :class="{ 'touch-enabled': enableTouchClose }"
          @click="handleOverlayClick"
          @touchstart="handleOverlayTouchStart"
          @touchend="handleOverlayTouchEnd"
          @touchcancel="handleOverlayTouchEnd"
          @mousedown="handleOverlayMouseDown"
          @mouseup="handleOverlayMouseUp"
        ></div>
      </Transition>

      <!-- 导航菜单 -->
      <Transition
        :name="menuTransitionName"
        @after-enter="handleAfterEnter"
        @after-leave="handleAfterLeave"
      >
        <div 
          v-if="isOpen"
          ref="menuRef"
          :class="menuClasses"
          :style="menuDynamicStyle"
          @touchstart="handleMenuTouchStart"
          @touchmove="handleMenuTouchMove"
          @touchend="handleMenuTouchEnd"
          @touchcancel="handleMenuTouchEnd"
        >
          <!-- 头部 -->
          <div class="mobile-nav-header">
            <span class="mobile-nav-title">{{ title }}</span>
            <button 
              class="mobile-nav-close-btn"
              @click="close"
              :aria-label="closeLabel"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <!-- 导航内容 -->
          <nav class="mobile-nav-content">
            <slot name="nav-items">
              <!-- 默认导航项 -->
              <ul class="mobile-nav-list">
                <li v-for="item in defaultNavItems" :key="item.key">
                  <a 
                    :href="item.href" 
                    class="mobile-nav-link"
                    :class="{ active: item.active }"
                    @click.prevent="handleNavItemClick(item)"
                  >
                    <span class="mobile-nav-icon" v-if="item.icon">
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path :d="item.icon" fill="currentColor"/>
                      </svg>
                    </span>
                    <span class="mobile-nav-label">{{ item.label }}</span>
                  </a>
                </li>
              </ul>
            </slot>
          </nav>

          <!-- 底部操作区 -->
          <div class="mobile-nav-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </Transition>

      <!-- 触发按钮 -->
      <button 
        v-if="showToggleButton"
        class="mobile-nav-toggle"
        :class="{ active: isOpen }"
        @click="toggle"
        :aria-expanded="isOpen"
        :aria-label="isOpen ? closeLabel : openLabel"
      >
        <span class="toggle-icon">
          <span class="toggle-bar"></span>
          <span class="toggle-bar"></span>
          <span class="toggle-bar"></span>
        </span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('MobileNavMenu');

/**
 * 移动端导航菜单组件
 * 
 * 功能特性：
 * 1. 支持 slide/fade/scale/slide-fade 四种动画类型
 * 2. 支持 left/right/top/bottom 四种菜单位置
 * 3. 支持触摸滑动关闭和点击外部关闭
 * 4. 响应式设计：桌面端自动关闭
 * 5. 使用 Teleport 挂载到 body，避免 z-index 上下文嵌套问题
 * 6. 完整的无障碍支持（ARIA）
 */

// ================ 类型定义 ================

export type AnimationType = 'slide' | 'fade' | 'scale' | 'slide-fade';
export type PositionType = 'left' | 'right' | 'top' | 'bottom';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon?: string;
  active?: boolean;
  onClick?: (item: NavItem) => void;
}

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

export interface MobileNavMenuProps {
  modelValue?: boolean;
  title?: string;
  animationType?: AnimationType;
  position?: PositionType;
  animationConfig?: AnimationConfig;
  showToggleButton?: boolean;
  enableTouchClose?: boolean;
  enableClickOutsideClose?: boolean;
  openLabel?: string;
  closeLabel?: string;
  navItems?: NavItem[];
  responsive?: boolean;
  responsiveBreakpoint?: number;
}

export interface MobileNavMenuEmits {
  (e: 'open'): void;
  (e: 'close'): void;
  (e: 'toggle', value: boolean): void;
  (e: 'update:modelValue', value: boolean): void;
  (e: 'nav-item-click', item: NavItem): void;
}

// ================ 属性定义 ================

const props = withDefaults(defineProps<MobileNavMenuProps>(), {
  modelValue: false,
  title: '导航菜单',
  animationType: 'slide',
  position: 'right',
  animationConfig: () => ({
    duration: 350,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0
  }),
  showToggleButton: true,
  enableTouchClose: true,
  enableClickOutsideClose: true,
  openLabel: '打开导航菜单',
  closeLabel: '关闭导航菜单',
  navItems: () => [],
  responsive: true,
  responsiveBreakpoint: 768
});

const emit = defineEmits<MobileNavMenuEmits>();

// ================ 状态管理 ================

const isOpen = ref(props.modelValue);
const menuRef = ref<HTMLElement | null>(null);
const isAnimating = ref(false);
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchCurrentX = ref(0);
const touchCurrentY = ref(0);
const isTouching = ref(false);

// ================ 计算属性 ================

const overlayTransitionName = computed(() => 'mobile-nav-fade');

const menuTransitionName = computed(() => {
  switch (props.animationType) {
    case 'slide':
      return `mobile-nav-slide-${props.position}`;
    case 'fade':
      return 'mobile-nav-fade';
    case 'scale':
      return 'mobile-nav-scale';
    case 'slide-fade':
      return `mobile-nav-slide-fade-${props.position}`;
    default:
      return `mobile-nav-slide-${props.position}`;
  }
});

const menuClasses = computed(() => [
  'mobile-nav-menu',
  `animation-${props.animationType}`,
  `position-${props.position}`
]);

/**
 * 动态菜单样式 - 仅用于动画配置相关的动态属性
 */
const menuDynamicStyle = computed(() => {
  const styles: Record<string, string> = {};

  if (props.animationConfig.delay && props.animationConfig.delay > 0) {
    styles.transitionDelay = `${props.animationConfig.delay}ms`;
  }

  return styles;
});

const defaultNavItems = computed(() => {
  if (props.navItems.length > 0) {
    return props.navItems;
  }
  return [
    { key: 'home', label: '首页', href: '/home', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
    { key: 'architecture', label: '古建筑馆', href: '/architecture', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
    { key: 'quiz', label: '知识竞赛', href: '/quiz', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' },
    { key: 'workshop', label: '3D工坊', href: '/workshop', icon: 'M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm6 2l1.5 3L13 4h3l-2 3.5L17 10h-3l-1.5-3L11 10H8l2-3.5L6 4h3z' },
    { key: 'community', label: '社区讨论', href: '/community', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' }
  ];
});

// ================ 核心方法 ================

function open(): void {
  if (isOpen.value || isAnimating.value) return;

  if (props.responsive && window.innerWidth >= props.responsiveBreakpoint) {
    return;
  }

  isOpen.value = true;
  isAnimating.value = true;

  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';

  emit('open');
  emit('toggle', true);
  emit('update:modelValue', true);
}

function close(): void {
  if (!isOpen.value || isAnimating.value) return;

  isOpen.value = false;
  isAnimating.value = true;

  emit('close');
  emit('toggle', false);
  emit('update:modelValue', false);
}

function toggle(): void {
  if (isOpen.value) {
    close();
  } else {
    open();
  }
}

// ================ Transition 钩子 ================

function handleAfterEnter(): void {
  isAnimating.value = false;
}

function handleAfterLeave(): void {
  isAnimating.value = false;
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
}

// ================ 交互处理 ================

function handleOverlayClick(): void {
  if (props.enableClickOutsideClose) {
    close();
  }
}

function handleOverlayTouchStart(e: TouchEvent): void {
  if (!props.enableTouchClose || isAnimating.value) return;
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
  isTouching.value = true;
}

function handleOverlayTouchEnd(): void {
  isTouching.value = false;
}

function handleOverlayMouseDown(): void {
  isTouching.value = true;
}

function handleOverlayMouseUp(): void {
  if (isTouching.value && props.enableClickOutsideClose) {
    close();
  }
  isTouching.value = false;
}

function handleMenuTouchStart(e: TouchEvent): void {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
  isTouching.value = true;
}

function handleMenuTouchMove(e: TouchEvent): void {
  if (!props.enableTouchClose || !isTouching.value) return;

  touchCurrentX.value = e.touches[0].clientX;
  touchCurrentY.value = e.touches[0].clientY;

  const deltaX = touchCurrentX.value - touchStartX.value;
  const deltaY = touchCurrentY.value - touchStartY.value;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    const shouldClose = (props.position === 'left' && deltaX > 0) || 
                       (props.position === 'right' && deltaX < 0);

    if (shouldClose && Math.abs(deltaX) > 100) {
      close();
    }
  }
}

function handleMenuTouchEnd(): void {
  isTouching.value = false;
}

function handleNavItemClick(item: NavItem): void {
  item.onClick?.(item);
  emit('nav-item-click', item);
  close();
}

// ================ 响应式处理 ================

function handleResize(): void {
  if (!props.responsive) return;

  const windowWidth = window.innerWidth;

  if (windowWidth >= props.responsiveBreakpoint && isOpen.value) {
    isOpen.value = false;
    isAnimating.value = false;
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    emit('close');
    emit('toggle', false);
    emit('update:modelValue', false);
  }
}

// ================ 生命周期 ================

watch(() => props.modelValue, (newValue) => {
  if (newValue && props.responsive && window.innerWidth >= props.responsiveBreakpoint) {
    emit('update:modelValue', false);
    return;
  }

  if (newValue && !isOpen.value) {
    open();
  } else if (!newValue && isOpen.value) {
    close();
  }
});

onMounted(() => {
  window.addEventListener('resize', handleResize, { passive: true });
  memTrack.trackListener('resize', 'window');
  handleResize();

  if (props.modelValue && window.innerWidth < props.responsiveBreakpoint) {
    open();
  }
});

onUnmounted(() => {
  memTrack.untrackListener('resize', 'window');
  window.removeEventListener('resize', handleResize);
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
});

// ================ 暴露公共方法 ================

defineExpose({
  open,
  close,
  toggle,
  isOpen: computed(() => isOpen.value)
});
</script>

<style scoped>
/* ================ 遮罩层样式 ================ */

.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  z-index: 9998;
  cursor: pointer;
  pointer-events: auto;
}

/* ================ 菜单容器样式 ================ */

.mobile-nav-menu {
  position: fixed;
  background: var(--bg);
  background: linear-gradient(180deg, var(--bg-light) 0%, var(--bg) 100%);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 
    -8px 0 40px rgba(0, 0, 0, 0.6),
    inset 0 0 60px rgba(201, 169, 110, 0.03);
  pointer-events: auto;
  border-left: 1px solid rgba(201, 169, 110, 0.1);
}

/* 位置变体 */
.position-left {
  left: 0;
  right: auto;
  top: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
}

.position-right {
  right: 0;
  left: auto;
  top: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
}

.position-top {
  top: 0;
  left: 0;
  right: 0;
  height: 300px;
  max-height: 70vh;
}

.position-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 300px;
  max-height: 70vh;
  border-radius: 16px 16px 0 0;
}

/* ================ 头部样式 ================ */

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(201, 169, 110, 0.15);
  background: rgba(201, 169, 110, 0.05);
  flex-shrink: 0;
}

.mobile-nav-title {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--gold, #C9A96E);
  letter-spacing: 0.08em;
}

.mobile-nav-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 6px;
  color: var(--text-muted, #888);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-nav-close-btn:hover {
  color: var(--gold, #C9A96E);
  background: rgba(201, 169, 110, 0.15);
  border-color: rgba(201, 169, 110, 0.3);
}

/* ================ 内容区域样式 ================ */

.mobile-nav-content {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}

.mobile-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mobile-nav-list li {
  display: block;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 24px;
  color: var(--text-muted, #A09080);
  text-decoration: none;
  transition: all 0.2s ease;
  background: transparent;
  border-bottom: 1px solid rgba(201, 169, 110, 0.06);
}

.mobile-nav-link:hover {
  color: var(--gold, #C9A96E);
  background: rgba(201, 169, 110, 0.1);
}

.mobile-nav-link.active {
  color: var(--gold, #C9A96E);
  background: rgba(201, 169, 110, 0.15);
  border-left: 3px solid var(--gold, #C9A96E);
  padding-left: 21px;
}

.mobile-nav-icon {
  flex-shrink: 0;
  opacity: 0.7;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.mobile-nav-link:hover .mobile-nav-icon,
.mobile-nav-link.active .mobile-nav-icon {
  opacity: 1;
}

.mobile-nav-label {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: inherit;
}

/* ================ 底部区域样式 ================ */

.mobile-nav-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(201, 169, 110, 0.15);
  flex-shrink: 0;
  background: rgba(201, 169, 110, 0.03);
}

/* ================ 触发按钮样式 ================ */

.mobile-nav-toggle {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 8px;
  background: rgba(26, 23, 20, 0.9);
  border: 1px solid rgba(201, 169, 110, 0.2);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.mobile-nav-toggle:hover {
  background: rgba(201, 169, 110, 0.15);
  border-color: rgba(201, 169, 110, 0.4);
}

.mobile-nav-toggle.active {
  transform: translateY(-50%) rotate(90deg);
}

.toggle-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-bar {
  width: 20px;
  height: 2px;
  background: var(--gold, #C9A96E);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.mobile-nav-toggle.active .toggle-bar:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.mobile-nav-toggle.active .toggle-bar:nth-child(2) {
  opacity: 0;
}

.mobile-nav-toggle.active .toggle-bar:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* ================ 动画样式 ================ */

/* 淡入淡出 */
.mobile-nav-fade-enter-active,
.mobile-nav-fade-leave-active {
  transition: opacity 0.3s ease;
}

.mobile-nav-fade-enter-from,
.mobile-nav-fade-leave-to {
  opacity: 0;
}

.mobile-nav-fade-enter-to,
.mobile-nav-fade-leave-from {
  opacity: 1;
}

/* 缩放动画 */
.mobile-nav-scale-enter-active,
.mobile-nav-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-nav-scale-enter-from,
.mobile-nav-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.mobile-nav-scale-enter-to,
.mobile-nav-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* 右侧滑入 */
.mobile-nav-slide-right-enter-active,
.mobile-nav-slide-right-leave-active {
  transition: 
    transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.3s ease,
    box-shadow 0.4s ease;
}

.mobile-nav-slide-right-enter-from,
.mobile-nav-slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
  box-shadow: none;
}

.mobile-nav-slide-right-enter-to,
.mobile-nav-slide-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* 左侧滑入 */
.mobile-nav-slide-left-enter-active,
.mobile-nav-slide-left-leave-active {
  transition: 
    transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.3s ease,
    box-shadow 0.4s ease;
}

.mobile-nav-slide-left-enter-from,
.mobile-nav-slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
  box-shadow: none;
}

.mobile-nav-slide-left-enter-to,
.mobile-nav-slide-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* 顶部滑入 */
.mobile-nav-slide-top-enter-active,
.mobile-nav-slide-top-leave-active {
  transition: 
    transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.3s ease,
    box-shadow 0.4s ease;
}

.mobile-nav-slide-top-enter-from,
.mobile-nav-slide-top-leave-to {
  transform: translateY(-100%);
  opacity: 0;
  box-shadow: none;
}

.mobile-nav-slide-top-enter-to,
.mobile-nav-slide-top-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 底部滑入 */
.mobile-nav-slide-bottom-enter-active,
.mobile-nav-slide-bottom-leave-active {
  transition: 
    transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.3s ease,
    box-shadow 0.4s ease;
}

.mobile-nav-slide-bottom-enter-from,
.mobile-nav-slide-bottom-leave-to {
  transform: translateY(100%);
  opacity: 0;
  box-shadow: none;
}

.mobile-nav-slide-bottom-enter-to,
.mobile-nav-slide-bottom-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* 滑入淡入组合 - 右侧 */
.mobile-nav-slide-fade-right-enter-active,
.mobile-nav-slide-fade-right-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.mobile-nav-slide-fade-right-enter-from,
.mobile-nav-slide-fade-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.mobile-nav-slide-fade-right-enter-to,
.mobile-nav-slide-fade-right-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* 滑入淡入组合 - 左侧 */
.mobile-nav-slide-fade-left-enter-active,
.mobile-nav-slide-fade-left-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.mobile-nav-slide-fade-left-enter-from,
.mobile-nav-slide-fade-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.mobile-nav-slide-fade-left-enter-to,
.mobile-nav-slide-fade-left-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* ================ 响应式适配 ================ */

@media screen and (max-width: 767px) {
  .mobile-nav-menu.position-right {
    right: 0;
    left: auto;
    top: 0;
    bottom: 0;
    width: 280px;
    max-width: 85vw;
  }

  .mobile-nav-menu.position-left {
    left: 0;
    right: auto;
    top: 0;
    bottom: 0;
    width: 280px;
    max-width: 85vw;
  }

  .mobile-nav-link {
    padding: 12px 20px;
  }

  .mobile-nav-link.active {
    padding-left: 17px;
  }

  .mobile-nav-header,
  .mobile-nav-footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .mobile-nav-toggle {
    top: 16px;
    right: 16px;
    transform: translateY(0);
  }

  .mobile-nav-toggle.active {
    transform: rotate(90deg);
  }
}

@media screen and (max-width: 359px) {
  .mobile-nav-menu {
    width: 100%;
    max-width: 100%;
  }

  .mobile-nav-menu.position-right {
    right: 0;
    left: 0;
    top: 0;
    bottom: 0;
  }

  .mobile-nav-menu.position-left {
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }

  .mobile-nav-link {
    padding: 10px 16px;
  }

  .mobile-nav-link.active {
    padding-left: 13px;
  }

  .mobile-nav-label {
    font-size: 0.875rem;
  }

  .mobile-nav-header,
  .mobile-nav-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}

/* ================ 无障碍支持 ================ */

@media (prefers-contrast: high) {
  .mobile-nav-menu {
    border: 2px solid var(--gold, #C9A96E);
  }

  .mobile-nav-link {
    border-bottom: 1px solid rgba(201, 169, 110, 0.2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-fade-enter-active,
  .mobile-nav-fade-leave-active,
  .mobile-nav-scale-enter-active,
  .mobile-nav-scale-leave-active,
  .mobile-nav-slide-right-enter-active,
  .mobile-nav-slide-right-leave-active,
  .mobile-nav-slide-left-enter-active,
  .mobile-nav-slide-left-leave-active,
  .mobile-nav-slide-top-enter-active,
  .mobile-nav-slide-top-leave-active,
  .mobile-nav-slide-bottom-enter-active,
  .mobile-nav-slide-bottom-leave-active,
  .mobile-nav-slide-fade-right-enter-active,
  .mobile-nav-slide-fade-right-leave-active,
  .mobile-nav-slide-fade-left-enter-active,
  .mobile-nav-slide-fade-left-leave-active {
    transition-duration: 0.1s !important;
  }
}
</style>