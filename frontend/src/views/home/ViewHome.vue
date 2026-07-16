<template>
  <div class="home-page">
    <Navbar />

    <!-- 共享背景 -->
    <PageBackground :ember-count="30" :show-floating-text="true" />

    <!-- ===== Hero ===== -->
    <section class="hero">
      <div class="container hero-inner">
        <!-- 眉题 -->
        <div class="hero-eyebrow-row">
          <div class="eyebrow-line"></div>
          <span class="eyebrow-text">{{ $t('home.eyebrow') }}</span>
          <div class="eyebrow-line"></div>
        </div>

        <!-- 副标题 -->
        <p class="hero-sub">{{ $t('home.heroSub') }}</p>

        <!-- 主标题 -->
        <h1 class="hero-title">
          <span class="title-line">{{ $t('home.heroTitle1') }}</span>
          <span class="title-line">{{ $t('home.heroTitle2') }}</span>
          <span class="title-line title-small">{{ $t('home.heroTitle3') }}</span>
        </h1>

        <!-- 描述 -->
        <div class="hero-desc-box">
          <div class="desc-bar"></div>
          <div class="desc-content">
            <p>{{ $t('home.descP1') }}</p>
            <p>{{ $t('home.descP2') }}</p>
            <p>{{ $t('home.descP3') }}</p>
            <p>{{ $t('home.descP4', { count: archCount }) }}</p>
            <p>{{ $t('home.descP5') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 功能卡片 ===== -->
    <section class="feature-section">
      <div class="container">
        <div class="feature-grid">
          <router-link v-for="(c, i) in featureCards" :key="i" :to="c.to" class="feature-card">
            <h3 class="fc-title">{{ c.title }}</h3>
            <p class="fc-desc">{{ c.desc }}</p>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ===== 底部统计 ===== -->
    <section class="stats-bar">
      <div class="container stats-flex">
        <div v-for="(s, i) in stats" :key="i" class="st-item" :style="{ animationDelay: `${i * 0.2}s` }">
          <span class="st-num" :data-target="s.num">{{ animatedStats[i] || '--' }}</span>
          <span class="st-label">{{ s.label }}</span>
          <div v-if="i < stats.length - 1" class="st-divider"></div>
        </div>
      </div>
    </section>

    <!-- ===== 活动动态 ===== -->
    <section class="activity-section">
      <div class="container">
        <div class="activity-header">
          <div class="activity-line"></div>
          <h2 class="activity-title">{{ $t('home.activityTitle') }}</h2>
          <div class="activity-line"></div>
        </div>

        <!-- 分页导航（当活动>3个时显示） -->
        <div v-if="totalPages > 1" class="activity-pagination">
          <button class="page-arrow" :disabled="currentPage === 0" @click="prevPage">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 19l-7-7 7-7" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
          <span class="page-indicator">{{ currentPage + 1 }} / {{ totalPages }}</span>
          <button class="page-arrow" :disabled="currentPage >= totalPages - 1" @click="nextPage">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 5l7 7-7 7" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </button>
        </div>

        <div class="activity-grid">
          <router-link
              v-for="(act, i) in paginatedActivities"
              :key="act.activity_id || i"
              :to="`/activity/${act.activity_id || act.id}`"
              class="activity-card"
          >
            <div class="activity-icon" :class="act.activity_type || 'community'">
              {{ typeIcon(act.activity_type) }}
            </div>
            <div class="activity-body">
              <h4 class="act-name">{{ act.title }}</h4>
              <p class="act-desc">{{ act.description }}</p>
              <span class="act-time">{{ formatDate(act.start_date) }}</span>
            </div>
            <div class="act-arrow">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 18l6-6-6-6" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            </div>
          </router-link>
        </div>

        <div v-if="loadingActivities" class="activity-loading">
          <div class="atca-spinner"></div>
        </div>
      </div>
    </section>

    <div class="home-footer-space"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, onBeforeMount, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import Navbar from '@/components/common/CommonNavbar.vue';
import PageBackground from '@/components/common/PageBackground.vue';
import { architectureApi, activityApi } from '@/services/api';
import { createLogger } from '@/utils/logger';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('ViewHome');
const logger = createLogger('ViewHome');
const perfLogger = logger.child('Performance');

const { t } = useI18n();
let mountStartTime = 0;

const archCount = ref(601);
const activityList = ref<any[]>([]);
const loadingActivities = ref(false);
const currentPage = ref(0);
const pageSize = 3;
let autoCarouselTimer: ReturnType<typeof setInterval> | null = null;
const AUTO_CAROUSEL_INTERVAL = 5000; // 5秒自动切换

/* ========== 功能卡片：4 大核心模块 ========== */
const featureCards = computed(() => [
  { title: t('home.hallArch'), desc: t('home.hallArchDesc'), to: '/architecture' },
  { title: t('home.hallQuiz'), desc: t('home.hallQuizDesc'), to: '/quiz' },
  { title: t('home.hallWorkshop'), desc: t('home.hallWorkshopDesc'), to: '/workshop' },
  { title: t('nav.community'), desc: t('home.hallCommunityDesc'), to: '/community' },
]);

const stats = ref([
  { num: '--', label: t('home.stat1') },
  { num: '--', label: t('home.stat2') },
  { num: '--', label: t('home.stat3') },
]);
const animatedStats = ref<string[]>(['--', '--', '--']);

function animateNumber(index: number, target: string) {
  const targetNum = parseInt(target, 10);
  if (isNaN(targetNum)) {
    animatedStats.value[index] = target;
    return;
  }
  const duration = 1500;
  const steps = 60;
  const increment = targetNum / steps;
  let current = 0;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    current = Math.min(Math.round(increment * step), targetNum);
    animatedStats.value[index] = String(current);
    if (step >= steps) {
      clearInterval(timer);
      animatedStats.value[index] = target;
    }
  }, duration / steps);
  memTrack.trackTimer(`statAnimation${index}`, timer as unknown as number, duration / steps);
}

