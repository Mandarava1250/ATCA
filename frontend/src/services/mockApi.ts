// ============================================
// 筑见山河 - Mock API服务
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

// 成就API Mock
export const mockAchievementApi = {
  getAchievements: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          achievement_id: 1,
          name: '初出茅庐',
          description: '完成首次知识竞赛',
          icon: '🌱',
          condition_type: 'quiz_first',
          condition_value: 1,
          points: 50,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          achievement_id: 2,
          name: '知识渊博',
          description: '累计答题100次',
          icon: '📚',
          condition_type: 'quiz_count',
          condition_value: 100,
          points: 200,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          achievement_id: 3,
          name: '建筑达人',
          description: '累计获得1000积分',
          icon: '🏆',
          condition_type: 'points_total',
          condition_value: 1000,
          points: 500,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          achievement_id: 4,
          name: '建筑收藏家',
          description: '收藏10个古建筑',
          icon: '❤️',
          condition_type: 'favorites_count',
          condition_value: 10,
          points: 150,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          achievement_id: 5,
          name: '3D创造者',
          description: '上传第一个3D模型',
          icon: '🧩',
          condition_type: 'model_upload',
          condition_value: 1,
          points: 300,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          achievement_id: 6,
          name: '社区活跃者',
          description: '发布10篇社区帖子',
          icon: '💬',
          condition_type: 'community_post',
          condition_value: 10,
          points: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          achievement_id: 7,
          name: '签到达人',
          description: '连续签到30天',
          icon: '📅',
          condition_type: 'check_in',
          condition_value: 30,
          points: 250,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          achievement_id: 8,
          name: '建筑探险家',
          description: '浏览50个古建筑',
          icon: '🔍',
          condition_type: 'architecture_view',
          condition_value: 50,
          points: 180,
          is_active: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    };
  },

  getAchievementById: async (id: number) => {
    await delay();
    const achievements = [
      {
        achievement_id: 1,
        name: '初出茅庐',
        description: '完成首次知识竞赛',
        icon: '🌱',
        condition_type: 'quiz_first',
        condition_value: 1,
        points: 50,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        achievement_id: 2,
        name: '知识渊博',
        description: '累计答题100次',
        icon: '📚',
        condition_type: 'quiz_count',
        condition_value: 100,
        points: 200,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];
    const achievement = achievements.find(a => a.achievement_id === id);
    if (achievement) {
      return { success: true, data: achievement };
    }
    return { success: false, error: { message: '成就不存在' }, data: null };
  },

  createAchievement: async (data: any) => {
    await delay();
    return {
      success: true,
      data: {
        achievement_id: Date.now(),
        ...data,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  },

  updateAchievement: async (id: number, data: any) => {
    await delay();
    return {
      success: true,
      data: {
        achievement_id: id,
        name: data.name || '未命名成就',
        description: data.description || '',
        icon: data.icon || '🏆',
        condition_type: data.condition_type || 'quiz_first',
        condition_value: data.condition_value || 1,
        points: data.points || 100,
        is_active: data.is_active ?? true,
        updated_at: new Date().toISOString(),
      },
    };
  },

  deleteAchievement: async (id: number) => {
    await delay();
    return { success: true, message: '成就删除成功' };
  },

  getUserAchievements: async () => {
    await delay();
    return {
      success: true,
      data: [
        {
          user_achievement_id: 1,
          user_id: 1,
          achievement_id: 1,
          achievement: {
            achievement_id: 1,
            name: '初出茅庐',
            description: '完成首次知识竞赛',
            icon: '🌱',
            condition_type: 'quiz_first',
            condition_value: 1,
            points: 50,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          unlocked_at: '2024-01-10T10:30:00Z',
        },
        {
          user_achievement_id: 2,
          user_id: 1,
          achievement_id: 3,
          achievement: {
            achievement_id: 3,
            name: '建筑达人',
            description: '累计获得1000积分',
            icon: '🏆',
            condition_type: 'points_total',
            condition_value: 1000,
            points: 500,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          unlocked_at: '2024-01-15T15:20:00Z',
        },
        {
          user_achievement_id: 3,
          user_id: 1,
          achievement_id: 4,
          achievement: {
            achievement_id: 4,
            name: '建筑收藏家',
            description: '收藏10个古建筑',
            icon: '❤️',
            condition_type: 'favorites_count',
            condition_value: 10,
            points: 150,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          unlocked_at: '2024-01-18T09:15:00Z',
        },
      ],
    };
  },

  getUserAchievementProgress: async () => {
    await delay();
    return {
      success: true,
      data: [
        { achievement_id: 2, progress: 45, total: 100, achieved: false },
        { achievement_id: 5, progress: 0, total: 1, achieved: false },
        { achievement_id: 6, progress: 3, total: 10, achieved: false },
        { achievement_id: 7, progress: 15, total: 30, achieved: false },
      ],
    };
  },

  getAchievementStats: async () => {
    await delay();
    return {
      success: true,
      data: {
        total_count: 8,
        active_count: 7,
        unlocked_count: 3,
        locked_count: 5,
      },
    };
  },

  unlockAchievement: async (achievementId: number) => {
    await delay();
    return {
      success: true,
      data: {
        user_achievement_id: Date.now(),
        user_id: 1,
        achievement_id: achievementId,
        achievement: {
          achievement_id: achievementId,
          name: '已解锁成就',
          description: '成就描述',
          icon: '🏆',
          condition_type: 'quiz_first',
          condition_value: 1,
          points: 100,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        unlocked_at: new Date().toISOString(),
      },
    };
  },

  importAchievements: async (data: any[]) => {
    await delay();
    return {
      success: true,
      data: data.map((item, index) => ({
        achievement_id: Date.now() + index,
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
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

  checkin: async (data?: { device_type?: string; device_info?: string }) => {
    await delay();
    return {
      success: true,
      message: '打卡成功！',
      checkin_id: Date.now(),
      streak_count: 7,
      points_earned: 10,
      already_checked: false,
    };
  },

  getCheckins: async (params?: { page?: number; limit?: number }) => {
    await delay();
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    return {
      success: true,
      data: {
        list: Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
          checkin_id: (page - 1) * limit + i + 1,
          user_id: 1,
          checkin_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          checkin_time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          streak_count: 7 - i,
          points_earned: 10,
          device_type: 'mobile',
          created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        })),
        total: 20,
        totalPages: 2,
      },
    };
  },

  getCheckinStats: async () => {
    await delay();
    return {
      success: true,
      data: {
        total_checkins: 45,
        max_streak: 15,
        total_points: 450,
        last_checkin_date: new Date().toISOString().split('T')[0],
        weekly_checkins: 7,
        monthly_checkins: 22,
      },
    };
  },

  checkTodayCheckin: async () => {
    await delay();
    return {
      success: true,
      data: {
        checked_today: false,
      },
    };
  },

  getCheckinCalendar: async (params: { year: number; month: number }) => {
    await delay();
    const { year, month } = params;
    const days = new Date(year, month, 0).getDate();
    const checkinDays = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19, 20, 22, 23, 24, 25];
    return {
      success: true,
      data: checkinDays.map(day => ({
        checkin_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        checked: true,
        streak_count: 5,
        points_earned: 10,
      })),
    };
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

const mockKgTopics = [
  { topic_id: 1, topic_key: 'tailiang', topic_name: '抬梁式结构', category: 'structure', content_zh: '抬梁式是中国古建筑最主要的木结构形式...', content_en: 'Tailiang is the primary structural form...', source: '筑见山河知识库', confidence: 0.98, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { topic_id: 2, topic_key: 'chuandou', topic_name: '穿斗式结构', category: 'structure', content_zh: '穿斗式是南方常见木结构形式...', content_en: 'Chuandou style is common in southern China...', source: '筑见山河知识库', confidence: 0.98, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { topic_id: 3, topic_key: 'wudian', topic_name: '庑殿顶', category: 'structure', content_zh: '庑殿顶是中国古建筑最高等级的屋顶形制...', content_en: 'Wudian roof is the highest-ranking roof style...', source: '筑见山河知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { topic_id: 5, topic_key: 'dougong', topic_name: '斗拱', category: 'component', content_zh: '斗拱是中国古建筑特有的结构构件...', content_en: 'Dougong is a unique structural component...', source: '筑见山河知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { topic_id: 8, topic_key: 'foguangsi', topic_name: '佛光寺东大殿', category: 'famous', content_zh: '佛光寺东大殿是中国现存最早的木构建筑...', content_en: 'Foguang Temple East Hall is the earliest existing wooden structure...', source: '筑见山河知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { topic_id: 10, topic_key: 'yingxian', topic_name: '应县木塔', category: 'famous', content_zh: '应县木塔是世界现存最高最古的木塔...', content_en: 'Yingxian Wooden Pagoda is the tallest and oldest existing wooden pagoda...', source: '筑见山河知识库', confidence: 0.99, verified: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

export const mockKnowledgeGraphApi = {
  getTopics: async (params?: { page?: number; pageSize?: number; category?: string }) => {
    await delay();
    let data = mockKgTopics;
    if (params?.category) {
      data = data.filter(t => t.category === params.category);
    }
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      success: true,
      data: data.slice(start, end),
      meta: { total: data.length, page, pageSize },
    };
  },

  getTopicById: async (id: number) => {
    await delay();
    const topic = mockKgTopics.find(t => t.topic_id === id);
    if (!topic) {
      return { success: false, data: null, error: { message: '主题不存在' } };
    }
    return { success: true, data: topic };
  },

  searchTopics: async (query: string) => {
    await delay();
    const data = mockKgTopics.filter(t => t.topic_name.includes(query) || t.topic_key.includes(query));
    return { success: true, data };
  },

  getCategories: async () => {
    await delay();
    return {
      success: true,
      data: [
        { name: 'structure', count: 3 },
        { name: 'component', count: 1 },
        { name: 'famous', count: 2 },
      ],
    };
  },

  getNeighbors: async (id: number, relationType?: string) => {
    await delay();
    const neighborsMap: Record<number, any[]> = {
      1: [
        { relation_id: 1, neighbor_id: 5, neighbor_name: '斗拱', neighbor_category: 'component', relation_type: 'related_to', relation_description: '抬梁式结构使用斗拱' },
        { relation_id: 8, neighbor_id: 9, neighbor_name: '榫卯', neighbor_category: 'component', relation_type: 'related_to', relation_description: '榫卯用于抬梁式结构' },
      ],
      5: [
        { relation_id: 2, neighbor_id: 1, neighbor_name: '抬梁式结构', neighbor_category: 'structure', relation_type: 'related_to', relation_description: '斗拱是抬梁式结构的组成部分' },
        { relation_id: 7, neighbor_id: 6, neighbor_name: '材分制', neighbor_category: 'philosophy', relation_type: 'related_to', relation_description: '材分制以斗口为基本模数' },
      ],
      8: [
        { relation_id: 3, neighbor_id: 5, neighbor_name: '斗拱', neighbor_category: 'component', relation_type: 'related_to', relation_description: '佛光寺东大殿保留唐代斗拱' },
        { relation_id: 4, neighbor_id: 3, neighbor_name: '庑殿顶', neighbor_category: 'structure', relation_type: 'related_to', relation_description: '佛光寺东大殿采用庑殿顶' },
      ],
    };
    let data = neighborsMap[id] || [];
    if (relationType) {
      data = data.filter(n => n.relation_type === relationType);
    }
    return { success: true, data };
  },

  findPaths: async (from: number, to: number, maxHops?: number) => {
    await delay();
    const pathsMap: Record<string, any[]> = {
      '8->5': [{ path_id: 1, path: '8->5', path_names: '佛光寺东大殿->斗拱', path_types: 'related_to', hop_count: 1 }],
      '1->6': [{ path_id: 1, path: '1->5->6', path_names: '抬梁式结构->斗拱->材分制', path_types: 'related_to->related_to', hop_count: 2 }],
      '1->5': [{ path_id: 1, path: '1->5', path_names: '抬梁式结构->斗拱', path_types: 'related_to', hop_count: 1 }],
    };
    const key = `${from}->${to}`;
    return { success: true, data: pathsMap[key] || [] };
  },

  getStats: async () => {
    await delay();
    return {
      success: true,
      data: {
        totalEntities: 5000,
        totalRelations: 12000,
        entityTypes: [
          { name: 'Architecture', count: 500 },
          { name: 'Person', count: 200 },
          { name: 'Dynasty', count: 50 },
          { name: 'Location', count: 300 },
          { name: 'Technique', count: 150 },
          { name: 'Material', count: 100 },
        ],
        relationTypes: 25,
        totalImports: 45,
      },
    };
  },
};

export const mockKnowledgeEnhancedApi = {
  inference: async (data: { query: string; injectionDepth?: number }) => {
    await delay();
    const injectionDepth = data.injectionDepth || 2;
    return {
      success: true,
      data: {
        response: `根据筑见山河知识图谱，关于"${data.query}"的详细信息如下：\n\n【古建筑知识】\n中国古建筑以木构架为主要结构方式，具有独特的建筑美学特征。\n\n📚 相关知识（知识注入深度：${injectionDepth}）：\n1. 斗拱（建筑结构）\n   - 关系：related_to\n   - 说明：斗拱是中国传统建筑中的重要构件\n\n2. 抬梁式结构（建筑结构）\n   - 关系：related_to\n   - 说明：抬梁式结构是中国古建筑的主要结构形式之一\n\n---\n📖 数据来源：筑见山河知识图谱（置信度：95%）`,
        confidence: 0.9,
        knowledgeSources: [
          { topicId: 1, topicName: '古建筑', category: 'architecture', relevance: 1 },
          { topicId: 3, topicName: '斗拱', category: 'concept', relevance: 0.8 },
        ],
        reasoningPath: ['找到核心实体: 古建筑', '关联实体: 斗拱 (关系: related_to)'],
        metadata: {
          processingTime: 156,
          knowledgeUsed: 2,
          injectionDepth,
        },
      },
    };
  },

  pathReasoning: async (data: { fromTopicId: number; toTopicId: number; maxHops?: number }) => {
    await delay();
    const maxHops = data.maxHops || 3;
    if (data.fromTopicId === data.toTopicId) {
      return { success: true, data: [] };
    }
    return {
      success: true,
      data: [
        {
          path_id: 1,
          path: `${data.fromTopicId}->5->${data.toTopicId}`,
          path_names: '起点实体->斗拱->终点实体',
          path_types: 'related_to->related_to',
          hop_count: 2,
        },
      ],
    };
  },

  generateTrainingData: async (data: { topicId: number; sampleCount?: number }) => {
    await delay();
    const sampleCount = data.sampleCount || 100;
    return {
      success: true,
      data: {
        trainingDataId: Date.now(),
        topicId: data.topicId,
        sampleCount,
        generatedCount: sampleCount,
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
    };
  },

  createTrainingTask: async (data: { name: string; description?: string; trainingDataId?: number }) => {
    await delay();
    return {
      success: true,
      data: {
        taskId: Date.now(),
        name: data.name,
        description: data.description || '',
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
      },
    };
  },

  getTrainingTasks: async (params?: { status?: string; page?: number; pageSize?: number }) => {
    await delay();
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    return {
      success: true,
      data: [
        {
          taskId: 1,
          name: '古建筑知识增强训练',
          description: '基于知识图谱的古建筑知识增强训练',
          status: 'completed',
          progress: 100,
          createdAt: '2024-01-15T10:00:00Z',
          completedAt: '2024-01-15T12:30:00Z',
        },
        {
          taskId: 2,
          name: '斗拱知识训练',
          description: '斗拱相关知识的专项训练',
          status: 'running',
          progress: 65,
          createdAt: '2024-01-16T09:00:00Z',
        },
      ],
      meta: { total: 2, page, pageSize },
    };
  },

  getTrainingTaskById: async (id: number) => {
    await delay();
    return {
      success: true,
      data: {
        taskId: id,
        name: '古建筑知识增强训练',
        description: '基于知识图谱的古建筑知识增强训练',
        status: 'completed',
        progress: 100,
        metrics: {
          accuracy: 0.89,
          f1Score: 0.87,
          epochCount: 50,
        },
        createdAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T12:30:00Z',
      },
    };
  },

  cancelTrainingTask: async (id: number) => {
    await delay();
    return {
      success: true,
      data: { taskId: id, status: 'cancelled' },
    };
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

  deleteTranslation: async (id: number) => {
    await delay();
    return { success: true, data: { deleted_count: 1 } };
  },

  batchDeleteTranslations: async (ids: number[]) => {
    await delay();
    return { success: true, data: { deleted_count: ids.length } };
  },

  getTranslationList: async (params?: { search?: string; entity_type?: string; language?: string; status?: string; page?: number; limit?: number }) => {
    await delay();
    return {
      success: true,
      data: {
        list: [
          {
            translation_id: 1,
            entity_type: 'architecture',
            entity_id: 1,
            field_name: 'name',
            language_code: 'en',
            source_text: '太和殿',
            translated_text: 'Hall of Supreme Harmony',
            review_status: 'approved',
            is_machine_translated: false,
            quality_score: 95,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            translation_id: 2,
            entity_type: 'architecture',
            entity_id: 1,
            field_name: 'description',
            language_code: 'en',
            source_text: '故宫核心建筑，中国现存最大的木结构大殿',
            translated_text: 'The core building of the Forbidden City, the largest wooden hall in China',
            review_status: 'pending',
            is_machine_translated: true,
            quality_score: 0,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
        total: 2,
        totalPages: 1,
      },
    };
  },

  getTranslationStats: async () => {
    await delay();
    return {
      success: true,
      data: {
        total_translations: 150,
        pending_reviews: 25,
        approved_translations: 100,
        rejected_translations: 5,
        machine_translations: 80,
        human_translations: 70,
        memory_entries: 200,
        entity_types: 5,
        languages: 2,
      },
    };
  },

  reviewTranslation: async (data: { translation_id: number; review_status: string; review_notes?: string; quality_score?: number }) => {
    await delay();
    return { success: true, data: { review_id: Date.now() } };
  },

  getTranslationVersions: async (id: number) => {
    await delay();
    return {
      success: true,
      data: [
        {
          version_id: 1,
          translation_id: id,
          translated_text: 'Original text',
          change_reason: 'Initial translation',
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    };
  },

  lookupMemory: async (data: { source_text: string; target_language: string }) => {
    await delay();
    return { success: true, data: [] };
  },

  getMemoryList: async (params?: { search?: string; page?: number; limit?: number }) => {
    await delay();
    return {
      success: true,
      data: [],
    };
  },

  batchTranslate: async (data: { entityType: string; targetLang: string; fields: string[] }) => {
    await delay();
    return { success: true, data: [] };
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
  achievement: mockAchievementApi,
  knowledge: mockKnowledgeApi,
  i18n: mockI18nApi,
  model3d: mockModel3dApi,
  profile: mockProfileApi,
};
