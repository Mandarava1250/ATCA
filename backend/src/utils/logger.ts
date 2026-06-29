// ============================================
// 华夏营造 - 日志工具 (优化版)
// 实现条件触发机制，仅在发生错误时输出日志
// 增强版：支持AI推理过程日志记录
// ============================================

/**
 * 日志级别定义
 * ERROR: 严重错误，导致系统无法正常运行
 * WARN: 警告信息，可能影响系统功能
 * INFO: 一般信息，用于追踪系统状态
 * DEBUG: 调试信息，仅在开发环境显示
 * TRACE: 追踪信息，用于记录AI推理过程
 */
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';

/**
 * 错误类型分级标准
 */
export enum ErrorType {
  // 系统级错误
  SYSTEM_ERROR = 'SYS',
  // 数据库错误
  DATABASE_ERROR = 'DB',
  // API错误
  API_ERROR = 'API',
  // 业务逻辑错误
  BUSINESS_ERROR = 'BUS',
  // 验证错误
  VALIDATION_ERROR = 'VAL',
  // 认证授权错误
  AUTH_ERROR = 'AUTH',
  // AI推理错误
  AI_ERROR = 'AI',
}

/**
 * AI推理步骤类型
 */
export enum AIReasoningStep {
  INPUT_PARSING = 'INPUT_PARSING',           // 输入解析
  KNOWLEDGE_RETRIEVAL = 'KNOWLEDGE_RETRIEVAL', // 知识检索
  CONTEXT_BUILDING = 'CONTEXT_BUILDING',     // 上下文构建
  RESPONSE_GENERATION = 'RESPONSE_GENERATION', // 响应生成
  CONFLICT_DETECTION = 'CONFLICT_DETECTION', // 冲突检测
  QUALITY_ASSESSMENT = 'QUALITY_ASSESSMENT', // 质量评估
  DEVIATION_ANALYSIS = 'DEVIATION_ANALYSIS', // 偏离分析
}

/**
 * AI推理日志接口
 */
export interface AIReasoningLog {
  step: AIReasoningStep;
  stepName: string;
  input?: any;
  output?: any;
  duration?: number;
  decision?: string;
  reasoning?: string;
  confidence?: number;
  metadata?: Record<string, any>;
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
  // AI推理相关
  aiReasoning?: AIReasoningLog;
  [key: string]: any;
}

/**
 * 日志输出格式规范
 * [时间戳] [日志级别] [错误类型] [模块] [方法] - 错误码: 错误信息 | 上下文信息
 */
class Logger {
  private module: string;
  private enabledLevels: LogLevel[];

  constructor(module: string) {
    this.module = module;
    // 仅输出ERROR和WARN级别 - 生产环境和开发环境均如此
    // INFO/DEBUG/TRACE级别不输出日志
    this.enabledLevels = ['ERROR', 'WARN'];
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const errorType = context?.errorType || 'UNKNOWN';
    const method = context?.method || '';
    const errorCode = context?.errorCode || '';
    
    let formatted = `[${timestamp}] [${level}] [${errorType}] [${this.module}]`;
    
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
      delete filteredContext.aiReasoning;
      
      const contextKeys = Object.keys(filteredContext);
      if (contextKeys.length > 0) {
        formatted += ` | ${JSON.stringify(filteredContext)}`;
      }
    }
    
