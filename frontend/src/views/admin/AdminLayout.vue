<template>
  <div class="admin-layout">
    <!-- Mobile Menu Overlay -->
    <div v-if="mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false"></div>
    
    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileMenuOpen }">
      <div class="sidebar-header">
        <router-link to="/home" class="brand-link">
          <span class="brand-icon">&#127983;</span>
          <span v-if="!sidebarCollapsed" class="brand-text">{{ $t('site.name') }}</span>
        </router-link>
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg v-if="sidebarCollapsed" viewBox="0 0 24 24" width="18" height="18"><path d="M9 5l7 7-7 7" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18"><path d="M15 19l-7-7 7-7" stroke="currentColor" fill="none" stroke-width="2"/></svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <!-- 入口页 -->
        <router-link to="/admin" class="nav-item" :class="{ active: route.path === '/admin' }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.dashboard.title') }}</span>
        </router-link>
        
        <!-- 核心业务模块 -->
        <router-link to="/admin/users" class="nav-item" :class="{ active: route.path.startsWith('/admin/users') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.users') }}</span>
        </router-link>
        <router-link to="/admin/architectures" class="nav-item" :class="{ active: route.path.startsWith('/admin/architectures') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.architectures') }}</span>
        </router-link>
        <router-link to="/admin/questions" class="nav-item" :class="{ active: route.path.startsWith('/admin/questions') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.questions') }}</span>
        </router-link>
        
        <!-- 数据管理模块 -->
        <router-link to="/admin/knowledge-graph" class="nav-item" :class="{ active: route.path.startsWith('/admin/knowledge-graph') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M13.5 20.5C13.5 21.88 12.38 23 11 23s-2.5-1.12-2.5-2.5c0-.69.28-1.32.74-1.76l-3.54-3.54c-.78.72-1.79 1.19-2.9 1.19C3.58 16 1 13.42 1 10c0-1.11.47-2.12 1.29-2.9L8.76 8.74c.44.46 1.07.74 1.74.74h.5c.28 0 .5-.22.5-.5V4.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5v8.75c0 .67.28 1.3.74 1.76l3.54-3.54c.82.78 1.29 1.79 1.29 2.9 0 3.42-2.58 6-6 6z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.knowledgeGraph.title') }}</span>
        </router-link>
        <router-link to="/admin/models" class="nav-item" :class="{ active: route.path.startsWith('/admin/models') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.models') }}</span>
        </router-link>
        
        <!-- AI配置模块 -->
        <router-link to="/admin/ai-configs" class="nav-item" :class="{ active: route.path.startsWith('/admin/ai-configs') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.aiConfigs') }}</span>
        </router-link>
        
        <!-- 运营管理模块 -->
        <router-link to="/admin/activities" class="nav-item" :class="{ active: route.path.startsWith('/admin/activities') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.activities') }}</span>
        </router-link>
        <router-link to="/admin/achievements" class="nav-item" :class="{ active: route.path.startsWith('/admin/achievements') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.achievements') }}</span>
        </router-link>
        <router-link to="/admin/community" class="nav-item" :class="{ active: route.path.startsWith('/admin/community') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.community') }}</span>
        </router-link>
        <router-link to="/admin/translation" class="nav-item" :class="{ active: route.path.startsWith('/admin/translation') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 4h6M6.412 9a18.022 18.022 0 01-3.828-4m3.828 4c.404 2.004 2.004 3.828 4 4m-4-4c-.404-2.004-2.004-3.828-4-4m4 4h6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.translation.title') }}</span>
        </router-link>
        
        <!-- 系统运维模块 -->
        <router-link to="/admin/monitor" class="nav-item" :class="{ active: route.path.startsWith('/admin/monitor') }">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          <span v-if="!sidebarCollapsed">{{ $t('admin.monitor') }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <router-link to="/home" class="back-link">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          {{ $t('admin.backToSite') }}
        </router-link>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
      <header class="admin-header">
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" fill="none" stroke-width="2"/></svg>
        </button>
        <h1>{{ pageTitle }}</h1>
        <div class="header-actions">
          <button class="lang-btn" @click="toggleLocale">{{ currentLocale === 'zh' ? 'EN' : '中' }}</button>
          <span class="admin-user">{{ userStore.user?.username || 'Admin' }}</span>
        </div>
      </header>
      <div class="admin-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { setupStorageCleanup } from '@/utils/storageCleanup';
import { useUserStore } from '@/stores';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('AdminLayout');
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { locale, t } = useI18n();

const sidebarCollapsed = ref(false);
const mobileMenuOpen = ref(false);
const currentLocale = computed(() => locale.value);

const pageTitle = computed(() => {
    const titles: Record<string, string> = {
      '/admin': t('admin.dashboard.title'),
      '/admin/users': t('admin.users'),
      '/admin/architectures': t('admin.architectures'),
      '/admin/questions': t('admin.questions'),
      '/admin/knowledge-graph': t('admin.knowledgeGraph.title'),
      '/admin/models': t('admin.models'),
      '/admin/ai-configs': t('admin.aiConfigs'),
      '/admin/activities': t('admin.activities'),
      '/admin/achievements': t('admin.achievements'),
      '/admin/community': t('admin.community'),
      '/admin/translation': t('admin.translation.title'),
      '/admin/monitor': t('admin.monitor'),
    };
    return titles[route.path] || t('admin.dashboard.title');
  });

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function toggleLocale() {
  const newLocale = locale.value === 'zh' ? 'en' : 'zh';
  locale.value = newLocale;
  localStorage.setItem('atca_locale', newLocale);
}

// 页面加载时初始化非认证数据自动清理
onMounted(() => { setupStorageCleanup(); });

// 监听路由变化，切换管理子页面时自动刷新数据
// 通过自定义事件通知子组件刷新
watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath && newPath.startsWith('/admin')) {
    window.dispatchEvent(new CustomEvent('admin-route-change', { detail: { path: newPath } }));
  }
});
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-surface-warm);
}

