// ============================================
// 筑见山河 - API工厂
// 根据环境变量自动选择真实API或Mock API
// ============================================

import * as realApi from './api';
import * as mockApi from './mockApi';

// 判断是否使用Mock模式
const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// API服务类型定义
interface ApiServices {
  auth: typeof realApi.authApi;
  architecture: typeof realApi.architectureApi;
  quiz: typeof realApi.quizApi;
  assistant: typeof realApi.assistantApi;
  model3d: typeof realApi.model3dApi;
  social: typeof realApi.socialApi;
  i18n: typeof realApi.i18nApi;
  profile: typeof realApi.profileApi;
  index: typeof realApi.indexApi;
  admin: typeof realApi.adminApi;
  activity: typeof realApi.activityApi;
  knowledge: typeof realApi.knowledgeApi;
  knowledgeGraph: typeof realApi.knowledgeGraphApi;
  knowledgeEnhanced: typeof realApi.knowledgeEnhancedApi;
}

// 创建API服务实例
export const api = {
  auth: useMock ? mockApi.mockAuthApi : realApi.authApi,
  architecture: useMock ? mockApi.mockArchitectureApi : realApi.architectureApi,
  quiz: useMock ? mockApi.mockQuizApi : realApi.quizApi,
  assistant: useMock ? mockApi.mockAssistantApi : realApi.assistantApi,
  model3d: useMock ? mockApi.mockModel3dApi : realApi.model3dApi,
  social: (useMock ? mockApi.mockSocialApi : realApi.socialApi) as typeof realApi.socialApi,
  i18n: useMock ? mockApi.mockI18nApi : realApi.i18nApi,
  profile: useMock ? mockApi.mockProfileApi : realApi.profileApi,
  index: useMock ? mockApi.mockIndexApi : realApi.indexApi,
  admin: useMock ? mockApi.mockAdminApi : realApi.adminApi,
  activity: useMock ? mockApi.mockActivityApi : realApi.activityApi,
  knowledge: useMock ? mockApi.mockKnowledgeApi : realApi.knowledgeApi,
  knowledgeGraph: useMock ? mockApi.mockKnowledgeGraphApi : realApi.knowledgeGraphApi,
  knowledgeEnhanced: useMock ? mockApi.mockKnowledgeEnhancedApi : realApi.knowledgeEnhancedApi,
} as ApiServices;

// 导出HTTP工具函数
export { http, API_BASE, API_HOST } from './api';

// 导出是否使用Mock的标识
export const isMockMode = useMock;

// 在开发环境中输出提示
if (import.meta.env.DEV) {
  console.log(`[API Factory] 当前模式: ${useMock ? 'Mock模式' : '真实API模式'}`);
}
