// ============================================
// 筑见山河 - 前端日志工具
// 用于核心业务分支的详细日志记录，特别用于动画性能排查
// ============================================

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'PERF';

interface LogContext {
  module?: string;
  method?: string;
  component?: string;
  route?: string;
  timestamp?: number;
  duration?: number;
  [key: string]: any;
}

class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] [${this.module}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    // 仅在开发环境输出INFO日志
    if (import.meta.env.DEV) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context));
  }

  debug(message: string, context?: LogContext): void {
    // 仅在开发环境输出DEBUG日志
    if (import.meta.env.DEV) {
      console.log(this.formatMessage('DEBUG', message, context));
    }
  }

  perf(message: string, context?: LogContext): void {
    // 仅在开发环境输出PERF日志
    if (import.meta.env.DEV) {
      console.log(this.formatMessage('PERF', message, context));
    }
  }

  child(method: string): Logger {
    const childLogger = new Logger(this.module);
    childLogger.info = (msg: string, ctx?: LogContext) => {
      this.info(msg, { ...ctx, method });
    };
    childLogger.warn = (msg: string, ctx?: LogContext) => {
      this.warn(msg, { ...ctx, method });
    };
    childLogger.error = (msg: string, ctx?: LogContext) => {
      this.error(msg, { ...ctx, method });
    };
    childLogger.debug = (msg: string, ctx?: LogContext) => {
      this.debug(msg, { ...ctx, method });
    };
    childLogger.perf = (msg: string, ctx?: LogContext) => {
      this.perf(msg, { ...ctx, method });
    };
    return childLogger;
  }
}

export function createLogger(module: string): Logger {
  return new Logger(module);
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    // 仅在开发环境输出INFO日志
    if (import.meta.env.DEV) {
      console.log(`[${new Date().toISOString()}] [INFO] ${message}`, context || '');
    }
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, context || '');
  },
  error: (message: string, context?: LogContext) => {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, context || '');
  },
  perf: (message: string, context?: LogContext) => {
    // 仅在开发环境输出PERF日志
    if (import.meta.env.DEV) {
      console.log(`[${new Date().toISOString()}] [PERF] ${message}`, context || '');
    }
  },
};

export default Logger;
