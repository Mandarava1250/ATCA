import type { Ref } from 'vue';

// 错误类型定义
export interface ErrorInfo {
  status?: number;
  message?: string;
  code?: string;
}

// HTTP 状态码映射到 i18n 键
export const statusToI18nKey: Record<number, string> = {
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  500: 'errors.server',
  502: 'errors.server',
  503: 'errors.server',
  504: 'errors.timeout',
};

// 获取错误信息（用于 i18n 键）
export function getErrorKey(error: any): string {
  // 检查是否有响应
  if (error?.response) {
    const status = error.response.status;
    if (status && statusToI18nKey[status]) {
      return statusToI18nKey[status];
    }
    
    // 尝试从响应数据中获取错误消息
    if (error.response?.data?.error?.message) {
      // 如果有具体的错误消息，我们直接使用它（假设后端返回多语言）
      return error.response.data.error.message;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
  }
  
  // 检查是否是网络错误
  if (error?.message?.includes('Network Error') || error?.message?.includes('timeout')) {
    return 'errors.network';
  }
  
  if (error?.message?.includes('timeout')) {
    return 'errors.timeout';
  }
  
  // 默认错误
  return 'errors.genericError';
}

// 处理错误并设置错误信息
export function handleError(error: any, errorRef: Ref<string>, t: (key: string) => string): void {
  const errorKey = getErrorKey(error);
  
  // 检查是否是我们定义的 i18n 键
  if (errorKey.startsWith('errors.')) {
    errorRef.value = t(errorKey);
  } else {
    // 如果不是，直接使用返回的消息或默认错误
    errorRef.value = errorKey || t('errors.genericError');
  }
}

// 验证函数
export function validateUsername(username: string): { valid: boolean; errorKey?: string } {
  if (!username || username.trim().length < 3) {
    return { valid: false, errorKey: 'errors.usernameTooShort' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; errorKey?: string } {
  if (!password || password.length < 8) {
    return { valid: false, errorKey: 'errors.passwordTooShort' };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; errorKey?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, errorKey: 'errors.invalidEmail' };
  }
  return { valid: true };
}
