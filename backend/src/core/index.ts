/**
 * 筑见山河 - 核心模块入口
 * 导出服务注册框架和核心接口
 */

export {
  ServiceRegistry,
  serviceRegistry,
  ServiceState,
  RegisterService,
  IService,
  ServiceRegistration,
  ServiceRegistrationOptions,
  ServiceFactory
} from './ServiceRegistry';

export {
  registerCoreServices,
  initializeServices,
  checkServicesHealth,
  disposeServices,
  getServiceStatusSummary
} from './ServiceBootstrap';