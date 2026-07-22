// ============================================
// 筑见山河 - 应用入口 (Express Server)
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import compression from 'compression';
import { createServer as createHttpServer } from 'http';

dotenv.config({ path: '.env.db' });

import { config } from './config/app';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { closeAllPools, setMockMode, isMockMode, preconnectAll, initAllDatabases, startRecoveryService, stopRecoveryService } from './config/database';
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
import { authMiddleware, adminMiddleware } from './middleware/auth';
import { 
  browseStateDetection, 
  getClientStateStats, 
  triggerCleanup,
  initBrowseStateStore 
} from './middleware/browseState';
import { createConditionalOutput } from './middleware/conditionalOutput';
import { 
  performanceMonitor, 
  performanceEndpoint, 
  startPeriodicCheck 
} from './middleware/performanceMonitor';
import { 
  startKeepAliveService, 
  stopKeepAliveService, 
  recordRequestActivity 
} from './services/serverKeepAlive';
import { initSyncService, getSyncStats } from './services/SyncService';
import { startMemoryMonitor, getMemoryStats, stopMemoryMonitor } from './services/MemoryMonitor';
import { getLifecycleStats, getHighRiskEntries } from './utils/memoryLifecycle';

// 模块路由（过程式风格）
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
import knowledgeGraphRouter from './modules/knowledge-graph/KnowledgeGraphIndex';
import userKnowledgeGraphRouter from './modules/knowledge-graph/UserKnowledgeGraphIndex';
import knowledgeGraphPublicRouter from './modules/knowledge-graph/KnowledgeGraphPublicIndex';
import knowledgeEnhancedTrainingRouter from './modules/knowledge-graph/KnowledgeEnhancedTrainingIndex';
import performanceRouter from './modules/admin/performance/PerformanceIndex';
import syncRouter from './modules/sync/SyncIndex';

// 控制器模式路由（新架构）
import { RouteManager } from './routes/RouteManager';
import { AuthController } from './controllers/AuthController';

// 服务注册框架（新架构）
import { registerCoreServices, initializeServices, disposeServices, getServiceStatusSummary } from './core';

const routeManager = new RouteManager();
routeManager.registerController(AuthController);

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

// ============================================
// 性能优化中间件
// ============================================

// 性能监控（针对2核2GiB服务器）
app.use(performanceMonitor());

// 响应压缩 - 减少传输数据量
app.use(compression({
  level: 6,
  threshold: 1024,
}));

// ETag支持 - 使用 Express 内置支持（替代自定义实现）
// Express 内置 ETag 支持所有响应类型（字符串、Buffer、JSON）
app.set('etag', 'weak'); // 使用弱 ETag，适合动态内容

// 静态资源缓存控制
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/uploads/')) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  } else if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

const morganFormat = isProduction 
  ? ':method :url :status - :response-time ms'
  : '[:date[iso]] :method :url :status :response-time ms - :res[content-length]';

app.use(morgan(morganFormat, {
  skip: (req, res) => res.statusCode < 400,
}));

app.use(securityLogger);
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/models/upload')) {
    return next();
  }
  validateRequestSize(req, res, next);
});
app.use(sqlInjectionDetection);
app.use(pathTraversalProtection);

// ============================================
// 请求活动记录中间件（用于服务器保活）
// ============================================
app.use((_req, _res, next) => {
  recordRequestActivity();
  next();
});

// ============================================
// 健康检查端点（不经过速率限制）
// ============================================
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// 速率限制（健康检查端点已豁免）
app.use(generalRateLimiter);
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// ============================================
// 浏览状态检测与条件性数据输出中间件
// ============================================
app.use(browseStateDetection);

// 客户端状态监控端点
app.get('/api/monitor/client-states', async (req, res) => {
  try {
    const stats = await getClientStateStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取客户端状态统计失败',
    });
  }
});

// 手动触发客户端状态清理
app.post('/api/monitor/cleanup', async (req, res) => {
  try {
    const cleaned = await triggerCleanup();
    res.json({
      success: true,
      message: `已清理 ${cleaned} 条过期客户端状态`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '客户端状态清理失败',
    });
  }
});

// 条件性输出中间件配置
// 对知识图谱和架构浏览相关API启用浏览状态检测
const conditionalOutput = createConditionalOutput({
  blockBots: true,
  enableCache: true,
  cacheTTL: 60,
});

// ============================================
// 路由注册（严格顺序：静态文件优先，API其次，SPA fallback最后）
// ============================================

