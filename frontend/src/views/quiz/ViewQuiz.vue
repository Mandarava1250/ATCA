<template>
  <div class="page">
    <Navbar />
    <!-- 模式选择弹窗 -->
    <div v-if="showModeSelect" class="mode-overlay" @click.self="showModeSelect = false">
      <div class="mode-modal">
        <h3 class="mode-title">选择答题模式</h3>
        <p class="mode-subtitle">{{ selectedModeLabel }}</p>
        <div class="mode-options">
          <button class="mode-btn mode-random" @click="startRandomMode">
            <div class="mode-icon">🎯</div>
            <div class="mode-body">
              <h4>随机新题</h4>
              <p>从题库中随机抽取{{ selectedModeCount }}道{{ selectedModeLabel }}题目</p>
            </div>
          </button>
          <button v-if="userStore.isLoggedIn" class="mode-btn mode-review" @click="startReviewMode">
            <div class="mode-icon">📝</div>
            <div class="mode-body">
              <h4>错题回顾</h4>
              <p>继续回答之前答错或未答的题目</p>
              <span v-if="wrongCount > 0" class="mode-badge">{{ wrongCount }}道题</span>
            </div>
          </button>
        </div>
        <!-- 访客提示 -->
        <div v-if="!userStore.isLoggedIn" class="guest-hint">
          <p>登录后可答题并记录成绩</p>
          <button class="login-btn" @click="goLogin">前往登录</button>
        </div>
        <button class="mode-cancel" @click="showModeSelect = false">取消</button>
      </div>
    </div>

    <div class="container page-content">
      <PageBackground :ember-count="25" :show-floating-text="false" />
      <div class="page-header">
        <h1 class="atca-title atca-title-lg">{{ $t('quiz.pageTitle') }}</h1>
        <p class="atca-text-muted">{{ $t('quiz.pageSubtitle') }}</p>
      </div>

      <!-- 每日打卡 -->
      <div class="checkin-card" v-if="checkin">
        <div class="checkin-left">
          <div class="checkin-icon" :class="{ checked: checkin.todayChecked }">
            <svg v-if="checkin.todayChecked" viewBox="0 0 24 24" width="24" height="24"><path d="M5 13l4 4L19 7" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <svg v-else viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="checkin-info">
            <h4>{{ checkin.todayChecked ? '今日已打卡' : '每日打卡' }}</h4>
            <p>连续 {{ checkin.streak }} 天</p>
          </div>
        </div>
        <div class="checkin-right">
          <div v-if="!checkin.todayChecked" class="checkin-action">
            <div class="countdown">
              <span class="countdown-label">距重置</span>
              <span class="countdown-time">{{ countdownText }}</span>
            </div>
            <router-link to="/quiz/play" class="atca-btn atca-btn-primary checkin-go-btn" @click="markCheckinEntry">去打卡</router-link>
          </div>
          <button v-else class="checkin-btn checked" disabled>已打卡</button>
        </div>
      </div>

      <div class="stats-bar" v-if="userStats">
        <div class="stat-box">
          <span class="stat-num">{{ userStats.total_points || 0 }}</span>
          <span class="stat-label">{{ $t('quiz.totalPoints') }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">{{ userStats.current_level || 1 }}</span>
          <span class="stat-label">{{ $t('quiz.currentLevel') }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">{{ userStats.games_played || 0 }}</span>
          <span class="stat-label">{{ $t('quiz.gamesPlayed') }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">{{ accuracy }}%</span>
          <span class="stat-label">{{ $t('quiz.accuracy') }}</span>
        </div>
      </div>

      <div class="modes-grid">
        <div
          v-for="mode in modes"
          :key="mode.mode_id"
          class="mode-card"
          @click="startQuiz(mode.mode_id)"
        >
          <div class="mode-icon">{{ mode.icon }}</div>
          <div class="mode-card-content">
            <h3>{{ mode.title }}</h3>
            <p>{{ mode.description }}</p>
            <div class="mode-meta">
              <span class="atca-tag atca-tag-primary">{{ mode.difficulty }}</span>
              <span>{{ Math.floor(mode.time_limit / 60) }}{{ $t('quiz.minutes') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-leaderboard">
        <h2 class="atca-title atca-title-md">{{ $t('quiz.leaderboard') }}</h2>
        <div v-if="leaderboard.length" class="leaderboard-table">
          <div v-for="(entry, idx) in leaderboard" :key="entry.user_id || idx" class="leaderboard-row">
            <span class="lb-rank" :class="{ 'top3': idx < 3 }">{{ idx + 1 }}</span>
            <img :src="entry.avatar || '/images/default-avatar.svg'" class="lb-avatar" @error="handleAvatarError" />
            <span class="lb-name">{{ entry.nickname || entry.username || '匿名' }}</span>
            <span class="lb-points">{{ entry.points || 0 }}{{ $t('quiz.points') }}</span>
            <span class="lb-level">Lv.{{ entry.level || 1 }}</span>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, onBeforeRouteUpdate } from 'vue-router';
import { useUserStore } from '@/stores';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import PageBackground from '@/components/common/PageBackground.vue';
import { quizApi, indexApi, activityApi } from '@/services/api';
import { createLogger } from '@/utils/logger';
import { getSyncService } from '@/utils/syncService';
import { logMount, logUnmount, logTimerStart, logTimerStop, logListenerAdd, logListenerRemove } from '@/utils/memoryLifecycle';

const logger = createLogger('ViewQuiz');

const router = useRouter();
const userStore = useUserStore();
const modes = ref<any[]>([]);
const userStats = ref<any>(null);
const leaderboard = ref<any[]>([]);

// 模式选择弹窗
const showModeSelect = ref(false);
const selectedModeId = ref('');
const selectedModeLabel = ref('');
const selectedModeCount = ref(10);
const wrongCount = ref(0);

function loadWrongCount() {
  const wrong = JSON.parse(localStorage.getItem('quiz_wrong') || '[]');
  wrongCount.value = wrong.length;
}

// 每日打卡
const checkin = ref({ todayChecked: false, streak: 0, lastCheckin: '' });
const countdownText = ref('');
let countdownTimer: ReturnType<typeof setInterval> | null = null;
const checkinLoading = ref(false);
const forceRefreshCheckin = ref(false);

async function loadCheckin(force = false) {
  checkinLoading.value = true;
  const today = new Date().toISOString().split('T')[0];

  const saved = localStorage.getItem('atca_checkin');
  let cachedChecked = false;
  let cachedStreak = 0;
  let cachedLastCheckin = '';
  let isPending = false;
  let isConfirmed = false;

  if (saved) {
    try {
      const cached = JSON.parse(saved);
      cachedChecked = cached.todayChecked || cached.lastCheckin === today;
      cachedStreak = cached.streak || 0;
      cachedLastCheckin = cached.lastCheckin || '';
      isPending = cached.pending === true;
      isConfirmed = cached.confirmed === true;
    } catch { /* ignore */ }
  }

  checkin.value.todayChecked = cachedChecked;
  checkin.value.streak = cachedStreak;
  checkin.value.lastCheckin = cachedLastCheckin;

  const cacheTime = parseInt(localStorage.getItem('atca_checkin_sync_time') || '0');
  const cacheAge = Date.now() - cacheTime;

  const useCacheOnly = cachedChecked && !force && !isPending && cacheAge < 30000;

  if (useCacheOnly) {
    logger?.info?.('使用本地缓存的已打卡状态（30秒内有效）', checkin.value);
    checkinLoading.value = false;
    if (countdownTimer && checkin.value.todayChecked) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    return;
  }

  try {
    const [statusRes, statsRes] = await Promise.all([
      activityApi.checkTodayCheckin(),
      activityApi.getCheckinStats(),
    ]);

    let backendChecked = false;
    let backendStreak = 0;
    let backendLastCheckin = '';

    if (statusRes.success && statusRes.data) {
      backendChecked = statusRes.data.checked_today;
    }
    if (statsRes.success && statsRes.data) {
      backendStreak = statsRes.data.max_streak || 0;
      backendLastCheckin = statsRes.data.last_checkin_date || '';
    }

    const localChecked = checkin.value.todayChecked;

    if (localChecked && !backendChecked && !isConfirmed) {
      logger?.warn?.('状态不一致：本地已打卡但后端未同步，保留本地状态并延迟刷新', {
        localChecked,
        backendChecked,
        isPending,
        cacheAge,
      });
      setTimeout(() => {
        loadCheckin(true);
      }, 3000);
    } else {
      checkin.value.todayChecked = backendChecked;
      checkin.value.streak = backendStreak;
      checkin.value.lastCheckin = backendLastCheckin || (backendChecked ? today : '');
    }

    const newCheckin = {
      todayChecked: checkin.value.todayChecked,
      streak: checkin.value.streak,
      lastCheckin: checkin.value.lastCheckin,
      pending: false,
      confirmed: backendChecked,
    };
    localStorage.setItem('atca_checkin', JSON.stringify(newCheckin));
    localStorage.setItem('atca_checkin_sync_time', Date.now().toString());

    logger?.info?.('打卡状态已从后端同步', newCheckin);
  } catch (e: any) {
    logger?.warn?.('打卡状态同步失败，保持当前状态', { error: e.message });
  } finally {
    checkinLoading.value = false;
    if (countdownTimer && checkin.value.todayChecked) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    } else if (!checkin.value.todayChecked && !countdownTimer) {
      startCountdown();
    }
  }
}

function startCountdown() {
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  countdownText.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function markCheckinEntry() {
  sessionStorage.setItem('quiz_from_checkin', '1');
}

function handleStorageSync(e: StorageEvent) {
  if (e.key === 'atca_checkin' && e.newValue) {
    try {
      const newCheckin = JSON.parse(e.newValue);
      const oldChecked = checkin.value.todayChecked;
      checkin.value.todayChecked = newCheckin.todayChecked || false;
      checkin.value.streak = newCheckin.streak || 0;
      checkin.value.lastCheckin = newCheckin.lastCheckin || '';
      
      if (checkin.value.todayChecked && !oldChecked) {
        if (countdownTimer) {
          clearInterval(countdownTimer);
          countdownTimer = null;
        }
        logger?.info?.('打卡状态已通过StorageEvent更新', checkin.value);
      }
    } catch { /* ignore */ }
  }
}

const accuracy = computed(() => {
  if (!userStats.value || !userStats.value.total_questions) return 0;
  return Math.round((userStats.value.total_correct / userStats.value.total_questions) * 100);
});

async function startQuiz(modeId: string) {
  const cfg = modes.value.find((m: any) => m.mode_id === modeId || m.mode === modeId || String(m.id) === modeId);
  selectedModeId.value = modeId;
  selectedModeLabel.value = cfg?.title || cfg?.difficulty || modeId;
  selectedModeCount.value = cfg?.question_count || 10;
  loadWrongCount();
  showModeSelect.value = true;
}

function startRandomMode() {
  showModeSelect.value = false;
  if (!userStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: `/quiz/play?mode=${selectedModeId.value}&type=random` } });
    return;
  }
  router.push({ path: '/quiz/play', query: { mode: selectedModeId.value, type: 'random' } });
}

function startReviewMode() {
  showModeSelect.value = false;
  if (!userStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: `/quiz/play?mode=${selectedModeId.value}&type=review` } });
    return;
  }
  router.push({ path: '/quiz/play', query: { mode: selectedModeId.value, type: 'review' } });
}

