/**
 * 图片压缩工具函数
 * 用于在客户端压缩头像图片，减少上传带宽
 */

/**
 * 压缩配置选项
 */
export interface CompressOptions {
  maxSize: number; // 最大文件大小（字节），默认 2MB
  maxWidth: number; // 最大宽度，默认 800px
  maxHeight: number; // 最大高度，默认 800px
  quality: number; // 压缩质量，默认 0.7
  mimeType: string; // 输出 MIME 类型，默认保持原类型
}

/**
 * 默认压缩配置
 */
export const DEFAULT_COMPRESS_OPTIONS: CompressOptions = {
  maxSize: 2 * 1024 * 1024, // 2MB
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.7,
  mimeType: ''
};

/**
 * 压缩图片文件
 * @param file - 原始图片文件
 * @param options - 压缩选项
 * @returns 压缩后的文件
 */
export async function compressImage(
  file: File,
  options: Partial<CompressOptions> = {}
): Promise<File> {
  const opts = { ...DEFAULT_COMPRESS_OPTIONS, ...options };

  // 如果文件已经小于最大大小，直接返回
  if (file.size <= opts.maxSize) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // 计算压缩后的尺寸（保持宽高比）
          const { width, height } = calculateResizedDimensions(
            img.width,
            img.height,
            opts.maxWidth,
            opts.maxHeight
          );

          // 创建 canvas 进行压缩
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建 canvas 上下文'));
            return;
          }

          // 绘制图片（支持透明背景）
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // 获取输出 MIME 类型
          const outputMimeType = opts.mimeType || file.type || 'image/jpeg';

          // 转换为 Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }

              // 如果压缩后仍然太大，尝试降低质量
              if (blob.size > opts.maxSize && opts.quality > 0.2) {
                compressImage(file, { ...opts, quality: opts.quality - 0.1 })
                  .then(resolve)
                  .catch(reject);
                return;
              }

              // 创建新文件
              const compressedFile = new File(
                [blob],
                `compressed_${file.name}`,
                {
                  type: outputMimeType,
                  lastModified: Date.now()
                }
              );

              resolve(compressedFile);
            },
            outputMimeType,
            opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('无法加载图片'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('无法读取文件'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 计算调整后的尺寸（保持宽高比）
 * @param originalWidth - 原始宽度
 * @param originalHeight - 原始高度
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @returns 调整后的尺寸
 */
function calculateResizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // 计算缩放比例
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const scaleRatio = Math.min(widthRatio, heightRatio);

  // 如果需要缩小
  if (scaleRatio < 1) {
    width = Math.round(width * scaleRatio);
    height = Math.round(height * scaleRatio);
  }

  return { width, height };
}

/**
 * 获取文件大小的可读字符串
 * @param bytes - 字节数
 * @returns 可读的大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证图片文件类型
 * @param file - 文件
 * @returns 是否为有效的图片类型
 */
export function isValidImageType(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  return validTypes.includes(file.type);
}

/**
 * 获取图片信息
 * @param file - 文件
 * @returns 图片的宽度、高度和类型信息
 */
export async function getImageInfo(file: File): Promise<{
  width: number;
  height: number;
  type: string;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          type: file.type,
          size: file.size
        });
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        reject(new Error('无法读取图片信息'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('无法读取文件'));
    };
    
    reader.readAsDataURL(file);
  });
}
