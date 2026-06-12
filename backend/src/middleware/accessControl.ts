// ============================================
// 华夏营造 - 访问控制中间件
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { createLogger } from '../utils/logger';

const logger = createLogger('AccessControl');

// ============================================
// 角色定义
// ============================================

export type Role = 'admin' | 'moderator' | 'user' | 'guest';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | '*';
}

// ============================================
// 角色权限映射
// ============================================

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    { resource: '*', action: '*' },
  ],
  moderator: [
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update' },
    { resource: 'architecture', action: '*' },
    { resource: 'quiz', action: '*' },
    { resource: 'social', action: 'delete' },
  ],
  user: [
    { resource: 'user', action: 'read' },
    { resource: 'user', action: 'update' },
    { resource: 'architecture', action: 'read' },
    { resource: 'quiz', action: '*' },
    { resource: 'social', action: 'create' },
    { resource: 'social', action: 'read' },
    { resource: 'social', action: 'update' },
    { resource: 'model3d', action: '*' },
    { resource: 'profile', action: '*' },
  ],
  guest: [
    { resource: 'architecture', action: 'read' },
    { resource: 'quiz', action: 'read' },
    { resource: 'index', action: 'read' },
    { resource: 'knowledge', action: 'read' },
  ],
};

// ============================================
// 检查权限
// ============================================

function hasPermission(role: Role, resource: string, action: string): boolean {
  const permissions = rolePermissions[role] || [];
  
  for (const perm of permissions) {
    const resourceMatch = perm.resource === '*' || perm.resource === resource;
    const actionMatch = perm.action === '*' || perm.action === action;
    
    if (resourceMatch && actionMatch) {
      return true;
    }
  }
  
  return false;
}

// ============================================
// 角色检查中间件
// ============================================

export function requireRole(requiredRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      logger.warn('未认证用户尝试访问受保护资源', { path: req.path, ip: req.ip });
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: '未认证',
          details: '请先登录',
        },
      });
      return;
    }
    
    const userRole = authReq.user.role as Role;
    
    // 管理员拥有所有权限
    if (userRole === 'admin') {
      next();
      return;
    }
    
    // 检查角色是否匹配
    if (userRole !== requiredRole) {
      logger.warn('权限不足', { 
        userId: authReq.user.userId, 
        userRole, 
        requiredRole, 
        path: req.path 
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_005',
          message: '权限不足',
          details: `需要 ${requiredRole} 角色`,
        },
      });
      return;
    }
    
    next();
  };
}

// ============================================
// 权限检查中间件
// ============================================

export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      logger.warn('未认证用户尝试访问受保护资源', { path: req.path, ip: req.ip });
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: '未认证',
          details: '请先登录',
        },
      });
      return;
    }
    
    const userRole = authReq.user.role as Role;
    
    if (!hasPermission(userRole, resource, action)) {
      logger.warn('权限不足', { 
        userId: authReq.user.userId, 
        userRole, 
        resource, 
        action, 
        path: req.path 
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_005',
          message: '权限不足',
          details: `用户没有对 ${resource} 执行 ${action} 的权限`,
        },
      });
      return;
    }
    
    next();
  };
}

// ============================================
// 用户资源所有权检查
// ============================================

export function requireOwnership(resourceGetter: (req: AuthRequest) => Promise<number | null>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: '未认证',
          details: '请先登录',
        },
      });
      return;
    }
    
    // 管理员可以访问所有资源
    if (authReq.user.role === 'admin') {
      next();
      return;
    }
    
    try {
      const ownerId = await resourceGetter(authReq);
      
      if (ownerId === null) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '资源不存在',
          },
        });
        return;
      }
      
      if (ownerId !== authReq.user.userId) {
        logger.warn('尝试访问非自有资源', { 
          userId: authReq.user.userId, 
          ownerId, 
          path: req.path 
        });
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_005',
            message: '权限不足',
            details: '只能访问自己的资源',
          },
        });
        return;
      }
      
      next();
    } catch (err) {
      logger.error('所有权检查失败', { error: (err as Error).message });
      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_001',
          message: '服务器内部错误',
        },
      });
    }
  };
}

// ============================================
// 会话超时检查
// ============================================

export function sessionTimeoutCheck(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;
  
  if (!authReq.user) {
    next();
    return;
  }
  
  // 检查会话创建时间
  const iat = authReq.user.iat || Math.floor(Date.now() / 1000);
  const sessionAge = Date.now() - iat * 1000;
  const maxSessionAge = 24 * 60 * 60 * 1000; // 24小时
  
  if (sessionAge > maxSessionAge) {
    logger.warn('会话超时', { userId: authReq.user.userId });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_004',
        message: '会话已过期',
        details: '请重新登录',
      },
    });
    return;
  }
  
  next();
}

// ============================================
// API密钥验证中间件
// ============================================

export function apiKeyValidation(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];
  
  // 如果配置了API密钥，进行验证
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    logger.warn('无效的API密钥', { ip: req.ip });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_014',
        message: '无效的API密钥',
      },
    });
    return;
  }
  
  next();
}