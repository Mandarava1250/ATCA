// ============================================
// 华夏营造 - API服务封装 (Axios)
// ============================================

import axios from 'axios';
import { useUserStore } from '@/stores';
import { apiCache, retry, generateCacheKey } from '@/utils/performance';

export const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';
export const API_HOST = import.meta.env.VITE_API_HOST || '';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  maxBodyLength: 500 * 1024 * 1024,
  maxContentLength: 500 * 1024 * 1024,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('atca_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // FormData请求删除Content-Type，让浏览器自动设置multipart boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    },
    (error) => Promise.reject(error)
);

// 防止重复跳转登录页的标志
let isRedirecting = false;

// 响应拦截器
apiClient.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const originalRequest = error.config;

      // Token过期，尝试刷新
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('atca_refresh_token');

        if (refreshToken) {
          try {
            const response = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            localStorage.setItem('atca_access_token', accessToken);
            localStorage.setItem('atca_refresh_token', newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          } catch {
            // 防止重复调用 logout 和跳转
            if (!isRedirecting) {
              isRedirecting = true;
              const userStore = useUserStore();
              userStore.logout();
              // 使用 setTimeout 确保其他 pending 请求有机会完成
              setTimeout(() => {
                if (!window.location.href.includes('/login')) {
                  window.location.href = '/login';
                }
                isRedirecting = false;
              }, 100);
            }
          }
        }
      }

      return Promise.reject(error);
    }
);

// 通用请求方法 - 默认泛型 ApiResponse 确保 error 字段可用
interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: { message: string; details?: string };
  meta?: { total?: number; totalPages?: number; page?: number; limit?: number; [key: string]: any };
}

// 请求选项接口
interface RequestOptions {
  cache?: boolean;
  cacheTTL?: number;
  retry?: boolean;
  maxRetries?: number;
}

// 获取缓存前缀（从URL中提取API路径前缀）
function getCachePrefix(url: string): string {
  const parts = url.split('/').filter(Boolean);
  // 取前两级路径作为前缀，例如 /admin/models
  if (parts.length >= 2) {
    return '/' + parts.slice(0, 2).join('/');
  }
  return url;
}

export const http = {
  get: <T = ApiResponse>(
    url: string, 
    params?: Record<string, any>,
    options?: RequestOptions
  ) => {
    const { cache = false, cacheTTL = 5 * 60 * 1000, retry: shouldRetry = true, maxRetries = 3 } = options || {};
    
    // 如果启用缓存，先检查缓存
    if (cache) {
      const cacheKey = generateCacheKey(url, params);
      const cached = apiCache.get<T>(cacheKey);
      if (cached) {
        return Promise.resolve(cached);
      }
    }
    
    // 发送请求
    const request = () => apiClient.get<T>(url, { params }) as Promise<T>;
    
    // 根据是否需要重试来执行请求
    const promise = shouldRetry ? retry(request, maxRetries) : request();
    
    // 如果启用缓存，缓存响应
    if (cache) {
      return promise.then(response => {
        const cacheKey = generateCacheKey(url, params);
        apiCache.set(cacheKey, response, cacheTTL);
        return response;
      });
    }
    
    return promise;
  },
  post: <T = ApiResponse>(
    url: string,
    data?: any,
    options?: Omit<RequestOptions, 'cache'>
  ) => {
    const { retry: shouldRetry = false, maxRetries = 3 } = options || {}; // 非幂等操作默认不重试

    const request = () => apiClient.post<T>(url, data) as Promise<T>;
    const promise = shouldRetry ? retry(request, maxRetries) : request();
    // 数据变更后清除匹配前缀的缓存，确保后续GET获取最新数据
    return promise.then(response => {
      apiCache.clearByPrefix(getCachePrefix(url));
      return response;
    });
  },
  put: <T = ApiResponse>(
    url: string,
    data?: any,
    options?: Omit<RequestOptions, 'cache'>
  ) => {
    const { retry: shouldRetry = false, maxRetries = 3 } = options || {}; // 非幂等操作默认不重试

    const request = () => apiClient.put<T>(url, data) as Promise<T>;
    const promise = shouldRetry ? retry(request, maxRetries) : request();
    // 数据变更后清除匹配前缀的缓存，确保后续GET获取最新数据
    return promise.then(response => {
      apiCache.clearByPrefix(getCachePrefix(url));
      return response;
    });
  },
  delete: <T = ApiResponse>(
    url: string,
    options?: Omit<RequestOptions, 'cache'>
  ) => {
    const { retry: shouldRetry = false, maxRetries = 3 } = options || {}; // 非幂等操作默认不重试

    const request = () => apiClient.delete<T>(url) as Promise<T>;
    const promise = shouldRetry ? retry(request, maxRetries) : request();
    // 数据变更后清除匹配前缀的缓存，确保后续GET获取最新数据
    return promise.then(response => {
      apiCache.clearByPrefix(getCachePrefix(url));
      return response;
    });
  },

  // 清除特定缓存
  clearCache: (prefix?: string) => {
    if (prefix) {
      apiCache.clearByPrefix(prefix);
    } else {
      apiCache.clear();
    }
  }
};

