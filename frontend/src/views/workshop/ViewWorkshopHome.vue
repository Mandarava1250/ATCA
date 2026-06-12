<template>
  <div class="page">
    <Navbar />
    <div class="container page-content">
      <!-- 页面头部 -->
      <div class="page-header workshop-header">
        <div class="header-text">
          <h1 class=" -lg">{{ t('workshop.title') }}</h1>
          <p class="atca-text-muted">{{ t('workshop.subtitle') }}</p>
        </div>
        <div class="header-actions" style="display:flex;align-items:center;gap:12px;">
          <!-- 语言切换 -->
          <select v-model="currentLanguage" @change="onLanguageChange" class="lang-switcher" :title="t('workshop.switchLang')">
            <option v-for="lang in languages" :key="lang.language_code" :value="lang.language_code">
              {{ lang.native_name }}
            </option>
          </select>
          <router-link to="/workshop/editor?mode=free" class="btn btn-sec btn-enter" :title="t('workshop.freeTip')">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            {{ t('workshop.free') }}
          </router-link>
          <router-link to="/workshop/editor?mode=real" class="btn btn-pri btn-enter" :title="t('workshop.realTip')">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            {{ t('workshop.real') }}
          </router-link>
        </div>
      </div>

      <!-- 官方模型 -->
      <section class="model-section" v-if="officialModels.length">
        <div class="section-header">
          <h2>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            {{ t('workshop.official') }}
          </h2>
          <span class="section-count">{{ officialModels.length }} {{ t('workshop.countUnit') }}</span>
        </div>
        <div class="model-grid">
          <div v-for="model in officialModels" :key="model.model_id" class="model-card atca-border-classic">
            <div class="model-preview">
              <img v-if="model.thumbnail_url" :src="model.thumbnail_url" :alt="model.model_name" />
              <div v-else class="preview-placeholder">
                <svg viewBox="0 0 24 24" width="32" height="32"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </div>
              <div class="model-badge official">{{ t('workshop.officialBadge') }}</div>
            </div>
            <div class="model-info">
              <h3>{{ getModelTranslation(model.model_id, 'name', model.model_name) }}</h3>
              <p>{{ getModelTranslation(model.model_id, 'category', model.category || t('workshop.defaultCategory')) }} · {{ model.component_count || 0 }} {{ t('workshop.component') }}</p>
              <div class="model-meta">
                <span>{{ formatDate(model.created_at) }}</span>
                <router-link :to="`/workshop/editor?load=${model.model_id}`" class="model-link">{{ t('workshop.edit') }} &#8594;</router-link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 推荐模型 -->
      <section class="model-section" v-if="recommendedModels.length">
        <div class="section-header">
          <h2>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ t('workshop.recommended') }}
          </h2>
          <span class="section-count">{{ recommendedModels.length }} {{ t('workshop.countUnit') }}</span>
        </div>
        <div class="model-grid">
          <div v-for="model in recommendedModels" :key="model.model_id" class="model-card atca-border-classic">
            <div class="model-preview">
              <img v-if="model.thumbnail_url" :src="model.thumbnail_url" :alt="model.model_name" />
              <div v-else class="preview-placeholder">
                <svg viewBox="0 0 24 24" width="32" height="32"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </div>
              <div class="model-badge recommend">{{ t('workshop.recommendBadge') }}</div>
            </div>
            <div class="model-info">
              <h3>{{ getModelTranslation(model.model_id, 'name', model.model_name) }}</h3>
              <p>{{ getModelTranslation(model.model_id, 'category', model.category || t('workshop.defaultCategory')) }} · {{ model.component_count || 0 }} {{ t('workshop.component') }}</p>
              <div class="model-meta">
                <span>{{ model.author || t('workshop.anonymous') }}</span>
                <router-link :to="`/workshop/editor?load=${model.model_id}`" class="model-link">{{ t('workshop.view') }} &#8594;</router-link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 我的模型 -->
      <section class="model-section" v-if="myModels.length">
        <div class="section-header">
          <h2>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            {{ t('workshop.mine') }}
          </h2>
          <span class="section-count">{{ myModels.length }} {{ t('workshop.countUnit') }}</span>
        </div>
        <div class="model-grid">
          <div v-for="model in myModels" :key="model.model_id" class="model-card atca-border-classic">
            <div class="model-preview">
              <img v-if="model.thumbnail_url" :src="model.thumbnail_url" :alt="model.model_name" />
              <div v-else class="preview-placeholder">
                <svg viewBox="0 0 24 24" width="32" height="32"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </div>
              <div class="model-badge mine">{{ t('workshop.mineBadge') }}</div>
              <div class="model-visibility" :class="{ public: model.is_public, private: !model.is_public }">
                {{ model.is_public ? t('workshop.public') : t('workshop.private') }}
              </div>
            </div>
            <div class="model-info">
              <h3>{{ getModelTranslation(model.model_id, 'name', model.model_name) }}</h3>
              <p>{{ getModelTranslation(model.model_id, 'category', model.category || t('workshop.defaultCategory')) }} · {{ model.component_count || 0 }} {{ t('workshop.component') }}</p>
              <div class="model-meta">
                <span>{{ formatDate(model.created_at) }}</span>
                <div class="model-actions-row">
                  <!-- 打开模型 -->
                  <router-link :to="`/workshop/editor?load=${model.model_id}`" class="model-action-btn open" :title="t('workshop.openModel')">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                    {{ t('workshop.open') }}
                  </router-link>
                  <!-- 编辑属性 -->
                  <button class="model-action-btn edit" @click="openEditModel(model)" :title="t('workshop.editProperties')">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                    {{ t('workshop.properties') }}
                  </button>
                  <!-- 删除 -->
                  <button class="model-action-btn delete" @click="deleteModel(model.model_id)" :title="t('workshop.deleteModel')">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 编辑模型弹窗 -->
      <div v-if="editingModel" class="modal-overlay" @click.self="editingModel = null">
        <div class="modal-card">
          <h3>{{ t('workshop.edit_title') }}</h3>
          <div class="form-group">
            <label>{{ t('workshop.edit_name') }}</label>
            <input v-model="editForm.modelName" class="atca-input" :placeholder="t('workshop.enterModelName')" />
          </div>
          <div class="form-group">
            <label>{{ t('workshop.edit_visibility') }}</label>
            <div class="visibility-toggle">
              <button class="vis-btn" :class="{ active: !editForm.isPublic }" @click="editForm.isPublic = false">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                {{ t('workshop.edit_private') }}
              </button>
              <button class="vis-btn" :class="{ active: editForm.isPublic }" @click="editForm.isPublic = true">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                {{ t('workshop.edit_public') }}
              </button>
            </div>
          </div>
          <div class="modal-actions">
            <button class="atca-btn atca-btn-secondary" @click="editingModel = null">{{ t('workshop.edit_cancel') }}</button>
            <button class="atca-btn atca-btn-primary" @click="saveModelEdit">{{ t('workshop.edit_save') }}</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!officialModels.length && !recommendedModels.length && !myModels.length" class="empty-workshop">
        <svg viewBox="0 0 24 24" width="64" height="64"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        <h3>{{ t('workshop.empty') }}</h3>
        <p>{{ t('workshop.empty_desc') }}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <router-link to="/workshop/editor?mode=free" class="btn btn-sec">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            {{ t('workshop.free') }}
          </router-link>
          <router-link to="/workshop/editor?mode=real" class="btn btn-pri">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            {{ t('workshop.real') }}
          </router-link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import { model3dApi, i18nApi } from '@/services/api';

