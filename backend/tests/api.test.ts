// ============================================
// 华夏营造 - API接口自动化测试
// ============================================

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// 类型声明
declare module 'supertest' {
  interface Test {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    delete(url: string): Test;
    patch(url: string): Test;
    send(data?: any): Test;
    set(field: string, value: string): Test;
    attach(field: string, file: string, options?: any): Test;
    field(name: string, value: string): Test;
    expect(status: number, body?: any): Test;
    query(query: object): Test;
    type(contentType: string): Test;
    auth(user: string, pass: string): Test;
  }
}

dotenv.config({ path: '.env.db' });

import { config } from '../src/config/app';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';
import { setMockMode } from '../src/config/database';

// 模块路由（过程式风格）
import architectureRouter from '../src/modules/architecture/ArchitectureIndex';
import quizRouter from '../src/modules/quiz/QuizIndex';
import assistantRouter from '../src/modules/assistant/AssistantIndex';
import model3dRouter from '../src/modules/model3d/Model3dIndex';
import profileRouter from '../src/modules/profile/ProfileIndex';
import indexRouter from '../src/modules/index/IndexIndex';
import activityRouter from '../src/modules/activity/ActivityIndex';
import adminRouter from '../src/modules/admin/AdminIndex';
import i18nRouter from '../src/modules/i18n/I18nIndex';
import socialRouter from '../src/modules/social/SocialIndex';
import knowledgeRouter from '../src/modules/knowledgebase/KnowledgeBaseIndex';

// 控制器模式路由
import { RouteManager } from '../src/routes/RouteManager';
import { AuthController } from '../src/controllers/AuthController';

// 创建测试用的Express应用
const createTestApp = (): express.Application => {
  const app = express();

  // 安全中间件
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: config.cors.developmentOrigins,
    credentials: config.cors.credentials,
  }));

  // 日志
  app.use(morgan(':method :url :status - :response-time ms', {
    skip: (req, res) => res.statusCode < 400,
  }));

  // 限流
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // 解析请求体
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // 静态文件
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // 健康检查
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  // API路由（控制器模式）
  const routeManager = new RouteManager();
  routeManager.registerController(AuthController);
  routeManager.install(app);

  // API路由（过程式风格）
  const apiPrefix = config.apiPrefix;
  app.use(`${apiPrefix}/architecture`, architectureRouter);
  app.use(`${apiPrefix}/quiz`, quizRouter);
  app.use(`${apiPrefix}/assistant`, assistantRouter);
  app.use(`${apiPrefix}/models`, model3dRouter);
  app.use(`${apiPrefix}/profile`, profileRouter);
  app.use(`${apiPrefix}/index`, indexRouter);
  app.use(`${apiPrefix}/activities`, activityRouter);
  app.use(`${apiPrefix}/admin`, adminRouter);
  app.use(`${apiPrefix}/i18n`, i18nRouter);
  app.use(`${apiPrefix}/social`, socialRouter);
  app.use(`${apiPrefix}/knowledge`, knowledgeRouter);

  // 404
  app.use(notFoundHandler);

  // 错误处理
  app.use(errorHandler);

  return app;
};

// 启用Mock模式进行测试
setMockMode(true);

const app = createTestApp();
const apiPrefix = config.apiPrefix;