// 认证API
export const authApi = {
  register: (data: { username: string; password: string; email: string; nickname?: string }) =>
      http.post<{ success: boolean; data: { user: any; tokens: any } }>('/auth/register', data),
  login: (data: { username: string; password: string }) =>
      http.post<{ success: boolean; data: { user: any; tokens: any } }>('/auth/login', data),
  logout: () => http.post('/auth/logout', {}),
  refresh: (refreshToken: string) =>
      http.post<{ success: boolean; data: any }>('/auth/refresh', { refreshToken }),
  me: () => http.get<{ success: boolean; data: any }>('/auth/me'),
  getProfile: () => http.get<{ success: boolean; data: any }>('/auth/profile'),
  updateProfile: (data: any) => http.put('/auth/profile', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
      http.put('/auth/change-password', data),
  uploadAvatar: (formData: FormData) =>
      apiClient.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }) as Promise<{ success: boolean; data: { avatarUrl: string } }>,
};

// 古建筑API
export const architectureApi = {
  list: (params?: any) =>
      http.get<{ success: boolean; data: any[]; meta: any }>('/architecture', params),
  detail: (id: number) =>
      http.get<{ success: boolean; data: any }>(`/architecture/${id}`),
  search: (q: string) =>
      http.get<{ success: boolean; data: any[] }>('/architecture/search/suggestions', { q }),
  favorite: (id: number) =>
      http.post(`/architecture/${id}/favorite`, {}),
  unfavorite: (id: number) =>
      http.delete(`/architecture/${id}/favorite`),
  stats: () =>
      http.get<{ success: boolean; data: { total: number; dynasties: number; regions: number } }>('/architecture/stats'),
  dynasties: () =>
      http.get<{ success: boolean; data: any[] }>('/architecture/dynasty/list'),
  types: () =>
      http.get<{ success: boolean; data: string[] }>('/architecture/type/list'),
  popular: () =>
      http.get<{ success: boolean; data: any[] }>('/architecture/popular/list'),
  featured: () =>
      http.get<{ success: boolean; data: any[] }>('/architecture/featured/list'),
};

// 竞赛API
export const quizApi = {
  getModes: () => http.get<{ success: boolean; data: any[] }>('/quiz/modes'),
  getQuestions: (mode: string) =>
      http.get<{ success: boolean; data: any }>('/quiz/questions', { mode }),
  submit: (data: { sessionId: string; answers: Record<number, string> }) =>
      http.post<{ success: boolean; data: any; error?: { message: string } }>('/quiz/submit', data),
  getUserStats: () => http.get<{ success: boolean; data: any }>('/quiz/stats'),
  getHistory: () => http.get<{ success: boolean; data: any[] }>('/quiz/history'),
  getLeaderboard: (mode?: string) =>
      http.get<{ success: boolean; data: any[] }>('/quiz/leaderboard', { mode }),
};

