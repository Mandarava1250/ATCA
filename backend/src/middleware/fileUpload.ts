// ============================================
// 华夏营造 - 文件上传安全验证中间件
// ============================================

import { Request, Response, NextFunction } from 'express';
import multer, { StorageEngine, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../utils/logger';
import { config } from '../config/app';

const logger = createLogger('FileUpload');

// ============================================
// 允许的文件类型
// ============================================

export const ALLOWED_FILE_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  models: [
    'model/gltf-binary',
    'application/octet-stream',
    'model/obj',
    'model/stl',
    'application/json', // gltf json
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

// ============================================
// 文件大小限制（字节）
// ============================================

export const FILE_SIZE_LIMITS = {
  avatar: 2 * 1024 * 1024, // 2MB
  image: 10 * 1024 * 1024, // 10MB
  model: 50 * 1024 * 1024, // 50MB
  document: 10 * 1024 * 1024, // 10MB
};

// ============================================
// 文件扩展名白名单
// ============================================

export const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  models: ['.glb', '.gltf', '.obj', '.stl'],
  documents: ['.pdf', '.doc', '.docx', '.txt'],
};

// ============================================
// 危险文件扩展名黑名单
// ============================================

const DANGEROUS_EXTENSIONS = [
  '.exe', '.dll', '.bat', '.cmd', '.com', '.scr',
  '.msi', '.js', '.html', '.php', '.asp', '.jsp',
  '.py', '.sh', '.bash', '.ps1', '.vbs', '.jar',
  '.apk', '.app', '.dmg', '.iso', '.zip', '.rar',
  '.7z', '.tar', '.gz', '.bz2', '.xz', '.cab',
];

// ============================================
// 安全存储配置
// ============================================

function createSecureStorage(destination: string): StorageEngine {
  // 确保目标目录存在且安全
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
    // 设置目录权限（只读）
    try {
      fs.chmodSync(destination, 0o555);
    } catch (err) {
      logger.warn('无法设置目录权限', { destination, error: (err as Error).message });
    }
  }
  
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      // 生成安全的文件名
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `upload-${unique}${ext}`);
    },
  });
}

// ============================================
// 文件类型验证
// ============================================

function validateFileType(file: Express.Multer.File, allowedTypes: string[], allowedExtensions: string[]): boolean {
  // 检查MIME类型
  if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
    return false;
  }
  
  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return false;
  }
  
  // 检查危险扩展名
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return false;
  }
  
  return true;
}

// ============================================
// 文件内容检查（简单检查）
// ============================================

function checkFileContent(buffer: Buffer): boolean {
  // 检查文件头（Magic Numbers）
  const signatures: Record<string, Buffer> = {
    jpeg: Buffer.from([0xFF, 0xD8, 0xFF]),
    png: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    gif: Buffer.from([0x47, 0x49, 0x46, 0x38]),
    webp: Buffer.from([0x52, 0x49, 0x46, 0x46]),
    pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),
  };
  
  // 检查是否为已知危险内容
  const dangerousPatterns = [
    /<script/i,
    /<?php/i,
    /#!/,
    /powershell/i,
    /cmd.exe/i,
  ];
  
  const contentStr = buffer.toString('utf-8', 0, Math.min(buffer.length, 1000));
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(contentStr)) {
      return false;
    }
  }
  
  return true;
}

// ============================================
// 创建文件上传中间件
// ============================================

interface UploadOptions {
  type: 'image' | 'model' | 'document';
  fieldName?: string;
  maxFiles?: number;
}

export function createFileUploadMiddleware(options: UploadOptions) {
  const { type, fieldName = 'file', maxFiles = 1 } = options;
  
  let allowedTypes: string[];
  let allowedExtensions: string[];
  let sizeLimit: number;
  let destination: string;
  
  switch (type) {
    case 'image':
      allowedTypes = ALLOWED_FILE_TYPES.images;
      allowedExtensions = ALLOWED_EXTENSIONS.images;
      sizeLimit = FILE_SIZE_LIMITS.image;
      destination = path.resolve(config.upload.dir, 'images');
      break;
    case 'model':
      allowedTypes = ALLOWED_FILE_TYPES.models;
      allowedExtensions = ALLOWED_EXTENSIONS.models;
      sizeLimit = FILE_SIZE_LIMITS.model;
      destination = path.resolve(config.upload.dir, 'models');
      break;
    case 'document':
      allowedTypes = ALLOWED_FILE_TYPES.documents;
      allowedExtensions = ALLOWED_EXTENSIONS.documents;
      sizeLimit = FILE_SIZE_LIMITS.document;
      destination = path.resolve(config.upload.dir, 'documents');
      break;
    default:
      throw new Error('未知的文件类型');
  }
  
  const storage = createSecureStorage(destination);
  
  const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    // 验证文件类型
    if (!validateFileType(file, allowedTypes, allowedExtensions)) {
      logger.warn('文件类型验证失败', { 
        originalName: file.originalname, 
        mimetype: file.mimetype 
      });
      cb(new Error(`不允许的文件类型: ${file.mimetype}`));
      return;
    }
    
    // 读取文件开头进行内容检查
    const fileBuffer = fs.readFileSync(file.path);
    if (!checkFileContent(fileBuffer)) {
      logger.warn('文件内容检查失败', { originalName: file.originalname });
      cb(new Error('文件内容包含潜在危险内容'));
      return;
    }
    
    cb(null, true);
  };
  
  if (maxFiles === 1) {
    return multer({
      storage,
      limits: { fileSize: sizeLimit },
      fileFilter,
    }).single(fieldName);
  } else {
    return multer({
      storage,
      limits: { fileSize: sizeLimit },
      fileFilter,
    }).array(fieldName, maxFiles);
  }
}

// ============================================
// 头像上传中间件
// ============================================

export const avatarUpload = multer({
  storage: createSecureStorage(path.resolve(config.upload.dir, 'avatars')),
  limits: { fileSize: FILE_SIZE_LIMITS.avatar },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (!validateFileType(file, ALLOWED_FILE_TYPES.images, ALLOWED_EXTENSIONS.images)) {
      cb(new Error('只允许上传图片文件'));
      return;
    }
    cb(null, true);
  },
}).single('avatar');

// ============================================
// 文件上传安全验证中间件
// ============================================

export function fileUploadSecurity(req: Request, res: Response, next: NextFunction): void {
  // 检查请求中是否包含文件
  if (!req.files && !req.file) {
    next();
    return;
  }
  
  // 检查文件数量限制
  const files = req.files ? (req.files as Express.Multer.File[]) : [req.file];
  
  if (files && files.length > 10) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SEC_007',
        message: '单次上传文件数量超过限制',
        details: '最多允许同时上传10个文件',
      },
    });
    return;
  }
  
  next();
}