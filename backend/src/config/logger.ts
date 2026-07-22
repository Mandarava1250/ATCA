// ============================================
// 筑见山河 - 日志配置
// 实现条件触发机制，仅在发生错误时输出日志
// ============================================

/**
 * 日志级别定义
 * ERROR: 严重错误，导致系统无法正常运行
 * WARN: 警告信息，可能影响系统功能
 * INFO: 一般信息（已禁用）
 * DEBUG: 调试信息（已禁用）
 * TRACE: 追踪信息（已禁用）
 */
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

/**
 * 错误类型分级标准
 */
export enum ErrorType {
  SYSTEM_ERROR = 'SYS',      // 系统级错误
  DATABASE_ERROR = 'DB',     // 数据库错误
  API_ERROR = 'API',          // API错误
  BUSINESS_ERROR = 'BUS',     // 业务逻辑错误
  VALIDATION_ERROR = 'VAL',   // 验证错误
  AUTH_ERROR = 'AUTH',        // 认证授权错误
  AI_ERROR = 'AI',            // AI推理错误
}

/**
 * 日志上下文接口
 */
export interface LogContext {
  module?: string;
  method?: string;
  userId?: number;
  requestId?: string;
  errorType?: ErrorType;
  errorCode?: string;
  stack?: string;
  [key: string]: any;
}

/**
 * 格式化日志消息
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const errorType = context?.errorType || 'UNKNOWN';
  const module = context?.module || 'GLOBAL';
  const method = context?.method || '';
  const errorCode = context?.errorCode || '';
  
  let formatted = `[${timestamp}] [${level}] [${errorType}] [${module}]`;
  
  if (method) {
    formatted += ` [${method}]`;
  }
  
  if (errorCode) {
    formatted += ` - ${errorCode}: ${message}`;
  } else {
    formatted += ` - ${message}`;
  }
  
  // 添加堆栈信息（仅ERROR级别）
  if (level === 'ERROR' && context?.stack) {
    formatted += `\n${context.stack}`;
  }
  
  // 添加其他上下文信息
  if (context) {
    const filteredContext = { ...context };
    delete filteredContext.module;
    delete filteredContext.method;
    delete filteredContext.errorType;
    delete filteredContext.errorCode;
    delete filteredContext.stack;
    
    const contextKeys = Object.keys(filteredContext);
    if (contextKeys.length > 0) {
      formatted += ` | ${JSON.stringify(filteredContext)}`;
    }
  }
  
  return formatted;
}

// 日志记录器 - 仅记录ERROR和WARN级别
export const logger = {
  /**
   * 记录ERROR级别日志 - 始终输出
   * 捕获所有错误类型：运行时异常、业务逻辑错误、系统级错误
   */
  error: (message: string, context?: LogContext): void => {
    const formatted = formatMessage('ERROR', message, context);
    console.error(formatted);
  },

  /**
   * 记录WARN级别日志 - 始终输出
   * 用于提示警告信息，可能影响系统功能
   */
  warn: (message: string, context?: LogContext): void => {
    const timestamp = new Date().toISOString();
    const module = context?.module || 'GLOBAL';
    const method = context?.method || '';
    let formatted = `[${timestamp}] [WARN] [${module}]`;
    if (method) formatted += ` [${method}]`;
    formatted += ` - ${message}`;
    if (context) {
      const filteredContext = { ...context };
      delete filteredContext.module;
      delete filteredContext.method;
      const contextKeys = Object.keys(filteredContext);
      if (contextKeys.length > 0) {
        formatted += ` | ${JSON.stringify(filteredContext)}`;
      }
    }
    console.warn(formatted);
  },

  /**
   * 记录INFO级别日志 - 禁用
   */
  info: (_message: string, _context?: LogContext): void => {
    // 不输出INFO级别日志
  },

  /**
   * 记录DEBUG级别日志 - 禁用
   */
  debug: (_message: string, _context?: LogContext): void => {
    // 不输出DEBUG级别日志
  },

  /**
   * 记录TRACE级别日志 - 禁用
   */
  trace: (_message: string, _context?: LogContext): void => {
    // 不输出TRACE级别日志
  },
};

// 日志级别配置 - ERROR和WARN级别
export const logLevels: LogLevel[] = ['ERROR', 'WARN'];

// 检查日志级别是否启用
export function isLevelEnabled(level: LogLevel): boolean {
  return logLevels.includes(level);
}

export default logger;
