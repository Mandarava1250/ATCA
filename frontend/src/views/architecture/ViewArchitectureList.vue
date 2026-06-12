<template>
  <div class="page">
    <Navbar />
    <div class="container page-content arch-layout">
      <!-- 共享背景 -->
    <PageBackground :ember-count="30" :show-floating-text="false" />

    <!-- 侧边栏 (桌面端显示) -->
      <aside class="arch-sidebar">
        <div class="sidebar-inner">
          <h2 class="sidebar-title">{{ $t('architecture.pageTitle') }}</h2>
          <p class="sidebar-subtitle">{{ $t('architecture.pageSubtitle') }}</p>

          <!-- 搜索 -->
          <div class="sidebar-section">
            <label class="sidebar-label">搜索</label>
            <input
              v-model="searchQuery"
              type="text"
              class="sidebar-input"
              :placeholder="$t('architecture.searchPlaceholder')"
              @input="handleSearch"
            />
          </div>

          <!-- 类型筛选 -->
          <div class="sidebar-section">
            <label class="sidebar-label">建筑类型</label>
            <div class="sidebar-filters">
              <button
                class="filter-chip"
                :class="{ active: filterType === '' }"
                @click="filterType = ''; loadArchitectures()"
              >全部</button>
              <button
                v-for="t in types"
                :key="t"
                class="filter-chip"
                :class="{ active: filterType === t }"
                @click="filterType = t; loadArchitectures()"
              >{{ t }}</button>
            </div>
          </div>

          <!-- 朝代筛选 -->
          <div class="sidebar-section">
            <label class="sidebar-label">朝代</label>
            <div class="sidebar-filters">
              <button
                class="filter-chip"
                :class="{ active: filterDynasty === '' }"
                @click="filterDynasty = ''; loadArchitectures()"
              >全部</button>
              <button
                v-for="d in dynasties"
                :key="d"
                class="filter-chip"
                :class="{ active: filterDynasty === d }"
                @click="filterDynasty = d; loadArchitectures()"
              >{{ d }}</button>
            </div>
          </div>

          <!-- 统计 -->
          <div class="sidebar-stats" v-if="architectures.length">
            <div class="sidebar-stat-item">
              <span class="sidebar-stat-num">{{ architectures.length }}</span>
              <span class="sidebar-stat-label">当前展示</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="arch-main">
        <!-- 省份地图 -->
        <!-- Province map selector removed - use /architecture/map for full map -->

        <!-- 朝代时间轴 -->
        <DynastyTimeline v-model="filterDynasty" />

        <div class="sort-bar">
          <router-link to="/architecture/map" class="sort-btn map-btn">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 10h18M3 14h18M12 2v20" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="10" r="8" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            地域分布
          </router-link>
          <span v-if="architectures.length" class="result-count">共 {{ architectures.length }} 座</span>
        </div>

        <div v-if="loading" class="loading-grid">
          <div v-for="i in 6" :key="i" class="atca-skeleton arch-skeleton"></div>
        </div>

        <div v-else class="arch-grid">
          <div
            v-for="arch in sortedArchitectures"
            :key="arch.architecture_id"
            class="arch-card"
            :class="{ 'arch-favorited': arch.is_favorited }"
          >
            <button
              class="fav-btn"
              :class="{ 'fav-active': arch.is_favorited }"
              @click.stop="toggleFavorite(arch)"
              :title="arch.is_favorited ? '已收藏，点击取消' : '点击收藏'"
            >
              <svg v-if="arch.is_favorited" viewBox="0 0 24 24" width="18" height="18" fill="#c9302c"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
            <router-link :to="`/architecture/${arch.architecture_id}`" class="arch-card-link">
              <div class="arch-image">
                <img :src="arch.main_image_url || '/images/default-arch.jpg'" :alt="arch.name" />
                <span class="arch-type">{{ arch.type }}</span>
              </div>
              <div class="arch-info">
                <h3>{{ displayName(arch) }}</h3>
                <p class="arch-meta">{{ arch.founding_dynasty }} · {{ arch.location }}</p>
                <p class="arch-desc">{{ arch.brief_description }}</p>
              </div>
            </router-link>
          </div>
        </div>

        <div v-if="!loading && architectures.length === 0" class="empty-state">
          <p>{{ $t('architecture.noResults') }}</p>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button
            v-for="p in totalPages"
            :key="p"
            class="page-btn"
            :class="{ active: p === currentPage }"
            @click="currentPage = p; loadArchitectures()"
          >
            {{ p }}
          </button>
        </div>
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeMount, onBeforeUnmount, onUnmounted } from 'vue';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import PageBackground from '@/components/common/PageBackground.vue';
// ProvinceMap and DynastyTimeline components removed - map feature now at /architecture/map
import { architectureApi } from '@/services/api';
import { debounce } from '@shared/utils';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ViewArchitectureList');
const perfLogger = logger.child('Performance');

