/**
 * 控制器基类
 * 提供统一的响应格式和错误处理
 */

import 'reflect-metadata';
import { Response } from 'express';

export interface ControllerMethodMetadata {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  middleware?: any[];
}

export interface ControllerClassMetadata {
  prefix: string;
  methods: Map<string, ControllerMethodMetadata>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: number;
}

export abstract class BaseController {
  protected sendSuccess<T>(res: Response, data: T, message: string = '操作成功'): void {
    res.json({
      success: true,
      message,
      data
    });
  }

  protected sendError(res: Response, error: string, code: number = 500): void {
    res.status(code).json({
      success: false,
      error,
      code
    });
  }

  protected sendValidationError(res: Response, errors: string[]): void {
    res.status(400).json({
      success: false,
      error: '参数验证失败',
      code: 400,
      details: errors
    });
  }

  protected sendNotFound(res: Response, message: string = '资源未找到'): void {
    res.status(404).json({
      success: false,
      error: message,
      code: 404
    });
  }

  protected sendUnauthorized(res: Response, message: string = '未授权访问'): void {
    res.status(401).json({
      success: false,
      error: message,
      code: 401
    });
  }

  protected sendForbidden(res: Response, message: string = '禁止访问'): void {
    res.status(403).json({
      success: false,
      error: message,
      code: 403
    });
  }
}

export function Controller(prefix: string): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('controller:prefix', prefix, target);
    // 检查是否已存在 methods 元数据（可能已被方法装饰器创建）
    let methods = Reflect.getMetadata('controller:methods', target) as Map<string, ControllerMethodMetadata>;
    if (!methods) {
      methods = new Map<string, ControllerMethodMetadata>();
      Reflect.defineMetadata('controller:methods', methods, target);
    }
  };
}

export function Get(path: string, middleware: any[] = []): MethodDecorator {
  return createRouteDecorator('get', path, middleware);
}

export function Post(path: string, middleware: any[] = []): MethodDecorator {
  return createRouteDecorator('post', path, middleware);
}

export function Put(path: string, middleware: any[] = []): MethodDecorator {
  return createRouteDecorator('put', path, middleware);
}

export function Delete(path: string, middleware: any[] = []): MethodDecorator {
  return createRouteDecorator('delete', path, middleware);
}

export function Patch(path: string, middleware: any[] = []): MethodDecorator {
  return createRouteDecorator('patch', path, middleware);
}

function createRouteDecorator(
  method: 'get' | 'post' | 'put' | 'delete' | 'patch',
  path: string,
  middleware: any[]
): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    let methods = Reflect.getMetadata('controller:methods', target.constructor) as Map<string, ControllerMethodMetadata>;
    
    // 如果元数据不存在，创建新的 Map 并保存
    if (!methods) {
      methods = new Map<string, ControllerMethodMetadata>();
      Reflect.defineMetadata('controller:methods', methods, target.constructor);
    }
    
    methods.set(propertyKey.toString(), { path, method, middleware });
  };
}