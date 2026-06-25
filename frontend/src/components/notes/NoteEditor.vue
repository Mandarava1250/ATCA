<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card" :class="{ 'modal-xl': isWide }">
      <h3>{{ isEdit ? '编辑笔记' : '新建笔记' }}</h3>
      <div class="form-group">
        <label>标题</label>
        <input v-model="form.title" type="text" placeholder="给笔记起个标题..." />
      </div>
      <div class="form-group">
        <label>内容</label>
        <textarea v-model="form.content" rows="8" placeholder="记录你的学习心得..." />
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>标签（用逗号分隔）</label>
          <input v-model="tagInput" type="text" placeholder="建筑, 历史, 园林..." />
        </div>
        <div class="form-group">
          <label>可见性</label>
          <select v-model="form.isPublic">
            <option :value="false">仅自己可见</option>
            <option :value="true">公开分享</option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button class="atca-btn atca-btn-secondary" @click="$emit('close')">取消</button>
        <button class="atca-btn atca-btn-primary" :disabled="!form.title.trim() || !form.content.trim()" @click="save">
          {{ isEdit ? '保存修改' : '创建笔记' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { noteManager, type Note } from '@/utils/noteManager';

const props = defineProps<{
  note?: Note | null;
  buildingId?: number;
  buildingName?: string;
  isWide?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', note: Note): void;
}>();

const isEdit = !!props.note;
const tagInput = ref(props.note?.tags?.join(', ') || '');

const form = ref({
  title: props.note?.title || '',
  content: props.note?.content || '',
  tags: props.note?.tags || [],
  isPublic: props.note?.isPublic ?? false,
  relatedBuildingId: props.note?.relatedBuildingId || props.buildingId,
  relatedBuildingName: props.note?.relatedBuildingName || props.buildingName,
});

watch(tagInput, (v) => {
  form.value.tags = v.split(',').map(t => t.trim()).filter(Boolean);
});

function save() {
  if (!form.value.title.trim() || !form.value.content.trim()) return;
  if (isEdit && props.note) {
    const updated = noteManager.update(props.note.id, form.value);
    if (updated) emit('saved', updated);
  } else {
    const created = noteManager.create(form.value);
    emit('saved', created);
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; animation: fadeIn 0.2s ease; }
.modal-card { background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-light) 100%); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 28px; width: 100%; max-width: 480px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: slideUp 0.3s ease; }
.modal-card.modal-xl { max-width: 640px; }
.modal-card h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 20px; color: var(--gold); letter-spacing: 0.06em; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 6px; color: var(--text-muted); }
.form-group input,
.form-group textarea,
.form-group select { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--bg); color: var(--text); font-size: 0.875rem; outline: none; transition: all var(--t); font-family: inherit; }
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus { border-color: var(--gold-dim); box-shadow: 0 0 0 3px rgba(201,169,110,0.08); }
.form-group textarea { resize: vertical; }
.form-group select option { background: var(--bg-card); color: var(--text); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
