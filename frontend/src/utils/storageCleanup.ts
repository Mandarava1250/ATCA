/**
 * 用户超过1小时未操作时自动清理非认证数据
 * - 保留：token, refreshToken, user, rememberMe（登录状态）
 * - 清理：quiz_pending, ai_chat_history, 编辑器状态, 临时表单数据等
 *
 * 机制：
 *   1. 监听用户操作事件（mousemove/keydown/click/scroll/touchstart）更新最后活跃时间
 *   2. 页面重新可见时（visibilitychange → visible）检查是否超过1小时未操作
 *   3. 超过1小时则清理非认证 localStorage 数据
 */

/** 认证相关的 key（不会被清理） */
const AUTH_KEYS = ['token', 'refreshToken', 'user', 'rememberMe'];

/** 1小时的毫秒数 */
const INACTIVE_LIMIT_MS = 60 * 60 * 1000; // 3600000ms = 1小时

/** localStorage key 用于存储最后活跃时间 */
const LAST_ACTIVE_KEY = '__last_active';

/** 需要监听的用户操作事件 */
const USER_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

let initialized = false;
let listenersAttached = false;

/**
 * 初始化自动清理机制
 * 应在应用根组件（如 App.vue 或 AdminLayout.vue）的 onMounted 中调用一次
 */
export function setupStorageCleanup() {
  if (initialized) return;
  initialized = true;

  // 1. 记录当前活跃时间
  recordActiveTime();

  // 2. 监听用户操作事件，更新最后活跃时间
  attachUserEventListeners();

  // 3. 页面重新可见时检查超时
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 4. 页面卸载时清理事件监听
  window.addEventListener('beforeunload', detachUserEventListeners);
}

/** 记录当前活跃时间到 localStorage */
function recordActiveTime() {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch { /* ignore */ }
}

/** 获取最后活跃时间 */
function getLastActiveTime(): number {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    return raw ? parseInt(raw, 10) : Date.now();
  } catch {
    return Date.now();
  }
}

/** 用户操作事件的回调：更新活跃时间 */
function onUserActivity() {
  recordActiveTime();
}

/** 绑定用户操作事件监听 */
function attachUserEventListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  USER_EVENTS.forEach(event => {
    document.addEventListener(event, onUserActivity, { passive: true });
  });
}

/** 解绑用户操作事件监听 */
function detachUserEventListeners() {
  if (!listenersAttached) return;
  listenersAttached = false;
  USER_EVENTS.forEach(event => {
    document.removeEventListener(event, onUserActivity);
  });
}

/** 页面可见性变化处理 */
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // 页面重新可见，检查是否超过1小时未操作
    const lastActive = getLastActiveTime();
    const now = Date.now();
    const inactiveDuration = now - lastActive;

    if (inactiveDuration > INACTIVE_LIMIT_MS) {
      // 超过1小时未操作，清理非认证数据
      cleanupNonAuthData();
    }

    // 更新活跃时间（用户现在回来了）
    recordActiveTime();
  }
}

/**
 * 清理所有非认证 localStorage 数据
 * 保留：token, refreshToken, user, rememberMe
 */
export function cleanupNonAuthData() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !AUTH_KEYS.includes(key) && key !== LAST_ACTIVE_KEY) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}

/** 手动触发清理（用于测试） */
export function forceCleanup() {
  cleanupNonAuthData();
}

/** 获取距离上次操作的毫秒数 */
export function getInactiveDuration(): number {
  return Date.now() - getLastActiveTime();
}
