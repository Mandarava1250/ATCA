<template>
  <div class="comment-section">
    <h3 class="comment-title">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
      用户评论 {{ total > 0 ? `(${total})` : '' }}
    </h3>

    <!-- 评论输入 -->
    <div class="comment-input-wrap" v-if="isLoggedIn">
      <textarea
        v-model="newComment"
        class="comment-textarea"
        rows="3"
        placeholder="分享你对这座建筑的看法..."
        @keydown.ctrl.enter="submitComment"
      />
      <div class="comment-actions">
        <span class="comment-hint">Ctrl + Enter 发送</span>
        <button class="btn btn-pri btn-sm" @click="submitComment" :disabled="!newComment.trim() || submitting">
          {{ submitting ? '发送中...' : '发表评论' }}
        </button>
      </div>
    </div>
    <div v-else class="comment-login-tip">
      <router-link to="/login">登录</router-link> 后即可发表评论
    </div>

    <!-- 评论列表 -->
    <div class="comment-list" v-if="comments.length > 0">
      <div v-for="comment in comments" :key="comment.comment_id" class="comment-item">
        <div class="comment-avatar">{{ (comment.username || '匿')[0] }}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-author">{{ comment.username || '匿名用户' }}</span>
            <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
          </div>
          <p class="comment-content">{{ comment.content }}</p>
          <div class="comment-footer">
            <button class="comment-like-btn" @click="likeComment(comment.comment_id)">
              <svg viewBox="0 0 24 24" width="12" height="12"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              {{ comment.likes || 0 }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="comment-empty">
      暂无评论，成为第一个评论的人吧！
    </div>

    <!-- 加载更多 -->
    <button v-if="hasMore" class="comment-load-more" @click="loadMore" :disabled="loading">
      {{ loading ? '加载中...' : '加载更多' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { socialApi } from '@/services/api';
import { useUserStore } from '@/stores';

const props = defineProps<{
  targetType: string;
  targetId: number;
}>();

const userStore = useUserStore();
const isLoggedIn = computed(() => userStore.isLoggedIn);

const comments = ref<any[]>([]);
const newComment = ref('');
const submitting = ref(false);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const hasMore = ref(false);

function formatTime(t: string) {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function loadComments() {
  loading.value = true;
  try {
    const res = await socialApi.getComments(props.targetType, props.targetId, page.value);
    if (res.success) {
      if (page.value === 1) comments.value = res.data || [];
      else comments.value.push(...(res.data || []));
      total.value = res.meta?.total || res.data?.length || 0;
      hasMore.value = (res.data || []).length >= 20;
    }
  } catch (e) { console.error('[Comments] 加载失败:', e); }
  loading.value = false;
}

async function submitComment() {
  if (!newComment.value.trim()) return;
  submitting.value = true;
  try {
    const res = await socialApi.postComment({
      target_type: props.targetType,
      target_id: props.targetId,
      content: newComment.value.trim(),
    });
    if (res.success) {
      newComment.value = '';
      page.value = 1;
      await loadComments();
    }
  } catch (e) { console.error('[Comments] 发表失败:', e); }
  submitting.value = false;
}

async function likeComment(commentId: number) {
  try {
    await socialApi.toggleLike('comment', commentId);
    const c = comments.value.find(c => c.comment_id === commentId);
    if (c) c.likes = (c.likes || 0) + 1;
  } catch (e) { console.error('[Comments] 点赞失败:', e); }
}

function loadMore() {
  page.value++;
  loadComments();
}

onMounted(loadComments);
</script>

<style scoped>
.comment-section {
  margin-top: 32px;
  padding: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
}
.comment-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 20px;
  color: var(--text);
}
.comment-title svg { color: var(--gold); }

.comment-input-wrap { margin-bottom: 20px; }
.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.875rem;
  resize: vertical;
  outline: none;
  transition: border-color var(--t);
}
.comment-textarea:focus { border-color: var(--c-red); }
.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.comment-hint { font-size: 0.6875rem; color: var(--text-muted); }
.btn-sm { padding: 4px 14px; font-size: 0.75rem; }

.comment-login-tip {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  background: var(--bg-hover);
  border-radius: var(--r-md);
  margin-bottom: 20px;
}
.comment-login-tip a { color: var(--c-red); text-decoration: underline; }

.comment-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
}
.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--gold);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
}
.comment-body { flex: 1; }
.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.comment-author { font-weight: 600; font-size: 0.8125rem; color: var(--text); }
.comment-time { font-size: 0.6875rem; color: var(--text-muted); }
.comment-content { font-size: 0.875rem; color: var(--text); line-height: 1.6; margin: 0; }
.comment-footer { margin-top: 8px; }
.comment-like-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.6875rem;
  cursor: pointer;
  transition: all var(--t);
}
.comment-like-btn:hover { color: var(--c-red); border-color: var(--c-red); }

.comment-empty {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-size: 0.875rem;
}
.comment-load-more {
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 16px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: transparent;
  color: var(--text);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all var(--t);
}
.comment-load-more:hover { background: var(--bg-hover); }
</style>
