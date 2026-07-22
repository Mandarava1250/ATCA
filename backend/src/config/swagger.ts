// ============================================
// 筑见山河 - Swagger/OpenAPI 配置
// ============================================

import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './app';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '筑见山河 API',
      version: '1.0.0',
      description: '中国古建筑文化传播平台 - 后端API文档',
      contact: {
        name: 'ATCA Development Team',
        email: 'dev@atca.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
        description: '开发环境',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'string' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                totalPages: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            userId: { type: 'number' },
            username: { type: 'string' },
            nickname: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            avatarUrl: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Architecture: {
          type: 'object',
          properties: {
            architecture_id: { type: 'number' },
            name: { type: 'string' },
            chinese_name: { type: 'string' },
            location: { type: 'string' },
            type: { type: 'string' },
            founding_dynasty: { type: 'string' },
            completed_dynasty: { type: 'string' },
            protection_level: { type: 'string' },
            brief_description: { type: 'string' },
            full_description: { type: 'string' },
            view_count: { type: 'number' },
            favorite_count: { type: 'number' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/**/*.ts',
    './src/middleware/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);