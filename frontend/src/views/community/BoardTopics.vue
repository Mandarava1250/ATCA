<template>
  <div class="board-page">
    <PageBackground :ember-count="20" :show-floating-text="false" />
    <Navbar />

    <main class="board-main">
      <!-- 面包屑 -->
      <nav class="board-breadcrumb">
        <router-link to="/community" class="bc-link">社区</router-link>
        <span class="bc-sep">/</span>
        <span class="bc-current">{{ boardName || '板块主题' }}</span>
      </nav>

      <!-- 板块头部 -->
      <header class="board-header">
        <h1 class="board-title">{{ boardName }}</h1>
        <p class="board-desc" v-if="boardDesc">{{ boardDesc }}</p>
      </header>

      <!-- 操作栏 -->
      <div class="board-toolbar">
        <span class="topic-count">{{ topics.length }} 个主题</span>
        <button
          v-if="isLoggedIn"
          class="btn-publish"
          @click="showPublish = true"
        >
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M5 12h14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/></svg>
          发表主题
        </button>
      </div>

      <!-- 主题列表 -->
      <div class="topics-list">
        <div
          v-for="topic in topics"
          :key="topic.topic_id"
          class="topic-row"
          @click="goTopic(topic.topic_id)"
        >
          <div class="topic-icon">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          </div>
          <div class="topic-body">
            <h3 class="topic-title-text">{{ topic.title }}</h3>
            <div class="topic-meta">
              <span class="topic-author">{{ topic.username || '匿名' }}</span>
              <span class="meta-sep">·</span>
              <span>{{ formatDate(topic.created_at) }}</span>
              <span class="meta-sep">·</span>
              <span>{{ topic.view_count || 0 }} 浏览</span>
              <span class="meta-sep">·</span>
              <span>{{ topic.reply_count || 0 }} 回复</span>
            </div>
          </div>
          <div class="topic-arrow">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 18l6-6-6-6" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </div>
        </div>

        <div v-if="topics.length === 0 && !loading" class="board-empty">
          <svg viewBox="0 0 24 24" width="48" height="48"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <p>该板块暂无主题</p>
          <button v-if="isLoggedIn" class="btn-publish" @click="showPublish = true">发表第一个主题</button>
        </div>

        <div v-if="loading" class="board-loading">
          <div class="atca-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    </main>

    <!-- 发表主题弹窗 -->
    <div v-if="showPublish" class="modal-overlay" @click.self="showPublish = false">
      <div class="modal-card">
        <h3>发表新主题</h3>
        <div class="form-group">
          <label>标题</label>
          <input v-model="publishForm.title" type="text" placeholder="请输入主题标题..." />
        </div>
        <div class="form-group">
          <label>内容</label>
          <textarea v-model="publishForm.content" rows="6" placeholder="请输入主题内容..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="atca-btn atca-btn-secondary" @click="showPublish = false">取消</button>
          <button class="atca-btn atca-btn-primary" :disabled="!publishForm.title.trim() || !publishForm.content.trim() || publishing" @click="submitTopic">
            {{ publishing ? '发表中...' : '发表' }}
          </button>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import PageBackground from '@/components/common/PageBackground.vue';
import { socialApi } from '@/services/api';
import { useUserStore } from '@/stores';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const isLoggedIn = userStore.isLoggedIn;

const boardId = Number(route.params.boardId);
const boardName = ref('');
const boardDesc = ref('');
const topics = ref<any[]>([]);
const loading = ref(true);
const showPublish = ref(false);
const publishing = ref(false);
const publishForm = ref({ title: '', content: '' });

