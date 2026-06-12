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

// 1. 基础安全头（使用helmet）
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

// 2. 自定义安全头
app.use(securityHeaders);

// 3. HTTP方法限制
app.use(restrictHttpMethods);

// 4. 根据环境配置CORS
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

// 5. API密钥验证（可选）
app.use(apiKeyValidation);

// 6. 日志 — 只记录错误请求
const morganFormat = isProduction 
  ? ':method :url :status - :response-time ms'
  : '[:date[iso]] :method :url :status :response-time ms - :res[content-length]';

app.use(morgan(morganFormat, {
  // 跳过所有成功响应 (2xx/3xx)，只记录错误
  skip: (req, res) => res.statusCode < 400,
}));

// 7. 安全日志记录
app.use(securityLogger);

// 8. 请求大小限制
app.use(validateRequestSize);

// 9. SQL注入检测
app.use(sqlInjectionDetection);

// 10. 路径遍历防护
app.use(pathTraversalProtection);

// 11. 通用速率限制
app.use(generalRateLimiter);

// 12. 解析请求体 — 支持最大 100MB（3D模型文件批量导入需要较大空间）
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 13. 会话超时检查（需要在路由前应用）
app.use(sessionTimeoutCheck);

// 静态文件
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API路由
const apiPrefix = config.apiPrefix;
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

// 404
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = config.port;

async function startServer() {
  // 尝试预连接所有数据库，失败则启用 Mock 模式
  try {
    await preconnectAll();
  } catch (error: any) {
    console.error('[DB] 预连接错误详情:', error.message || error);
    console.warn('[DB] 所有数据库连接失败，启用 Mock 模式');
    setMockMode(true);
  }

  // 即使没有数据库连接，也要启动服务器（使用 Mock 模式）
  const server = app.listen(PORT, 'localhost', () => {
    console.log(`[ATCA Server] 运行于端口 ${PORT}`);
    console.log(`[ATCA Server] API地址: http://localhost:${PORT}${apiPrefix}`);
    console.log(`[ATCA Server] API文档: http://localhost:${PORT}/api-docs`);
    console.log(`[ATCA Server] 环境: ${config.nodeEnv}`);
    if (isMockMode()) {
      console.log(`[ATCA Server] 当前使用 Mock 数据模式（无需数据库）`);
      console.log(`[ATCA Server] 健康检查地址: http://localhost:${PORT}/health`);
    }
  });

  // 防止未捕获异常导致进程崩溃
  process.on('uncaughtException', (err) => {
    console.error('[ATCA Server] 未捕获异常:', err.message || err);
  });
  process.on('unhandledRejection', (reason: any) => {
    console.error('[ATCA Server] 未处理的Promise拒绝:', reason?.message || reason);
  });

  // 优雅关闭
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

// 未捕获异常处理
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

startServer();
