<template>
  <div class="admin-page">
    <!-- 消息提示 -->
    <div v-if="messageText" class="message-toast" :class="messageType">
      {{ messageText }}
    </div>

    <div class="page-toolbar">
      <input v-model="search" @input="debounceSearch" class="atca-input search-input" placeholder="搜索模型..." />
      <div style="display:flex;gap:8px;align-items:center">
        <div v-if="selectedIds.length > 0" class="batch-bar">
          <span>已选 {{ selectedIds.length }} 项</span>
          <button class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDeleteModels">批量删除</button>
          <button class="atca-btn atca-btn-sm" @click="selectedIds = []">取消</button>
        </div>
        <input ref="fileInput" type="file" multiple accept=".json,.glb,.gltf,.obj,.fbx,.stl,.dae,.ply,.3ds" style="display:none" @change="onFileSelected" />
        <button class="atca-btn atca-btn-primary" @click="fileInput?.click()">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          {{ importFiles.length > 1 ? ('导入选中(' + importFiles.length + ')') : '导入模型' }}
        </button>
      </div>
    </div>

    <!-- 精选模型展示 -->
    <div v-if="featuredModels.length" class="featured-section">
      <h3>精选模型展示</h3>
      <div class="featured-grid">
        <div v-for="m in featuredModels" :key="'feat-' + m.model_id + '-' + (m.source || 'na')" class="featured-card">
          <div class="featured-preview">
            <img v-if="m.thumbnail_url" :src="m.thumbnail_url" :alt="m.model_name" />
            <div v-else class="featured-placeholder">
              <svg viewBox="0 0 24 24" width="24" height="24"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            </div>
          </div>
          <span class="featured-name">{{ m.model_name }}</span>
          <button class="btn-text" @click="toggleFeatured(m.model_id, false, m.source)">取消精选</button>
        </div>
      </div>
    </div>

    <!-- 模型列表 -->
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
        <tr>
          <th class="col-thumb">预览</th>
          <th>ID</th>
          <th>模型名称</th>
          <th>作者</th>
          <th>构件数</th>
          <th>公开</th>
          <th>精选</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="m in models" :key="m.model_id + '-' + (m.source || 'na')">
          <td class="col-thumb">
            <img v-if="m.thumbnail_url" :src="m.thumbnail_url" class="model-thumb" alt="预览" />
            <div v-else class="model-thumb-placeholder">3D</div>
          </td>
          <td>{{ m.model_id }}</td>
          <td><strong>{{ m.model_name }}</strong></td>
          <td>{{ m.username || '--' }}</td>
          <td>{{ m.component_count || 0 }}</td>
          <td>
            <span class="badge" :class="m.is_public ? 'public' : 'private'">{{ m.is_public ? '公开' : '私密' }}</span>
          </td>
          <td>
            <button
                class="star-btn"
                :class="{ active: !!m.is_featured }"
                @click="toggleFeatured(m.model_id, !m.is_featured, m.source)">
              {{ !!m.is_featured ? '&#9733;' : '&#9734;' }}
            </button>
          </td>
          <td>{{ formatDate(m.created_at) }}</td>
          <td>
            <router-link :to="'/workshop/editor?load=' + m.model_id" class="btn-text" target="_blank">打开</router-link>
            <button class="btn-text danger" @click="deleteModel(m.model_id)">删除</button>
          </td>
        </tr>
        </tbody>
      </table>
      <div v-if="!models.length" class="empty-table">暂无模型数据</div>
    </div>

    <!-- 批量导入弹窗 -->
    <div v-if="showBatchImport" class="modal-overlay" @click.self="showBatchImport = false">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>批量导入模型</h3>
          <button class="modal-close" @click="showBatchImport = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>导入类型 <span class="required">*</span></label>
            <select v-model="importType" class="atca-input">
              <option value="model">模型 — 进入精选模型展示</option>
              <option value="building">建筑/场景 — 供用户在工坊中使用</option>
            </select>
            <div class="hint">模型：仅展示在精选列表中 | 建筑/场景：用户可在3D工坊中打开编辑</div>
          </div>
          <div class="form-group">
            <label>模型数据（JSON格式，每行一个模型）</label>
            <textarea v-model="batchJson" class="atca-input" rows="8" placeholder='[{"model_name":"太和殿","model_data":"...","thumbnail_url":"..."}]'></textarea>
            <div class="hint">支持格式：JSON数组或JSON Lines（每行一个对象）。字段：model_name(必填), model_data, thumbnail_url</div>
          </div>
          <div v-if="batchResult" class="batch-result" :class="{ error: batchResult.error }">
            {{ batchResult.error ? '导入失败: ' + batchResult.message : '导入成功: ' + batchResult.imported + '/' + batchResult.total + ' 个模型' }}
          </div>
        </div>
        <div class="modal-actions">
          <button class="atca-btn" @click="showBatchImport = false">取消</button>
          <button class="atca-btn atca-btn-primary" @click="runBatchImport" :disabled="batchImporting">
            {{ batchImporting ? '导入中...' : '开始导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { adminApi } from '@/services/api';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AdminModel3D');
const models = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const isAllSelected = computed(() => models.value.length > 0 && selectedIds.value.length === models.value.length);
function toggleSelectAll() { if (isAllSelected.value) selectedIds.value = []; else selectedIds.value = models.value.map(m => m.model_id); }
const fileInput = ref<HTMLInputElement | null>(null);
const importFiles = ref<File[]>([]);
const featuredModels = ref<any[]>([]);
const search = ref('');
const loading = ref(false);
const messageText = ref('');
const messageType = ref<'success' | 'error'>('success');
const showBatchImport = ref(false);

function showMessage(text: string, type: 'success' | 'error' = 'success') {
  messageText.value = text;
  messageType.value = type;
  setTimeout(() => {
    messageText.value = '';
  }, 3000);
}
const importType = ref<'model' | 'building'>('model');
const batchJson = ref('');
const batchImporting = ref(false);
const batchResult = ref<any>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function debounceSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadData(), 300);
}

