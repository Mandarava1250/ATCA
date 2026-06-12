/**
 * 华夏营造 - 知识库检测与冲突报告模块
 * 支持从后端数据库加载知识并进行语义相似度计算
 */

import { ref } from 'vue';
import { knowledgeApi } from '@/services/api';

// 冲突严重程度
export enum ConflictSeverity {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// 冲突报告结构
export interface ConflictReport {
  id: string;
  timestamp: number;
  conflicts: Conflict[];
  summary: string;
  recommendation: string;
}

export interface Conflict {
  id: string;
  description: string;
  severity: ConflictSeverity;
  detectedDifference: string;
  knowledgeSource: {
    chapter: string;
    paragraph: string;
    content: string;
  };
  analysis: string;
  suggestion: string;
}

// 知识库条目
interface KnowledgeEntry {
  topic_id: number;
  topic_key: string;
  topic_name: string;
  category: string;
  content: string;
  keywords: string[];
  confidence: number;
}

// 相似度配置
interface SimilarityConfig {
  threshold: number;
  highThreshold: number;
  mediumThreshold: number;
  lowThreshold: number;
}

// 默认配置
const DEFAULT_CONFIG: SimilarityConfig = {
  threshold: 0.6,
  highThreshold: 0.9,
  mediumThreshold: 0.7,
  lowThreshold: 0.5
};

class KnowledgeBaseDetector {
  private knowledgeBase: KnowledgeEntry[] = [];
  private config: SimilarityConfig = DEFAULT_CONFIG;
  private loaded = false;
  private loadPromise: Promise<void> | null = null;
  
  /**
   * 初始化知识库检测器
   * 优先从后端API加载，失败时使用内置知识
   */
  async initialize(): Promise<void> {
    if (this.loaded || this.loadPromise) {
      if (this.loadPromise) {
        await this.loadPromise;
      }
      return;
    }
    
    this.loadPromise = this._doInitialize();
    await this.loadPromise;
  }
  
  private async _doInitialize(): Promise<void> {
    try {
      // 从后端API加载知识库
      const res = await knowledgeApi.getAll();
      if (res.success && res.data && res.data.length > 0) {
        this.knowledgeBase = res.data.map((item: any) => ({
          topic_id: item.topic_id || item.topic_id,
          topic_key: item.topic_key,
          topic_name: item.topic_name,
          category: item.category,
          content: item.content,
          keywords: item.keywords ? item.keywords.split(',').map((k: string) => k.trim()) : [],
          confidence: item.confidence || 0.9
        }));
        this.loaded = true;
        console.log('[KnowledgeDetector] 从后端加载知识库成功，共', this.knowledgeBase.length, '条知识');
        return;
      }
    } catch (error) {
      console.warn('[KnowledgeDetector] 从后端加载失败，使用内置知识库:', error);
    }
    
    // 降级：使用内置知识库
    this.knowledgeBase = [
      {
        topic_id: 1,
        topic_key: 'tailiang',
        topic_name: '抬梁式结构',
        category: '木结构',
        content: '抬梁式（叠梁式）是中国古建筑最主要的木结构形式。特点：柱上承梁，梁上抬梁，逐层缩短，最上层立脊瓜柱承脊檩。适用于宫殿、庙宇等大型建筑。',
        keywords: ['抬梁', '抬梁式', '叠梁', '梁柱', '梁架', 'tailiang'],
        confidence: 0.98
      },
      {
        topic_id: 2,
        topic_key: 'chuandou',
        topic_name: '穿斗式结构',
        category: '木结构',
        content: '穿斗式（立贴式）是南方常见木结构形式。特点：柱距较密，柱头直接承檩，以穿枋连接各柱形成框架。用料省、整体性强，适用于民居等中小型建筑。',
        keywords: ['穿斗', '穿斗式', '穿枋', '立贴', 'chuandou'],
        confidence: 0.98
      },
      {
        topic_id: 3,
        topic_key: 'wudian',
        topic_name: '庑殿顶',
        category: '屋顶形制',
        content: '庑殿顶是中国古建筑最高等级的屋顶形制，有一条正脊和四条垂脊，四面斜坡。用于皇宫、庙宇主殿。重檐庑殿顶为最高等级。',
        keywords: ['庑殿', '庑殿顶', '四阿顶', '五脊顶', 'hipped', 'wudian'],
        confidence: 0.99
      },
      {
        topic_id: 4,
        topic_key: 'xieshan',
        topic_name: '歇山顶',
        category: '屋顶形制',
        content: '歇山顶等级仅次于庑殿顶，由正脊、垂脊、戗脊组成，上半部为悬山或硬山式，下半部为四面坡。常用于宫殿次要建筑和庙宇。',
        keywords: ['歇山', '歇山顶', '九脊顶', 'xieshan'],
        confidence: 0.98
      },
      {
        topic_id: 5,
        topic_key: 'dougong',
        topic_name: '斗拱',
        category: '构件',
        content: '斗拱是中国古建筑特有的结构构件，由斗、拱、昂等构件组成。功能：承托屋檐重量、传递荷载、增加出檐深度。清代称"斗科"。',
        keywords: ['斗拱', '铺作', '斗栱', '斗科', 'dougong'],
        confidence: 0.99
      },
      {
        topic_id: 6,
        topic_key: 'sunmao',
        topic_name: '榫卯结构',
        category: '连接方式',
        content: '榫卯是中国古代木构件的连接方式，通过凹凸结合实现连接，不用一钉一铆。类型包括燕尾榫、槽口榫、粽角榫等。',
        keywords: ['榫卯', '榫头', '卯眼', '凹凸结合', 'sunmao'],
        confidence: 0.97
      },
      {
        topic_id: 7,
        topic_key: 'caihua',
        topic_name: '彩画',
        category: '装饰',
        content: '古建筑彩画等级：和玺彩画（最高，用于皇宫）、旋子彩画（次之，用于庙宇）、苏式彩画（最次，用于园林）。',
        keywords: ['彩画', '和玺', '旋子', '苏式'],
        confidence: 0.95
      },
      {
        topic_id: 8,
        topic_key: 'taiji',
        topic_name: '台基与基座',
        category: '基座',
        content: '古建筑台基高度有严格等级规定：皇宫太和殿台基最高，民居台基最低。须弥座为最高等级台基。',
        keywords: ['台基', '基座', '须弥座', '台阶'],
        confidence: 0.96
      }
    ];
    
    this.loaded = true;
    console.log('[KnowledgeDetector] 使用内置知识库，共', this.knowledgeBase.length, '条知识');
  }
  