// 分页计算
const totalPages = computed(() => Math.ceil(activityList.value.length / pageSize));
const paginatedActivities = computed(() => {
  const start = currentPage.value * pageSize;
  return activityList.value.slice(start, start + pageSize);
});

function startAutoCarousel() {
  stopAutoCarousel();
  if (totalPages.value <= 1) return;
  autoCarouselTimer = setInterval(() => {
    currentPage.value = (currentPage.value + 1) % totalPages.value;
  }, AUTO_CAROUSEL_INTERVAL);
  memTrack.trackTimer('autoCarousel', autoCarouselTimer as unknown as number, AUTO_CAROUSEL_INTERVAL);
}
function stopAutoCarousel() {
  if (autoCarouselTimer) {
    memTrack.untrackTimer('autoCarousel');
    clearInterval(autoCarouselTimer);
    autoCarouselTimer = null;
  }
}
function prevPage() {
  if (currentPage.value > 0) currentPage.value--;
  startAutoCarousel(); // 手动操作后重置计时
}
function nextPage() {
  if (currentPage.value < totalPages.value - 1) currentPage.value++;
  startAutoCarousel(); // 手动操作后重置计时
}

function typeIcon(type: string): string {
  const map: Record<string, string> = {
    quiz: '\u{1F393}',
    community: '\u{1F3DB}',
    workshop: '\u{1F3A8}',
  };
  return map[type] || '\u{2B50}';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

onBeforeMount(() => {
  mountStartTime = Date.now();
  logger.info('页面准备挂载', {
    timestamp: mountStartTime,
  });
});

onMounted(async () => {
  const mountedTime = Date.now();
  perfLogger.perf('页面挂载完成', {
    duration: mountedTime - mountStartTime,
    timestamp: mountedTime,
  });

  const apiStartTime = Date.now();
  // 加载统计
  try {
    logger.debug('开始加载统计数据');
    const res = await architectureApi.stats();
    if (res.data) {
      archCount.value = res.data.total || 0;
      stats.value = [
        { num: String(res.data.total || 0), label: t('home.stat1') },
        { num: String(res.data.dynasties || 0), label: t('home.stat2') },
        { num: String(res.data.regions || 0), label: t('home.stat3') },
      ];
      setTimeout(() => {
        stats.value.forEach((s, i) => animateNumber(i, s.num));
      }, 300);
    }
    logger.debug('统计数据加载完成', {
      total: res.data?.total,
    });
  } catch (e) {
    logger.warn('统计数据加载失败，使用默认值', {
      error: e instanceof Error ? e.message : String(e),
    });
    archCount.value = 601;
    stats.value = [
      { num: '601', label: t('home.stat1') },
      { num: '23', label: t('home.stat2') },
      { num: '468', label: t('home.stat3') },
    ];
    setTimeout(() => {
      stats.value.forEach((s, i) => animateNumber(i, s.num));
    }, 300);
  }

  // 加载活动数据
  loadingActivities.value = true;
  try {
    logger.debug('开始加载活动数据');
    const actRes = await activityApi.getActivities();
    if (actRes.data) {
      const raw = actRes.data;
      if (Array.isArray(raw)) {
        activityList.value = raw;
      } else if (typeof raw === 'object' && Array.isArray((raw as any).data)) {
        activityList.value = (raw as any).data;
      }
    }
    logger.debug('活动数据加载完成', {
      count: activityList.value.length,
    });
  } catch (e) {
    logger.warn('活动数据加载失败', {
      error: e instanceof Error ? e.message : String(e),
    });
  } finally {
    loadingActivities.value = false;
    const apiEndTime = Date.now();
    perfLogger.perf('API数据加载完成', {
      duration: apiEndTime - apiStartTime,
      activitiesCount: activityList.value.length,
    });
    if (activityList.value.length > pageSize) startAutoCarousel();
  }
});

onBeforeUnmount(() => {
  logger.info('页面准备卸载', {
    timestamp: Date.now(),
  });
});

onUnmounted(() => {
  logger.info('页面已卸载', {
    timestamp: Date.now(),
  });
  stopAutoCarousel();
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: var(--bg);
  animation: scrollHomeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 首页专属动画 - 水墨展开效果 */
@keyframes scrollHomeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* ===== Hero ===== */
.hero {
  position: relative;
  z-index: 2;
  padding-top: 120px;
  padding-bottom: var(--space-2xl);
}
.hero-inner {
  position: relative;
  max-width: 1100px;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--gold-rgb), 0.15), transparent);
}

