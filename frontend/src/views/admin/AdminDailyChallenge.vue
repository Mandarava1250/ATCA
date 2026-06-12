<template>
  <div class="admin-page">
    <div class="page-toolbar">
      <h3>每日签到题目设置</h3>
      <div style="display:flex;gap:8px;align-items:center">
        <div v-if="selectedIds.length > 0" class="batch-bar">
          <span>已选 {{ selectedIds.length }} 项</span>
          <button class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDelete">批量删除</button>
          <button class="atca-btn atca-btn-sm" @click="selectedIds = []">取消</button>
        </div>
        <button class="atca-btn atca-btn-primary" @click="openAdd">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          添加签到
        </button>
      </div>
    </div>

    <!-- 签到列表 -->
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check"><input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" /></th>
            <th>ID</th>
            <th>日期</th>
            <th>题目</th>
            <th>类型</th>
            <th>奖励积分</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in challenges" :key="c.challenge_id">
            <td class="col-check"><input type="checkbox" :value="c.challenge_id" v-model="selectedIds" /></td>
            <td>{{ c.challenge_id }}</td>
            <td>{{ c.challenge_date }}</td>
            <td>{{ c.question_text }}</td>
            <td><span class="atca-tag">{{ c.question_type || '单选' }}</span></td>
            <td>{{ c.points || 10 }}</td>
            <td>
              <span class="badge" :class="c.is_active ? 'public' : 'private'">{{ c.is_active ? '进行中' : '已结束' }}</span>
            </td>
            <td>
              <button class="btn-text" @click="editChallenge(c)">编辑</button>
              <button class="btn-text danger" @click="deleteChallenge(c.challenge_id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!challenges.length" class="empty-table">
        <div v-if="loadError" style="color:var(--color-error)">{{ loadError }}</div>
        <div v-else>暂无签到数据</div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <h3>{{ editingId ? '编辑签到' : '添加每日签到' }}</h3>
          <button class="modal-close" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <!-- 题目来源选择 -->
          <div class="form-group">
            <label>题目来源 <span class="required">*</span></label>
            <select v-model="form.source_type" class="atca-input" @change="onSourceChange">
              <option value="existing">从题库选择</option>
              <option value="new">新建题目</option>
            </select>
          </div>

          <!-- 单道/多道切换 -->
          <div v-if="form.source_type === 'existing'" class="form-group">
            <label>选题模式</label>
            <select v-model="form.selection_mode" class="atca-input">
              <option value="single">单道题目</option>
              <option value="multiple">多道题目</option>
            </select>
          </div>

          <!-- 从题库选择 - 单道 -->
          <div v-if="form.source_type === 'existing' && form.selection_mode === 'single'" class="form-group">
            <label>选择题目 <span class="required">*</span></label>
            <select v-model="form.question_id" class="atca-input">
              <option value="">请选择题目</option>
              <option v-for="q in questions" :key="q.question_id" :value="q.question_id">
                [{{ q.question_type }}] {{ q.question_text.substring(0, 40) }}{{ q.question_text.length > 40 ? '...' : '' }}
              </option>
            </select>
            <div class="hint">共 {{ questions.length }} 道题目可选</div>
          </div>

          <!-- 从题库选择 - 多道 -->
          <div v-if="form.source_type === 'existing' && form.selection_mode === 'multiple'" class="form-group">
            <label>选择多道题目 <span class="required">*</span>（已选 {{ form.question_ids.length }} 道）</label>
            <div class="question-checklist">
              <label v-for="q in questions" :key="q.question_id" class="q-check-item">
                <input type="checkbox" :value="q.question_id" v-model="form.question_ids" />
                <span class="q-check-text">[{{ q.question_type }}] {{ q.question_text.substring(0, 50) }}{{ q.question_text.length > 50 ? '...' : '' }}</span>
              </label>
            </div>
            <div class="hint">共 {{ questions.length }} 道题目可选</div>
          </div>

          <!-- 新建题目 -->
          <div v-if="form.source_type === 'new'">
            <div class="form-group">
              <label>题目内容 <span class="required">*</span></label>
              <textarea v-model="form.question_text" class="atca-input" rows="2" placeholder="输入题目..." />
            </div>
            <div class="form-group">
              <label>题目类型</label>
              <select v-model="form.question_type" class="atca-input">
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judge">判断题</option>
              </select>
            </div>
            <div class="form-group">
              <label>选项（每行一个，正确答案前加*）</label>
              <textarea v-model="form.options" class="atca-input" rows="4" placeholder="*正确选项&#10;错误选项1&#10;错误选项2&#10;错误选项3" />
            </div>
          </div>

          <!-- 日期设置 -->
          <div class="form-group">
            <label>签到日期 <span class="required">*</span></label>
            <input v-model="form.challenge_date" type="date" class="atca-input" />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>奖励积分</label>
              <input v-model.number="form.points" type="number" min="1" max="100" class="atca-input" />
            </div>
            <div class="form-group flex-1">
              <label>状态</label>
              <select v-model="form.is_active" class="atca-input">
                <option :value="true">进行中</option>
                <option :value="false">已结束</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="atca-btn" @click="closeModal">取消</button>
          <button class="atca-btn atca-btn-primary" @click="saveChallenge" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { adminApi } from '@/services/api';

