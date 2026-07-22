// ============================================
// 筑见山河 - 3D场景加载进度管理系统
// 实现详细的加载进度反馈，包含进度条和骨架屏
// 目标: 提供清晰的加载状态，提升用户体验
// ============================================

import * as THREE from 'three';

/**
 * 加载阶段定义
 */
export enum LoadingPhase {
  INITIALIZING = 'initializing',  // 初始化
  LOADING_MODELS = 'models',      // 加载模型
  LOADING_TEXTURES = 'textures',  // 加载纹理
  BUILDING_SCENE = 'scene',       // 构建场景
  FINALIZING = 'finalizing',      // 完成中
  COMPLETE = 'complete',          // 完成
  ERROR = 'error',                // 错误
}

/**
 * 加载进度信息
 */
export interface LoadingProgress {
  phase: LoadingPhase;
  phaseProgress: number;      // 当前阶段进度 (0-100)
  totalProgress: number;      // 总体进度 (0-100)
  loadedItems: number;        // 已加载项数
  totalItems: number;         // 总项数
  currentItem: string;        // 当前加载项名称
  estimatedTimeLeft: number;  // 预估剩余时间（秒）
  bytesLoaded: number;        // 已加载字节数
  bytesTotal: number;         // 总字节数
}

/**
 * 加载错误信息
 */
export interface LoadingError {
  phase: LoadingPhase;
  message: string;
  item?: string;
  retryable: boolean;
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: LoadingProgress) => void;
export type ErrorCallback = (error: LoadingError) => void;
export type CompleteCallback = () => void;

/**
 * 阶段权重配置（用于计算总进度）
 */
const PHASE_WEIGHTS: Record<LoadingPhase, number> = {
  [LoadingPhase.INITIALIZING]: 5,
  [LoadingPhase.LOADING_MODELS]: 50,
  [LoadingPhase.LOADING_TEXTURES]: 25,
  [LoadingPhase.BUILDING_SCENE]: 15,
  [LoadingPhase.FINALIZING]: 5,
  [LoadingPhase.COMPLETE]: 0,
  [LoadingPhase.ERROR]: 0,
};

/**
 * 3D场景加载管理器
 */
export class SceneLoadingManager {
  private currentPhase: LoadingPhase = LoadingPhase.INITIALIZING;
  private phaseProgress = 0;
  private loadedItems = 0;
  private totalItems = 0;
  private currentItem = '';
  private bytesLoaded = 0;
  private bytesTotal = 0;
  private startTime = 0;
  private phaseStartTime = 0;
  
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private completeCallbacks: Set<CompleteCallback> = new Set();
  
  private threeLoadingManager: THREE.LoadingManager;
  private errors: LoadingError[] = [];

  constructor() {
    this.threeLoadingManager = new THREE.LoadingManager(
      () => this.handleLoad(),
      (url, loaded, total) => this.handleProgress(url, loaded, total),
      (url) => this.handleError(url)
    );
  }

  /**
   * 获取Three.js加载管理器
   */
  getThreeLoadingManager(): THREE.LoadingManager {
    return this.threeLoadingManager;
  }

  /**
   * 开始加载
   */
  start(): void {
    this.startTime = Date.now();
    this.phaseStartTime = this.startTime;
    this.setPhase(LoadingPhase.INITIALIZING);
  }

  /**
   * 设置当前阶段
   */
  setPhase(phase: LoadingPhase): void {
    this.currentPhase = phase;
    this.phaseProgress = 0;
    this.phaseStartTime = Date.now();
    this.notifyProgress();
  }

  /**
   * 设置总项数
   */
  setTotalItems(total: number): void {
    this.totalItems = total;
    this.loadedItems = 0;
  }

  /**
   * 更新项进度
   */
  updateItemProgress(itemName: string, loaded: number, total: number): void {
    this.currentItem = itemName;
    this.bytesLoaded = loaded;
    this.bytesTotal = total;
    
    if (this.totalItems > 0) {
      this.phaseProgress = (this.loadedItems / this.totalItems) * 100;
    }
    
    this.notifyProgress();
  }

  /**
   * 完成一个项的加载
   */
  itemComplete(itemName: string): void {
    this.loadedItems++;
    this.currentItem = '';
    
    if (this.totalItems > 0) {
      this.phaseProgress = (this.loadedItems / this.totalItems) * 100;
    }
    
    this.notifyProgress();
  }

  /**
   * 设置阶段进度（手动）
   */
  setPhaseProgress(progress: number): void {
    this.phaseProgress = Math.min(100, Math.max(0, progress));
    this.notifyProgress();
  }

  /**
   * 完成当前阶段
   */
  completePhase(): void {
    this.phaseProgress = 100;
    this.notifyProgress();
  }

  /**
   * 报告错误
   */
  reportError(message: string, item?: string, retryable = true): void {
    const error: LoadingError = {
      phase: this.currentPhase,
      message,
      item,
      retryable,
    };
    
    this.errors.push(error);
    
    for (const callback of this.errorCallbacks) {
      callback(error);
    }
  }