function goLogin() {
  showModeSelect.value = false;
  router.push({ path: '/login', query: { redirect: '/quiz' } });
}

function handleAvatarError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.src = '/images/default-avatar.svg';
}

async function refreshData() {
  await loadCheckin();
  loadWrongCount();
  try {
    const [modesRes, statsRes, lbRes] = await Promise.all([
      quizApi.getModes(),
      quizApi.getUserStats(),
      indexApi.getLeaderboard(),
    ]);
    if (modesRes.success) modes.value = modesRes.data;
    if (statsRes.success) userStats.value = statsRes.data;
    if (lbRes.success) leaderboard.value = lbRes.data.slice(0, 10);
  } catch (e) {
    console.error(e);
  }
}

onMounted(async () => {
  logMount('ViewQuiz');
  window.addEventListener('storage', handleStorageSync);
  logListenerAdd('ViewQuiz', 'storage', 'window');

  // 从答题页面返回时，先立即从 localStorage 读取乐观状态，再异步刷新
  const fromQuizPlay = sessionStorage.getItem('from_quiz_play');
  if (fromQuizPlay === 'true') {
    sessionStorage.removeItem('from_quiz_play');
    logger?.info?.('从答题页面返回，立即显示本地缓存状态，后台刷新确认');
    // 先读取本地缓存设置响应式状态（不阻塞 UI）
    const saved = localStorage.getItem('atca_checkin');
    if (saved) {
      try {
        const cached = JSON.parse(saved);
        if (cached.todayChecked) {
          checkin.value.todayChecked = true;
          checkin.value.streak = cached.streak || checkin.value.streak;
          checkin.value.lastCheckin = cached.lastCheckin || '';
          if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
          }
        }
      } catch { /* ignore */ }
    }
    // 后台异步刷新，确保状态与后端一致
    loadCheckin(false);
  } else {
    await loadCheckin(false);
  }

  await refreshData();

  // 注册 WebSocket 同步事件监听
  const syncService = getSyncService();
  const handleSyncCheckinUpdate = (data: any) => {
    const today = new Date().toISOString().split('T')[0];
    if (data.payload?.checkin_date === today) {
      checkin.value.todayChecked = true;
      checkin.value.streak = data.payload.streak_count || checkin.value.streak;
      checkin.value.lastCheckin = today;
      localStorage.setItem('atca_checkin', JSON.stringify({
        todayChecked: true,
        streak: checkin.value.streak,
        lastCheckin: today,
        pending: false,
        confirmed: true,
      }));
      localStorage.setItem('atca_checkin_sync_time', Date.now().toString());
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      logger?.info?.('通过 WebSocket 同步更新打卡状态', { checked: true, streak: checkin.value.streak });
    }
  };
  syncService.on('checkin_update', handleSyncCheckinUpdate);
  logListenerAdd('ViewQuiz', 'sync:checkin_update', 'syncService');

  // 保存引用以便在 onUnmounted 中移除
  (window as any).__viewQuizSyncHandler = handleSyncCheckinUpdate;
});

