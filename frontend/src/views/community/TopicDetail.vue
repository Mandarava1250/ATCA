<template>
  <div class="topic-page">
    <PageBackground :ember-count="20" :show-floating-text="false" />
    <Navbar />

    <main class="topic-main" v-if="topicData">
      <!-- 面包屑导航 -->
      <nav class="topic-breadcrumb">
        <router-link to="/community" class="bc-link">社区</router-link>
        <span class="bc-sep">/</span>
        <span class="bc-current">{{ topicData.topic?.title || '主题详情' }}</span>
      </nav>

      <!-- 主题内容 -->
      <article class="topic-article">
        <header class="topic-header">
          <h1 class="topic-title">{{ topicData.topic?.title }}</h1>
          <div class="topic-meta-bar">
            <span class="topic-author">
              <span class="author-avatar">{{ (topicData.topic?.username || '匿')[0] }}</span>
              {{ topicData.topic?.username }}
            </span>
            <span class="meta-sep">·</span>
            <span class="meta-item">{{ formatDate(topicData.topic?.created_at) }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-item">{{ topicData.topic?.view_count || 0 }} 浏览</span>
            <span class="meta-sep">·</span>
            <span class="meta-item">{{ topicData.replies?.length || 0 }} 回复</span>
          </div>
        </header>

        <TextClamp :text="topicData.topic?.content" :max-lines="5" expand-text="展开内容" collapse-text="收起内容" class="topic-content" />

        <!-- 主题操作栏 -->
        <div class="topic-actions-bar">
          <button
              v-if="isLoggedIn && !userStore.isMuted"
              class="btn-reply-action"
              @click="focusReply"
          >
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            回复主题
          </button>
          <button class="btn-back-action" @click="router.push('/community')">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            返回论坛
          </button>
        </div>
      </article>

      <!-- 回复列表 -->
      <section class="replies-section">
        <h2 class="replies-title">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          全部回复 ({{ topicData.replies?.length || 0 }})
        </h2>

        <div v-if="topicData.replies && topicData.replies.length > 0" class="replies-list">
          <div v-for="reply in topicData.replies" :key="reply.reply_id" class="reply-card">
            <div class="reply-card-header">
              <span class="reply-author">
                <span class="author-avatar-sm">{{ (reply.username || '匿')[0] }}</span>
                {{ reply.username }}
              </span>
              <span class="reply-time">{{ formatDate(reply.created_at) }}</span>
              <button v-if="userStore.isModerator" class="reply-delete-btn" @click="deleteReply(reply.reply_id)" title="删除回复">
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
            <TextClamp :text="reply.content" :max-lines="5" expand-text="展开回复" collapse-text="收起回复" class="reply-card-body" />
          </div>
        </div>

        <div v-else class="replies-empty">
          <p>暂无回复，来发表第一条回复吧！</p>
        </div>

        <!-- 回复输入框 -->
        <div ref="replyBoxRef" class="reply-compose">
          <div v-if="isLoggedIn && !userStore.isMuted" class="reply-form">
            <textarea
                v-model="replyContent"
                class="reply-textarea"
                rows="4"
                placeholder="发表你的回复..."
                @keydown.ctrl.enter="submitReply"
            ></textarea>
            <div class="reply-form-actions">
              <span class="reply-hint">Ctrl + Enter 快捷发送</span>
              <button
                  class="btn-submit-reply"
                  @click="submitReply"
                  :disabled="!replyContent.trim() || submitting"
              >
                <svg v-if="submitting" class="spin-inline" viewBox="0 0 24 24" width="14" height="14"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/></svg>
                <svg v-else viewBox="0 0 24 24" width="14" height="14"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ submitting ? '发送中...' : '发送回复' }}
              </button>
            </div>
          </div>
          <div v-else-if="isLoggedIn && userStore.isMuted" class="reply-muted">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 5.93a9 9 0 010 12.14" stroke="#C75C3A" fill="none" stroke-width="2" stroke-linecap="round"/></svg>
            <p>你已被禁言，暂时无法回复{{ muteReason ? '：' + muteReason : '' }}</p>
          </div>
          <div v-else class="reply-login">
            <router-link :to="{ path: '/login', query: { redirect: route.fullPath } }" class="btn-login-reply">
              登录后参与讨论
            </router-link>
          </div>
        </div>
      </section>
    </main>

    <!-- 加载中 -->
    <main class="topic-main" v-else-if="loading">
      <div class="topic-skeleton">
        <div class="sk-title"></div>
        <div class="sk-meta"></div>
        <div class="sk-content"></div>
        <div class="sk-content"></div>
      </div>
    </main>

    <!-- 错误状态 -->
    <main class="topic-main" v-else>
      <div class="topic-error">
        <svg viewBox="0 0 24 24" width="48" height="48"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="var(--text-muted)"/></svg>
        <p>主题加载失败，可能已被删除或不存在</p>
        <router-link to="/community" class="btn-back-action">返回论坛</router-link>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import PageBackground from '@/components/common/PageBackground.vue';
