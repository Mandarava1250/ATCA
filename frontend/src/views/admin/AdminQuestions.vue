<template>
  <div class="admin-page">
    <!-- 消息提示 -->
    <div v-if="messageText" class="message-toast" :class="messageType">
      {{ messageText }}
    </div>

    <!-- Tab切换 -->
    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: activeTab === 'questions' }" @click="activeTab = 'questions'">题库管理</button>
      <button class="tab-btn" :class="{ active: activeTab === 'daily' }" @click="activeTab = 'daily'">每日打卡管理</button>
    </div>

    <!-- ===== 题库管理 ===== -->
    <div v-if="activeTab === 'questions'">
      <div class="page-toolbar">
        <input v-model="search" @input="debounceSearch" class="atca-input search-input" placeholder="搜索题目..." />
        <button class="atca-btn atca-btn-primary" @click="showAdd = true">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          新增
        </button>
      </div>

      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" @change="toggleSelectAll" :checked="isAllSelected" /></th>
              <th>ID</th>
              <th>题目</th>
              <th>难度</th>
              <th>分值</th>
              <th>分类</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in questions" :key="q.question_id">
              <td class="col-check"><input type="checkbox" :value="q.question_id" v-model="selectedIds" /></td>
              <td>{{ q.question_id }}</td>
              <td class="cell-ellipsis">{{ q.question_text }}</td>
              <td><span class="tag" :class="q.difficulty">{{ q.difficulty }}</span></td>
              <td>{{ q.points }}</td>
              <td>{{ q.category || '-' }}</td>
              <td>
                <button class="btn-text" @click="editQ(q)">编辑</button>
                <button class="btn-text danger" @click="deleteQ(q.question_id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!questions.length" class="empty-table">暂无数据</div>
      </div>
      <div v-if="selectedIds.length > 0" class="batch-actions">
        <button class="atca-btn atca-btn-danger" @click="batchDelete">
          删除选中 ({{ selectedIds.length }})
        </button>
      </div>
    </div>

    <!-- ===== 每日打卡管理 ===== -->
    <div v-if="activeTab === 'daily'">
      <div class="page-toolbar">
        <h3 style="margin:0;font-size:1rem;">每日打卡题管理</h3>
        <div class="toolbar-right">
          <button class="atca-btn atca-btn-primary" @click="showDailyModal = true">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            新建打卡
          </button>
        </div>
      </div>

      <!-- 已设置的打卡列表 -->
      <div class="daily-card-grid">
        <div v-for="daily in dailyList" :key="daily.challenge_id" class="daily-card">
          <div class="daily-card-header">
            <div class="daily-date">
              <span class="date-day">{{ formatDay(daily.challenge_date) }}</span>
              <span class="date-month">{{ formatMonth(daily.challenge_date) }}</span>
            </div>
            <div class="daily-info">
              <h4>{{ daily.title || `每日打卡 ${daily.challenge_date}` }}</h4>
              <div class="daily-meta">
                <span class="meta-item">{{ daily.question_count || 0 }} 道题</span>
                <span class="meta-item">奖励 {{ daily.points_reward }} 积分</span>
                <span class="meta-item">{{ daily.time_limit }}秒限时</span>
              </div>
            </div>
            <div class="daily-actions">
              <button class="btn-icon" @click="editDaily(daily)" title="编辑">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </button>
              <button class="btn-icon danger" @click="deleteDaily(daily.challenge_id)" title="删除">
                <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 6h18" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8 6V4c0-.6.4-1 1-1h6c.6 0 1 .4 1 1v2" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              </button>
            </div>
          </div>
          <div class="daily-card-body">
            <div class="questions-preview">
              <div v-for="(q, idx) in daily.questions?.slice(0, 3) || []" :key="idx" class="question-preview">
                <span class="q-num">{{ (idx as number) + 1 }}.</span>
                <span class="q-text">{{ q.question_text?.substring(0, 40) }}{{ q.question_text?.length > 40 ? '...' : '' }}</span>
                <span class="q-tag" :class="q.difficulty">{{ q.difficulty }}</span>
              </div>
              <div v-if="(daily.question_count || 0) > 3" class="more-questions">
                还有 {{ daily.question_count - 3 }} 道题...
              </div>
              <div v-if="!daily.questions?.length" class="no-questions">
                暂无题目，请编辑添加
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!dailyList.length" class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>暂无每日打卡设置</h3>
        <p>点击右上角"新建打卡"创建每日打卡任务</p>
      </div>
    </div>

    <!-- 题目编辑弹窗 -->
    <div v-if="showAdd || editingQ" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card modal-lg">
        <h3>{{ editingQ ? '编辑题目' : '新增题目' }}</h3>
        <div class="form-grid">
          <div class="form-group full"><label>题目 *</label><textarea v-model="form.question_text" class="atca-input" rows="2" required></textarea></div>
          <div class="form-group"><label>选项A *</label><input v-model="form.option_a" class="atca-input" required /></div>
          <div class="form-group"><label>选项B *</label><input v-model="form.option_b" class="atca-input" required /></div>
          <div class="form-group"><label>选项C</label><input v-model="form.option_c" class="atca-input" /></div>
          <div class="form-group"><label>选项D</label><input v-model="form.option_d" class="atca-input" /></div>
          <div class="form-group"><label>正确答案 *</label>
            <select v-model="form.correct_answer" class="atca-input" required>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
            </select>
          </div>
          <div class="form-group"><label>难度 *</label>
            <select v-model="form.difficulty" class="atca-input" required>
              <option>入门</option><option>基础</option><option>挑战</option><option>进阶</option><option>资深</option>
            </select>
          </div>
          <div class="form-group"><label>分值 *</label><input v-model.number="form.points" type="number" class="atca-input" required min="1" /></div>
          <div class="form-group"><label>分类</label><input v-model="form.category" class="atca-input" /></div>
          <div class="form-group full"><label>解析</label><textarea v-model="form.explanation" class="atca-input" rows="2"></textarea></div>
        </div>
        <div class="modal-actions">
          <button class="atca-btn" @click="closeModal">取消</button>
          <button class="atca-btn atca-btn-primary" @click="saveQ">保存</button>
        </div>
      </div>
    </div>

    <!-- 每日打卡编辑弹窗 -->
    <div v-if="showDailyModal" class="daily-modal-overlay" @click.self="closeDailyModal">
      <div class="daily-modal-card">
        <!-- 弹窗头部 -->
        <div class="daily-modal-header">
          <div class="modal-title-wrap">
            <div class="modal-icon">📅</div>
            <div>
              <h3>{{ editingDaily ? '编辑每日打卡' : '新建每日打卡' }}</h3>
              <p class="modal-subtitle">{{ editingDaily ? '修改打卡配置' : '创建新的每日打卡任务' }}</p>
            </div>
          </div>
          <button class="modal-close-btn" @click="closeDailyModal">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 6L5 6M12 19V7" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          </button>
        </div>

        <div class="daily-modal-body">
          <!-- 基本信息卡片 -->
          <div class="form-card">
            <div class="card-header">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>
              <span>基本信息</span>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label>日期 <span class="required">*</span></label>
                <input v-model="dailyForm.challenge_date" type="date" class="form-input" required />
              </div>
              <div class="form-group">
                <label>标题</label>
                <input v-model="dailyForm.title" class="form-input" placeholder="如：周一挑战" />
              </div>
              <div class="form-group">
                <label>奖励积分 <span class="required">*</span></label>
                <div class="input-with-unit">
                  <input v-model.number="dailyForm.points_reward" type="number" class="form-input" required min="1" />
                  <span class="input-unit">积分</span>
                </div>
              </div>
              <div class="form-group">
                <label>限时 <span class="required">*</span></label>
                <div class="input-with-unit">
                  <input v-model.number="dailyForm.time_limit" type="number" class="form-input" required min="30" />
                  <span class="input-unit">秒</span>
                </div>
              </div>
              <div class="form-group full">
                <label>描述</label>
                <textarea v-model="dailyForm.description" class="form-input form-textarea" placeholder="给用户的提示或说明..."></textarea>
              </div>
            </div>
          </div>

          <!-- 题目列表卡片 -->
          <div class="form-card">
            <div class="card-header">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <span>题目列表</span>
              <button class="add-question-btn" @click="addDailyQuestion">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                添加题目
              </button>
            </div>
            
            <div v-if="dailyForm.questions.length === 0" class="empty-state-card">
              <div class="empty-icon">📝</div>
              <p>还没有添加题目</p>
              <button class="add-question-btn-primary" @click="addDailyQuestion">添加题目</button>
            </div>

            <div v-else class="questions-list">
              <div v-for="(item, idx) in dailyForm.questions" :key="idx" class="question-card">
                <div class="question-card-header">
                  <span class="question-number">{{ idx + 1 }}</span>
                  <select v-model="item.source_type" class="source-select" @change="item.question_id = ''; item.question_text = ''">
                    <option value="existing">从题库选择</option>
                    <option value="new">新建题目</option>
                  </select>
                  <button class="remove-question-btn" @click="removeDailyQuestion(idx)" title="删除题目">
                    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6L5 6M12 19V7" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  </button>
                </div>
                
                <!-- 从题库选择 -->
                <div v-if="item.source_type === 'existing'" class="question-select-wrap">
                  <select v-model="item.question_id" class="question-select">
                    <option value="">请选择题目</option>
                    <option v-for="q in questions" :key="q.question_id" :value="q.question_id">
                      [{{ q.difficulty }}] {{ q.question_text.substring(0, 40) }}{{ q.question_text.length > 40 ? '...' : '' }}
                    </option>
                  </select>
                </div>
                
                <!-- 新建题目 -->
                <div v-else class="new-question-form">
                  <div class="form-row">
                    <label class="form-label">题目内容</label>
                    <textarea v-model="item.question_text" class="form-input question-textarea" placeholder="请输入题目内容..."></textarea>
                  </div>
                  
                  <div class="form-row">
                    <label class="form-label">选项设置</label>
                    <div class="options-grid">
                      <div class="option-box">
                        <span class="option-badge" :class="{ active: item.correct_answer === 'A' }">A</span>
                        <input v-model="item.option_a" class="option-input" placeholder="选项A" />
                      </div>
                      <div class="option-box">
                        <span class="option-badge" :class="{ active: item.correct_answer === 'B' }">B</span>
                        <input v-model="item.option_b" class="option-input" placeholder="选项B" />
                      </div>
                      <div class="option-box">
                        <span class="option-badge" :class="{ active: item.correct_answer === 'C' }">C</span>
                        <input v-model="item.option_c" class="option-input" placeholder="选项C" />
                      </div>
                      <div class="option-box">
                        <span class="option-badge" :class="{ active: item.correct_answer === 'D' }">D</span>
                        <input v-model="item.option_d" class="option-input" placeholder="选项D" />
                      </div>
                    </div>
                  </div>
                  
                  <div class="form-row">
                    <label class="form-label">答案与难度</label>
                    <div class="question-settings">
                      <select v-model="item.correct_answer" class="answer-select">
                        <option value="A">正确答案：A</option>
                        <option value="B">正确答案：B</option>
                        <option value="C">正确答案：C</option>
                        <option value="D">正确答案：D</option>
                      </select>
                      <select v-model="item.difficulty" class="difficulty-select">
                        <option value="入门">入门</option>
                        <option value="基础">基础</option>
                        <option value="挑战">挑战</option>
                        <option value="进阶">进阶</option>
                        <option value="资深">资深</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 弹窗底部 -->
        <div class="daily-modal-footer">
          <button class="btn-cancel" @click="closeDailyModal">取消</button>
          <button class="btn-save" @click="saveDaily">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 19V5M7 12l5-5 5 5" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            {{ editingDaily ? '保存修改' : '创建打卡' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { adminApi, http } from '@/services/api';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AdminQuestions');
