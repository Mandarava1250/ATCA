<template>
  <div class="admin-page">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(91,123,76,0.15);color:#7CB342;">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.topicCount }}</div>
          <div class="stat-label">论坛主题</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(100,149,237,0.15);color:#6495ED;">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.replyCount }}</div>
          <div class="stat-label">回复总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(201,169,110,0.15);color:var(--gold);">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.shareCount }}</div>
          <div class="stat-label">建筑分享</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(199,92,58,0.15);color:#C75C3A;">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.mutedCount }}</div>
          <div class="stat-label">已禁言用户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(201,169,110,0.15);color:var(--gold);">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 2v6h6" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.noteCount }}</div>
          <div class="stat-label">笔记总数</div>
        </div>
      </div>
    </div>

    <!-- Tab切换 -->
    <div class="sub-tabs">
      <button class="sub-tab" :class="{ active: activeSubTab === 'topics' }" @click="activeSubTab = 'topics'">
        论坛主题管理
      </button>
      <button class="sub-tab" :class="{ active: activeSubTab === 'shares' }" @click="activeSubTab = 'shares'">
        建筑分享管理
      </button>
      <button class="sub-tab" :class="{ active: activeSubTab === 'users' }" @click="activeSubTab = 'users'">
        用户禁言管理
      </button>
      <button class="sub-tab" :class="{ active: activeSubTab === 'notes' }" @click="activeSubTab = 'notes'">
        笔记管理 ({{ allNotes.length }})
      </button>
    </div>

    <!-- 论坛主题管理 -->
    <div v-if="activeSubTab === 'topics'" class="tab-panel">
      <div class="page-toolbar">
        <input v-model="topicSearch" class="atca-input search-input" placeholder="搜索主题标题或作者..." @input="debounceSearchTopics" />
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>作者</th>
              <th>板块</th>
              <th>回复</th>
              <th>浏览</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTopics" :key="t.topic_id">
              <td>{{ t.topic_id }}</td>
              <td class="td-title">{{ t.title }}</td>
              <td>{{ t.username || '-' }}</td>
              <td>{{ t.board_name || '-' }}</td>
              <td>{{ t.reply_count || 0 }}</td>
              <td>{{ t.view_count || 0 }}</td>
              <td>{{ formatDate(t.created_at) }}</td>
              <td>
                <button class="btn-text" @click="viewTopic(t.topic_id)">查看</button>
                <button class="btn-text danger" @click="deleteTopic(t.topic_id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredTopics.length" class="empty-table">暂无帖子</div>
      </div>
    </div>

    <!-- 建筑分享管理 -->
    <div v-if="activeSubTab === 'shares'" class="tab-panel">
      <div class="page-toolbar">
        <input v-model="shareSearch" class="atca-input search-input" placeholder="搜索建筑名称..." @input="debounceSearchShares" />
        <div class="segmented-control">
          <button :class="{ active: shareView === 'shares' }" @click="shareView = 'shares'">建筑分享</button>
          <button :class="{ active: shareView === 'models' }" @click="shareView = 'models'">公开3D模型</button>
        </div>
      </div>
      <!-- 建筑分享列表 -->
      <div v-if="shareView === 'shares'" class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>作者</th>
              <th>朝代</th>
              <th>类型</th>
              <th>精选</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredShares" :key="s.share_id">
              <td>{{ s.share_id }}</td>
              <td class="td-title">{{ s.title }}</td>
              <td>{{ s.username || '-' }}</td>
              <td>{{ s.era || '-' }}</td>
              <td>{{ s.building_type || '-' }}</td>
              <td>
                <span class="tag" :class="s.is_featured ? 'active' : 'inactive'">{{ s.is_featured ? '是' : '否' }}</span>
              </td>
              <td>{{ formatDate(s.created_at) }}</td>
              <td>
                <button class="btn-text" @click="toggleFeatured(s)">{{ s.is_featured ? '取消精选' : '设为精选' }}</button>
                <button class="btn-text danger" @click="deleteShare(s.share_id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredShares.length" class="empty-table">暂无分享</div>
      </div>
      <!-- 公开3D模型列表 -->
      <div v-if="shareView === 'models'" class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
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
            <tr v-for="m in filteredPublicModels" :key="m.model_id">
              <td>{{ m.model_id }}</td>
              <td class="td-title">{{ m.model_name }}</td>
              <td>{{ m.username || '-' }}</td>
              <td>{{ m.component_count || 0 }}</td>
              <td>
                <span class="tag" :class="m.is_public ? 'active' : 'inactive'">{{ m.is_public ? '是' : '否' }}</span>
              </td>
              <td>
                <span class="tag" :class="m.is_featured ? 'active' : 'inactive'">{{ m.is_featured ? '是' : '否' }}</span>
              </td>
              <td>{{ formatDate(m.created_at) }}</td>
              <td>
                <button class="btn-text" @click="openModelEditor(m.model_id)">打开</button>
                <button class="btn-text danger" @click="deletePublicModel(m.model_id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredPublicModels.length" class="empty-table">暂无公开3D模型</div>
      </div>
    </div>

    <!-- 用户禁言管理 -->
    <div v-if="activeSubTab === 'users'" class="tab-panel">
      <div class="page-toolbar">
        <input v-model="userSearch" class="atca-input search-input" placeholder="搜索用户名..." @input="debounceSearchUsers" />
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>昵称</th>
              <th>角色</th>
              <th>禁言状态</th>
              <th>禁言原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredMuteUsers" :key="u.user_id">
              <td>{{ u.user_id }}</td>
              <td>{{ u.username }}</td>
              <td>{{ u.nickname || '-' }}</td>
              <td><span class="tag" :class="u.role">{{ u.role }}</span></td>
              <td>
                <span class="tag" :class="u.is_muted ? 'banned' : 'active'">{{ u.is_muted ? '已禁言' : '正常' }}</span>
              </td>
              <td>{{ u.mute_reason || '-' }}</td>
              <td>
                <button v-if="!u.is_muted" class="btn-text danger" @click="muteUser(u)">禁言</button>
                <button v-else class="btn-text" style="color:#16a34a;" @click="unmuteUser(u.user_id)">解除禁言</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredMuteUsers.length" class="empty-table">暂无用户数据</div>
      </div>
    </div>

    <!-- 笔记管理 Tab -->
    <div v-if="activeSubTab === 'notes'" class="tab-panel">
      <div class="page-toolbar">
        <input v-model="noteSearch" class="atca-input search-input" placeholder="搜索笔记标题或内容..." />
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>内容摘要</th>
              <th>标签</th>
              <th>关联建筑</th>
              <th>可见性</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in filteredNotes" :key="n.id">
              <td class="td-title">{{ n.title }}</td>
              <td>{{ n.content.substring(0, 50) }}{{ n.content.length > 50 ? '...' : '' }}</td>
              <td>
                <span v-for="tag in n.tags" :key="tag" class="tag user">{{ tag }}</span>
              </td>
              <td>{{ n.relatedBuildingName || '-' }}</td>
              <td>
                <span class="tag" :class="n.isPublic ? 'active' : 'inactive'">{{ n.isPublic ? '公开' : '私密' }}</span>
              </td>
              <td>{{ formatDate(n.createdAt) }}</td>
              <td>
                <button class="btn-text danger" @click="deleteNoteAdmin(n.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filteredNotes.length" class="empty-table">暂无笔记数据</div>
      </div>
    </div>

    <!-- 禁言弹窗 -->
    <div v-if="mutingUser" class="modal-overlay" @click.self="mutingUser = null">
      <div class="modal-card">
        <h3>禁言用户：{{ mutingUser.username }}</h3>
        <div class="form-group">
          <label>禁言原因</label>
          <textarea v-model="muteForm.reason" rows="3" class="atca-input" placeholder="请输入禁言原因..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="atca-btn atca-btn-secondary" @click="mutingUser = null">取消</button>
          <button class="atca-btn atca-btn-danger" @click="confirmMute">确认禁言</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { adminApi, socialApi, model3dApi } from '@/services/api';
