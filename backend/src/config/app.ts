// ============================================
// 华夏营造 - 应用配置
// ============================================

import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量 - 尝试多个路径（开发环境和Docker环境）
const envPaths = [
  path.resolve(process.cwd(), '.env.db'),
  path.resolve(__dirname, '../.env.db'),
  path.resolve(__dirname, '../../.env.db'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    envLoaded = true;
    console.log(`[Config] 加载环境变量: ${envPath}`);
    break;
  }
}

if (!envLoaded) {
  console.warn('[Config] 未能加载 .env.db，使用默认配置');
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
    accessExpiry: '24h',
    refreshExpiry: '7d',
  },

  bcrypt: {
    saltRounds: 12,
  },

  cors: {
    // 开发环境允许所有本地端口
    developmentOrigins: [
      'http://localhost:3000',
      'http://localhost:3100',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3100',
      'http://127.0.0.1:5173',
    ],
    // 生产环境严格限制来源（从环境变量读取）
    productionOrigins: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.trim()
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : [],
    credentials: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
    ],
    exposedHeaders: [
      'Content-Disposition',
      'X-Total-Count',
      'X-Page',
      'X-Limit',
      'X-Total-Pages',
    ],
    maxAge: 86400, // 24小时
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  },

  ai: {
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      },
      claude: {
        apiKey: process.env.CLAUDE_API_KEY || '',
        baseUrl: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1',
      },
      kimi: {
        apiKey: process.env.KIMI_API_KEY || '',
        baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
      },
      qwen: {
        apiKey: process.env.QWEN_API_KEY || '',
        baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1',
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      },
      mistral: {
        apiKey: process.env.MISTRAL_API_KEY || '',
        baseUrl: process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
      },
      groq: {
        apiKey: process.env.GROQ_API_KEY || '',
        baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      },
    },
    defaultProvider: 'kimi',
    defaultModel: 'moonshot-v1-8k',
  },
};
