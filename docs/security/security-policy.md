# 筑见山河 - 安全策略文档

## 概述

筑见山河项目重视用户数据安全和系统安全，采用多层次的安全防护措施。本文档详细描述项目的安全策略和最佳实践。

---

## 安全架构

```
┌──────────────────────────────────────────────────────────────────┐
│                     安全防护层次                                │
├──────────────────────────────────────────────────────────────────┤
│  网络层   │  WAF防护  │  DDoS防护  │  防火墙  │  VPN接入        │
├──────────────────────────────────────────────────────────────────┤
│  应用层   │  认证授权  │  输入验证  │  会话管理│  安全头         │
├──────────────────────────────────────────────────────────────────┤
│  数据层   │  加密存储  │  访问控制  │  脱敏处理│  备份恢复        │
├──────────────────────────────────────────────────────────────────┤
│  基础设施 │  权限管理  │  日志审计  │  漏洞扫描│  安全更新        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 认证与授权

### 1. JWT 认证

**实现策略**:
- Access Token + Refresh Token 双令牌机制
- Token 过期时间设置合理
- Token 存储安全

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;

export function generateTokens(payload: { userId: number; role: string }) {
  const accessToken = jwt.sign(
    payload,
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    payload,
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: number; role: string };
}
```

### 2. 密码安全

**实现策略**:
- 使用 bcrypt 进行密码哈希
- 强密码策略
- 密码重置流程

```typescript
// src/utils/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: '密码必须包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  return { valid: true, message: '' };
}
```

### 3. 角色权限控制

**实现策略**:
- 基于角色的访问控制（RBAC）
- 细粒度权限管理

```typescript
// src/middleware/authorization.ts
export function requireRole(roles: string[]) {
  return function(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_005',
          message: '权限不足'
        }
      });
    }
    
    next();
  };
}
```

---

## 输入验证与过滤

### 1. 参数验证

**实现策略**:
- 使用 Zod 进行类型安全验证
- 严格的输入格式检查

```typescript
// src/validation/schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(32)
});

export const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(32),
  email: z.string().email(),
  nickname: z.string().optional()
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.errors);
  }
  return result.data;
}
```

### 2. SQL 注入防护

**实现策略**:
- 使用参数化查询
- 智能 SQL 注入检测

```typescript
// src/middleware/sqlInjection.ts
import { detectSQLInjection } from '@/utils/sqlInjectionDetector';

export function sqlInjectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const inputs = {
    ...req.query,
    ...req.body,
    ...req.params
  };
  
  for (const key in inputs) {
    const value = inputs[key];
    if (typeof value === 'string' && detectSQLInjection(value)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SEC_001',
          message: '检测到SQL注入攻击'
        }
      });
    }
  }
  
  next();
}
```

**多维评分检测系统**:

```typescript
// src/utils/sqlInjectionDetector.ts
interface ScoreResult {
  score: number;
  matches: string[];
}

export function detectSQLInjection(input: string): boolean {
  let score = 0;
  const matches: string[] = [];
  
  // 危险关键字检测
  const dangerousKeywords = [
    /('|")\s*(OR|AND)\s*\d+\s*=\s*\d+/i,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+\w+\s+SET/i,
    /DELETE\s+FROM/i,
    /--.*$/i,
    /\/\*.*\*\//i,
    /EXEC\s+(\w+|sp_)/i,
    /xp_cmdshell/i
  ];
  
  dangerousKeywords.forEach((pattern, index) => {
    if (pattern.test(input)) {
      score += 15;
      matches.push(`危险关键字模式 ${index + 1}`);
    }
  });
  
  // 异常字符检测
  const suspiciousPatterns = [
    /\d+\s*(=|<|>)\s*\d+/g,
    /('|")\s*;/g,
    /;(\s*\w+)*/g,
    /@\w+/g
  ];
  
  suspiciousPatterns.forEach((pattern, index) => {
    const count = (input.match(pattern) || []).length;
    if (count > 0) {
      score += count * 5;
      matches.push(`可疑模式 ${index + 1}: ${count}次`);
    }
  });
  
  // 编码绕过检测
  const encodedPatterns = [
    /%[0-9A-Fa-f]{2}/g,
    /0x[0-9A-Fa-f]+/g,
    /CHAR\s*\(/g,
    /N'[^']+'/g
  ];
  
  encodedPatterns.forEach((pattern, index) => {
    if (pattern.test(input)) {
      score += 10;
      matches.push(`编码绕过尝试 ${index + 1}`);
    }
  });
  
  return score >= 20;
}
```