function formatDate(t: string) {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function goTopic(id: number) {
  router.push(`/community/topic/${id}`);
}

async function loadBoard() {
  loading.value = true;
  try {
    const res = await socialApi.getForumBoards();
    if (res.success && res.data) {
      const board = res.data.find((b: any) => b.board_id === boardId);
      if (board) {
        boardName.value = board.name;
        boardDesc.value = board.description || '';
      }
    }
  } catch (e) { /* ignore */ }
}

async function loadTopics() {
  loading.value = true;
  try {
    const res = await socialApi.getForumTopics(boardId);
    if (res.success && res.data) {
      topics.value = res.data;
    }
  } catch (e) {
    console.error('[BoardTopics] 加载主题失败:', e);
  } finally {
    loading.value = false;
  }
}

async function submitTopic() {
  if (!publishForm.value.title.trim() || !publishForm.value.content.trim()) return;
  publishing.value = true;
  try {
    const res = await socialApi.createForumTopic({
      board_id: boardId,
      title: publishForm.value.title,
      content: publishForm.value.content,
    });
    if (res.success) {
      showPublish.value = false;
      publishForm.value = { title: '', content: '' };
      await loadTopics();
    }
  } catch (e) {
    console.error('[BoardTopics] 发表主题失败:', e);
  } finally {
    publishing.value = false;
  }
}

onMounted(() => {
  loadBoard();
  loadTopics();
});
</script>

<style scoped>
.board-page { min-height: 100vh; position: relative; background: var(--bg); }
.board-main { max-width: 900px; margin: 0 auto; padding: 100px 24px 48px; position: relative; z-index: 2; }

/* 面包屑 */
.board-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 0.8125rem; }
.bc-link { color: var(--gold); text-decoration: none; }
.bc-link:hover { text-decoration: underline; }
.bc-sep { color: var(--text-dim); }
.bc-current { color: var(--text-muted); }

/* 头部 */
.board-header { margin-bottom: 24px; }
.board-title { font-family: var(--font-serif); font-size: 1.75rem; font-weight: 700; color: var(--text); margin: 0 0 8px; }
.board-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

/* 工具栏 */
.board-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.topic-count { font-size: 0.875rem; color: var(--text-muted); }
.btn-publish { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 10px; background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%); color: #1A1714; border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.25s ease; font-family: var(--font-serif); box-shadow: 0 4px 14px rgba(201,169,110,0.3); }
.btn-publish:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(201,169,110,0.4); }

/* 主题列表 */
.topics-list { display: flex; flex-direction: column; gap: 8px; }
.topic-row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-md); cursor: pointer; transition: all 0.25s ease; }
.topic-row:hover { border-color: rgba(201,169,110,0.2); background: rgba(42,37,32,0.5); transform: translateX(4px); }
.topic-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(201,169,110,0.08); color: var(--gold); flex-shrink: 0; }
.topic-body { flex: 1; min-width: 0; }
.topic-title-text { font-size: 1rem; font-weight: 600; color: var(--text); margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topic-meta { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text-muted); flex-wrap: wrap; }
.topic-author { font-weight: 500; color: var(--gold-dim); }
.meta-sep { color: var(--text-dim); }
.topic-arrow { color: var(--text-dim); transition: color 0.2s; flex-shrink: 0; }
.topic-row:hover .topic-arrow { color: var(--gold); }

/* 空状态 */
.board-empty { text-align: center; padding: 60px 24px; color: var(--text-muted); }
.board-empty svg { margin-bottom: 12px; opacity: 0.4; }
.board-empty p { margin-bottom: 16px; font-size: 0.9375rem; }

/* 加载 */
.board-loading { text-align: center; padding: 48px; color: var(--text-muted); }

/* 弹窗 */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px; }
.modal-card { background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-light) 100%); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.modal-card h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 20px; color: var(--gold); letter-spacing: 0.06em; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 6px; color: var(--text-muted); }
.form-group input, .form-group textarea { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--bg); color: var(--text); font-size: 0.875rem; outline: none; transition: all var(--t); font-family: inherit; }
.form-group input:focus, .form-group textarea:focus { border-color: var(--gold-dim); box-shadow: 0 0 0 3px rgba(201,169,110,0.08); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); }

@media (max-width: 640px) {
  .board-main { padding: 88px 16px 32px; }
  .board-title { font-size: 1.375rem; }
}
</style>
