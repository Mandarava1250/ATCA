// ============================================
// 筑见山河 - 头像管理工具
// 用于清理过期头像备份和手动管理
// ============================================

import * as fs from 'fs';
import * as path from 'path';

// CommonJS模块中获取__dirname的方法
const __dirname = path.dirname(require.main?.filename || __filename);

// 头像配置
interface Config {
  uploadDir: string;
  backupDir: string;
  maxBackupAge: number;
  maxAgeHours: number;
}

const config: Config = {
  uploadDir: path.resolve(__dirname, '../../uploads/avatars'),
  backupDir: path.resolve(__dirname, '../../uploads/avatars_backup'),
  maxBackupAge: 24 * 60 * 60 * 1000, // 24小时
  maxAgeHours: 24
};

// 彩色日志输出
const log = {
  info: (msg: string, ...args: unknown[]) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`, ...args),
  title: (msg: string) => console.log(`\n\x1b[1m\x1b[34m${msg}\x1b[0m\n`)
};

// 文件信息接口
interface FileInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
  modified: Date;
  age: number;
  ageHours?: number;
  isExpired?: boolean;
}

// 审计日志接口
interface AuditLog {
  timestamp: string;
  action: string;
  deletedCount: number;
  totalFiles: number;
  deletedFiles: string[];
  maxAgeHours: number;
}

// 确保目录存在
function ensureDirectories(): void {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
    log.info('创建上传目录:', config.uploadDir);
  }
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    log.info('创建备份目录:', config.backupDir);
  }
}

// 获取文件信息
function getFileInfo(filePath: string): FileInfo {
  const stats = fs.statSync(filePath);
  return {
    name: path.basename(filePath),
    path: filePath,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    age: Date.now() - stats.mtimeMs
  };
}

// 列出当前头像
function listCurrentAvatars(): FileInfo[] {
  log.title('当前头像文件');
  ensureDirectories();

  const files = fs.readdirSync(config.uploadDir);
  if (files.length === 0) {
    log.warn('暂无头像文件');
    return [];
  }

  const fileInfos = files.map((file: string) => {
    const filePath = path.join(config.uploadDir, file);
    return getFileInfo(filePath);
  });

  console.table(fileInfos.map((f: FileInfo) => ({
    文件名: f.name,
    大小: `${(f.size / 1024).toFixed(2)} KB`,
    修改时间: f.modified.toLocaleString('zh-CN')
  })));

  return fileInfos;
}

// 列出备份头像
function listBackupAvatars(): FileInfo[] {
  log.title('备份头像文件');
  ensureDirectories();

  const files = fs.readdirSync(config.backupDir);
  if (files.length === 0) {
    log.warn('暂无备份头像文件');
    return [];
  }

  const now = Date.now();
  const fileInfos = files.map((file: string) => {
    const filePath = path.join(config.backupDir, file);
    const info = getFileInfo(filePath);
    const ageHours = ((now - info.modified.getTime()) / (1000 * 60 * 60)).toFixed(2);
    const isExpired = now - info.age > config.maxBackupAge;
    return { ...info, ageHours: parseFloat(ageHours), isExpired };
  });

  console.table(fileInfos.map((f: FileInfo) => ({
    文件名: f.name,
    大小: `${(f.size / 1024).toFixed(2)} KB`,
    修改时间: f.modified.toLocaleString('zh-CN'),
    存活时长: `${f.ageHours} 小时`,
    已过期: f.isExpired ? '✓' : ''
  })));

  return fileInfos;
}

// 清理过期备份
function cleanupExpiredBackups(): { deleted: number; total: number } {
  log.title('清理过期备份');
  ensureDirectories();

  const files = fs.readdirSync(config.backupDir);
  if (files.length === 0) {
    log.warn('暂无备份文件');
    return { deleted: 0, total: 0 };
  }

  const now = Date.now();
  let deletedCount = 0;
  const deletedFiles: string[] = [];

  files.forEach((file: string) => {
    const filePath = path.join(config.backupDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > config.maxBackupAge) {
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
        deletedFiles.push(file);
        log.info(`已删除过期备份: ${file} (存活 ${(age / (1000 * 60 * 60)).toFixed(2)} 小时)`);
      } catch (err) {
        log.error(`删除文件失败: ${file}`, err);
      }
    }
  });

  log.success(`清理完成: 删除了 ${deletedCount}/${files.length} 个过期备份文件`);

  // 记录审计日志
  const auditLog: AuditLog = {
    timestamp: new Date().toISOString(),
    action: 'cleanup_expired_backups',
    deletedCount,
    totalFiles: files.length,
    deletedFiles,
    maxAgeHours: config.maxAgeHours
  };

  const logPath = path.join(__dirname, '../../logs/avatar-cleanup.log');
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.appendFileSync(logPath, JSON.stringify(auditLog) + '\n');

  return { deleted: deletedCount, total: files.length };
}

// 删除特定备份
function deleteBackup(filename: string): boolean {
  const filePath = path.join(config.backupDir, filename);
  if (!fs.existsSync(filePath)) {
    log.error(`备份文件不存在: ${filename}`);
    return false;
  }

  try {
    fs.unlinkSync(filePath);
    log.success(`已删除备份: ${filename}`);
    return true;
  } catch (err) {
    log.error(`删除文件失败: ${filename}`, err);
    return false;
  }
}

// 恢复备份
function restoreBackup(filename: string): boolean {
  const backupPath = path.join(config.backupDir, filename);
  if (!fs.existsSync(backupPath)) {
    log.error(`备份文件不存在: ${filename}`);
    return false;
  }

  // 生成新的文件名，避免覆盖
  const timestamp = Date.now();
  const newFilename = `avatar-${timestamp}-restored${path.extname(filename)}`;
  const targetPath = path.join(config.uploadDir, newFilename);

  try {
    fs.copyFileSync(backupPath, targetPath);
    log.success(`已恢复备份到: ${newFilename}`);
    log.info(`提示: 用户需要重新上传头像以更新数据库记录`);
    return true;
  } catch (err) {
    log.error(`恢复文件失败: ${filename}`, err);
    return false;
  }
}

// 显示统计信息
function showStats(): void {
  log.title('头像存储统计');

  ensureDirectories();

  const currentFiles = fs.readdirSync(config.uploadDir);
  const backupFiles = fs.readdirSync(config.backupDir);

  let currentSize = 0;
  let backupSize = 0;

  currentFiles.forEach((file: string) => {
    const filePath = path.join(config.uploadDir, file);
    currentSize += fs.statSync(filePath).size;
  });

  backupFiles.forEach((file: string) => {
    const filePath = path.join(config.backupDir, file);
    backupSize += fs.statSync(filePath).size;
  });

  console.log('存储统计:');
  console.log(`  当前头像: ${currentFiles.length} 个文件 (${(currentSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  备份头像: ${backupFiles.length} 个文件 (${(backupSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  总计: ${currentFiles.length + backupFiles.length} 个文件 (${((currentSize + backupSize) / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`\n备份保留时间: ${config.maxAgeHours} 小时`);
}

// 主菜单
function showMenu(): void {
  console.log(`
\x1b[1m头像管理工具\x1b[0m
===================

1. 查看当前头像
2. 查看备份头像
3. 清理过期备份
4. 删除特定备份
5. 恢复备份
6. 存储统计
7. 全部清理（包括当前未使用的头像）

0. 退出
  `);
}

// 主程序
function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  ensureDirectories();

  switch (command) {
    case 'list':
      listCurrentAvatars();
      break;

    case 'backups':
      listBackupAvatars();
      break;

    case 'cleanup':
      cleanupExpiredBackups();
      break;

    case 'delete':
      if (!args[1]) {
        log.error('请指定要删除的文件名');
        console.log('用法: npx ts-node avatarManager.ts delete <filename>');
        return;
      }
      deleteBackup(args[1]);
      break;

    case 'restore':
      if (!args[1]) {
        log.error('请指定要恢复的文件名');
        console.log('用法: npx ts-node avatarManager.ts restore <filename>');
        return;
      }
      restoreBackup(args[1]);
      break;

    case 'stats':
      showStats();
      break;

    case 'full-cleanup':
      log.title('完整清理');
      listCurrentAvatars();
      console.log('\n备份清理:');
      cleanupExpiredBackups();
      showStats();
      break;

    case 'help':
    default:
      showMenu();
  }
}

main();
