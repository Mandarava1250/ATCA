// ============================================
// 华夏营造 - 统一错误码注册表
// 全局统一的错误码管理，分类管理业务错误、系统错误、权限错误等
// 每个错误码包含唯一标识、错误信息、解决方案和HTTP状态码映射
// ============================================

/**
 * 错误码分类
 */
export enum ErrorCategory {
  AUTH = 'AUTH',           // 认证授权错误
  VALIDATION = 'VALID',    // 数据验证错误
  BUSINESS = 'BIZ',        // 业务逻辑错误
  SYSTEM = 'SYS',          // 系统错误
  DATABASE = 'DB',         // 数据库错误
  EXTERNAL = 'EXT',        // 外部服务错误
  RESOURCE = 'RES',        // 资源错误
}

/**
 * 错误码定义
 */
export interface ErrorCodeDefinition {
  code: string;
  message: string;
  description: string;
  httpStatus: number;
  category: ErrorCategory;
  solution?: string;
}

/**
 * 错误响应格式
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
  };
}

// ============================================
// 认证授权错误 (AUTH_XXX)
// ============================================
export const AUTH_ERRORS = {
  AUTH_001: {
    code: 'AUTH_001',
    message: '用户名或密码错误',
    description: '用户登录时提供的凭据不正确',
    httpStatus: 401,
    category: ErrorCategory.AUTH,
    solution: '请检查用户名和密码是否正确',
  },
  AUTH_002: {
    code: 'AUTH_002',
    message: '令牌已过期或无效',
    description: 'JWT令牌已过期或格式无效',
    httpStatus: 401,
    category: ErrorCategory.AUTH,
    solution: '请重新登录获取新令牌',
  },
  AUTH_003: {
    code: 'AUTH_003',
    message: '未提供认证令牌',
    description: '请求需要认证但未提供令牌',
    httpStatus: 401,
    category: ErrorCategory.AUTH,
    solution: '请先登录获取认证令牌',
  },
  AUTH_004: {
    code: 'AUTH_004',
    message: '权限不足',
    description: '用户没有执行此操作的权限',
    httpStatus: 403,
    category: ErrorCategory.AUTH,
    solution: '请联系管理员获取相应权限',
  },
  AUTH_005: {
    code: 'AUTH_005',
    message: '账户已被禁用',
    description: '用户账户已被管理员禁用',
    httpStatus: 403,
    category: ErrorCategory.AUTH,
    solution: '请联系管理员恢复账户',
  },
  AUTH_006: {
    code: 'AUTH_006',
    message: '刷新令牌无效',
    description: '刷新令牌已过期或无效',
    httpStatus: 401,
    category: ErrorCategory.AUTH,
    solution: '请重新登录',
  },
  AUTH_007: {
    code: 'AUTH_007',
    message: '密码强度不足',
    description: '密码不符合安全策略要求',
    httpStatus: 400,
    category: ErrorCategory.AUTH,
    solution: '密码至少8位，需包含大小写字母、数字和特殊字符中的至少三种',
  },
  AUTH_008: {
    code: 'AUTH_008',
    message: '用户名已存在',
    description: '注册时用户名已被占用',
    httpStatus: 409,
    category: ErrorCategory.AUTH,
    solution: '请使用其他用户名',
  },
  AUTH_009: {
    code: 'AUTH_009',
    message: '登录尝试次数过多',
    description: '短时间内登录失败次数超过限制',
    httpStatus: 429,
    category: ErrorCategory.AUTH,
    solution: '请稍后再试或重置密码',
  },
} as const;

// ============================================
// 数据验证错误 (VALID_XXX)
// ============================================
export const VALIDATION_ERRORS = {
  VALID_001: {
    code: 'VALID_001',
    message: '请求参数无效',
    description: '请求体或查询参数不符合要求',
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    solution: '请检查请求参数格式',
  },
  VALID_002: {
    code: 'VALID_002',
    message: '必填字段缺失',
    description: '请求缺少必需的字段',
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    solution: '请提供所有必填字段',
  },
  VALID_003: {
    code: 'VALID_003',
    message: '字段格式错误',
    description: '字段值格式不正确',
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    solution: '请检查字段格式要求',
  },
  VALID_004: {
    code: 'VALID_004',
    message: '字段值超出范围',
    description: '字段值超出允许的范围',
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    solution: '请调整字段值到允许范围内',
  },
  VALID_005: {
    code: 'VALID_005',
    message: 'URL长度超限',
    description: 'URL或缩略图地址长度超过限制',
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    solution: 'URL长度不应超过2048字符',
  },
} as const;

// ============================================
// 业务逻辑错误 (BIZ_XXX)
// ============================================
export const BUSINESS_ERRORS = {
  BIZ_001: {
    code: 'BIZ_001',
    message: '模型不存在',
    description: '请求的3D模型不存在',
    httpStatus: 404,
    category: ErrorCategory.BUSINESS,
    solution: '请检查模型ID是否正确',
  },
  BIZ_002: {
    code: 'BIZ_002',
    message: '构件不存在',
    description: '请求的构件不存在',
    httpStatus: 404,
    category: ErrorCategory.BUSINESS,
    solution: '请检查构件ID是否正确',
  },
  BIZ_003: {
    code: 'BIZ_003',
    message: '操作冲突',
    description: '当前操作与其他操作冲突',
    httpStatus: 409,
    category: ErrorCategory.BUSINESS,
    solution: '请稍后重试',
  },
  BIZ_004: {
    code: 'BIZ_004',
    message: '配额已用尽',
    description: '用户已达到资源配额上限',
    httpStatus: 429,
    category: ErrorCategory.BUSINESS,
    solution: '请升级套餐或删除部分资源',
  },
  BIZ_005: {
    code: 'BIZ_005',
    message: '模型正在处理中',
    description: '模型正在进行其他操作',
    httpStatus: 423,
    category: ErrorCategory.BUSINESS,
    solution: '请等待当前操作完成',
  },
  BIZ_006: {
    code: 'BIZ_006',
    message: '分享链接已过期',
    description: '建筑分享链接已过期',
    httpStatus: 410,
    category: ErrorCategory.BUSINESS,
    solution: '请联系所有者获取新的分享链接',
  },
} as const;

// ============================================
// 系统错误 (SYS_XXX)
// ============================================
export const SYSTEM_ERRORS = {
  SYS_001: {
    code: 'SYS_001',
    message: '服务器内部错误',
    description: '服务器发生未预期的错误',
    httpStatus: 500,
    category: ErrorCategory.SYSTEM,
    solution: '请稍后重试，如问题持续请联系技术支持',
  },
  SYS_002: {
    code: 'SYS_002',
    message: '服务暂时不可用',
    description: '服务器正在维护或过载',
    httpStatus: 503,
    category: ErrorCategory.SYSTEM,
    solution: '请稍后重试',
  },
  SYS_003: {
    code: 'SYS_003',
    message: '请求超时',
    description: '服务器处理请求超时',
    httpStatus: 504,
    category: ErrorCategory.SYSTEM,
    solution: '请稍后重试或简化请求内容',
  },
  SYS_004: {
    code: 'SYS_004',
    message: '功能未实现',
    description: '请求的功能尚未实现',
    httpStatus: 501,
    category: ErrorCategory.SYSTEM,
    solution: '该功能正在开发中',
  },
  SYS_005: {
    code: 'SYS_005',
    message: '配置错误',
    description: '服务器配置存在问题',
    httpStatus: 500,
    category: ErrorCategory.SYSTEM,
    solution: '请联系管理员检查配置',
  },
} as const;

// ============================================
// 数据库错误 (DB_XXX)
// ============================================
export const DATABASE_ERRORS = {
  DB_001: {
    code: 'DB_001',
    message: '数据库连接失败',
    description: '无法连接到数据库',
    httpStatus: 503,
    category: ErrorCategory.DATABASE,
    solution: '请稍后重试',
  },
  DB_002: {
    code: 'DB_002',
    message: '数据保存失败',
    description: '数据写入数据库失败',
    httpStatus: 500,
    category: ErrorCategory.DATABASE,
    solution: '请稍后重试',
  },
  DB_003: {
    code: 'DB_003',
    message: '事务执行失败',
    description: '数据库事务执行过程中发生错误',
    httpStatus: 500,
    category: ErrorCategory.DATABASE,
    solution: '请稍后重试，数据已回滚',
  },
  DB_004: {
    code: 'DB_004',
    message: '数据一致性错误',
    description: '检测到数据不一致',
    httpStatus: 500,
    category: ErrorCategory.DATABASE,
    solution: '请联系技术支持',
  },
  DB_005: {
    code: 'DB_005',
    message: '唯一约束冲突',
    description: '数据违反唯一性约束',
    httpStatus: 409,
    category: ErrorCategory.DATABASE,
    solution: '请检查是否存在重复数据',
  },
} as const;

// ============================================
// 资源错误 (RES_XXX)
// ============================================
export const RESOURCE_ERRORS = {
  RES_001: {
    code: 'RES_001',
    message: '资源不存在',
    description: '请求的资源不存在',
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    solution: '请检查资源路径是否正确',
  },
  RES_002: {
    code: 'RES_002',
    message: '文件上传失败',
    description: '文件上传过程中发生错误',
    httpStatus: 500,
    category: ErrorCategory.RESOURCE,
    solution: '请检查文件格式和大小',
  },
  RES_003: {
    code: 'RES_003',
    message: '文件大小超限',
    description: '上传文件超过允许的大小',
    httpStatus: 413,
    category: ErrorCategory.RESOURCE,
    solution: '请压缩文件或选择更小的文件',
  },
  RES_004: {
    code: 'RES_004',
    message: '不支持的文件类型',
    description: '上传的文件类型不被支持',
    httpStatus: 415,
    category: ErrorCategory.RESOURCE,
    solution: '请上传支持的文件格式',
  },
  RES_005: {
    code: 'RES_005',
    message: '存储空间不足',
    description: '服务器存储空间不足',
    httpStatus: 507,
    category: ErrorCategory.RESOURCE,
    solution: '请联系管理员',
  },
} as const;

// ============================================
// 外部服务错误 (EXT_XXX)
// ============================================
export const EXTERNAL_ERRORS = {
  EXT_001: {
    code: 'EXT_001',
    message: '外部服务调用失败',
    description: '调用第三方服务失败',
    httpStatus: 502,
    category: ErrorCategory.EXTERNAL,
    solution: '请稍后重试',
  },
  EXT_002: {
    code: 'EXT_002',
    message: '邮件发送失败',
    description: '邮件服务调用失败',
    httpStatus: 500,
    category: ErrorCategory.EXTERNAL,
    solution: '请稍后重试或联系客服',
  },
  EXT_003: {
    code: 'EXT_003',
    message: '短信发送失败',
    description: '短信服务调用失败',
    httpStatus: 500,
    category: ErrorCategory.EXTERNAL,
    solution: '请稍后重试',
  },
} as const;

// ============================================
// 错误码注册表
// ============================================
export const ERROR_REGISTRY: Record<string, ErrorCodeDefinition> = {
  ...AUTH_ERRORS,
  ...VALIDATION_ERRORS,
  ...BUSINESS_ERRORS,
  ...SYSTEM_ERRORS,
  ...DATABASE_ERRORS,
  ...RESOURCE_ERRORS,
  ...EXTERNAL_ERRORS,
};

/**
 * 获取错误码定义
 */
export function getErrorDefinition(code: string): ErrorCodeDefinition | undefined {
  return ERROR_REGISTRY[code];
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  details?: unknown,
  requestId?: string
): ErrorResponse {
  const definition = getErrorDefinition(code);
  
  return {
    success: false,
    error: {
      code,
      message: definition?.message || '未知错误',
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * 获取HTTP状态码
 */
export function getHttpStatus(code: string): number {
  const definition = getErrorDefinition(code);
  return definition?.httpStatus || 500;
}

/**
 * 错误码构建器（用于快速创建错误响应）
 */
export class ErrorBuilder {
  private code: string;
  private details?: unknown;
  private requestId?: string;

  constructor(code: string) {
    this.code = code;
  }

  withDetails(details: unknown): ErrorBuilder {
    this.details = details;
    return this;
  }

  withRequestId(requestId: string): ErrorBuilder {
    this.requestId = requestId;
    return this;
  }

  build(): ErrorResponse {
    return createErrorResponse(this.code, this.details, this.requestId);
  }

  getHttpStatus(): number {
    return getHttpStatus(this.code);
  }
}

// 便捷函数
export function error(code: string): ErrorBuilder {
  return new ErrorBuilder(code);
}