const architectures = ref<any[]>([]);
const allArchitectures = ref<any[]>([]);
const types = ref<string[]>([]);
const dynasties = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const filterType = ref('');
const filterDynasty = ref('');
const filterProvince = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
let mountStartTime = 0;

// 自动排序：有搜索词时按名称匹配度（智能推荐），无搜索词时按浏览热度
const sortedArchitectures = computed(() => {
  let list = architectures.value;
  if (searchQuery.value.trim()) {
    // 智能匹配模式：按名称匹配度排序
    const q = searchQuery.value.toLowerCase().trim();
    return [...list].sort((a, b) => {
      const aName = (a.chinese_name || a.name || '').toLowerCase();
      const bName = (b.chinese_name || b.name || '').toLowerCase();
      const aExact = aName === q ? 100 : aName.startsWith(q) ? 10 : aName.includes(q) ? 1 : 0;
      const bExact = bName === q ? 100 : bName.startsWith(q) ? 10 : bName.includes(q) ? 1 : 0;
      // 匹配度相同时，浏览量高的优先
      if (bExact === aExact) {
        return (b.views || b.view_count || 0) - (a.views || a.view_count || 0);
      }
      return bExact - aExact;
    });
  }
  // 浏览热度模式：按浏览量从高到低
  return [...list].sort((a, b) => (b.views || b.view_count || 0) - (a.views || a.view_count || 0));
});

// 根据i18n locale显示中文或英文名称
function displayName(arch: any): string {
  const locale = localStorage.getItem('atca_locale') || 'zh';
  if (locale === 'zh' && arch.chinese_name) return arch.chinese_name;
  if (locale === 'zh' && arch.name) return arch.name;
  return arch.name || arch.chinese_name || '未命名';
}

async function loadArchitectures() {
  loading.value = true;
  const loadStartTime = Date.now();
  logger.debug('开始加载建筑列表', {
    page: currentPage.value,
    type: filterType.value || 'all',
    dynasty: filterDynasty.value || 'all',
    search: searchQuery.value || 'none',
  });
  try {
    const res = await architectureApi.list({
      page: currentPage.value,
      limit: 12,
      type: filterType.value || undefined,
      dynasty: filterDynasty.value || undefined,
      province: filterProvince.value || undefined,
      search: searchQuery.value || undefined,
    });
    if (res.success) {
      architectures.value = res.data;
      allArchitectures.value = res.data;
      totalPages.value = res.meta.totalPages;
      logger.debug('建筑列表加载成功', {
        count: res.data?.length || 0,
        totalPages: res.meta.totalPages,
      });
    }
  } catch (e) {
    logger.error('建筑列表加载失败', {
      error: e instanceof Error ? e.message : String(e),
    });
  } finally {
    loading.value = false;
    perfLogger.perf('建筑列表加载完成', {
      duration: Date.now() - loadStartTime,
      count: architectures.value.length,
    });
  }
}

