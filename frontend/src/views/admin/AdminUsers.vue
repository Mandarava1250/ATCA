<template>
  <div class="admin-page">
    <div class="page-toolbar">
      <div v-if="selectedIds.length > 0" class="batch-bar" style="margin-right:auto">
        <span>已选 {{ selectedIds.length }} 项</span>
        <button class="atca-btn atca-btn-sm atca-btn-danger" @click="batchDelete">批量删除</button>
        <button class="atca-btn atca-btn-sm" @click="selectedIds = []">取消</button>
      </div>
      <input v-model="search" @input="debounceSearch" class="atca-input search-input" :placeholder="$t('admin.searchUsers')" />
    </div>

    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
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
      <div v-if="!users.length" class="empty-table">{{ $t('admin.noData') }}</div>
    </div>

    <!-- Edit Modal -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { adminApi } from '@/services/api';

const users = ref<any[]>([]);
const selectedIds = ref<number[]>([]);
const isAllSelected = computed(() => users.value.length > 0 && selectedIds.value.length === users.value.length);
function toggleSelectAll() { if (isAllSelected.value) selectedIds.value = []; else selectedIds.value = users.value.map((u: any) => u.user_id); }
async function batchDelete() {
  if (!selectedIds.value.length || !confirm(`确认删除 ${selectedIds.value.length} 个用户？`)) return;
  try { await adminApi.batchDeleteUsers(selectedIds.value); selectedIds.value = []; loadUsers(); }
  catch (e: any) { alert('批量删除失败: ' + e.message); }
}
const search = ref('');
const editingUser = ref<any>(null);
const editForm = ref({ nickname: '', email: '', role: 'user', is_active: true });
let searchTimer: ReturnType<typeof setTimeout> | null = null;

function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString();
}

function debounceSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadUsers(), 300);
}

async function loadUsers() {
  try {
    const res = await adminApi.getUsers({ search: search.value, page: 1, limit: 50 });
    if (res.success) users.value = res.data;
  } catch (e) { console.error(e); }
}

function editUser(user: any) {
  editingUser.value = user;
  editForm.value = { nickname: user.nickname || '', email: user.email || '', role: user.role || 'user', is_active: user.is_active !== false };
}

async function saveUser() {
  if (!editingUser.value) return;
  try {
    await adminApi.updateUser(editingUser.value.user_id, editForm.value);
    editingUser.value = null;
    loadUsers();
  } catch (e) { console.error(e); }
}

async function deleteUser(id: number) {
  if (!confirm('确认删除此用户？')) return;
  try {
    await adminApi.deleteUser(id);
    loadUsers();
  } catch (e) { console.error(e); }
}

onMounted(loadUsers);
</script>

<style scoped>
/* Styles are now provided by global.css admin section */
</style>
