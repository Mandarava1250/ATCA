// ============================================
// 华夏营造 - Mock API服务
// 支持前端独立开发，无需后端服务
// ============================================

import type { ApiResponse } from '@/types/api';

// 延迟函数，模拟网络延迟
const delay = (ms: number = 500): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock用户数据
const mockUser = {
  userId: 1,
  username: 'testuser',
  nickname: '古建筑爱好者',
  email: 'test@example.com',
  role: 'user',
  avatarUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
};

// Mock古建筑数据
const mockArchitectures = [
  {
    architecture_id: 1,
    name: '太和殿',
    chinese_name: '太和殿',
    location: '北京',
    coordinates: '39.9163,116.3972',
    type: '宫殿',
    founding_dynasty: '明',
    completed_dynasty: '清',
    protection_level: '世界文化遗产',
    brief_description: '故宫核心建筑，中国现存最大的木结构大殿',
    full_description: '太和殿俗称金銮殿，位于北京紫禁城南北主轴线的显要位置，是中国现存最大的木结构大殿。',
    main_image_url: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    view_count: 12500,
    favorite_count: 3200,
  },
  {
    architecture_id: 2,
    name: '祈年殿',
    chinese_name: '祈年殿',
    location: '北京',
    coordinates: '39.8822,116.4066',
    type: '祭祀建筑',
    founding_dynasty: '明',
    completed_dynasty: '明',
    protection_level: '世界文化遗产',
    brief_description: '天坛主体建筑，圆形攒尖顶建筑的代表',
    full_description: '祈年殿是北京天坛的主体建筑，为明清两代皇帝孟春祈谷之所。',
    main_image_url: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    view_count: 9800,
    favorite_count: 2800,
  },
  {
    architecture_id: 3,
    name: '佛光寺东大殿',
    chinese_name: '佛光寺东大殿',
    location: '山西五台',
    coordinates: null,
    type: '寺庙',
    founding_dynasty: '唐',
    completed_dynasty: '唐',
    protection_level: '全国重点文物保护单位',
    brief_description: '中国现存最早的木构建筑之一',
    full_description: '佛光寺东大殿建于唐大中十一年（857年），是中国现存最早的木构建筑之一。',
    main_image_url: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    view_count: 6500,
    favorite_count: 2100,
  },
];

// Mock问答题目
const mockQuestions = [
  {
    question_id: 1,
    question_text: '中国现存最大的木结构大殿是？',
    option_a: '太和殿',
    option_b: '祈年殿',
    option_c: '佛光寺东大殿',
    option_d: '晋祠圣母殿',
    correct_answer: 'A',
    explanation: '太和殿俗称金銮殿，是中国现存最大的木结构大殿。',
    difficulty: '入门',
    points: 10,
    category: '宫殿',
  },
  {
    question_id: 2,
    question_text: '天坛祈年殿的屋顶瓦片颜色是？',
    option_a: '黄色',
    option_b: '蓝色',
    option_c: '绿色',
    option_d: '红色',
    correct_answer: 'B',
    explanation: '祈年殿的瓦为蓝色，象征蓝天。',
    difficulty: '入门',
    points: 10,
    category: '祭祀建筑',
  },
];

// Mock竞赛模式
const mockCompetitionModes = [
  {
    mode_id: 'entry',
    title: '入门模式',
    description: '5道简单题目，适合初学者',
    difficulty: '入门',
    time_limit: 180,
    icon: '🌱',
    is_active: true,
    sort_order: 1,
  },
  {
    mode_id: 'basic',
    title: '基础模式',
    description: '8道基础题目，巩固知识',
    difficulty: '基础',
    time_limit: 240,
    icon: '📚',
    is_active: true,
    sort_order: 2,
  },
];