import { noteManager } from '@/utils/noteManager';

const activeSubTab = ref('topics');
const allTopics = ref<any[]>([]);
const allShares = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const allNotes = ref<any[]>([]);
const allPublicModels = ref<any[]>([]);
const topicSearch = ref('');
const shareSearch = ref('');
const userSearch = ref('');
const noteSearch = ref('');
const shareView = ref<'shares' | 'models'>('shares');
const stats = ref({ topicCount: 0, replyCount: 0, shareCount: 0, mutedCount: 0, noteCount: 0 });

const mutingUser = ref<any>(null);
const muteForm = ref({ reason: '' });

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const filteredTopics = computed(() => {
  if (!topicSearch.value) return allTopics.value;
  const s = topicSearch.value.toLowerCase();
  return allTopics.value.filter(t => (t.title || '').toLowerCase().includes(s) || (t.username || '').toLowerCase().includes(s));
});

const filteredShares = computed(() => {
  if (!shareSearch.value) return allShares.value;
  const s = shareSearch.value.toLowerCase();
  return allShares.value.filter(s2 => (s2.title || '').toLowerCase().includes(s) || (s2.username || '').toLowerCase().includes(s));
});

const filteredMuteUsers = computed(() => {
  if (!userSearch.value) return allUsers.value;
  const s = userSearch.value.toLowerCase();
  return allUsers.value.filter(u => (u.username || '').toLowerCase().includes(s) || (u.nickname || '').toLowerCase().includes(s));
});

