<template>
  <div class="admin-page">
    <!-- 消息提示 -->
    <div v-if="messageText" class="message-toast" :class="messageType">
      <svg v-if="messageType === 'success'" viewBox="0 0 24 24" width="16" height="16"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
      {{ messageText }}
    </div>

    <div class="page-toolbar">
      <input v-model="search" @input="debounceSearch" class="atca-input search-input" :placeholder="$t('admin.searchArch') || '搜索古建筑...'" />
      <div style="display:flex;gap:8px;align-items:center">
        <div v-if="selectedIds.length > 0" class="batch-bar">
          <span>已选 {{ selectedIds.length }} 项</span>
          <button class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDelete">批量删除</button>
          <button class="atca-btn atca-btn-sm atca-btn-secondary" @click="selectedIds = []">取消</button>
        </div>
        <button class="atca-btn atca-btn-primary" @click="openAdd">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          {{ $t('admin.add') || '添加' }}
        </button>
      </div>
    </div>

    <div class="data-table-wrapper" :class="{ loading: loading }">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check"><input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" /></th>
            <th class="col-img">封面</th>
            <th>ID</th>
            <th>{{ $t('admin.name') || '名称' }}</th>
            <th>{{ $t('admin.type') || '类型' }}</th>
            <th>{{ $t('admin.dynasty') || '朝代' }}</th>
            <th>{{ $t('admin.location') || '位置' }}</th>
            <th>保护级别</th>
            <th>精选</th>
            <th>{{ $t('admin.actions') || '操作' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="arch in architectures" :key="arch.architecture_id">
            <td class="col-check"><input type="checkbox" :value="arch.architecture_id" v-model="selectedIds" /></td>
            <td class="col-img">
              <img v-if="arch.main_image_url" :src="arch.main_image_url" class="arch-thumb" alt="封面" />
              <div v-else class="arch-thumb-placeholder">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </div>
            </td>
            <td>{{ arch.architecture_id }}</td>
            <td>
              <div class="arch-name">{{ arch.chinese_name || arch.name }}</div>
              <div v-if="arch.chinese_name && arch.name && arch.chinese_name !== arch.name" class="arch-cn-name">{{ arch.name }}</div>
            </td>
            <td><span class="atca-tag">{{ arch.type }}</span></td>
            <td>{{ arch.founding_dynasty || '--' }}</td>
            <td>{{ arch.location || '--' }}</td>
            <td>{{ arch.protection_level || '--' }}</td>
            <td>
              <span class="featured-badge" v-if="arch.is_featured">&#9733;</span>
              <span v-else>--</span>
            </td>
            <td>
              <button class="btn-text" @click="viewArch(arch)">{{ $t('admin.view') || '查看' }}</button>
              <button class="btn-text" @click="editArch(arch)">{{ $t('admin.edit') || '编辑' }}</button>
              <button class="btn-text danger" @click="deleteArch(arch.architecture_id, arch.chinese_name || arch.name)">{{ $t('admin.delete') || '删除' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!architectures.length" class="empty-table">
        <div v-if="loadError" style="color:var(--color-error);margin-bottom:8px">{{ loadError }}</div>
        <div v-else>{{ $t('admin.noData') || '暂无数据' }}</div>
      </div>
    </div>

    <!-- 编辑/查看弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-xl">
        <div class="modal-header">
          <h3>
            <template v-if="viewMode">{{ $t('admin.viewArchitecture') || '查看古建筑' }}</template>
            <template v-else-if="editingId">{{ $t('admin.editArchitecture') || '编辑古建筑' }}</template>
            <template v-else>{{ $t('admin.addArchitecture') || '添加古建筑' }}</template>
          </h3>
          <button v-if="viewMode" class="modal-close" @click="closeModal">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
          </button>
        </div>

        <div v-if="modalLoading" class="modal-loading">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>

        <template v-else>
          <div class="form-tabs">
            <button class="form-tab" :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基本信息</button>
            <button class="form-tab" :class="{ active: activeTab === 'detail' }" @click="activeTab = 'detail'">详细介绍</button>
            <button class="form-tab" :class="{ active: activeTab === 'media' }" @click="activeTab = 'media'">图片与标签</button>
          </div>

          <!-- 基本信息 -->
          <div v-show="activeTab === 'basic'" class="form-panel">
            <div class="form-grid">
              <div class="form-group">
                <label>名称 (英文) *</label>
                <input v-model="form.name" class="atca-input" :disabled="viewMode" required placeholder="如: Forbidden City" />
                <div v-if="!form.name && !viewMode && saveAttempted" class="form-error">请输入名称</div>
              </div>
              <div class="form-group">
                <label>中文名称</label>
                <input v-model="form.chinese_name" class="atca-input" :disabled="viewMode" placeholder="如: 紫禁城" />
              </div>
              <div class="form-group">
                <label>类型 *</label>
                <select v-model="form.type" class="atca-input" :disabled="viewMode" required>
                  <option value="">请选择</option>
                  <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
                <div v-if="!form.type && !viewMode && saveAttempted" class="form-error">请选择类型</div>
              </div>
              <div class="form-group">
                <label>始建朝代</label>
                <select v-model="form.founding_dynasty" class="atca-input" :disabled="viewMode">
                  <option value="">请选择</option>
                  <option v-for="d in dynasties" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>完成朝代</label>
                <select v-model="form.completed_dynasty" class="atca-input" :disabled="viewMode">
                  <option value="">请选择</option>
                  <option v-for="d in dynasties" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div class="form-group full">
                <label>所在位置</label>
                <input v-model="form.location" class="atca-input" :disabled="viewMode" placeholder="如: 北京市东城区" />
              </div>
              <div class="form-group">
                <label>纬度</label>
                <input v-model.number="form.latitude" type="number" step="0.0001" class="atca-input" :disabled="viewMode" placeholder="如: 39.9163" />
              </div>
              <div class="form-group">
                <label>经度</label>
                <input v-model.number="form.longitude" type="number" step="0.0001" class="atca-input" :disabled="viewMode" placeholder="如: 116.3972" />
              </div>
              <div class="form-group">
                <label>建造年代</label>
                <input v-model="form.construction_date" class="atca-input" :disabled="viewMode" placeholder="如: 1406-1420" />
              </div>
              <div class="form-group">
                <label>建筑师/设计者</label>
                <input v-model="form.architect" class="atca-input" :disabled="viewMode" placeholder="如: 蒯祥" />
              </div>
              <div class="form-group">
                <label>保护级别</label>
                <select v-model="form.protection_level" class="atca-input" :disabled="viewMode">
                  <option value="">请选择</option>
                  <option value="世界文化遗产">世界文化遗产</option>
                  <option value="全国重点文物保护单位">全国重点文物保护单位</option>
                  <option value="省级文物保护单位">省级文物保护单位</option>
                  <option value="市级文物保护单位">市级文物保护单位</option>
                  <option value="县级文物保护单位">县级文物保护单位</option>
                </select>
              </div>
              <div class="form-group">
                <label>精选推荐</label>
                <select v-model="form.is_featured" class="atca-input" :disabled="viewMode">
                  <option :value="false">否</option>
                  <option :value="true">是</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 详细介绍 -->
          <div v-show="activeTab === 'detail'" class="form-panel">
            <div class="form-grid single-col">
              <div class="form-group full">
                <label>简要描述</label>
                <textarea v-model="form.brief_description" class="atca-input" :disabled="viewMode" rows="3" placeholder="一句话简介..."></textarea>
              </div>
              <div class="form-group full">
                <label>详细描述</label>
                <textarea v-model="form.full_description" class="atca-input" :disabled="viewMode" rows="8" placeholder="完整建筑描述，支持多段落..."></textarea>
              </div>
              <div class="form-group full">
                <label>建筑结构特点</label>
                <textarea v-model="form.structural_features" class="atca-input" :disabled="viewMode" rows="3" placeholder="斗拱、梁架、屋顶形式等..."></textarea>
              </div>
              <div class="form-group full">
                <label>历史意义</label>
                <textarea v-model="form.historical_significance" class="atca-input" :disabled="viewMode" rows="3" placeholder="该建筑的历史文化价值..."></textarea>
              </div>
              <div class="form-group full">
                <label>现状描述</label>
                <textarea v-model="form.current_status" class="atca-input" :disabled="viewMode" rows="3" placeholder="当前保存状况..."></textarea>
              </div>
            </div>
          </div>

          <!-- 图片与标签 -->
          <div v-show="activeTab === 'media'" class="form-panel">
            <div class="form-grid single-col">
              <div class="form-group full">
                <label>封面图片URL</label>
                <input v-model="form.main_image_url" class="atca-input" :disabled="viewMode" placeholder="https://example.com/image.jpg" />
                <div v-if="form.main_image_url" class="image-preview">
                  <img :src="form.main_image_url" alt="封面预览" @error="($event.target as HTMLElement)?.style && (($event.target as HTMLElement).style.display = 'none')" />
                </div>
              </div>
              <div class="form-group full">
                <label>图片画廊URLs（每行一个）</label>
                <textarea v-model="galleryUrls" class="atca-input" :disabled="viewMode" rows="4" placeholder="https://example.com/img1.jpg&#10;https://example.com/img2.jpg"></textarea>
              </div>
              <div class="form-group full">
                <label>标签（逗号分隔）</label>
                <input v-model="form.tags" class="atca-input" :disabled="viewMode" placeholder="宫殿, 木质结构, 世界文化遗产" />
              </div>
              <div class="form-group full">
                <label>3D模型URL</label>
                <input v-model="form.model_3d_url" class="atca-input" :disabled="viewMode" placeholder="模型文件链接" />
              </div>
              <div class="form-group full">
                <label>VR全景URL</label>
                <input v-model="form.vr_panorama_url" class="atca-input" :disabled="viewMode" placeholder="全景图链接" />
              </div>
            </div>
          </div>

          <div class="modal-actions" v-if="!viewMode">
            <button class="atca-btn atca-btn-secondary" @click="closeModal">{{ $t('common.cancel') || '取消' }}</button>
            <button class="atca-btn atca-btn-primary" :disabled="saving" @click="saveArch">
              <span v-if="saving" class="btn-loading"><div class="mini-spinner"></div></span>
              {{ saving ? '保存中...' : ($t('common.save') || '保存') }}
            </button>
          </div>
          <div class="modal-actions" v-else>
            <button class="atca-btn atca-btn-primary" @click="switchToEdit">{{ $t('admin.edit') || '编辑' }}</button>
            <button class="atca-btn atca-btn-secondary" @click="closeModal">{{ $t('common.close') || '关闭' }}</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { adminApi, http } from '@/services/api';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AdminArchitecture');
const dynasties = ['先秦', '秦汉', '魏晋南北朝', '隋唐', '宋', '辽', '元', '明', '清'];
const typeOptions = ['宫殿', '寺庙', '祭祀建筑', '塔', '园林', '民居', '城墙', '桥梁', '楼阁', '石窟', '牌坊', '陵墓', '阙', '坛', '鼓楼', '戏台', '书院', '会馆'];

const architectures = ref<any[]>([]);
const loadError = ref('');
const loading = ref(false);
const saving = ref(false);
const messageText = ref('');
const messageType = ref<'success' | 'error'>('success');
const selectedIds = ref<number[]>([]);

function showMessage(text: string, type: 'success' | 'error' = 'success') {
  messageText.value = text;
  messageType.value = type;
  setTimeout(() => {
    messageText.value = '';
  }, 3000);
}
const isAllSelected = computed(() => architectures.value.length > 0 && selectedIds.value.length === architectures.value.length);
function toggleSelectAll() { if (isAllSelected.value) selectedIds.value = []; else selectedIds.value = architectures.value.map(a => a.architecture_id); }
const search = ref('');
const showModal = ref(false);
const editingId = ref<number | null>(null);
const viewMode = ref(false);
const modalLoading = ref(false);
const activeTab = ref('basic');
const galleryUrls = ref('');
const saveAttempted = ref(false);

const form = ref<any>({
  name: '',
  chinese_name: '',
  type: '',
  founding_dynasty: '',
  completed_dynasty: '',
  location: '',
  latitude: null,
  longitude: null,
  construction_date: '',
  architect: '',
  protection_level: '',
  is_featured: false,
  brief_description: '',
  full_description: '',
  structural_features: '',
  historical_significance: '',
  current_status: '',
  main_image_url: '',
  tags: '',
  model_3d_url: '',
  vr_panorama_url: '',
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function debounceSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadData(), 300);
}

async function loadData() {
  loading.value = true;
  loadError.value = '';
  try {
    const res = await adminApi.getArchitectures({ search: search.value, page: 1, limit: 50 });
    architectures.value = res.data || [];
    if (!architectures.value.length) loadError.value = '数据库中没有古建筑记录';
  } catch (e: any) {
    console.error('[Arch] 加载失败:', e);
    loadError.value = '加载失败: ' + (e.message || '网络/服务器错误');
  } finally {
    loading.value = false;
  }
}

async function batchDelete() {
  if (!selectedIds.value.length || !confirm(`确认删除 ${selectedIds.value.length} 个古建筑？此操作不可恢复。`)) return;
  loading.value = true;
  try {
    const res = await adminApi.batchDeleteArchitectures(selectedIds.value);
    if (res.success) {
      const { deleted, totalRequested, truncated, duration, errors } = res.data;
      let msg = `成功删除 ${deleted} 个古建筑`;
      if (totalRequested !== deleted) {
        msg += ` (请求: ${totalRequested}, 实际处理: ${deleted})`;
      }
      if (truncated) {
        msg += ` (由于数量限制，部分建筑未被处理)`;
      }
      if (duration) {
        msg += ` - 耗时 ${duration}ms`;
      }
      showMessage(msg);
      if (errors && errors.length > 0) {
        console.warn('批量删除部分失败:', errors);
      }
      selectedIds.value = [];
      await loadData();
    } else {
      showMessage('批量删除失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('批量删除失败:', e);
    showMessage('批量删除失败: ' + (e.message || '网络/服务器错误'), 'error');
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  editingId.value = null;
  viewMode.value = false;
  activeTab.value = 'basic';
  galleryUrls.value = '';
  saveAttempted.value = false;
  form.value = {
    name: '', chinese_name: '', type: '', founding_dynasty: '', completed_dynasty: '', location: '',
    latitude: null, longitude: null, construction_date: '', architect: '',
    protection_level: '', is_featured: false, brief_description: '',
    full_description: '', structural_features: '', historical_significance: '',
    current_status: '', main_image_url: '', tags: '', model_3d_url: '', vr_panorama_url: '',
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingId.value = null;
  viewMode.value = false;
  galleryUrls.value = '';
  saveAttempted.value = false;
}

async function viewArch(arch: any) {
  modalLoading.value = true;
  editingId.value = arch.architecture_id;
  viewMode.value = true;
  activeTab.value = 'basic';
  showModal.value = true;
  try {
    const res = await adminApi.getArchitectureById(arch.architecture_id);
    if (res.success && res.data) {
      form.value = { ...res.data };
      galleryUrls.value = (res.data.image_gallery || []).join('\n');
    } else {
      form.value = { ...arch };
      galleryUrls.value = (arch.image_gallery || []).join('\n');
    }
  } catch (e: any) {
    console.error('[Arch] 获取详情失败:', e);
    showMessage('获取建筑详情失败: ' + (e.message || '网络/服务器错误'), 'error');
    form.value = { ...arch };
    galleryUrls.value = (arch.image_gallery || []).join('\n');
  } finally {
    modalLoading.value = false;
  }
}

async function editArch(arch: any) {
  modalLoading.value = true;
  editingId.value = arch.architecture_id;
  viewMode.value = false;
  activeTab.value = 'basic';
  saveAttempted.value = false;
  showModal.value = true;
  try {
    const res = await adminApi.getArchitectureById(arch.architecture_id);
    if (res.success && res.data) {
      form.value = { ...res.data };
      galleryUrls.value = (res.data.image_gallery || []).join('\n');
    } else {
      form.value = { ...arch };
      galleryUrls.value = (arch.image_gallery || []).join('\n');
    }
  } catch (e: any) {
    console.error('[Arch] 获取详情失败:', e);
    showMessage('获取建筑详情失败: ' + (e.message || '网络/服务器错误'), 'error');
    form.value = { ...arch };
    galleryUrls.value = (arch.image_gallery || []).join('\n');
  } finally {
    modalLoading.value = false;
  }
}

function switchToEdit() {
  viewMode.value = false;
  saveAttempted.value = false;
}

function validateForm(): boolean {
  saveAttempted.value = true;
  const errors: string[] = [];
  if (!form.value.name?.trim()) errors.push('请输入名称');
  if (!form.value.type) errors.push('请选择类型');
  if (errors.length > 0) {
    showMessage(errors.join('；'), 'error');
    return false;
  }
  return true;
}

async function saveArch() {
  if (!validateForm()) return;
  saving.value = true;
  try {
    const payload = { ...form.value };
    if (galleryUrls.value.trim()) {
      payload.image_gallery = galleryUrls.value.split('\n').map((u: string) => u.trim()).filter(Boolean);
    }
    let res;
    if (editingId.value) {
      res = await adminApi.updateArchitecture(editingId.value, payload);
    } else {
      res = await adminApi.createArchitecture(payload);
    }
    if (res.success) {
      showMessage(editingId.value ? '建筑信息更新成功' : '建筑添加成功');
      closeModal();
      http.clearCache('/admin/architectures');
      await loadData();
    } else {
      showMessage('保存失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('[Arch] 保存失败:', e);
    showMessage('保存失败: ' + (e.message || '网络/服务器错误'), 'error');
  } finally {
    saving.value = false;
  }
}

async function deleteArch(id: number, name: string) {
  if (!confirm(`确认删除古建筑「${name}」？此操作不可恢复。`)) return;
  try {
    const res = await adminApi.deleteArchitecture(id);
    if (res.success) {
      showMessage('删除成功');
      await loadData();
    } else {
      showMessage('删除失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('[Arch] 删除失败:', e);
    showMessage('删除失败: ' + (e.message || '网络/服务器错误'), 'error');
  }
}

function handleRouteChange() { loadData(); }
window.addEventListener('admin-route-change', handleRouteChange);
memTrack.trackListener('admin-route-change', 'window');
onUnmounted(() => { memTrack.untrackListener('admin-route-change', 'window'); window.removeEventListener('admin-route-change', handleRouteChange); });
onMounted(loadData);
</script>

<style scoped>
/* 消息提示 */
.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: var(--r-md);
  font-size: 0.875rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
.message-toast.success { background: rgba(90,123,108,0.9); color: #fff; }
.message-toast.error { background: rgba(139,58,42,0.9); color: #fff; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* 表格专有样式 */
.col-img { width: 60px; text-align: center; }
.arch-thumb { width: 48px; height: 36px; object-fit: cover; border-radius: var(--r-sm); border: 1px solid var(--border); }
.arch-thumb-placeholder { width: 48px; height: 36px; border-radius: var(--r-sm); background: var(--bg-hover); display: flex; align-items: center; justify-content: center; color: var(--text-muted); border: 1px dashed var(--border); margin: 0 auto; }
.arch-name { font-weight: 500; }
.arch-cn-name { font-size: 0.75rem; color: var(--text-muted); }
.featured-badge { color: var(--gold); font-size: 1rem; }
.form-panel { max-height: 55vh; overflow-y: auto; padding-right: 4px; }
.image-preview { margin-top: 8px; max-width: 200px; }
.image-preview img { width: 100%; border-radius: var(--r-md); border: 1px solid var(--border); }

/* 加载状态 */
.data-table-wrapper.loading { position: relative; }
.loading-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
  border-radius: var(--r-lg);
}
.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.modal-loading {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

/* 模态框头部 */
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-close {
  background: none; border: none; cursor: pointer;
  padding: 4px; border-radius: var(--r-sm);
  color: var(--text-muted); transition: all var(--t-fast);
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }

/* 表单错误提示 */
.form-error {
  color: #C27B7B;
  font-size: 0.75rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 按钮加载状态 */
.btn-loading { display: inline-flex; align-items: center; margin-right: 8px; }
.mini-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 查看模式样式 */
.form-panel :deep(.atca-input:disabled) {
  background: var(--bg-hover);
  color: var(--text-muted);
  cursor: not-allowed;
  border-color: transparent;
}
.form-panel :deep(.atca-input:disabled:focus) {
  outline: none;
  box-shadow: none;
}
</style>
