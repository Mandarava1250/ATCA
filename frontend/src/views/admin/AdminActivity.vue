<template>
  <div class="admin-page">
    <div v-if="messageText" class="message-toast" :class="messageType">
      {{ messageText }}
    </div>
    <div class="page-toolbar">
      <h3>活动管理</h3>
      <button class="atca-btn atca-btn-primary" @click="openModal()">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
        新增活动
      </button>
    </div>

    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>类型</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>积分奖励</th>
            <th>人数</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in list" :key="item.activity_id">
            <td>{{ item.activity_id }}</td>
            <td>{{ item.title }}</td>
            <td><span class="atca-tag">{{ item.activity_type }}</span></td>
            <td>{{ formatDate(item.start_date) }}</td>
            <td>{{ formatDate(item.end_date) }}</td>
            <td>{{ item.reward_points }}</td>
            <td>{{ item.current_participants || 0 }} / {{ item.max_participants || '-' }}</td>
            <td>
              <span class="badge" :class="item.is_active ? 'public' : 'private'">
                {{ item.is_active ? '进行中' : '已结束' }}
              </span>
            </td>
            <td>
              <button class="btn-text" @click="openModal(item)">编辑</button>
              <button class="btn-text danger" @click="del(item.activity_id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!list.length" class="empty-table">暂无活动数据</div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card" style="max-width:600px">
        <div class="modal-header">
          <h3>{{ editingId ? '编辑活动' : '新增活动' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" class="atca-input" placeholder="活动标题" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="form.description" class="atca-input" rows="2" placeholder="活动描述"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>类型</label>
              <select v-model="form.activity_type" class="atca-input">
                <option value="线上">线上</option>
                <option value="线下">线下</option>
                <option value="竞赛">竞赛</option>
                <option value="展览">展览</option>
                <option value="讲座">讲座</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>积分奖励</label>
              <input v-model.number="form.reward_points" type="number" min="0" class="atca-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>开始日期 <span class="required">*</span></label>
              <input v-model="form.start_date" type="date" class="atca-input" />
            </div>
            <div class="form-group flex-1">
              <label>结束日期 <span class="required">*</span></label>
              <input v-model="form.end_date" type="date" class="atca-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>人数上限</label>
              <input v-model.number="form.max_participants" type="number" min="0" class="atca-input" placeholder="0为不限" />
            </div>
            <div class="form-group flex-1">
              <label>状态</label>
              <select v-model.number="form.is_active" class="atca-input">
                <option :value="1">进行中</option>
                <option :value="0">已结束</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>横幅图片URL</label>
            <input v-model="form.banner_url" class="atca-input" placeholder="https://..." />
          </div>
        </div>
        <div class="modal-actions">
          <button class="atca-btn" @click="closeModal">取消</button>
          <button class="atca-btn atca-btn-primary" @click="save" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { adminApi, http } from '@/services/api';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AdminActivity');
const list = ref<any[]>([]);
const showModal = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);
const messageText = ref('');
const messageType = ref<'success' | 'error'>('success');

function showMessage(text: string, type: 'success' | 'error' = 'success') {
  messageText.value = text;
  messageType.value = type;
  setTimeout(() => {
    messageText.value = '';
  }, 3000);
}

const form = ref({
  title: '', description: '', activity_type: '线上',
  start_date: '', end_date: '', reward_points: 10,
  max_participants: 0, is_active: 1, banner_url: '',
});

function resetForm() {
  const today = new Date().toISOString().split('T')[0];
  form.value = {
    title: '', description: '', activity_type: '线上',
    start_date: today, end_date: today, reward_points: 10,
    max_participants: 0, is_active: 1, banner_url: '',
  };
}
function openModal(item?: any) {
  if (item) {
    editingId.value = item.activity_id;
    form.value = {
      title: item.title || '', description: item.description || '',
      activity_type: item.activity_type || '线上',
      start_date: item.start_date ? item.start_date.split('T')[0] : '',
      end_date: item.end_date ? item.end_date.split('T')[0] : '',
      reward_points: item.reward_points || 10,
      max_participants: item.max_participants || 0,
      is_active: item.is_active !== false ? 1 : 0,
      banner_url: item.banner_url || '',
    };
  } else { editingId.value = null; resetForm(); }
  showModal.value = true;
}
function closeModal() { showModal.value = false; editingId.value = null; resetForm(); }

function formatDate(d: string) { return d ? new Date(d).toLocaleDateString('zh-CN') : '-'; }

async function load() {
  try { const res = await adminApi.getActivities({ page: '1', limit: '50' }); list.value = res.data || []; }
  catch (e) { console.error(e); }
}
async function save() {
  if (!form.value.title || !form.value.start_date || !form.value.end_date) {
    showMessage('标题和日期必填', 'error');
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form.value };
    let res;
    if (editingId.value) {
      res = await adminApi.updateActivity(editingId.value, payload);
    } else {
      res = await adminApi.createActivity(payload);
    }
    if (res.success) {
      showMessage(editingId.value ? '活动更新成功' : '活动创建成功');
      closeModal();
      http.clearCache('/admin/activities');
      await load();
    } else {
      showMessage('保存失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('[Activity] 保存失败:', e);
    showMessage('保存失败: ' + (e.message || '网络/服务器错误'), 'error');
  } finally {
    saving.value = false;
  }
}
async function del(id: number) {
  if (!confirm('确认删除该活动？')) return;
  try { await adminApi.deleteActivity(id); load(); } catch (e: any) { alert('删除失败: ' + e.message); }
}
onMounted(load);
</script>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; gap: 12px; justify-content: space-between; align-items: center; }
.page-toolbar h3 { font-size: 1rem; font-weight: 600; }
.data-table-wrapper { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: var(--color-surface-alt); padding: 10px 12px; text-align: left; font-size: 0.6875rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.data-table td { padding: 10px 12px; font-size: 0.8125rem; border-bottom: 1px solid var(--color-border-light); vertical-align: middle; }
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--color-surface-warm); }
.badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: var(--radius-sm); }
.badge.public { background: rgba(34,139,34,0.1); color: #228b22; }
.badge.private { background: rgba(128,128,128,0.1); color: #888; }
.btn-text { background: none; border: none; color: var(--color-primary); font-size: 0.75rem; cursor: pointer; margin-right: 6px; padding: 2px 4px; border-radius: var(--radius-sm); }
.btn-text:hover { background: rgba(var(--color-primary-rgb),0.06); }
.btn-text.danger { color: var(--color-error); }
.empty-table { padding: 48px; text-align: center; color: var(--color-text-muted); }

.message-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}
.message-toast.success { background: rgba(90,123,108,0.9); color: #fff; }
.message-toast.error { background: rgba(139,58,42,0.9); color: #fff; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 24px; width: 100%; max-width: 600px; max-height: 85vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-muted); }
.modal-body { display: flex; flex-direction: column; gap: 14px; }
.form-group label { display: block; font-size: 0.75rem; font-weight: 500; margin-bottom: 5px; color: var(--color-text-light); }
.form-group .atca-input { width: 100%; }
.form-row { display: flex; gap: 14px; }
.form-row .form-group { flex: 1; }
.required { color: var(--color-error); }
.hint { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); }
</style>
