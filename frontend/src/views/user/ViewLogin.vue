<template>
  <div class="auth-page">
    <!-- 背景 -->
    <div class="auth-bg"></div>
    <div class="auth-bg-overlay"></div>

    <!-- 浮动粒子 -->
    <div class="auth-particles">
      <div v-for="i in 15" :key="i" class="a-particle" :style="pStyle(i)"></div>
    </div>

    <!-- 中央卡片 -->
    <div class="auth-center">
      <!-- Logo -->
      <router-link to="/home" class="auth-logo-link">
        <svg class="auth-logo" viewBox="0 0 120 120" fill="none">
          <path d="M60 8L12 40H28V88H52V56H68V88H92V40H108L60 8Z" fill="none" stroke="#C9A96E" stroke-width="2" opacity="0.9"/>
          <path d="M60 8L12 40H28V88H52V56H68V88H92V40H108L60 8Z" fill="#C9A96E" opacity="0.08"/>
          <path d="M36 96H84V100H36V96Z" fill="#C9A96E" opacity="0.4"/>
          <path d="M20 40Q60 20 100 40" stroke="#C9A96E" stroke-width="1.5" fill="none" opacity="0.5"/>
          <path d="M60 8V4" stroke="#C9A96E" stroke-width="1.5" opacity="0.6"/>
          <circle cx="60" cy="4" r="2" fill="#C9A96E" opacity="0.5"/>
        </svg>
        <span class="auth-brand">{{ $t('site.name') }}</span>
      </router-link>

      <!-- 卡片 -->
      <div class="auth-card">
        <h2 class="auth-title">{{ $t('login.welcome') }}</h2>
        <p class="auth-subtitle">{{ $t('login.subtitle') }}</p>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label>{{ $t('login.username') }}</label>
            <input
              v-model="form.username"
              type="text"
              class="auth-input"
              :placeholder="$t('login.usernamePlaceholder')"
              required
            />
          </div>

          <div class="form-group">
            <label>{{ $t('login.password') }}</label>
            <input
              v-model="form.password"
              type="password"
              class="auth-input"
              :placeholder="$t('login.passwordPlaceholder')"
              required
            />
          </div>

          <div class="form-options">
            <label class="remember">
              <input v-model="form.remember" type="checkbox" />
              <span>{{ $t('login.remember') }}</span>
            </label>
          </div>

          <div v-if="error" class="auth-error">{{ error }}</div>

          <button type="submit" class="auth-btn" :disabled="loading">
            <span v-if="loading" class="btn-spinner"></span>
            <span v-else>{{ $t('login.submit') }}</span>
          </button>
        </form>

        <!-- 分隔线 -->
        <div class="auth-or">
          <span></span>
          <em>{{ $t('login.noAccount') }}</em>
          <span></span>
        </div>

        <router-link to="/register" class="auth-link-btn">
          {{ $t('login.createAccount') }}
        </router-link>

        <router-link to="/home" class="auth-back-link">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" fill="none" stroke-width="1.5"/>
          </svg>
          {{ $t('login.backHome') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { authApi } from '@/services/api';
import { useUserStore } from '@/stores';
import { handleError } from '@/utils/errorHandler';
import { preventDoubleClick } from '@/utils/performance';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const { t } = useI18n();
const loading = ref(false);
const error = ref('');

// 挂载时清除过期 Token，避免干扰登录流程
onMounted(() => {
  const accessToken = localStorage.getItem('atca_access_token');
  if (accessToken) {
    try {
      // 简单解码 JWT 检查是否过期（不依赖第三方库）
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token 已过期，清除存储
        localStorage.removeItem('atca_access_token');
        localStorage.removeItem('atca_refresh_token');
        localStorage.removeItem('atca_user');
      }
    } catch {
      // Token 格式异常，清除存储
      localStorage.removeItem('atca_access_token');
      localStorage.removeItem('atca_refresh_token');
      localStorage.removeItem('atca_user');
    }
  }
});

const form = reactive({
  username: '',
  password: '',
  remember: false,
});

function pStyle(i: number) {
  return {
    width: (Math.random() * 2 + 1) + 'px',
    height: (Math.random() * 2 + 1) + 'px',
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    animationDuration: (Math.random() * 3 + 3) + 's',
    animationDelay: (Math.random() * 4) + 's',
  };
}

const handleLogin = preventDoubleClick(async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await authApi.login({
      username: form.username,
      password: form.password,
    });
    const result = res.data;
    const access = result?.tokens?.accessToken;
    const refresh = result?.tokens?.refreshToken;
    const user = result?.user;
    if (!access) throw new Error('服务器返回数据格式错误');
    userStore.setTokens({ accessToken: access, refreshToken: refresh, expiresIn: 86400 });
    userStore.setUser(user);
    const redirect = (route.query.redirect as string) || '/home';
    router.push(redirect);
  } catch (e: any) {
    // 增强错误提示：区分不同 HTTP 状态码
    if (e?.response) {
      const status = e.response.status;
      const backendMsg = e.response?.data?.error?.message;
      if (backendMsg) {
        error.value = backendMsg;
      } else if (status === 401) {
        error.value = t('errors.unauthorized');
      } else if (status === 423) {
        error.value = '账户已被锁定，请稍后重试';
      } else if (status === 429) {
        error.value = '请求过于频繁，请稍后重试';
      } else {
        handleError(e, error, t);
      }
    } else if (e?.message?.includes('Network Error')) {
      error.value = '网络连接失败，请检查网络';
    } else {
      handleError(e, error, t);
    }
  } finally {
    loading.value = false;
  }
}, 2000);
</script>

