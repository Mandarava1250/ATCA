// ============================================
// 华夏营造 - 请求验证中间件
// ============================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      res.status(400).json({
        success: false,
        error: {
          code: 'SYS_005',
          message: '请求参数验证失败',
          details: messages,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      res.status(400).json({
        success: false,
        error: {
          code: 'SYS_005',
          message: '查询参数验证失败',
          details: messages,
        },
      });
      return;
    }
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      res.status(400).json({
        success: false,
        error: {
          code: 'SYS_005',
          message: '路径参数验证失败',
          details: messages,
        },
      });
      return;
    }
    next();
  };
}