const activeTab = ref('questions');
const questions = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const isAllSelected = computed(() => questions.value.length > 0 && selectedIds.value.length === questions.value.length);
function toggleSelectAll() { if (isAllSelected.value) selectedIds.value = []; else selectedIds.value = questions.value.map(q => q.question_id); }
const search = ref('');
const loading = ref(false);
const messageText = ref('');
const messageType = ref<'success' | 'error'>('success');
const showAdd = ref(false);

function showMessage(text: string, type: 'success' | 'error' = 'success') {
  messageText.value = text;
  messageType.value = type;
  setTimeout(() => {
    messageText.value = '';
  }, 3000);
}
const editingQ = ref<any>(null);
const form = ref<any>({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', difficulty: '入门', points: 10, category: '', explanation: '' });
let searchTimer: ReturnType<typeof setTimeout> | null = null;

// 每日打卡
interface DailyQuestion {
  source_type: 'existing' | 'new';
  question_id: string | number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: string;
}

interface DailyForm {
  challenge_date: string;
  title: string;
  points_reward: number;
  time_limit: number;
  description: string;
  questions: DailyQuestion[];
}

const dailyList = ref<any[]>([]);
const showDailyModal = ref(false);
const editingDaily = ref<any>(null);
const dailyForm = ref<DailyForm>({
  challenge_date: new Date().toISOString().slice(0, 10),
  title: '',
  points_reward: 10,
  time_limit: 300,
  description: '',
  questions: [],
});

function debounceSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadData(), 300);
}