// AI 助手 API
export const assistantApi = {
  chat: (message: string, ai_id?: number, enhancedCheck?: boolean) =>
      http.post<{ success: boolean; data: any }>('/assistant/chat', { message, ai_id, enhancedCheck }),
  chatStream: (message: string, ai_id?: number, enhancedCheck?: boolean) =>
      http.post('/assistant/chat-stream', { message, ai_id, enhancedCheck }),
  getAIList: () => http.get<{ success: boolean; data: any[] }>('/assistant/ai-configs'),
  getAllList: () => http.get<{ success: boolean; data: any[] }>('/assistant/ai-configs'), // 兼容别名
  getHistory: () => http.get<{ success: boolean; data: any[] }>('/assistant/history'),
  clearHistory: () => http.delete('/assistant/clear'),
  testAI: (id: number, message?: string) =>
      http.post<{ success: boolean; data: { content: string } }>('/admin/ai-configs/test', { id, message }),
  // 多AI模型评估接口
  evaluateMultiAI: (question: string, aiResponses: Array<{ aiId: string; aiName: string; content: string }>) =>
      http.post<{ success: boolean; data: any }>('/assistant/local-ai/evaluate-multi-ai', { question, aiResponses }),
};

// 3D工坊API
export const model3dApi = {
  list: (params?: Record<string, any>) =>
      http.get<{ success: boolean; data: any[]; meta?: any }>('/models', params),
  getComponents: (category?: string) =>
      http.get<{ success: boolean; data: any[] }>('/models/components', { category }),
  getTemplates: () =>
      http.get<{ success: boolean; data: any[] }>('/models/templates'),
  getTemplate: (id: number) =>
      http.get<{ success: boolean; data: any }>(`/models/templates/${id}`),
  saveModel: (data: any) =>
      http.post<{ success: boolean; data: any; error?: { message: string } }>('/models', data),
  getMyModels: () =>
      http.get<{ success: boolean; data: any[] }>('/models/my-models'),
  getModel: (id: number) =>
      http.get<{ success: boolean; data: any }>(`/models/${id}`),
  updateModel: (id: number, data: any) =>
      http.put(`/models/${id}`, data),
  deleteModel: (id: number) =>
      apiClient.delete(`/models/${id}`) as Promise<any>,
  exportModel: (id: number) =>
      apiClient.get(`/models/${id}/export`, { responseType: 'blob' }),
};

