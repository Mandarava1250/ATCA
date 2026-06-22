<template>
  <nav class="navbar" :class="{ scrolled: isScrolled, hidden: isHidden }">
    <div class="container navbar-inner">
      <!-- Logo -->
      <router-link to="/home" class="navbar-brand">
        <svg class="brand-icon" viewBox="0 0 40 40" fill="none">
          <path d="M20 4L4 16H10V32H16V22H24V32H30V16H36L20 4Z" fill="currentColor" opacity="0.9"/>
          <path d="M12 34H28V36H12V34Z" fill="currentColor" opacity="0.6"/>
        </svg>
        <div class="brand-text">
          <span class="brand-title">{{ $t('site.name') }}</span>
          <span class="brand-subtitle">{{ $t('site.subtitle') }}</span>
        </div>
      </router-link>

      <!-- Navigation Links (Desktop) -->
      <div class="navbar-links">
        <template v-for="item in navItems" :key="item.to">
          <router-link
            v-if="!item.authRequired || isLoggedIn"
            :to="item.to"
            class="nav-link"
            :class="{ active: route.path.startsWith(item.to) }"
          >
            <span>{{ item.label }}</span>
          </router-link>
          <a
            v-else
            href="javascript:void(0)"
            class="nav-link"
            @click="goToLogin(item.to)"
          >
            <span>{{ item.label }}</span>
          </a>
        </template>
      </div>

      <!-- Actions -->
      <div class="navbar-actions">
        <!-- Language Switcher -->
        <button class="lang-btn" @click="toggleLang" :title="$t('nav.switchLang')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12.87 15.07l-1.37-2.07-1.37 2.07-2.5-.9.9 2.5H6v2h3.5l-.9 2.5 2.5-.9 1.37 2.07 1.37-2.07 2.5.9-.9-2.5H18v-2h-3.5l.9-2.5-2.5.9zM21 4h-5v2h3.5l-4 10H17v2h-3v-2h1.5l4-10H17V4h4z" fill="currentColor"/>
          </svg>
          <span>{{ currentLang === 'zh' ? 'EN' : '中' }}</span>
        </button>

        <template v-if="userStore.isLoggedIn">
          <router-link to="/profile" class="nav-user">
            <img :src="avatarUrl" class="nav-avatar" alt="avatar" @error="handleAvatarError" />
            <span class="nav-username">{{ userStore.user?.nickname || userStore.user?.username }}</span>
          </router-link>
          <button class="nav-logout" @click="logout" :title="$t('nav.logout')">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke="currentColor" fill="none" stroke-width="1.5"/>
            </svg>
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-btn-login">{{ $t('nav.login') }}</router-link>
          <router-link to="/register" class="nav-btn-register">{{ $t('nav.register') }}</router-link>
        </template>

        <!-- Mobile Toggle -->
        <button class="navbar-toggle" @click="menuOpen = !menuOpen" aria-label="toggle menu">
          <span :class="{ open: menuOpen }"></span>
          <span :class="{ open: menuOpen }"></span>
          <span :class="{ open: menuOpen }"></span>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition name="slide-down">
      <div v-if="menuOpen" class="mobile-menu">
        <template v-for="item in navItems" :key="item.to">
          <router-link
            v-if="!item.authRequired || isLoggedIn"
            :to="item.to"
            class="mobile-link"
            :class="{ active: route.path.startsWith(item.to) }"
            @click="menuOpen = false"
          >
            {{ item.label }}
          </router-link>
          <a
            v-else
            href="javascript:void(0)"
            class="mobile-link"
            @click="menuOpen = false; goToLogin(item.to)"
          >
            {{ item.label }}
          </a>
        </template>
        <template v-if="userStore.isLoggedIn">
          <router-link to="/profile" class="mobile-link" @click="menuOpen = false">{{ $t('nav.profile') }}</router-link>
          <button class="mobile-link text-warn" @click="logout(); menuOpen = false">{{ $t('nav.logout') }}</button>
        </template>
        <template v-else>
          <router-link to="/login" class="mobile-link" @click="menuOpen = false">{{ $t('nav.login') }}</router-link>
          <router-link to="/register" class="mobile-link" @click="menuOpen = false">{{ $t('nav.register') }}</router-link>
        </template>
      </div>
    </transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores';
import { authApi } from '@/services/api';
import { useI18n } from 'vue-i18n';
import type { Locale } from 'vue-i18n';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const { locale, t } = useI18n();

const menuOpen = ref(false);
const isScrolled = ref(false);
const isHidden = ref(false);
let lastScrollY = 0;