const { t } = useI18n();

const officialModels = ref<any[]>([]);
const recommendedModels = ref<any[]>([]);
const myModels = ref<any[]>([]);
const editingModel = ref<any>(null);
const editForm = ref({ modelName: '', isPublic: false });
const languages = ref<any[]>([{ language_code: 'zh-CN', native_name: '简体中文' }, { language_code: 'en', native_name: 'English' }]);
const currentLanguage = ref(localStorage.getItem('atca_language') || 'zh-CN');
interface TranslationEntry { text: string; isMachine: boolean; }
const translations = ref<Record<string, Record<string, TranslationEntry>>>({}); // entityId -> field -> entry

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function onLanguageChange() {
  localStorage.setItem('atca_language', currentLanguage.value);
  if (currentLanguage.value !== 'zh-CN') {
    await loadTranslations();
  } else {
    translations.value = {};
  }
  await loadModels();
}

/** 获取模型翻译后的文本 */
function getModelTranslation(entityId: string | number, field: string, fallback: string): string {
  if (currentLanguage.value === 'zh-CN') return fallback;
  const eid = String(entityId);
  return translations.value[eid]?.[field]?.text || fallback;
}

/** 批量加载翻译 */
async function loadTranslations() {
  if (currentLanguage.value === 'zh-CN') return;
  try {
    const allModels = [
      ...officialModels.value,
      ...recommendedModels.value,
      ...myModels.value,
    ].filter((m, i, arr) => arr.findIndex(x => x.model_id === m.model_id) === i);

    const ids = allModels.map(m => m.model_id).filter(id => typeof id === 'number');
    if (ids.length === 0) return;

    const res = await i18nApi.getTranslationsBatch('model', ids as number[], currentLanguage.value);
    if (res.success && res.data) {
      translations.value = res.data;
    }
  } catch (e) { console.warn('[i18n] 加载翻译失败:', e); }
}