const filteredNotes = computed(() => {
  if (!noteSearch.value) return allNotes.value;
  const s = noteSearch.value.toLowerCase();
  return allNotes.value.filter(n => (n.title || '').toLowerCase().includes(s) || (n.content || '').toLowerCase().includes(s));
});

const filteredPublicModels = computed(() => {
  if (!shareSearch.value) return allPublicModels.value;
  const s = shareSearch.value.toLowerCase();
  return allPublicModels.value.filter((m: any) => (m.model_name || '').toLowerCase().includes(s) || (m.username || '').toLowerCase().includes(s));
});

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('zh-CN');
}

function debounceSearchTopics() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {}, 300);
}
function debounceSearchShares() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {}, 300);
}
function debounceSearchUsers() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {}, 300);
}

async function loadStats() {
  try {
    const [tRes, sRes, uRes] = await Promise.all([
      socialApi.getForumBoards().catch(() => ({ success: false, data: [] })),
      socialApi.getBuildingShares().catch(() => ({ success: false, data: [] })),
      adminApi.getUsers({ page: 1, limit: 1000 }).catch(() => ({ success: false, data: [] })),
    ]);
    // 计算统计数据
    const boards = tRes.data || [];
    const topics = boards.reduce((sum: number, b: any) => sum + (b.topic_count || 0), 0);
    stats.value.shareCount = (sRes.data || []).length;
    stats.value.topicCount = topics;
    const users = uRes.data || [];
    stats.value.mutedCount = users.filter((u: any) => u.is_muted).length;
    stats.value.noteCount = noteManager.getAll().length;
  } catch (e) { console.error('[Stats]', e); }
}

async function loadTopics() {
  try {
    const res = await socialApi.getAllTopics();
    if (res.success) allTopics.value = res.data || [];
  } catch (e) { console.error('[Topics]', e); }
}

async function loadShares() {
  try {
    const res = await socialApi.getBuildingShares();
    if (res.success) allShares.value = res.data || [];
  } catch (e) { console.error('[Shares]', e); }
}

async function loadPublicModels() {
  try {
    const res = await model3dApi.list({ is_public: '1', page: 1, limit: 1000 });
    if (res.success) allPublicModels.value = res.data || [];
  } catch (e) { console.error('[PublicModels]', e); }
}

function openModelEditor(id: number) {
  window.open('/#/workshop/editor?load=' + id, '_blank');
}

async function deletePublicModel(id: number) {
  if (!confirm('确定删除此公开3D模型？此操作不可撤销。')) return;
  try {
    await model3dApi.deleteModel(id);
    await loadPublicModels();
  } catch (e) { console.error(e); }
}

async function loadUsers() {
  try {
    const res = await adminApi.getUsers({ page: 1, limit: 1000 });
    if (res.success) allUsers.value = res.data || [];
  } catch (e) { console.error('[Users]', e); }
}

function viewTopic(id: number) {
  window.open(`/#/community?tab=forum&topic=${id}`, '_blank');
}