const challenges = ref<any[]>([]);
const questions = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const isAllSelected = computed(() => challenges.value.length > 0 && selectedIds.value.length === challenges.value.length);
function toggleSelectAll() { if (isAllSelected.value) selectedIds.value = []; else selectedIds.value = challenges.value.map(c => c.challenge_id); }
const loadError = ref('');
const showModal = ref(false);
const editingId = ref<number | null>(null);
const saving = ref(false);

const form = ref({
  source_type: 'existing' as 'existing' | 'new',
  selection_mode: 'single' as 'single' | 'multiple',
  question_id: '',
  question_ids: [] as number[],
  question_text: '',
  question_type: 'single',
  options: '',
  challenge_date: new Date().toISOString().split('T')[0],
  points: 10,
  is_active: true,
});

function resetForm() {
  form.value = {
    source_type: 'existing',
    selection_mode: 'single',
    question_id: '',
    question_ids: [],
    question_text: '',
    question_type: 'single',
    options: '',
    challenge_date: new Date().toISOString().split('T')[0],
    points: 10,
    is_active: true,
  };
}

function onSourceChange() {
  form.value.question_id = '';
  form.value.question_text = '';
  form.value.options = '';
}

async function loadData() {
  loadError.value = '';
  try {
    const res = await adminApi.getDailyChallenges();
    challenges.value = res.data || [];
  } catch (e: any) {
    loadError.value = '加载失败: ' + (e.message || '网络错误');
  }
}

async function loadQuestions() {
  try {
    const res = await adminApi.getQuestions();
    questions.value = res.data || [];
  } catch (e) { console.error(e); }
}

function openAdd() {
  editingId.value = null;
  resetForm();
  loadQuestions();
  showModal.value = true;
}

function editChallenge(c: any) {
  editingId.value = c.challenge_id;
  form.value = {
    source_type: 'existing',
    selection_mode: 'single',
    question_id: c.question_id || '',
    question_ids: [],
    question_text: c.question_text || '',
    question_type: c.question_type || 'single',
    options: '',
    challenge_date: c.challenge_date || new Date().toISOString().split('T')[0],
    points: c.points || 10,
    is_active: c.is_active !== false,
  };
  loadQuestions();
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingId.value = null;
  resetForm();
}