import TextClamp from '@/components/common/TextClamp.vue';
import { socialApi } from '@/services/api';
import { useUserStore } from '@/stores';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('TopicDetail');
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const topicData = ref<any>(null);
const loading = ref(true);
const replyContent = ref('');
const submitting = ref(false);
const replyBoxRef = ref<HTMLDivElement>();
const muteReason = ref('');

const isLoggedIn = computed(() => userStore.isLoggedIn);
const topicId = computed(() => Number(route.params.id));

function formatDate(t: string) {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

async function loadTopic() {
  loading.value = true;
  topicData.value = null;
  try {
    const res = await socialApi.getForumTopic(topicId.value);
    if (res.success && res.data) {
      topicData.value = res.data;
    }
  } catch (e) {
    console.error('[TopicDetail] 加载主题失败:', e);
  } finally {
    loading.value = false;
  }
}

async function submitReply() {
  if (!replyContent.value.trim() || !topicId.value) return;
  if (userStore.isMuted) { alert('你已被禁言，无法回复'); return; }
  submitting.value = true;
  try {
    const res = await socialApi.createForumReply({
      topic_id: topicId.value,
      content: replyContent.value,
    });
    if (res.success) {
      replyContent.value = '';
      await loadTopic();
    }
  } catch (e: any) {
    if (e.response?.data?.error?.code === 'MUTE_001') {
      alert(e.response.data.error.message || '你已被禁言');
      userStore.isMuted = true;
    } else {
      alert('回复失败，请重试');
    }
  } finally {
    submitting.value = false;
  }
}

async function deleteReply(id: number) {
  if (!confirm('确定删除这条回复？')) return;
  try {
    await socialApi.deleteReplyAdmin(id);
    await loadTopic();
  } catch (e) {
    console.error('[TopicDetail] 删除回复失败:', e);
  }
}

function focusReply() {
  replyBoxRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    const ta = replyBoxRef.value?.querySelector('textarea');
    ta?.focus();
  }, 400);
}

onMounted(() => {
  loadTopic();
});

onBeforeUnmount(() => {
  // 清理提交状态，防止导航到其他页面后仍显示"发送中"
  submitting.value = false;
  replyContent.value = '';
});
</script>

<style scoped>
.topic-page { min-height: 100vh; position: relative; background: var(--bg); }
.topic-main { max-width: 860px; margin: 0 auto; padding: 100px 24px 48px; position: relative; z-index: 2; }

/* 面包屑 */
.topic-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 0.8125rem; }
.bc-link { color: var(--gold); text-decoration: none; transition: color var(--t); }
.bc-link:hover { color: var(--gold-light); text-decoration: underline; }
.bc-sep { color: var(--text-dim); }
.bc-current { color: var(--text-muted); max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 主题文章 */
.topic-article { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 28px 32px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.topic-title { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--text); margin: 0 0 14px; line-height: 1.4; letter-spacing: 0.02em; }

.topic-meta-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.topic-author { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--text); font-weight: 500; }
.author-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), var(--gold-light)); color: #1A1714; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; }
.meta-sep { color: var(--text-dim); }
.meta-item { font-size: 0.8125rem; color: var(--text-muted); }

