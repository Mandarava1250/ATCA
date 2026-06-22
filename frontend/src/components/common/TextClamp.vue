<template>
  <div class="text-clamp-wrapper" :class="{ 'is-expanded': isExpanded }">
    <div 
      ref="textRef"
      class="text-clamp-content"
      :class="{ 'clamped': !isExpanded && lineCount > maxLines }"
      :style="contentStyle"
    >
      {{ text }}
    </div>
    <div 
      v-if="lineCount > maxLines" 
      class="text-clamp-toggle"
    >
      <button 
        class="toggle-btn" 
        @click="toggleExpand"
        type="button"
      >
        <span class="toggle-icon">{{ isExpanded ? '▲' : '▼' }}</span>
        <span class="toggle-text">{{ isExpanded ? '收起文本' : '点击展开文本' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';

interface Props {
  text: string;
  maxLines?: number;
  expandText?: string;
  collapseText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxLines: 5,
  expandText: '点击展开文本',
  collapseText: '收起文本',
});

const emit = defineEmits<{
  (e: 'expand'): void;
  (e: 'collapse'): void;
}>();

const isExpanded = ref(false);
const textRef = ref<HTMLElement | null>(null);
const lineCount = ref(0);

const contentStyle = computed(() => {
  if (isExpanded.value || lineCount.value <= props.maxLines) {
    return {} as const;
  }
  return {
    display: '-webkit-box',
    WebkitLineClamp: props.maxLines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as const;
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    emit('expand');
  } else {
    emit('collapse');
  }
}

function measureLineCount() {
  if (!textRef.value) return;
  
  const element = textRef.value;
  const computedStyle = window.getComputedStyle(element);
  const lineHeight = parseFloat(computedStyle.lineHeight);
  const height = element.scrollHeight;
  
  // 计算行数
  lineCount.value = Math.round(height / lineHeight);
}

onMounted(() => {
  nextTick(() => {
    measureLineCount();
  });
});

watch(() => props.text, () => {
  nextTick(() => {
    measureLineCount();
  });
});

// 暴露方法供外部调用
defineExpose({
  expand: () => { isExpanded.value = true; },
  collapse: () => { isExpanded.value = false; },
  reset: () => { isExpanded.value = false; },
});
</script>

<style scoped>
.text-clamp-wrapper {
  width: 100%;
}

.text-clamp-content {
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.6;
}

.text-clamp-toggle {
  margin-top: 0.5rem;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: 1px solid var(--atca-color-primary, #4a90d9);
  border-radius: 4px;
  color: var(--atca-color-primary, #4a90d9);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--atca-color-primary, #4a90d9);
  color: white;
}

.toggle-icon {
  font-size: 0.75rem;
}

.toggle-text {
  white-space: nowrap;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .toggle-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }
}
</style>
