<template>
  <nav 
    class="navbar" 
    :class="{ scrolled: isScrolled, hidden: isHidden }"
  >
    <div class="container navbar-inner">
      <!-- Logo -->
      <router-link 
        to="/home" 
        class="navbar-brand"
        @click.stop
        :aria-label="$t('nav.home')"
      >
        <svg class="brand-icon" viewBox="0 0 40 40" fill="none">
          <path d="M20 4L4 16H10V32H16V22H24V32H30V16H36L20 4Z" fill="currentColor" opacity="0.9"/>
          <path d="M12 34H28V36H12V34Z" fill="currentColor" opacity="0.6"/>
        </svg>
        <div class="brand-text">
          <span class="brand-title">{{ siteName }}</span>
          <span class="brand-subtitle">{{ siteSubtitle }}</span>
        </div>
      </router-link>

      <!-- Navigation Links (Desktop) -->
      <div class="navbar-links">
        <template v-for="item in navItems" :key="item.to">
          <router-link
            :to="item.to"
            class="nav-link text-truncate"
            :class="{ active: route.path.startsWith(item.to) }"
            @click.stop
            :aria-current="route.path.startsWith(item.to) ? 'page' : undefined"
          >
            <span class="text-truncate">{{ item.label }}</span>
          </router-link>
        </template>
      </div>

      <!-- Actions -->
      <div class="navbar-actions">
        <!-- Language Switcher -->
        <button 
          class="lang-btn" 
          @click.stop="toggleLang" 
          :title="switchLangText"
          :aria-label="switchLangText"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12.87 15.07l-1.37-2.07-1.37 2.07-2.5-.9.9 2.5H6v2h3.5l-.9 2.5 2.5-.9 1.37 2.07 1.37-2.07 2.5.9-.9-2.5H18v-2h-3.5l.9-2.5-2.5.9zM21 4h-5v2h3.5l-4 10H17v2h-3v-2h1.5l4-10H17V4h4z" fill="currentColor"/>
          </svg>
          <span>{{ currentLang === 'zh' ? 'EN' : '中' }}</span>
        </button>

        <template v-if="isLoggedIn">
          <router-link 
            to="/profile" 
            class="nav-user"
            @click.stop
            :aria-label="$t('nav.userCenter')"
          >
            <img :src="avatarUrl" class="nav-avatar" alt="avatar" @error="handleAvatarError" />
            <span class="nav-username text-truncate">{{ nickname }}</span>
          </router-link>
          <router-link
            v-if="isAdmin"
            to="/admin"
            class="nav-admin"
            @click.stop
            :aria-label="$t('nav.adminPanel')"
            :title="$t('nav.adminPanel')"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill="currentColor"/>
            </svg>
            <span>{{ $t('nav.admin') }}</span>
          </router-link>
          <button 
            class="nav-logout" 
            @click.stop="logout" 
            :title="logoutText"
            :aria-label="logoutText"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" fill="none" stroke-width="1.5"/>
            </svg>
          </button>
        </template>
        <template v-else>
          <router-link 
            to="/login" 
            class="nav-btn-login"
            @click.stop
          >{{ loginText }}</router-link>
          <router-link 
            to="/register" 
            class="nav-btn-register"
            @click.stop
          >{{ registerText }}</router-link>
        </template>
      </div>

      <!-- Mobile Menu Toggle Button -->
      <button 
        class="mobile-menu-toggle"
        @click.stop="toggleMobileMenu"
        :aria-expanded="isMobileMenuOpen"
        :aria-label="isMobileMenuOpen ? $t('nav.closeMenu') : $t('nav.openMenu')"
      >
        <span class="hamburger" :class="{ active: isMobileMenuOpen }">
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </span>
      </button>
    </div>

    <!-- Mobile Navigation Menu -->
    <MobileNavMenu
      v-model="isMobileMenuOpen"
      :title="menuTitle"
      animation-type="slide"
      position="right"
      :animation-config="{ duration: 350, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }"
      :show-toggle-button="false"
      :enable-touch-close="true"
      :enable-click-outside-close="true"
      :responsive="true"
      :responsive-breakpoint="768"
      :nav-items="mobileNavItems"
      :open-label="$t('nav.openMenu')"
      :close-label="$t('nav.closeMenu')"
      @open="handleMobileMenuOpen"
      @close="handleMobileMenuClose"
      @nav-item-click="handleMobileNavItemClick"
    >
      <!-- 自定义底部内容 -->
      <template #footer>
        <div class="navbar-mobile-footer">
          <button 
            class="mobile-lang-btn"
            @click.stop="toggleLang"
            :aria-label="switchLangText"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12.87 15.07l-1.37-2.07-1.37 2.07-2.5-.9.9 2.5H6v2h3.5l-.9 2.5 2.5-.9 1.37 2.07 1.37-2.07 2.5.9-.9-2.5H18v-2h-3.5l.9-2.5-2.5.9zM21 4h-5v2h3.5l-4 10H17v2h-3v-2h1.5l4-10H17V4h4z" fill="currentColor"/>
            </svg>
            <span>{{ currentLang === 'zh' ? 'English' : '中文' }}</span>
          </button>

          <template v-if="isLoggedIn">
            <router-link 
              to="/profile" 
              class="mobile-user-link"
              @click.stop="closeMobileMenu"
              :aria-label="$t('nav.userCenter')"
            >
              <img :src="avatarUrl" class="mobile-avatar" alt="avatar" @error="handleAvatarError" />
              <span class="mobile-username">{{ nickname }}</span>
            </router-link>
            <router-link
              v-if="isAdmin"
              to="/admin"
              class="mobile-admin-link"
              @click.stop="closeMobileMenu"
              :aria-label="$t('nav.adminPanel')"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" fill="currentColor"/>
              </svg>
              <span>{{ $t('nav.adminPanel') }}</span>
            </router-link>
            <button 
              class="mobile-logout-btn"
              @click.stop="logout"
              :aria-label="logoutText"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" fill="none" stroke-width="1.5"/>
              </svg>
              <span>{{ logoutText }}</span>
            </button>
          </template>
          <template v-else>
            <router-link 
              to="/login" 
              class="mobile-btn-login"
              @click.stop="closeMobileMenu"
            >{{ loginText }}</router-link>
            <router-link 
              to="/register" 
              class="mobile-btn-register"
              @click.stop="closeMobileMenu"
            >{{ registerText }}</router-link>
          </template>
        </div>
      </template>
    </MobileNavMenu>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores';
