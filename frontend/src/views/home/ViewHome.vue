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
        <div v-for="(s, i) in stats" :key="i" class="st-item">
          <span class="st-num">{{ s.num }}</span>
          <span class="st-label">{{ s.label }}</span>
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
}
function stopAutoCarousel() {
  if (autoCarouselTimer) {
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
  padding-bottom: 40px;
}
.hero-inner {
  position: relative;
  max-width: 1100px;
}

/* 眉题 */
.hero-eyebrow-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}
.eyebrow-line {
  flex: 1;
  height: 1px;
  max-width: 120px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
}
.eyebrow-line:first-child { background: linear-gradient(90deg, var(--gold-dim), transparent); }
.eyebrow-line:last-child { background: linear-gradient(90deg, transparent, var(--gold-dim)); }
.eyebrow-text {
  font-family: var(--font-serif);
  font-size: 0.8125rem;
  color: var(--gold);
  letter-spacing: 0.15em;
  white-space: nowrap;
}

/* 副标题 */
.hero-sub {
  font-family: var(--font-serif);
  font-size: 0.8125rem;
  color: var(--text-muted);
  letter-spacing: 0.5em;
  margin-bottom: 32px;
}

/* 主标题 */
.hero-title { margin-bottom: 48px; }
.title-line {
  display: block;
  font-family: var(--font-calligraphy);
  color: #F0E6D3;
  text-shadow: 0 2px 30px rgba(0,0,0,0.5);
  line-height: 1.3;
}
.title-line:nth-child(1) { font-size: 3.5rem; letter-spacing: 0.08em; }
.title-line:nth-child(2) { font-size: 3.5rem; letter-spacing: 0.08em; }
.title-line:nth-child(3) { font-size: 2.8rem; letter-spacing: 0.1em; margin-top: 4px; }
/* 描述 */
.hero-desc-box { display: flex; gap: 20px; max-width: 720px; margin-bottom: 48px; }
.desc-bar {
  width: 2px; flex-shrink: 0;
  background: linear-gradient(180deg, var(--gold), rgba(201,169,110,0.2));
  border-radius: 1px;
}
.desc-content p {
  font-family: var(--font-serif);
  font-size: 0.875rem; line-height: 2;
  color: #C9A96E; margin-bottom: 8px;
  letter-spacing: 0.04em;
}
.desc-content p:last-child { color: var(--text-muted); font-size: 0.8125rem; }

/* ===== 功能卡片 ===== */
.feature-section { position: relative; z-index: 2; padding: 24px 0 32px; }
.feature-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.feature-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  background: rgba(42, 37, 32, 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(201, 169, 110, 0.1);
  border-radius: var(--r-md);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  text-decoration: none;
  min-height: 200px;
}
.feature-card:hover {
  border-color: rgba(201, 169, 110, 0.22);
  background: rgba(42, 37, 32, 0.5);
  transform: translateY(-3px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(201, 169, 110, 0.06);
}
.fc-title { font-family: var(--font-serif); font-size: 1rem; font-weight: 600; color: var(--gold); margin-bottom: 12px; letter-spacing: 0.06em; line-height: 1.4; }
.fc-desc { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.7; flex-grow: 1; }

/* ===== 功能卡片响应式布局 ===== */
@media screen and (max-width: 1024px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .feature-card {
    padding: 20px;
    min-height: 180px;
  }
  .fc-title {
    font-size: 0.9375rem;
    margin-bottom: 10px;
  }
  .fc-desc {
    font-size: 0.75rem;
    line-height: 1.6;
  }
}

@media screen and (max-width: 767px) {
  .feature-section {
    padding: 16px 0 24px;
  }
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .feature-card {
    padding: 16px 20px;
    min-height: auto;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    border-radius: var(--r-sm);
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
    line-height: 1.6;
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
    padding: 14px 16px;
    gap: 12px;
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
.stats-bar { position: relative; z-index: 2; padding: 24px 0 40px; border-top: 1px solid var(--border); }
.stats-flex { display: flex; gap: 64px; }
.st-item { display: flex; align-items: baseline; gap: 10px; }
.st-num { font-family: var(--font-serif); font-size: 2rem; font-weight: 700; color: var(--gold); letter-spacing: 0.04em; }
.st-label { font-size: 0.8125rem; color: var(--text-muted); letter-spacing: 0.08em; }
/* ===== 活动动态 ===== */
.activity-section { position: relative; z-index: 2; padding: 32px 0 48px; }
.activity-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.activity-line { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--gold-dim), transparent); }
.activity-title { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 600; color: var(--gold); letter-spacing: 0.1em; white-space: nowrap; }

/* 分页导航 */
.activity-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}
.page-arrow {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}
.page-arrow:hover:not(:disabled) {
  border-color: var(--gold-dim);
  color: var(--gold);
  background: rgba(201, 169, 110, 0.06);
}
.page-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.page-indicator {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-family: var(--font-serif);
}

/* 活动卡片 */
.activity-grid { display: flex; flex-direction: column; gap: 12px; }
.activity-card {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px;
  background: rgba(42, 37, 32, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(201, 169, 110, 0.08);
  border-radius: var(--r-md);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all 0.25s ease;
  text-decoration: none;
  color: inherit;
}
.activity-card:hover {
  border-color: rgba(201, 169, 110, 0.2);
  background: rgba(42, 37, 32, 0.45);
  transform: translateX(4px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(201, 169, 110, 0.06);
}
.activity-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.25rem; flex-shrink: 0; }
.activity-icon.quiz { background: rgba(201, 169, 110, 0.12); }
.activity-icon.community { background: rgba(123, 194, 181, 0.12); }
.activity-icon.workshop { background: rgba(123, 158, 194, 0.12); }
.activity-body { flex: 1; min-width: 0; }
.act-name { font-size: 0.9375rem; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.act-desc { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.act-time { font-size: 0.75rem; color: var(--gold-dim); }
.act-arrow { color: var(--gold-dim); transition: color 0.2s; flex-shrink: 0; }
.activity-card:hover .act-arrow { color: var(--gold); }

.activity-loading { text-align: center; padding: 20px; }

.home-footer-space { height: 40px; }
</style>