onBeforeRouteUpdate(async () => {
  await refreshData();
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    logTimerStop('ViewQuiz', 'countdown');
  }
  window.removeEventListener('storage', handleStorageSync);
  logListenerRemove('ViewQuiz', 'storage', 'window');

  // 移除 WebSocket 同步事件监听
  const syncService = getSyncService();
  if ((window as any).__viewQuizSyncHandler) {
    syncService.off('checkin_update', (window as any).__viewQuizSyncHandler);
    delete (window as any).__viewQuizSyncHandler;
    logListenerRemove('ViewQuiz', 'sync:checkin_update', 'syncService');
  }

  logUnmount('ViewQuiz');
});
</script>

<style scoped>
.page { 
  min-height: 100vh; 
  display: flex; 
  flex-direction: column; 
  position: relative; 
  background: var(--bg);
  animation: quizInkIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 测验页动画 - 墨韵淡入效果 */
@keyframes quizInkIn {
  from {
    opacity: 0;
    transform: scale(1.02);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

/* 模式选择弹窗 */
.mode-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
  animation: fadeIn 0.2s ease;
}
.mode-modal {
  background: linear-gradient(135deg, #221E19 0%, #1A1714 100%);
  border: 1px solid var(--border);
  border-radius: var(--r-xl);
  padding: 36px;
  max-width: 480px; width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: slideUp 0.3s ease;
}
.mode-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gold);
  text-align: center;
  margin-bottom: 4px;
}
.mode-subtitle {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 24px;
}
.mode-options {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}
.mode-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  border-radius: 16px;
  border: 1.5px solid var(--border);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.03) 100%);
  color: var(--text);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.mode-btn:hover {
  border-color: var(--gold-dim);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.35);
}
.mode-btn .mode-icon {
  font-size: 2rem;
  margin-bottom: 0;
  flex-shrink: 0;
}
.mode-body h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}
.mode-body p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin: 0;
}
.mode-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 10px;
  border-radius: var(--r-full);
  background: rgba(199, 92, 58, 0.2);
  color: #E89B7A;
  font-size: 0.75rem;
  font-weight: 600;
}
.mode-random:hover { border-color: rgba(91, 123, 76, 0.5); background: rgba(91, 123, 76, 0.06); }
.mode-review:hover { border-color: rgba(199, 92, 58, 0.5); background: rgba(199, 92, 58, 0.06); }
.mode-cancel {
  width: 100%;
  padding: 14px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.04em;
}
.mode-cancel:hover {
  border-color: var(--gold-dim);
  color: var(--text);
  background: linear-gradient(135deg, var(--bg-hover) 0%, rgba(201, 169, 110, 0.05) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 访客提示 */
.guest-hint {
  text-align: center;
  padding: 16px;
  margin-bottom: 16px;
  background: rgba(210, 176, 124, 0.05);
  border: 1px dashed rgba(210, 176, 124, 0.2);
  border-radius: 8px;
}
.guest-hint p {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-bottom: 8px;
}
.login-btn {
  padding: 8px 24px;
  background: linear-gradient(135deg, var(--gold) 0%, #D4B87A 100%);
  color: #1A1714;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(201, 169, 110, 0.35);
}

/* ===== 响应式适配 ===== */

/* 桌面端 (默认) */

/* 平板端 (900px - 1199px) */
@media (max-width: 1199px) {
  .modes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .mode-modal {
    padding: 28px 24px;
    max-width: 420px;
  }
  
  .mode-title {
    font-size: 1.375rem;
  }
}

/* 小平板/大屏手机 (600px - 899px) */
@media (max-width: 899px) {
  .page-content {
    padding-top: 80px;
    padding-bottom: 32px;
  }
  
  .page-header {
    margin-bottom: 24px;
  }
  
  .modes-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  
  .mode-card {
    padding: 22px 18px;
  }
  
  .mode-card .mode-icon {
    font-size: 1.75rem;
  }
  
  .mode-card h3 {
    font-size: 0.9375rem;
  }
  
  .mode-card p {
    font-size: 0.75rem;
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-box {
    padding: 16px 12px;
  }
  
  .stat-num {
    font-size: 1.25rem;
  }
  
  .checkin-card {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .checkin-left {
    flex-direction: column;
  }
  
  .checkin-right {
    width: 100%;
    justify-content: center;
  }
  
  .checkin-action {
    align-items: center;
    width: 100%;
  }
  
  .countdown {
    align-items: center;
  }
  
  .mode-modal {
    padding: 24px 20px;
    max-width: 380px;
  }
  
  .mode-btn {
    padding: 18px 20px;
    gap: 12px;
  }
  
  .mode-btn .mode-icon {
    font-size: 1.5rem;
  }
}

/* 移动端 (max 599px) */
@media (max-width: 599px) {
  .page-content {
    padding-top: 72px;
    padding-bottom: 24px;
  }
  
  .page-header {
    margin-bottom: 20px;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .page-header p {
    font-size: 0.875rem;
  }
  
  .modes-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .mode-card {
    padding: 20px 16px;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .mode-card .mode-icon {
    font-size: 1.75rem;
    flex-shrink: 0;
  }
  
  .mode-card h3 {
    margin-bottom: 4px;
  }
  
  .mode-card p {
    margin-bottom: 8px;
  }
  
  .mode-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .stat-box {
    padding: 12px 8px;
  }
  
  .stat-num {
    font-size: 1.125rem;
  }
  
  .stat-label {
    font-size: 0.6875rem;
  }
  
  .checkin-card {
    padding: 14px 16px;
  }
  
  .checkin-icon {
    width: 38px;
    height: 38px;
  }
  
  .checkin-info h4 {
    font-size: 0.875rem;
  }
  
  .checkin-info p {
    font-size: 0.6875rem;
  }
  
  .checkin-btn {
    padding: 8px 20px;
    font-size: 0.75rem;
  }
  
  .countdown-time {
    font-size: 1rem;
  }
  
  .mode-overlay {
    padding: 16px;
  }
  
  .mode-modal {
    padding: 20px 16px;
    width: 100%;
  }
  
  .mode-title {
    font-size: 1.25rem;
  }
  
  .mode-subtitle {
    font-size: 0.8125rem;
  }
  
  .mode-btn {
    padding: 16px 16px;
    gap: 10px;
  }
  
  .mode-body h4 {
    font-size: 0.9375rem;
  }
  
  .mode-body p {
    font-size: 0.75rem;
  }
  
  .guest-hint {
    padding: 12px;
  }
  
  .guest-hint p {
    font-size: 0.8125rem;
  }
  
  .login-btn {
    padding: 6px 20px;
    font-size: 0.8125rem;
  }
  
  .mode-cancel {
    padding: 12px;
    font-size: 0.8125rem;
  }
}

/* 小屏手机 (max 380px) */
@media (max-width: 380px) {
  .stats-bar {
    grid-template-columns: 1fr;
  }
  
  .mode-card {
    padding: 16px 14px;
    gap: 12px;
  }
  
  .mode-card .mode-icon {
    font-size: 1.5rem;
  }
  
  .checkin-card {
    padding: 12px;
  }
}

/* 每日打卡 */
.checkin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.03) 50%, var(--bg-light) 100%);
  border: 1.5px solid var(--border);
  border-radius: var(--r-xl);
  padding: var(--space-lg) var(--space-xl);
  margin-bottom: var(--space-xl);
  color: var(--text);
  box-shadow: var(--shadow-md);
  transition: all var(--t-fast);
  position: relative;
  overflow: hidden;
}
.checkin-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), var(--gold), var(--gold-dim), transparent);
  opacity: 0.6;
}
.checkin-card:hover {
  border-color: var(--gold-dim);
  box-shadow: var(--shadow-lg), var(--shadow-gold);
  transform: translateY(-2px);
}
.checkin-left { display: flex; align-items: center; gap: var(--space-md); }
.checkin-icon {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-hover); color: var(--text-muted);
  border: 2px solid var(--border); flex-shrink: 0;
  transition: all var(--t-fast);
}
.checkin-icon:hover {
  border-color: var(--gold-dim);
  transform: scale(1.08);
}
.checkin-icon.checked { 
  background: linear-gradient(135deg, rgba(91, 123, 76, 0.2) 0%, rgba(91, 123, 76, 0.05) 100%); 
  color: #7CB342; 
  border-color: rgba(91, 123, 76, 0.5); 
  animation: checkPulse 0.6s ease-out;
}
@keyframes checkPulse {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.checkin-info h4 { 
  font-family: var(--font-serif);
  font-size: 1rem; 
  font-weight: 600; 
  margin-bottom: var(--space-xs); 
  letter-spacing: 0.04em;
}
.checkin-info p { 
  font-size: 0.8125rem; 
  color: var(--gold-dim); 
  font-weight: 500;
}
.checkin-right { display: flex; align-items: center; gap: var(--space-md); }
.countdown { display: flex; flex-direction: column; align-items: flex-end; }
.countdown-label { 
  font-size: 0.625rem; 
  color: var(--text-dim); 
  text-transform: uppercase; 
  letter-spacing: 0.1em; 
}
.countdown-time { 
  font-family: var(--font-serif); 
  font-size: 1.25rem; 
  font-weight: 700; 
  color: var(--gold); 
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(201, 169, 110, 0.3);
  transition: color var(--t-fast);
}
.checkin-btn { 
  padding: var(--space-sm) var(--space-xl); 
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%); 
  color: #1A1714; 
  border-radius: var(--r-lg); 
  font-size: 0.875rem; 
  font-weight: 600; 
  cursor: pointer; 
  transition: all var(--t-fast); 
  border: none; 
  box-shadow: var(--shadow-gold); 
  letter-spacing: 0.04em;
  font-family: var(--font-serif);
}
.checkin-btn:hover:not(:disabled) { 
  background: linear-gradient(135deg, var(--gold-light) 0%, #E0C88A 100%); 
  transform: translateY(-3px); 
  box-shadow: var(--shadow-gold-lg);
}
.checkin-btn.checked { 
  background: linear-gradient(135deg, rgba(91, 123, 76, 0.3) 0%, rgba(91, 123, 76, 0.15) 100%); 
  color: #7CB342; 
  opacity: 1; 
  cursor: default; 
  box-shadow: none; 
  transform: none;
  border: 1px solid rgba(91, 123, 76, 0.4);
}
.checkin-action { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-sm); }
.checkin-go-btn { padding: var(--space-xs) var(--space-lg); font-size: 0.875rem; text-decoration: none; }
.page-content { flex: 1; padding-top: 100px; padding-bottom: 48px; position: relative; z-index: 2; }
.page-header { margin-bottom: 32px; }

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}
.stat-box {
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.02) 100%);
  border: 1.5px solid var(--border);
  border-radius: var(--r-xl);
  padding: var(--space-lg) var(--space-md);
  text-align: center;
  transition: all var(--t-fast);
  position: relative;
  overflow: hidden;
}
.stat-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-dim));
  opacity: 0;
  transition: opacity var(--t-fast);
}
.stat-box:hover {
  border-color: var(--gold-dim);
  box-shadow: var(--shadow-lg), var(--shadow-gold);
  transform: translateY(-4px);
}
.stat-box:hover::before {
  opacity: 0.8;
}
.stat-num {
  display: block;
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gold);
  text-shadow: 0 0 15px rgba(201, 169, 110, 0.3);
  transition: transform var(--t-fast);
}
.stat-box:hover .stat-num {
  transform: scale(1.1);
}
.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--space-xs);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-2xl);
}