// 认证API Mock
export const mockAuthApi = {
  register: async (data: { username: string; password: string; email: string }) => {
    await delay();
    return {
      success: true,
      data: {
        user: { ...mockUser, username: data.username, email: data.email },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      },
    };
  },

  login: async (data: { username: string; password: string }) => {
    await delay();
    return {
      success: true,
      data: {
        user: mockUser,
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      },
    };
  },

  logout: async () => {
    await delay();
    return { success: true, data: null };
  },

  me: async () => {
    await delay();
    return { success: true, data: mockUser };
  },

  getProfile: async () => {
    await delay();
    return { success: true, data: mockUser };
  },

  refresh: async (refreshToken: string) => {
    await delay();
    return {
      success: true,
      data: {
        accessToken: 'mock-refreshed-access-token',
        refreshToken: refreshToken,
      },
    };
  },

  updateProfile: async (data: any) => {
    await delay();
    return { success: true, data: { ...mockUser, ...data } };
  },

  changePassword: async (data: { oldPassword: string; newPassword: string }) => {
    await delay();
    return { success: true, data: null };
  },

  uploadAvatar: async (formData: FormData) => {
    await delay();
    return { success: true, data: { avatarUrl: '/mock-avatar.jpg' } };
  },
};

// 古建筑API Mock
export const mockArchitectureApi = {
  list: async (params?: any) => {
    await delay();
    const page = parseInt(params?.page || '1');
    const limit = parseInt(params?.limit || '10');
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      success: true,
      data: mockArchitectures.slice(start, end),
      meta: {
        total: mockArchitectures.length,
        totalPages: Math.ceil(mockArchitectures.length / limit),
        page,
        limit,
      },
    };
  },

  detail: async (id: number) => {
    await delay();
    const item = mockArchitectures.find(a => a.architecture_id === id);
    if (item) {
      return { success: true, data: item };
    }
    return { success: false, error: { message: '建筑不存在' }, data: null };
  },

  search: async (q: string) => {
    await delay();
    const results = mockArchitectures.filter(a => 
      a.name.includes(q) || a.chinese_name.includes(q)
    );
    return { success: true, data: results };
  },

  stats: async () => {
    await delay();
    return {
      success: true,
      data: {
        total: mockArchitectures.length,
        dynasties: 3,
        regions: 2,
      },
    };
  },

  dynasties: async () => {
    await delay();
    return {
      success: true,
      data: [
        { dynasty_name: '唐', start_year: 618, end_year: 907 },
        { dynasty_name: '明', start_year: 1368, end_year: 1644 },
        { dynasty_name: '清', start_year: 1644, end_year: 1912 },
      ],
    };
  },

  types: async () => {
    await delay();
    return { success: true, data: ['宫殿', '寺庙', '祭祀建筑'] };
  },

  popular: async () => {
    await delay();
    return { success: true, data: mockArchitectures.slice(0, 3) };
  },

  featured: async () => {
    await delay();
    return { success: true, data: mockArchitectures.slice(0, 3) };
  },

  favorite: async (id: number) => {
    await delay();
    return { success: true, data: { favorited: true } };
  },

  unfavorite: async (id: number) => {
    await delay();
    return { success: true, data: { favorited: false } };
  },
};

// 竞赛API Mock
export const mockQuizApi = {
  getModes: async () => {
    await delay();
    return { success: true, data: mockCompetitionModes };
  },

  getQuestions: async (mode: string) => {
    await delay();
    return {
      success: true,
      data: {
        sessionId: `session-${Date.now()}`,
        questions: mockQuestions,
      },
    };
  },

  submit: async (data: { sessionId: string; answers: Record<number, string> }) => {
    await delay();
    let correct = 0;
    mockQuestions.forEach(q => {
      if (data.answers[q.question_id] === q.correct_answer) {
        correct++;
      }
    });
    return {
      success: true,
      data: {
        score: correct * 10,
        totalQuestions: mockQuestions.length,
        correctAnswers: correct,
        sessionId: data.sessionId,
      },
    };
  },

  getUserStats: async () => {
    await delay();
    return {
      success: true,
      data: {
        totalPoints: 1250,
        gamesPlayed: 15,
        accuracy: 78,
        currentLevel: 5,
      },
    };
  },

  getHistory: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          quiz_id: 1,
          mode: 'entry',
          score: 50,
          totalQuestions: 5,
          correctAnswers: 5,
          completedAt: '2024-01-15T10:30:00Z',
        },
      ],
    };
  },

  getLeaderboard: async () => {
    await delay();
    return {
      success: true,
      data: [
        { rank: 1, user_id: 1, username: '建筑达人', nickname: '🏆', avatar: null, total_points: 2580 },
        { rank: 2, user_id: 2, username: '古建爱好者', nickname: '🥈', avatar: null, total_points: 1920 },
        { rank: 3, user_id: 3, username: '新手入门', nickname: '🥉', avatar: null, total_points: 860 },
      ],
    };
  },
};