async function loadModels() {
  let publicModels: any[] = [];
  let personalModels: any[] = [];

  // 1. 加载公开模型列表
  try {
    const publicRes = await model3dApi.list();
    publicModels = publicRes.data || [];
  } catch (e) {
    console.warn('[WorkshopHome] 公开模型加载失败:', e);
  }

  // 2. 加载我的模型（需要认证）
  try {
    const myRes = await model3dApi.getMyModels();
    personalModels = myRes.data || [];
  } catch (e) {
    console.warn('[WorkshopHome] 个人模型加载失败:', e);
    // 尝试从本地存储恢复
    const saved = localStorage.getItem('atca_local_models');
    if (saved) {
      try { personalModels = JSON.parse(saved); } catch { /* ignore */ }
    }
  }

  // 3. 加载精选模板（building_templates表支持is_featured）
  let featuredTemplates: any[] = [];
  try {
    const tplRes = await model3dApi.getTemplates();
    const templates = tplRes.data || [];
    featuredTemplates = templates.filter((t: any) => t.is_featured === true || t.is_featured === 1);
  } catch { /* ignore */ }

  // 4. 分类展示
  // 官方精选：优先使用精选模板
  if (featuredTemplates.length > 0) {
    officialModels.value = featuredTemplates.map((t: any) => ({
      model_id: t.template_id,          // 保持数字 ID，确保 /workshop/editor?load=123 能正确加载
      model_name: t.template_name,
      thumbnail_url: t.thumbnail_url,
      description: t.description,
      author: t.author || '官方',
      download_count: t.download_count || 0,
      created_at: t.created_at,
      category: t.category,
      is_featured: true
    }));
  }

  // 推荐模型：其余公开模型（排除官方展示的）
  const officialIds = new Set(officialModels.value.map((m: any) => m.model_id));
  recommendedModels.value = publicModels.filter((m: any) => !officialIds.has(m.model_id));

  // 我的模型：个人模型 + 本地缓存合并
  const myModelIds = new Set(personalModels.map((m: any) => m.model_id));
  myModels.value = personalModels;

  // 4. 如果没有任何模型，尝试本地缓存
  if (!officialModels.value.length && !recommendedModels.value.length && !myModels.value.length) {
    const localModels = localStorage.getItem('atca_local_models');
    if (localModels) {
      try {
        const parsed = JSON.parse(localModels);
        myModels.value = Array.isArray(parsed) ? parsed : [parsed];
      } catch { /* ignore */ }
    }
  }
}

function openEditModel(model: any) {
  editingModel.value = model;
  editForm.value = {
    modelName: model.model_name || '',
    isPublic: !!model.is_public,
  };
}

async function saveModelEdit() {
  if (!editingModel.value) return;
  if (!editForm.value.modelName.trim()) { alert('模型名称不能为空'); return; }
  try {
    await model3dApi.updateModel(editingModel.value.model_id, {
      modelName: editForm.value.modelName.trim(),
      isPublic: editForm.value.isPublic,
    });
    editingModel.value = null;
    await loadModels();
  } catch (e) { console.error('[ModelEdit]', e); alert('保存失败'); }
}

async function deleteModel(id: number) {
  if (!confirm('确定删除此模型？不可恢复。')) return;
  try { await model3dApi.deleteModel(id); loadModels(); } catch (e) { console.error(e); }
}

async function loadLanguages() {
  try {
    const res = await i18nApi.getLanguages();
    if (res.success && res.data && res.data.length > 0) {
      languages.value = res.data;
    }
  } catch (e) { /* 使用默认语言列表 */ }
}

onMounted(async () => {
  await loadLanguages();
  await loadModels();
});
</script>

<style scoped>
.page { 
  min-height: 100vh; 
  display: flex; 
  flex-direction: column;
  animation: workshopRiseIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 工坊页动画 - 榫卯嵌合效果 */
@keyframes workshopRiseIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

.page-content { flex: 1; padding-top: 100px; padding-bottom: 48px; }

.workshop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 100px;
  margin-bottom: 36px;
  gap: 16px;
  flex-wrap: wrap;
}
.workshop-header .header-text { flex: 1; }
.btn-enter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 0.9375rem;
  flex-shrink: 0;
}

.model-section { margin-bottom: 40px; }
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.0625rem;
  font-weight: 600;
}
.section-header h2 svg { color: var(--gold); }
.section-count { font-size: 0.75rem; color: var(--text-muted); }