**检测算法**:
- 多维评分系统（关键字匹配 + 异常模式 + 编码检测）
- 特征匹配（危险SQL关键字库）
- 异常模式识别（频率分析、上下文分析）
- 阈值判定（总分 >= 20 判定为攻击）

### 3. XSS 防护

**实现策略**:
- 输出转义
- CSP 策略
- 内容净化

```typescript
// src/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHTML(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'a'],
    ALLOWED_ATTR: ['href', 'target']
  });
}
```

```nginx
# CSP 配置
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';";
```

---

## 数据安全

### 1. 数据加密

**实现策略**:
- 传输加密（HTTPS）
- 敏感数据加密存储
- 密钥管理

```typescript
// src/utils/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(text: string): string {
  const [ivHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 2. 数据脱敏

**实现策略**:
- 敏感信息脱敏处理
- 分级数据访问

```typescript
// src/utils/masking.ts
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}
```

---

## 会话安全

### 1. 会话管理

**实现策略**:
- 会话超时机制
- 并发登录限制
- 会话失效处理

```typescript
// src/services/sessionService.ts
class SessionService {
  private sessions = new Map<string, { userId: number; expiresAt: number }>();
  
  createSession(userId: number): string {
    const sessionId = crypto.randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24小时
    
    this.sessions.set(sessionId, { userId, expiresAt });
    return sessionId;
  }
  
  validateSession(sessionId: string): number | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session.userId;
  }
}
```

### 2. CSRF 防护

**实现策略**:
- CSRF Token
- 双重提交 Cookie

```typescript
// src/middleware/csrf.ts
export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'];
  const sessionCsrfToken = req.session?.csrfToken;
  
  if (!csrfToken || csrfToken !== sessionCsrfToken) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'SEC_004',
        message: 'CSRF验证失败'
      }
    });
  }
  
  next();
}
```

---

## 速率限制与攻击防护

### 1. 请求速率限制

**实现策略**:
- IP 级别的速率限制
- 账号级别的速率限制

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    error: {
      code: 'RATE_002',
      message: '登录尝试次数过多，请稍后再试'
    }
  }
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 最多100次请求
  message: {
    success: false,
    error: {
      code: 'RATE_001',
      message: '请求过于频繁，请稍后再试'
    }
  }
});
```

### 2. DDoS 防护

**实现策略**:
- Nginx 连接限制
- 流量清洗
- 异常流量检测

```nginx
# 连接限制
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn conn_limit 10;

# 请求速率限制
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
limit_req zone=req_limit burst=20 nodelay;
```

---

## 安全日志与审计

### 1. 安全日志

**实现策略**:
- 关键操作日志记录
- 安全事件追踪
- 日志加密存储

```typescript
// src/utils/securityLogger.ts
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

export function logSecurityEvent(event: {
  type: string;
  userId?: number;
  ip: string;
  action: string;
  details?: Record<string, unknown>;
}) {
  securityLogger.info(event.type, {
    userId: event.userId,
    ip: event.ip,
    action: event.action,
    details: event.details,
    timestamp: new Date().toISOString()
  });
}
```

### 2. 审计追踪

**审计内容**:
- 用户登录/登出
- 权限变更
- 数据修改操作
- 异常访问尝试

---

## 安全响应流程

### 安全事件处理流程

```
检测安全事件 → 记录日志 → 通知管理员 → 分析事件 → 响应处理 → 复盘总结
```

### 紧急联系方式

| 角色 | 联系方式 |
|------|----------|
| 安全负责人 | security@atca.xin |
| 技术支持 | support@atca.xin |
| 紧急热线 | 400-xxx-xxxx |

---

## 安全最佳实践

### 开发安全规范

1. **禁止明文存储密码** - 必须使用 bcrypt 哈希
2. **禁止拼接 SQL** - 必须使用参数化查询
3. **禁止信任用户输入** - 所有输入必须验证和过滤
4. **使用 HTTPS** - 全站强制 HTTPS
5. **定期更新依赖** - 及时修复安全漏洞

### 运维安全规范

1. **最小权限原则** - 服务账户只授予必要权限
2. **定期备份** - 数据备份并加密存储
3. **安全审计** - 定期进行安全检查
4. **日志监控** - 实时监控安全日志
5. **应急响应** - 制定安全事件响应预案