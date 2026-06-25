<template>
  <div class="kb-panel" :class="{ expanded: isExpanded }">
    <!-- 展开按钮 -->
    <button class="kb-toggle" @click="toggle" :title="isExpanded ? '收起知识库' : '展开知识库'">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span class="toggle-text">{{ isExpanded ? '收起' : '知识库' }}</span>
      <span class="kb-count">{{ knowledgeStats.total }}</span>
    </button>

    <!-- 展开面板 -->
    <Transition name="slide">
      <div v-if="isExpanded" class="kb-content">
        <div class="kb-header">
          <h3>古建筑知识库</h3>
          <button class="kb-close" @click="isExpanded = false">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <!-- 统计信息 -->
        <div class="kb-stats">
          <div class="stat-item">
            <span class="stat-value">{{ knowledgeStats.total }}</span>
            <span class="stat-label">知识条目</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ knowledgeStats.categories }}</span>
            <span class="stat-label">知识分类</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ knowledgeStats.verified }}</span>
            <span class="stat-label">已验证</span>
          </div>
        </div>

        <!-- 分类标签 -->
        <div class="kb-categories">
          <button 
            v-for="cat in categories" 
            :key="cat"
            class="category-tag"
            :class="{ active: selectedCategory === cat }"
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>

        <!-- 知识列表 -->
        <div class="kb-list" ref="listRef">
          <div 
            v-for="item in filteredKnowledge" 
            :key="item.topic_id"
            class="kb-item"
            @click="selectItem(item)"
          >
            <div class="item-header">
              <span class="item-category">{{ item.category }}</span>
              <span class="item-confidence" :class="getConfidenceClass(item.confidence)">
                {{ (item.confidence * 100).toFixed(0) }}%
              </span>
            </div>
            <h4 class="item-title">{{ item.topic_name }}</h4>
            <p class="item-preview">{{ truncate(item.content, 60) }}</p>
          </div>
          <div v-if="filteredKnowledge.length === 0" class="kb-empty">
            暂无相关知识
          </div>
        </div>
      </div>
    </Transition>

    <!-- 知识详情弹窗 -->
    <Transition name="fade">
      <div v-if="selectedItem" class="kb-detail-overlay" @click.self="selectedItem = null">
        <div class="kb-detail">
          <div class="detail-header">
            <span class="detail-category">{{ selectedItem.category }}</span>
            <button class="detail-close" @click="selectedItem = null">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <h2 class="detail-title">{{ selectedItem.topic_name }}</h2>
          <div class="detail-meta">
            <span class="confidence-badge" :class="getConfidenceClass(selectedItem.confidence)">
              置信度 {{ (selectedItem.confidence * 100).toFixed(0) }}%
            </span>
            <span v-if="selectedItem.source" class="source-badge">{{ selectedItem.source }}</span>
          </div>
          <div class="detail-content">
            {{ selectedItem.content }}
          </div>
          <div v-if="selectedItem.keywords && selectedItem.keywords.length" class="detail-keywords">
            <span v-for="kw in selectedItem.keywords.split(',')" :key="kw" class="keyword-tag">
              {{ kw.trim() }}
            </span>
          </div>
          <div class="detail-actions">
            <button class="action-btn" @click="askAboutItem">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="2"/>
              </svg>
              询问AI
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { knowledgeApi } from '@/services/api';

interface KnowledgeItem {
  topic_id: number;
  topic_key: string;
  topic_name: string;
  category: string;
  content: string;
  source?: string;
  confidence: number;
  keywords?: string;
}

const emit = defineEmits<{
  (e: 'ask', topic: string): void;
}>();

const isExpanded = ref(false);
const knowledge = ref<KnowledgeItem[]>([]);
const categories = ref<string[]>([]);
const selectedCategory = ref<string | null>(null);
const selectedItem = ref<KnowledgeItem | null>(null);
const listRef = ref<HTMLElement>();

const knowledgeStats = ref({
  total: 0,
  categories: 0,
  verified: 0
});

