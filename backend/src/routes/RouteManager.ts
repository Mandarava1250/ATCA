/**
 * 路由管理器
 * 负责自动注册所有控制器
 */

import 'reflect-metadata';
import { Router, Express } from 'express';
import { ControllerMethodMetadata } from '../controllers/Controller';

export class RouteManager {
  private controllers: any[] = [];

  registerController(controllerClass: any): void {
    this.controllers.push(controllerClass);
  }

  registerControllers(controllerClasses: any[]): void {
    this.controllers.push(...controllerClasses);
  }

  install(app: Express): void {
    for (const controllerClass of this.controllers) {
      this.installController(app, controllerClass);
    }
  }

  private installController(app: Express, controllerClass: any): void {
    const prefix = Reflect.getMetadata('controller:prefix', controllerClass) || '';
    const methods = Reflect.getMetadata('controller:methods', controllerClass) as Map<string, ControllerMethodMetadata>;
    
    if (!methods || methods.size === 0) {
      return;
    }

    const router = Router();
    const instance = new controllerClass();

    methods.forEach((metadata, methodName) => {
      const handler = (req: any, res: any, next: any) => {
        return instance[methodName](req, res, next);
      };

      const handlers = [...(metadata.middleware || []), handler];

      switch (metadata.method) {
        case 'get':
          router.get(metadata.path, ...handlers);
          break;
        case 'post':
          router.post(metadata.path, ...handlers);
          break;
        case 'put':
          router.put(metadata.path, ...handlers);
          break;
        case 'delete':
          router.delete(metadata.path, ...handlers);
          break;
        case 'patch':
          router.patch(metadata.path, ...handlers);
          break;
      }
    });

    app.use(prefix, router);
    console.log(`✅ 控制器路由注册完成: ${prefix}`);
  }

  getRoutes(): Array<{ prefix: string; routes: Array<{ path: string; method: string }> }> {
    const result: Array<{ prefix: string; routes: Array<{ path: string; method: string }> }> = [];

    for (const controllerClass of this.controllers) {
      const prefix = Reflect.getMetadata('controller:prefix', controllerClass) || '';
      const methods = Reflect.getMetadata('controller:methods', controllerClass) as Map<string, ControllerMethodMetadata>;
      
      if (!methods || methods.size === 0) continue;

      const routes: Array<{ path: string; method: string }> = [];
      methods.forEach((metadata) => {
        routes.push({
          path: metadata.path,
          method: metadata.method.toUpperCase()
        });
      });

      result.push({ prefix, routes });
    }

    return result;
  }
}