async function toggleFavorite(arch: any) {
  const action = arch.is_favorited ? '取消收藏' : '收藏';
  logger.debug(`${action}建筑`, {
    architectureId: arch.architecture_id,
    name: arch.name,
  });
  try {
    if (arch.is_favorited) {
      await architectureApi.unfavorite(arch.architecture_id);
      arch.is_favorited = false;
    } else {
      await architectureApi.favorite(arch.architecture_id);
      arch.is_favorited = true;
    }
    logger.debug(`${action}成功`, {
      architectureId: arch.architecture_id,
    });
  } catch (e: any) {
    logger.error(`${action}失败`, {
      architectureId: arch.architecture_id,
      error: e.response?.data?.error?.message || e.message,
    });
    if (e.response?.status === 401) {
      alert('请先登录后再收藏');
    } else {
      alert('操作失败: ' + (e.response?.data?.error?.message || e.message));
    }
  }
}

const handleSearch = debounce(() => {
  currentPage.value = 1;
  loadArchitectures();
}, 300);

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
  });

  await loadArchitectures();
  const metaStartTime = Date.now();
  const [typesRes, dynRes] = await Promise.all([
    architectureApi.types(),
    architectureApi.dynasties(),
  ]);
  if (typesRes.success) types.value = typesRes.data;
  if (dynRes.success) dynasties.value = dynRes.data;
  perfLogger.perf('元数据加载完成', {
    duration: Date.now() - metaStartTime,
    typesCount: types.value.length,
    dynastiesCount: dynasties.value.length,
  });
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
});
</script>

<style scoped>
.page { 
  min-height: 100vh; 
  display: flex; 
  flex-direction: column; 
  position: relative;
  animation: archSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 建筑列表页动画 - 飞檐展开效果 */
@keyframes archSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px) translateY(10px);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0);
    filter: blur(0);
  }
}

.page-content { flex: 1; padding-top: 100px; padding-bottom: 48px; position: relative; z-index: 2; }

/* ===== 侧边栏布局 ===== */
.arch-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

/* 侧边栏 */
.arch-sidebar {
  width: 260px;
  flex-shrink: 0;
  position: sticky;
  top: 88px;
  align-self: flex-start;
}
.sidebar-inner {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 24px;
}
.sidebar-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}
.sidebar-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 24px;
  letter-spacing: 0.04em;
}
.sidebar-section {
  margin-bottom: 20px;
}
.sidebar-label {
  display: block;
  font-family: var(--font-serif);
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 8px;
  letter-spacing: 0.08em;
}
.sidebar-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-light);
  color: var(--text);
  font-size: 0.8125rem;
  transition: all var(--t);
  outline: none;
}
.sidebar-input:focus {
  border-color: var(--gold-dim);
  box-shadow: 0 0 0 2px rgba(var(--gold-rgb), 0.1);
}
.sidebar-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.filter-chip {
  padding: 4px 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-light);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all var(--t);
  letter-spacing: 0.04em;
}
.filter-chip:hover {
  border-color: var(--gold-dim);
  color: var(--gold);
}
.filter-chip.active {
  background: rgba(var(--gold-rgb), 0.12);
  border-color: var(--gold);
  color: var(--gold);
}
/* 排序栏 */
.sort-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  flex-wrap: wrap;
}
.sort-label { font-size: 0.8125rem; color: var(--text-muted); font-weight: 500; }
.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sort-btn:hover { border-color: var(--gold-dim); color: var(--text); }
.sort-btn.active { border-color: var(--gold); background: rgba(var(--gold-rgb), 0.1); color: var(--gold); font-weight: 600; }
.result-count { margin-left: auto; font-size: 0.75rem; color: var(--text-muted); }

.sidebar-stats {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.sidebar-stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.sidebar-stat-num {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gold);
}
.sidebar-stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 主内容区 */
.arch-main {
  flex: 1;
  min-width: 0;
}

/* 移动端标题(仅手机显示) */
.mobile-header { display: none; }
.mobile-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}
.mobile-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}
.mobile-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.mobile-select {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.8125rem;
}