async function loadData() {
  try {
    const res = await adminApi.getQuestions({ search: search.value, page: 1, limit: 50 });
    if (res.success) questions.value = res.data;
  } catch (e) { console.error(e); }
}

function closeModal() { 
  showAdd.value = false; 
  editingQ.value = null; 
  form.value = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A', difficulty: '入门', points: 10, category: '', explanation: '' }; 
}

function editQ(q: any) { 
  editingQ.value = q; 
  form.value = { ...q }; 
  showAdd.value = false; 
}

async function saveQ() {
  try {
    let res;
    if (editingQ.value) {
      res = await adminApi.updateQuestion(editingQ.value.question_id, form.value);
    } else {
      res = await adminApi.createQuestion(form.value);
    }
    if (res.success) {
      showMessage(editingQ.value ? '题目更新成功' : '题目创建成功');
      closeModal();
      http.clearCache('/admin/questions');
      await loadData();
    } else {
      showMessage('保存失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('[Questions] 保存失败:', e);
    showMessage('保存失败: ' + (e.message || '网络/服务器错误'), 'error');
  }
}

async function deleteQ(id: number) {
  if (!confirm('确认删除此题目？')) return;
  try { await adminApi.deleteQuestion(id); loadData(); } catch (e) { console.error(e); }
}

// 每日打卡管理
function formatDay(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

function formatMonth(dateStr: string): string {
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return months[new Date(dateStr).getMonth()];
}

function addDailyQuestion() {
  dailyForm.value.questions.push({
    source_type: 'existing' as const,
    question_id: 0,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as const,
    difficulty: '基础',
  });
}

function removeDailyQuestion(idx: number) {
  dailyForm.value.questions.splice(idx, 1);
}

function closeDailyModal() {
  showDailyModal.value = false;
  editingDaily.value = null;
  dailyForm.value = {
    challenge_date: new Date().toISOString().slice(0, 10),
    title: '',
    points_reward: 10,
    time_limit: 300,
    description: '',
    questions: [],
  };
}

function editDaily(daily: any) {
  editingDaily.value = daily;
  dailyForm.value = {
    challenge_date: daily.challenge_date,
    title: daily.title || '',
    points_reward: daily.points_reward,
    time_limit: daily.time_limit || 300,
    description: daily.description || '',
    questions: daily.questions?.map((q: any) => ({
      source_type: q.question_id != null ? 'existing' : 'new',
      question_id: q.question_id != null ? q.question_id : 0,
      question_text: q.question_text || '',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: q.correct_answer || 'A',
      difficulty: q.difficulty || '基础',
    })) || [],
  };
  showDailyModal.value = true;
}

async function loadDailyList() {
  try {
    const res = await adminApi.getDailyChallenges();
    if (res.success) dailyList.value = res.data || [];
  } catch (e) { console.error(e); }
}

async function saveDaily() {
  // 验证题目
  for (const q of dailyForm.value.questions) {
    if (q.source_type === 'existing') {
      if (!q.question_id) {
        alert('请选择题目或切换为新建题目');
        return;
      }
    } else {
      // 新建题目需要验证选项和答案
      if (!q.question_text) {
        alert('请输入题目内容');
        return;
      }
      if (!q.option_a || !q.option_b) {
        alert('至少需要填写选项A和选项B');
        return;
      }
      if (!q.correct_answer) {
        alert('请选择正确答案');
        return;
      }
    }
  }
  
  const validQuestions = dailyForm.value.questions.filter((q: any) => 
    q.source_type === 'existing' ? q.question_id : q.question_text
  );
  
  if (validQuestions.length === 0) {
    alert('请至少添加一道有效题目');
    return;
  }
  
  if (!dailyForm.value.challenge_date) {
    alert('请选择日期');
    return;
  }
  
  try {
    const data = {
      challenge_date: dailyForm.value.challenge_date,
      title: dailyForm.value.title,
      points_reward: dailyForm.value.points_reward,
      time_limit: dailyForm.value.time_limit,
      description: dailyForm.value.description,
      questions: validQuestions,
    };
    
    if (editingDaily.value) {
      await adminApi.updateDailyChallenge(editingDaily.value.challenge_id, data);
      alert('更新成功');
    } else {
      await adminApi.createDailyChallenge(data);
      alert('创建成功');
    }
    
    closeDailyModal();
    loadDailyList();
  } catch (e: any) {
    alert('保存失败: ' + (e.response?.data?.error?.message || e.message));
  }
}

async function deleteDaily(id: number) {
  if (!confirm('确认删除此打卡？')) return;
  try { 
    await adminApi.deleteDailyChallenge(id); 
    loadDailyList(); 
  } catch (e) { console.error(e); }
}

async function batchDelete() {
  if (!selectedIds.value.length || !confirm(`确认删除 ${selectedIds.value.length} 个题目？`)) return;
  loading.value = true;
  try {
    const res = await adminApi.batchDeleteQuestions(selectedIds.value);
    if (res.success) {
      const { deleted, totalRequested, truncated, duration, errors } = res.data;
      let msg = `成功删除 ${deleted} 个题目`;
      if (totalRequested !== deleted) {
        msg += ` (请求: ${totalRequested}, 实际处理: ${deleted})`;
      }
      if (truncated) {
        msg += ` (由于数量限制，部分题目未被处理)`;
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

function handleRouteChange() { loadData(); }
window.addEventListener('admin-route-change', handleRouteChange);
memTrack.trackListener('admin-route-change', 'window');
onUnmounted(() => { memTrack.untrackListener('admin-route-change', 'window'); window.removeEventListener('admin-route-change', handleRouteChange); });
onMounted(() => { loadData(); loadDailyList(); });
</script>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 16px; }

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
}
.message-toast.success { background: rgba(90,123,108,0.9); color: #fff; }
.message-toast.error { background: rgba(139,58,42,0.9); color: #fff; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* Tab */
.tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
.tab-btn { padding: 8px 20px; background: none; border: none; border-bottom: 2px solid transparent; font-size: 0.875rem; cursor: pointer; color: var(--text-muted); transition: all var(--t-fast); font-family: var(--font-serif); letter-spacing: 0.04em; }
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--gold); border-bottom-color: var(--gold); font-weight: 600; }

.page-toolbar { display: flex; gap: 12px; justify-content: space-between; align-items: center; }
.toolbar-right { display: flex; gap: 8px; }
.search-input { max-width: 300px; }

/* 表格 */
.data-table-wrapper { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: var(--bg-light); padding: 12px 16px; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
.data-table td { padding: 12px 16px; font-size: 0.875rem; border-bottom: 1px solid var(--border-light); }
.data-table tbody tr:hover { background: var(--bg-hover); }
.cell-ellipsis { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.tag { display: inline-block; padding: 2px 8px; border-radius: var(--r-sm); font-size: 0.75rem; }
.tag.入门, .tag.基础 { background: rgba(90,123,108,0.15); color: #5A7B6C; }
.tag.挑战 { background: rgba(201,169,110,0.15); color: var(--gold); }
.tag.进阶, .tag.资深 { background: rgba(139,58,42,0.15); color: #C27B7B; }

.btn-text { background: none; border: none; color: var(--gold); font-size: 0.8125rem; cursor: pointer; margin-right: 8px; }
.btn-text.danger { color: var(--c-red); }
.empty-table { padding: 48px; text-align: center; color: var(--text-muted); }

/* 批量操作 */
.batch-actions { padding: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); margin-top: 12px; }

/* 每日打卡卡片 */
.daily-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px; }
.daily-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; transition: all var(--t-fast); }
.daily-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.25); border-color: var(--gold-dim); }

.daily-card-header { display: flex; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-light); gap: 12px; }
.daily-date { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 64px; height: 64px; background: var(--bg-light); border-radius: var(--r-md); }
.date-day { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--gold); }
.date-month { font-size: 0.7rem; color: var(--text-muted); }
.daily-info { flex: 1; }
.daily-info h4 { margin: 0 0 8px 0; font-size: 0.9375rem; font-family: var(--font-serif); }
.daily-meta { display: flex; gap: 12px; }
.meta-item { font-size: 0.75rem; color: var(--text-muted); }
.daily-actions { display: flex; gap: 4px; }
.btn-icon { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 8px; border-radius: var(--r-sm); transition: all var(--t-fast); }
.btn-icon:hover { background: var(--bg-hover); color: var(--text); }
.btn-icon.danger:hover { color: var(--c-red); }

.daily-card-body { padding: 12px 16px; }
.questions-preview { display: flex; flex-direction: column; gap: 8px; }
.question-preview { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: var(--bg-light); border-radius: var(--r-sm); }
.q-num { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); width: 20px; }
.q-text { flex: 1; font-size: 0.8125rem; color: var(--text); }
.q-tag { padding: 1px 6px; border-radius: 4px; font-size: 0.65rem; }
.more-questions { font-size: 0.75rem; color: var(--text-muted); padding: 4px 8px; }
.no-questions { font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 16px; }

.empty-state { text-align: center; padding: 48px; background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--r-lg); }
.empty-icon { font-size: 3rem; margin-bottom: 12px; }
.empty-state h3 { margin: 0 0 8px 0; font-size: 1rem; }
.empty-state p { margin: 0; font-size: 0.875rem; color: var(--text-muted); }