/* 眉题 */
.hero-eyebrow-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
  animation: fadeInUp 0.6s ease-out 0.1s both;
}
.eyebrow-line {
  flex: 1;
  height: 1px;
  max-width: 140px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
}
.eyebrow-line:first-child { background: linear-gradient(90deg, rgba(var(--gold-rgb), 0.4), transparent); }
.eyebrow-line:last-child { background: linear-gradient(90deg, transparent, rgba(var(--gold-rgb), 0.4)); }
.eyebrow-text {
  font-family: var(--font-serif);
  font-size: 0.8125rem;
  color: var(--gold);
  letter-spacing: 0.2em;
  white-space: nowrap;
  position: relative;
}
.eyebrow-text::before,
.eyebrow-text::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border: 1px solid var(--gold-dim);
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
}
.eyebrow-text::before { left: -16px; }
.eyebrow-text::after { right: -16px; }

/* 副标题 */
.hero-sub {
  font-family: var(--font-serif);
  font-size: 0.8125rem;
  color: var(--text-muted);
  letter-spacing: 0.5em;
  margin-bottom: var(--space-xl);
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

/* 主标题 */
.hero-title { 
  margin-bottom: var(--space-2xl); 
  animation: fadeInUp 0.6s ease-out 0.3s both;
}
.title-line {
  display: block;
  font-family: var(--font-calligraphy);
  color: #F0E6D3;
  text-shadow: 0 2px 40px rgba(0,0,0,0.6), 0 0 60px rgba(var(--gold-rgb), 0.1);
  line-height: 1.25;
  opacity: 0;
  animation: slideIn 0.8s ease-out forwards;
}
.title-line:nth-child(1) { 
  font-size: 3.5rem; 
  letter-spacing: 0.08em; 
  animation-delay: 0.4s;
}
.title-line:nth-child(2) { 
  font-size: 3.5rem; 
  letter-spacing: 0.08em; 
  animation-delay: 0.5s;
}
.title-line:nth-child(3) { 
  font-size: 2.8rem; 
  letter-spacing: 0.1em; 
  margin-top: var(--space-xs); 
  animation-delay: 0.6s;
  color: var(--gold);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    filter: blur(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 描述 */
.hero-desc-box { 
  display: flex; 
  gap: var(--space-lg); 
  max-width: 720px; 
  margin-bottom: var(--space-2xl);
  animation: fadeInUp 0.6s ease-out 0.7s both;
}
.desc-bar {
  width: 3px; 
  flex-shrink: 0;
  background: linear-gradient(180deg, var(--gold), rgba(var(--gold-rgb), 0.3), transparent);
  border-radius: var(--r-xs);
  position: relative;
}
.desc-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: var(--gold);
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(var(--gold-rgb), 0.5);
}
.desc-content p {
  font-family: var(--font-serif);
  font-size: 0.875rem; 
  line-height: 2.2;
  color: var(--gold); 
  margin-bottom: var(--space-sm);
  letter-spacing: 0.04em;
}
.desc-content p:last-child { 
  color: var(--text-muted); 
  font-size: 0.8125rem; 
}

/* ===== 功能卡片 ===== */
.feature-section { 
  position: relative; 
  z-index: 2; 
  padding: var(--space-lg) 0 var(--space-xl); 
}
.feature-grid { 
  display: grid; 
  grid-template-columns: repeat(4, 1fr); 
  gap: var(--space-lg); 
}
.feature-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-xl);
  background: rgba(42, 37, 32, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(var(--gold-rgb), 0.08);
  border-radius: var(--r-lg);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.04), 
    0 4px 20px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(var(--gold-rgb), 0.03);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  text-decoration: none;
  min-height: 210px;
  position: relative;
  overflow: hidden;
}
.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity: 0;
  transform: scaleX(0);
  transition: all 0.4s ease;
}
.feature-card:hover {
  border-color: rgba(var(--gold-rgb), 0.25);
  background: rgba(42, 37, 32, 0.6);
  transform: translateY(-6px) scale(1.01);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.08), 
    var(--shadow-xl),
    var(--shadow-gold);
}
.feature-card:hover::before {
  opacity: 1;
  transform: scaleX(1);
}
.fc-title { 
  font-family: var(--font-serif); 
  font-size: 1.0625rem; 
  font-weight: 600; 
  color: var(--gold); 
  margin-bottom: var(--space-md); 
  letter-spacing: 0.08em; 
  line-height: 1.4; 
  transition: color 0.3s ease;
}
.feature-card:hover .fc-title {
  color: var(--gold-light);
}
.fc-desc { 
  font-size: 0.8125rem; 
  color: var(--text-muted); 
  line-height: 1.8; 
  flex-grow: 1; 
  transition: color 0.3s ease;
}
.feature-card:hover .fc-desc {
  color: var(--text);
}