import { authApi } from '@/services/api';
import { useI18n } from 'vue-i18n';
import type { Locale } from 'vue-i18n';
import MobileNavMenu from './MobileNavMenu.vue';
import type { NavItem } from './MobileNavMenu.vue';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const { locale, t } = useI18n();

// ================ 状态管理 ================

const isScrolled = ref(false);
const isHidden = ref(false);
const isMobileMenuOpen = ref(false);
let lastScrollY = 0;

// ================ 导航项配置 ================

const navItems = [
  { to: '/architecture', label: computed(() => t('nav.architectureHall')) },
  { to: '/quiz', label: computed(() => t('nav.knowledgeQuiz')) },
  { to: '/workshop', label: computed(() => t('nav.workshop3D')) },
  { to: '/community', label: computed(() => t('nav.community')) },
];

const mobileNavItems = computed<NavItem[]>(() => [
  { key: 'home', label: t('nav.home'), href: '/home', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { key: 'architecture', label: t('nav.architectureHall'), href: '/architecture', icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', active: route.path.startsWith('/architecture') },
  { key: 'quiz', label: t('nav.knowledgeQuiz'), href: '/quiz', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z', active: route.path.startsWith('/quiz') },
  { key: 'workshop', label: t('nav.workshop3D'), href: '/workshop', icon: 'M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm6 2l1.5 3L13 4h3l-2 3.5L17 10h-3l-1.5-3L11 10H8l2-3.5L6 4h3z', active: route.path.startsWith('/workshop') },
  { key: 'community', label: t('nav.community'), href: '/community', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z', active: route.path.startsWith('/community') },
]);

// ================ 国际化文本 ================

const currentLang = computed(() => locale.value);

const siteName = computed(() => {
  try { return t('site.name') || '华夏营造'; } 
  catch { return '华夏营造'; }
});

const siteSubtitle = computed(() => {
  try { return t('site.subtitle') || '中国古代建筑文化虚拟展览馆'; } 
  catch { return '中国古代建筑文化虚拟展览馆'; }
});

const menuTitle = computed(() => {
  try { return t('nav.menu') || '导航菜单'; } 
  catch { return '导航菜单'; }
});

const loginText = computed(() => {
  try { return t('nav.login') || '登录'; } 
  catch { return '登录'; }
});

const registerText = computed(() => {
  try { return t('nav.register') || '注册'; } 
  catch { return '注册'; }
});

const logoutText = computed(() => {
  try { return t('nav.logout') || '退出'; } 
  catch { return '退出'; }
});

const switchLangText = computed(() => {
  try { return t('nav.switchLang') || '切换语言'; } 
  catch { return '切换语言'; }
});

// ================ 用户状态 ================

const isLoggedIn = computed(() => {
  try { return userStore?.isLoggedIn ?? false; } 
  catch { return false; }
});

const isAdmin = computed(() => {
  try { return userStore?.isAdmin ?? false; }
  catch { return false; }
});

const nickname = computed(() => {
  try { return userStore?.user?.nickname || userStore?.user?.username || ''; } 
  catch { return ''; }
});

const avatarUrl = computed(() => {
  try {
    const avatar = userStore?.user?.avatar;
    if (!avatar) return '/images/default-avatar.svg';
    if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;
    if (avatar.startsWith('/uploads/')) {
      return import.meta.env.PROD ? avatar : `${'/api/v1'.replace(/\/api\/v1$/, '')}${avatar}`;
    }
    return '/images/default-avatar.svg';
  } catch {
    return '/images/default-avatar.svg';
  }
});

// ================ 方法 ================

function handleAvatarError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = '/images/default-avatar.svg';
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

function handleMobileMenuOpen() {
  // 菜单打开时的额外处理
}

function handleMobileMenuClose() {
  // 菜单关闭时的额外处理
}

function handleMobileNavItemClick(item: NavItem) {
  closeMobileMenu();
  if (item.href) {
    router.push(item.href);
  }
}

function onScroll() {
  const currentY = window.scrollY;
  isScrolled.value = currentY > 20;
  isHidden.value = currentY > lastScrollY && currentY > 80;
  lastScrollY = currentY;
}

function onResize() {
  if (window.innerWidth >= 768) {
    closeMobileMenu();
  }
}

function toggleLang() {
  const newLang: Locale = locale.value === 'zh' ? 'en' : 'zh';
  locale.value = newLang;
  localStorage.setItem('atca_locale', newLang);
  const routeMeta = route.meta?.title as string;
  if (routeMeta) {
    document.title = `${routeMeta} - ${siteName.value}`;
  }
}

async function logout() {
  try { await authApi.logout(); } catch {}
  userStore.logout();
  closeMobileMenu();
  router.push('/home');
}

// ================ 生命周期 ================

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);
});

watch(() => route.path, () => {
  isHidden.value = false;
  lastScrollY = 0;
  closeMobileMenu();
});
</script>

<style scoped>
/* ===== 镜片/Glassmorphism 导航栏 ===== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 90;
  background: rgba(26, 23, 20, 0.92);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border-bottom: 1px solid rgba(201, 169, 110, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 4px 24px rgba(0, 0, 0, 0.25);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
  min-height: 68px;
  display: block;
}

@supports not (backdrop-filter: blur(1px)) {
  .navbar {
    background: rgba(26, 23, 20, 0.98);
  }
}

.navbar.scrolled {
  background: rgba(26, 23, 20, 0.95);
  backdrop-filter: blur(32px) saturate(1.5);
  -webkit-backdrop-filter: blur(32px) saturate(1.5);
  border-bottom-color: rgba(201, 169, 110, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 6px 30px rgba(0, 0, 0, 0.35);
}

.navbar.hidden {
  transform: translateY(-100%);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
}

/* Brand */
.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--gold);
  transition: opacity var(--t);
}
.navbar-brand:hover { opacity: 0.85; }
.brand-icon {
  width: 32px;
  height: 32px;
  color: var(--gold);
  flex-shrink: 0;
}
.brand-title {
  display: block;
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  line-height: 1.2;
  color: var(--gold);
}
.brand-subtitle {
  display: block;
  font-size: 0.625rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  line-height: 1.3;
}