/* 每日打卡弹窗 */
.daily-modal-overlay { 
  position: fixed; 
  inset: 0; 
  background: rgba(0,0,0,0.6); 
  display: flex; 
  align-items: flex-start; 
  justify-content: center; 
  z-index: 1000; 
  padding: 40px 20px; 
  animation: fadeIn 0.2s ease;
  backdrop-filter: blur(4px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.daily-modal-card {
  background: var(--bg-card);
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.daily-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-card) 100%);
  border-radius: var(--r-lg) var(--r-lg) 0 0;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 1.75rem;
  color: var(--gold);
}

.daily-modal-header h3 {
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  font-family: var(--font-serif);
  letter-spacing: 0.04em;
}

.modal-subtitle {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.modal-close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all var(--t-fast);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.daily-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.daily-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-light) 100%);
  border-radius: 0 0 var(--r-lg) var(--r-lg);
}

/* 表单卡片 */
.form-card {
  background: var(--bg-light);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 16px;
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
}

.add-question-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 0.75rem;
  color: var(--text);
  cursor: pointer;
  transition: all var(--t-fast);
}

.add-question-btn:hover {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--bg);
}

/* 表单布局 */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text);
}

.form-input {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 0.875rem;
  background: var(--bg);
  color: var(--text);
  transition: all var(--t-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(var(--gold-rgb), 0.15);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-with-unit .form-input {
  flex: 1;
}

.input-unit {
  font-size: 0.8125rem;
  color: var(--text-muted);
  padding-right: 4px;
}

.required {
  color: var(--c-red);
}

/* 空状态 */
.empty-state-card {
  text-align: center;
  padding: 40px;
  background: var(--bg-light);
  border-radius: var(--r-md);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.empty-state-card p {
  margin: 0 0 16px 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.add-question-btn-primary {
  padding: 10px 24px;
  background: var(--gold);
  border: none;
  border-radius: var(--r-md);
  font-size: 0.875rem;
  color: var(--bg);
  cursor: pointer;
  transition: all var(--t-fast);
  font-weight: 600;
}

.add-question-btn-primary:hover {
  background: var(--gold-light);
}

/* 题目卡片 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-card {
  background: var(--bg-light);
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  padding: 12px;
}

.question-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-light);
}

.question-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold);
  color: var(--bg);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
}

.source-select {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 0.8125rem;
  background: var(--bg);
  color: var(--text);
}

.remove-question-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--r-sm);
  transition: all var(--t-fast);
}

.remove-question-btn:hover {
  background: rgba(139,58,42,0.15);
  color: var(--c-red);
}

/* 题目选择 */
.question-select-wrap {
  padding: 8px 0;
}

.question-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 0.875rem;
  background: var(--bg);
  color: var(--text);
}

/* 新建题目表单 */
.new-question-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-textarea {
  min-height: 80px;
  resize: vertical;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.option-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-badge {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all var(--t-fast);
}

.option-badge.active {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--bg);
}

.option-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 0.8125rem;
  background: var(--bg);
  color: var(--text);
}

.option-input:focus {
  outline: none;
  border-color: var(--gold);
}

.question-settings {
  display: flex;
  gap: 12px;
}

.answer-select, .difficulty-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 0.8125rem;
  background: var(--bg);
  color: var(--text);
}

.answer-select {
  max-width: 200px;
}

.difficulty-select {
  max-width: 120px;
}

/* 弹窗样式 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 24px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-lg { max-width: 640px; }
.modal-xl { max-width: 800px; }
.modal-card h3 { margin-bottom: 20px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
</style>