  /**
   * 设置相似度阈值
   */
  setThreshold(threshold: number): void {
    this.config.threshold = threshold;
    this.config.highThreshold = Math.min(0.95, threshold + 0.3);
    this.config.mediumThreshold = Math.min(0.8, threshold + 0.1);
    this.config.lowThreshold = threshold;
  }
  
  /**
   * 检测AI回答与知识库的冲突
   */
  async detectConflicts(aiResponse: string, context?: string): Promise<ConflictReport> {
    if (!this.loaded) {
      await this.initialize();
    }
    
    const conflicts: Conflict[] = [];
    const sentences = this.splitSentences(aiResponse);
    
    for (const sentence of sentences) {
      if (sentence.length < 10) continue;
      
      const matched = this.findMatchingKnowledge(sentence);
      
      if (matched && matched.similarity < this.config.threshold) {
        const conflict = this.createConflict(sentence, matched);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    const report = this.generateReport(conflicts, context);
    console.log('[KnowledgeDetector] 检测到', conflicts.length, '个潜在冲突');
    
    return report;
  }
  
  /**
   * 获取知识库条目数量
   */
  getEntryCount(): number {
    return this.knowledgeBase.length;
  }
  
  /**
   * 获取知识库统计
   */
  async getStats(): Promise<{ total: number; categories: number; verified: number }> {
    try {
      const res = await knowledgeApi.getStats();
      if (res.success) {
        return res.data;
      }
    } catch {
      // 忽略
    }
    return {
      total: this.knowledgeBase.length,
      categories: new Set(this.knowledgeBase.map(k => k.category)).size,
      verified: this.knowledgeBase.filter(k => k.confidence >= 0.95).length
    };
  }
  
  /**
   * 分割句子
   */
  private splitSentences(text: string): string[] {
    const sentences = text.split(/[。！？；\n]/);
    return sentences.filter(s => s.trim().length > 10);
  }
  
  /**
   * 查找匹配的知识库条目
   */
  private findMatchingKnowledge(text: string): { entry: KnowledgeEntry; similarity: number } | null {
    let bestMatch: { entry: KnowledgeEntry; similarity: number } | null = null;
    
    for (const entry of this.knowledgeBase) {
      const similarity = this.calculateSimilarity(text, entry);
      
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { entry, similarity };
      }
    }
    
    return bestMatch && bestMatch.similarity >= 0.3 ? bestMatch : null;
  }
  
  /**
   * 计算语义相似度
   */
  private calculateSimilarity(text: string, entry: KnowledgeEntry): number {
    const textWords = this.tokenize(text);
    const entryWords = this.tokenize(entry.content);
    const keywordSet = new Set(entry.keywords.map(k => k.toLowerCase()));
    
    // 关键词匹配
    const textSet = new Set(textWords.map(w => w.toLowerCase()));
    let keywordMatches = 0;
    for (const keyword of keywordSet) {
      if (textSet.has(keyword) || text.toLowerCase().includes(keyword)) {
        keywordMatches++;
      }
    }
    const keywordScore = keywordSet.size > 0 ? keywordMatches / keywordSet.size : 0;
    
    // 词汇重叠度
    let intersection = 0;
    for (const word of textWords) {
      if (entryWords.includes(word) && word.length > 1) {
        intersection++;
      }
    }
    const jaccardScore = (textWords.length + entryWords.length - intersection) > 0 
      ? intersection / (textWords.length + entryWords.length - intersection) 
      : 0;
    
    // 综合得分
    return keywordScore * 0.7 + jaccardScore * 0.3;
  }
  
  /**
   * 分词
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[，。！？、；：""''（）《》【】]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 1);
  }
  
  /**
   * 创建冲突对象
   */
  private createConflict(text: string, match: { entry: KnowledgeEntry; similarity: number }): Conflict | null {
    let severity: ConflictSeverity;
    if (match.similarity < this.config.lowThreshold) {
      severity = ConflictSeverity.HIGH;
    } else if (match.similarity < this.config.mediumThreshold) {
      severity = ConflictSeverity.MEDIUM;
    } else {
      severity = ConflictSeverity.LOW;
    }
    
    const analysis = `相似度：${(match.similarity * 100).toFixed(1)}%`;
    const suggestion = this.generateSuggestion(match.entry, severity);
    
    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `在回答中检测到与知识库不一致的内容`,
      severity,
      detectedDifference: `AI回答："${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      knowledgeSource: {
        chapter: match.entry.category,
        paragraph: `条目ID: ${match.entry.topic_id}`,
        content: match.entry.content
      },
      analysis,
      suggestion
    };
  }
  
  /**
   * 生成建议
   */
  private generateSuggestion(entry: KnowledgeEntry, severity: ConflictSeverity): string {
    switch (severity) {
      case ConflictSeverity.HIGH:
        return `⚠️ 严重警告：建议核实知识库原文：${entry.topic_name}`;
      case ConflictSeverity.MEDIUM:
        return `📌 中等差异：可参考知识库：${entry.topic_name} 进行补充`;
      default:
        return `💡 轻微差异：当前回答已基本准确`;
    }
  }
  
  /**
   * 生成完整报告
   */
  private generateReport(conflicts: Conflict[], context?: string): ConflictReport {
    const highCount = conflicts.filter(c => c.severity === ConflictSeverity.HIGH).length;
    const mediumCount = conflicts.filter(c => c.severity === ConflictSeverity.MEDIUM).length;
    const lowCount = conflicts.filter(c => c.severity === ConflictSeverity.LOW).length;
    
    let summary = '';
    if (conflicts.length === 0) {
      summary = '✅ 未检测到显著冲突，回答内容与知识库基本一致';
    } else {
      summary = `检测到 ${conflicts.length} 个潜在冲突（`;
      if (highCount > 0) summary += `高危 ${highCount} 个、`;
      if (mediumCount > 0) summary += `中危 ${mediumCount} 个、`;
      if (lowCount > 0) summary += `低危 ${lowCount} 个`;
      summary = summary.replace(/、$/, '') + '）';
    }
    
    let recommendation = '';
    if (highCount > 0) {
      recommendation = '🔴 建议：发现高危冲突，请优先核实相关知识库内容';
    } else if (mediumCount > 0) {
      recommendation = '🟡 建议：发现中等冲突，可参考知识库进行补充';
    } else {
      recommendation = '🟢 建议：回答质量良好，仅存在轻微差异';
    }
    
    return {
      id: `report_${Date.now()}`,
      timestamp: Date.now(),
      conflicts,
      summary,
      recommendation
    };
  }
}

// 单例
export const knowledgeDetector = new KnowledgeBaseDetector();

// Vue集成
export function useKnowledgeDetector() {
  const isInitializing = ref(false);
  const isDetecting = ref(false);
  const lastReport = ref<ConflictReport | null>(null);
  const error = ref<string | null>(null);
  
  async function initialize() {
    if (isInitializing.value) return;
    
    isInitializing.value = true;
    error.value = null;
    
    try {
      await knowledgeDetector.initialize();
    } catch (e: any) {
      error.value = e.message;
      console.error('[KnowledgeDetector] 初始化失败:', e);
    } finally {
      isInitializing.value = false;
    }
  }
  
  async function detect(aiResponse: string, context?: string): Promise<ConflictReport | null> {
    isDetecting.value = true;
    error.value = null;
    
    try {
      const report = await knowledgeDetector.detectConflicts(aiResponse, context);
      lastReport.value = report;
      return report;
    } catch (e: any) {
      error.value = e.message;
      console.error('[KnowledgeDetector] 检测失败:', e);
      return null;
    } finally {
      isDetecting.value = false;
    }
  }
  
  function setThreshold(threshold: number) {
    knowledgeDetector.setThreshold(threshold);
  }
  
  return {
    isInitializing,
    isDetecting,
    lastReport,
    error,
    initialize,
    detect,
    setThreshold
  };
}