    return formatted;
  }

  /**
   * 格式化AI推理日志
   */
  private formatAIReasoningLog(reasoning: AIReasoningLog): string {
    const lines: string[] = [];
    lines.push(`  ┌─────────────────────────────────────────────────────────┐`);
    lines.push(`  │ 🤖 AI推理步骤: ${reasoning.stepName.padEnd(30)} │`);
    lines.push(`  ├─────────────────────────────────────────────────────────┤`);
    
    if (reasoning.input) {
      const inputStr = typeof reasoning.input === 'string' 
        ? reasoning.input 
        : JSON.stringify(reasoning.input);
      lines.push(`  │ 📥 输入: ${inputStr.substring(0, 45).padEnd(45)} │`);
    }
    
    if (reasoning.decision) {
      lines.push(`  │ 🎯 决策: ${reasoning.decision.substring(0, 45).padEnd(45)} │`);
    }
    
    if (reasoning.reasoning) {
      lines.push(`  │ 💭 推理: ${reasoning.reasoning.substring(0, 45).padEnd(45)} │`);
    }
    
    if (reasoning.confidence !== undefined) {
      lines.push(`  │ 📊 置信度: ${(reasoning.confidence * 100).toFixed(1)}%`.padEnd(57) + ' │');
    }
    
    if (reasoning.duration !== undefined) {
      lines.push(`  │ ⏱️ 耗时: ${reasoning.duration}ms`.padEnd(57) + ' │');
    }
    
    if (reasoning.output) {
      const outputStr = typeof reasoning.output === 'string' 
        ? reasoning.output 
        : JSON.stringify(reasoning.output);
      lines.push(`  │ 📤 输出: ${outputStr.substring(0, 45).padEnd(45)} │`);
    }
    
    lines.push(`  └─────────────────────────────────────────────────────────┘`);
    
    return '\n' + lines.join('\n');
  }

  /**
   * 检查日志级别是否启用
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.enabledLevels.includes(level);
  }

  /**
   * 记录ERROR级别日志（始终输出）
   */
  error(message: string, context?: LogContext): void {
    const fullContext = { ...context, errorType: context?.errorType || ErrorType.SYSTEM_ERROR };
    let formatted = this.formatMessage('ERROR', message, fullContext);
    
    // 添加AI推理日志
    if (context?.aiReasoning) {
      formatted += this.formatAIReasoningLog(context.aiReasoning);
    }
    
    console.error(formatted);
  }

  /**
   * 记录WARN级别日志（始终输出）
   * 用于提示警告信息，可能影响系统功能
   */
  warn(message: string, context?: LogContext): void {
    if (this.isLevelEnabled('WARN')) {
      let formatted = this.formatMessage('WARN', message, context);
      if (context?.aiReasoning) {
        formatted += this.formatAIReasoningLog(context.aiReasoning);
      }
      console.warn(formatted);
    }
  }

  /**
   * 记录INFO级别日志（仅开发环境）
   */
  info(message: string, context?: LogContext): void {
    if (this.isLevelEnabled('INFO')) {
      let formatted = this.formatMessage('INFO', message, context);
      if (context?.aiReasoning) {
        formatted += this.formatAIReasoningLog(context.aiReasoning);
      }
      console.log(formatted);
    }
  }

  /**
   * 记录DEBUG级别日志（仅开发环境）
   */
  debug(message: string, context?: LogContext): void {
    if (this.isLevelEnabled('DEBUG')) {
      let formatted = this.formatMessage('DEBUG', message, context);
      if (context?.aiReasoning) {
        formatted += this.formatAIReasoningLog(context.aiReasoning);
      }
      console.log(formatted);
    }
  }

  /**
   * 记录TRACE级别日志（用于AI推理过程追踪）
   */
  trace(message: string, context?: LogContext): void {
    if (this.isLevelEnabled('TRACE')) {
      let formatted = this.formatMessage('TRACE', message, context);
      if (context?.aiReasoning) {
        formatted += this.formatAIReasoningLog(context.aiReasoning);
      }
      console.log(formatted);
    }
  }

  /**
   * 记录AI推理步骤日志（专用方法）
   * @param step 推理步骤类型
   * @param stepName 步骤名称
   * @param data 推理数据
   */
  aiReasoning(
    step: AIReasoningStep,
    stepName: string,
    data: {
      input?: any;
      output?: any;
      duration?: number;
      decision?: string;
      reasoning?: string;
      confidence?: number;
      metadata?: Record<string, any>;
      [key: string]: any;
    }
  ): void {
    const reasoningLog: AIReasoningLog = {
      step,
      stepName,
      ...data
    };
    
    this.trace(`AI推理: ${stepName}`, { aiReasoning: reasoningLog });
  }

  /**
   * 创建带方法名的子Logger
   */
  child(method: string): Logger {
    const childLogger = new Logger(this.module);
    childLogger.error = (msg: string, ctx?: LogContext) => {
      this.error(msg, { ...ctx, method });
    };
    childLogger.warn = (msg: string, ctx?: LogContext) => {
      this.warn(msg, { ...ctx, method });
    };
    childLogger.info = (msg: string, ctx?: LogContext) => {
      this.info(msg, { ...ctx, method });
    };
    childLogger.debug = (msg: string, ctx?: LogContext) => {
      this.debug(msg, { ...ctx, method });
    };
    return childLogger;
  }
}