@media (min-width: 1200px) {
  .modes-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-lg);
  }
}
.mode-card {
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.03) 50%, rgba(201, 169, 110, 0.01) 100%);
  border: 1.5px solid var(--border);
  border-radius: var(--r-xl);
  padding: var(--space-xl) var(--space-lg);
  text-align: center;
  cursor: pointer;
  transition: all var(--t-fast);
  color: var(--text);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}
.mode-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  opacity: 0;
  transition: opacity var(--t-fast);
}
.mode-card:hover {
  box-shadow: var(--shadow-xl), var(--shadow-gold);
  transform: translateY(-8px) scale(1.02);
  border-color: var(--gold);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.08) 50%, rgba(201, 169, 110, 0.05) 100%);
}
.mode-card:hover::before {
  opacity: 1;
}
.mode-icon {
  font-size: 2.75rem;
  margin-bottom: var(--space-md);
  transition: transform var(--t-fast);
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}
.mode-card:hover .mode-icon {
  transform: scale(1.15) translateY(-4px);
}
.mode-card h3 {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  margin-bottom: var(--space-sm);
  letter-spacing: 0.04em;
}
.mode-card p {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
  line-height: 1.5;
}
.mode-meta {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.section-leaderboard {
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.02) 100%);
  border: 1.5px solid var(--border);
  border-radius: var(--r-xl);
  padding: var(--space-xl);
  position: relative;
  overflow: hidden;
}
.section-leaderboard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-dim));
  opacity: 0.6;
}
.section-leaderboard h2 {
  margin-bottom: var(--space-lg);
  color: var(--text);
  font-family: var(--font-serif);
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.section-leaderboard h2::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--gold-dim), transparent);
}
.leaderboard-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.leaderboard-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--r-lg);
  transition: all var(--t-fast);
  color: var(--text);
}
.leaderboard-row:hover {
  background: var(--bg-hover);
  transform: translateX(4px);
}
.lb-rank {
  width: 32px;
  height: 32px;
  text-align: center;
  font-weight: 700;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 0.9375rem;
}
.lb-rank.top3 {
  color: var(--gold);
  font-size: 1.125rem;
  position: relative;
}
.lb-rank.top3::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  border: 2px solid var(--gold);
  opacity: 0.4;
  animation: rankGlow 2s ease-in-out infinite;
}
@keyframes rankGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
.lb-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border);
  transition: all var(--t-fast);
}
.leaderboard-row:hover .lb-avatar {
  border-color: var(--gold-dim);
  transform: scale(1.1);
}
.lb-name {
  flex: 1;
  font-size: 0.9375rem;
  font-weight: 500;
}
.lb-points {
  font-weight: 700;
  color: var(--gold);
  font-size: 0.9375rem;
  font-family: var(--font-serif);
  text-shadow: 0 0 10px rgba(201, 169, 110, 0.3);
}
.lb-level {
  font-size: 0.8125rem;
  color: var(--gold-dim);
  padding: 2px 8px;
  background: rgba(201, 169, 110, 0.1);
  border-radius: var(--r-full);
}