/* Sidebar */
.admin-sidebar {
  width: 240px;
  background: #1a1210;
  color: rgba(255,255,255,0.7);
  display: flex;
  flex-direction: column;
  transition: none;
  flex-shrink: 0;
}
.admin-sidebar.collapsed { width: 64px; }

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.brand-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  text-decoration: none;
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 600;
}
/* IE11 fallback for gap */
.brand-link > * + * { margin-left: 10px; }
.brand-icon { font-size: 1.25rem; }
.toggle-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.06);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}
.toggle-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

.sidebar-nav { flex: 1; padding: 12px 8px; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
  margin-bottom: 2px;
}
/* IE11 fallback for gap */
.nav-item > * + * { margin-left: 12px; }
.nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); }
.nav-item.active { background: rgba(139, 37, 0, 0.8); color: #fff; }

.sidebar-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.5);
  font-size: 0.8125rem;
  text-decoration: none;
  transition: color var(--transition-fast);
}
/* IE11 fallback for gap */
.back-link > * + * { margin-left: 8px; }
.back-link:hover { color: #fff; }

/* Main */
.admin-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.admin-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
/* IE11 fallback for gap */
.header-actions > * + * { margin-left: 16px; }
.lang-btn {
  padding: 4px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.lang-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.admin-user {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.mobile-menu-btn {
  display: none;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.mobile-menu-btn:hover { background: var(--color-surface-hover); }

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

.admin-content {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

/* ===== 响应式适配 ===== */

/* 平板端 */
@media screen and (max-width: 1024px) {
  .admin-sidebar {
    width: 200px;
  }
  .admin-sidebar.collapsed {
    width: 56px;
  }
  .sidebar-header {
    padding: 12px;
  }
  .brand-link {
    font-size: 0.9375rem;
  }
  .nav-item {
    padding: 8px 10px;
    font-size: 0.8125rem;
  }
  .admin-header {
    padding: 12px 24px;
  }
  .admin-header h1 {
    font-size: 1.125rem;
  }
  .admin-content {
    padding: 20px 24px;
  }
}

/* 移动端 */
@media screen and (max-width: 767px) {
  .admin-layout {
    flex-direction: column;
  }
  .admin-sidebar {
    width: 240px;
    height: 100vh;
    position: fixed;
    top: 0;
    left: -240px;
    right: auto;
    z-index: 100;
    flex-direction: column;
    padding: 0;
    background: #1a1210;
    border-bottom: none;
    transition: left var(--transition-normal);
  }
  .admin-sidebar.mobile-open {
    left: 0;
  }
  .admin-sidebar.collapsed {
    width: 64px;
    left: -64px;
  }
  .admin-sidebar.collapsed.mobile-open {
    left: 0;
  }
  .sidebar-header {
    padding: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .brand-link {
    font-size: 0.875rem;
  }
  .brand-icon {
    font-size: 1rem;
  }
  .sidebar-nav {
    display: flex;
    flex-direction: column;
  }
  .sidebar-footer {
    display: block;
  }
  .toggle-btn {
    display: flex;
  }
  .mobile-menu-btn {
    display: flex;
  }
  .mobile-overlay {
    display: block;
  }
  .admin-main {
    margin-top: 0;
  }
  .admin-header {
    padding: 10px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .admin-header h1 {
    font-size: 1rem;
    order: 1;
    flex: 1;
  }
  .header-actions {
    order: 2;
    gap: 8px;
  }
  .lang-btn {
    padding: 4px 8px;
    font-size: 0.6875rem;
  }
  .admin-user {
    font-size: 0.75rem;
  }
  .admin-content {
    padding: 16px;
  }
}

/* 小屏移动端 */
@media screen and (max-width: 359px) {
  .admin-sidebar {
    padding: 6px 10px;
  }
  .brand-link {
    font-size: 0.8125rem;
  }
  .admin-main {
    margin-top: 40px;
  }
  .admin-header {
    padding: 8px 12px;
  }
  .admin-header h1 {
    font-size: 0.9375rem;
  }
  .admin-content {
    padding: 12px;
  }
}

</style>