// AI助手API Mock
export const mockAssistantApi = {
  chat: async (message: string) => {
    await delay(1000);
    return {
      success: true,
      data: {
        content: `这是对"${message}"的AI回复。中国古代建筑有着悠久的历史和丰富的文化内涵...`,
        ai_id: 1,
        ai_name: '华夏AI助手',
      },
    };
  },

  chatStream: async (message: string) => {
    await delay(500);
    return { success: true, data: {} };
  },

  getAIList: async () => {
    await delay();
    return {
      success: true,
      data: [
        { ai_id: 1, name: '华夏AI助手', provider: 'kimi', model: 'moonshot-v1-8k', is_active: true },
        { ai_id: 2, name: '智能顾问', provider: 'openai', model: 'gpt-3.5-turbo', is_active: true },
      ],
    };
  },

  getHistory: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          message_id: 1,
          role: 'user',
          content: '什么是榫卯结构？',
          timestamp: '2024-01-15T09:00:00Z',
        },
        {
          message_id: 2,
          role: 'assistant',
          content: '榫卯结构是中国古代建筑中使用的一种连接方式...',
          timestamp: '2024-01-15T09:00:05Z',
        },
      ],
    };
  },

  clearHistory: async () => {
    await delay();
    return { success: true, data: null };
  },

  getAllList: async () => {
    await delay();
    return {
      success: true,
      data: [
        { ai_id: 1, name: '华夏AI助手', provider: 'kimi', model: 'moonshot-v1-8k', is_active: true },
        { ai_id: 2, name: '智能顾问', provider: 'openai', model: 'gpt-3.5-turbo', is_active: true },
      ],
    };
  },

  testAI: async (id: number, message?: string) => {
    await delay(1000);
    return {
      success: true,
      data: {
        content: `这是AI ${id} 对"${message || '测试消息'}"的测试回复`,
      },
    };
  },

  evaluateMultiAI: async (question: string, aiResponses: Array<{ aiId: string; aiName: string; content: string }>) => {
    await delay(1500);
    return {
      success: true,
      data: {
        evaluation: 'AI回答质量评估结果',
        scores: aiResponses.map(ai => ({
          aiId: ai.aiId,
          aiName: ai.aiName,
          score: Math.floor(Math.random() * 30) + 70,
        })),
      },
    };
  },
};

// 首页API Mock
export const mockIndexApi = {
  getDashboard: async () => {
    await delay();
    return {
      success: true,
      data: {
        stats: {
          totalUsers: 12580,
          totalArchitectures: 520,
          totalQuizzes: 1560,
          totalActivities: 28,
        },
        recentActivities: [],
        featuredBuildings: mockArchitectures.slice(0, 3),
      },
    };
  },

  getRandomCards: async (count?: number) => {
    await delay();
    const limit = count || 4;
    return { success: true, data: mockArchitectures.slice(0, limit) };
  },

  getLeaderboard: async () => {
    await delay();
    return {
      success: true,
      data: [
        { rank: 1, user_id: 1, username: '建筑达人', total_points: 2580 },
        { rank: 2, user_id: 2, username: '古建爱好者', total_points: 1920 },
      ],
    };
  },

  getStats: async () => {
    await delay();
    return {
      success: true,
      data: {
        totalUsers: 12580,
        totalArchitectures: 520,
        todayVisitors: 320,
        activeUsers: 156,
      },
    };
  },
};