/* ===== 完整响应式适配方案 ===== */

/* 大屏桌面端 (≥1200px) */
@media screen and (min-width: 1200px) {
  .page-content {
    padding-top: 110px;
    padding-bottom: 56px;
  }
  
  .modes-grid {
    gap: var(--space-lg);
  }
  
  .mode-card {
    padding: var(--space-xl) var(--space-xl);
  }
  
  .stats-bar {
    gap: var(--space-lg);
  }
  
  .stat-box {
    padding: var(--space-xl) var(--space-lg);
  }

  .checkin-card {
    padding: var(--space-xl) var(--space-2xl);
  }
}

/* 桌面端 (900px - 1199px) */
@media screen and (max-width: 1199px) {
  .page-content {
    padding-top: 100px;
    padding-bottom: 48px;
  }
  
  .modes-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
  }
  
  .mode-card {
    padding: var(--space-lg) var(--space-md);
  }
  
  .mode-card h3 {
    font-size: 1rem;
  }
  
  .mode-card p {
    font-size: 0.8125rem;
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
  
  .stat-box {
    padding: var(--space-lg) var(--space-md);
  }
  
  .stat-num {
    font-size: 1.375rem;
  }
  
  .checkin-card {
    padding: var(--space-md) var(--space-lg);
  }
  
  .checkin-icon {
    width: 46px;
    height: 46px;
  }
  
  .mode-modal {
    padding: 30px 24px;
    max-width: 440px;
  }
}

