// ============================================
// 华夏营造 - 共享常量
// ============================================

export const API_BASE = '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  ARCHITECTURE: {
    LIST: '/architecture',
    DETAIL: (id: number) => `/architecture/${id}`,
    SEARCH: '/architecture/search',
    FAVORITE: (id: number) => `/architecture/${id}/favorite`,
    UNFAVORITE: (id: number) => `/architecture/${id}/unfavorite`,
    REVIEWS: (id: number) => `/architecture/${id}/reviews`,
    RELATED: (id: number) => `/architecture/${id}/related`,
    BY_DYNASTY: '/architecture/dynasty',
    BY_TYPE: '/architecture/type',
    FEATURED: '/architecture/featured',
    POPULAR: '/architecture/popular',
  },
  QUIZ: {
    MODES: '/quiz/modes',
    QUESTIONS: '/quiz/questions',
    SUBMIT: '/quiz/submit',
    HISTORY: '/quiz/history',
    LEADERBOARD: '/quiz/leaderboard',
    DAILY: '/quiz/daily',
    USER_STATS: '/quiz/user-stats',
  },
  AI_ASSISTANT: {
    CHAT: '/assistant/chat',
    STREAM: '/assistant/stream',
    HISTORY: '/assistant/history',
    CLEAR: '/assistant/clear',
  },
  MODEL3D: {
    LIST: '/models',
    DETAIL: (id: number) => `/models/${id}`,
    SAVE: '/models',
    UPDATE: (id: number) => `/models/${id}`,
    DELETE: (id: number) => `/models/${id}`,
    EXPORT: (id: number) => `/models/${id}/export`,
    COMPONENTS: '/models/components',
    TEMPLATES: '/models/templates',
    TEMPLATE_DETAIL: (id: number) => `/models/templates/${id}`,
    UPLOAD: '/models/upload',
  },
  ACTIVITY: {
    LIST: '/activities',
    DETAIL: (id: number) => `/activities/${id}`,
    JOIN: (id: number) => `/activities/${id}/join`,
    ACHIEVEMENTS: '/activities/achievements',
    USER_ACHIEVEMENTS: '/activities/user-achievements',
    DAILY_TASKS: '/activities/daily-tasks',
    COMPLETE_TASK: (id: number) => `/activities/daily-tasks/${id}/complete`,
  },
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
    SETTINGS: '/profile/settings',
    FAVORITES: '/profile/favorites',
    MODELS: '/profile/models',
    POINTS: '/profile/points',
    ACTIVITIES: '/profile/activities',
    ACHIEVEMENTS: '/profile/achievements',
  },
  UPLOAD: {
    IMAGE: '/upload/image',
    MODEL: '/upload/model',
  },
  ADMIN: {
    USERS: '/admin/users',
    ARCHITECTURES: '/admin/architectures',
    QUESTIONS: '/admin/questions',
    ACTIVITIES: '/admin/activities',
    DASHBOARD: '/admin/dashboard',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_CODES = {
  // 认证相关
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  TOKEN_INVALID: 'AUTH_003',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_004',
  AUTH_ACCOUNT_DISABLED: 'AUTH_005',
  AUTH_ACCOUNT_LOCKED: 'AUTH_006',
  AUTH_PASSWORD_TOO_WEAK: 'AUTH_007',
  AUTH_EMAIL_EXISTS: 'AUTH_008',
  AUTH_USERNAME_EXISTS: 'AUTH_009',
  AUTH_INVALID_TOKEN_FORMAT: 'AUTH_010',
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_011',

  // 用户相关
  USER_NOT_FOUND: 'USER_001',
  USER_UPDATE_FAILED: 'USER_002',
  USER_ALREADY_EXISTS: 'USER_003',

  // 建筑相关
  ARCH_NOT_FOUND: 'ARCH_001',
  ARCH_ALREADY_EXISTS: 'ARCH_002',
  ARCH_INVALID_DATA: 'ARCH_003',

  // 竞赛相关
  QUIZ_INVALID_ANSWER: 'QUIZ_001',
  QUIZ_ALREADY_ANSWERED: 'QUIZ_002',
  QUIZ_TIME_UP: 'QUIZ_003',

  // 3D模型相关
  MODEL_NOT_FOUND: 'MODEL_001',
  MODEL_INVALID_DATA: 'MODEL_002',
  MODEL_EXPORT_FAILED: 'MODEL_003',

  // 系统相关
  SYS_DATABASE_ERROR: 'SYS_001',
  SYS_INTERNAL_ERROR: 'SYS_002',
  SYS_INVALID_REQUEST: 'SYS_003',
  SYS_RESOURCE_NOT_FOUND: 'SYS_004',
  SYS_VALIDATION_ERROR: 'SYS_005',
  SYS_RATE_LIMIT: 'SYS_006',
} as const;

export const DYNASTY_MAP: Record<string, { name: string; period: string; years: string }> = {
  'xianqin': { name: '先秦', period: '夏商周', years: '前2070-前221' },
  'qinhan': { name: '秦汉', period: '秦、西汉、东汉', years: '前221-220' },
  'weijin': { name: '魏晋南北朝', period: '三国、两晋、南北朝', years: '220-589' },
  'suitang': { name: '隋唐', period: '隋、唐', years: '581-907' },
  'song': { name: '宋', period: '北宋、南宋', years: '960-1279' },
  'yuan': { name: '元', period: '元朝', years: '1271-1368' },
  'ming': { name: '明', period: '明朝', years: '1368-1644' },
  'qing': { name: '清', period: '清朝', years: '1644-1912' },
  'minguo': { name: '民国', period: '中华民国', years: '1912-1949' },
  'xiandai': { name: '现代', period: '中华人民共和国', years: '1949-今' },
};

export const ARCHITECTURE_TYPES = [
  '宫殿',
  '寺庙',
  '园林',
  '民居',
  '城楼',
  '牌坊',
  '塔',
  '桥',
  '陵墓',
  '戏台',
  '书院',
  '会馆',
  '驿站',
  '关隘',
  '其他',
] as const;

export const MATERIAL_PRESETS = [
  { id: 'wood', name: '木材', color: 0x8B6E4D, roughness: 0.8, metalness: 0.1 },
  { id: 'stone', name: '石材', color: 0x808080, roughness: 0.9, metalness: 0.0 },
  { id: 'brick', name: '砖', color: 0xA0522D, roughness: 0.85, metalness: 0.0 },
  { id: 'earth', name: '土', color: 0x8B7355, roughness: 0.95, metalness: 0.0 },
  { id: 'metal', name: '金属', color: 0xB5A642, roughness: 0.3, metalness: 0.8 },
  { id: 'tile', name: '瓦', color: 0x2F4F4F, roughness: 0.7, metalness: 0.0 },
] as const;

export const COMPONENT_CATEGORIES = [
  { id: 'pillar', name: '柱', icon: 'pillar' },
  { id: 'beam', name: '梁', icon: 'beam' },
  { id: 'roof', name: '屋顶', icon: 'roof' },
  { id: 'base', name: '台基', icon: 'base' },
  { id: 'decoration', name: '装饰', icon: 'decoration' },
  { id: 'wall', name: '墙体', icon: 'wall' },
  { id: 'door', name: '门', icon: 'door' },
  { id: 'window', name: '窗', icon: 'window' },
] as const;

export const COMPETITION_MODES = [
  { id: 'entry', name: '入门模式', description: '5道简单题目，适合初学者', difficulty: '入门', timeLimit: 180, icon: '🌱', color: '#4CAF50' },
  { id: 'basic', name: '基础模式', description: '8道基础题目，巩固知识', difficulty: '基础', timeLimit: 240, icon: '📚', color: '#2196F3' },
  { id: 'challenge', name: '挑战模式', description: '10道中等难度题目', difficulty: '挑战', timeLimit: 300, icon: '⚡', color: '#FF9800' },
  { id: 'advanced', name: '进阶模式', description: '12道较难题目，考验深度', difficulty: '进阶', timeLimit: 360, icon: '🏛️', color: '#9C27B0' },
  { id: 'expert', name: '专家模式', description: '15道高难度题目，大师挑战', difficulty: '资深', timeLimit: 480, icon: '👑', color: '#F44336' },
] as const;

export const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', model: 'gpt-4o' },
  { id: 'claude', name: 'Claude', model: 'claude-3-sonnet-20240229' },
  { id: 'kimi', name: 'Kimi', model: 'moonshot-v1-8k' },
  { id: 'qwen', name: '通义千问', model: 'qwen-turbo' },
  { id: 'gemini', name: 'Gemini', model: 'gemini-1.5-flash' },
  { id: 'mistral', name: 'Mistral', model: 'mistral-large-latest' },
  { id: 'groq', name: 'Groq', model: 'llama-3.1-70b-versatile' },
] as const;

export const THEME_COLORS = {
  primary: '#b22222',
  primaryLight: '#d44a4a',
  primaryDark: '#8b1a1a',
  secondary: '#8b6e4d',
  secondaryLight: '#a68b6a',
  secondaryDark: '#6b5238',
  background: '#faf8f3',
  surface: '#ffffff',
  surfaceAlt: '#f5f0e8',
  text: '#2c2c2c',
  textLight: '#5a5a5a',
  textMuted: '#8a8a8a',
  border: '#e0d8cc',
  borderDark: '#c8bfb0',
  success: '#4a7c59',
  warning: '#c9a227',
  error: '#b22222',
  info: '#4a7c9b',
  gold: '#c9a227',
  ivory: '#fffff0',
} as const;

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  ACCESS_TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000,
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
} as const;