// 模块级Logger工厂
export function createLogger(module: string): Logger {
  return new Logger(module);
}

// 默认导出的通用日志器（ERROR和WARN级别）
export const logger = {
  /**
   * 记录ERROR级别日志 - 始终输出
   * 捕获所有错误类型：运行时异常、业务逻辑错误、系统级错误
   */
  error: (message: string, context?: LogContext): void => {
    const timestamp = new Date().toISOString();
    const errorType = context?.errorType || ErrorType.SYSTEM_ERROR;
    const errorCode = context?.errorCode || '';
    const module = context?.module || 'GLOBAL';
    const method = context?.method || '';
    
    let formatted = `[${timestamp}] [ERROR] [${errorType}] [${module}]`;
    if (method) formatted += ` [${method}]`;
    if (errorCode) formatted += ` - ${errorCode}: ${message}`;
    else formatted += ` - ${message}`;
    
    if (context?.stack) formatted += `\n${context.stack}`;
    
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
    
    const filteredContext = { ...context };
    delete filteredContext.module;
    delete filteredContext.method;
    
    const contextKeys = Object.keys(filteredContext);
    if (contextKeys.length > 0) {
      formatted += ` | ${JSON.stringify(filteredContext)}`;
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
   * 记录AI推理步骤日志（专用方法）
   */
  aiReasoning: (
    step: AIReasoningStep,
    stepName: string,
    data: {
      input?: any;
      output?: any;
      duration?: number;
      decision?: string;
      reasoning?: string;
      confidence?: number;
      metadata?: Record<string, any>;
      [key: string]: any;
    }
  ): void => {
    const reasoningLog: AIReasoningLog = {
      step,
      stepName,
      ...data
    };
    
    const timestamp = new Date().toISOString();
    const lines: string[] = [];
    lines.push(`[${timestamp}] [TRACE] [AI] [GLOBAL] - AI推理: ${stepName}`);
    lines.push(`  ┌─────────────────────────────────────────────────────────┐`);
    lines.push(`  │ 🤖 AI推理步骤: ${stepName.padEnd(30)} │`);
    lines.push(`  ├─────────────────────────────────────────────────────────┤`);
    
    if (reasoningLog.input) {
      const inputStr = typeof reasoningLog.input === 'string' 
        ? reasoningLog.input 
        : JSON.stringify(reasoningLog.input);
      lines.push(`  │ 📥 输入: ${inputStr.substring(0, 45).padEnd(45)} │`);
    }
    
    if (reasoningLog.decision) {
      lines.push(`  │ 🎯 决策: ${reasoningLog.decision.substring(0, 45).padEnd(45)} │`);
    }
    
    if (reasoningLog.reasoning) {
      lines.push(`  │ 💭 推理: ${reasoningLog.reasoning.substring(0, 45).padEnd(45)} │`);
    }
    
    if (reasoningLog.confidence !== undefined) {
      lines.push(`  │ 📊 置信度: ${(reasoningLog.confidence * 100).toFixed(1)}%`.padEnd(57) + ' │');
    }
    
    if (reasoningLog.duration !== undefined) {
      lines.push(`  │ ⏱️ 耗时: ${reasoningLog.duration}ms`.padEnd(57) + ' │');
    }
    
    if (reasoningLog.output) {
      const outputStr = typeof reasoningLog.output === 'string' 
        ? reasoningLog.output 
        : JSON.stringify(reasoningLog.output);
      lines.push(`  │ 📤 输出: ${outputStr.substring(0, 45).padEnd(45)} │`);
    }
    
    lines.push(`  └─────────────────────────────────────────────────────────┘`);
    
    console.log(lines.join('\n'));
  },
};

export default Logger;
