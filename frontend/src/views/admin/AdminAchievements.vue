<template>
  <div class="admin-achievements">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>成就管理</h1>
      <button class="btn-primary" @click="showCreateModal = true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4"/>
        </svg>
        创建成就
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total_count }}</div>
          <div class="stat-label">总成就数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.active_count }}</div>
          <div class="stat-label">已启用</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔓</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.unlocked_count }}</div>
          <div class="stat-label">已解锁</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔒</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.locked_count }}</div>
          <div class="stat-label">未解锁</div>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filter-bar">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索成就名称..."
          @input="handleSearch"
        />
      </div>
      <select v-model="filterStatus" @change="handleFilter">
        <option value="all">全部状态</option>
        <option value="active">已启用</option>
        <option value="inactive">已禁用</option>
      </select>
    </div>

    <!-- 成就列表 -->
    <div class="achievements-list">
      <div 
        v-for="achievement in filteredAchievements" 
        :key="achievement.achievement_id"
        class="achievement-card"
      >
        <div class="achievement-icon-wrapper">
          <span class="achievement-icon">{{ achievement.icon }}</span>
        </div>
        <div class="achievement-details">
          <h3>{{ achievement.name }}</h3>
          <p class="description">{{ achievement.description }}</p>
          <div class="achievement-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 8v4l3 3"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              {{ getConditionText(achievement.condition_type, achievement.condition_value) }}
            </span>
            <span class="meta-item points">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {{ achievement.points }} 积分
            </span>
          </div>
        </div>
        <div class="achievement-actions">
          <span :class="['status-badge', achievement.is_active ? 'active' : 'inactive']">
            {{ achievement.is_active ? '启用' : '禁用' }}
          </span>
          <button class="btn-edit" @click="editAchievement(achievement)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </button>
          <button class="btn-delete" @click="confirmDelete(achievement)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredAchievements.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <p>暂无成就数据</p>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingAchievement ? '编辑成就' : '创建成就' }}</h2>
          <button class="modal-close" @click="closeModal">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form class="modal-form" @submit.prevent="saveAchievement">
          <div class="form-group">
            <label>成就名称 *</label>
            <input 
              v-model="formData.name" 
              type="text" 
              required
              placeholder="请输入成就名称"
            />
          </div>
          <div class="form-group">
            <label>成就描述</label>
            <textarea 
              v-model="formData.description" 
              placeholder="请输入成就描述"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>图标 *</label>
            <div class="icon-input">
              <input 
                v-model="formData.icon" 
                type="text" 
                required
                placeholder="输入emoji或图片路径"
              />
              <span class="icon-preview">{{ formData.icon }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>触发条件 *</label>
            <select v-model="formData.condition_type" required>
              <option value="" disabled>请选择触发条件</option>
              <option v-for="option in conditionOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>条件值 *</label>
            <input 
              v-model.number="formData.condition_value" 
              type="number" 
              required
              min="1"
              placeholder="请输入条件值"
            />
          </div>
          <div class="form-group">
            <label>奖励积分 *</label>
            <input 
              v-model.number="formData.points" 
              type="number" 
              required
              min="0"
              placeholder="请输入奖励积分"
            />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="formData.is_active" type="checkbox" />
              <span>启用成就</span>
            </label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">取消</button>
            <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content delete-modal">
        <div class="delete-icon">⚠️</div>
        <h2>确认删除</h2>
        <p>确定要删除成就「{{ deletingAchievement?.name }}」吗？此操作不可恢复。</p>
        <div class="form-actions">
          <button class="btn-secondary" @click="showDeleteModal = false">取消</button>
          <button class="btn-danger" @click="doDelete">{{ deletingAchievement ? '删除' : '删除中...' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Achievement, CreateAchievementRequest, UpdateAchievementRequest, AchievementStats, AchievementConditionType } from '@/types/achievements';
import { achievementApi } from '@/services/achievementApi';

// 响应式数据
const achievements = ref<Achievement[]>([]);
const stats = ref<AchievementStats>({
  total_count: 0,
  active_count: 0,
  unlocked_count: 0,
  locked_count: 0
});
const searchQuery = ref('');
const filterStatus = ref('all');
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const editingAchievement = ref<Achievement | null>(null);
const deletingAchievement = ref<Achievement | null>(null);
const saving = ref(false);

// 表单数据
const formData = ref<CreateAchievementRequest>({
  name: '',
  description: '',
  icon: '🏆',
  condition_type: 'quiz_first',
  condition_value: 1,
  points: 100,
  is_active: true
});

// 条件选项
const conditionOptions: { value: AchievementConditionType; label: string }[] = [
  { value: 'quiz_first', label: '首次答题' },
  { value: 'quiz_count', label: '答题次数' },
  { value: 'quiz_score', label: '答题得分' },
  { value: 'favorites_count', label: '收藏数量' },
  { value: 'model_upload', label: '上传模型' },
  { value: 'model_download', label: '下载模型' },
  { value: 'community_post', label: '社区发帖' },
  { value: 'community_like', label: '获得点赞' },
  { value: 'points_total', label: '累计积分' },
  { value: 'days_active', label: '活跃天数' },
  { value: 'invite_friend', label: '邀请好友' },
  { value: 'check_in', label: '签到次数' },
  { value: 'architecture_view', label: '浏览建筑数量' },
  { value: 'architecture_collect', label: '收藏建筑' }
];

// 过滤后的成就列表
const filteredAchievements = computed(() => {
  return achievements.value.filter(achievement => {
    const matchesSearch = achievement.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          achievement.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus = filterStatus.value === 'all' ||
                         (filterStatus.value === 'active' && achievement.is_active) ||
                         (filterStatus.value === 'inactive' && !achievement.is_active);
    return matchesSearch && matchesStatus;
  });
});

// 获取条件文本
const getConditionText = (type: AchievementConditionType, value: number): string => {
  const option = conditionOptions.find(opt => opt.value === type);
  return `${option?.label || type} (${value})`;
};

// 获取成就列表
const loadAchievements = async () => {
  try {
    const res = await achievementApi.getAchievements();
    if (res.success) {
      achievements.value = res.data;
    }
  } catch (error) {
    console.error('Failed to load achievements:', error);
  }
};

// 获取统计数据
const loadStats = async () => {
  try {
    const res = await achievementApi.getAchievementStats();
    if (res.success) {
      stats.value = res.data;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已通过 computed 实现
};

// 筛选处理
const handleFilter = () => {
  // 筛选逻辑已通过 computed 实现
};

// 编辑成就
const editAchievement = (achievement: Achievement) => {
  editingAchievement.value = achievement;
  formData.value = {
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    condition_type: achievement.condition_type,
    condition_value: achievement.condition_value,
    points: achievement.points,
    is_active: achievement.is_active
  };
  showCreateModal.value = true;
};

// 确认删除
const confirmDelete = (achievement: Achievement) => {
  deletingAchievement.value = achievement;
  showDeleteModal.value = true;
};

// 执行删除
const doDelete = async () => {
  if (!deletingAchievement.value) return;
  
  try {
    const res = await achievementApi.deleteAchievement(deletingAchievement.value.achievement_id);
    if (res.success) {
      await loadAchievements();
      await loadStats();
    }
  } catch (error) {
    console.error('Failed to delete achievement:', error);
  } finally {
    showDeleteModal.value = false;
    deletingAchievement.value = null;
  }
};

// 保存成就
const saveAchievement = async () => {
  saving.value = true;
  
  try {
    if (editingAchievement.value) {
      // 更新成就
      const updateData: UpdateAchievementRequest = {
        name: formData.value.name,
        description: formData.value.description,
        icon: formData.value.icon,
        condition_type: formData.value.condition_type,
        condition_value: formData.value.condition_value,
        points: formData.value.points,
        is_active: formData.value.is_active
      };
      await achievementApi.updateAchievement(editingAchievement.value.achievement_id, updateData);
    } else {
      // 创建成就
      await achievementApi.createAchievement(formData.value);
    }
    
    await loadAchievements();
    await loadStats();
    closeModal();
  } catch (error) {
    console.error('Failed to save achievement:', error);
  } finally {
    saving.value = false;
  }
};

// 关闭弹窗
const closeModal = () => {
  showCreateModal.value = false;
  editingAchievement.value = null;
  formData.value = {
    name: '',
    description: '',
    icon: '🏆',
    condition_type: 'quiz_first',
    condition_value: 1,
    points: 100,
    is_active: true
  };
};

// 初始化
onMounted(() => {
  loadAchievements();
  loadStats();
});
</script>

<style scoped>
.admin-achievements {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--gold);
  color: var(--bg);
  border: none;
  border-radius: var(--r-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--t);
}

.btn-primary:hover {
  background: var(--gold-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 16px;
  background: var(--bg-hover);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--t);
}

.btn-secondary:hover {
  background: var(--border);
}

.btn-danger {
  padding: 10px 16px;
  background: var(--c-red);
  color: white;
  border: none;
  border-radius: var(--r-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--t);
}

.btn-danger:hover {
  background: #c53030;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
}

.stat-icon {
  font-size: 1.75rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gold);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.search-box {
  flex: 1;
  max-width: 300px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text-muted);
}

.search-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
}

.filter-bar select {
  padding: 10px 14px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text);
  cursor: pointer;
}

