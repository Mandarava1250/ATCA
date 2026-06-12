<template>
  <div class="admin-page">
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

    <div class="data-table-wrapper">
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
              <button class="btn-text" @click="editArch(arch)">{{ $t('admin.edit') || '编辑' }}</button>
              <button class="btn-text danger" @click="deleteArch(arch.architecture_id)">{{ $t('admin.delete') || '删除' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!architectures.length" class="empty-table">
        <div v-if="loadError" style="color:var(--color-error);margin-bottom:8px">{{ loadError }}</div>
        <div v-else>{{ $t('admin.noData') || '暂无数据' }}</div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-xl">
        <h3>{{ editingId ? ($t('admin.editArchitecture') || '编辑古建筑') : ($t('admin.addArchitecture') || '添加古建筑') }}</h3>

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
              <input v-model="form.name" class="atca-input" required placeholder="如: Forbidden City" />
            </div>
            <div class="form-group">
              <label>中文名称</label>
              <input v-model="form.chinese_name" class="atca-input" placeholder="如: 紫禁城" />
            </div>
            <div class="form-group">
              <label>类型 *</label>
              <select v-model="form.type" class="atca-input" required>
                <option value="">请选择</option>
                <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>朝代</label>
              <select v-model="form.founding_dynasty" class="atca-input">
                <option value="">请选择</option>
                <option v-for="d in dynasties" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="form-group full">
              <label>所在位置</label>
              <input v-model="form.location" class="atca-input" placeholder="如: 北京市东城区" />
            </div>
            <div class="form-group">
              <label>纬度</label>
              <input v-model.number="form.latitude" type="number" step="0.0001" class="atca-input" placeholder="如: 39.9163" />
            </div>
            <div class="form-group">
              <label>经度</label>
              <input v-model.number="form.longitude" type="number" step="0.0001" class="atca-input" placeholder="如: 116.3972" />
            </div>
            <div class="form-group">
              <label>建造年代</label>
              <input v-model="form.construction_date" class="atca-input" placeholder="如: 1406-1420" />
            </div>
            <div class="form-group">
              <label>建筑师/设计者</label>
              <input v-model="form.architect" class="atca-input" placeholder="如: 蒯祥" />
            </div>
            <div class="form-group">
              <label>保护级别</label>
              <select v-model="form.protection_level" class="atca-input">
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
              <select v-model="form.is_featured" class="atca-input">
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
              <textarea v-model="form.brief_description" class="atca-input" rows="3" placeholder="一句话简介..."></textarea>
            </div>
            <div class="form-group full">
              <label>详细描述</label>
              <textarea v-model="form.full_description" class="atca-input" rows="8" placeholder="完整建筑描述，支持多段落..."></textarea>
            </div>
            <div class="form-group full">
              <label>建筑结构特点</label>
              <textarea v-model="form.structural_features" class="atca-input" rows="3" placeholder="斗拱、梁架、屋顶形式等..."></textarea>
            </div>
            <div class="form-group full">
              <label>历史意义</label>
              <textarea v-model="form.historical_significance" class="atca-input" rows="3" placeholder="该建筑的历史文化价值..."></textarea>
            </div>
            <div class="form-group full">
              <label>现状描述</label>
              <textarea v-model="form.current_status" class="atca-input" rows="3" placeholder="当前保存状况..."></textarea>
            </div>
          </div>
        </div>

        <!-- 图片与标签 -->
        <div v-show="activeTab === 'media'" class="form-panel">
          <div class="form-grid single-col">
            <div class="form-group full">
              <label>封面图片URL</label>
              <input v-model="form.main_image_url" class="atca-input" placeholder="https://example.com/image.jpg" />
              <div v-if="form.main_image_url" class="image-preview">
                <img :src="form.main_image_url" alt="封面预览" @error="($event.target as HTMLElement)?.style && (($event.target as HTMLElement).style.display = 'none')" />
              </div>
            </div>
            <div class="form-group full">
              <label>图片画廊URLs（每行一个）</label>
              <textarea v-model="galleryUrls" class="atca-input" rows="4" placeholder="https://example.com/img1.jpg&#10;https://example.com/img2.jpg"></textarea>
            </div>
            <div class="form-group full">
              <label>标签（逗号分隔）</label>
              <input v-model="form.tags" class="atca-input" placeholder="宫殿, 木质结构, 世界文化遗产" />
            </div>
            <div class="form-group full">
              <label>3D模型URL</label>
              <input v-model="form.model_3d_url" class="atca-input" placeholder="模型文件链接" />
            </div>
            <div class="form-group full">
              <label>VR全景URL</label>
              <input v-model="form.vr_panorama_url" class="atca-input" placeholder="全景图链接" />
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="atca-btn atca-btn-secondary" @click="closeModal">{{ $t('common.cancel') || '取消' }}</button>
          <button class="atca-btn atca-btn-primary" @click="saveArch">{{ $t('common.save') || '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { adminApi } from '@/services/api';

const dynasties = ['先秦', '秦汉', '魏晋南北朝', '隋唐', '宋', '辽', '元', '明', '清'];
const typeOptions = ['宫殿', '寺庙', '祭祀建筑', '塔', '园林', '民居', '城墙', '桥梁', '楼阁', '石窟', '牌坊', '陵墓', '阙', '坛', '鼓楼', '戏台', '书院', '会馆'];

const architectures = ref<any[]>([]);
const loadError = ref('');
const selectedIds = ref<number[]>([]);
const isAllSelected = computed(() => architectures.value.length > 0 && selectedIds.value.length === architectures.value.length);
function toggleSelectAll() { if (isAllSelected.value) selectedIds.value = []; else selectedIds.value = architectures.value.map(a => a.architecture_id); }
const search = ref('');
const showModal = ref(false);
const editingId = ref<number | null>(null);
const activeTab = ref('basic');
const galleryUrls = ref('');

const form = ref<any>({
  name: '',
  chinese_name: '',
  type: '',
  founding_dynasty: '',
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
  loadError.value = '';
  try {
    const res = await adminApi.getArchitectures({ search: search.value, page: 1, limit: 50 });
    // response interceptor 已解包: res = { success, data, meta }
    architectures.value = res.data || [];
    if (!architectures.value.length) loadError.value = '数据库中没有古建筑记录';
  } catch (e: any) {
    console.error('[Arch] 加载失败:', e);
    loadError.value = '加载失败: ' + (e.message || '网络/服务器错误');
  }
}

async function batchDelete() {
  if (!selectedIds.value.length || !confirm(`确认删除 ${selectedIds.value.length} 个古建筑？`)) return;
  try { await adminApi.batchDeleteArchitectures(selectedIds.value); selectedIds.value = []; loadData(); }
  catch (e: any) { alert('批量删除失败: ' + e.message); }
}

function openAdd() {
  editingId.value = null;
  activeTab.value = 'basic';
  galleryUrls.value = '';
  form.value = {
    name: '', chinese_name: '', type: '', founding_dynasty: '', location: '',
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
  galleryUrls.value = '';
}

function editArch(arch: any) {
  editingId.value = arch.architecture_id;
  activeTab.value = 'basic';
  form.value = { ...arch };
  galleryUrls.value = (arch.image_gallery || []).join('\n');
  showModal.value = true;
}

async function saveArch() {
  try {
    const payload = { ...form.value };
    if (galleryUrls.value.trim()) {
      payload.image_gallery = galleryUrls.value.split('\n').map((u: string) => u.trim()).filter(Boolean);
    }
    if (editingId.value) {
      await adminApi.updateArchitecture(editingId.value, payload);
    } else {
      await adminApi.createArchitecture(payload);
    }
    closeModal();
    loadData();
  } catch (e) { console.error(e); alert('保存失败'); }
}

async function deleteArch(id: number) {
  if (!confirm('确认删除此古建筑？此操作不可恢复。')) return;
  try { await adminApi.deleteArchitecture(id); loadData(); } catch (e) { console.error(e); }
}

// 切换界面时自动刷新
function handleRouteChange() { loadData(); }
window.addEventListener('admin-route-change', handleRouteChange);
onUnmounted(() => { window.removeEventListener('admin-route-change', handleRouteChange); });
onMounted(loadData);
</script>

<style scoped>
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
</style>
