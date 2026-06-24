<template>
  <div class="admin-translation">
    <!-- 统计概览 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6M6.412 9a18.022 18.022 0 01-3.828-4m3.828 4c.404 2.004 2.004 3.828 4 4m-4-4c-.404-2.004-2.004-3.828-4-4m4 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total_translations || 0 }}</span>
          <span class="stat-label">总翻译数</span>
        </div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pending_reviews || 0 }}</span>
          <span class="stat-label">待审核</span>
        </div>
      </div>
      <div class="stat-card approved">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.approved_translations || 0 }}</span>
          <span class="stat-label">已通过</span>
        </div>
      </div>
      <div class="stat-card memory">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.memory_entries || 0 }}</span>
          <span class="stat-label">翻译记忆</span>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <select v-model="filter.entityType" class="filter-select" @change="loadTranslations">
          <option value="">全部模块</option>
          <option value="architecture">古建筑馆</option>
          <option value="quiz">知识竞赛</option>
          <option value="model3d">3D工坊</option>
          <option value="community">社区讨论</option>
          <option value="user">个人详情</option>
        </select>
        <select v-model="filter.language" class="filter-select" @change="loadTranslations">
          <option value="">全部语言</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
        <select v-model="filter.status" class="filter-select" @change="loadTranslations">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
      <div class="toolbar-right">
        <button class="atca-btn atca-btn-primary" @click="showBatchTranslate = true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6M6.412 9a18.022 18.022 0 01-3.828-4m3.828 4c.404 2.004 2.004 3.828 4 4m-4-4c-.404-2.004-2.004-3.828-4-4m4 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          批量翻译
        </button>
        <button class="atca-btn atca-btn-secondary" @click="showMemoryManager = true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          翻译记忆
        </button>
      </div>
    </div>

    <!-- 翻译列表 -->
    <div class="translation-list">
      <div class="list-header">
        <span class="col-entity">模块/实体</span>
        <span class="col-field">字段</span>
        <span class="col-source">原文</span>
        <span class="col-target">翻译</span>
        <span class="col-lang">语言</span>
        <span class="col-status">状态</span>
        <span class="col-actions">操作</span>
      </div>
      
      <div v-if="loading" class="loading-state">
        <svg viewBox="0 0 24 24" width="32" height="32" class="spinner"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="translations.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6M6.412 9a18.022 18.022 0 01-3.828-4m3.828 4c.404 2.004 2.004 3.828 4 4m-4-4c-.404-2.004-2.004-3.828-4-4m4 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        <p>暂无翻译数据</p>
      </div>
      
      <div v-else class="list-body">
        <div v-for="item in translations" :key="item.translation_id" class="translation-row" :class="item.review_status">
          <span class="col-entity">
            <span class="entity-type">{{ getEntityTypeLabel(item.entity_type) }}</span>
            <span class="entity-id">#{{ item.entity_id }}</span>
          </span>
          <span class="col-field">{{ item.field_name }}</span>
          <span class="col-source" :title="item.source_text">{{ truncate(item.source_text, 30) }}</span>
          <span class="col-target" :title="item.translated_text">{{ truncate(item.translated_text, 30) }}</span>
          <span class="col-lang">
            <span class="lang-badge" :class="item.language_code">{{ item.language_code }}</span>
          </span>
          <span class="col-status">
            <span class="status-badge" :class="item.review_status">
              {{ getStatusLabel(item.review_status) }}
            </span>
          </span>
          <span class="col-actions">
            <button class="btn-icon" @click="editTranslation(item)" title="编辑">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button class="btn-icon" @click="showHistory(item)" title="历史版本">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button v-if="item.review_status === 'pending'" class="btn-icon approve" @click="approveTranslation(item)" title="通过">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 13l4 4L19 7" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            </button>
            <button v-if="item.review_status === 'pending'" class="btn-icon reject" @click="rejectTranslation(item)" title="拒绝">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            </button>
          </span>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="page--">上一页</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="page === totalPages" @click="page++">下一页</button>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditor" class="modal-overlay" @click.self="showEditor = false">
      <div class="modal-content editor-modal">
        <div class="modal-header">
          <h3>编辑翻译</h3>
          <button class="close-btn" @click="showEditor = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="editor-layout">
            <div class="source-panel">
              <label>原文</label>
              <div class="source-text">{{ editingItem?.source_text }}</div>
              <div class="source-meta">
                <span>模块: {{ getEntityTypeLabel(editingItem?.entity_type) }}</span>
                <span>字段: {{ editingItem?.field_name }}</span>
              </div>
            </div>
            <div class="target-panel">
              <label>翻译 ({{ editingItem?.language_code }})</label>
              <textarea v-model="editForm.translated_text" class="atca-input" rows="6" placeholder="输入翻译内容"></textarea>
              <div class="editor-tools">
                <button class="tool-btn" @click="autoTranslate" :disabled="autoTranslating">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  {{ autoTranslating ? '翻译中...' : 'AI翻译' }}
                </button>
                <button class="tool-btn" @click="lookupMemory">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  翻译记忆
                </button>
              </div>
            </div>
          </div>
          <div class="quality-section">
            <label>质量评分</label>
            <input v-model="editForm.quality_score" type="number" min="0" max="100" class="atca-input" placeholder="0-100" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="atca-btn atca-btn-secondary" @click="showEditor = false">取消</button>
          <button class="atca-btn atca-btn-primary" @click="saveTranslation" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 历史版本弹窗 -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
      <div class="modal-content history-modal">
        <div class="modal-header">
          <h3>翻译历史</h3>
          <button class="close-btn" @click="showHistoryModal = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="historyLoading" class="loading-state">加载中...</div>
          <div v-else-if="historyList.length === 0" class="empty-state">暂无历史版本</div>
          <div v-else class="history-list">
            <div v-for="ver in historyList" :key="ver.version_id" class="history-item">
              <div class="history-header">
                <span class="version-number">v{{ ver.version_number }}</span>
                <span class="version-date">{{ formatDate(ver.created_at) }}</span>
              </div>
              <div class="history-content">{{ ver.translated_text }}</div>
              <div class="history-meta">
                <span v-if="ver.edit_reason">原因: {{ ver.edit_reason }}</span>
              </div>
              <button class="btn-text" @click="restoreVersion(ver)">恢复此版本</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量翻译弹窗 -->
    <div v-if="showBatchTranslate" class="modal-overlay" @click.self="showBatchTranslate = false">
      <div class="modal-content batch-modal">
        <div class="modal-header">
          <h3>批量翻译</h3>
          <button class="close-btn" @click="showBatchTranslate = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="batch-config">
            <div class="form-group">
              <label>目标模块</label>
              <select v-model="batchConfig.entityType" class="atca-input">
                <option value="architecture">古建筑馆</option>
                <option value="quiz">知识竞赛</option>
                <option value="model3d">3D工坊</option>
                <option value="community">社区讨论</option>
              </select>
            </div>
            <div class="form-group">
              <label>目标语言</label>
              <select v-model="batchConfig.targetLang" class="atca-input">
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div class="form-group">
              <label>翻译字段</label>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="batchConfig.fields" value="name" />
                  名称
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="batchConfig.fields" value="description" />
                  描述
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="batchConfig.fields" value="brief" />
                  简介
                </label>
              </div>
            </div>
          </div>
          <div class="batch-progress" v-if="batchRunning">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: batchProgress + '%' }"></div>
            </div>
            <span class="progress-text">{{ batchProcessed }} / {{ batchTotal }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="atca-btn atca-btn-secondary" @click="showBatchTranslate = false">取消</button>
          <button class="atca-btn atca-btn-primary" @click="startBatchTranslate" :disabled="batchRunning">
            {{ batchRunning ? '翻译中...' : '开始翻译' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 翻译记忆弹窗 -->
    <div v-if="showMemoryManager" class="modal-overlay" @click.self="showMemoryManager = false">
      <div class="modal-content memory-modal">
        <div class="modal-header">
          <h3>翻译记忆库</h3>
          <button class="close-btn" @click="showMemoryManager = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="memory-search">
            <input v-model="memorySearch" class="atca-input" placeholder="搜索原文或翻译..." @keyup.enter="searchMemory" />
            <button class="atca-btn atca-btn-secondary" @click="searchMemory">搜索</button>
          </div>
          <div v-if="memoryLoading" class="loading-state">加载中...</div>
          <div v-else-if="memoryList.length === 0" class="empty-state">暂无翻译记忆</div>
          <div v-else class="memory-list">
            <div v-for="mem in memoryList" :key="mem.memory_id" class="memory-item">
              <div class="memory-source">{{ mem.source_text }}</div>
              <div class="memory-arrow">→</div>
              <div class="memory-target">{{ mem.translated_text }}</div>
              <div class="memory-meta">
                <span>{{ mem.source_language }} → {{ mem.target_language }}</span>
                <span>使用 {{ mem.usage_count }} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3100/api/v1';

// 统计数据
const stats = ref({
  total_translations: 0,
  pending_reviews: 0,
  approved_translations: 0,
  rejected_translations: 0,
  machine_translations: 0,
  human_translations: 0,
  memory_entries: 0,
  entity_types: 0,
  languages: 0,
});

// 翻译列表
const translations = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const totalPages = ref(1);
const filter = ref({
  entityType: '',
  language: '',
  status: '',
});

// 编辑弹窗
const showEditor = ref(false);
const editingItem = ref<any>(null);
const editForm = ref({
  translated_text: '',
  quality_score: 0,
});
const saving = ref(false);
const autoTranslating = ref(false);

// 历史版本
const showHistoryModal = ref(false);
const historyList = ref<any[]>([]);
const historyLoading = ref(false);

// 批量翻译
const showBatchTranslate = ref(false);
const batchConfig = ref({
  entityType: 'architecture',
  targetLang: 'en',
  fields: ['name', 'description'],
});
const batchRunning = ref(false);
const batchProgress = ref(0);
const batchProcessed = ref(0);
const batchTotal = ref(0);

// 翻译记忆
const showMemoryManager = ref(false);
const memorySearch = ref('');
const memoryList = ref<any[]>([]);
const memoryLoading = ref(false);

// 加载统计
async function loadStats() {
  try {
    const res = await axios.get(`${API_BASE}/i18n/stats`);
    if (res.data.success) {
      stats.value = res.data.data;
    }
  } catch (err) {
    console.error('加载统计失败:', err);
  }
}

// 加载翻译列表
async function loadTranslations() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (filter.value.entityType) params.append('entity_type', filter.value.entityType);
    if (filter.value.language) params.append('language', filter.value.language);
    if (filter.value.status) params.append('status', filter.value.status);
    params.append('page', String(page.value));
    params.append('limit', '20');

    const res = await axios.get(`${API_BASE}/i18n/translations?${params}`);
    if (res.data.success) {
      translations.value = res.data.data.list || [];
      totalPages.value = res.data.data.totalPages || 1;
    }
  } catch (err) {
    console.error('加载翻译列表失败:', err);
  } finally {
    loading.value = false;
  }
}

// 编辑翻译
function editTranslation(item: any) {
  editingItem.value = item;
  editForm.value = {
    translated_text: item.translated_text,
    quality_score: item.quality_score || 0,
  };
  showEditor.value = true;
}

// 自动翻译
async function autoTranslate() {
  if (!editingItem.value?.source_text) return;
  autoTranslating.value = true;
  try {
    const res = await axios.post(`${API_BASE}/i18n/translate/auto`, {
      source_text: editingItem.value.source_text,
      target_lang: editingItem.value.language_code,
    });
    if (res.data.success) {
      editForm.value.translated_text = res.data.data.translated_text;
    }
  } catch (err) {
    console.error('自动翻译失败:', err);
    alert('翻译失败，请手动输入');
  } finally {
    autoTranslating.value = false;
  }
}

// 查询翻译记忆
async function lookupMemory() {
  if (!editingItem.value?.source_text) return;
  try {
    const res = await axios.post(`${API_BASE}/i18n/memory/lookup`, {
      source_text: editingItem.value.source_text,
      target_language: editingItem.value.language_code,
    });
    if (res.data.success && res.data.data.length > 0) {
      editForm.value.translated_text = res.data.data[0].translated_text;
      alert('已从翻译记忆中找到匹配');
    } else {
      alert('翻译记忆中无匹配项');
    }
  } catch (err) {
    console.error('查询翻译记忆失败:', err);
  }
}

// 保存翻译
async function saveTranslation() {
  if (!editingItem.value) return;
  saving.value = true;
  try {
    const res = await axios.post(`${API_BASE}/i18n/translate`, {
      entity_type: editingItem.value.entity_type,
      entity_id: editingItem.value.entity_id,
      field_name: editingItem.value.field_name,
      language_code: editingItem.value.language_code,
      translated_text: editForm.value.translated_text,
      is_machine_translated: false,
      quality_score: editForm.value.quality_score,
    });
    if (res.data.success) {
      alert('保存成功');
      showEditor.value = false;
      loadTranslations();
      loadStats();
    }
  } catch (err) {
    console.error('保存失败:', err);
    alert('保存失败');
  } finally {
    saving.value = false;
  }
}

// 审核通过
async function approveTranslation(item: any) {
  try {
    const res = await axios.post(`${API_BASE}/i18n/review`, {
      translation_id: item.translation_id,
      review_status: 'approved',
      quality_score: 90,
    });
    if (res.data.success) {
      alert('已通过');
      loadTranslations();
      loadStats();
    }
  } catch (err) {
    console.error('审核失败:', err);
  }
}

// 审核拒绝
async function rejectTranslation(item: any) {
  try {
    const res = await axios.post(`${API_BASE}/i18n/review`, {
      translation_id: item.translation_id,
      review_status: 'rejected',
      review_notes: '翻译质量不符合标准',
    });
    if (res.data.success) {
      alert('已拒绝');
      loadTranslations();
      loadStats();
    }
  } catch (err) {
    console.error('审核失败:', err);
  }
}

// 显示历史版本
async function showHistory(item: any) {
  showHistoryModal.value = true;
  historyLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/i18n/translations/${item.translation_id}/versions`);
    if (res.data.success) {
      historyList.value = res.data.data || [];
    }
  } catch (err) {
    console.error('加载历史失败:', err);
  } finally {
    historyLoading.value = false;
  }
}

// 恢复版本
async function restoreVersion(ver: any) {
  if (!editingItem.value) return;
  try {
    const res = await axios.post(`${API_BASE}/i18n/translate`, {
      entity_type: editingItem.value.entity_type,
      entity_id: editingItem.value.entity_id,
      field_name: editingItem.value.field_name,
      language_code: editingItem.value.language_code,
      translated_text: ver.translated_text,
      edit_reason: `恢复到版本 v${ver.version_number}`,
    });
    if (res.data.success) {
      alert('已恢复');
      showHistoryModal.value = false;
      loadTranslations();
    }
  } catch (err) {
    console.error('恢复失败:', err);
  }
}

// 批量翻译
async function startBatchTranslate() {
  batchRunning.value = true;
  batchProgress.value = 0;
  batchProcessed.value = 0;
  try {
    const res = await axios.post(`${API_BASE}/i18n/batch-translate`, batchConfig.value);
    if (res.data.success) {
      batchTotal.value = res.data.data.total || 0;
      // 模拟进度更新
      while (batchProcessed.value < batchTotal.value) {
        await new Promise(r => setTimeout(r, 500));
        batchProcessed.value += 5;
        batchProgress.value = (batchProcessed.value / batchTotal.value) * 100;
      }
      alert('批量翻译完成');
      showBatchTranslate.value = false;
      loadTranslations();
      loadStats();
    }
  } catch (err) {
    console.error('批量翻译失败:', err);
    alert('批量翻译失败');
  } finally {
    batchRunning.value = false;
  }
}

// 搜索翻译记忆
async function searchMemory() {
  memoryLoading.value = true;
  try {
    const res = await axios.get(`${API_BASE}/i18n/memory?search=${memorySearch.value}`);
    if (res.data.success) {
      memoryList.value = res.data.data || [];
    }
  } catch (err) {
    console.error('搜索失败:', err);
  } finally {
    memoryLoading.value = false;
  }
}

// 辅助函数
function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    architecture: '古建筑',
    quiz: '知识竞赛',
    model3d: '3D模型',
    community: '社区',
    user: '用户',
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return labels[status] || status;
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('zh-CN');
}

// 监听分页变化
watch(page, () => {
  loadTranslations();
});

onMounted(() => {
  loadStats();
  loadTranslations();
});
</script>

<style scoped>
.admin-translation {
  padding: 24px;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.stat-card.pending .stat-icon { background: rgba(234, 179, 8, 0.1); color: #eab308; }
.stat-card.approved .stat-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.stat-card.memory .stat-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.875rem;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

/* 翻译列表 */
.translation-list {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 120px 80px 150px 150px 60px 80px 100px;
  padding: 12px 16px;
  background: var(--bg-hover);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}

.list-body {
  max-height: 600px;
  overflow-y: auto;
}

.translation-row {
  display: grid;
  grid-template-columns: 120px 80px 150px 150px 60px 80px 100px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  align-items: center;
  transition: background var(--t);
}

.translation-row:hover {
  background: var(--bg-hover);
}

.translation-row.pending {
  background: rgba(234, 179, 8, 0.05);
}

.translation-row.approved {
  background: rgba(34, 197, 94, 0.05);
}

.col-entity {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entity-type {
  font-size: 0.8125rem;
  font-weight: 500;
}

.entity-id {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.col-field,
.col-source,
.col-target {
  font-size: 0.8125rem;
}

.col-source,
.col-target {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lang-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--r-sm);
  font-size: 0.6875rem;
  font-weight: 600;
}

.lang-badge.en { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.lang-badge.ja { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--r-sm);
  font-size: 0.6875rem;
  font-weight: 600;
}

.status-badge.pending { background: rgba(234, 179, 8, 0.1); color: #eab308; }
.status-badge.approved { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.status-badge.rejected { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.col-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--t);
}

.btn-icon:hover {
  background: var(--gold);
  color: #1A1714;
}

.btn-icon.approve:hover { background: #22c55e; }
.btn-icon.reject:hover { background: #ef4444; }

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid var(--border);
}

.page-btn {
  padding: 8px 16px;
  border-radius: var(--r-md);
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* 弹窗 */
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
  background: var(--bg-card);
  border-radius: var(--r-lg);
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.editor-modal { width: 600px; }
.history-modal { width: 500px; }
.batch-modal { width: 400px; }
.memory-modal { width: 600px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  background: var(--bg-hover);
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

/* 编辑器 */
.editor-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.source-panel,
.target-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-panel label,
.target-panel label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.source-text {
  padding: 12px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
  font-size: 0.875rem;
  line-height: 1.5;
}

.source-meta {
  display: flex;
  gap: 12px;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.editor-tools {
  display: flex;
  gap: 8px;
}

.tool-btn {
  padding: 8px 12px;
  border-radius: var(--r-md);
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quality-section {
  margin-top: 16px;
}

/* 历史列表 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.version-number {
  font-weight: 600;
  color: var(--gold);
}

.version-date {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

.history-content {
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.history-meta {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 批量翻译 */
.batch-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkbox-group {
  display: flex;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
}

.batch-progress {
  margin-top: 16px;
}

.progress-bar {
  height: 8px;
  background: var(--border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gold);
  transition: width 0.3s;
}

.progress-text {
  display: block;
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 8px;
}

/* 翻译记忆 */
.memory-search {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memory-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
}

.memory-source,
.memory-target {
  flex: 1;
  font-size: 0.875rem;
}

.memory-arrow {
  color: var(--gold);
  font-weight: 600;
}

.memory-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--text-muted);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式 */
@media (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 599px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
  }
  
  .list-header,
  .translation-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .list-header {
    display: none;
  }
  
  .translation-row {
    padding: 16px;
    display: flex;
    flex-direction: column;
  }
  
  .editor-layout {
    grid-template-columns: 1fr;
  }
}
</style>