function onFileSelected(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;
  importFiles.value = Array.from(files);
  showBatchImport.value = true;
  autoParseFiles(files);
}

async function autoParseFiles(files: FileList) {
  const models: any[] = [];
  const objFiles: File[] = [];
  const mtlMap: Map<string, string> = new Map();
  for (const file of Array.from(files)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'mtl') {
      const base = file.name.replace(/\.mtl$/i, '').toLowerCase();
      mtlMap.set(base, await file.text());
    } else if (ext === 'obj') {
      objFiles.push(file);
    } else if (ext === 'json') {
      const text = await file.text();
      try { models.push(...JSON.parse(text)); } catch { models.push({ model_name: file.name.replace('.json', ''), model_data: text, is_public: true, is_featured: false }); }
    }
  }
  for (const objFile of objFiles) {
    const baseName = objFile.name.replace(/\.obj$/i, '').toLowerCase();
    let objContent = await objFile.text();
    if (mtlMap.has(baseName)) {
      objContent = '# MTL_INLINE_START\n' + mtlMap.get(baseName)! + '\n# MTL_INLINE_END\n' + objContent;
    }
    models.push({ model_name: objFile.name.replace(/\.obj$/i, ''), model_data: objContent, is_public: true, is_featured: false });
  }
  batchJson.value = JSON.stringify(models, null, 2);
}