const currentLang = computed(() => locale.value);

const isLoggedIn = computed(() => userStore.isLoggedIn);

// 头像URL处理（与 ViewProfile.vue 保持一致）
const avatarUrl = computed(() => {
  const avatar = userStore.user?.avatar;
  if (!avatar) return '/images/default-avatar.svg';

  // 如果是绝对URL或base64，直接返回
  if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;

  // 如果是/uploads/开头
  if (avatar.startsWith('/uploads/')) {
    // 在开发环境或后端直连模式下，使用API_BASE路径
    // 在生产环境通过Nginx代理时，使用相对路径
    const isProduction = import.meta.env.PROD;
    if (isProduction) {
      // 生产环境：假设Nginx正确代理了/uploads路径
      return avatar;
    } else {
      // 开发环境：拼接API基础路径
      const apiBase = '/api/v1'; // 保持与API_BASE一致
      // 去掉/api/v1部分，只保留完整路径
      const baseUrl = apiBase.replace(/\/api\/v1$/, '');
      return `${baseUrl}${avatar}`;
    }
  }

  // 其他情况返回默认头像
  return '/images/default-avatar.svg';
});

// 头像加载失败处理
function handleAvatarError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = '/images/default-avatar.svg';
}

const navItems = computed(() => {
  const items = [
    { to: '/architecture', label: t('nav.architectureHall'), authRequired: false },
    { to: '/quiz', label: t('nav.knowledgeQuiz'), authRequired: true },
    { to: '/workshop', label: t('nav.workshop3D'), authRequired: true },
    { to: '/community', label: t('nav.community'), authRequired: false },
  ];
  if (userStore.isAdmin) {
    items.push({ to: '/admin', label: t('nav.admin'), authRequired: true });
  }
  return items;
});

function goToLogin(redirectTo: string) {
  router.push({ path: '/login', query: { redirect: redirectTo } });
}

function onScroll() {
  const currentY = window.scrollY;
  isScrolled.value = currentY > 20;
  if (currentY > lastScrollY && currentY > 80) {
    isHidden.value = true;
  } else {
    isHidden.value = false;
  }
  lastScrollY = currentY;
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
});
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});

watch(() => route.path, () => {
  menuOpen.value = false;
  isHidden.value = false;
  lastScrollY = 0;
});

function toggleLang() {
  const newLang: Locale = locale.value === 'zh' ? 'en' : 'zh';
  locale.value = newLang;
  localStorage.setItem('atca_locale', newLang);
  const routeMeta = route.meta?.title as string;
  if (routeMeta) {
    document.title = `${routeMeta} - ${t('site.name')}`;
  }
}

async function logout() {
  try { await authApi.logout(); } catch {}
  userStore.logout();
  router.push('/home');
}
</script>

<style scoped>
/* ===== 镜片/Glassmorphism 导航栏 ===== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* 镜片效果：半透明背景 + 强毛玻璃模糊 */
  background: rgba(26, 23, 20, 0.92);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  /* 细微高光边框 */
  border-bottom: 1px solid rgba(201, 169, 110, 0.08);
  /* 内高光 + 外阴影 */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 4px 24px rgba(0, 0, 0, 0.25);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

/* 不支持backdrop-filter的浏览器降级 */
@supports not (backdrop-filter: blur(1px)) {
  .navbar {
    background: rgba(26, 23, 20, 0.98);
  }
  .mobile-menu {
    background: rgba(26, 23, 20, 0.99);
  }
}

/* 滚动后：镜片变实 */
.navbar.scrolled {
  background: rgba(26, 23, 20, 0.95);
  backdrop-filter: blur(32px) saturate(1.5);
  -webkit-backdrop-filter: blur(32px) saturate(1.5);
  border-bottom-color: rgba(201, 169, 110, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 6px 30px rgba(0, 0, 0, 0.35);
}

/* 隐藏 */
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
  /* 镜片容器 */
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border-radius: var(--r-md);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--r-sm);
  color: var(--text-muted);
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  position: relative;
  transition: all 0.25s ease;
  text-decoration: none;
}
.nav-link:hover {
  color: var(--gold);
  background: rgba(201, 169, 110, 0.08);
}