/* ===== 功能卡片响应式布局 ===== */
@media screen and (max-width: 1024px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
  }
  .feature-card {
    padding: var(--space-lg);
    min-height: 180px;
  }
  .fc-title {
    font-size: 0.9375rem;
    margin-bottom: var(--space-sm);
  }
  .fc-desc {
    font-size: 0.75rem;
    line-height: 1.7;
  }
}

@media screen and (max-width: 767px) {
  .feature-section {
    padding: var(--space-md) 0 var(--space-lg);
  }
  .feature-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
  .feature-card {
    padding: var(--space-md) var(--space-lg);
    min-height: auto;
    flex-direction: row;
    align-items: center;
    gap: var(--space-md);
    border-radius: var(--r-md);
  }
  .feature-card::before {
    display: none;
  }
  .fc-title {
    font-size: 0.9375rem;
    margin-bottom: 0;
    flex-shrink: 0;
    min-width: 80px;
    text-align: center;
  }
  .fc-desc {
    font-size: 0.75rem;
    line-height: 1.7;
    flex-grow: 1;
    margin-bottom: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

@media screen and (max-width: 359px) {
  .feature-card {
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-sm);
  }
  .fc-title {
    font-size: 0.875rem;
    min-width: 70px;
  }
  .fc-desc {
    font-size: 0.7125rem;
  }
}
/* ===== 底部统计 ===== */
.stats-bar { 
  position: relative; 
  z-index: 2; 
  padding: var(--space-xl) 0 var(--space-2xl); 
  border-top: 1px solid var(--border);
}
.stats-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--gold-rgb), 0.1), transparent);
}
.stats-flex { 
  display: flex; 
  gap: var(--space-3xl); 
  justify-content: center;
}
.st-item { 
  display: flex; 
  align-items: center; 
  gap: var(--space-md); 
  opacity: 0;
  animation: statFadeIn 0.8s ease-out forwards;
  position: relative;
  padding: 0 var(--space-lg);
}
@keyframes statFadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.st-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, transparent, var(--gold-dim), transparent);
  margin-left: var(--space-lg);
}
.st-num { 
  font-family: var(--font-serif); 
  font-size: 2.25rem; 
  font-weight: 700; 
  color: var(--gold); 
  letter-spacing: 0.02em;
  text-shadow: 0 0 30px rgba(var(--gold-rgb), 0.2);
  transition: color 0.3s ease, text-shadow 0.3s ease;
}
.st-item:hover .st-num {
  color: var(--gold-light);
  text-shadow: 0 0 40px rgba(var(--gold-rgb), 0.4);
}
.st-label { 
  font-size: 0.8125rem; 
  color: var(--text-muted); 
  letter-spacing: 0.1em;
  transition: color 0.3s ease;
}
.st-item:hover .st-label {
  color: var(--text);
}
/* ===== 活动动态 ===== */
.activity-section { 
  position: relative; 
  z-index: 2; 
  padding: var(--space-xl) 0 var(--space-2xl); 
}
.activity-header { 
  display: flex; 
  align-items: center; 
  gap: var(--space-md); 
  margin-bottom: var(--space-lg); 
}
.activity-line { 
  flex: 1; 
  height: 1px; 
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent); 
}
.activity-title { 
  font-family: var(--font-serif); 
  font-size: 1.125rem; 
  font-weight: 600; 
  color: var(--gold); 
  letter-spacing: 0.12em; 
  white-space: nowrap;
  position: relative;
}
.activity-title::before,
.activity-title::after {
  content: '\u2022';
  color: var(--gold-dim);
  margin: 0 var(--space-sm);
}