/* ===== 镜片导航链接 ===== */
.navbar-links {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: var(--r-md);
  border: 1px solid rgba(255, 255, 255, 0.04);
  min-height: 40px;
}

.nav-link {
  display: flex !important;
  align-items: center !important;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--r-sm);
  color: var(--text-muted) !important;
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  position: relative;
  transition: all 0.25s ease;
  text-decoration: none !important;
  min-height: 28px;
}
.nav-link:hover {
  color: var(--gold) !important;
  background: rgba(201, 169, 110, 0.08);
}

.nav-link.active {
  color: var(--gold) !important;
  background: rgba(201, 169, 110, 0.1);
  border: 1px solid rgba(201, 169, 110, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px rgba(201, 169, 110, 0.1);
}

/* Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: var(--r-sm);
  color: var(--text-muted);
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
  transition: all var(--t);
  cursor: pointer;
}
.lang-btn:hover {
  color: var(--gold);
  border-color: rgba(201, 169, 110, 0.25);
  background: rgba(201, 169, 110, 0.06);
}

/* User */
.nav-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
  text-decoration: none;
  transition: all var(--t);
}
.nav-user:hover {
  background: rgba(201, 169, 110, 0.08);
  border-color: rgba(201, 169, 110, 0.15);
}
.nav-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(201, 169, 110, 0.2);
}
.nav-username {
  font-size: 0.8125rem;
  color: var(--text);
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-admin {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  color: var(--gold);
  background: rgba(201, 169, 110, 0.12);
  border: 1px solid rgba(201, 169, 110, 0.25);
  border-radius: var(--r-sm);
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: all var(--t);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px rgba(201, 169, 110, 0.15);
}
.nav-admin:hover {
  background: rgba(201, 169, 110, 0.18);
  border-color: rgba(201, 169, 110, 0.35);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 3px 12px rgba(201, 169, 110, 0.22);
}

.nav-logout {
  padding: 8px;
  color: var(--text-muted);
  border-radius: var(--r-sm);
  transition: all var(--t);
  background: transparent;
  border: none;
  cursor: pointer;
}
.nav-logout:hover { color: var(--gold); background: rgba(201, 169, 110, 0.08); }

/* 镜片登录按钮 */
.nav-btn-login {
  padding: 7px 16px;
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--text);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  border-radius: var(--r-sm);
  transition: all var(--t);
  text-decoration: none;
}
.nav-btn-login:hover {
  border-color: rgba(201, 169, 110, 0.25);
  color: var(--gold);
  background: rgba(201, 169, 110, 0.06);
}