// 社交功能API - 社区活动
export const socialApi = {
  // 禁言状态查询
  getMuteStatus: () => http.get<{ success: boolean; data: { is_muted: boolean; mute_reason: string } }>('/social/mute-status'),
  // 评论
  getComments: (targetType: string, targetId: number, page = 1, limit = 20) =>
      http.get<{ success: boolean; data: any[]; meta?: any }>('/social/comments', { target_type: targetType, target_id: targetId, page, limit }),
  postComment: (data: { target_type: string; target_id: number; content: string; parent_id?: number }) =>
      http.post<{ success: boolean; data?: any }>('/social/comments', data),
  deleteComment: (id: number) =>
      http.delete<{ success: boolean }>(`/social/comments/${id}`),
  getMyComments: (page = 1, limit = 20) =>
      http.get<{ success: boolean; data: any[]; meta?: any }>('/social/my-comments', { page, limit }),
  // 点赞
  toggleLike: (targetType: string, targetId: number) =>
      http.post<{ success: boolean; data: { liked: boolean } }>('/social/likes', { target_type: targetType, target_id: targetId }),
  // 建筑分享
  getBuildingShares: (search?: string, era?: string, buildingType?: string, featured?: boolean, page = 1, limit = 20) =>
      http.get<{ success: boolean; data: any[]; meta?: any }>('/social/building-shares', { search, era, building_type: buildingType, featured: featured ? '1' : '', page, limit }),
  getBuildingShare: (id: number) =>
      http.get<{ success: boolean; data: any }>(`/social/building-shares/${id}`),
  createBuildingShare: (data: { title: string; description?: string; model_data?: string; era?: string; building_type?: string; tags?: string; model_id?: number }) =>
      http.post<{ success: boolean }>('/social/building-shares', data),
  syncPublicModels: () =>
      http.post<{ success: boolean; data: { synced: number } }>('/social/sync-public-models'),
  // 论坛管理（管理员）
  getAllTopics: () =>
      http.get<{ success: boolean; data: any[] }>('/social/admin/forum/topics'),
  deleteTopicAdmin: (id: number) =>
      http.delete<{ success: boolean }>(`/social/admin/forum/topics/${id}`),
  deleteReplyAdmin: (id: number) =>
      http.delete<{ success: boolean }>(`/social/admin/forum/replies/${id}`),
  // 我的内容（论坛/评论）
  getMyContent: () =>
      http.get<{ success: boolean; data: { topics: any[]; replies: any[] } }>('/social/my-content'),
  // 分享管理（兼容旧API调用）
  createShare: (data: { target_type: string; target_id: number; target_title: string; platform?: string; share_url?: string; share_message?: string }) =>
      http.post<{ success: boolean }>('/social/shares', data),
  deleteShare: (id: number) =>
      http.delete<{ success: boolean }>(`/social/building-shares/${id}`),
  updateShare: (id: number, data: Record<string, any>) =>
      http.put<{ success: boolean }>(`/social/building-shares/${id}`, data),
  // 笔记
  getPublicNotes: (params?: { page?: number; limit?: number }) =>
      http.get<{ success: boolean; data: any[]; meta?: any }>('/social/notes', { is_public: '1', ...params }),
  createNote: (data: { title: string; content: string; tags?: string; is_public?: boolean; related_building_id?: number; related_building_name?: string }) =>
      http.post<{ success: boolean; data: { note_id: number } }>('/social/notes', data),
  deleteNote: (id: number) =>
      http.delete<{ success: boolean }>(`/social/notes/${id}`),
  // 论坛
  getForumBoards: () =>
      http.get<{ success: boolean; data: any[] }>('/social/forum/boards'),
  getForumTopics: (boardId?: number, page = 1, limit = 20) =>
      http.get<{ success: boolean; data: any[]; meta?: any }>('/social/forum/topics', { board_id: boardId, page, limit }),
  getForumTopic: (id: number) =>
      http.get<{ success: boolean; data: { topic: any; replies: any[] } }>(`/social/forum/topics/${id}`),
  createForumTopic: (data: { board_id: number; title: string; content: string }) =>
      http.post<{ success: boolean }>('/social/forum/topics', data),
  createForumReply: (data: { topic_id: number; content: string }) =>
      http.post<{ success: boolean }>('/social/forum/replies', data),
};

// 国际化翻译API
export const i18nApi = {
  getLanguages: (activeOnly = true) =>
      http.get<{ success: boolean; data: any[] }>('/i18n/languages', { active_only: activeOnly }),
  getTranslation: (entityType: string, entityId: number, lang = 'en') =>
      http.get<{ success: boolean; data: Record<string, { text: string; isMachine: boolean }> }>(`/i18n/translate/${entityType}/${entityId}`, { lang }),
  getTranslationsBatch: (entityType: string, entityIds: number[], language = 'en') =>
      http.post<{ success: boolean; data: Record<string, Record<string, { text: string; isMachine: boolean }>> }>('/i18n/translate/batch', { entityType, entityIds, language }),
  saveTranslation: (data: any) =>
      http.post<{ success: boolean; data: any }>('/i18n/translate', data),
  autoTranslate: (data: { entity_type?: string; entity_id?: number; field_name?: string; source_text: string; target_lang?: string }) =>
      http.post<{ success: boolean; data: { translated_text: string; is_machine_translated: boolean } }>('/i18n/translate/auto', data),
  deleteTranslation: (id: number) =>
      http.delete<{ success: boolean; data: { deleted_count: number } }>(`/i18n/translate/${id}`),
  batchDeleteTranslations: (ids: number[]) =>
      http.post<{ success: boolean; data: { deleted_count: number } }>('/i18n/translate/batch-delete', { translation_ids: ids }),
  getTranslationList: (params?: { search?: string; entity_type?: string; language?: string; status?: string; page?: number; limit?: number }) =>
      http.get<{ success: boolean; data: { list: any[]; total: number; totalPages: number } }>('/i18n/translations', params),
  getTranslationStats: () =>
      http.get<{ success: boolean; data: any }>('/i18n/stats'),
  reviewTranslation: (data: { translation_id: number; review_status: string; review_notes?: string; quality_score?: number }) =>
      http.post<{ success: boolean; data: { review_id: number } }>('/i18n/review', data),
  getTranslationVersions: (id: number) =>
      http.get<{ success: boolean; data: any[] }>(`/i18n/translations/${id}/versions`),
  lookupMemory: (data: { source_text: string; target_language: string }) =>
      http.post<{ success: boolean; data: any[] }>('/i18n/memory/lookup', data),
  getMemoryList: (params?: { search?: string; page?: number; limit?: number }) =>
      http.get<{ success: boolean; data: any[] }>('/i18n/memory', params),
  batchTranslate: (data: { entityType: string; targetLang: string; fields: string[] }) =>
      http.post<{ success: boolean; data: any }>('/i18n/batch-translate', data),
};