// 社交API Mock
export const mockSocialApi = {
  getComments: async (targetType: string, targetId: number) => {
    await delay();
    return {
      success: true,
      data: [
        {
          comment_id: 1,
          user_id: 1,
          username: '游客A',
          content: '这是一个很棒的古建筑！',
          created_at: '2024-01-15T08:00:00Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20 },
    };
  },

  postComment: async (data: { target_type: string; target_id: number; content: string }) => {
    await delay();
    return { success: true, data: { comment_id: 2 } };
  },

  toggleLike: async (targetType: string, targetId: number) => {
    await delay();
    return { success: true, data: { liked: true } };
  },

  getMuteStatus: async () => {
    await delay();
    return { success: true, data: { is_muted: false, mute_reason: '' } };
  },

  deleteComment: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  getMyComments: async (page = 1, limit = 20) => {
    await delay();
    return {
      success: true,
      data: [{ comment_id: 1, content: '我的评论' }],
      meta: { total: 1, page, limit },
    };
  },

  getBuildingShares: async (search?: string, era?: string, buildingType?: string, featured?: boolean, page = 1, limit = 20) => {
    await delay();
    return {
      success: true,
      data: [{ share_id: 1, title: '建筑分享' }],
      meta: { total: 1, page, limit },
    };
  },

  getBuildingShare: async (id: number) => {
    await delay();
    return { success: true, data: { share_id: id, title: '建筑分享' } };
  },

  createBuildingShare: async (data: any) => {
    await delay();
    return { success: true, data: { share_id: 999 } };
  },

  syncPublicModels: async () => {
    await delay();
    return { success: true, data: { synced: 5 } };
  },

  getAllTopics: async () => {
    await delay();
    return { success: true, data: [{ topic_id: 1, title: '论坛帖子' }] };
  },

  deleteTopicAdmin: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  deleteReplyAdmin: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  getMyContent: async () => {
    await delay();
    return { success: true, data: { topics: [], replies: [] } };
  },

  createShare: async (data: any) => {
    await delay();
    return { success: true, data: { share_id: 999 } };
  },

  deleteShare: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  updateShare: async (id: number, data: any) => {
    await delay();
    return { success: true, data: { share_id: id, ...data } };
  },

  getPublicNotes: async (params?: { page?: number; limit?: number }) => {
    await delay();
    return { success: true, data: [{ note_id: 1, title: '笔记' }], meta: { total: 1 } };
  },

  createNote: async (data: any) => {
    await delay();
    return { success: true, data: { note_id: 999 } };
  },

  deleteNote: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  getForumBoards: async () => {
    await delay();
    return { success: true, data: [{ board_id: 1, name: '古建筑讨论' }] };
  },

  getForumTopics: async (boardId?: number, page = 1, limit = 20) => {
    await delay();
    return { success: true, data: [{ topic_id: 1, title: '帖子' }], meta: { total: 1, page, limit } };
  },

  getForumTopic: async (id: number) => {
    await delay();
    return { success: true, data: { topic: { topic_id: id, title: '帖子' }, replies: [] } };
  },

  createForumTopic: async (data: { board_id: number; title: string; content: string }) => {
    await delay();
    return { success: true, data: { topic_id: 999 } };
  },

  createForumReply: async (data: { topic_id: number; content: string }) => {
    await delay();
    return { success: true, data: { reply_id: 999 } };
  },
};

// 管理员API Mock
export const mockAdminApi = {
  getDashboard: async () => {
    await delay();
    return {
      success: true,
      data: {
        totalUsers: 12580,
        totalArchitectures: 520,
        totalQuestions: 320,
        totalReports: 5,
      },
    };
  },

  getUsers: async (params?: any) => {
    await delay();
    return {
      success: true,
      data: [mockUser],
      meta: { total: 1, page: 1, limit: 10 },
    };
  },

  createUser: async (data: any) => {
    await delay();
    return { success: true, data: { user_id: Date.now(), ...data } };
  },

  getAIConfigs: async () => {
    await delay();
    return {
      success: true,
      data: [
        { ai_id: 1, name: '华夏AI助手', provider: 'kimi', model: 'moonshot-v1-8k', is_active: true },
      ],
    };
  },

  getUserGrowth: async (days?: number) => {
    await delay();
    return {
      success: true,
      data: {
        dates: ['2024-01-01', '2024-01-02', '2024-01-03'],
        userCounts: [100, 120, 150],
        dauCounts: [50, 60, 75],
      },
    };
  },

  updateUser: async (id: number, data: any) => {
    await delay();
    return { success: true, data: { user_id: id, ...data } };
  },

  deleteUser: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  batchDeleteUsers: async (ids: number[]) => {
    await delay();
    return { success: true, data: { deleted: ids.length } };
  },

  batchUpdateUserRole: async (ids: number[], role: string) => {
    await delay();
    return { success: true, data: { updated: ids.length } };
  },

  batchUpdateUserStatus: async (ids: number[], is_active: boolean) => {
    await delay();
    return { success: true, data: { updated: ids.length } };
  },

  getArchitectures: async (params?: any) => {
    await delay();
    return { success: true, data: mockArchitectures, meta: { total: mockArchitectures.length } };
  },

  batchDeleteArchitectures: async (ids: number[]) => {
    await delay();
    return { success: true, data: { deleted: ids.length } };
  },

  createArchitecture: async (data: any) => {
    await delay();
    return { success: true, data: { architecture_id: 999, ...data } };
  },

  updateArchitecture: async (id: number, data: any) => {
    await delay();
    return { success: true, data: { architecture_id: id, ...data } };
  },

  deleteArchitecture: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  getQuestions: async (params?: any) => {
    await delay();
    return { success: true, data: mockQuestions, meta: { total: mockQuestions.length } };
  },

  batchDeleteQuestions: async (ids: number[]) => {
    await delay();
    return { success: true, data: { deleted: ids.length } };
  },

  createQuestion: async (data: any) => {
    await delay();
    return { success: true, data: { question_id: 999, ...data } };
  },

  updateQuestion: async (id: number, data: any) => {
    await delay();
    return { success: true, data: { question_id: id, ...data } };
  },

  deleteQuestion: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  getCompetitionModes: async () => {
    await delay();
    return { success: true, data: [{ mode: 'challenge', name: '挑战模式' }] };
  },

  updateCompetitionMode: async (id: string, data: any) => {
    await delay();
    return { success: true, data: { mode: id, ...data } };
  },

  createAIConfig: async (data: any) => {
    await delay();
    return { success: true, data: { ai_id: 999, ...data } };
  },

  updateAIConfig: async (id: number, data: any) => {
    await delay();
    return { success: true, data: { ai_id: id, ...data } };
  },

  deleteAIConfig: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  getActivities: async (params?: any) => {
    await delay();
    return { success: true, data: [{ activity_id: 1, title: '活动' }] };
  },

  createActivity: async (data: any) => {
    await delay();
    return { success: true, data: { activity_id: 999, ...data } };
  },

  updateActivity: async (id: number, data: any) => {
    await delay();
    return { success: true, data: { activity_id: id, ...data } };
  },

  deleteActivity: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  getModels: async (params?: any) => {
    await delay();
    return { success: true, data: [{ model_id: 1, name: '模型' }], meta: { total: 1 } };
  },

  getFeaturedTemplates: async () => {
    await delay();
    return { success: true, data: [{ template_id: 1, name: '模板' }] };
  },

  batchDeleteModels: async (ids: number[]) => {
    await delay();
    return { success: true, data: { deleted: ids.length } };
  },

  getFeaturedModels: async () => {
    await delay();
    return { success: true, data: [{ model_id: 1, name: '精选模型' }] };
  },

  toggleModelFeatured: async (id: number, is_featured: boolean, source?: string) => {
    await delay();
    return { success: true, data: { model_id: id, is_featured } };
  },

  deleteModel: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  getDailyChallenges: async (params?: any) => {
    await delay();
    return { success: true, data: [{ challenge_id: 1, title: '每日挑战' }] };
  },

  createDailyChallenge: async (data: any) => {
    await delay();
    return { success: true, data: { challenge_id: 999, ...data } };
  },

  updateDailyChallenge: async (id: number, data: any) => {
    await delay();
    return { success: true, data: { challenge_id: id, ...data } };
  },

  deleteDailyChallenge: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  batchCreateDailyChallenges: async (items: any[]) => {
    await delay();
    return { success: true, data: { created: items.length } };
  },

  batchDeleteDailyChallenges: async (ids: number[]) => {
    await delay();
    return { success: true, data: { deleted: ids.length } };
  },

  testAI: async (id: number, message: string) => {
    await delay(1000);
    return { success: true, data: { content: `AI ${id} 测试回复: ${message}` } };
  },

  muteUser: async (id: number, data: { is_muted: boolean; mute_reason?: string }) => {
    await delay();
    return { success: true, data: { user_id: id, ...data } };
  },

  getAllList: async () => {
    await delay();
    return { success: true, data: [{ ai_id: 1, name: '华夏AI助手' }] };
  },

  getAIList: async () => {
    await delay();
    return { success: true, data: [{ ai_id: 1, name: '华夏AI助手' }] };
  },

  batchImportModels: async (models: any[]) => {
    await delay();
    return { success: true, data: { imported: models.length } };
  },

  getAllTopics: async () => {
    await delay();
    return { success: true, data: [{ topic_id: 1, title: '论坛帖子' }] };
  },

  deleteTopicAdmin: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  deleteReplyAdmin: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  // 知识图谱数据导入
  importKnowledgeGraph: async (data: { format: string; data: string; conflictStrategy: string; validateOnly: boolean; batchSize: number }) => {
    await delay(1000);
    return {
      success: true,
      data: {
        imported: 10,
        skipped: 2,
        failed: 0,
      },
    };
  },
};

// 活动API Mock
export const mockActivityApi = {
  getActivities: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          activity_id: 1,
          title: '古建筑摄影大赛',
          description: '分享你拍摄的中国古建筑照片',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          activity_type: '比赛',
          reward_points: 500,
          is_active: true,
        },
      ],
    };
  },

  getAchievements: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          achievement_id: 1,
          achievement_name: '初出茅庐',
          description: '完成首次知识竞赛',
          icon: '🌱',
        },
        {
          achievement_id: 2,
          achievement_name: '建筑达人',
          description: '累计获得1000积分',
          icon: '🏛️',
        },
      ],
    };
  },

  getUserAchievements: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          achievement_id: 1,
          achievement_name: '初出茅庐',
          unlocked_at: '2024-01-10T00:00:00Z',
        },
      ],
    };
  },

  getDailyTasks: async () => {
    await delay();
    return {
      success: true,
      data: [
        { task_id: 1, title: '完成一次知识竞赛', points: 20, completed: false },
        { task_id: 2, title: '浏览3个古建筑', points: 10, completed: true },
      ],
    };
  },

  getActivityDetail: async (id: string | number) => {
    await delay();
    return {
      success: true,
      data: {
        activity_id: id,
        title: '古建筑摄影大赛',
        description: '分享你拍摄的中国古建筑照片',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        activity_type: '比赛',
        reward_points: 500,
        is_active: true,
      },
    };
  },

  joinActivity: async (id: number) => {
    await delay();
    return { success: true, data: { joined: true, activity_id: id } };
  },
};

