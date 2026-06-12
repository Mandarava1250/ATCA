// ============================================
// 华夏营造 - 路由配置
// ============================================

import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Splash',
      component: () => import('@/views/home/ViewSplash.vue'),
      meta: { title: '华夏营造' },
    },
    {
      path: '/home',
      name: 'Home',
      component: () => import('@/views/home/ViewHome.vue'),
      meta: { title: 'home' },
    },
    {
      path: '/architecture',
      name: 'ArchitectureList',
      component: () => import('@/views/architecture/ViewArchitectureList.vue'),
      meta: { title: 'architecture' },
    },
    {
      path: '/architecture/:id',
      name: 'ArchitectureDetail',
      component: () => import('@/views/architecture/ViewArchitectureDetail.vue'),
      meta: { title: 'architectureDetail' },
    },
    {
      path: '/architecture/map',
      name: 'ArchitectureMap',
      component: () => import('@/views/architecture/ProvinceMapPage.vue'),
      meta: { title: '古建筑地图' },
    },
    {
      path: '/quiz',
      name: 'Quiz',
      component: () => import('@/views/quiz/ViewQuiz.vue'),
      meta: { title: 'quiz' },
    },
    {
      path: '/quiz/play',
      name: 'QuizPlay',
      component: () => import('@/views/quiz/ViewQuizPlay.vue'),
      meta: { title: 'quizPlay', requiresAuth: true },
    },
    {
      path: '/quiz/analytics',
      name: 'QuizAnalytics',
      component: () => import('@/views/quiz/ViewQuizAnalytics.vue'),
      meta: { title: '答题分析', requiresAuth: true },
    },
    {
      path: '/workshop',
      name: 'WorkshopHome',
      component: () => import('@/views/workshop/ViewWorkshopHome.vue'),
      meta: { title: 'workshop' },
    },
    {
      path: '/workshop/editor',
      name: 'WorkshopEditor',
      component: () => import('@/views/workshop/ViewWorkshop.vue'),
      meta: { title: 'workshopEditor' },
    },
    {
      path: '/workshop/builder',
      name: 'ComponentBuilder',
      component: () => import('@/views/workshop/ComponentBuilder.vue'),
      meta: { title: 'componentBuilder' },
    },
    // 3D工坊访客重定向（仅访客使用，带redirect）
    {
      path: '/workshop/guest',
      name: 'WorkshopGuest',
      redirect: (to) => {
        return { path: '/login', query: { redirect: to.query.redirect || '/workshop' } };
      },
    },
    {
      path: '/community',
      name: 'Community',
      component: () => import('@/views/community/ViewCommunity.vue'),
    },
    {
      path: '/community/board/:boardId',
      name: 'BoardTopics',
      component: () => import('@/views/community/BoardTopics.vue'),
      meta: { title: '板块主题', requiresAuth: false },
    },
    {
      path: '/community/topic/:id',
      name: 'TopicDetail',
      component: () => import('@/views/community/TopicDetail.vue'),
      meta: { title: '社区活动', requiresAuth: false },
    },
    {
      path: '/activity/:id',
      name: 'ActivityDetail',
      component: () => import('@/views/home/ViewActivityDetail.vue'),
      meta: { title: '活动详情' },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/user/ViewProfile.vue'),
      meta: { title: 'profile', requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/user/ViewLogin.vue'),
      meta: { title: 'login', guestOnly: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/user/ViewRegister.vue'),
      meta: { title: 'register', guestOnly: true },
    },
    // 管理员路由
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', name: 'AdminDashboard', component: () => import('@/views/admin/AdminDashboard.vue') },
        { path: 'users', name: 'AdminUsers', component: () => import('@/views/admin/AdminUsers.vue') },
        { path: 'architectures', name: 'AdminArchitecture', component: () => import('@/views/admin/AdminArchitecture.vue') },
        { path: 'questions', name: 'AdminQuestions', component: () => import('@/views/admin/AdminQuestions.vue') },
        { path: 'ai-configs', name: 'AdminAI', component: () => import('@/views/admin/AdminAI.vue') },
        { path: 'models', name: 'AdminModels', component: () => import('@/views/admin/AdminModel3D.vue') },
        { path: 'activities', name: 'AdminActivities', component: () => import('@/views/admin/AdminActivity.vue') },
        { path: 'community', name: 'AdminCommunity', component: () => import('@/views/admin/AdminCommunity.vue') },
        { path: 'monitor', name: 'AdminMonitor', component: () => import('@/views/admin/AdminMonitor.vue') },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/error/ViewNotFound.vue'),
      meta: { title: 'notFound' },
    },
  ],
  scrollBehavior() {
    return { top: 0, left: 0 };
  },
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;
  const isAdmin = userStore.isAdmin;
  const hasToken = !!userStore.tokens?.accessToken;

  // 设置页面标题
  if (to.meta.title) {
    const title = to.meta.title as string;
    document.title = `${title} - 华夏营造`;
  }

  // 需要管理员权限
  if (to.meta.requiresAdmin && !isAdmin) {
    next({ name: 'Home' });
    return;
  }

  // 需要认证：已登录或有token正在恢复，均放行
  if (to.meta.requiresAuth && !isLoggedIn && !hasToken) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  // Splash页面已登录用户也可访问（会由组件自动跳转）
  if (to.name === 'Splash' && isLoggedIn) {
    next();
    return;
  }

  // 仅游客
  if (to.meta.guestOnly && isLoggedIn) {
    next({ name: 'Home' });
    return;
  }

  // 切换页面时滚动到顶部
  window.scrollTo(0, 0);

  next();
});

export default router;