const filteredKnowledge = computed(() => {
  if (!selectedCategory.value) {
    return knowledge.value;
  }
  return knowledge.value.filter(item => item.category === selectedCategory.value);
});

function toggle() {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value && knowledge.value.length === 0) {
    loadKnowledge();
  }
}

async function loadKnowledge() {
  try {
    const [listRes, categoriesRes, statsRes] = await Promise.all([
      knowledgeApi.getAll(),
      knowledgeApi.getCategories(),
      knowledgeApi.getStats()
    ]);

    if (listRes.success) {
      knowledge.value = listRes.data;
    }
    if (categoriesRes.success) {
      categories.value = categoriesRes.data;
    }
    if (statsRes.success) {
      knowledgeStats.value = statsRes.data;
    }
  } catch (error) {
    console.error('[KnowledgeBasePanel] 加载失败:', error);
  }
}

function selectCategory(cat: string) {
  selectedCategory.value = selectedCategory.value === cat ? null : cat;
}

function selectItem(item: KnowledgeItem) {
  selectedItem.value = item;
}

function truncate(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.95) return 'high';
  if (confidence >= 0.8) return 'medium';
  return 'low';
}

function askAboutItem() {
  if (selectedItem.value) {
    emit('ask', selectedItem.value.topic_name);
    selectedItem.value = null;
    isExpanded.value = false;
  }
}

onMounted(() => {
  // 预加载统计数据
  knowledgeApi.getStats().then(res => {
    if (res.success) {
      knowledgeStats.value = res.data;
    }
  });
});
</script>

<style scoped>
.kb-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.kb-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-primary, #c41e3a);
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.kb-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.toggle-text {
  display: inline;
}

.kb-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.kb-content {
  position: absolute;
  bottom: 60px;
  right: 0;
  width: 360px;
  max-height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.kb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
  color: white;
}

.kb-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.kb-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  transition: background 0.2s;
}

.kb-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.kb-stats {
  display: flex;
  padding: 12px;
  gap: 8px;
  border-bottom: 1px solid #eee;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary, #c41e3a);
}

.stat-label {
  font-size: 0.6875rem;
  color: #666;
}

.kb-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.category-tag {
  padding: 4px 10px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tag:hover,
.category-tag.active {
  background: var(--color-primary, #c41e3a);
  border-color: var(--color-primary, #c41e3a);
  color: white;
}

.kb-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.kb-item {
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.kb-item:hover {
  background: #f5f5f5;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-category {
  font-size: 0.6875rem;
  color: #888;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-confidence {
  font-size: 0.6875rem;
  font-weight: 600;
}

.item-confidence.high { color: #2e7d32; }
.item-confidence.medium { color: #f57c00; }
.item-confidence.low { color: #d32f2f; }

.item-title {
  margin: 0 0 4px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
}

.item-preview {
  margin: 0;
  font-size: 0.75rem;
  color: #666;
  line-height: 1.4;
}

.kb-empty {
  text-align: center;
  padding: 32px;
  color: #999;
  font-size: 0.875rem;
}

/* 详情弹窗 */
.kb-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
}

.kb-detail {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-category {
  font-size: 0.75rem;
  color: #888;
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 12px;
}

.detail-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
}

.detail-close:hover {
  color: #333;
}

.detail-title {
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  color: #333;
}

.detail-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.confidence-badge {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.confidence-badge.high { background: #e8f5e9; color: #2e7d32; }
.confidence-badge.medium { background: #fff3e0; color: #f57c00; }
.confidence-badge.low { background: #ffebee; color: #d32f2f; }

.source-badge {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  background: #e3f2fd;
  color: #1565c0;
}

.detail-content {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #333;
  margin-bottom: 16px;
}

.detail-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.keyword-tag {
  font-size: 0.75rem;
  padding: 4px 10px;
  background: #f5f5f5;
  border-radius: 12px;
  color: #666;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--color-primary, #c41e3a);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #a01830;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