  /**
   * 完成加载
   */
  complete(): void {
    this.currentPhase = LoadingPhase.COMPLETE;
    this.phaseProgress = 100;
    this.notifyProgress();
    
    for (const callback of this.completeCallbacks) {
      callback();
    }
  }

  /**
   * 获取当前进度
   */
  getProgress(): LoadingProgress {
    const totalProgress = this.calculateTotalProgress();
    const estimatedTimeLeft = this.calculateEstimatedTimeLeft();
    
    return {
      phase: this.currentPhase,
      phaseProgress: this.phaseProgress,
      totalProgress,
      loadedItems: this.loadedItems,
      totalItems: this.totalItems,
      currentItem: this.currentItem,
      estimatedTimeLeft,
      bytesLoaded: this.bytesLoaded,
      bytesTotal: this.bytesTotal,
    };
  }

  /**
   * 计算总进度
   */
  private calculateTotalProgress(): number {
    let completedWeight = 0;
    const phases = Object.keys(PHASE_WEIGHTS) as LoadingPhase[];
    
    for (const phase of phases) {
      if (phase === this.currentPhase) {
        // 当前阶段按比例计算
        completedWeight += PHASE_WEIGHTS[phase] * (this.phaseProgress / 100);
        break;
      } else if (this.isPhaseCompleted(phase)) {
        // 已完成的阶段
        completedWeight += PHASE_WEIGHTS[phase];
      }
    }
    
    return Math.min(100, completedWeight);
  }

  /**
   * 检查阶段是否已完成
   */
  private isPhaseCompleted(phase: LoadingPhase): boolean {
    const phaseOrder = [
      LoadingPhase.INITIALIZING,
      LoadingPhase.LOADING_MODELS,
      LoadingPhase.LOADING_TEXTURES,
      LoadingPhase.BUILDING_SCENE,
      LoadingPhase.FINALIZING,
      LoadingPhase.COMPLETE,
    ];
    
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    const checkIndex = phaseOrder.indexOf(phase);
    
    return checkIndex < currentIndex;
  }

  /**
   * 计算预估剩余时间
   */
  private calculateEstimatedTimeLeft(): number {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const totalProgress = this.calculateTotalProgress();
    
    if (totalProgress <= 0) {
      return -1; // 无法预估
    }
    
    const estimatedTotal = elapsed / (totalProgress / 100);
    return Math.max(0, estimatedTotal - elapsed);
  }

  /**
   * 通知进度更新
   */
  private notifyProgress(): void {
    const progress = this.getProgress();
    for (const callback of this.progressCallbacks) {
      callback(progress);
    }
  }

  /**
   * 订阅进度更新
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  /**
   * 订阅错误事件
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * 订阅完成事件
   */
  onComplete(callback: CompleteCallback): () => void {
    this.completeCallbacks.add(callback);
    return () => this.completeCallbacks.delete(callback);
  }

  /**
   * Three.js加载完成回调
   */
  private handleLoad(): void {
    // 所有资源加载完成
    this.completePhase();
  }

  /**
   * Three.js加载进度回调
   */
  private handleProgress(url: string, loaded: number, total: number): void {
    this.updateItemProgress(url, loaded, total);
  }

  /**
   * Three.js加载错误回调
   */
  private handleError(url: string): void {
    this.reportError(`加载失败: ${url}`, url, true);
  }

  /**
   * 获取所有错误
   */
  getErrors(): LoadingError[] {
    return [...this.errors];
  }

  /**
   * 清除错误
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 重置加载管理器
   */
  reset(): void {
    this.currentPhase = LoadingPhase.INITIALIZING;
    this.phaseProgress = 0;
    this.loadedItems = 0;
    this.totalItems = 0;
    this.currentItem = '';
    this.bytesLoaded = 0;
    this.bytesTotal = 0;
    this.errors = [];
    this.startTime = 0;
    this.phaseStartTime = 0;
  }

  /**
   * 销毁加载管理器
   */
  dispose(): void {
    this.progressCallbacks.clear();
    this.errorCallbacks.clear();
    this.completeCallbacks.clear();
    this.reset();
  }
}

/**
 * 获取阶段显示名称
 */
export function getPhaseDisplayName(phase: LoadingPhase): string {
  const names: Record<LoadingPhase, string> = {
    [LoadingPhase.INITIALIZING]: '正在初始化...',
    [LoadingPhase.LOADING_MODELS]: '正在加载模型...',
    [LoadingPhase.LOADING_TEXTURES]: '正在加载纹理...',
    [LoadingPhase.BUILDING_SCENE]: '正在构建场景...',
    [LoadingPhase.FINALIZING]: '正在完成...',
    [LoadingPhase.COMPLETE]: '加载完成',
    [LoadingPhase.ERROR]: '加载出错',
  };
  return names[phase];
}

/**
 * 格式化文件大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * 格式化时间
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) return '计算中...';
  if (seconds < 60) return `${Math.ceil(seconds)}秒`;
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${minutes}分${secs}秒`;
}

// 全局加载管理器实例
export const sceneLoadingManager = new SceneLoadingManager();