// 知识库API Mock
export const mockKnowledgeApi = {
  getAll: async (category?: string) => {
    await delay();
    return {
      success: true,
      data: [
        {
          knowledge_id: 1,
          title: '榫卯结构',
          category: '建筑技术',
          content: '榫卯是中国古代建筑中使用的一种连接方式...',
        },
        {
          knowledge_id: 2,
          title: '斗拱',
          category: '建筑构件',
          content: '斗拱是中国传统建筑中特有的结构构件...',
        },
      ],
    };
  },

  search: async (query: string) => {
    await delay();
    return {
      success: true,
      data: [
        {
          knowledge_id: 1,
          title: '榫卯结构',
          category: '建筑技术',
          content: '榫卯是中国古代建筑中使用的一种连接方式...',
        },
      ],
    };
  },

  getCategories: async () => {
    await delay();
    return { success: true, data: ['建筑技术', '建筑构件', '历史文化'] };
  },

  getStats: async () => {
    await delay();
    return {
      success: true,
      data: { total: 50, categories: 8, verified: 45 },
    };
  },

  getById: async (id: number) => {
    await delay();
    return {
      success: true,
      data: {
        knowledge_id: id,
        title: '榫卯结构',
        category: '建筑技术',
        content: '榫卯是中国古代建筑中使用的一种连接方式...',
      },
    };
  },

  initialize: async () => {
    await delay();
    return { success: true, data: { initialized: true } };
  },
};

