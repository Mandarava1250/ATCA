// ============================================
// 华夏营造 - 多端数据同步客户端 SDK
// 基于 Socket.io 实现跨设备实时数据同步
// ============================================

import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/stores';

// 同步配置
interface SyncConfig {
  serverUrl: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  syncTimeout: number;
}

// 同步消息类型
interface SyncMessage {
  type: 'user_action' | 'favorite_change' | 'note_change' | 'quiz_progress' | 'translation_update' | 'settings_change' | 'checkin_update';
  payload: any;
  timestamp: number;
  deviceId: string;
}

// 同步事件回调
type SyncCallback = (data: any) => void;

// 默认配置
const defaultConfig: SyncConfig = {
  serverUrl: import.meta.env.VITE_API_URL || 'http://localhost:3100',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  syncTimeout: 1000,
};

/**
 * 多端数据同步服务类
 */
export class SyncService {
  private socket: Socket | null = null;
  private config: SyncConfig;
  private deviceId: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private callbacks: Map<string, Set<SyncCallback>> = new Map();
  private pendingMessages: SyncMessage[] = [];
  private syncLatency: number = 0;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.deviceId = this.generateDeviceId();
  }

  /**
   * 生成设备唯一ID
   */
  private generateDeviceId(): string {
    const storedId = localStorage.getItem('sync_device_id');
    if (storedId) return storedId;

    const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sync_device_id', newId);
    return newId;
  }

  /**
   * 连接同步服务
   */
  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const userStore = useUserStore();
      const token = userStore.tokens?.accessToken;

      if (!token) {
        reject(new Error('未登录，无法连接同步服务'));
        return;
      }

      this.socket = io(this.config.serverUrl, {
        auth: {
          token: `Bearer ${token}`,
          deviceId: this.deviceId,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.config.maxReconnectAttempts,
        reconnectionDelay: this.config.reconnectInterval,
      });

      // 连接成功
      this.socket.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[SyncSDK] 已连接到同步服务');
        this.flushPendingMessages();
        resolve(true);
      });

      // 连接确认
      this.socket.on('sync:connected', (data: any) => {
        console.log('[SyncSDK] 同步确认:', data);
        this.emit('connected', data);
      });

      // 设备上线通知
      this.socket.on('sync:device_online', (data: any) => {
        console.log('[SyncSDK] 新设备上线:', data.deviceId);
        this.emit('device_online', data);
      });

      // 设备离线通知
      this.socket.on('sync:device_offline', (data: any) => {
        console.log('[SyncSDK] 设备离线:', data.deviceId);
        this.emit('device_offline', data);
      });

      // 同步消息接收
      this.socket.on('sync:user_action', (data: SyncMessage) => {
        this.handleSyncMessage('user_action', data);
      });

      this.socket.on('sync:favorite_change', (data: SyncMessage) => {
        this.handleSyncMessage('favorite_change', data);
      });

      this.socket.on('sync:note_change', (data: SyncMessage) => {
        this.handleSyncMessage('note_change', data);
      });

      this.socket.on('sync:quiz_progress', (data: SyncMessage) => {
        this.handleSyncMessage('quiz_progress', data);
      });

      this.socket.on('sync:translation_update', (data: SyncMessage) => {
        this.handleSyncMessage('translation_update', data);
      });

      this.socket.on('sync:settings_change', (data: SyncMessage) => {
        this.handleSyncMessage('settings_change', data);
      });

      this.socket.on('sync:checkin_update', (data: SyncMessage) => {
        this.handleSyncMessage('checkin_update', data);
      });

      // 同步确认
      this.socket.on('sync:ack', (data: any) => {
        this.syncLatency = Date.now() - data.timestamp;
        this.emit('ack', { ...data, latency: this.syncLatency });
      });

      // 连接错误
      this.socket.on('connect_error', (err: Error) => {
        this.isConnected = false;
        this.reconnectAttempts++;
        console.error('[SyncSDK] 连接错误:', err.message);
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
          reject(new Error('连接失败，已达最大重试次数'));
        }
      });

      // 断开连接
      this.socket.on('disconnect', (reason: string) => {
        this.isConnected = false;
        console.warn('[SyncSDK] 断开连接:', reason);
        this.emit('disconnected', { reason });
      });
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('[SyncSDK] 已断开同步服务');
    }
  }

  /**
   * 发送同步消息
   */
  sync(type: SyncMessage['type'], payload: any): Promise<boolean> {
    return new Promise((resolve) => {
      const message: SyncMessage = {
        type,
        payload,
        timestamp: Date.now(),
        deviceId: this.deviceId,
      };

      if (!this.isConnected) {
        // 离线时缓存消息
        this.pendingMessages.push(message);
        console.warn('[SyncSDK] 离线状态，消息已缓存');
        resolve(false);
        return;
      }

      this.socket?.emit(`sync:${type}`, message);
      
      // 等待确认（超时处理）
      const timeout = setTimeout(() => {
        resolve(false);
      }, this.config.syncTimeout);

      this.socket?.once('sync:ack', (ack: any) => {
        if (ack.type === type) {
          clearTimeout(timeout);
          resolve(true);
        }
      });
    });
  }

  /**
   * 同步收藏变更
   */
  syncFavorite(action: 'add' | 'remove', architectureId: number): Promise<boolean> {
    return this.sync('favorite_change', { action, architectureId });
  }

  /**
   * 同步笔记变更
   */
  syncNote(action: 'create' | 'update' | 'delete', noteId: string, data?: any): Promise<boolean> {
    return this.sync('note_change', { action, noteId, data });
  }

  /**
   * 同步答题进度
   */
  syncQuizProgress(quizId: string, progress: any): Promise<boolean> {
    return this.sync('quiz_progress', { quizId, progress });
  }

  /**
   * 同步翻译更新
   */
  syncTranslation(entityType: string, entityId: number, field: string, translation: string): Promise<boolean> {
    return this.sync('translation_update', { entityType, entityId, field, translation });
  }

  /**
   * 同步设置变更
   */
  syncSettings(settings: any): Promise<boolean> {
    return this.sync('settings_change', settings);
  }

  syncCheckin(checkinData: any): Promise<boolean> {
    return this.sync('checkin_update', checkinData);
  }

  /**
   * 获取同步状态
   */
  getStatus(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ connected: false });
        return;
      }

      this.socket.emit('sync:get_status');
      this.socket.once('sync:status', (status: any) => {
        resolve({ ...status, connected: this.isConnected, latency: this.syncLatency });
      });
    });
  }

  /**
   * 注册事件监听
   */
  on(event: string, callback: SyncCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)?.add(callback);
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: SyncCallback): void {
    this.callbacks.get(event)?.delete(callback);
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    this.callbacks.get(event)?.forEach((cb) => cb(data));
  }

  /**
   * 处理同步消息
   */
  private handleSyncMessage(type: string, data: SyncMessage): void {
    // 计算同步延迟
    this.syncLatency = Date.now() - data.timestamp;
    
    // 触发对应事件
    this.emit(type, data);
    this.emit('sync', { type, data, latency: this.syncLatency });

    console.log(`[SyncSDK] 收到同步消息 (${type}):`, data.payload, `延迟: ${this.syncLatency}ms`);
  }

  /**
   * 发送缓存的消息
   */
  private flushPendingMessages(): void {
    while (this.pendingMessages.length > 0 && this.isConnected) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.socket?.emit(`sync:${message.type}`, message);
      }
    }
  }

  /**
   * 获取设备ID
   */
  getDeviceId(): string {
    return this.deviceId;
  }

  /**
   * 是否已连接
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * 获取同步延迟
   */
  getLatency(): number {
    return this.syncLatency;
  }
}

// 单例实例
let syncServiceInstance: SyncService | null = null;

/**
 * 获取同步服务实例
 */
export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}

/**
 * 初始化同步服务
 */
export async function initSync(): Promise<boolean> {
  const syncService = getSyncService();
  try {
    await syncService.connect();
    return true;
  } catch (err) {
    console.error('[SyncSDK] 初始化失败:', err);
    return false;
  }
}

/**
 * 关闭同步服务
 */
export function closeSync(): void {
  if (syncServiceInstance) {
    syncServiceInstance.disconnect();
    syncServiceInstance = null;
  }
}