async function batchDeleteModels() {
  if (!selectedIds.value.length || !confirm(`确认删除 ${selectedIds.value.length} 个模型？`)) return;
  loading.value = true;
  try {
    const res = await adminApi.batchDeleteModels(selectedIds.value);
    if (res.success) {
      const { deleted, totalRequested, truncated, duration, errors } = res.data;
      let msg = `成功删除 ${deleted} 个模型`;
      if (totalRequested !== deleted) {
        msg += ` (请求: ${totalRequested}, 实际处理: ${deleted})`;
      }
      if (truncated) {
        msg += ` (由于数量限制，部分模型未被处理)`;
      }
      if (duration) {
        msg += ` - 耗时 ${duration}ms`;
      }
      showMessage(msg);
      if (errors && errors.length > 0) {
        console.warn('批量删除部分失败:', errors);
      }
      selectedIds.value = [];
      loadData();
    } else {
      showMessage('批量删除失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('批量删除失败:', e);
    showMessage('批量删除失败: ' + (e.message || '未知错误'), 'error');
  } finally {
    loading.value = false;
  }
}

async function loadData() {
  try {
    const res = await adminApi.getModels({ search: search.value, page: 1, limit: 50 });
    if (res.success) models.value = res.data;
  } catch (e) { console.error(e); }
}

async function loadFeatured() {
  try {
    const res = await adminApi.getFeaturedModels();
    if (res.success) featuredModels.value = res.data;
  } catch (e) { console.error(e); }
}

/** 强制刷新本地模型状态（替换对象引用，确保 Vue 重新渲染） */
function forceRefreshModel(modelId: number, updates: Partial<any>) {
  const idx = models.value.findIndex(m => m.model_id === modelId && (m.source || 'na') === (updates.source || m.source || 'na'));
  if (idx !== -1) {
    models.value[idx] = { ...models.value[idx], ...updates };
  }
  const fIdx = featuredModels.value.findIndex(m => m.model_id === modelId && (m.source || 'na') === (updates.source || m.source || 'na'));
  if (fIdx !== -1) {
    featuredModels.value[fIdx] = { ...featuredModels.value[fIdx], ...updates };
  }
}

async function toggleFeatured(id: number, featured: boolean, source?: string) {
  // 乐观更新：立即改变本地状态，让用户看到即时反馈
  forceRefreshModel(id, { is_featured: featured });
  await nextTick();

  try {
    const res = await adminApi.toggleModelFeatured(id, featured, source);
    // 重新加载数据，确保与后端同步
    await loadData();
    await loadFeatured();
  } catch (e: any) {
    console.error('[toggleFeatured] 失败', e);
    // 回滚乐观更新
    forceRefreshModel(id, { is_featured: !featured });
    alert('精选操作失败: ' + (e.response?.data?.error?.message || e.message || '未知错误'));
  }
}

async function deleteModel(id: number) {
  if (!confirm('确认删除此模型？此操作不可恢复。')) return;
  try { await adminApi.deleteModel(id); loadData(); loadFeatured(); } catch (e) { console.error(e); }
}

async function runBatchImport() {
  if (!batchJson.value.trim() && importFiles.value.length === 0) { 
    batchResult.value = { error: true, message: '请选择文件或输入JSON数据' }; 
    return; 
  }
  batchImporting.value = true; batchResult.value = null;
  
  if (importFiles.value.length > 0) {
    try {
      const formData = new FormData();
      for (const file of importFiles.value) {
        formData.append('files', file);
      }
      formData.append('import_type', importType.value);
      
      const res = await adminApi.uploadModels(formData);
      if (res.success) {
        batchResult.value = { error: false, imported: res.data.imported, total: res.data.total };
        loadData(); loadFeatured();
        setTimeout(() => { showBatchImport.value = false; batchJson.value = ''; batchResult.value = null; importFiles.value = []; }, 2000);
      } else {
        batchResult.value = { error: true, message: res.message || '导入失败' };
      }
    } catch (e: any) { 
      console.error('[Upload] 上传失败:', e);
      batchResult.value = { error: true, message: e.response?.data?.message || e.response?.data?.error?.message || e.message || '上传失败' }; 
    } finally { 
      batchImporting.value = false; 
    }
    return;
  }
  
  try {
    let models: any[] = [];
    const text = batchJson.value.trim();
    if (text.startsWith('[')) { models = JSON.parse(text); }
    else { models = text.split('\n').filter(l => l.trim()).map(l => JSON.parse(l)); }
    models.forEach((m: any) => { m.import_type = importType.value; });
    const res = await adminApi.batchImportModels(models);
    if (res.success) {
      batchResult.value = { error: false, imported: res.data.imported, total: res.data.total };
      loadData(); loadFeatured();
      setTimeout(() => { showBatchImport.value = false; batchJson.value = ''; batchResult.value = null; }, 2000);
    }
  } catch (e: any) { batchResult.value = { error: true, message: e.response?.data?.error?.message || e.message }; }
  finally { batchImporting.value = false; }
}

function handleRouteChange() { loadData(); }
window.addEventListener('admin-route-change', handleRouteChange);
memTrack.trackListener('admin-route-change', 'window');
onUnmounted(() => { memTrack.untrackListener('admin-route-change', 'window'); window.removeEventListener('admin-route-change', handleRouteChange); });
onMounted(() => { loadData(); loadFeatured(); });
</script>

<style scoped>
/* 消息提示 */
.message-toast {
  position: fixed;
  top: 16px;
  right: 16px;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  box-shadow: var(--shadow-md);
}
.message-toast.success { background: rgba(90,123,108,0.9); color: #fff; }
.message-toast.error { background: rgba(139,58,42,0.9); color: #fff; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.admin-page { display: flex; flex-direction: column; gap: 12px; }
.page-toolbar { display: flex; gap: 8px; justify-content: space-between; align-items: center; padding: 8px 0; }
.search-input { max-width: 280px; }

.featured-section { margin-bottom: 4px; }
.featured-section h3 { font-size: 0.8125rem; font-weight: 600; margin-bottom: 8px; color: var(--color-accent); display: flex; align-items: center; gap: 6px; }
.featured-section h3::before { content: ''; width: 3px; height: 14px; background: var(--color-accent); border-radius: 2px; }
.featured-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.featured-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 12px; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 100px; transition: all var(--transition-fast); }
.featured-card:hover { border-color: var(--color-accent); transform: translateY(-1px); }
.featured-preview { width: 64px; height: 48px; border-radius: var(--radius-sm); overflow: hidden; background: var(--color-surface-alt); display: flex; align-items: center; justify-content: center; }
.featured-preview img { width: 100%; height: 100%; object-fit: cover; }
.featured-placeholder { color: var(--color-text-muted); width: 24px; height: 24px; }
.featured-name { font-size: 0.725rem; font-weight: 500; text-align: center; line-height: 1.3; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.data-table-wrapper { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: var(--color-surface-alt); padding: 8px 10px; text-align: left; font-size: 0.65rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.data-table td { padding: 8px 10px; font-size: 0.7875rem; border-bottom: 1px solid var(--color-border-light); vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--color-surface-warm); }

.col-thumb { width: 56px; text-align: center; }
.model-thumb { width: 40px; height: 30px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--color-border); }
.model-thumb-placeholder { width: 40px; height: 30px; border-radius: var(--radius-sm); background: var(--color-surface-alt); display: flex; align-items: center; justify-content: center; font-size: 0.575rem; color: var(--color-text-muted); border: 1px dashed var(--color-border); margin: 0 auto; }

.badge { font-size: 0.65rem; padding: 1.5px 6px; border-radius: var(--radius-sm); font-weight: 500; }
.badge.public { background: rgba(34, 197, 94, 0.08); color: #16a34a; }
.badge.private { background: rgba(100, 116, 139, 0.08); color: #64748b; }

.star-btn { background: none; border: none; font-size: 1rem; color: var(--color-text-muted); cursor: pointer; transition: color var(--transition-fast); padding: 1px; line-height: 1; }
.star-btn:hover { color: var(--color-accent); }
.star-btn.active { color: var(--color-gold); }

.btn-text { background: none; border: none; color: var(--color-primary); font-size: 0.725rem; cursor: pointer; margin-right: 4px; padding: 2px 6px; border-radius: var(--radius-sm); transition: background var(--transition-fast); text-decoration: none; display: inline-block; }
.btn-text:hover { background: rgba(var(--color-primary-rgb), 0.06); }
.btn-text.danger { color: var(--color-error); }
.btn-text.danger:hover { background: rgba(139, 37, 0, 0.06); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal-card { background: var(--color-surface); border-radius: var(--radius-md); padding: 20px; width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.modal-header h3 { font-size: 0.9375rem; font-weight: 600; }
.modal-close { background: none; border: none; font-size: 1.375rem; cursor: pointer; color: var(--color-text-muted); line-height: 1; padding: 2px; }
.modal-body { display: flex; flex-direction: column; gap: 12px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--color-border); }
.form-group label { display: block; font-size: 0.725rem; font-weight: 500; margin-bottom: 4px; color: var(--color-text-light); }
.form-group .atca-input { width: 100%; }
.hint { font-size: 0.6875rem; color: var(--color-text-muted); margin-top: 3px; }
.required { color: var(--color-error); }
.batch-result { padding: 6px 10px; border-radius: var(--radius-sm); font-size: 0.7875rem; }
.batch-result.error { background: rgba(139, 37, 0, 0.06); color: var(--color-error); }
.empty-table { padding: 24px; text-align: center; color: var(--color-text-muted); font-size: 0.8125rem; }
.batch-bar { display: flex; align-items: center; gap: 6px; font-size: 0.7875rem; }
</style>