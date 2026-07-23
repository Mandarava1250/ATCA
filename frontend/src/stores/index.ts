// ============================================
// 筑见山河 - Pinia Stores
// ============================================

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, AuthTokens, QuizSession, QuizResult } from '@shared/types';
import { authApi } from '@/services/api';
import { initSync, closeSync } from '@/utils/syncService';
export { useCheckinStore } from './checkin';

// 用户Store
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const tokens = ref<AuthTokens | null>(null);
  const loading = ref(false);
  const settings = ref({ theme: 'light', language: 'zh-CN' });

  const isLoggedIn = computed(() => !!user.value && !!tokens.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isModerator = computed(() => user.value?.role === 'moderator' || user.value?.role === 'admin');
  const isMuted = ref(false); // 用户是否被禁言

  function setUser(userData: User | null) {
    user.value = userData;
    if (userData) {
      localStorage.setItem('atca_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('atca_user');
    }
  }

  function setTokens(tokenData: AuthTokens | null) {
    tokens.value = tokenData;
    if (tokenData) {
      localStorage.setItem('atca_access_token', tokenData.accessToken);
      localStorage.setItem('atca_refresh_token', tokenData.refreshToken);
      // 登录后连接 WebSocket 同步客户端
      initSync().catch(() => {
        // WebSocket 连接非关键，失败不影响使用
      });
    }
  }

  function logout() {
    // 先断开 WebSocket 同步连接，再清除 token
    closeSync();
    user.value = null;
    tokens.value = null;
    localStorage.removeItem('atca_access_token');
    localStorage.removeItem('atca_refresh_token');
  }

  // 获取当前用户信息
  async function me() {
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        user.value = res.data;
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (err) {
      user.value = null;
      // 重新抛出错误，让 main.ts 的 .catch() 能触发 logout()
      throw err;
    }
  }

  function loadFromStorage() {
    const accessToken = localStorage.getItem('atca_access_token');
    const refreshToken = localStorage.getItem('atca_refresh_token');
    if (accessToken) {
      tokens.value = { accessToken, refreshToken, expiresIn: 86400 };
      const savedUser = localStorage.getItem('atca_user');
      if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        try { user.value = JSON.parse(savedUser); } catch { user.value = null; }
      }
    }
  }

  return {
    user,
    tokens,
    loading,
    settings,
    isLoggedIn,
    isAdmin,
    isModerator,
    isMuted,
    setUser,
    setTokens,
    logout,
    me,
    loadFromStorage,
  };
});

// 竞赛Store
export const useQuizStore = defineStore('quiz', () => {
  const session = ref<QuizSession | null>(null);
  const result = ref<QuizResult | null>(null);
  const currentAnswer = ref<string>('');
  const timeRemaining = ref(0);
  const answers = ref<Record<number, string>>({});

  function setSession(data: QuizSession | null) {
    session.value = data;
    if (data) {
      timeRemaining.value = data.timeLimit;
      answers.value = {};
    }
  }

  function setAnswer(questionId: number | string, answer: string) {
    answers.value[String(questionId)] = answer;
  }

  function setResult(data: QuizResult | null) {
    result.value = data;
    session.value = null;
  }

  function tick() {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
    }
  }

  function reset() {
    session.value = null;
    result.value = null;
    currentAnswer.value = '';
    timeRemaining.value = 0;
    answers.value = {};
  }

  return {
    session,
    result,
    currentAnswer,
    timeRemaining,
    answers,
    setSession,
    setAnswer,
    setResult,
    tick,
    reset,
  };
});

// AI助手Store
export const useAIStore = defineStore('ai', () => {
  const isOpen = ref(false);
  const activeAI = ref<number>(1);
  const aiList = ref<any[]>([]);
  const discussionMode = ref(false);
  const loadingAIList = ref(false);

  function toggle() {
    isOpen.value = !isOpen.value;
  }
  function open() {
    isOpen.value = true;
  }
  function close() {
    isOpen.value = false;
  }
  function setActiveAI(id: number) {
    activeAI.value = id;
  }
  function setDiscussionMode(mode: boolean) {
    discussionMode.value = mode;
  }
  function setAIList(list: any[]) {
    aiList.value = list;
    if (list.length > 0 && !activeAI.value) {
      const defaultAI = list.find((a: any) => a.is_default) || list[0];
      activeAI.value = defaultAI.ai_id || 1;
    }
  }

  return {
    isOpen, activeAI, aiList, discussionMode, loadingAIList,
    toggle, open, close, setActiveAI, setDiscussionMode, setAIList,
  };
});

// 3D工坊Store
export const useWorkshopStore = defineStore('workshop', () => {
  const currentModel = ref<any>(null);
  const selectedComponent = ref<string | null>(null);
  const buildMode = ref<'free' | 'guided' | 'template'>('free');
  const currentTemplate = ref<any>(null);
  const history = ref<any[]>([]);
  const historyIndex = ref(-1);

  function setBuildMode(mode: 'free' | 'guided' | 'template') {
    buildMode.value = mode;
  }

  function setCurrentTemplate(template: any) {
    currentTemplate.value = template;
  }

  function addToHistory(state: any) {
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push(state);
    historyIndex.value++;
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      return history.value[historyIndex.value];
    }
    return null;
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++;
      return history.value[historyIndex.value];
    }
    return null;
  }

  return {
    currentModel,
    selectedComponent,
    buildMode,
    currentTemplate,
    history,
    historyIndex,
    setBuildMode,
    setCurrentTemplate,
    addToHistory,
    undo,
    redo,
  };
});