async function deleteTopic(id: number) {
  if (!confirm('确定删除此主题？此操作不可撤销。')) return;
  try {
    await socialApi.deleteTopicAdmin(id);
    await loadTopics();
  } catch (e) { console.error(e); }
}

async function deleteShare(id: number) {
  if (!confirm('确定删除此分享？此操作不可撤销。')) return;
  try {
    await socialApi.deleteShare(id);
    await loadShares();
  } catch (e) { console.error(e); }
}

async function toggleFeatured(s: any) {
  try {
    await socialApi.updateShare(s.share_id, { is_featured: !s.is_featured });
    await loadShares();
  } catch (e) { console.error(e); }
}

function muteUser(user: any) {
  mutingUser.value = user;
  muteForm.value.reason = '';
}

async function confirmMute() {
  if (!mutingUser.value) return;
  try {
    await adminApi.muteUser(mutingUser.value.user_id, { is_muted: true, mute_reason: muteForm.value.reason });
    mutingUser.value = null;
    await loadUsers();
  } catch (e) { console.error(e); }
}

async function unmuteUser(id: number) {
  if (!confirm('确定解除此用户的禁言？')) return;
  try {
    await adminApi.muteUser(id, { is_muted: false });
    await loadUsers();
  } catch (e) { console.error(e); }
}

function loadNotes() {
  // 管理员只能管理公开笔记
  allNotes.value = noteManager.getPublicNotes();
}

function deleteNoteAdmin(id: string) {
  if (!confirm('确定删除此笔记？此操作不可撤销。')) return;
  noteManager.delete(id);
  loadNotes();
  stats.value.noteCount = allNotes.value.length;
}

onMounted(async () => {
  await Promise.all([loadTopics(), loadShares(), loadUsers(), loadStats(), loadPublicModels()]);
  loadNotes();
});
</script>

<style scoped>
.admin-page { display: flex; flex-direction: column; gap: 20px; }

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--color-text); }
.stat-label { font-size: 0.75rem; color: var(--color-text-muted); }

/* 子Tab */
.sub-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--color-border);
}
.sub-tab {
  padding: 10px 20px;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.sub-tab:hover { color: var(--color-text); }
.sub-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }

.tab-panel { animation: none; }

/* 工具栏 */
.page-toolbar { display: flex; gap: 12px; margin-bottom: 12px; }
.search-input { max-width: 300px; }

/* 表格 */
.data-table-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  background: var(--color-surface-alt);
  padding: 12px 16px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.data-table td {
  padding: 12px 16px;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border-light);
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: var(--color-surface-warm); }
.td-title { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 标签 */
.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}
.tag.admin { background: rgba(139, 37, 0, 0.1); color: var(--color-primary); }
.tag.moderator { background: rgba(184, 134, 11, 0.1); color: var(--color-gold); }
.tag.user { background: rgba(107, 114, 128, 0.1); color: var(--color-text-muted); }
.tag.active { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
.tag.inactive { background: rgba(107, 114, 128, 0.1); color: var(--color-text-muted); }
.tag.banned { background: rgba(239, 68, 68, 0.1); color: #dc2626; }

.btn-text {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.8125rem;
  cursor: pointer;
  margin-right: 8px;
}
.btn-text.danger { color: var(--color-error); }

.empty-table { padding: 48px; text-align: center; color: var(--color-text-muted); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
}
.modal-card h3 { margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 6px; color: var(--color-text-light); }
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.atca-btn-danger {
  background: rgba(199, 92, 58, 0.15) !important;
  color: #C75C3A !important;
  border-color: rgba(199, 92, 58, 0.3) !important;
}

.segmented-control { display: flex; gap: 0; background: var(--color-surface-alt); border-radius: var(--radius-md); padding: 3px; }
.segmented-control button { padding: 6px 14px; border: none; background: transparent; color: var(--color-text-muted); font-size: 0.8125rem; cursor: pointer; border-radius: var(--radius-sm); transition: all var(--transition-fast); }
.segmented-control button.active { background: var(--color-surface); color: var(--color-text); font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.segmented-control button:hover:not(.active) { color: var(--color-text); }

@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
