<template>
  <div class="community-page">
    <PageBackground :ember-count="30" :show-floating-text="false" />
    <Navbar />
    <main class="community-main">
      <!-- 页面头部 -->
      <header class="community-hero atca-texture-paper">
        <div class="community-hero-inner">
          <h1 class="community-hero-title calligraphy">
            <svg viewBox="0 0 24 24" width="36" height="36"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="9" cy="7" r="4" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            {{ $t('community.pageTitle') }}
          </h1>
          <p class="community-hero-desc">{{ $t('community.pageDesc') }}</p>
          <div v-if="userStore.isMuted" class="mute-warning">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 5.93a9 9 0 010 12.14" stroke="#C75C3A" fill="none" stroke-width="2" stroke-linecap="round"/></svg>
            <span>{{ $t('community.muted') }}{{ muteReason ? '：' + muteReason : '' }}</span>
          </div>
        </div>
        <div class="community-hero-pattern"></div>
      </header>

      <!-- Tab 切换栏 -->
      <nav class="community-tabs">
        <button
            v-for="tab in tabs"
            :key="tab.id"
            class="community-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" v-html="tab.icon"></svg>
          {{ tab.label }}
        </button>
      </nav>

      <!-- ==================== 建筑分享 Tab ==================== -->
      <section v-if="activeTab === 'shares'" class="community-section" key="shares">
        <div class="community-section-header">
          <h2>{{ $t('community.tabs.shares') }}</h2>
          <div class="community-search">
            <input v-model="shareSearch" class="search-input inp" :placeholder="$t('community.shares.searchPlaceholder')" @keyup.enter="loadShares" />
            <select v-model="shareEra" class="search-select" @change="loadShares">
              <option value="">{{ $t('community.shares.allEra') }}</option>
              <option v-for="e in eraOptions" :key="e" :value="e">{{ e }}</option>
            </select>
            <button class="btn btn-pri btn-sm" @click="loadShares">
              <svg viewBox="0 0 24 24" width="14" height="14"><circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              {{ $t('community.shares.search') }}
            </button>
          </div>
        </div>

        <div v-if="sharesLoading" class="community-loading">
          <div class="atca-spinner"></div>
          <p>{{ $t('community.shares.loading') }}</p>
        </div>
        <div v-else-if="buildingShares.length > 0" class="share-grid">
          <div v-for="item in buildingShares" :key="item.share_id" class="share-card atca-border-classic" @click="openShareDetail(item)">
            <div class="share-thumb">
              <img v-if="item.thumbnail_url" :src="item.thumbnail_url" :alt="item.title" />
              <div v-else class="share-placeholder">
                <svg viewBox="0 0 24 24" width="40" height="40"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" stroke="currentColor" fill="none" stroke-width="1"/></svg>
              </div>
              <span v-if="item.is_featured" class="share-badge">{{ $t('community.shares.featured') }}</span>
              <span v-if="item.era" class="share-era">{{ item.era }}</span>
            </div>
            <div class="share-info">
              <h3 class="share-title">{{ item.title }}</h3>
              <p class="share-desc">{{ item.description || $t('community.shares.noDesc') }}</p>
              <div class="share-tags" v-if="item.building_type">
                <span class="share-tag">{{ item.building_type }}</span>
                <span v-if="item.era" class="share-tag">{{ item.era }}</span>
              </div>
              <div class="share-meta">
                <span class="share-author">
                  <span class="author-avatar">{{ (item.username || '匿')[0] }}</span>
                  {{ item.username }}
                </span>
                <div class="share-stats">
                  <span><svg viewBox="0 0 24 24" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/></svg> {{ item.views || 0 }}</span>
                  <span><svg viewBox="0 0 24 24" width="12" height="12"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg> {{ item.likes || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="community-empty">
          <svg viewBox="0 0 24 24" width="48" height="48"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" stroke="currentColor" fill="none" stroke-width="1"/></svg>
          <p>{{ $t('community.shares.noData') }}</p>
          <router-link to="/workshop/editor" class="btn btn-pri">{{ $t('community.shares.goWorkshop') }}</router-link>
        </div>
      </section>

      <!-- ==================== 论坛讨论 Tab（仅保留板块卡片 3×2） ==================== -->
      <section v-if="activeTab === 'forum'" class="community-section" key="forum">
        <div class="community-section-header">
          <h2>{{ $t('community.tabs.forum') }}</h2>
        </div>

        <div v-if="forumLoading" class="community-loading">
          <div class="atca-spinner"></div>
          <p>{{ $t('community.forum.loading') }}</p>
        </div>
        <div v-else-if="forumBoards.length > 0" class="forum-boards">
          <button
              v-for="board in forumBoards"
              :key="board.board_id"
              class="forum-board atca-board"
              @click="goBoard(board.board_id)"
          >
            <h4>{{ board.board_name }}</h4>
            <p>{{ board.description }}</p>
            <span class="board-count">{{ board.topic_count ?? 0 }} {{ $t('community.forum.topics') }}</span>
            <svg class="board-arrow" viewBox="0 0 24 24" width="14" height="14"><path d="M9 18l6-6-6-6" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>
        <div v-else class="community-empty">
          <p>{{ $t('community.forum.noData') }}</p>
        </div>
      </section>

      <!-- ==================== 我的评论 Tab ==================== -->
      <section v-if="activeTab === 'comments'" class="community-section" key="comments">
        <div class="community-section-header">
          <h2>{{ $t('community.tabs.comments') }}</h2>
        </div>

        <div v-if="commentsLoading" class="community-loading">
          <div class="atca-spinner"></div>
          <p>{{ $t('community.comments.loading') }}</p>
        </div>
        <template v-else>
          <div v-if="myTopics.length > 0" class="my-content-section">
            <h3 class="my-content-title">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 2v6h6" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ $t('community.comments.myTopics') }} ({{ myTopics.length }})
            </h3>
            <div class="my-topic-list">
              <div v-for="t in myTopics" :key="t.topic_id" class="my-topic-item" @click="openTopic(t.topic_id)">
                <h4>{{ t.title }}</h4>
                <p>{{ t.content?.substring(0, 80) }}{{ t.content?.length > 80 ? '...' : '' }}</p>
                <div class="my-topic-meta">
                  <span>{{ t.reply_count || 0 }} {{ $t('community.comments.replies') }}</span>
                  <span>{{ t.view_count || 0 }} {{ $t('community.comments.views') }}</span>
                  <span>{{ formatDate(t.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="myReplies.length > 0" class="my-content-section">
            <h3 class="my-content-title">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              {{ $t('community.comments.myReplies') || '我的回复' }} ({{ myReplies.length }})
            </h3>
            <div class="my-comment-list">
              <div v-for="c in myReplies" :key="c.reply_id" class="my-comment-item">
                <div class="my-comment-content">{{ c.content }}</div>
                <div class="my-comment-meta">
                  <span v-if="c.target_title" class="my-comment-target">{{ $t('community.comments.replyTo') || '回复论题：' }}{{ c.target_title }}</span>
                  <span class="my-comment-time">{{ formatDate(c.created_at) }}</span>
                  <button v-if="isLoggedIn" class="my-comment-delete" @click="deleteMyReply(c.reply_id)">{{ $t('profile.delete') }}</button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="myComments.length > 0 && myReplies.length === 0" class="my-comment-list">
            <div v-for="c in myComments" :key="c.comment_id" class="my-comment-item">
              <div class="my-comment-content">{{ c.content }}</div>
              <div class="my-comment-meta">
                <span v-if="c.target_title" class="my-comment-target">{{ $t('community.comments.commentOn') || '评论对象：' }}{{ c.target_title }}</span>
                <span class="my-comment-time">{{ formatDate(c.created_at) }}</span>
                <button class="my-comment-delete" @click="deleteMyComment(c.comment_id)">{{ $t('profile.delete') }}</button>
              </div>
            </div>
          </div>
          <div v-if="myTopics.length === 0 && myReplies.length === 0 && myComments.length === 0" class="community-empty">
            <p>{{ $t('community.comments.noData') }}</p>
            <button v-if="isLoggedIn && !userStore.isMuted" class="btn btn-pri" @click="activeTab = 'forum'">{{ $t('community.comments.goForum') || '去论坛看看' }}</button>
          </div>
        </template>
      </section>

    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import PageBackground from '@/components/common/PageBackground.vue';
import { socialApi, model3dApi } from '@/services/api';
import { useUserStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('ViewCommunity');
const router = useRouter();
const userStore = useUserStore();
const { t } = useI18n();
const isLoggedIn = computed(() => userStore.isLoggedIn);

const tabs = computed(() => [
  { id: 'shares', label: t('community.tabs.shares'), icon: '<path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" stroke="currentColor" fill="none" stroke-width="1.5"/>' },
  { id: 'forum', label: t('community.tabs.forum'), icon: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" fill="none" stroke-width="1.5"/>' },
  { id: 'comments', label: t('community.tabs.comments'), icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 2v6h6" stroke="currentColor" fill="none" stroke-width="1.5"/>' },
]);
const activeTab = ref('shares');

const sharesLoading = ref(false);
const forumLoading = ref(false);
const commentsLoading = ref(false);

const muteReason = ref('');

const buildingShares = ref<any[]>([]);
const shareSearch = ref('');
const shareEra = ref('');
const eraOptions = ['唐代', '宋代', '元代', '明代', '清代', '辽代', '金代', '现代'];

const forumBoards = ref<any[]>([]);

const myComments = ref<any[]>([]);
const myTopics = ref<any[]>([]);
const myReplies = ref<any[]>([]);

function formatDate(t: string) {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ---------- 数据加载方法 ---------- */

async function loadMuteStatus() {
  if (!isLoggedIn.value) return;
  try {
    const res = await socialApi.getMuteStatus();
    if (res.success) {
      userStore.isMuted = res.data?.is_muted || false;
      muteReason.value = res.data?.mute_reason || '';
    }
  } catch (e) { /* ignore */ }
}

async function loadShares() {
  sharesLoading.value = true;
  let shares: any[] = [];
  try {
    const res = await socialApi.getBuildingShares(shareSearch.value || undefined, shareEra.value || undefined);
    if (res.success) shares = res.data || [];
  } catch (e) { console.error('[Shares] 加载失败:', e); }

  try {
    const res = await model3dApi.list();
    if (res.success && res.data) {
      const publicModels = res.data.filter((m: any) => m.is_public === true || m.is_public === 1);
      const modelShares = publicModels.map((m: any) => ({
        share_id: `model_${m.model_id}`,
        title: m.model_name,
        description: m.description || `${m.component_count || 0}个构件的3D古建筑模型`,
        thumbnail_url: m.thumbnail_url,
        era: m.era || '古建筑',
        building_type: m.category || '3D模型',
        username: m.author || m.username || '匿名用户',
        views: m.view_count || 0,
        likes: m.like_count || 0,
        model_id: m.model_id,
        is_featured: m.is_featured,
        created_at: m.created_at,
      }));
      const existingIds = new Set(shares.map((s: any) => String(s.share_id || s.model_id)));
      for (const ms of modelShares) {
        if (!existingIds.has(String(ms.share_id))) {
          shares.push(ms);
          existingIds.add(String(ms.share_id));
        }
      }
    }
  } catch (e) { console.error('[Shares] 加载公开模型失败:', e); }

  if (shareSearch.value.trim()) {
    const q = shareSearch.value.toLowerCase();
    shares = shares.filter((s: any) =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.building_type || '').toLowerCase().includes(q) ||
        (s.username || '').toLowerCase().includes(q)
    );
  }
  if (shareEra.value) {
    shares = shares.filter((s: any) => s.era === shareEra.value);
  }
  shares.sort((a: any, b: any) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
  buildingShares.value = shares;
  sharesLoading.value = false;
}

/**
 * 确保卡片上的 "X 主题" 与数据库实际数据完全一致。
 */
async function loadBoards() {
  forumLoading.value = true;
  try {
    const res = await socialApi.getForumBoards();
    if (res.success) {
      const boards = res.data || [];
      // 并行获取每个板块的真实主题数
      await Promise.all(
          boards.map(async (board: any) => {
            try {
              const topicRes = await socialApi.getForumTopics(board.board_id);
              if (topicRes.success) {
                board.topic_count = (topicRes.data || []).length;
              } else {
                board.topic_count = 0;
              }
            } catch (e) {
              board.topic_count = 0;
            }
          })
      );
      forumBoards.value = boards;
    }
  } catch (e) {
    console.error('[Forum] 加载板块失败:', e);
  } finally {
    forumLoading.value = false;
  }
}

async function loadMyComments() {
  commentsLoading.value = true;
  try {
    const res = await socialApi.getMyContent();
    if (res.success) {
      myTopics.value = res.data?.topics || [];
      myReplies.value = res.data?.replies || [];
    }
    const res2 = await socialApi.getMyComments();
    if (res2.success) myComments.value = res2.data || [];
  } catch (e) {
    console.error('[Comments] 加载失败:', e);
  } finally {
    commentsLoading.value = false;
  }
}

/* ---------- Tab 切换监听 ---------- */
watch(activeTab, (tab) => {
  if (tab === 'shares') loadShares();
  if (tab === 'forum') loadBoards();
  if (tab === 'comments' && isLoggedIn.value) loadMyComments();
}, { immediate: true });

/* ---------- 交互方法 ---------- */

function openTopic(id: number | string) {
  const topicId = Number(id);
  if (!topicId) return;
  router.push(`/community/topic/${topicId}`);
}

function goBoard(boardId: number) {
  router.push(`/community/board/${boardId}`);
}

function openShareDetail(item: any) {
  if (item.model_id) {
    window.open(`/workshop/editor?load=${item.model_id}`, '_blank');
  }
}

async function deleteMyComment(id: number) {
  if (!confirm('确定删除这条评论？')) return;
  try {
    await socialApi.deleteComment(id);
    await loadMyComments();
  } catch (e) { console.error('[Comments] 删除失败:', e); }
}

async function deleteMyReply(id: number) {
  if (!confirm('确定删除这条回复？')) return;
  try {
    await socialApi.deleteReplyAdmin(id);
    await loadMyComments();
  } catch (e) { console.error('[Reply] 删除失败:', e); }
}

async function deleteTopic(id: number) {
  if (!confirm('确定删除这个帖子？此操作不可撤销。')) return;
  try {
    await socialApi.deleteTopicAdmin(id);
    await loadMyComments();
  } catch (e) { console.error('[Topic] 删除失败:', e); }
}

onMounted(async () => {
  await loadMuteStatus();
});
</script>

<style scoped>
.community-page { 
  min-height: 100vh; 
  position: relative;
  animation: communityFlowIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 社区页动画 - 云烟流动效果 */
@keyframes communityFlowIn {
  from {
    opacity: 0;
    transform: translateY(16px) translateX(8px);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0);
    filter: blur(0);
  }
}

.community-main { max-width: 1200px; margin: 0 auto; padding: 130px 24px 40px; position: relative; z-index: 2; }

.mute-warning {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(199, 92, 58, 0.1);
  border: 1px solid rgba(199, 92, 58, 0.3);
  color: #C75C3A;
  font-size: 0.8125rem;
}

.community-hero { position: relative; text-align: center; padding: 48px 24px; margin-bottom: 32px; border-radius: var(--r-lg); background: var(--bg-card); border: 1px solid var(--border); overflow: hidden; }
.community-hero-inner { position: relative; z-index: 2; }
.community-hero-title { display: inline-flex; align-items: center; gap: 12px; font-size: 1.75rem; font-weight: 700; color: var(--c-red); margin: 0 0 8px; }
.community-hero-desc { color: var(--text-muted); font-size: 0.9375rem; margin: 0; }
.community-hero-pattern { position: absolute; inset: 0; opacity: 0.03; background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E"); pointer-events: none; }

.community-tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--border); padding-bottom: 0; }
.community-tab { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; background: transparent; color: var(--text-muted); font-size: 0.875rem; cursor: pointer; transition: all var(--t); }
.community-tab:hover { color: var(--c-red); }
.community-tab.active { color: var(--c-red); border-bottom-color: var(--c-red); font-weight: 600; }

.community-section { animation: fadeIn 0.3s ease; }
.community-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.community-section-header h2 { font-size: 1.25rem; font-weight: 600; margin: 0; color: var(--text); }

.community-loading { text-align: center; padding: 60px 24px; color: var(--text-muted); }
.community-loading .atca-spinner { margin: 0 auto 16px; }

.community-search { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-input { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--bg-card); color: var(--text); font-size: 0.8125rem; min-width: 200px; outline: none; }
.search-input:focus { border-color: var(--c-red); }
.search-select { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--bg-card); color: var(--text); font-size: 0.8125rem; outline: none; }

.share-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.share-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); overflow: hidden; transition: box-shadow var(--t), transform var(--t); cursor: pointer; position: relative; }
.share-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
.share-thumb { position: relative; height: 180px; background: var(--bg-hover); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.share-thumb img { width: 100%; height: 100%; object-fit: cover; }
.share-placeholder { color: var(--text-muted); }
.share-badge { position: absolute; top: 8px; left: 8px; padding: 2px 8px; background: var(--gold); color: #fff; font-size: 0.625rem; font-weight: 600; border-radius: var(--r-sm); }
.share-era { position: absolute; bottom: 8px; right: 8px; padding: 2px 8px; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.625rem; border-radius: var(--r-sm); }
.share-info { padding: 16px; }
.share-title { font-size: 1rem; font-weight: 600; margin: 0 0 6px; color: var(--text); }
.share-desc { font-size: 0.8125rem; color: var(--text-muted); margin: 0 0 10px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.share-tags { display: flex; gap: 4px; margin-bottom: 10px; }
.share-tag { padding: 2px 8px; background: rgba(var(--gold-rgb), 0.08); color: var(--c-red); font-size: 0.6875rem; border-radius: var(--r-sm); }
.share-meta { display: flex; justify-content: space-between; align-items: center; }
.share-author { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); }
.author-avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--gold); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 600; }
.share-stats { display: flex; gap: 10px; font-size: 0.6875rem; color: var(--text-muted); }

.forum-boards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.forum-board { padding: 20px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--bg-card); text-align: left; cursor: pointer; transition: all var(--t); position: relative; }
.forum-board:hover { border-color: var(--c-red); background: rgba(var(--gold-rgb), 0.04); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.forum-board h4 { margin: 0 0 6px; font-size: 1rem; font-weight: 600; color: var(--text); }
.forum-board p { margin: 0 0 12px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.board-count { font-size: 0.75rem; color: var(--gold); font-weight: 500; }
.board-arrow { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-dim); transition: color 0.2s; }
.forum-board:hover .board-arrow { color: var(--gold); }

.my-content-section { margin-bottom: 24px; }
.my-content-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 600; color: var(--text); margin: 0 0 12px; }
.my-topic-list { display: flex; flex-direction: column; gap: 8px; }
.my-topic-item { padding: 14px 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-md); cursor: pointer; transition: all var(--t); }
.my-topic-item:hover { border-color: var(--gold-dim); }
.my-topic-item h4 { margin: 0 0 4px; font-size: 0.9375rem; font-weight: 600; color: var(--text); }
.my-topic-item p { margin: 0 0 6px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.4; }
.my-topic-meta { display: flex; gap: 12px; font-size: 0.6875rem; color: var(--text-muted); }

.my-comment-list { display: flex; flex-direction: column; gap: 10px; }
.my-comment-item { padding: 14px 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-md); }
.my-comment-content { font-size: 0.875rem; color: var(--text); line-height: 1.6; margin-bottom: 8px; }
.my-comment-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.my-comment-target { font-size: 0.75rem; color: var(--c-red); }
.my-comment-time { font-size: 0.75rem; color: var(--text-muted); }
.my-comment-delete { margin-left: auto; padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--r-sm); background: transparent; color: var(--text-muted); font-size: 0.6875rem; cursor: pointer; transition: all var(--t); }
.my-comment-delete:hover { color: var(--c-red); border-color: var(--c-red); }

.community-empty { text-align: center; padding: 60px 24px; color: var(--text-muted); }
.community-empty p { margin: 12px 0 16px; font-size: 0.9375rem; }

.btn.btn-pri {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #C9A96E 0%, #D4B87A 100%);
  color: #1A1714;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(201, 169, 110, 0.35);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn.btn-pri:hover {
  background: linear-gradient(135deg, #D4B87A 0%, #E0C88A 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(201, 169, 110, 0.45);
}
.btn.btn-pri:disabled {
  background: linear-gradient(135deg, #4a4338 0%, #3a342c 100%);
  color: #6a6050;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.btn.btn-sec {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3a342c 0%, #2a2520 100%);
  color: #E8E0D4;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1.5px solid #4a4338;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn.btn-sec:hover {
  background: linear-gradient(135deg, #4a4338 0%, #3a342c 100%);
  border-color: rgba(201, 169, 110, 0.4);
  color: #C9A96E;
  transform: translateY(-2px);
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

</style>