<!--
  筑见山河 - 虚拟滚动列表组件
  仅渲染可视区域内的列表项，优化大数据量列表性能
  目标: 1000+数据量下列表滚动流畅，初始加载时间减少80%
-->
<template>
  <div
    ref="containerRef"
    class="virtual-list-container"
    :style="{ height: containerHeight + 'px', overflow: 'auto' }"
    @scroll="handleScroll"
  >
    <!-- 占位元素，用于撑开滚动条 -->
    <div
      class="virtual-list-phantom"
      :style="{ height: totalHeight + 'px' }"
    />
    
    <!-- 实际渲染的内容区域 -->
    <div
      class="virtual-list-content"
      :style="{ transform: `translateY(${offsetY}px)` }"
    >
      <div
        v-for="item in visibleItems"
        :key="item.index"
        class="virtual-list-item"
        :style="{ height: getItemHeight(item.index) + 'px' }"
      >
        <slot
          name="item"
          :item="item.data"
          :index="item.index"
          :is-active="item.index === activeIndex"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="virtual-list-loading">
      <slot name="loading">
        <span>加载中...</span>
      </slot>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && items.length === 0" class="virtual-list-empty">
      <slot name="empty">
        <span>暂无数据</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

export interface VirtualListProps<T> {
  /** 数据列表 */
  items: T[];
  /** 每项的固定高度（如果为0则使用动态高度） */
  itemHeight?: number;
  /** 容器高度 */
  height: number;
  /** 上下额外渲染的项数（缓冲区） */
  buffer?: number;
  /** 是否启用动态高度 */
  dynamicHeight?: boolean;
  /** 当前激活项索引 */
  activeIndex?: number;
  /** 是否正在加载 */
  loading?: boolean;
  /** 滚动到底部时的回调 */
  onReachBottom?: () => void;
  /** 触底阈值（像素） */
  reachBottomThreshold?: number;
}

interface VisibleItem<T> {
  index: number;
  data: T;
}

const props = withDefaults(defineProps<VirtualListProps<unknown>>(), {
  itemHeight: 50,
  buffer: 5,
  dynamicHeight: false,
  activeIndex: -1,
  loading: false,
  reachBottomThreshold: 100,
});

const emit = defineEmits<{
  (e: 'scroll', event: Event): void;
  (e: 'reach-bottom'): void;
  (e: 'item-click', index: number, item: unknown): void;
}>();

// 响应式状态
const containerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const heightCache = ref<Map<number, number>>(new Map());
const resizeObserver = ref<ResizeObserver | null>(null);

// 计算属性
const containerHeight = computed(() => props.height);

const totalHeight = computed(() => {
  if (props.dynamicHeight) {
    let total = 0;
    for (let i = 0; i < props.items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  }
  return props.items.length * props.itemHeight;
});

const startIndex = computed(() => {
  if (!props.dynamicHeight) {
    return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer);
  }
  
  // 动态高度需要累加计算
  let accumulated = 0;
  for (let i = 0; i < props.items.length; i++) {
    accumulated += getItemHeight(i);
    if (accumulated > scrollTop.value) {
      return Math.max(0, i - props.buffer);
    }
  }
  return 0;
});

const endIndex = computed(() => {
  if (!props.dynamicHeight) {
    const visibleCount = Math.ceil(containerHeight.value / props.itemHeight);
    return Math.min(
      props.items.length,
      Math.floor(scrollTop.value / props.itemHeight) + visibleCount + props.buffer
    );
  }
  
  // 动态高度需要累加计算
  let accumulated = 0;
  let startAccumulated = 0;
  for (let i = 0; i < props.items.length; i++) {
    const height = getItemHeight(i);
    if (i < startIndex.value) {
      startAccumulated += height;
    }
    accumulated += height;
    if (accumulated - startAccumulated > containerHeight.value) {
      return Math.min(props.items.length, i + props.buffer + 1);
    }
  }
  return props.items.length;
});

const offsetY = computed(() => {
  if (!props.dynamicHeight) {
    return startIndex.value * props.itemHeight;
  }
  
  let offset = 0;
  for (let i = 0; i < startIndex.value; i++) {
    offset += getItemHeight(i);
  }
  return offset;
});

const visibleItems = computed<VisibleItem<unknown>[]>(() => {
  const items: VisibleItem<unknown>[] = [];
  for (let i = startIndex.value; i < endIndex.value; i++) {
    items.push({
      index: i,
      data: props.items[i],
    });
  }
  return items;
});

// 方法
function getItemHeight(index: number): number {
  if (props.dynamicHeight) {
    return heightCache.value.get(index) || props.itemHeight;
  }
  return props.itemHeight;
}

function setItemHeight(index: number, height: number): void {
  heightCache.value.set(index, height);
}

function handleScroll(event: Event): void {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
  emit('scroll', event);
  
  // 检查是否触底
  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
  if (scrollBottom < props.reachBottomThreshold) {
    emit('reach-bottom');
    props.onReachBottom?.();
  }
}

function scrollToIndex(index: number): void {
  if (!containerRef.value) return;
  
  let targetScrollTop = 0;
  if (props.dynamicHeight) {
    for (let i = 0; i < index; i++) {
      targetScrollTop += getItemHeight(i);
    }
  } else {
    targetScrollTop = index * props.itemHeight;
  }
  
  containerRef.value.scrollTop = targetScrollTop;
}

function scrollToTop(): void {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0;
  }
}

// 监听items变化，清除高度缓存
watch(() => props.items.length, () => {
  heightCache.value.clear();
});

// 动态高度模式下，观察元素高度变化
onMounted(() => {
  if (props.dynamicHeight && containerRef.value) {
    resizeObserver.value = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const index = parseInt(entry.target.getAttribute('data-index') || '-1');
        if (index >= 0) {
          setItemHeight(index, entry.contentRect.height);
        }
      }
    });
  }
});

onUnmounted(() => {
  resizeObserver.value?.disconnect();
});

// 暴露方法
defineExpose({
  scrollToIndex,
  scrollToTop,
  setItemHeight,
});
</script>

<style scoped>
.virtual-list-container {
  position: relative;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  position: relative;
  z-index: 1;
}

.virtual-list-item {
  box-sizing: border-box;
}

.virtual-list-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #666;
}

.virtual-list-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #999;
}
</style>