// 认证API补充
// 个人资料API
export const profileApi = {
  getProfile: () => http.get<{ success: boolean; data: any }>('/profile'),
  getFavorites: () => http.get<{ success: boolean; data: any[] }>('/profile/favorites'),
  getModels: () => http.get<{ success: boolean; data: any[] }>('/profile/models'),
  getPoints: () => http.get<{ success: boolean; data: any[] }>('/profile/points'),
  updateSettings: (data: any) => http.put('/profile/settings', data),
};

// 首页API
export const indexApi = {
  getDashboard: () => http.get<{ success: boolean; data: any }>('/index/dashboard'),
  getRandomCards: (count?: number) =>
      http.get<{ success: boolean; data: any[] }>('/index/random-cards', { count }),
  getLeaderboard: () => http.get<{ success: boolean; data: any[] }>('/index/leaderboard'),
  getStats: () => http.get<{ success: boolean; data: any }>('/index/stats'),
};

// 管理员API
export const adminApi = {
  getUserGrowth: (days?: number) =>
      http.get<{ success: boolean; data: { dates: string[]; userCounts: number[]; dauCounts: number[] } }>('/admin/user-growth', { days }),
  getDashboard: () => http.get<{ success: boolean; data: any }>('/admin/dashboard'),
  getUsers: (params?: any) => http.get<{ success: boolean; data: any[]; meta?: any }>('/admin/users', params),
  createUser: (data: any) => http.post('/admin/users', data),
  updateUser: (id: number, data: any) => http.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => http.delete(`/admin/users/${id}`),
  batchDeleteUsers: (ids: number[]) => http.post('/admin/users/batch-delete', { ids }),
  batchUpdateUserRole: (ids: number[], role: string) => http.post('/admin/users/batch-update-role', { ids, role }),
  batchUpdateUserStatus: (ids: number[], is_active: boolean) => http.post('/admin/users/batch-update-status', { ids, is_active }),
  getArchitectures: (params?: any) => http.get<{ success: boolean; data: any[]; meta?: any }>('/admin/architectures', params),
  getArchitectureById: (id: number) => http.get<{ success: boolean; data: any }>(`/admin/architectures/${id}`),
  batchDeleteArchitectures: (ids: number[]) => http.post('/admin/architectures/batch-delete', { ids }),
  createArchitecture: (data: any) => http.post('/admin/architectures', data),
  updateArchitecture: (id: number, data: any) => http.put(`/admin/architectures/${id}`, data),
  deleteArchitecture: (id: number) => http.delete(`/admin/architectures/${id}`),
  getQuestions: (params?: any) => http.get<{ success: boolean; data: any[]; meta?: any }>('/admin/questions', params),
  batchDeleteQuestions: (ids: number[]) => http.post('/admin/questions/batch-delete', { ids }),
  createQuestion: (data: any) => http.post('/admin/questions', data),
  updateQuestion: (id: number, data: any) => http.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id: number) => http.delete(`/admin/questions/${id}`),
  getCompetitionModes: () => http.get<{ success: boolean; data: any[] }>('/admin/competition-modes'),
  updateCompetitionMode: (id: string, data: any) => http.put(`/admin/competition-modes/${id}`, data),
  getAIConfigs: () => http.get<{ success: boolean; data: any[] }>('/admin/ai-configs'),
  getAIList: () => http.get<{ success: boolean; data: any[] }>('/admin/ai-configs'), // 别名，兼容AdminAI.vue
  getAllList: () => http.get<{ success: boolean; data: any[] }>('/admin/ai-configs'), // 兼容别名
  createAIConfig: (data: any) => http.post('/admin/ai-configs', data),
  updateAIConfig: (id: number, data: any) => http.put(`/admin/ai-configs/${id}`, data),
  deleteAIConfig: (id: number) => http.delete(`/admin/ai-configs/${id}`),
  getActivities: (params?: any) => http.get<{ success: boolean; data: any[] }>('/admin/activities', params),
  createActivity: (data: any) => http.post('/admin/activities', data),
  updateActivity: (id: number, data: any) => http.put(`/admin/activities/${id}`, data),
  deleteActivity: (id: number) => http.delete(`/admin/activities/${id}`),
  // 3D模型管理
  getModels: (params?: any) => http.get<{ success: boolean; data: any[]; meta?: any }>('/admin/models', params),
  getFeaturedTemplates: () => http.get<{ success: boolean; data: any[] }>('/models/templates'),
  batchDeleteModels: (ids: number[], source?: string) => http.post('/admin/models/batch-delete', { ids, source }),
  getFeaturedModels: () => http.get<{ success: boolean; data: any[] }>('/admin/models/featured'),
  toggleModelFeatured: (id: number, is_featured: boolean, source?: string) => http.put(`/admin/models/${id}/featured`, { is_featured, source }),
  deleteModel: (id: number, source?: string) => {
    const url = source ? `/admin/models/${id}?source=${source}` : `/admin/models/${id}`;
    return http.delete(url);
  },
  // 每日打卡管理
  getDailyChallenges: (params?: any) => http.get<{ success: boolean; data: any[] }>('/admin/daily-challenges', params),
  createDailyChallenge: (data: any) => http.post('/admin/daily-challenges', data),
  updateDailyChallenge: (id: number, data: any) => http.put(`/admin/daily-challenges/${id}`, data),
  deleteDailyChallenge: (id: number) => http.delete(`/admin/daily-challenges/${id}`),
  batchCreateDailyChallenges: (items: any[]) => http.post('/admin/daily-challenges/batch', { items }),
  batchDeleteDailyChallenges: (ids: number[]) => http.post('/admin/daily-challenges/batch-delete', { ids }),
  // AI测试
  testAI: (id: number, message: string) => http.post('/admin/ai-configs/test', { id, message }),
  // 用户禁言管理
  muteUser: (id: number, data: { is_muted: boolean; mute_reason?: string }) =>
      http.put(`/admin/users/${id}/mute`, data),
  // 社区内容管理
  getAllTopics: () => http.get<{ success: boolean; data: any[] }>('/social/admin/forum/topics'),
  deleteTopicAdmin: (id: number) => http.delete(`/social/admin/forum/topics/${id}`),
  deleteReplyAdmin: (id: number) => http.delete(`/social/admin/forum/replies/${id}`),
  // 3D模型批量导入
  batchImportModels: (models: any[]) => http.post('/models/batch-import', { models }),
  // 3D模型文件上传
  uploadModels: (formData: FormData) => http.post('/models/upload', formData),
  // 知识图谱数据导入
  importKnowledgeGraph: (data: { format: string; data: string; conflictStrategy: string; validateOnly: boolean; batchSize: number }) =>
      http.post<{ success: boolean; data?: any; error?: { message: string } }>('/admin/knowledge-graph/import', data),
};