// 国际化API Mock
export const mockI18nApi = {
  getLanguages: async () => {
    await delay();
    return {
      success: true,
      data: [
        { lang_code: 'zh', lang_name: '中文', is_active: true },
        { lang_code: 'en', lang_name: 'English', is_active: true },
      ],
    };
  },

  getTranslation: async (entityType: string, entityId: number) => {
    await delay();
    return {
      success: true,
      data: {
        name: { text: 'Hall of Supreme Harmony', isMachine: false },
        description: { text: 'The largest wooden hall in China...', isMachine: false },
      },
    };
  },

  getTranslationsBatch: async (entityType: string, entityIds: number[], language = 'en') => {
    await delay();
    const result: Record<string, Record<string, { text: string; isMachine: boolean }>> = {};
    entityIds.forEach(id => {
      result[String(id)] = {
        name: { text: `Translated name for ${id}`, isMachine: true },
        description: { text: `Translated description for ${id}`, isMachine: true },
      };
    });
    return { success: true, data: result };
  },

  saveTranslation: async (data: any) => {
    await delay();
    return { success: true, data };
  },

  autoTranslate: async (data: { entity_type?: string; entity_id?: number; field_name?: string; source_text: string; target_lang?: string }) => {
    await delay();
    return {
      success: true,
      data: {
        translated_text: `[Auto-translated] ${data.source_text}`,
        is_machine_translated: true,
      },
    };
  },
};

