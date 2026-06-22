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
          <h3>{{ mode.title }}</h3>
          <p>{{ mode.description }}</p>
          <div class="mode-meta">
            <span class="atca-tag atca-tag-primary">{{ mode.difficulty }}</span>
            <span>{{ Math.floor(mode.time_limit / 60) }}{{ $t('quiz.minutes') }}</span>
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
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import PageBackground from '@/components/common/PageBackground.vue';
import { quizApi, indexApi } from '@/services/api';

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

function loadCheckin() {
  const saved = localStorage.getItem('atca_checkin');
  if (saved) {
    try { checkin.value = JSON.parse(saved); } catch { /* ignore */ }
  }
  const today = new Date().toDateString();
  checkin.value.todayChecked = checkin.value.lastCheckin === today;
  if (!checkin.value.todayChecked) {
    startCountdown();
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
  // 标记是从打卡入口进入的，交卷后才真正打卡
  sessionStorage.setItem('quiz_from_checkin', '1');
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

onMounted(async () => {
  loadCheckin();
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
});

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
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

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* 每日打卡 */
.checkin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-light) 100%);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 16px 20px;
  margin-bottom: 24px;
  color: var(--text);
}
.checkin-left { display: flex; align-items: center; gap: 14px; }
.checkin-icon {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-hover); color: var(--text-muted);
  border: 2px solid var(--border); flex-shrink: 0;
}
.checkin-icon.checked { background: rgba(91, 123, 76, 0.15); color: #7CB342; border-color: rgba(91, 123, 76, 0.4); }
.checkin-info h4 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 2px; }
.checkin-info p { font-size: 0.75rem; color: var(--text-muted); }
.checkin-right { display: flex; align-items: center; gap: 12px; }
.countdown { display: flex; flex-direction: column; align-items: flex-end; }
.countdown-label { font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.countdown-time { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 700; color: var(--gold); letter-spacing: 0.05em; }
.checkin-btn { padding: 10px 24px; background: linear-gradient(135deg, var(--gold) 0%, #D4B87A 100%); color: #1A1714; border-radius: 12px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: none; box-shadow: 0 4px 12px rgba(201, 169, 110, 0.25); letter-spacing: 0.03em; }
.checkin-btn:hover:not(:disabled) { background: linear-gradient(135deg, #D4B87A 0%, var(--gold-light, #D9C9A0) 100%); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(201, 169, 110, 0.35); }
.checkin-btn.checked { background: rgba(91, 123, 76, 0.5); color: #fff; opacity: 0.7; cursor: default; box-shadow: none; transform: none; }
.checkin-action { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.checkin-go-btn { padding: 6px 16px; font-size: 0.8125rem; text-decoration: none; }
.page-content { flex: 1; padding-top: 100px; padding-bottom: 48px; position: relative; z-index: 2; }
.page-header { margin-bottom: 32px; }

.stats-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.stat-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  text-align: center;
  transition: all var(--t);
}
.stat-box:hover {
  border-color: var(--gold-dim);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.stat-num {
  display: block;
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gold);
}
.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 48px;
}
.mode-card {
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.03) 100%);
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 28px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.mode-card:hover {
  box-shadow: 0 16px 48px rgba(0,0,0,0.35);
  transform: translateY(-6px);
  border-color: var(--gold);
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.08) 100%);
}
.mode-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}
.mode-card h3 {
  font-size: 1.125rem;
  margin-bottom: 8px;
}
.mode-card p {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}
.mode-meta {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.section-leaderboard {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 24px;
}
.section-leaderboard h2 {
  margin-bottom: 20px;
  color: var(--text);
}
.leaderboard-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.leaderboard-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--r-md);
  transition: background var(--t);
  color: var(--text);
}
.leaderboard-row:hover {
  background: var(--bg-hover);
}
.lb-rank {
  width: 28px;
  text-align: center;
  font-weight: 700;
  color: var(--text-muted);
}
.lb-rank.top3 {
  color: var(--gold);
}
.lb-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border);
}
.lb-name {
  flex: 1;
  font-size: 0.875rem;
}
.lb-points {
  font-weight: 600;
  color: var(--gold);
  font-size: 0.875rem;
}
.lb-level {
  font-size: 0.75rem;
  color: var(--text-muted);
}

</style>