// 活动API
export const activityApi = {
  getActivities: () => http.get<{ success: boolean; data: any[] }>('/activities'),
  getActivityDetail: (id: string | number) => http.get<{ success: boolean; data: any }>(`/activities/${id}`),
  getAchievements: () => http.get<{ success: boolean; data: any[] }>('/activities/achievements'),
  getUserAchievements: () => http.get<{ success: boolean; data: any[] }>('/activities/user-achievements'),
  getDailyTasks: () => http.get<{ success: boolean; data: any[] }>('/activities/daily-tasks'),
  joinActivity: (id: number) => http.post(`/activities/${id}/join`, {}),
  // 每日打卡API
  checkin: (data?: { device_type?: string; device_info?: string; checkin_date?: string }) =>
      http.post<{ success: boolean; message: string; checkin_id?: number; streak_count?: number; points_earned?: number; already_checked?: boolean }>('/activities/checkin', data || {}),
  getCheckins: (params?: { page?: number; limit?: number }) =>
      http.get<{ success: boolean; data: { list: any[]; total: number; totalPages: number } }>('/activities/checkin', params),
  getCheckinStats: () =>
      http.get<{ success: boolean; data: { total_checkins: number; max_streak: number; total_points: number; last_checkin_date: string | null; weekly_checkins: number; monthly_checkins: number } }>('/activities/checkin/stats'),
  checkTodayCheckin: () =>
      http.get<{ success: boolean; data: { checked_today: boolean } }>('/activities/checkin/today'),
  getCheckinCalendar: (params: { year: number; month: number }) =>
      http.get<{ success: boolean; data: any[] }>('/activities/checkin/calendar', params),
};