/* 金色注册按钮 */
.nav-btn-register {
  padding: 7px 16px;
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: #1A1714;
  background: var(--gold);
  border: 1px solid var(--gold);
  border-radius: var(--r-sm);
  transition: all var(--t);
  text-decoration: none;
}
.nav-btn-register:hover {
  background: var(--gold-light);
  border-color: var(--gold-light);
}

/* ===== 移动端样式 ===== */

/* 汉堡菜单按钮 */
.mobile-menu-toggle {
  display: none;
  position: relative;
  width: 44px;
  height: 44px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: all var(--t);
  z-index: 110;
}

.mobile-menu-toggle:hover {
  background: rgba(201, 169, 110, 0.1);
  border-color: rgba(201, 169, 110, 0.2);
}

.mobile-menu-toggle:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(201, 169, 110, 0.2);
}

/* 汉堡图标 */
.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hamburger-line {
  width: 22px;
  height: 2px;
  background: var(--gold);
  border-radius: 1px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center;
}

.hamburger.active .hamburger-line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger.active .hamburger-line:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger.active .hamburger-line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ===== 移动端底部操作区样式 ===== */
.navbar-mobile-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-lang-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--r-sm);
  font-size: 0.875rem;
  font-family: var(--font-serif);
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all var(--t);
}