/* 平板端 (600px - 899px) */
@media screen and (max-width: 899px) {
  .page-content {
    padding-top: 84px;
    padding-bottom: 40px;
  }
  
  .page-header {
    margin-bottom: var(--space-lg);
  }
  
  .page-header h1 {
    font-size: 1.75rem;
  }
  
  .modes-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
  
  .mode-card {
    padding: var(--space-lg) var(--space-md);
    text-align: center;
  }
  
  .mode-card .mode-icon {
    font-size: 2rem;
    margin-bottom: var(--space-sm);
  }
  
  .mode-card h3 {
    font-size: 0.9375rem;
    margin-bottom: var(--space-xs);
  }
  
  .mode-card p {
    font-size: 0.75rem;
    margin-bottom: var(--space-lg);
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }
  
  .stat-box {
    padding: var(--space-md) var(--space-sm);
  }
  
  .stat-num {
    font-size: 1.25rem;
  }
  
  .stat-label {
    font-size: 0.7rem;
  }
  
  .checkin-card {
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md);
    text-align: center;
  }
  
  .checkin-left {
    flex-direction: column;
    gap: var(--space-sm);
  }
  
  .checkin-right {
    width: 100%;
    justify-content: center;
  }
  
  .checkin-action {
    align-items: center;
    width: 100%;
    gap: var(--space-md);
  }
  
  .countdown {
    align-items: center;
  }
  
  .checkin-icon {
    width: 44px;
    height: 44px;
  }
  
  .mode-modal {
    padding: 24px 20px;
    max-width: 380px;
  }
  
  .mode-title {
    font-size: 1.25rem;
  }
  
  .mode-btn {
    padding: 18px 20px;
    gap: 12px;
  }
  
  .mode-btn .mode-icon {
    font-size: 1.75rem;
  }
  
  .leaderboard-row {
    padding: var(--space-sm) var(--space-md);
  }
  
  .lb-avatar {
    width: 32px;
    height: 32px;
  }
  
  .lb-rank {
    width: 28px;
    height: 28px;
  }
  
  .lb-name {
    font-size: 0.8125rem;
  }
  
  .lb-points, .lb-level {
    font-size: 0.75rem;
  }
}