// 古建筑子表管理API（详情页子数据）
export const archSubTableApi = {
  // 历史发展 (historical_development)
  getHistory: (architectureId: number) =>
      http.get<{ success: boolean; data: any[] }>(`/admin/architectures/${architectureId}/history`),
  createHistory: (architectureId: number, data: any) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/history`, data),
  updateHistory: (architectureId: number, historyId: number, data: any) =>
      http.put<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/history/${historyId}`, data),
  deleteHistory: (architectureId: number, historyId: number) =>
      http.delete<{ success: boolean }>(`/admin/architectures/${architectureId}/history/${historyId}`),
  batchDeleteHistory: (architectureId: number, ids: number[]) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/history/batch-delete`, { ids }),

  // 技术结构 (technical_structure)
  getStructure: (architectureId: number) =>
      http.get<{ success: boolean; data: any[] }>(`/admin/architectures/${architectureId}/structure`),
  createStructure: (architectureId: number, data: any) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/structure`, data),
  updateStructure: (architectureId: number, structureId: number, data: any) =>
      http.put<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/structure/${structureId}`, data),
  deleteStructure: (architectureId: number, structureId: number) =>
      http.delete<{ success: boolean }>(`/admin/architectures/${architectureId}/structure/${structureId}`),
  batchDeleteStructure: (architectureId: number, ids: number[]) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/structure/batch-delete`, { ids }),

  // 建筑特色 (architectural_features)
  getFeatures: (architectureId: number) =>
      http.get<{ success: boolean; data: any[] }>(`/admin/architectures/${architectureId}/features`),
  createFeature: (architectureId: number, data: any) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/features`, data),
  updateFeature: (architectureId: number, featureId: number, data: any) =>
      http.put<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/features/${featureId}`, data),
  deleteFeature: (architectureId: number, featureId: number) =>
      http.delete<{ success: boolean }>(`/admin/architectures/${architectureId}/features/${featureId}`),
  batchDeleteFeatures: (architectureId: number, ids: number[]) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/features/batch-delete`, { ids }),

  // 文化意义 (cultural_significance)
  getCulture: (architectureId: number) =>
      http.get<{ success: boolean; data: any[] }>(`/admin/architectures/${architectureId}/culture`),
  createCulture: (architectureId: number, data: any) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/culture`, data),
  updateCulture: (architectureId: number, cultureId: number, data: any) =>
      http.put<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/culture/${cultureId}`, data),
  deleteCulture: (architectureId: number, cultureId: number) =>
      http.delete<{ success: boolean }>(`/admin/architectures/${architectureId}/culture/${cultureId}`),
  batchDeleteCulture: (architectureId: number, ids: number[]) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/culture/batch-delete`, { ids }),

  // 专家观点 (expert_quotes)
  getExperts: (architectureId: number) =>
      http.get<{ success: boolean; data: any[] }>(`/admin/architectures/${architectureId}/experts`),
  createExpert: (architectureId: number, data: any) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/experts`, data),
  updateExpert: (architectureId: number, expertId: number, data: any) =>
      http.put<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/experts/${expertId}`, data),
  deleteExpert: (architectureId: number, expertId: number) =>
      http.delete<{ success: boolean }>(`/admin/architectures/${architectureId}/experts/${expertId}`),
  batchDeleteExperts: (architectureId: number, ids: number[]) =>
      http.post<{ success: boolean; data: any }>(`/admin/architectures/${architectureId}/experts/batch-delete`, { ids }),
};

