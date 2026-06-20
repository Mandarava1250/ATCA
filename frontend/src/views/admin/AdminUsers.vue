<template>
  <div class="admin-page">
    <div class="page-toolbar">
      <button class="atca-btn atca-btn-primary" @click="showCreateModal = true">
        {{ $t('admin.createUser') }}
      </button>
      <div v-if="selectedIds.length > 0" class="batch-bar" style="margin-left: auto; margin-right: 12px">
        <span>已选 {{ selectedIds.length }} 项</span>
        <button class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDelete">批量删除</button>
        <button class="atca-btn atca-btn-sm" @click="selectedIds = []">取消</button>
      </div>
      <input 
        v-model="search" 
        @input="debounceSearch" 
        class="atca-input search-input" 
        :placeholder="$t('admin.searchUsers')" 
      />
    </div>

    <div class="data-table-wrapper">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
            </th>
            <th>ID</th>
            <th>{{ $t('admin.username') }}</th>
            <th>{{ $t('admin.nickname') }}</th>
            <th>Email</th>
            <th>{{ $t('admin.role') }}</th>
            <th>{{ $t('admin.status') }}</th>
            <th>{{ $t('admin.createdAt') }}</th>
            <th>{{ $t('admin.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.user_id">
            <td class="checkbox-col">
              <input 
                type="checkbox" 
                :checked="selectedIds.includes(user.user_id)" 
                @change="toggleSelect(user.user_id)" 
              />
            </td>
            <td>{{ user.user_id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.nickname || '-' }}</td>
            <td>{{ user.email || '-' }}</td>
            <td><span class="tag" :class="user.role">{{ user.role }}</span></td>
            <td><span class="tag" :class="user.is_active ? 'active' : 'inactive'">{{ user.is_active ? 'Active' : 'Inactive' }}</span></td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button class="btn-text" @click="editUser(user)">{{ $t('admin.edit') }}</button>
              <button class="btn-text danger" @click="deleteUser(user.user_id)">{{ $t('admin.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!users.length && !loading" class="empty-table">{{ $t('admin.noData') }}</div>
    </div>

    <!-- 分页组件 -->
    <div v-if="meta.total > 0" class="pagination-wrapper">
      <button 
        class="atca-btn atca-btn-sm" 
        :disabled="meta.page <= 1" 
        @click="changePage(meta.page - 1)"
      >
        {{ $t('common.prev') }}
      </button>
      <span class="page-info">
        第 {{ meta.page }} / {{ totalPages }} 页，共 {{ meta.total }} 条
      </span>
      <button 
        class="atca-btn atca-btn-sm" 
        :disabled="meta.page >= totalPages" 
        @click="changePage(meta.page + 1)"
      >
        {{ $t('common.next') }}
      </button>
    </div>

    <!-- 创建用户弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-card">
        <h3>{{ $t('admin.createUser') }}</h3>
        <div class="form-group">
          <label>{{ $t('admin.username') }}</label>
          <input v-model="createForm.username" class="atca-input" :placeholder="$t('admin.usernamePlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ $t('admin.password') }}</label>
          <input type="password" v-model="createForm.password" class="atca-input" :placeholder="$t('admin.passwordPlaceholder')" />
        </div>
        <div class="form-group">
          <label>{{ $t('admin.nickname') }}</label>
          <input v-model="createForm.nickname" class="atca-input" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="createForm.email" class="atca-input" />
        </div>
        <div class="form-group">
          <label>{{ $t('admin.role') }}</label>
          <select v-model="createForm.role" class="atca-input">
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="atca-btn atca-btn-secondary" @click="showCreateModal = false">{{ $t('common.cancel') }}</button>
          <button class="atca-btn atca-btn-primary" @click="createUser">{{ $t('common.create') }}</button>
        </div>
      </div>
    </div>

    <!-- 编辑用户弹窗 -->
    <div v-if="editingUser" class="modal-overlay" @click.self="editingUser = null">
      <div class="modal-card">
        <h3>{{ $t('admin.editUser') }}</h3>
        <div class="form-group">
          <label>{{ $t('admin.nickname') }}</label>
          <input v-model="editForm.nickname" class="atca-input" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="editForm.email" class="atca-input" />
        </div>
        <div class="form-group">
          <label>{{ $t('admin.role') }}</label>
          <select v-model="editForm.role" class="atca-input">
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-group">
          <label>{{ $t('admin.status') }}</label>
          <select v-model="editForm.is_active" class="atca-input">
            <option :value="true">Active</option>
            <option :value="false">Inactive</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="atca-btn atca-btn-secondary" @click="editingUser = null">{{ $t('common.cancel') }}</button>
          <button class="atca-btn atca-btn-primary" @click="saveUser">{{ $t('common.save') }}</button>
        </div>
      </div>
    </div>

    <!-- 提示消息 -->
    <div v-if="message.show" class="toast" :class="message.type">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { adminApi } from '@/services/api';

const users = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const search = ref('');
const editingUser = ref<any>(null);
const showCreateModal = ref(false);
const loading = ref(false);
const message = ref({ show: false, text: '', type: 'success' });

const editForm = ref({ 
  nickname: '', 
  email: '', 
  role: 'user', 
  is_active: true 
});

const createForm = ref({ 
  username: '', 
  password: '', 
  nickname: '', 
  email: '', 
  role: 'user' 
});

const meta = ref({ total: 0, page: 1, limit: 20 });

const totalPages = computed(() => Math.ceil(meta.value.total / meta.value.limit));

const isAllSelected = computed(() => 
  users.value.length > 0 && selectedIds.value.length === users.value.length
);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function showMessage(text: string, type: 'success' | 'error' = 'success') {
  message.value = { show: true, text, type };
  setTimeout(() => { message.value.show = false; }, 3000);
}

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('zh-CN');
}

function debounceSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadUsers(), 300);
}

function toggleSelect(id: number) {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = users.value.map((u: any) => u.user_id);
  }
}

async function loadUsers(page = 1) {
  loading.value = true;
  try {
    const res = await adminApi.getUsers({ 
      search: search.value, 
      page, 
      limit: meta.value.limit 
    });
    if (res.success) {
      users.value = res.data;
      meta.value = res.meta || { total: 0, page, limit: meta.value.limit };
    }
  } catch (e: any) {
    console.error('加载用户失败:', e);
    showMessage('加载用户失败: ' + (e.message || '未知错误'), 'error');
  } finally {
    loading.value = false;
  }
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  meta.value.page = page;
  loadUsers(page);
}

function editUser(user: any) {
  editingUser.value = user;
  editForm.value = { 
    nickname: user.nickname || '', 
    email: user.email || '', 
    role: user.role || 'user', 
    is_active: user.is_active !== false 
  };
}

async function saveUser() {
  if (!editingUser.value) return;
  loading.value = true;
  try {
    const res = await adminApi.updateUser(editingUser.value.user_id, editForm.value);
    if (res.success) {
      showMessage('用户更新成功');
      editingUser.value = null;
      loadUsers();
    } else {
      showMessage('更新失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('更新用户失败:', e);
    showMessage('更新用户失败: ' + (e.message || '未知错误'), 'error');
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  if (!createForm.value.username || !createForm.value.password) {
    showMessage('用户名和密码不能为空', 'error');
    return;
  }
  loading.value = true;
  try {
    const res = await adminApi.createUser(createForm.value);
    if (res.success) {
      showMessage('用户创建成功');
      showCreateModal.value = false;
      createForm.value = { username: '', password: '', nickname: '', email: '', role: 'user' };
      loadUsers();
    } else {
      showMessage('创建失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('创建用户失败:', e);
    showMessage('创建用户失败: ' + (e.message || '未知错误'), 'error');
  } finally {
    loading.value = false;
  }
}

async function deleteUser(id: number) {
  if (!confirm('确认删除此用户？')) return;
  loading.value = true;
  try {
    const res = await adminApi.deleteUser(id);
    if (res.success) {
      showMessage('用户删除成功');
      loadUsers();
    } else {
      showMessage('删除失败: ' + (res.error?.message || '未知错误'), 'error');
    }
  } catch (e: any) {
    console.error('删除用户失败:', e);
    showMessage('删除用户失败: ' + (e.message || '未知错误'), 'error');
  } finally {
    loading.value = false;
  }
}

async function batchDelete() {
  if (!selectedIds.value.length || !confirm(`确认删除 ${selectedIds.value.length} 个用户？`)) return;
  loading.value = true;
  try {
    const res = await adminApi.batchDeleteUsers(selectedIds.value);
    if (res.success) {
      showMessage(`成功删除 ${selectedIds.value.length} 个用户`);
      selectedIds.value = [];
      loadUsers();
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

onMounted(loadUsers);

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer);
});
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #8B7355;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.data-table-wrapper {
  position: relative;
}

.checkbox-col {
  width: 40px;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

.page-info {
  color: #666;
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 4px;
  color: white;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #4CAF50;
}

.toast.error {
  background: #f44336;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>