describe('API接口测试', () => {
  describe('健康检查', () => {
    it('GET /health 应该返回健康状态', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('认证API', () => {
    it('POST /api/v1/auth/login 应该支持登录', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: 'admin', password: 'admin123' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('POST /api/v1/auth/register 应该支持注册', async () => {
      const uniqueUsername = `testuser_${Date.now()}`;
      const response = await request(app)
        .post(`${apiPrefix}/auth/register`)
        .send({
          username: uniqueUsername,
          password: 'K9x#mNp$2Qr!',
          email: `${uniqueUsername}@example.com`,
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('古建筑API', () => {
    it('GET /api/v1/architecture 应该返回建筑列表', async () => {
      const response = await request(app).get(`${apiPrefix}/architecture`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/architecture/:id 应该返回单个建筑详情', async () => {
      const response = await request(app).get(`${apiPrefix}/architecture/1`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('GET /api/v1/architecture/stats 应该返回统计数据', async () => {
      const response = await request(app).get(`${apiPrefix}/architecture/stats`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('dynasties');
      expect(response.body.data).toHaveProperty('regions');
    });

    it('GET /api/v1/architecture/dynasty/list 应该返回朝代列表', async () => {
      const response = await request(app).get(`${apiPrefix}/architecture/dynasty/list`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/architecture/type/list 应该返回类型列表', async () => {
      const response = await request(app).get(`${apiPrefix}/architecture/type/list`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('竞赛API', () => {
    it('GET /api/v1/quiz/modes 应该返回竞赛模式列表', async () => {
      const response = await request(app).get(`${apiPrefix}/quiz/modes`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/quiz/questions 应该返回题目', async () => {
      const loginResponse = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: 'admin', password: 'admin123' });
      const token = loginResponse.body.data?.tokens?.accessToken;
      
      const response = await request(app)
        .get(`${apiPrefix}/quiz/questions?mode=entry`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('questions');
      expect(response.body.data).toHaveProperty('sessionId');
    });

    it('GET /api/v1/quiz/leaderboard 应该返回排行榜', async () => {
      const response = await request(app).get(`${apiPrefix}/quiz/leaderboard`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('AI助手API', () => {
    it('GET /api/v1/admin/ai-configs 应该返回AI配置列表', async () => {
      const loginResponse = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: 'admin', password: 'admin123' });
      const token = loginResponse.body.data?.tokens?.accessToken;
      
      const response = await request(app)
        .get(`${apiPrefix}/admin/ai-configs`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('POST /api/v1/assistant/chat 应该支持AI对话', async () => {
      const loginResponse = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: 'admin', password: 'admin123' });
      const token = loginResponse.body.data?.tokens?.accessToken;
      
      const response = await request(app)
        .post(`${apiPrefix}/assistant/chat`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: '你好' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('首页API', () => {
    it('GET /api/v1/index/dashboard 应该返回仪表盘数据', async () => {
      const response = await request(app).get(`${apiPrefix}/index/dashboard`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('popularArchitectures');
    });

    it('GET /api/v1/index/stats 应该返回统计数据', async () => {
      const response = await request(app).get(`${apiPrefix}/index/stats`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('userCount');
      expect(response.body.data).toHaveProperty('architectureCount');
    });

    it('GET /api/v1/index/leaderboard 应该返回排行榜', async () => {
      const response = await request(app).get(`${apiPrefix}/index/leaderboard`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('活动API', () => {
    it('GET /api/v1/activities 应该返回活动列表', async () => {
      const response = await request(app).get(`${apiPrefix}/activities`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/activities/achievements 应该返回成就列表', async () => {
      const response = await request(app).get(`${apiPrefix}/activities/achievements`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/activities/daily-tasks 应该返回每日任务', async () => {
      const response = await request(app).get(`${apiPrefix}/activities/daily-tasks`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('知识库API', () => {
    it('GET /api/v1/knowledge 应该返回知识库列表', async () => {
      const response = await request(app).get(`${apiPrefix}/knowledge`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/knowledge/categories 应该返回分类列表', async () => {
      const response = await request(app).get(`${apiPrefix}/knowledge/categories`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/knowledge/stats 应该返回统计数据', async () => {
      const response = await request(app).get(`${apiPrefix}/knowledge/stats`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('categories');
    });
  });

  describe('国际化API', () => {
    it('GET /api/v1/i18n/languages 应该返回语言列表', async () => {
      const response = await request(app).get(`${apiPrefix}/i18n/languages`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('3D模型API', () => {
    it('GET /api/v1/models 应该返回模型列表', async () => {
      const response = await request(app).get(`${apiPrefix}/models`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/models/components 应该返回组件列表', async () => {
      const response = await request(app).get(`${apiPrefix}/models/components`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/v1/models/templates 应该返回模板列表', async () => {
      const response = await request(app).get(`${apiPrefix}/models/templates`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('社交API', () => {
    it('GET /api/v1/social/mute-status 应该返回禁言状态', async () => {
      const loginResponse = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: 'admin', password: 'admin123' });
      const token = loginResponse.body.data?.tokens?.accessToken;
      
      const response = await request(app)
        .get(`${apiPrefix}/social/mute-status`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('is_muted');
    });

    it('GET /api/v1/social/forum/boards 应该返回论坛板块', async () => {
      const response = await request(app).get(`${apiPrefix}/social/forum/boards`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('管理员API', () => {
    it('GET /api/v1/admin/dashboard 应该返回管理员仪表盘', async () => {
      const loginResponse = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: 'admin', password: 'admin123' });
      const token = loginResponse.body.data?.tokens?.accessToken;
      
      const response = await request(app)
        .get(`${apiPrefix}/admin/dashboard`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('GET /api/v1/admin/users 应该返回用户列表', async () => {
      const loginResponse = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: 'admin', password: 'admin123' });
      const token = loginResponse.body.data?.tokens?.accessToken;
      
      const response = await request(app)
        .get(`${apiPrefix}/admin/users`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('错误处理', () => {
    it('访问不存在的路由应该返回404', async () => {
      const response = await request(app).get(`${apiPrefix}/nonexistent`);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });

    it('POST请求应该返回正确的Content-Type', async () => {
      const response = await request(app)
        .post(`${apiPrefix}/auth/login`)
        .send({ username: 'test', password: 'test' });
      expect(response.headers['content-type']).toContain('application/json');
    });
  });
});