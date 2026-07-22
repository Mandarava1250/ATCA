// ============================================
// 筑见山河 - 全局错误处理中间件 (优化版)
// ============================================

import { Request, Response, NextFunction } from 'express';
import { logger, ErrorType } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  errorType?: ErrorType;
}

/**
 * 错误处理中间件
 * 使用优化后的日志系统记录错误信息
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 确定错误类型
  let errorType = err.errorType || ErrorType.SYSTEM_ERROR;
  let errorCode = err.code || 'SYS_002';
  
  // 根据HTTP状态码确定错误类型
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    errorType = ErrorType.SYSTEM_ERROR;
  } else if (statusCode === 401 || statusCode === 403) {
    errorType = ErrorType.AUTH_ERROR;
    errorCode = err.code || 'AUTH_001';
  } else if (statusCode === 400) {
    errorType = ErrorType.VALIDATION_ERROR;
    errorCode = err.code || 'VAL_001';
  } else if (statusCode === 404) {
    errorType = ErrorType.API_ERROR;
    errorCode = 'API_001';
  }

  // 使用优化后的日志系统记录错误
  logger.error(err.message || '服务器内部错误', {
    module: 'errorHandler',
    method: req.method,
    requestId: (req as any).requestId,
    userId: (req as any).userId,
    errorType,
    errorCode,
    stack: err.stack,
    url: req.originalUrl,
    statusCode,
  });

  // 返回标准化的错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || '服务器内部错误',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * 404处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  // 记录404错误
  logger.warn(`路径 ${req.originalUrl} 不存在`, {
    module: 'notFoundHandler',
    method: req.method,
    url: req.originalUrl,
    errorType: ErrorType.API_ERROR,
    errorCode: 'API_001',
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'API_001',
      message: `路径 ${req.originalUrl} 不存在`,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * 异步处理包装器
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