// 知识库API
export const knowledgeApi = {
  getAll: (category?: string) =>
      http.get<{ success: boolean; data: any[] }>('/knowledge', { category }),
  getById: (id: number) =>
      http.get<{ success: boolean; data: any }>(`/knowledge/${id}`),
  search: (query: string, limit = 10) =>
      http.get<{ success: boolean; data: any[] }>('/knowledge/search/query', { q: query, limit }),
  getCategories: () =>
      http.get<{ success: boolean; data: string[] }>('/knowledge/categories'),
  getStats: () =>
      http.get<{ success: boolean; data: { total: number; categories: number; verified: number } }>('/knowledge/stats'),
  initialize: () =>
      http.post<{ success: boolean; data: any }>('/knowledge/init'),
};

export const knowledgeGraphApi = {
  getTopics: (params?: { page?: number; pageSize?: number; category?: string }) =>
      http.get<{ success: boolean; data: any[]; meta?: { total: number; page: number; pageSize: number } }>('/knowledge-graph/topics', params),
  getTopicById: (id: number) =>
      http.get<{ success: boolean; data: any }>(`/knowledge-graph/topics/${id}`),
  searchTopics: (query: string) =>
      http.get<{ success: boolean; data: any[] }>('/knowledge-graph/search', { q: query }),
  getCategories: () =>
      http.get<{ success: boolean; data: { name: string; count: number }[] }>('/knowledge-graph/categories'),
  getNeighbors: (id: number, relationType?: string) =>
      http.get<{ success: boolean; data: any[] }>(`/knowledge-graph/topics/${id}/neighbors`, { relationType }),
  findPaths: (from: number, to: number, maxHops?: number) =>
      http.get<{ success: boolean; data: any[]; error?: { message: string } }>('/knowledge-graph/paths', { from, to, maxHops }),
  getStats: () =>
      http.get<{ success: boolean; data: any }>('/knowledge-graph/stats'),
};

export const knowledgeEnhancedApi = {
  inference: (data: { query: string; injectionDepth?: number }) =>
      http.post<{ success: boolean; data: any; error?: { message: string } }>('/knowledge-enhanced/inference', data),
  pathReasoning: (data: { fromTopicId: number; toTopicId: number; maxHops?: number }) =>
      http.post<{ success: boolean; data: any[]; error?: { message: string } }>('/knowledge-enhanced/path-reasoning', data),
  generateTrainingData: (data: { topicId: number; sampleCount?: number }) =>
      http.post<{ success: boolean; data: any }>('/knowledge-enhanced/generate-training-data', data),
  createTrainingTask: (data: { name: string; description?: string; trainingDataId?: number }) =>
      http.post<{ success: boolean; data: any }>('/knowledge-enhanced/training-tasks', data),
  getTrainingTasks: (params?: { status?: string; page?: number; pageSize?: number }) =>
      http.get<{ success: boolean; data: any[]; meta?: { total: number; page: number; pageSize: number } }>('/knowledge-enhanced/training-tasks', params),
  getTrainingTaskById: (id: number) =>
      http.get<{ success: boolean; data: any }>(`/knowledge-enhanced/training-tasks/${id}`),
  cancelTrainingTask: (id: number) =>
      http.delete<{ success: boolean; data: any }>(`/knowledge-enhanced/training-tasks/${id}`),
};
