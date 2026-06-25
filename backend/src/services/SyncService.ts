// ============================================
// 华夏营造 - 多端数据同步服务
// 基于 Socket.io 实现实时数据同步
// ============================================

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/app';

// 同步数据类型定义
interface SyncMessage {
  type: 'user_action' | 'favorite_change' | 'note_change' | 'quiz_progress' | 'translation_update' | 'settings_change';
  payload: any;
  timestamp: number;
  deviceId: string;
}

// 用户会话信息
interface UserSession {
  userId: number;
  username: string;
  role: string;
  devices: Map<string, Socket>; // deviceId -> Socket
}

// 全局会话管理
const userSessions = new Map<number, UserSession>();

// Socket.io 服务器实例
let io: SocketIOServer | null = null;

// 同步统计
const syncStats = {
  totalConnections: 0,
  activeConnections: 0,
  messagesSynced: 0,
  syncErrors: 0,
};

/**
 * 初始化 WebSocket 同步服务
 */
export function initSyncService(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.nodeEnv === 'production' 
        ? config.cors.productionOrigins 
        : config.cors.developmentOrigins,
      credentials: true,
    },
    // 连接配置
    pingInterval: 10000, // 10秒心跳
    pingTimeout: 5000,   // 5秒超时
    maxHttpBufferSize: 1e6, // 1MB
  });

  // 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error('未提供认证令牌'));
    }

    try {
      // 提取Bearer token
      const accessToken = token.replace('Bearer ', '');
      const decoded = jwt.verify(accessToken, config.jwt.secret) as any;
      
      socket.data.userId = decoded.userId || decoded.user_id;
      socket.data.username = decoded.username;
      socket.data.role = decoded.role;
      socket.data.deviceId = socket.handshake.auth.deviceId || generateDeviceId();
      
      next();
    } catch (err) {
      next(new Error('令牌验证失败'));
    }
  });

  // 连接处理
  io.on('connection', (socket: Socket) => {
    handleConnection(socket);
  });

  console.log('[SyncService] WebSocket 同步服务已启动');
  return io;
}

/**
 * 处理新连接
 */
function handleConnection(socket: Socket) {
  const userId = socket.data.userId;
  const deviceId = socket.data.deviceId;

  syncStats.totalConnections++;
  syncStats.activeConnections++;

  // 注册用户会话
  if (!userSessions.has(userId)) {
    userSessions.set(userId, {
      userId,
      username: socket.data.username,
      role: socket.data.role,
      devices: new Map(),
    });
  }

  const session = userSessions.get(userId)!;
  session.devices.set(deviceId, socket);

  console.log(`[SyncService] 用户 ${userId} 设备 ${deviceId} 已连接 (${session.devices.size} 个设备在线)`);

  // 发送连接确认
  socket.emit('sync:connected', {
    deviceId,
    onlineDevices: Array.from(session.devices.keys()),
    timestamp: Date.now(),
  });

  // 通知其他设备有新设备连接
  broadcastToUserDevices(userId, 'sync:device_online', { deviceId }, socket.id);

  // ===== 同步事件处理 =====

  // 用户操作同步
  socket.on('sync:user_action', (data: SyncMessage) => {
    handleSyncMessage(socket, 'user_action', data);
  });

  // 收藏变更同步
  socket.on('sync:favorite_change', (data: SyncMessage) => {
    handleSyncMessage(socket, 'favorite_change', data);
  });

  // 笔记变更同步
  socket.on('sync:note_change', (data: SyncMessage) => {
    handleSyncMessage(socket, 'note_change', data);
  });

  // 答题进度同步
  socket.on('sync:quiz_progress', (data: SyncMessage) => {
    handleSyncMessage(socket, 'quiz_progress', data);
  });

  // 翻译更新同步
  socket.on('sync:translation_update', (data: SyncMessage) => {
    handleSyncMessage(socket, 'translation_update', data);
  });

  // 设置变更同步
  socket.on('sync:settings_change', (data: SyncMessage) => {
    handleSyncMessage(socket, 'settings_change', data);
  });

  // 请求同步状态
  socket.on('sync:get_status', () => {
    socket.emit('sync:status', {
      onlineDevices: Array.from(session.devices.keys()),
      lastSyncTime: Date.now(),
      stats: syncStats,
    });
  });

  // 断开连接处理
  socket.on('disconnect', (reason) => {
    handleDisconnect(socket, reason);
  });
}

/**
 * 处理同步消息
 */
function handleSyncMessage(socket: Socket, type: string, data: SyncMessage) {
  const userId = socket.data.userId;
  const deviceId = socket.data.deviceId;

  // 验证消息来源
  if (data.deviceId !== deviceId) {
    console.warn(`[SyncService] 设备ID不匹配: ${data.deviceId} vs ${deviceId}`);
    return;
  }

  syncStats.messagesSynced++;

  // 广播到用户的其他设备
  broadcastToUserDevices(userId, `sync:${type}`, {
    ...data,
    sourceDeviceId: deviceId,
    timestamp: Date.now(),
  }, socket.id);

  // 发送同步确认
  socket.emit('sync:ack', {
    type,
    timestamp: Date.now(),
    success: true,
  });
}

/**
 * 广播消息到用户的所有设备（排除发送者）
 */
function broadcastToUserDevices(userId: number, event: string, data: any, excludeSocketId?: string) {
  const session = userSessions.get(userId);
  if (!session) return;

  session.devices.forEach((socket) => {
    if (socket.id !== excludeSocketId) {
      socket.emit(event, data);
    }
  });
}

/**
 * 处理断开连接
 */
function handleDisconnect(socket: Socket, reason: string) {
  const userId = socket.data.userId;
  const deviceId = socket.data.deviceId;

  syncStats.activeConnections--;

  const session = userSessions.get(userId);
  if (session) {
    session.devices.delete(deviceId);
    
    // 通知其他设备有设备离线
    broadcastToUserDevices(userId, 'sync:device_offline', { deviceId, reason });

    // 如果没有设备在线，清理会话
    if (session.devices.size === 0) {
      userSessions.delete(userId);
      console.log(`[SyncService] 用户 ${userId} 所有设备已离线`);
    } else {
      console.log(`[SyncService] 用户 ${userId} 设备 ${deviceId} 已断开 (${session.devices.size} 个设备在线)`);
    }
  }
}

/**
 * 生成设备ID
 */
function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取同步服务实例
 */
export function getSyncService(): SocketIOServer | null {
  return io;
}

/**
 * 获取同步统计
 */
export function getSyncStats() {
  return {
    ...syncStats,
    onlineUsers: userSessions.size,
  };
}

/**
 * 向指定用户推送消息
 */
export function pushToUser(userId: number, event: string, data: any) {
  broadcastToUserDevices(userId, event, data);
}

/**
 * 向所有管理员推送消息
 */
export function pushToAdmins(event: string, data: any) {
  userSessions.forEach((session) => {
    if (session.role === 'admin') {
      broadcastToUserDevices(session.userId, event, data);
    }
  });
}