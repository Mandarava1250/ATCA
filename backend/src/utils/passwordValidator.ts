// ============================================
// 华夏营造 - 密码强度验证工具
// 实现完善的密码强度校验机制
// 要求: 至少8位，包含大小写字母、数字和特殊符号中的至少三种组合
// ============================================

import bcrypt from 'bcrypt';

/**
 * 密码强度等级
 */
export enum PasswordStrength {
  WEAK = 'weak',           // 弱密码
  MEDIUM = 'medium',       // 中等密码
  STRONG = 'strong',       // 强密码
  VERY_STRONG = 'very_strong', // 非常强密码
}

/**
 * 密码验证结果
 */
export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  score: number;          // 0-100分
  feedback: string[];     // 改进建议
  errors: string[];       // 错误信息
}

/**
 * 密码策略配置
 */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minCategories: number;  // 至少包含几种字符类型
  disallowCommon: boolean; // 禁止常见密码
}

// 默认密码策略
const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minCategories: 3,
  disallowCommon: true,
};

// 常见弱密码列表
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine',
  'letmein', 'football', 'shadow', 'superman', 'michael', 'password1',
  'password123', 'admin', 'admin123', 'root', 'toor', 'pass', 'test',
  'guest', 'qwerty123', '654321', '123123', 'welcome', 'login',
  'passw0rd', 'p@ssword', 'p@ssw0rd', '1q2w3e4r', '1qaz2wsx',
]);

// 特殊字符集合
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

/**
 * 密码验证器类
 */
class PasswordValidator {
  private policy: PasswordPolicy;

  constructor(policy: Partial<PasswordPolicy> = {}) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  /**
   * 验证密码强度
   */
  validate(password: string): PasswordValidationResult {
    const feedback: string[] = [];
    const errors: string[] = [];
    let score = 0;

    // 检查是否为空
    if (!password) {
      return {
        isValid: false,
        strength: PasswordStrength.WEAK,
        score: 0,
        feedback: [],
        errors: ['密码不能为空'],
      };
    }

    // 检查长度
    if (password.length < this.policy.minLength) {
      errors.push(`密码长度至少为${this.policy.minLength}位`);
    } else {
      score += Math.min(20, password.length * 2);
      if (password.length >= 12) {
        feedback.push('密码长度良好');
      }
    }

    if (password.length > this.policy.maxLength) {
      errors.push(`密码长度不能超过${this.policy.maxLength}位`);
    }

    // 检查字符类型
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = SPECIAL_CHARS.test(password);

    const categories = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars].filter(Boolean).length;

    // 检查是否满足字符类型要求
    if (this.policy.requireUppercase && !hasUppercase) {
      feedback.push('建议添加大写字母');
    } else if (hasUppercase) {
      score += 15;
    }

    if (this.policy.requireLowercase && !hasLowercase) {
      feedback.push('建议添加小写字母');
    } else if (hasLowercase) {
      score += 15;
    }

    if (this.policy.requireNumbers && !hasNumbers) {
      feedback.push('建议添加数字');
    } else if (hasNumbers) {
      score += 15;
    }

    if (this.policy.requireSpecialChars && !hasSpecialChars) {
      feedback.push('建议添加特殊字符（如 !@#$%^&*）');
    } else if (hasSpecialChars) {
      score += 20;
    }

    // 检查字符类型数量
    if (categories < this.policy.minCategories) {
      errors.push(`密码必须包含大写字母、小写字母、数字、特殊字符中的至少${this.policy.minCategories}种`);
    }

    // 检查常见密码
    if (this.policy.disallowCommon) {
      const lowerPassword = password.toLowerCase();
      if (COMMON_PASSWORDS.has(lowerPassword)) {
        errors.push('密码过于常见，请使用更复杂的密码');
        score = 0;
      }
    }

    // 检查重复字符
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('避免连续重复字符');
      score -= 10;
    }

    // 检查顺序字符
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
      feedback.push('避免顺序字符（如 abc, 123）');
      score -= 10;
    }

    // 额外加分：混合字符
    if (hasUppercase && hasLowercase && hasNumbers && hasSpecialChars) {
      score += 15;
    }

    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));

    // 确定强度等级
    const strength = this.calculateStrength(score);

    // 判断是否有效
    const isValid = errors.length === 0 && score >= 50;

    return {
      isValid,
      strength,
      score,
      feedback,
      errors,
    };
  }

  /**
   * 根据分数计算强度等级
   */
  private calculateStrength(score: number): PasswordStrength {
    if (score >= 80) return PasswordStrength.VERY_STRONG;
    if (score >= 60) return PasswordStrength.STRONG;
    if (score >= 40) return PasswordStrength.MEDIUM;
    return PasswordStrength.WEAK;
  }

  /**
   * 获取强度描述
   */
  getStrengthDescription(strength: PasswordStrength): string {
    switch (strength) {
      case PasswordStrength.WEAK:
        return '弱 - 密码容易被破解';
      case PasswordStrength.MEDIUM:
        return '中等 - 建议增强密码复杂度';
      case PasswordStrength.STRONG:
        return '强 - 密码安全性良好';
      case PasswordStrength.VERY_STRONG:
        return '非常强 - 密码安全性极佳';
    }
  }

  /**
   * 获取强度颜色（用于UI显示）
   */
  getStrengthColor(strength: PasswordStrength): string {
    switch (strength) {
      case PasswordStrength.WEAK:
        return '#ff4d4f';  // 红色
      case PasswordStrength.MEDIUM:
        return '#faad14';  // 橙色
      case PasswordStrength.STRONG:
        return '#52c41a';  // 绿色
      case PasswordStrength.VERY_STRONG:
        return '#1890ff';  // 蓝色
    }
  }

  /**
   * 生成强密码建议
   */
  generateSuggestion(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=';
    const all = uppercase + lowercase + numbers + special;

    let password = '';
    
    // 确保每种字符至少有一个
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // 打乱顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

/**
 * 密码哈希工具
 */
class PasswordHasher {
  private readonly SALT_ROUNDS = 12;

  /**
   * 哈希密码
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * 验证密码
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 检查密码是否需要重新哈希（当算法升级时）
   */
  needsRehash(hash: string): boolean {
    // bcrypt的hash格式: $2b$rounds$salt+hash
    const match = hash.match(/^\$2[aby]\$(\d+)\$/);
    if (match) {
      const rounds = parseInt(match[1]);
      return rounds < this.SALT_ROUNDS;
    }
    return true;
  }
}

// 导出单例实例
export const passwordValidator = new PasswordValidator();
export const passwordHasher = new PasswordHasher();

// 导出便捷函数
export function validatePassword(password: string): PasswordValidationResult {
  return passwordValidator.validate(password);
}

export async function hashPassword(password: string): Promise<string> {
  return passwordHasher.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return passwordHasher.verify(password, hash);
}