<style scoped>
.auth-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  animation: authScrollIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes authScrollIn {
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

/* 背景 */
.auth-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('/images/arch-detail.jpg');
  background-size: cover;
  background-position: center;
  transform: scale(1.05);
}
.auth-bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: linear-gradient(135deg, rgba(15,12,8,0.95) 0%, rgba(26,23,20,0.92) 50%, rgba(15,12,8,0.95) 100%);
}

/* 粒子 */
.auth-particles {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.a-particle {
  position: absolute;
  border-radius: 50%;
  background: var(--gold);
  opacity: 0;
  animation-name: aFloat infinite ease-in-out;
}
@keyframes aFloat {
  0%, 100% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 0.4; transform: scale(1); }
}

/* 中央区域 */
.auth-center {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Logo */
.auth-logo-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  text-decoration: none;
}
.auth-logo {
  width: 56px;
  height: 56px;
  animation: logoGlow 3s ease-in-out infinite;
}
@keyframes logoGlow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(201,169,110,0.3)); }
  50% { filter: drop-shadow(0 0 18px rgba(201,169,110,0.6)); }
}
.auth-brand {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.2em;
}

/* 卡片 */
.auth-card {
  width: 100%;
  padding: 36px 32px;
  background: rgba(30, 26, 22, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(201, 169, 110, 0.12);
  border-radius: var(--r-lg);
  box-shadow: 0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,169,110,0.06);
}
.auth-title {
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.auth-subtitle {
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 28px;
}

/* 表单 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  letter-spacing: 0.06em;
}
.auth-input {
  width: 100%;
  padding: 11px 14px;
  background: rgba(36, 32, 28, 0.7);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text);
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s ease;
}
.auth-input:focus {
  border-color: var(--gold-dim);
  box-shadow: 0 0 0 3px rgba(201, 169, 110, 0.08);
}
.auth-input::placeholder {
  color: var(--text-dim);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
}
.remember {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  cursor: pointer;
}
.remember input { accent-color: var(--gold); }

.auth-error {
  color: #E57373;
  font-size: 0.8125rem;
  text-align: center;
  padding: 8px;
  background: rgba(139, 37, 0, 0.1);
  border-radius: var(--r-sm);
}

/* 登录按钮 */
.auth-btn {
  width: 100%;
  padding: 12px;
  background: var(--gold);
  color: #1A1714;
  border: none;
  border-radius: var(--r-md);
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}
.auth-btn:hover:not(:disabled) {
  background: var(--gold-light);
  box-shadow: 0 4px 16px rgba(201,169,110,0.25);
}
.auth-btn:disabled { opacity: 0.7; cursor: wait; }
.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(26,23,20,0.3);
  border-top-color: #1A1714;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 分隔 */
.auth-or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}
.auth-or span {
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* 注册链接 */
.auth-link-btn {
  display: block;
  width: 100%;
  padding: 11px;
  text-align: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text-muted);
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}
.auth-link-btn:hover {
  border-color: var(--gold-dim);
  color: var(--gold);
  background: rgba(201,169,110,0.04);
}

/* 返回首页 */
.auth-back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s ease;
}
.auth-back-link:hover { color: var(--gold); }

/* ===== 响应式适配 ===== */

/* 平板端 */
@media screen and (max-width: 1024px) {
  .auth-center {
    max-width: 380px;
    padding: 16px;
  }
  .auth-card {
    padding: 32px 28px;
  }
  .auth-logo {
    width: 48px;
    height: 48px;
  }
  .auth-brand {
    font-size: 1rem;
  }
}

/* 移动端 */
@media screen and (max-width: 767px) {
  .auth-page {
    padding: 16px;
  }
  .auth-center {
    max-width: 100%;
    padding: 12px;
  }
  .auth-logo-link {
    margin-bottom: 20px;
  }
  .auth-logo {
    width: 44px;
    height: 44px;
  }
  .auth-brand {
    font-size: 0.9375rem;
    letter-spacing: 0.15em;
  }
  .auth-card {
    padding: 28px 20px;
    border-radius: var(--r-md);
  }
  .auth-title {
    font-size: 1.25rem;
  }
  .auth-subtitle {
    font-size: 0.75rem;
    margin-bottom: 24px;
  }
  .auth-form {
    gap: 14px;
  }
  .form-group label {
    font-size: 0.6875rem;
  }
  .auth-input {
    padding: 10px 12px;
    font-size: 0.8125rem;
  }
  .auth-btn {
    padding: 11px;
    font-size: 0.875rem;
    min-height: 42px;
  }
  .auth-or {
    margin: 16px 0;
    font-size: 0.6875rem;
  }
  .auth-link-btn {
    padding: 10px;
    font-size: 0.8125rem;
    margin-bottom: 12px;
  }
  .auth-back-link {
    font-size: 0.75rem;
  }
}

/* 小屏移动端 */
@media screen and (max-width: 359px) {
  .auth-page {
    padding: 8px;
  }
  .auth-center {
    padding: 8px;
  }
  .auth-logo-link {
    margin-bottom: 16px;
  }
  .auth-logo {
    width: 40px;
    height: 40px;
  }
  .auth-brand {
    font-size: 0.875rem;
  }
  .auth-card {
    padding: 24px 16px;
  }
  .auth-title {
    font-size: 1.125rem;
  }
  .auth-subtitle {
    font-size: 0.6875rem;
    margin-bottom: 20px;
  }
  .auth-form {
    gap: 12px;
  }
  .auth-input {
    padding: 8px 10px;
    font-size: 0.75rem;
  }
  .auth-btn {
    padding: 10px;
    font-size: 0.8125rem;
    min-height: 40px;
  }
}
</style>
