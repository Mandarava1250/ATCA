/**
 * 筑见山河 - 本地AI模型管理器
 * 调用后端API进行RAG推理（前后端分离架构）
 */

import { ref, computed } from 'vue';

// API响应接口
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

interface ModelInfo {
  loaded: boolean;
  loading: boolean;
  loadProgress: number;
  loadMessage: string;
  modelSize: string;
  memoryUsage: string;
  loadTime: number;
}

interface QueryResult {
  response: string;
  knowledge: any[];
  metadata: {
    model: string;
    reasoningTime: number;
    knowledgeUsed: number;
  };
  conflictReport?: any;
}

interface ConflictReport {
  id: string;
  timestamp: number;
  conflicts: any[];
  summary: string;
  recommendation: string;
}

// API基础路径
const API_BASE = '/api/v1/assistant';

class LocalAIManager {
  // 响应式状态
  public readonly modelInfo = ref<ModelInfo>({
    loaded: false,
    loading: false,
    loadProgress: 0,
    loadMessage: '',
    modelSize: '',
    memoryUsage: '',
    loadTime: 0
  });
  
  public readonly reasoningProgress = ref<{
    active: boolean;
    stage: string;
    step: number;
    total: number;
    message: string;
  }>({
    active: false,
    stage: '',
    step: 0,
    total: 0,
    message: ''
  });
  
  public readonly isReady = computed(() => this.modelInfo.value.loaded && !this.modelInfo.value.loading);
  
  /**
   * 初始化本地AI服务（调用后端API）
   */
  async initialize(): Promise<void> {
    if (this.modelInfo.value.loaded || this.modelInfo.value.loading) {
      return;
    }
    
    this.modelInfo.value.loading = true;
    this.modelInfo.value.loadProgress = 0;
    this.modelInfo.value.loadMessage = '正在连接后端服务...';
    
    try {
      // 模拟加载进度
      const progressSteps = [
        { progress: 20, message: '连接后端服务...' },
        { progress: 40, message: '加载知识库...' },
        { progress: 60, message: '初始化RAG引擎...' },
        { progress: 80, message: '验证模型状态...' },
        { progress: 100, message: '初始化完成' }
      ];
      
      for (const step of progressSteps) {
        this.modelInfo.value.loadProgress = step.progress;
        this.modelInfo.value.loadMessage = step.message;
        await this.delay(200);
      }
      
      // 调用后端初始化API
      const response = await fetch(`${API_BASE}/local-ai/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // 检查HTTP响应状态
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || '初始化失败');
      }
      
      this.modelInfo.value = {
        loaded: true,
        loading: false,
        loadProgress: 100,
        loadMessage: '服务就绪',
        modelSize: '~50MB',
        memoryUsage: '~200MB',
        loadTime: 1000
      };
      
      console.log('[LocalAI] 后端服务连接成功', result.data);
    } catch (error: any) {
      console.error('[LocalAI] 初始化失败:', error);
      this.modelInfo.value.loading = false;
      this.modelInfo.value.loadMessage = `初始化失败: ${error.message}`;
      throw error;
    }
  }
  
  /**
   * 执行RAG查询（调用后端API）
   */
  async query(text: string, enhancedCheck = false): Promise<QueryResult> {
    if (!this.modelInfo.value.loaded) {
      // 自动初始化
      await this.initialize();
    }
    
    this.reasoningProgress.value = {
      active: true,
      stage: 'reasoning',
      step: 0,
      total: 4,
      message: '开始分析问题...'
    };
    
    try {
      // 模拟推理进度
      const reasoningSteps = [
        { step: 1, message: '理解问题语义...' },
        { step: 2, message: '检索知识库...' },
        { step: 3, message: '生成回答...' },
        { step: 4, message: '完成推理...' }
      ];
      
      // 启动进度动画（不等待）
      const progressPromise = (async () => {
        for (const step of reasoningSteps) {
          this.reasoningProgress.value.step = step.step;
          this.reasoningProgress.value.message = step.message;
          await this.delay(150);
        }
      })();
      
      // 调用后端API
      const response = await fetch(`${API_BASE}/local-ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          enhancedCheck 
        })
      });
      
      // 检查HTTP响应状态
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      
      const result: ApiResponse<QueryResult> = await response.json();
      
      // 等待进度动画完成
      await progressPromise;
      
      this.reasoningProgress.value = {
        active: false,
        stage: '',
        step: 0,
        total: 0,
        message: ''
      };
      
      if (!result.success) {
        throw new Error(result.error?.message || '查询失败');
      }
      
      return result.data!;
    } catch (error: any) {
      this.reasoningProgress.value = {
        active: false,
        stage: '',
        step: 0,
        total: 0,
        message: ''
      };
      throw error;
    }
  }
  
  /**
   * 检测冲突（调用后端API）
   */
  async detectConflicts(response: string): Promise<ConflictReport> {
    const res = await fetch(`${API_BASE}/local-ai/conflicts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response })
    });
    
    // 检查HTTP响应状态
    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status} ${res.statusText}`);
    }
    
    const result: ApiResponse<ConflictReport> = await res.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || '冲突检测失败');
    }
    
    return result.data!;
  }
  
  /**
   * 获取知识库统计信息
   */
  async getStats(): Promise<any> {
    const response = await fetch(`${API_BASE}/local-ai/stats`);
    
    // 检查HTTP响应状态
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }
    
    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || '获取统计信息失败');
    }
    
    return result.data;
  }
  
  /**
   * 中断推理（前端无状态，仅重置UI）
   */
  abort() {
    this.reasoningProgress.value = {
      active: false,
      stage: '',
      step: 0,
      total: 0,
      message: ''
    };
  }
  
  /**
   * 销毁（重置状态）
   */
  destroy() {
    this.modelInfo.value = {
      loaded: false,
      loading: false,
      loadProgress: 0,
      loadMessage: '',
      modelSize: '',
      memoryUsage: '',
      loadTime: 0
    };
    this.reasoningProgress.value = {
      active: false,
      stage: '',
      step: 0,
      total: 0,
      message: ''
    };
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 单例模式
export const localAIManager = new LocalAIManager();
