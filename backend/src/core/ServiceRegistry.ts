/**
 * 华夏营造 - 服务注册框架
 * 提供统一的单例服务注册、初始化和管理机制
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('ServiceRegistry');

/**
 * 服务生命周期状态
 */
export enum ServiceState {
  UNREGISTERED = 'unregistered',  // 未注册
  REGISTERED = 'registered',      // 已注册但未初始化
  INITIALIZING = 'initializing',  // 正在初始化
  READY = 'ready',                // 已就绪
  ERROR = 'error',                // 初始化失败
  DISPOSED = 'disposed'           // 已销毁
}

/**
 * 服务注册信息
 */
export interface ServiceRegistration<T> {
  id: string;                     // 服务唯一标识
  name: string;                   // 服务名称
  category: string;               // 服务类别（如 'ai', 'database', 'cache'）
  factory: ServiceFactory<T>;     // 服务工厂函数
  instance: T | null;             // 服务实例
  state: ServiceState;            // 当前状态
  dependencies: string[];         // 依赖的服务ID列表
  initPriority: number;           // 初始化优先级（数字越小优先级越高）
  description?: string;           // 服务描述
  error?: Error;                  // 错误信息
  initializedAt?: number;         // 初始化完成时间
}

/**
 * 服务工厂函数类型
 */
export type ServiceFactory<T> = () => T;

/**
 * 服务接口标准
 * 所有单例服务应实现此接口
 */
export interface IService {
  /**
   * 服务唯一标识
   */
  readonly serviceId: string;

  /**
   * 服务名称
   */
  readonly serviceName: string;

  /**
   * 初始化服务
   * @returns 初始化是否成功
   */
  initialize?(): Promise<void> | void;

  /**
   * 销毁服务（释放资源）
   */
  dispose?(): Promise<void> | void;

  /**
   * 获取服务状态
   */
  getState?(): ServiceState;

  /**
   * 健康检查
   * @returns 服务是否健康
   */
  healthCheck?(): Promise<boolean> | boolean;
}

/**
 * 服务注册选项
 */
export interface ServiceRegistrationOptions {
  name: string;
  category?: string;
  dependencies?: string[];
  initPriority?: number;
  description?: string;
  lazy?: boolean;  // 是否延迟初始化
}