.model-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.model-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  transition: all var(--t);
}
.model-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.3); border-color: var(--border-light); }
.model-preview { position: relative; aspect-ratio: 16/10; background: var(--bg-hover); overflow: hidden; }
.model-preview img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.model-card:hover .model-preview img { transform: scale(1.05); }
.preview-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
.model-badge { position: absolute; top: 8px; left: 8px; padding: 2px 8px; border-radius: var(--r-sm); font-size: 0.625rem; font-weight: 600; }
.model-badge.official { background: rgba(139, 37, 0, 0.9); color: white; }
.model-badge.recommend { background: rgba(184, 134, 11, 0.9); color: white; }
.model-badge.mine { background: rgba(74, 124, 111, 0.9); color: white; }
.model-info { padding: 14px; }
.model-info h3 { font-size: 0.875rem; font-weight: 600; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.model-info p { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 10px; }
.model-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.6875rem; color: var(--text-muted); }
.model-link { color: var(--c-red); font-weight: 500; font-size: 0.75rem; text-decoration: none; transition: color var(--t); }
.model-link:hover { color: var(--color-primary-dark); text-decoration: underline; }
.model-link.danger { color: var(--c-red); background: none; border: none; cursor: pointer; }
.model-actions { display: flex; gap: 10px; }

.empty-workshop {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-muted);
}
.empty-workshop svg { margin-bottom: 16px; opacity: 0.3; }
.empty-workshop h3 { font-size: 1.125rem; margin-bottom: 8px; color: var(--text); }
.empty-workshop p { font-size: 0.875rem; margin-bottom: 24px; }

@media (max-width: 1024px) { .model-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 768px) {
  .model-grid { grid-template-columns: repeat(2, 1fr); }
  .workshop-header { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 480px) { .model-grid { grid-template-columns: 1fr; } }

/* 模型可见性标签 */
.model-visibility {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
}
.model-visibility.public { background: rgba(91, 123, 76, 0.9); color: #fff; }
.model-visibility.private { background: rgba(120, 120, 120, 0.8); color: #fff; }

/* 模型操作按钮行 */
.model-actions-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.model-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s ease;
  text-decoration: none;
}
.model-action-btn.open {
  background: rgba(74, 124, 111, 0.1);
  color: #4A7C6F;
  border-color: rgba(74, 124, 111, 0.3);
}
.model-action-btn.open:hover { background: rgba(74, 124, 111, 0.2); }
.model-action-btn.edit {
  background: rgba(184, 134, 11, 0.1);
  color: var(--gold);
  border-color: rgba(184, 134, 11, 0.3);
}
.model-action-btn.edit:hover { background: rgba(184, 134, 11, 0.2); }
.model-action-btn.delete {
  background: rgba(199, 92, 58, 0.08);
  color: #C75C3A;
  border-color: rgba(199, 92, 58, 0.25);
  padding: 4px 6px;
}
.model-action-btn.delete:hover { background: rgba(199, 92, 58, 0.18); }

/* 编辑弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}
.modal-card {
  background: var(--bg-card);
  border-radius: var(--r-lg);
  padding: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.3);
  border: 1px solid var(--border);
}
.modal-card h3 { margin: 0 0 20px; font-size: 1.0625rem; color: var(--text); }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 6px; color: var(--text-muted); }
.form-group .atca-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-group .atca-input:focus {
  border-color: var(--gold);
}
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

/* 可见性切换 */
.visibility-toggle { display: flex; gap: 8px; }
.vis-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: var(--bg-hover);
  color: var(--text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.vis-btn.active {
  border-color: var(--gold);
  background: rgba(201, 169, 110, 0.1);
  color: var(--gold);
  font-weight: 600;
}

/* 语言切换器 */
.lang-switcher {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--t);
  outline: none;
}
.lang-switcher:hover {
  border-color: var(--c-red);
}
.lang-switcher:focus {
  border-color: var(--c-red);
  box-shadow: 0 0 0 2px rgba(var(--gold-rgb), 0.1);
}

/* ===== 古建工坊增强 ===== */
.workshop-hero {
  position: relative;
  border-bottom: 1px solid var(--border);
}
.workshop-hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-secondary) 20%, var(--c-red) 50%, var(--color-secondary) 80%, transparent 100%);
}
.model-card {
  transition: all var(--t);
}
.model-card:hover {
  box-shadow: 0 12px 40px rgba(44,30,10,0.15) !important;
}
.model-card img {
  transition: transform var(--t);
}
.model-card:hover img {
  transform: scale(1.05);
}
.model-section-title {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.model-section-title::before {
  content: '';
  width: 4px;
  height: 20px;
  background: var(--c-red);
  border-radius: 2px;
}
.lang-switcher {
  font-family: 'Noto Serif SC','STSong',serif;
}
</style>