/* 分页导航 */
.activity-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}
.page-arrow {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: rgba(42, 37, 32, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.page-arrow:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(var(--gold-rgb), 0.1);
  transform: scale(1.1);
  box-shadow: var(--shadow-gold);
}
.page-arrow:active:not(:disabled) {
  transform: scale(0.95);
}
.page-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.page-indicator {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-family: var(--font-serif);
  letter-spacing: 0.06em;
  padding: 4px 12px;
  background: rgba(42, 37, 32, 0.3);
  border-radius: var(--r-full);
  border: 1px solid var(--border);
}

/* 活动卡片 */
.activity-grid { 
  display: flex; 
  flex-direction: column; 
  gap: var(--space-md); 
}
.activity-card {
  display: flex; 
  align-items: center; 
  gap: var(--space-lg);
  padding: var(--space-lg) var(--space-xl);
  background: rgba(42, 37, 32, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--gold-rgb), 0.06);
  border-radius: var(--r-lg);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
}
.activity-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--gold), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.activity-card:hover {
  border-color: rgba(var(--gold-rgb), 0.25);
  background: rgba(42, 37, 32, 0.55);
  transform: translateX(8px);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 6px 24px rgba(0, 0, 0, 0.25),
    0 0 20px rgba(var(--gold-rgb), 0.08);
}
.activity-card:hover::before {
  opacity: 1;
}
.activity-icon { 
  width: 48px; 
  height: 48px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  border-radius: var(--r-lg); 
  font-size: 1.5rem; 
  flex-shrink: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.activity-card:hover .activity-icon {
  transform: scale(1.1);
}
.activity-icon.quiz { 
  background: rgba(var(--gold-rgb), 0.12); 
  color: var(--gold);
}
.activity-icon.community { 
  background: rgba(123, 194, 181, 0.12); 
  color: #7BC2B5;
}
.activity-icon.workshop { 
  background: rgba(123, 158, 194, 0.12); 
  color: #7B9EC2;
}
.activity-body { 
  flex: 1; 
  min-width: 0; 
}
.act-name { 
  font-size: 0.9375rem; 
  font-weight: 600; 
  color: var(--text); 
  margin-bottom: var(--space-xs);
  transition: color 0.3s ease;
}
.activity-card:hover .act-name {
  color: var(--gold-light);
}
.act-desc { 
  font-size: 0.8125rem; 
  color: var(--text-muted); 
  margin-bottom: var(--space-xs); 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  transition: color 0.3s ease;
}
.activity-card:hover .act-desc {
  color: var(--text);
}
.act-time { 
  font-size: 0.75rem; 
  color: var(--gold-dim); 
  font-family: var(--font-serif);
  letter-spacing: 0.04em;
}
.act-arrow { 
  color: var(--gold-dim); 
  transition: all 0.3s ease; 
  flex-shrink: 0;
  transform: translateX(0);
}
.activity-card:hover .act-arrow { 
  color: var(--gold); 
  transform: translateX(4px);
}

.activity-loading { text-align: center; padding: var(--space-xl); }

.home-footer-space { height: 40px; }
</style>