// 0. 上传文件静态服务 - 放在最前面，避免被安全中间件拦截
const uploadsPath = path.resolve(__dirname, '../uploads');
console.log(`[Static] 上传文件目录: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // 头像文件：短缓存时间，确保上传后能及时更新
    if (filePath.includes('/avatars/')) {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate'); // 5分钟
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 其他文件1天
    }
  },
}));

// 0.1. favicon 处理 — 避免浏览器 favicon 请求被 SPA 路由捕获导致 500
app.get('/favicon.ico', (req, res) => {
  const faviconPath = path.resolve(__dirname, '../../frontend/dist/favicon.ico');
  if (require('fs').existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    // 返回空白的 1x1 透明图标（inline base64），避免浏览器持续请求
    res.setHeader('Content-Type', 'image/x-icon');
    res.status(204).end();
  }
});

// 1. 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// 3. 性能监控端点
app.get('/api/monitor/performance', performanceEndpoint);

// 同步服务监控端点
app.get('/api/monitor/sync', (_req, res) => {
  res.json({
    success: true,
    data: getSyncStats(),
  });
});

// 内存监控端点
app.get('/api/monitor/memory', (_req, res) => {
  res.json({
    success: true,
    data: getMemoryStats(),
  });
});

// 内存生命周期日志端点
app.get('/api/monitor/memory/lifecycle', (_req, res) => {
  res.json({
    success: true,
    data: getLifecycleStats(),
  });
});

// 内存生命周期高风险条目端点
app.get('/api/monitor/memory/lifecycle/high-risk', (_req, res) => {
  res.json({
    success: true,
    data: getHighRiskEntries(),
  });
});

// 3. Swagger API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 4. API路由（控制器模式）
routeManager.install(app);

// 4. API路由（过程式风格）
const apiPrefix = '/api/v1';

// 架构浏览API - 启用条件性输出（浏览状态检测）
app.use(`${apiPrefix}/architecture`, conditionalOutput, architectureRouter);

app.use(`${apiPrefix}/quiz`, quizRouter);
app.use(`${apiPrefix}/assistant`, assistantRouter);
app.use(`${apiPrefix}/models`, model3dRouter);
app.use(`${apiPrefix}/profile`, profileRouter);
app.use(`${apiPrefix}/index`, indexRouter);
app.use(`${apiPrefix}/activities`, activityRouter);
app.use(`${apiPrefix}/admin`, adminRouter);
app.use(`${apiPrefix}/admin/knowledge-graph`, authMiddleware, adminMiddleware, knowledgeGraphRouter);
app.use(`${apiPrefix}/admin/performance`, performanceRouter);
app.use(`${apiPrefix}/i18n`, i18nRouter);
app.use(`${apiPrefix}/social`, socialRouter);

// 知识库API - 启用条件性输出（浏览状态检测）
app.use(`${apiPrefix}/knowledge`, conditionalOutput, knowledgeRouter);

// 知识图谱用户检索API - 启用条件性输出（浏览状态检测）
app.use(`${apiPrefix}/knowledge-graph`, conditionalOutput, userKnowledgeGraphRouter);
app.use(`${apiPrefix}/knowledge-graph`, conditionalOutput, knowledgeGraphPublicRouter);

// 知识增强训练API
app.use(`${apiPrefix}/knowledge-enhanced`, knowledgeEnhancedTrainingRouter);

// 数据同步API
app.use(`${apiPrefix}/sync`, syncRouter);

// 5. 前端静态文件服务（生产环境）— 放在API路由之后
// 正确路径：backend 和 frontend 同级
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
console.log(`[Static] 前端dist目录路径: ${frontendDistPath}`);

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
  // 启动内存监控
  startMemoryMonitor();

  // 初始化浏览状态存储（默认内存模式，适合 2核2G 服务器）
  // 如需 Redis 存储，可传入配置: initBrowseStateStore({ type: 'redis', redis: {...} })
  initBrowseStateStore({ type: 'memory' });

  // 注册核心服务
  registerCoreServices();
  
  try {
    await preconnectAll();
    
    if (!isMockMode()) {
      await initAllDatabases();
    }
    
    // 启动数据库连接恢复服务（每30秒检查一次）
    startRecoveryService(30000);
  } catch (error: any) {
    console.error('[DB] 预连接或初始化错误详情:', error.message || error);
    console.warn('[DB] 所有数据库连接失败，启用 Mock 模式');
    setMockMode(true);
  }

  // 初始化所有已注册服务
  try {
    await initializeServices();
    const status = getServiceStatusSummary();
    console.log('[ServiceRegistry] 服务状态:', {
      state: status.state,
      ready: status.services.filter(s => s.state === 'ready').length,
      total: status.services.length
    });
  } catch (error: any) {
    console.error('[ServiceRegistry] 服务初始化失败:', error.message);
    // 非致命错误，继续启动
  }

  // 创建 HTTP Server（支持 WebSocket）
  const httpServer = createHttpServer(app);

  // 初始化 WebSocket 同步服务
  initSyncService(httpServer);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ATCA Server] 运行于 http://0.0.0.0:${PORT}`);
    console.log(`[ATCA Server] API地址: http://0.0.0.0:${PORT}${apiPrefix}`);
    console.log(`[ATCA Server] WebSocket: ws://0.0.0.0:${PORT}`);
    console.log(`[ATCA Server] 健康检查: http://0.0.0.0:${PORT}/health`);
    console.log(`[ATCA Server] 性能监控: http://0.0.0.0:${PORT}/api/monitor/performance`);
    console.log(`[ATCA Server] 环境: ${config.nodeEnv}`);
    if (isMockMode()) {
      console.log(`[ATCA Server] 当前使用 Mock 数据模式（无需数据库）`);
    }
    
    // 启动定期性能检查（针对2核2GiB服务器）
    startPeriodicCheck();
    
    // 启动服务器保活服务（防止2核2GiB服务器长时间空闲后进入休眠状态）
    startKeepAliveService({
      enabled: true,
      interval: 30000, // 30秒执行一次保活操作
      healthCheckInterval: 120000, // 2分钟执行一次健康检查
      maxIdleTime: 1800000, // 30分钟最大空闲时间
    });
  });

  process.on('uncaughtException', (err) => {
    console.error('[ATCA Server] 未捕获异常:', err.message || err);
  });
  process.on('unhandledRejection', (reason: any) => {
    console.error('[ATCA Server] 未处理的Promise拒绝:', reason?.message || reason);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`[ATCA Server] 收到 ${signal}，开始优雅关闭...`);
    
    // 停止数据库连接恢复服务
    stopRecoveryService();
    
    // 停止保活服务
    stopKeepAliveService();
    
    // 停止内存监控
    stopMemoryMonitor();
    
    // 销毁所有服务
    await disposeServices();
    
    httpServer.close(async () => {
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