/* 成就列表 */
.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  transition: all var(--t);
}

.achievement-card:hover {
  border-color: rgba(var(--gold-rgb), 0.3);
}

.achievement-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(var(--gold-rgb), 0.1);
  border-radius: var(--r-md);
  flex-shrink: 0;
}

.achievement-icon {
  font-size: 1.5rem;
}

.achievement-details {
  flex: 1;
  min-width: 0;
}

.achievement-details h3 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.description {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.achievement-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.meta-item.points {
  color: var(--gold);
}

.achievement-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: var(--c-green);
}

.status-badge.inactive {
  background: rgba(156, 163, 175, 0.1);
  color: var(--text-muted);
}

.btn-edit,
.btn-delete {
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: var(--r-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--t);
}

.btn-edit:hover {
  background: rgba(var(--gold-rgb), 0.1);
  color: var(--gold);
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--c-red);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-state svg {
  margin-bottom: 12px;
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
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  background: var(--bg-card);
  border-radius: var(--r-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
}

.modal-close {
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--r-sm);
  transition: all var(--t);
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text);
  font-size: 0.875rem;
  outline: none;
  transition: border-color var(--t);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--gold);
}

.form-group textarea {
  resize: vertical;
}

.icon-input {
  display: flex;
  gap: 12px;
}

.icon-input input {
  flex: 1;
}

.icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-size: 1.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
}

.checkbox-label span {
  font-size: 0.875rem;
  color: var(--text);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 删除弹窗 */
.delete-modal {
  text-align: center;
}

.delete-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.delete-modal h2 {
  margin-bottom: 8px;
}

.delete-modal p {
  color: var(--text-muted);
  margin-bottom: 24px;
}

/* 响应式 */
@media screen and (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .achievement-card {
    flex-direction: column;
    text-align: center;
  }
  
  .achievement-meta {
    justify-content: center;
  }
  
  .achievement-actions {
    width: 100%;
    justify-content: center;
  }
}

@media screen and (max-width: 599px) {
  .admin-achievements {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>