// 3D模型API Mock
export const mockModel3dApi = {
  list: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          model_id: 1,
          name: '三开间民居',
          category: '民居',
          thumbnail_url: null,
          created_at: '2024-01-01',
        },
      ],
      meta: { total: 1, page: 1, limit: 10 },
    };
  },

  getComponents: async () => {
    await delay();
    return {
      success: true,
      data: [
        { definition_id: 1, type: 'pillar_round', name: '圆柱', category: 'pillar' },
        { definition_id: 2, type: 'beam_main', name: '主梁', category: 'beam' },
      ],
    };
  },

  getTemplates: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          template_id: 1,
          template_name: '三开间硬山顶民居',
          category: '民居',
          era: '明清',
        },
      ],
    };
  },

  getTemplate: async (id: number) => {
    await delay();
    return {
      success: true,
      data: {
        template_id: id,
        template_name: '三开间硬山顶民居',
        category: '民居',
        era: '明清',
        components: [],
      },
    };
  },

  saveModel: async (data: any) => {
    await delay();
    return {
      success: true,
      data: { model_id: 999, ...data },
    };
  },

  getMyModels: async () => {
    await delay();
    return {
      success: true,
      data: [
        { model_id: 1, name: '我的第一个模型', created_at: '2024-01-10' },
      ],
    };
  },

  getModel: async (id: number) => {
    await delay();
    return {
      success: true,
      data: {
        model_id: id,
        name: '三开间民居',
        category: '民居',
        created_at: '2024-01-01',
      },
    };
  },

  updateModel: async (id: number, data: any) => {
    await delay();
    return { success: true, data: { model_id: id, ...data } };
  },

  deleteModel: async (id: number) => {
    await delay();
    return { success: true, data: null };
  },

  exportModel: async (id: number) => {
    await delay();
    const blob = new Blob(['mock model data'], { type: 'model/gltf-binary' });
    return {
      data: blob,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'model/gltf-binary' },
      config: { headers: { 'Content-Type': 'application/octet-stream' } },
    } as any;
  },
};

// 个人资料API Mock
export const mockProfileApi = {
  getProfile: async () => {
    await delay();
    return { success: true, data: mockUser };
  },

  getFavorites: async () => {
    await delay();
    return { success: true, data: mockArchitectures.slice(0, 2) };
  },

  getModels: async () => {
    await delay();
    return {
      success: true,
      data: [
        { model_id: 1, name: '我的第一个模型', created_at: '2024-01-10' },
      ],
    };
  },

  getPoints: async () => {
    await delay();
    return {
      success: true,
      data: [
        { point_id: 1, source: 'quiz', points: 50, earned_at: '2024-01-15T10:00:00Z' },
      ],
    };
  },

  updateSettings: async (data: any) => {
    await delay();
    return { success: true, data: { ...mockUser, ...data } };
  },
};

// 统一导出所有Mock API
export const mockApi = {
  auth: mockAuthApi,
  architecture: mockArchitectureApi,
  quiz: mockQuizApi,
  assistant: mockAssistantApi,
  index: mockIndexApi,
  social: mockSocialApi,
  admin: mockAdminApi,
  activity: mockActivityApi,
  knowledge: mockKnowledgeApi,
  i18n: mockI18nApi,
  model3d: mockModel3dApi,
  profile: mockProfileApi,
};