.topic-content { font-size: 0.9375rem; color: var(--text); line-height: 1.9; white-space: pre-wrap; margin-bottom: 24px; min-height: 80px; }

/* 操作栏 */
.topic-actions-bar { display: flex; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
.btn-reply-action, .btn-back-action {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: var(--font-serif); letter-spacing: 0.02em; text-decoration: none;
}
.btn-reply-action {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  color: #1A1714; border: none;
  box-shadow: 0 4px 14px rgba(201, 169, 110, 0.35);
}
.btn-reply-action:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(201, 169, 110, 0.45); }
.btn-back-action {
  background: var(--bg-hover); color: var(--text-muted); border: 1px solid var(--border);
}
.btn-back-action:hover { border-color: var(--gold-dim); color: var(--gold); }

/* 回复区域 */
.replies-section { margin-bottom: 32px; }
.replies-title {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--font-serif); font-size: 1.125rem; font-weight: 600;
  color: var(--text); margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.replies-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.reply-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-md); padding: 16px 20px; transition: all var(--t); }
.reply-card:hover { border-color: rgba(201, 169, 110, 0.15); }
.reply-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.reply-author { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 500; color: var(--text); }
.author-avatar-sm { width: 22px; height: 22px; border-radius: 50%; background: var(--bg-hover); color: var(--gold); display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; border: 1px solid var(--border); }
.reply-time { font-size: 0.75rem; color: var(--text-muted); margin-left: auto; }
.reply-delete-btn { padding: 4px; border: 1px solid rgba(199, 92, 58, 0.25); border-radius: 4px; background: transparent; color: #C75C3A; cursor: pointer; transition: all 0.2s; }
.reply-delete-btn:hover { background: rgba(199, 92, 58, 0.15); }
.reply-card-body { font-size: 0.875rem; color: var(--text); line-height: 1.7; }

.replies-empty { text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.9375rem; }

/* 回复输入 */
.reply-compose { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px; }
.reply-textarea {
  width: 100%; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--r-md);
  background: var(--bg); color: var(--text); font-size: 0.875rem; line-height: 1.7;
  outline: none; resize: vertical; font-family: inherit; min-height: 100px;
  transition: all var(--t);
}
.reply-textarea:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,169,110,0.08); }
.reply-textarea::placeholder { color: var(--text-dim); }
.reply-form-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.reply-hint { font-size: 0.75rem; color: var(--text-dim); }
.btn-submit-reply {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 24px; border-radius: 10px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  color: #1A1714; border: none; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: var(--font-serif); box-shadow: 0 4px 14px rgba(201, 169, 110, 0.3);
}
.btn-submit-reply:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(201, 169, 110, 0.4); }
.btn-submit-reply:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.reply-muted { display: flex; align-items: center; gap: 10px; padding: 16px; background: rgba(199, 92, 58, 0.06); border-radius: var(--r-md); color: #C75C3A; font-size: 0.875rem; }
.reply-login { text-align: center; padding: 16px; }
.btn-login-reply {
  display: inline-flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: 10px;
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  color: #1A1714; text-decoration: none; font-size: 0.875rem; font-weight: 600;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(201, 169, 110, 0.3);
}
.btn-login-reply:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(201, 169, 110, 0.4); }

/* 骨架屏 */
.topic-skeleton { padding: 28px 32px; }
.sk-title { height: 32px; width: 60%; background: var(--border); border-radius: var(--r-md); margin-bottom: 16px; animation: pulse 1.5s infinite; }
.sk-meta { height: 18px; width: 40%; background: var(--border); border-radius: var(--r-sm); margin-bottom: 24px; animation: pulse 1.5s infinite 0.1s; }
.sk-content { height: 80px; background: var(--border); border-radius: var(--r-md); margin-bottom: 12px; animation: pulse 1.5s infinite 0.2s; }
@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }

/* 错误状态 */
.topic-error { text-align: center; padding: 80px 24px; color: var(--text-muted); }
.topic-error p { margin: 16px 0; font-size: 0.9375rem; }

/* 加载动画 */
.spin-inline { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

</style>