/* 移动端 (max 599px) */
@media screen and (max-width: 599px) {
  .page-content {
    padding-top: 76px;
    padding-bottom: 32px;
  }
  
  .page-header {
    margin-bottom: var(--space-lg);
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .page-header p {
    font-size: 0.875rem;
  }
  
  .modes-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
  
  .mode-card {
    padding: var(--space-md) var(--space-sm);
    display: flex;
    align-items: center;
    text-align: left;
    gap: var(--space-md);
  }
  
  .mode-card .mode-icon {
    font-size: 1.75rem;
    margin-bottom: 0;
    flex-shrink: 0;
    width: 56px;
    text-align: center;
  }
  
  .mode-card-content {
    flex: 1;
    min-width: 0;
  }
  
  .mode-card h3 {
    font-size: 0.9375rem;
    margin-bottom: var(--space-xs);
  }
  
  .mode-card p {
    font-size: 0.75rem;
    margin-bottom: var(--space-sm);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .mode-meta {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }
  
  .stat-box {
    padding: var(--space-sm) var(--space-xs);
  }
  
  .stat-num {
    font-size: 1.125rem;
  }
  
  .stat-label {
    font-size: 0.6875rem;
  }
  
  .checkin-card {
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-sm);
  }
  
  .checkin-icon {
    width: 38px;
    height: 38px;
  }
  
  .checkin-info h4 {
    font-size: 0.875rem;
  }
  
  .checkin-info p {
    font-size: 0.7rem;
  }
  
  .checkin-btn {
    padding: var(--space-xs) var(--space-lg);
    font-size: 0.75rem;
  }
  
  .countdown-time {
    font-size: 1rem;
  }
  
  .mode-overlay {
    padding: var(--space-md);
  }
  
  .mode-modal {
    padding: var(--space-md) var(--space-sm);
    width: 100%;
    max-width: none;
  }
  
  .mode-title {
    font-size: 1.125rem;
  }
  
  .mode-subtitle {
    font-size: 0.8125rem;
  }
  
  .mode-btn {
    padding: var(--space-md) var(--space-md);
    gap: var(--space-sm);
  }
  
  .mode-body h4 {
    font-size: 0.875rem;
  }
  
  .mode-body p {
    font-size: 0.75rem;
  }
  
  .guest-hint {
    padding: var(--space-sm);
  }
  
  .login-btn {
    padding: var(--space-xs) var(--space-lg);
    font-size: 0.8125rem;
  }
  
  .section-leaderboard {
    padding: var(--space-md);
  }
  
  .section-leaderboard h2 {
    font-size: 1rem;
    margin-bottom: var(--space-md);
  }
  
  .leaderboard-row {
    padding: var(--space-xs) var(--space-sm);
    gap: var(--space-sm);
  }
  
  .lb-rank {
    width: 24px;
    height: 24px;
    font-size: 0.8125rem;
  }
  
  .lb-avatar {
    width: 28px;
    height: 28px;
  }
  
  .lb-name {
    font-size: 0.75rem;
  }
  
  .lb-points {
    font-size: 0.75rem;
  }
  
  .lb-level {
    font-size: 0.6875rem;
  }
}

/* 小屏手机 (max 360px) */
@media screen and (max-width: 360px) {
  .page-content {
    padding-left: var(--space-sm);
    padding-right: var(--space-sm);
  }
  
  .stats-bar {
    grid-template-columns: 1fr;
  }
  
  .mode-card {
    padding: var(--space-md) var(--space-sm);
    gap: var(--space-xs);
  }
  
  .mode-card .mode-icon {
    font-size: 1.5rem;
    width: 48px;
  }
  
  .checkin-card {
    padding: var(--space-xs) var(--space-sm);
  }

  .checkin-icon {
    width: 34px;
    height: 34px;
  }

  .lb-rank {
    width: 20px;
    height: 20px;
  }

  .lb-avatar {
    width: 24px;
    height: 24px;
  }
}

</style>
