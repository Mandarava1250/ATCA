<template>
  <div class="admin-translation">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6M6.412 9a18.022 18.022 0 01-3.828-4m3.828 4c.404 2.004 2.004 3.828 4 4m-4-4c-.404-2.004-2.004-3.828-4-4m4 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total_translations || 0 }}</span>
          <span class="stat-label">{{ t('admin.translation.total') }}</span>
        </div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pending_reviews || 0 }}</span>
          <span class="stat-label">{{ t('admin.translation.pending') }}</span>
        </div>
      </div>
      <div class="stat-card approved">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.approved_translations || 0 }}</span>
          <span class="stat-label">{{ t('admin.translation.approved') }}</span>
        </div>
      </div>
      <div class="stat-card memory">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.memory_entries || 0 }}</span>
          <span class="stat-label">{{ t('admin.translation.memory') }}</span>
        </div>
      </div>
    </div>

    <div class="toolbar">
      <div class="toolbar-left">
        <input 
          v-model="searchText" 
          type="text" 
          class="search-input" 
          :placeholder="t('admin.translation.searchPlaceholder')"
          @keyup.enter="loadTranslations"
        />
        <select v-model="filter.entityType" class="filter-select" @change="loadTranslations">
          <option value="">{{ t('admin.translation.allModules') }}</option>
          <option value="architecture">{{ t('admin.translation.architecture') }}</option>
          <option value="quiz">{{ t('admin.translation.quiz') }}</option>
          <option value="model3d">{{ t('admin.translation.model3d') }}</option>
          <option value="community">{{ t('admin.translation.community') }}</option>
          <option value="user">{{ t('admin.translation.user') }}</option>
        </select>
        <select v-model="filter.language" class="filter-select" @change="loadTranslations">
          <option value="">{{ t('admin.translation.allLanguages') }}</option>
          <option value="en">{{ t('admin.translation.english') }}</option>
          <option value="ja">{{ t('admin.translation.japanese') }}</option>
        </select>
        <select v-model="filter.status" class="filter-select" @change="loadTranslations">
          <option value="">{{ t('admin.translation.allStatus') }}</option>
          <option value="pending">{{ t('admin.translation.statusPending') }}</option>
          <option value="approved">{{ t('admin.translation.statusApproved') }}</option>
          <option value="rejected">{{ t('admin.translation.statusRejected') }}</option>
        </select>
      </div>
      <div class="toolbar-right">
        <button v-if="canAdd" class="atca-btn atca-btn-secondary" @click="showAddModal = true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          {{ t('admin.translation.add') }}
        </button>
        <button v-if="canAdd" class="atca-btn atca-btn-secondary" @click="showBatchTranslate = true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          {{ t('admin.translation.batchTranslate') }}
        </button>
        <button v-if="canEdit" class="atca-btn atca-btn-secondary" @click="showMemoryManager = true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          {{ t('admin.translation.memoryManager') }}
        </button>
      </div>
    </div>

    <div class="translation-list">
      <div class="list-header">
        <label v-if="canDelete || canApprove" class="checkbox-all">
          <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
        </label>
        <span class="col-entity">{{ t('admin.translation.module') }}</span>
        <span class="col-field">{{ t('admin.translation.field') }}</span>
        <span class="col-source">{{ t('admin.translation.source') }}</span>
        <span class="col-target">{{ t('admin.translation.target') }}</span>
        <span class="col-lang">{{ t('admin.translation.language') }}</span>
        <span class="col-status">{{ t('admin.translation.status') }}</span>
        <span class="col-actions">{{ t('admin.translation.actions') }}</span>
      </div>
      
      <div v-if="loading" class="loading-state">
        <svg viewBox="0 0 24 24" width="32" height="32" class="spinner"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        <p>{{ t('admin.translation.loading') }}</p>
      </div>
      
      <div v-else-if="translations.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6M6.412 9a18.022 18.022 0 01-3.828-4m3.828 4c.404 2.004 2.004 3.828 4 4m-4-4c-.404-2.004-2.004-3.828-4-4m4 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        <p>{{ t('admin.translation.empty') }}</p>
      </div>
      
      <div v-else class="list-body">
        <div v-for="item in translations" :key="item.translation_id" class="translation-row" :class="item.review_status">
          <label v-if="canDelete || canApprove" class="checkbox-item">
            <input type="checkbox" :value="item.translation_id" v-model="selectedIds" />
          </label>
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
            <button v-if="canEdit" class="btn-icon" @click="editTranslation(item)" :title="t('admin.translation.edit')">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button v-if="canEdit" class="btn-icon" @click="showHistory(item)" :title="t('admin.translation.history')">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
            <button v-if="canApprove && item.review_status === 'pending'" class="btn-icon approve" @click="approveTranslation(item)" :title="t('admin.translation.approve')">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 13l4 4L19 7" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            </button>
            <button v-if="canApprove && item.review_status === 'pending'" class="btn-icon reject" @click="rejectTranslation(item)" :title="t('admin.translation.reject')">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            </button>
            <button v-if="canDelete" class="btn-icon delete" @click="confirmDelete(item)" :title="t('admin.translation.delete')">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </button>
          </span>
        </div>
      </div>
      
      <div v-if="selectedIds.length > 0" class="batch-actions">
        <span>{{ t('admin.translation.selected', { count: selectedIds.length }) }}</span>
        <button v-if="canDelete" class="atca-btn atca-btn-danger" @click="batchDelete">
          {{ t('admin.translation.batchDelete') }}
        </button>
        <button v-if="canApprove && hasPending" class="atca-btn atca-btn-primary" @click="batchApprove">
          {{ t('admin.translation.batchApprove') }}
        </button>
      </div>
      
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="page--">{{ t('admin.translation.prev') }}</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="page === totalPages" @click="page++">{{ t('admin.translation.next') }}</button>
      </div>
    </div>

    <!-- 添加翻译弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content editor-modal">
        <div class="modal-header">
          <h3>{{ t('admin.translation.addTranslation') }}</h3>
          <button class="close-btn" @click="showAddModal = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ t('admin.translation.module') }}</label>
            <select v-model="addForm.entity_type" class="atca-input">
              <option value="architecture">{{ t('admin.translation.architecture') }}</option>
              <option value="quiz">{{ t('admin.translation.quiz') }}</option>
              <option value="model3d">{{ t('admin.translation.model3d') }}</option>
              <option value="community">{{ t('admin.translation.community') }}</option>
              <option value="user">{{ t('admin.translation.user') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('admin.translation.entityId') }}</label>
            <input v-model.number="addForm.entity_id" type="number" class="atca-input" :placeholder="t('admin.translation.entityIdPlaceholder')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.translation.field') }}</label>
            <input v-model="addForm.field_name" type="text" class="atca-input" :placeholder="t('admin.translation.fieldPlaceholder')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.translation.language') }}</label>
            <select v-model="addForm.language_code" class="atca-input">
              <option value="en">{{ t('admin.translation.english') }}</option>
              <option value="ja">{{ t('admin.translation.japanese') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('admin.translation.source') }}</label>
            <textarea v-model="addForm.source_text" class="atca-input" rows="3" :placeholder="t('admin.translation.sourcePlaceholder')"></textarea>
          </div>
          <div class="form-group">
            <label>{{ t('admin.translation.target') }}</label>
            <textarea v-model="addForm.translated_text" class="atca-input" rows="3" :placeholder="t('admin.translation.targetPlaceholder')"></textarea>
            <button class="tool-btn" @click="autoTranslateAdd" :disabled="autoTranslating">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              {{ autoTranslating ? t('admin.translation.translating') : t('admin.translation.aiTranslate') }}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="atca-btn atca-btn-secondary" @click="showAddModal = false">{{ t('admin.translation.cancel') }}</button>
          <button class="atca-btn atca-btn-primary" @click="addTranslation" :disabled="adding">
            {{ adding ? t('admin.translation.saving') : t('admin.translation.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditor" class="modal-overlay" @click.self="showEditor = false">
      <div class="modal-content editor-modal">
        <div class="modal-header">
          <h3>{{ t('admin.translation.editTranslation') }}</h3>
          <button class="close-btn" @click="showEditor = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="editor-layout">
            <div class="source-panel">
              <label>{{ t('admin.translation.source') }}</label>
              <div class="source-text">{{ editingItem?.source_text }}</div>
              <div class="source-meta">
                <span>{{ t('admin.translation.module') }}: {{ getEntityTypeLabel(editingItem?.entity_type) }}</span>
                <span>{{ t('admin.translation.field') }}: {{ editingItem?.field_name }}</span>
              </div>
            </div>
            <div class="target-panel">
              <label>{{ t('admin.translation.target') }} ({{ editingItem?.language_code }})</label>
              <textarea v-model="editForm.translated_text" class="atca-input" rows="6" :placeholder="t('admin.translation.targetPlaceholder')"></textarea>
              <div class="editor-tools">
                <button class="tool-btn" @click="autoTranslate" :disabled="autoTranslating">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  {{ autoTranslating ? t('admin.translation.translating') : t('admin.translation.aiTranslate') }}
                </button>
                <button class="tool-btn" @click="lookupMemory">
                  <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  {{ t('admin.translation.memory') }}
                </button>
              </div>
            </div>
          </div>
          <div class="quality-section">
            <label>{{ t('admin.translation.quality') }}</label>
            <input v-model.number="editForm.quality_score" type="number" min="0" max="100" class="atca-input" :placeholder="t('admin.translation.qualityPlaceholder')" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="atca-btn atca-btn-secondary" @click="showEditor = false">{{ t('admin.translation.cancel') }}</button>
          <button class="atca-btn atca-btn-primary" @click="saveTranslation" :disabled="saving">
            {{ saving ? t('admin.translation.saving') : t('admin.translation.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 历史版本弹窗 -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
      <div class="modal-content history-modal">
        <div class="modal-header">
          <h3>{{ t('admin.translation.history') }}</h3>
          <button class="close-btn" @click="showHistoryModal = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="historyLoading" class="loading-state">{{ t('admin.translation.loading') }}</div>
          <div v-else-if="historyList.length === 0" class="empty-state">{{ t('admin.translation.noHistory') }}</div>
          <div v-else class="history-list">
            <div v-for="ver in historyList" :key="ver.version_id" class="history-item">
              <div class="history-header">
                <span class="version-number">v{{ ver.version_number }}</span>
                <span class="version-date">{{ formatDate(ver.created_at) }}</span>
              </div>
              <div class="history-content">{{ ver.translated_text }}</div>
              <div class="history-meta">
                <span v-if="ver.edit_reason">{{ t('admin.translation.reason') }}: {{ ver.edit_reason }}</span>
              </div>
              <button class="btn-text" @click="restoreVersion(ver)">{{ t('admin.translation.restore') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量翻译弹窗 -->
    <div v-if="showBatchTranslate" class="modal-overlay" @click.self="showBatchTranslate = false">
      <div class="modal-content batch-modal">
        <div class="modal-header">
          <h3>{{ t('admin.translation.batchTranslate') }}</h3>
          <button class="close-btn" @click="showBatchTranslate = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="batch-config">
            <div class="form-group">
              <label>{{ t('admin.translation.module') }}</label>
              <select v-model="batchConfig.entityType" class="atca-input">
                <option value="architecture">{{ t('admin.translation.architecture') }}</option>
                <option value="quiz">{{ t('admin.translation.quiz') }}</option>
                <option value="model3d">{{ t('admin.translation.model3d') }}</option>
                <option value="community">{{ t('admin.translation.community') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('admin.translation.language') }}</label>
              <select v-model="batchConfig.targetLang" class="atca-input">
                <option value="en">{{ t('admin.translation.english') }}</option>
                <option value="ja">{{ t('admin.translation.japanese') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('admin.translation.fields') }}</label>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" v-model="batchConfig.fields" value="name" />
                  {{ t('admin.translation.fieldName') }}
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="batchConfig.fields" value="description" />
                  {{ t('admin.translation.fieldDesc') }}
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" v-model="batchConfig.fields" value="brief" />
                  {{ t('admin.translation.fieldBrief') }}
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
          <button class="atca-btn atca-btn-secondary" @click="showBatchTranslate = false">{{ t('admin.translation.cancel') }}</button>
          <button class="atca-btn atca-btn-primary" @click="startBatchTranslate" :disabled="batchRunning">
            {{ batchRunning ? t('admin.translation.translating') : t('admin.translation.start') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 翻译记忆弹窗 -->
    <div v-if="showMemoryManager" class="modal-overlay" @click.self="showMemoryManager = false">
      <div class="modal-content memory-modal">
        <div class="modal-header">
          <h3>{{ t('admin.translation.memoryManager') }}</h3>
          <button class="close-btn" @click="showMemoryManager = false">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="memory-search">
            <input v-model="memorySearch" class="atca-input" :placeholder="t('admin.translation.searchMemory')" @keyup.enter="searchMemory" />
            <button class="atca-btn atca-btn-secondary" @click="searchMemory">{{ t('admin.translation.search') }}</button>
          </div>
          <div v-if="memoryLoading" class="loading-state">{{ t('admin.translation.loading') }}</div>
          <div v-else-if="memoryList.length === 0" class="empty-state">{{ t('admin.translation.noMemory') }}</div>
          <div v-else class="memory-list">
            <div v-for="mem in memoryList" :key="mem.memory_id" class="memory-item">
              <div class="memory-source">{{ mem.source_text }}</div>
              <div class="memory-arrow">→</div>
              <div class="memory-target">{{ mem.translated_text }}</div>
              <div class="memory-meta">
                <span>{{ mem.source_language }} → {{ mem.target_language }}</span>
                <span>{{ t('admin.translation.used') }} {{ mem.usage_count }} {{ t('admin.translation.times') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content confirm-modal">
        <div class="modal-header">
          <h3>{{ t('admin.translation.deleteConfirm') }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ t('admin.translation.deleteWarning') }}</p>
        </div>
        <div class="modal-footer">
          <button class="atca-btn atca-btn-secondary" @click="showDeleteConfirm = false">{{ t('admin.translation.cancel') }}</button>
          <button class="atca-btn atca-btn-danger" @click="doDelete">{{ t('admin.translation.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores';
import { i18nApi } from '@/services/api';

const { t } = useI18n();
const userStore = useUserStore();

const canEdit = computed(() => userStore.isAdmin || userStore.isModerator);
const canDelete = computed(() => userStore.isAdmin || userStore.isModerator);
const canApprove = computed(() => userStore.isAdmin || userStore.isModerator);
const canAdd = computed(() => userStore.isAdmin || userStore.isModerator);

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

const translations = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const totalPages = ref(1);
const searchText = ref('');
const filter = ref({
  entityType: '',
  language: '',
  status: '',
});

const selectedIds = ref<number[]>([]);
const selectAll = ref(false);

const showAddModal = ref(false);
const addForm = ref({
  entity_type: 'architecture',
  entity_id: 0,
  field_name: '',
  language_code: 'en',
  source_text: '',
  translated_text: '',
});
const adding = ref(false);

const showEditor = ref(false);
const editingItem = ref<any>(null);
const editForm = ref({
  translated_text: '',
  quality_score: 0,
});
const saving = ref(false);
const autoTranslating = ref(false);

const showHistoryModal = ref(false);
const historyList = ref<any[]>([]);
const historyLoading = ref(false);

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

const showMemoryManager = ref(false);
const memorySearch = ref('');
const memoryList = ref<any[]>([]);
const memoryLoading = ref(false);

const showDeleteConfirm = ref(false);
const deletingItem = ref<any>(null);

const hasPending = computed(() => 
  translations.value.some(t => t.review_status === 'pending' && selectedIds.value.includes(t.translation_id))
);

async function loadStats() {
  try {
    const res = await i18nApi.getTranslationStats();
    if (res.success) {
      stats.value = res.data;
    }
  } catch (err) {
    console.error('加载统计失败:', err);
  }
}

async function loadTranslations() {
  loading.value = true;
  try {
    const params: Record<string, any> = {
      page: page.value,
      limit: 20,
    };
    if (searchText.value) params.search = searchText.value;
    if (filter.value.entityType) params.entity_type = filter.value.entityType;
    if (filter.value.language) params.language = filter.value.language;
    if (filter.value.status) params.status = filter.value.status;

    const res = await i18nApi.getTranslationList(params);
    if (res.success) {
      translations.value = res.data.list || [];
      totalPages.value = res.data.totalPages || 1;
      selectedIds.value = [];
      selectAll.value = false;
    }
  } catch (err) {
    console.error('加载翻译列表失败:', err);
  } finally {
    loading.value = false;
  }
}

function toggleSelectAll() {
  if (selectAll.value) {
    selectedIds.value = translations.value.map(t => t.translation_id);
  } else {
    selectedIds.value = [];
  }
}

function addTranslation() {
  if (!addForm.value.source_text || !addForm.value.translated_text) return;
  adding.value = true;
  i18nApi.saveTranslation({
    ...addForm.value,
    is_machine_translated: false,
    review_status: 'pending',
  }).then(res => {
    if (res.success) {
      showAddModal.value = false;
      addForm.value = {
        entity_type: 'architecture',
        entity_id: 0,
        field_name: '',
        language_code: 'en',
        source_text: '',
        translated_text: '',
      };
      loadTranslations();
      loadStats();
    }
  }).finally(() => {
    adding.value = false;
  });
}

async function autoTranslateAdd() {
  if (!addForm.value.source_text) return;
  autoTranslating.value = true;
  try {
    const res = await i18nApi.autoTranslate({
      source_text: addForm.value.source_text,
      target_lang: addForm.value.language_code,
    });
    if (res.success) {
      addForm.value.translated_text = res.data.translated_text;
    }
  } catch (err) {
    console.error('自动翻译失败:', err);
  } finally {
    autoTranslating.value = false;
  }
}

function editTranslation(item: any) {
  editingItem.value = item;
  editForm.value = {
    translated_text: item.translated_text,
    quality_score: item.quality_score || 0,
  };
  showEditor.value = true;
}

async function autoTranslate() {
  if (!editingItem.value?.source_text) return;
  autoTranslating.value = true;
  try {
    const res = await i18nApi.autoTranslate({
      source_text: editingItem.value.source_text,
      target_lang: editingItem.value.language_code,
    });
    if (res.success) {
      editForm.value.translated_text = res.data.translated_text;
    }
  } catch (err) {
    console.error('自动翻译失败:', err);
  } finally {
    autoTranslating.value = false;
  }
}

async function lookupMemory() {
  if (!editingItem.value?.source_text) return;
  try {
    const res = await i18nApi.lookupMemory({
      source_text: editingItem.value.source_text,
      target_language: editingItem.value.language_code,
    });
    if (res.success && res.data.length > 0) {
      editForm.value.translated_text = res.data[0].translated_text;
    }
  } catch (err) {
    console.error('查询翻译记忆失败:', err);
  }
}

function saveTranslation() {
  if (!editingItem.value) return;
  saving.value = true;
  i18nApi.saveTranslation({
    entity_type: editingItem.value.entity_type,
    entity_id: editingItem.value.entity_id,
    field_name: editingItem.value.field_name,
    language_code: editingItem.value.language_code,
    source_text: editingItem.value.source_text,
    translated_text: editForm.value.translated_text,
    is_machine_translated: false,
    quality_score: editForm.value.quality_score,
    review_status: editingItem.value.review_status,
  }).then(res => {
    if (res.success) {
      showEditor.value = false;
      loadTranslations();
      loadStats();
    }
  }).finally(() => {
    saving.value = false;
  });
}

function approveTranslation(item: any) {
  i18nApi.reviewTranslation({
    translation_id: item.translation_id,
    review_status: 'approved',
    quality_score: 90,
  }).then(res => {
    if (res.success) {
      loadTranslations();
      loadStats();
    }
  });
}

function rejectTranslation(item: any) {
  i18nApi.reviewTranslation({
    translation_id: item.translation_id,
    review_status: 'rejected',
    review_notes: '翻译质量不符合标准',
  }).then(res => {
    if (res.success) {
      loadTranslations();
      loadStats();
    }
  });
}

function confirmDelete(item: any) {
  deletingItem.value = item;
  showDeleteConfirm.value = true;
}

function doDelete() {
  if (!deletingItem.value) return;
  i18nApi.deleteTranslation(deletingItem.value.translation_id).then(res => {
    if (res.success) {
      showDeleteConfirm.value = false;
      loadTranslations();
      loadStats();
    }
  });
}

function batchDelete() {
  if (selectedIds.value.length === 0) return;
  i18nApi.batchDeleteTranslations(selectedIds.value).then(res => {
    if (res.success) {
      selectedIds.value = [];
      selectAll.value = false;
      loadTranslations();
      loadStats();
    }
  });
}

function batchApprove() {
  const pendingIds = translations.value
    .filter(t => t.review_status === 'pending' && selectedIds.value.includes(t.translation_id))
    .map(t => t.translation_id);
  
  pendingIds.forEach(id => {
    i18nApi.reviewTranslation({
      translation_id: id,
      review_status: 'approved',
      quality_score: 90,
    });
  });
  
  selectedIds.value = [];
  selectAll.value = false;
  loadTranslations();
  loadStats();
}

async function showHistory(item: any) {
  showHistoryModal.value = true;
  historyLoading.value = true;
  try {
    const res = await i18nApi.getTranslationVersions(item.translation_id);
    if (res.success) {
      historyList.value = res.data || [];
    }
  } catch (err) {
    console.error('加载历史失败:', err);
  } finally {
    historyLoading.value = false;
  }
}

function restoreVersion(ver: any) {
  if (!editingItem.value) return;
  i18nApi.saveTranslation({
    entity_type: editingItem.value.entity_type,
    entity_id: editingItem.value.entity_id,
    field_name: editingItem.value.field_name,
    language_code: editingItem.value.language_code,
    source_text: editingItem.value.source_text,
    translated_text: ver.translated_text,
    is_machine_translated: false,
  }).then(res => {
    if (res.success) {
      showHistoryModal.value = false;
      loadTranslations();
    }
  });
}

async function startBatchTranslate() {
  batchRunning.value = true;
  batchProgress.value = 0;
  batchProcessed.value = 0;
  try {
    const res = await i18nApi.batchTranslate(batchConfig.value);
    if (res.success) {
      batchTotal.value = res.data.total || 0;
      while (batchProcessed.value < batchTotal.value) {
        await new Promise(r => setTimeout(r, 500));
        batchProcessed.value += 5;
        batchProgress.value = (batchProcessed.value / batchTotal.value) * 100;
      }
      showBatchTranslate.value = false;
      loadTranslations();
      loadStats();
    }
  } catch (err) {
    console.error('批量翻译失败:', err);
  } finally {
    batchRunning.value = false;
  }
}

async function searchMemory() {
  memoryLoading.value = true;
  try {
    const res = await i18nApi.getMemoryList({ search: memorySearch.value });
    if (res.success) {
      memoryList.value = res.data || [];
    }
  } catch (err) {
    console.error('搜索失败:', err);
  } finally {
    memoryLoading.value = false;
  }
}

function getEntityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    architecture: t('admin.translation.architecture'),
    quiz: t('admin.translation.quiz'),
    model3d: t('admin.translation.model3d'),
    community: t('admin.translation.community'),
    user: t('admin.translation.user'),
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: t('admin.translation.statusPending'),
    approved: t('admin.translation.statusApproved'),
    rejected: t('admin.translation.statusRejected'),
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
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.875rem;
  min-width: 200px;
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

.translation-list {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 40px 100px 80px 150px 150px 60px 80px 120px;
  padding: 12px 16px;
  background: var(--bg-hover);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  align-items: center;
}

.checkbox-all,
.checkbox-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-body {
  max-height: 600px;
  overflow-y: auto;
}

.translation-row {
  display: grid;
  grid-template-columns: 40px 100px 80px 150px 150px 60px 80px 120px;
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
  gap: 6px;
}

.btn-icon {
  width: 28px;
  height: 28px;
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
.btn-icon.delete:hover { background: #ef4444; }

.batch-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-hover);
  border-top: 1px solid var(--border);
}

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

.modal-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
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

.editor-modal { width: 650px; }
.history-modal { width: 500px; }
.batch-modal { width: 400px; }
.memory-modal { width: 600px; }
.confirm-modal { width: 350px; }

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

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
}

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

.btn-text {
  padding: 6px 12px;
  font-size: 0.75rem;
  color: var(--gold);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

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

@media (max-width: 1199px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar {
    flex-direction: column;
  }
  
  .toolbar-left {
    flex-wrap: wrap;
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