/* 激活状态：镜片高光 */
.nav-link.active {
  color: var(--gold);
  background: rgba(201, 169, 110, 0.1);
  border: 1px solid rgba(201, 169, 110, 0.15);
  backdrop-filter: blur(8px);
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

/* 镜片语言按钮 */
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

/* Hamburger */
.navbar-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 6px;
  border-radius: var(--r-sm);
  background: transparent;
  border: none;
  cursor: pointer;
}
.navbar-toggle span {
  display: block;
  width: 22px;
  height: 1.5px;
  background: var(--text);
  border-radius: 1px;
  transition: all var(--t);
}
.navbar-toggle span:nth-child(1).open { transform: rotate(45deg) translate(4.5px, 4.5px); }
.navbar-toggle span:nth-child(2).open { opacity: 0; }
.navbar-toggle span:nth-child(3).open { transform: rotate(-45deg) translate(4.5px, -4.5px); }

/* ===== 镜片移动端菜单 ===== */
.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(26, 23, 20, 0.82);
  backdrop-filter: blur(32px) saturate(1.4);
  -webkit-backdrop-filter: blur(32px) saturate(1.4);
  border-bottom: 1px solid rgba(201, 169, 110, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
}
.mobile-link {
  padding: 12px 16px;
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 0.9375rem;
  color: var(--text);
  letter-spacing: 0.08em;
  border-radius: var(--r-sm);
  transition: all var(--t);
  text-align: left;
  text-decoration: none;
  border: none;
  background: transparent;
  cursor: pointer;
}
.mobile-link:hover {
  background: rgba(201, 169, 110, 0.08);
  color: var(--gold);
}
.mobile-link.active {
  color: var(--gold);
  background: rgba(201, 169, 110, 0.06);
}
.mobile-link.text-warn { color: #C75C3A; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* 平板端 768px-899px */
@media (min-width: 768px) and (max-width: 900px) {
  .navbar-inner {
    padding: 0 16px;
  }
  .brand-icon {
    width: 28px;
    height: 28px;
  }
  .brand-title {
    font-size: 1rem;
  }
}

/* 小平板/大手机 600px-767px */
@media (max-width: 767px) {
  .navbar-inner {
    height: 60px;
    padding: 0 12px;
  }
  .brand-icon {
    width: 28px;
    height: 28px;
  }
  .brand-title {
    font-size: 0.9375rem;
  }
  .lang-btn {
    padding: 6px 8px;
  }
  .lang-btn span {
    display: none;
  }
  .nav-user {
    padding: 4px 8px 4px 4px;
  }
}

/* 手机端 480px-599px */
@media (max-width: 599px) {
  .navbar-actions {
    gap: 4px;
  }
  .nav-username {
    display: none;
  }
  .nav-btn-login,
  .nav-btn-register {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
}

/* 小手机 320px-479px */
@media (max-width: 479px) {
  .navbar-inner {
    height: 56px;
    padding: 0 8px;
  }
  .brand-icon {
    width: 26px;
    height: 26px;
  }
  .brand-title {
    font-size: 0.875rem;
    letter-spacing: 0.1em;
  }
  .navbar-actions {
    gap: 2px;
  }
  .lang-btn {
    padding: 6px;
  }
  .lang-btn svg {
    width: 14px;
    height: 14px;
  }
  .nav-btn-login,
  .nav-btn-register {
    padding: 5px 8px;
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
  }
  .nav-user {
    padding: 4px;
  }
  .nav-avatar {
    width: 24px;
    height: 24px;
  }
  .nav-logout {
    padding: 6px;
  }
  .navbar-toggle {
    padding: 4px;
  }
  .navbar-toggle span {
    width: 20px;
    height: 1.5px;
  }
  .mobile-menu {
    padding: 8px 12px;
  }
  .mobile-link {
    padding: 10px 12px;
    font-size: 0.875rem;
  }
}

/* 超小手机 320px以下 */
@media (max-width: 359px) {
  .navbar-inner {
    height: 52px;
    padding: 0 6px;
  }
  .brand-icon {
    width: 24px;
    height: 24px;
  }
  .brand-title {
    font-size: 0.8125rem;
  }
  .nav-btn-login,
  .nav-btn-register {
    padding: 4px 6px;
    font-size: 0.625rem;
  }
  .navbar-toggle span {
    width: 18px;
  }
}

/* 移动端菜单，确保在所有情况下都正确显示 */
@media (max-width: 900px) {
  .navbar {
    /* 确保navbar有正确的定位上下文 */
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  .navbar-links {
    display: none;
  }

  .navbar-toggle {
    display: flex;
  }

  .brand-subtitle {
    display: none;
  }

  /* 移动菜单需要正确的z-index */
  .mobile-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 99;
    max-height: 80vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

/* 确保移动端滚动流畅 */
@media (max-width: 900px) {
  body {
    -webkit-overflow-scrolling: touch;
  }
}
</style>
