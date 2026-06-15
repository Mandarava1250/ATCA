// ============================================
// 华夏营造 - 应用入口 (Express Server)
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

dotenv.config({ path: '.env.db' });

import { config } from './config/app';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { closeAllPools, setMockMode, isMockMode, preconnectAll } from './config/database';
import { 
  sqlInjectionDetection, 
  securityHeaders, 
  validateRequestSize, 
  restrictHttpMethods, 
  pathTraversalProtection,
  securityLogger 
} from './middleware/security';
import { authRateLimiter, generalRateLimiter } from './middleware/rateLimiter';
import { sessionTimeoutCheck, apiKeyValidation } from './middleware/accessControl';

// 模块路由
import authRouter from './modules/auth/AuthIndex';
import architectureRouter from './modules/architecture/ArchitectureIndex';
import quizRouter from './modules/quiz/QuizIndex';
import assistantRouter from './modules/assistant/AssistantIndex';
import model3dRouter from './modules/model3d/Model3dIndex';
import profileRouter from './modules/profile/ProfileIndex';
import indexRouter from './modules/index/IndexIndex';
import activityRouter from './modules/activity/ActivityIndex';
import adminRouter from './modules/admin/AdminIndex';
import i18nRouter from './modules/i18n/I18nIndex';
import socialRouter from './modules/social/SocialIndex';
import knowledgeRouter from './modules/knowledgebase/KnowledgeBaseIndex';

const app = express();

// ============================================
// 安全中间件链
// ============================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'strict-dynamic'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}));

app.use(securityHeaders);
app.use(restrictHttpMethods);

const isProduction = config.nodeEnv === 'production';
const corsOrigin = isProduction 
  ? config.cors.productionOrigins 
  : config.cors.developmentOrigins;

app.use(cors({
  origin: corsOrigin,
  credentials: config.cors.credentials,
  methods: config.cors.allowedMethods,
  allowedHeaders: config.cors.allowedHeaders,
  exposedHeaders: config.cors.exposedHeaders,
  maxAge: config.cors.maxAge,
}));

app.use(apiKeyValidation);

const morganFormat = isProduction 
  ? ':method :url :status - :response-time ms'
  : '[:date[iso]] :method :url :status :response-time ms - :res[content-length]';

app.use(morgan(morganFormat, {
  skip: (req, res) => res.statusCode < 400,
}));

app.use(securityLogger);
app.use(validateRequestSize);
app.use(sqlInjectionDetection);
app.use(pathTraversalProtection);
app.use(generalRateLimiter);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(sessionTimeoutCheck);

// ============================================
// 路由注册（严格顺序：API优先，SPA fallback最后）
// ============================================

// 1. 上传文件
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 2. 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// 3. Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 4. API路由
const apiPrefix = '/api/v1';
app.use(`${apiPrefix}/auth`, authRouter);
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

// 5. 前端静态文件服务（生产环境）— 放在API路由之后
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (require('fs').existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // SPA路由支持 — 绝对禁止拦截 /api /uploads /health /api-docs
  app.get('*', (req, res, next) => {
    const reqPath = req.path;
    if (
      reqPath.startsWith('/api/') ||
      reqPath.startsWith('/uploads/') ||
      reqPath === '/health' ||
      reqPath.startsWith('/api-docs')
    ) {
      return next(); // 交给 404 处理，返回 JSON 错误而非 HTML
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.warn(`[Static] 前端dist目录不存在: ${frontendDistPath}`);
}

// 6. 404 和全局错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// 启动服务器
// ============================================
const PORT = config.port;

async function startServer() {
  try {
    await preconnectAll();
  } catch (error: any) {
    console.error('[DB] 预连接错误详情:', error.message || error);
    console.warn('[DB] 所有数据库连接失败，启用 Mock 模式');
    setMockMode(true);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ATCA Server] 运行于 http://0.0.0.0:${PORT}`);
    console.log(`[ATCA Server] API地址: http://0.0.0.0:${PORT}${apiPrefix}`);
    console.log(`[ATCA Server] 健康检查: http://0.0.0.0:${PORT}/health`);
    console.log(`[ATCA Server] 环境: ${config.nodeEnv}`);
    if (isMockMode()) {
      console.log(`[ATCA Server] 当前使用 Mock 数据模式（无需数据库）`);
    }
  });

  process.on('uncaughtException', (err) => {
    console.error('[ATCA Server] 未捕获异常:', err.message || err);
  });
  process.on('unhandledRejection', (reason: any) => {
    console.error('[ATCA Server] 未处理的Promise拒绝:', reason?.message || reason);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`[ATCA Server] 收到 ${signal}，开始优雅关闭...`);
    server.close(async () => {
      await closeAllPools();
      console.log('[ATCA Server] 已关闭');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

startServer();