async function saveChallenge() {
  // 校验
  if (form.value.source_type === 'existing' && form.value.selection_mode === 'single' && !form.value.question_id) {
    alert('请选择题目'); return;
  }
  if (form.value.source_type === 'existing' && form.value.selection_mode === 'multiple' && form.value.question_ids.length === 0) {
    alert('请至少选择一道题目'); return;
  }
  if (form.value.source_type === 'new' && !form.value.question_text.trim()) {
    alert('请输入题目内容'); return;
  }
  if (!form.value.challenge_date) {
    alert('请选择日期'); return;
  }

  saving.value = true;
  try {
    const basePayload: any = {
      challenge_date: form.value.challenge_date,
      points: form.value.points,
      is_active: form.value.is_active,
    };

    if (form.value.source_type === 'existing') {
      if (form.value.selection_mode === 'single') {
        // 单道题目模式
        const payload = { ...basePayload };
        payload.question_id = parseInt(form.value.question_id);
        const q = questions.value.find((q: any) => q.question_id == form.value.question_id);
        if (q) {
          payload.question_text = q.question_text;
          payload.question_type = q.question_type;
        }
        if (editingId.value) {
          await adminApi.updateDailyChallenge(editingId.value, payload);
        } else {
          await adminApi.createDailyChallenge(payload);
        }
      } else {
        // 多道题目模式：批量创建
        const payloads = form.value.question_ids.map((qid: number) => {
          const q = questions.value.find((q2: any) => q2.question_id == qid);
          return {
            ...basePayload,
            question_id: qid,
            question_text: q?.question_text || '',
            question_type: q?.question_type || 'single',
          };
        });
        await adminApi.batchCreateDailyChallenges(payloads);
      }
    } else {
      // 新建题目模式
      const payload = {
        ...basePayload,
        question_text: form.value.question_text,
        question_type: form.value.question_type,
        options: form.value.options,
      };
      if (editingId.value) {
        await adminApi.updateDailyChallenge(editingId.value, payload);
      } else {
        await adminApi.createDailyChallenge(payload);
      }
    }
    closeModal();
    loadData();
  } catch (e: any) {
    alert('保存失败: ' + (e.response?.data?.error?.message || e.message));
  } finally {
    saving.value = false;
  }
}

async function deleteChallenge(id: number) {
  if (!confirm('确认删除此签到？')) return;
  try { await adminApi.deleteDailyChallenge(id); loadData(); }
  catch (e: any) { alert('删除失败: ' + e.message); }
}

async function batchDelete() {
  if (!selectedIds.value.length || !confirm(`确认删除 ${selectedIds.value.length} 个签到？`)) return;
  try {
    await adminApi.batchDeleteDailyChallenges(selectedIds.value);
    selectedIds.value = [];
    loadData();
  } catch (e: any) { alert('批量删除失败: ' + e.message); }
}

onMounted(() => { loadData(); });
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

.col-check { width: 40px; text-align: center; }
.atca-tag { font-size: 0.6875rem; padding: 2px 8px; background: rgba(var(--color-primary-rgb), 0.08); color: var(--color-primary); border-radius: var(--radius-sm); }
.badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: var(--radius-sm); }
.badge.public { background: rgba(34, 139, 34, 0.1); color: #228b22; }
.badge.private { background: rgba(128, 128, 128, 0.1); color: #888; }

.btn-text { background: none; border: none; color: var(--color-primary); font-size: 0.75rem; cursor: pointer; margin-right: 6px; padding: 2px 4px; border-radius: var(--radius-sm); }
.btn-text:hover { background: rgba(var(--color-primary-rgb), 0.06); }
.btn-text.danger { color: var(--color-error); }
.empty-table { padding: 48px; text-align: center; color: var(--color-text-muted); }
.batch-bar { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 24px; width: 100%; max-width: 600px; max-height: 85vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-muted); }
.modal-body { display: flex; flex-direction: column; gap: 14px; }
.form-group label { display: block; font-size: 0.75rem; font-weight: 500; margin-bottom: 5px; color: var(--color-text-light); }
.form-group .atca-input { width: 100%; }
.form-row { display: flex; gap: 14px; }
.form-row .form-group { flex: 1; }
.hint { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; }
.required { color: var(--color-error); }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); }

.question-checklist { max-height: 200px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px; background: var(--color-surface-alt); }
.q-check-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 8px; border-radius: var(--radius-sm); cursor: pointer; transition: background var(--transition-fast); font-size: 0.8125rem; }
.q-check-item:hover { background: rgba(var(--color-primary-rgb), 0.04); }
.q-check-item input { margin-top: 2px; flex-shrink: 0; }
.q-check-text { color: var(--color-text-light); line-height: 1.4; }
</style>
