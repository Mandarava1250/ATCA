// ============================================
// 华夏营造 - 安全中间件集合
// ============================================

import { Request, Response, NextFunction } from 'express';
import { logger, ErrorType } from '../utils/logger';

// ============================================
// SQL注入检测中间件
// ============================================

const sqlInjectionPatterns: RegExp[] = [
  // 基础SQL注入模式
  /('(\\s+)?('|\\))/gi,
  /(--|\/\*|\*\/)/gi,
  /(UNION\s+SELECT|SELECT\s+FROM|INSERT\s+INTO|DELETE\s+FROM|UPDATE\s+.*SET)/gi,
  /(EXEC|EXECUTE|sp_)/gi,
  /(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE)/gi,
  /(OR\s+1=1|AND\s+1=1|OR\s+'a'='a')/gi,
  // 盲注模式
  /(WAITFOR\s+DELAY|BENCHMARK|SLEEP)/gi,
  // 基于时间的注入
  /(IF\s+\(.*\).*WAITFOR|CASE\s+WHEN)/gi,
];

export function sqlInjectionDetection(req: Request, res: Response, next: NextFunction): void {
  const checkForInjection = (data: any): boolean => {
    if (!data) return false;
    
    const strData = typeof data === 'string' ? data : JSON.stringify(data);
    
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(strData)) {
        return true;
      }
    }
    return false;
  };

  // 检查请求体、查询参数和路径参数
  const hasInjection = 
    checkForInjection(req.body) || 
    checkForInjection(req.query) || 
    checkForInjection(req.params);

  if (hasInjection) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SEC_001',
        message: '请求中包含潜在的恶意内容',
        details: '检测到SQL注入攻击模式',
      },
    });
    return;
  }

  next();
}

// ============================================
// XSS防护中间件 - 输出编码
// ============================================

export function sanitizeInput(value: string): string {
  if (!value || typeof value !== 'string') return value;
  
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
  };
  
  return value.replace(/[&<>"'\/`]/g, (char) => replacements[char] || char);
}

// ============================================
// 安全响应头中间件
// ============================================

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');
  
  // 防止MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 启用浏览器的XSS保护
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 内容安全策略（CSP）
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'strict-dynamic'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  
  // 禁用Referrer策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 允许的跨域资源策略
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  
  // 跨域嵌入器策略
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  
  next();
}

// ============================================
// 密码强度验证
// ============================================

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // 最小长度检查（至少12位）
  if (password.length < 12) {
    errors.push('密码长度至少为12位');
  }
  
  // 最大长度检查（不超过128位）
  if (password.length > 128) {
    errors.push('密码长度不能超过128位');
  }
  
  // 检查是否包含数字
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  // 检查是否包含大写字母
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }
  
  // 检查是否包含小写字母
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }
  
  // 检查是否包含特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符（!@#$%^&*等）');
  }
  
  // 检查是否包含常见模式
  const commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'monkey', 'letmein'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('密码包含常见的弱密码模式');
  }
  
  // 检查是否包含用户名（需要在调用时传入）
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// 请求参数大小限制
// ============================================

export function validateRequestSize(req: Request, res: Response, next: NextFunction): void {
  const maxBodySize = 10 * 1024 * 1024; // 10MB
  
  let contentLength = 0;
  if (req.headers['content-length']) {
    contentLength = parseInt(req.headers['content-length'], 10);
  }
  
  if (contentLength > maxBodySize) {
    res.status(413).json({
      success: false,
      error: {
        code: 'SEC_002',
        message: '请求体大小超过限制',
        details: `最大允许大小为 ${maxBodySize / 1024 / 1024}MB`,
      },
    });
    return;
  }
  
  next();
}

// ============================================
// 禁止敏感HTTP方法
// ============================================

export function restrictHttpMethods(req: Request, res: Response, next: NextFunction): void {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
  
  if (!allowedMethods.includes(req.method)) {
    res.status(405).json({
      success: false,
      error: {
        code: 'SEC_003',
        message: '不允许使用此HTTP方法',
        details: `允许的方法: ${allowedMethods.join(', ')}`,
      },
    });
    return;
  }
  
  next();
}

// ============================================
// 路径遍历攻击防护
// ============================================

export function pathTraversalProtection(req: Request, res: Response, next: NextFunction): void {
  const checkPath = (path: string | undefined): boolean => {
    if (!path) return false;
    return path.includes('..') || path.includes('./') || path.includes('/.');
  };

  const hasTraversal = 
    checkPath(req.path) ||
    checkPath(JSON.stringify(req.query)) ||
    checkPath(JSON.stringify(req.body));

  if (hasTraversal) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SEC_004',
        message: '请求中包含非法路径',
        details: '检测到路径遍历攻击尝试',
      },
    });
    return;
  }
  
  next();
}

// ============================================
// 安全日志记录中间件
// ============================================

export function securityLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, path, ip, body, query, params } = req;
    const statusCode = res.statusCode;
    
    // 根据状态码选择日志级别
    if (statusCode >= 500) {
      // 服务器错误 - ERROR级别，包含完整上下文
      logger.error(`服务器错误: ${statusCode}`, {
        module: 'Security',
        method: `${method} ${path}`,
        errorType: ErrorType.SYSTEM_ERROR,
        errorCode: `HTTP_${statusCode}`,
        stack: new Error().stack,
        request: { method, path, ip, body, query, params },
        response: { statusCode, duration },
      });
    } else if (statusCode >= 400) {
      // 客户端错误 - WARN级别
      logger.warn(`客户端错误: ${statusCode}`, {
        module: 'Security',
        method: `${method} ${path}`,
        errorType: ErrorType.API_ERROR,
        errorCode: `HTTP_${statusCode}`,
        request: { method, path, ip, query },
        response: { statusCode, duration },
      });
    }
    // 2xx/3xx 状态码不记录日志
  });
  
  next();
}