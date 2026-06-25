/**
 * 华夏营造 - 服务注册初始化
 * 在应用启动时注册所有单例服务
 */

import { serviceRegistry, ServiceState } from '../core';
import { AuthService } from '../services/AuthService';
import { KnowledgeBaseService } from '../services/KnowledgeBaseService';
import { KnowledgeGraphService } from '../services/KnowledgeGraphService';
import { LocalAIService } from '../utils/LocalAIService';
import { createLogger } from '../utils/logger';

const logger = createLogger('ServiceBootstrap');

/**
 * 注册所有核心服务
 */
export function registerCoreServices(): void {
  logger.info('开始注册核心服务...');

  // 认证服务 - 高优先级，无依赖
  serviceRegistry.register(
    'auth-service',
    AuthService.createInstance,
    {
      name: '认证服务',
      category: 'security',
      initPriority: 10,
      description: 'JWT认证、令牌黑名单管理',
      dependencies: []
    }
  );

  // 本地AI服务 - 中优先级，无依赖
  serviceRegistry.register(
    'local-ai-service',
    LocalAIService.createInstance,
    {
      name: '本地AI服务',
      category: 'ai',
      initPriority: 20,
      description: 'RAG架构知识库增强AI推理',
      dependencies: []
    }
  );

  // 知识库服务 - 中优先级，依赖本地AI服务
  serviceRegistry.register(
    'knowledge-base-service',
    KnowledgeBaseService.createInstance,
    {
      name: '知识库服务',
      category: 'knowledge',
      initPriority: 30,
      description: '古建筑知识库数据管理',
      dependencies: ['local-ai-service']
    }
  );

  // 知识图谱服务 - 中优先级，依赖知识库服务
  serviceRegistry.register(
    'knowledge-graph-service',
    KnowledgeGraphService.createInstance,
    {
      name: '知识图谱服务',
      category: 'knowledge',
      initPriority: 40,
      description: '知识图谱导入、验证、关系管理',
      dependencies: ['knowledge-base-service']
    }
  );

  logger.info('核心服务注册完成', {
    count: serviceRegistry.getAllRegistrations().length
  });
}

/**
 * 初始化所有已注册服务
 */
export async function initializeServices(): Promise<void> {
  logger.info('开始初始化所有服务...');

  // 验证服务注册完整性
  const validation = serviceRegistry.validateRegistrations();
  if (!validation.valid) {
    logger.error('服务注册验证失败', { errors: validation.errors });
    throw new Error(`服务注册验证失败: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    logger.warn('服务注册验证警告', { warnings: validation.warnings });
  }

  // 初始化所有服务
  await serviceRegistry.initializeAll();

  // 检查未初始化的服务（初始化完成后）
  const uninitializedWarnings = serviceRegistry.checkInitializedStatus();
  if (uninitializedWarnings.length > 0) {
    logger.warn('服务注册验证警告', { warnings: uninitializedWarnings });
  }

  // 检查初始化结果
  const registrations = serviceRegistry.getAllRegistrations();
  const failed = registrations.filter(r => r.state === ServiceState.ERROR);

  if (failed.length > 0) {
    logger.warn(`部分服务初始化失败`, {
      failed: failed.map(r => ({ id: r.id, error: r.error?.message }))
    });
  }

  logger.info('服务初始化完成', {
    total: registrations.length,
    ready: registrations.filter(r => r.state === ServiceState.READY).length,
    failed: failed.length
  });
}

/**
 * 执行服务健康检查
 */
export async function checkServicesHealth(): Promise<{
  healthy: number;
  unhealthy: number;
  details: Array<{ id: string; name: string; healthy: boolean; error?: string }>;
}> {
  const result = await serviceRegistry.healthCheckAll();

  if (result.unhealthy > 0) {
    logger.warn('健康检查发现问题', {
      unhealthy: result.unhealthy,
      details: result.details.filter(d => !d.healthy)
    });
  } else {
    logger.info('所有服务健康检查通过', { healthy: result.healthy });
  }

  return result;
}

/**
 * 销毁所有服务（应用关闭时调用）
 */
export async function disposeServices(): Promise<void> {
  logger.info('开始销毁所有服务...');
  await serviceRegistry.disposeAll();
  logger.info('所有服务已销毁');
}

/**
 * 获取服务注册状态摘要
 */
export function getServiceStatusSummary(): {
  state: ServiceState;
  services: Array<{ id: string; name: string; state: ServiceState; category: string }>;
} {
  const registrations = serviceRegistry.getAllRegistrations();

  return {
    state: serviceRegistry.getState(),
    services: registrations.map(r => ({
      id: r.id,
      name: r.name,
      state: r.state,
      category: r.category
    }))
  };
}