/* 建筑卡片网格 */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.arch-skeleton { height: 280px; border-radius: var(--r-lg); }
.arch-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.arch-card {
  background: var(--bg-card);
  border-radius: var(--r-lg);
  border: 1px solid var(--border);
  overflow: hidden;
  text-decoration: none;
  transition: box-shadow var(--t), transform var(--t), border-color var(--t);
  position: relative;
}
.arch-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.4); transform: translateY(-4px); }
.arch-card.arch-favorited {
  border-color: rgba(201, 48, 44, 0.35);
  box-shadow: 0 0 0 1px rgba(201, 48, 44, 0.1);
}
.arch-card-link { text-decoration: none; color: inherit; display: block; }
.fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.6);
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--t);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.fav-btn:hover {
  background: rgba(0,0,0,0.8);
  transform: scale(1.1);
}
.fav-btn.fav-active { color: #c9302c; }
.fav-btn.fav-active svg { fill: #c9302c !important; }
.arch-image { position: relative; aspect-ratio: 16/10; overflow: hidden; }
.arch-image img { width: 100%; height: 100%; object-fit: cover; }
.arch-type {
  position: absolute; top: 12px; left: 12px;
  padding: 4px 10px; background: rgba(0,0,0,0.6); color: white;
  border-radius: var(--r-sm); font-size: 0.75rem;
}
.arch-info { padding: 16px; }
.arch-info h3 { font-size: 1rem; font-weight: 600; margin-bottom: 4px; color: var(--text); }
.arch-meta { font-size: 0.75rem; color: var(--gold); margin-bottom: 8px; }
.arch-desc { font-size: 0.875rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.empty-state { text-align: center; padding: 64px; color: var(--text-muted); }
.pagination { display: flex; gap: 8px; justify-content: center; margin-top: 32px; }
.page-btn {
  width: 36px; height: 36px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text);
  font-size: 0.875rem;
  transition: all var(--t);
}
.page-btn.active, .page-btn:hover {
  background: var(--gold);
  color: #1A1714;
  border-color: var(--gold);
}

/* ===== 响应式：平板 ===== */
@media (max-width: 1024px) {
  .arch-sidebar { width: 220px; }
  .arch-grid, .loading-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}

/* ===== 响应式：手机 (恢复原有布局) ===== */
@media (max-width: 768px) {
  .arch-layout { flex-direction: column; gap: 0; }
  .arch-sidebar { display: none; } /* 手机隐藏侧边栏 */
  .arch-main { width: 100%; }
  .mobile-header { display: block; margin-bottom: 16px; }
  .mobile-filters { display: flex; flex-direction: column; }
  .mobile-select { width: 100%; }
  .arch-grid, .loading-grid { grid-template-columns: 1fr; gap: 16px; }
  .page-content { padding-top: 88px; }
}

/* ===== 古建筑列表增强 ===== */
.architecture-page {
  background: var(--color-background);
}
.architecture-hero {
  background: var(--bg-card) !important;
  border-bottom: 1px solid var(--border);
  position: relative;
}
.architecture-hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-secondary), transparent);
}
.atca-arch-card {
  border: 1px solid var(--border) !important;
  position: relative;
  overflow: hidden;
  transition: all var(--t);
}
.atca-arch-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--c-red), var(--color-secondary), var(--c-red));
  opacity: 0;
  transition: opacity var(--t);
  z-index: 2;
}
.atca-arch-card:hover::before { opacity: 1; }
.atca-arch-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(44,30,10,0.12);
}
.architecture-card-image {
  overflow: hidden;
}
.architecture-card-image img {
  transition: transform var(--t);
}
.atca-arch-card:hover .architecture-card-image img {
  transform: scale(1.08);
}
.architecture-card-content h3 {
  font-family: 'Noto Serif SC','STSong',serif;
  letter-spacing: 0.06em;
}
.filter-section {
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
}
.filter-select, .filter-search input {
  font-family: 'Noto Serif SC','STSong',serif;
}
.pagination .page-btn {
  font-family: 'Noto Serif SC','STSong',serif;
  transition: all var(--t);
}
.pagination .page-btn.active {
  background: var(--c-red) !important;
  color: #fff !important;
  border-color: var(--c-red) !important;
}
</style>
