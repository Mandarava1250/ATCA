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
        <h2 class="auth-title">{{ $t('register.title') }}</h2>
        <p class="auth-subtitle">{{ $t('register.subtitle') }}</p>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-row">
            <div class="form-group half">
              <label>{{ $t('register.username') }}</label>
              <input
                v-model="form.username"
                type="text"
                class="auth-input"
                :placeholder="$t('register.usernamePlaceholder')"
                required
              />
            </div>
            <div class="form-group half">
              <label>{{ $t('register.nickname') }}</label>
              <input
                v-model="form.nickname"
                type="text"
                class="auth-input"
                :placeholder="$t('register.nicknamePlaceholder')"
              />
            </div>
          </div>

          <div class="form-group">
            <label>{{ $t('register.email') }}</label>
            <input
              v-model="form.email"
              type="email"
              class="auth-input"
              :placeholder="$t('register.emailPlaceholder')"
            />
          </div>

          <div class="form-group">
            <label>{{ $t('register.password') }}</label>
            <input
              v-model="form.password"
              type="password"
              class="auth-input"
              :placeholder="$t('register.passwordPlaceholder')"
              required
              @input="checkStrength"
            />
            <!-- 密码强度 -->
            <div class="pwd-strength" v-if="form.password">
              <div class="strength-bar">
                <div class="strength-fill" :style="{ width: strengthPct + '%', background: strengthColor }"></div>
              </div>
              <span class="strength-label" :style="{ color: strengthColor }">{{ strengthText }}</span>
            </div>
          </div>

          <div v-if="error" class="auth-error">{{ error }}</div>

          <button type="submit" class="auth-btn" :disabled="loading">
            <span v-if="loading" class="btn-spinner"></span>
            <span v-else>{{ $t('register.submit') }}</span>
          </button>
        </form>

        <!-- 分隔线 -->
        <div class="auth-or">
          <span></span>
          <em>{{ $t('register.hasAccount') }}</em>
          <span></span>
        </div>

        <router-link to="/login" class="auth-link-btn">
          {{ $t('register.loginNow') }}
        </router-link>

        <router-link to="/home" class="auth-back-link">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" fill="none" stroke-width="1.5"/>
          </svg>
          {{ $t('register.backHome') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { authApi } from '@/services/api';
import { useUserStore } from '@/stores';
import { 
  handleError, 
  validateUsername, 
  validatePassword, 
  validateEmail 
} from '@/utils/errorHandler';
import { preventDoubleClick } from '@/utils/performance';

const router = useRouter();
const userStore = useUserStore();
const { t } = useI18n();
const loading = ref(false);
const error = ref('');

const form = reactive({
  username: '',
  password: '',
  email: '',
  nickname: '',
});

const strength = ref(0);

const strengthPct = computed(() => Math.min(strength.value * 25, 100));
const strengthColor = computed(() => {
  const c = ['#C75C3A', '#C75C3A', '#C9A96E', '#7CB342', '#7CB342'];
  return c[strength.value] || '#C75C3A';
});
const strengthText = computed(() => {
  const keys = ['', 'register.strengthWeak', 'register.strengthFair', 'register.strengthGood', 'register.strengthStrong'];
  return keys[strength.value] ? t(keys[strength.value]) : '';
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

function checkStrength() {
  const pwd = form.password;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  strength.value = s;
}

const handleRegister = preventDoubleClick(async () => {
  loading.value = true;
  error.value = '';
  try {
    // 验证用户名
    const usernameResult = validateUsername(form.username);
    if (!usernameResult.valid) {
      error.value = t(usernameResult.errorKey!);
      return;
    }
    
    // 验证密码
    const passwordResult = validatePassword(form.password);
    if (!passwordResult.valid) {
      error.value = t(passwordResult.errorKey!);
      return;
    }
    
    // 验证邮箱
    const emailResult = validateEmail(form.email);
    if (!emailResult.valid) {
      error.value = t(emailResult.errorKey!);
      return;
    }
    
    const res = await authApi.register({
      username: form.username.trim(),
      password: form.password,
      email: form.email.trim(),
      nickname: form.nickname?.trim() || undefined,
    });
    const result = res.data;
    const access = result?.tokens?.accessToken;
    const refresh = result?.tokens?.refreshToken;
    const user = result?.user;
    if (!access) throw new Error('服务器返回数据格式错误');
    userStore.setTokens({ accessToken: access, refreshToken: refresh, expiresIn: 86400 });
    userStore.setUser(user);
    router.push('/home');
  } catch (e: any) {
    handleError(e, error, t);
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
  overflow-y: auto;
  overflow-x: hidden;
}

/* 背景 */
.auth-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('/images/hero-bg.jpg');
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
  max-width: 440px;
  padding: 24px 20px;
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
  margin-bottom: 24px;
  text-decoration: none;
}
.auth-logo {
  width: 52px;
  height: 52px;
  animation: logoGlow 3s ease-in-out infinite;
}
@keyframes logoGlow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(201,169,110,0.3)); }
  50% { filter: drop-shadow(0 0 18px rgba(201,169,110,0.6)); }
}
.auth-brand {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.2em;
}

/* 卡片 */
.auth-card {
  width: 100%;
  padding: 32px 28px;
  background: rgba(30, 26, 22, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(201, 169, 110, 0.12);
  border-radius: var(--r-lg);
  box-shadow: 0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,169,110,0.06);
}
.auth-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
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
  margin-bottom: 24px;
}

/* 表单 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
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
  padding: 10px 12px;
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

/* 密码强度 */
.pwd-strength {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.strength-bar {
  flex: 1;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}
.strength-label {
  font-size: 0.6875rem;
  flex-shrink: 0;
}

.auth-error {
  color: #E57373;
  font-size: 0.8125rem;
  text-align: center;
  padding: 8px;
  background: rgba(139, 37, 0, 0.1);
  border-radius: var(--r-sm);
}

/* 注册按钮 */
.auth-btn {
  width: 100%;
  padding: 11px;
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
  min-height: 42px;
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
  margin: 18px 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}
.auth-or span {
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* 登录链接 */
.auth-link-btn {
  display: block;
  width: 100%;
  padding: 10px;
  text-align: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text-muted);
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 14px;
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
</style>
