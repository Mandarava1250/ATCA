// ============================================
// UUID 生成工具 - 兼容不支持 crypto.randomUUID 的浏览器
// ============================================

/**
 * 生成 UUID v4
 * 兼容旧版浏览器（如 iOS 12 以下、旧版 Android WebView）
 * @returns UUID 字符串
 */
export function generateUUID(): string {
  // 优先使用原生 API
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Polyfill: 使用时间戳和随机数生成 UUID
  const now = Date.now();
  const random = Math.random().toString(16).substring(2, 10);
  
  // 生成符合 UUID v4 格式的字符串
  // UUID v4 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // 其中 y 是 8, 9, A, 或 B
  const segments = [
    random.substring(0, 8),
    random.substring(8, 12),
    `4${random.substring(12, 15)}`,
    `${(parseInt(random.substring(15, 16), 16) & 0x3 | 0x8).toString(16)}${random.substring(16, 19)}`,
    now.toString(16).padStart(12, '0').substring(0, 12)
  ];

  return segments.join('-');
}