.mobile-lang-btn:hover {
  color: var(--gold);
  background: rgba(201, 169, 110, 0.08);
  border-color: rgba(201, 169, 110, 0.2);
}

.mobile-user-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: var(--text);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--r-sm);
  text-decoration: none;
  transition: all var(--t);
}

.mobile-user-link:hover {
  background: rgba(201, 169, 110, 0.08);
  border-color: rgba(201, 169, 110, 0.2);
}

.mobile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(201, 169, 110, 0.2);
}

.mobile-username {
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-admin-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: var(--gold);
  background: rgba(201, 169, 110, 0.12);
  border: 1px solid rgba(201, 169, 110, 0.25);
  border-radius: var(--r-sm);
  font-size: 0.875rem;
  font-family: var(--font-serif);
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: all var(--t);
}

.mobile-admin-link:hover {
  background: rgba(201, 169, 110, 0.18);
  border-color: rgba(201, 169, 110, 0.35);
}

.mobile-logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: #C27B7B;
  background: rgba(139, 58, 58, 0.1);
  border: 1px solid rgba(139, 58, 58, 0.2);
  border-radius: var(--r-sm);
  font-size: 0.875rem;
  font-family: var(--font-serif);
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all var(--t);
}

.mobile-logout-btn:hover {
  background: rgba(139, 58, 58, 0.18);
  border-color: rgba(139, 58, 58, 0.3);
}

.mobile-btn-login {
  padding: 12px;
  text-align: center;
  color: var(--text);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--r-sm);
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: all var(--t);
}

.mobile-btn-login:hover {
  color: var(--gold);
  background: rgba(201, 169, 110, 0.08);
  border-color: rgba(201, 169, 110, 0.25);
}

.mobile-btn-register {
  padding: 12px;
  text-align: center;
  color: #1A1714;
  background: var(--gold);
  border: 1px solid var(--gold);
  border-radius: var(--r-sm);
  font-family: var(--font-serif);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: all var(--t);
}

.mobile-btn-register:hover {
  background: var(--gold-light);
  border-color: var(--gold-light);
}

/* ===== 响应式断点 ===== */

@media screen and (max-width: 1024px) {
  .navbar-inner { height: 60px; }
  .brand-icon { width: 28px; height: 28px; }
  .brand-title { font-size: 1rem; }
  .brand-subtitle { font-size: 0.5625rem; }
  .navbar-links { gap: 2px; padding: 3px; }
  .nav-link { padding: 6px 12px; font-size: 0.75rem; }
  .navbar-actions { gap: 6px; }
  .lang-btn { padding: 5px 8px; font-size: 0.6875rem; }
  .nav-avatar { width: 24px; height: 24px; }
  .nav-username { font-size: 0.75rem; max-width: 60px; }
  .nav-btn-login, .nav-btn-register { padding: 5px 12px; font-size: 0.75rem; }
}

@media screen and (max-width: 767px) {
  .navbar-inner { height: 56px; }
  .navbar-links { display: none; }
  .navbar-actions { display: none; }
  .mobile-menu-toggle { display: flex; align-items: center; justify-content: center; }
  .brand-icon { width: 26px; height: 26px; }
  .brand-title { font-size: 0.9375rem; letter-spacing: 0.1em; }
  .brand-subtitle { display: none; }
  .navbar { padding: 0 16px; }
}

@media screen and (max-width: 359px) {
  .navbar { padding: 0 12px; }
}
</style>