/**
 * 服务注册中心
 * 集中管理所有单例服务的创建、初始化和销毁
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry | null = null;
  private registrations: Map<string, ServiceRegistration<any>> = new Map();
  private state: ServiceState = ServiceState.UNREGISTERED;

  /**
   * 获取服务注册中心单例
   */
  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * 重置服务注册中心（用于测试）
   */
  static resetInstance(): void {
    if (ServiceRegistry.instance) {
      ServiceRegistry.instance.disposeAll();
      ServiceRegistry.instance = null;
    }
  }

  private constructor() {
    logger.info('服务注册中心已创建');
  }

  /**
   * 注册服务
   * @param id 服务唯一标识
   * @param factory 服务工厂函数
   * @param options 注册选项
   */
  register<T extends IService>(
    id: string,
    factory: ServiceFactory<T>,
    options: ServiceRegistrationOptions
  ): void {
    if (this.registrations.has(id)) {
      logger.warn(`服务已注册，将覆盖: ${id}`);
      const existing = this.registrations.get(id)!;
      if (existing.instance && existing.state === ServiceState.READY) {
        this.disposeService(id);
      }
    }

    const registration: ServiceRegistration<T> = {
      id,
      name: options.name,
      category: options.category || 'default',
      factory,
      instance: null,
      state: ServiceState.REGISTERED,
      dependencies: options.dependencies || [],
      initPriority: options.initPriority || 100,
      description: options.description,
    };

    this.registrations.set(id, registration);
    logger.info(`服务已注册: ${id} (${options.name})`, {
      category: options.category,
      priority: options.initPriority,
      dependencies: options.dependencies
    });
  }

  /**
   * 批量注册服务
   * @param registrations 服务注册配置列表
   */
  registerAll(registrations: Array<{
    id: string;
    factory: ServiceFactory<any>;
    options: ServiceRegistrationOptions;
  }>): void {
    for (const reg of registrations) {
      this.register(reg.id, reg.factory, reg.options);
    }
  }

  /**
   * 获取服务实例
   * @param id 服务唯一标识
   * @returns 服务实例
   */
  get<T extends IService>(id: string): T {
    const registration = this.registrations.get(id);
    if (!registration) {
      throw new Error(`服务未注册: ${id}`);
    }

    if (registration.state === ServiceState.DISPOSED) {
      throw new Error(`服务已销毁: ${id}`);
    }

    if (registration.state === ServiceState.ERROR) {
      throw new Error(`服务初始化失败: ${id} - ${registration.error?.message}`);
    }

    // 如果实例不存在，创建实例
    if (!registration.instance) {
      registration.instance = registration.factory();
      registration.state = ServiceState.REGISTERED;
    }

    return registration.instance as unknown as T;
  }

  /**
   * 获取服务实例（异步，自动初始化）
   * @param id 服务唯一标识
   * @returns 服务实例
   */
  async getAsync<T extends IService>(id: string): Promise<T> {
    const instance = this.get<T>(id);
    
    // 如果服务未初始化且需要初始化，执行初始化
    const registration = this.registrations.get(id)!;
    if (registration.state === ServiceState.REGISTERED && typeof instance.initialize === 'function') {
      await this.initializeService(id);
    }

    return instance;
  }

  /**
   * 尝试获取服务（不抛出异常）
   * @param id 服务唯一标识
   * @returns 服务实例或null
   */
  tryGet<T extends IService>(id: string): T | null {
    try {
      return this.get<T>(id);
    } catch {
      return null;
    }
  }

  /**
   * 初始化单个服务
   * @param id 服务唯一标识
   */
  async initializeService(id: string): Promise<void> {
    const registration = this.registrations.get(id);
    if (!registration) {
      throw new Error(`服务未注册: ${id}`);
    }

    if (registration.state === ServiceState.READY) {
      return; // 已初始化
    }

    if (registration.state === ServiceState.INITIALIZING) {
      logger.warn(`服务正在初始化中: ${id}`);
      return;
    }

    // 检查依赖
    for (const depId of registration.dependencies) {
      const depReg = this.registrations.get(depId);
      if (!depReg) {
        throw new Error(`服务依赖未注册: ${id} -> ${depId}`);
      }
      if (depReg.state !== ServiceState.READY) {
        await this.initializeService(depId);
      }
    }

    registration.state = ServiceState.INITIALIZING;
    logger.info(`开始初始化服务: ${id}`);

    try {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }

      if (registration.instance.initialize) {
        await registration.instance.initialize();
      }

      registration.state = ServiceState.READY;
      registration.initializedAt = Date.now();
      logger.info(`服务初始化完成: ${id}`, { duration: registration.initializedAt });
    } catch (error) {
      registration.state = ServiceState.ERROR;
      registration.error = error as Error;
      logger.error(`服务初始化失败: ${id}`, { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 初始化所有已注册的服务
   * 按优先级顺序初始化，处理依赖关系
   */
  async initializeAll(): Promise<void> {
    this.state = ServiceState.INITIALIZING;
    logger.info('开始初始化所有服务');

    // 按优先级排序
    const sortedRegistrations = Array.from(this.registrations.values())
      .sort((a, b) => a.initPriority - b.initPriority);

    const errors: Array<{ id: string; error: Error }> = [];

    for (const registration of sortedRegistrations) {
      try {
        await this.initializeService(registration.id);
      } catch (error) {
        errors.push({ id: registration.id, error: error as Error });
        // 继续初始化其他服务，不中断
      }
    }

    this.state = errors.length === 0 ? ServiceState.READY : ServiceState.ERROR;

    if (errors.length > 0) {
      logger.warn(`服务初始化完成，但有 ${errors.length} 个失败`, { errors });
    } else {
      logger.info('所有服务初始化完成');
    }
  }

  /**
   * 销毁单个服务
   * @param id 服务唯一标识
   */
  async disposeService(id: string): Promise<void> {
    const registration = this.registrations.get(id);
    if (!registration) {
      return;
    }

    if (registration.state === ServiceState.DISPOSED) {
      return;
    }

    logger.info(`开始销毁服务: ${id}`);

    try {
      if (registration.instance && registration.instance.dispose) {
        await registration.instance.dispose();
      }
      registration.instance = null;
      registration.state = ServiceState.DISPOSED;
      logger.info(`服务已销毁: ${id}`);
    } catch (error) {
      logger.error(`服务销毁失败: ${id}`, { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * 销毁所有服务
   */
  async disposeAll(): Promise<void> {
    logger.info('开始销毁所有服务');

    // 按优先级逆序销毁（先销毁依赖的服务）
    const sortedRegistrations = Array.from(this.registrations.values())
      .sort((a, b) => b.initPriority - a.initPriority);

    for (const registration of sortedRegistrations) {
      try {
        await this.disposeService(registration.id);
      } catch (error) {
        logger.error(`销毁服务失败: ${registration.id}`, { error: (error as Error).message });
      }
    }

    this.state = ServiceState.DISPOSED;
    logger.info('所有服务已销毁');
  }

  /**
   * 获取服务状态
   * @param id 服务唯一标识
   */
  getServiceState(id: string): ServiceState | null {
    const registration = this.registrations.get(id);
    return registration?.state || null;
  }

  /**
   * 获取注册中心状态
   */
  getState(): ServiceState {
    return this.state;
  }

  /**
   * 获取所有已注册服务的信息
   */
  getAllRegistrations(): ServiceRegistration<any>[] {
    return Array.from(this.registrations.values());
  }

  /**
   * 获取指定类别的服务
   * @param category 服务类别
   */
  getServicesByCategory(category: string): IService[] {
    return Array.from(this.registrations.values())
      .filter(reg => reg.category === category && reg.instance)
      .map(reg => reg.instance);
  }

  /**
   * 健康检查所有服务
   * @returns 健康检查结果
   */
  async healthCheckAll(): Promise<{
    healthy: number;
    unhealthy: number;
    details: Array<{ id: string; name: string; healthy: boolean; error?: string }>;
  }> {
    const details: Array<{ id: string; name: string; healthy: boolean; error?: string }> = [];
    let healthy = 0;
    let unhealthy = 0;

    for (const registration of this.registrations.values()) {
      if (registration.state !== ServiceState.READY || !registration.instance) {
        details.push({
          id: registration.id,
          name: registration.name,
          healthy: false,
          error: `服务状态: ${registration.state}`
        });
        unhealthy++;
        continue;
      }

      try {
        const isHealthy = registration.instance.healthCheck
          ? await registration.instance.healthCheck()
          : true;

        details.push({
          id: registration.id,
          name: registration.name,
          healthy: isHealthy
        });

        if (isHealthy) {
          healthy++;
        } else {
          unhealthy++;
        }
      } catch (error) {
        details.push({
          id: registration.id,
          name: registration.name,
          healthy: false,
          error: (error as Error).message
        });
        unhealthy++;
      }
    }

    return { healthy, unhealthy, details };
  }

  /**
   * 验证服务注册完整性
   * @returns 验证结果
   */
  validateRegistrations(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查依赖是否存在
    for (const registration of this.registrations.values()) {
      for (const depId of registration.dependencies) {
        if (!this.registrations.has(depId)) {
          errors.push(`服务 ${registration.id} 依赖的服务 ${depId} 未注册`);
        }
      }
    }

    // 检查循环依赖
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCycle = (id: string): boolean => {
      visited.add(id);
      recursionStack.add(id);

      const registration = this.registrations.get(id);
      if (registration) {
        for (const depId of registration.dependencies) {
          if (!visited.has(depId)) {
            if (checkCycle(depId)) {
              return true;
            }
          } else if (recursionStack.has(depId)) {
            errors.push(`存在循环依赖: ${id} -> ${depId}`);
            return true;
          }
        }
      }

      recursionStack.delete(id);
      return false;
    };

    for (const id of this.registrations.keys()) {
      if (!visited.has(id)) {
        checkCycle(id);
      }
    }

    // 检查是否有未初始化的服务
    for (const registration of this.registrations.values()) {
      if (registration.state === ServiceState.REGISTERED) {
        warnings.push(`服务 ${registration.id} 已注册但未初始化`);
      }
      if (registration.state === ServiceState.ERROR) {
        warnings.push(`服务 ${registration.id} 初始化失败: ${registration.error?.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * 服务装饰器
 * 用于自动注册服务类
 */
export function RegisterService(options: ServiceRegistrationOptions): ClassDecorator {
  return (target: any) => {
    const id = options.name.toLowerCase().replace(/\s+/g, '-');
    const factory = () => new target();
    
    // 在类上存储注册信息，供后续注册
    target.__serviceRegistration = {
      id,
      factory,
      options
    };
  };
}

/**
 * 获取服务注册中心实例的便捷方法
 */
export const serviceRegistry = ServiceRegistry.getInstance();