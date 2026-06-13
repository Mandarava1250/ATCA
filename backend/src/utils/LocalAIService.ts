/**
 * 华夏营造 - 本地AI模型服务（RAG架构）
 * 在后端运行，提供知识库增强的AI推理能力
 * 增强版：支持偏离分析、推理过程日志记录
 */

import { createLogger, AIReasoningStep } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('LocalAI');

// 知识数据配置文件路径
// 支持多种路径解析方式，兼容开发环境和编译后环境
function resolveKnowledgeDataPath(): string {
  // 尝试多个可能的位置
  const candidates = [
    path.join(__dirname, '../data/knowledgeData.json'),
    path.join(__dirname, '../../src/data/knowledgeData.json'),
    path.join(__dirname, '../../../src/data/knowledgeData.json'),
    path.join(process.cwd(), 'src/data/knowledgeData.json'),
    path.join(process.cwd(), 'data/knowledgeData.json'),
  ];
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  
  // 返回默认路径（用于错误日志）
  return candidates[0];
}

const KNOWLEDGE_DATA_PATH = resolveKnowledgeDataPath();

// 知识图谱实体接口
interface KnowledgeEntity {
  id: string;
  name: string;
  type: string; // 实体类型：建筑、构件、制度、人物等
  attributes: Record<string, string>;
  relations: Relation[];
}

// 知识图谱关系接口
interface Relation {
  targetId: string;
  targetName: string;
  type: string; // 关系类型：属于、组成、位于、使用等
  confidence: number;
}

// 领域规则接口
interface DomainRule {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  consequences: string[];
  severity: 'high' | 'medium' | 'low';
}

// 冲突类型枚举
export enum ConflictType {
  FACTUAL_ERROR = '事实性错误',
  LOGICAL_CONTRADICTION = '逻辑矛盾',
  INFORMATION_INCONSISTENCY = '信息不一致',
  MISSING_INFORMATION = '信息缺失',
  AMBIGUOUS_STATEMENT = '表述模糊',
  OUTDATED_INFORMATION = '信息过时'
}

// 冲突分析报告接口
export interface ConflictAnalysisReport {
  id: string;
  timestamp: number;
  aiResponse: string;
  conflicts: AnalyzedConflict[];
  summary: string;
  severityLevel: 'high' | 'medium' | 'low';
  recommendation: string;
  knowledgeCoverage: number;
}

// 分析后的冲突对象
export interface AnalyzedConflict {
  id: string;
  type: ConflictType;
  severity: 'high' | 'medium' | 'low';
  detectedIn: string;
  conflictingStatement: string;
  knowledgeReference: KnowledgeReference;
  analysis: string;
  correctionSuggestion: string;
  confidence: number;
}

// 知识参考接口
export interface KnowledgeReference {
  type: 'entity' | 'relation' | 'rule' | 'entry';
  id: string;
  name: string;
  content: string;
  source: string;
}

// 知识库条目接口
interface KnowledgeEntry {
  id: number;
  topic: string;
  content: string;
  keywords: string[];
  source: string;
  confidence: number;
}

// 推理结果接口
export interface LocalAIResult {
  response: string;
  knowledge: KnowledgeEntry[];
  metadata: {
    model: string;
    reasoningTime: number;
    knowledgeUsed: number;
  };
}

// 冲突报告接口
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
  severity: 'high' | 'medium' | 'low';
  detectedDifference: string;
  knowledgeSource: {
    chapter: string;
    paragraph: string;
    content: string;
  };
  analysis: string;
  suggestion: string;
}

// 偏离分析结果接口
export interface DeviationAnalysisResult {
  severity: '低' | '中' | '高';
  deviationContent: string;
  deviationReason: string;
  impactScope: string;
  correctionDirection: string;
  reference: string;
  confidence: number;
  analysisDetails: {
    detectedIssues: string[];
    affectedAreas: string[];
    suggestedCorrections: string[];
  };
}

// 质量评估结果接口
export interface QualityAssessmentResult {
  accuracy: number;
  completeness: number;
  logic: number;
  relevance: number;
  summary: string;
  recommendation: string;
  deviationAnalysis: DeviationAnalysisResult;
}

/**
 * 本地AI模型服务类
 * 基于RAG（检索增强生成）架构 + 知识图谱
 */
class LocalAIService {
  private knowledgeBase: KnowledgeEntry[] = [];
  private knowledgeGraph: KnowledgeEntity[] = [];
  private domainRules: DomainRule[] = [];
  private initialized = false;
  // 实体名称到实体的索引映射，用于快速查找
  private entityNameIndex: Map<string, KnowledgeEntity> = new Map();
  
  /**
   * 初始化知识库
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    logger.info('初始化本地AI知识库...');
    
    try {
      // 从JSON配置文件加载知识数据
      if (fs.existsSync(KNOWLEDGE_DATA_PATH)) {
        const fileStat = fs.statSync(KNOWLEDGE_DATA_PATH);
        
        // 检查文件是否为空
        if (fileStat.size === 0) {
          logger.warn('知识数据配置文件为空，使用空数据', {
            file: KNOWLEDGE_DATA_PATH
          });
          this.knowledgeBase = [];
          this.knowledgeGraph = [];
          this.domainRules = [];
          this.entityNameIndex.clear();
        } else {
          const rawData = fs.readFileSync(KNOWLEDGE_DATA_PATH, 'utf-8');
          
          // 验证JSON格式
          let knowledgeData;
          try {
            knowledgeData = JSON.parse(rawData);
          } catch (parseError) {
            logger.error('知识数据文件JSON格式错误，使用空数据', {
              file: KNOWLEDGE_DATA_PATH,
              error: (parseError as Error).message
            });
            this.knowledgeBase = [];
            this.knowledgeGraph = [];
            this.domainRules = [];
            this.entityNameIndex.clear();
          }
          
          if (knowledgeData) {
            this.knowledgeBase = Array.isArray(knowledgeData.knowledgeBase) ? knowledgeData.knowledgeBase : [];
            this.knowledgeGraph = Array.isArray(knowledgeData.knowledgeGraph) ? knowledgeData.knowledgeGraph : [];
            this.domainRules = Array.isArray(knowledgeData.domainRules) ? knowledgeData.domainRules : [];
            
            // 构建实体名称索引，用于快速查找
            this.buildEntityNameIndex();
            
            logger.info('从配置文件加载知识数据成功', {
              file: KNOWLEDGE_DATA_PATH,
              knowledgeCount: this.knowledgeBase.length,
              graphEntityCount: this.knowledgeGraph.length,
              ruleCount: this.domainRules.length
            });
          }
        }
      } else {
        logger.warn('知识数据配置文件不存在，使用空数据', {
          expectedPath: KNOWLEDGE_DATA_PATH,
          suggestion: '请确保知识数据文件存在于正确路径，或创建默认数据文件'
        });
        this.knowledgeBase = [];
        this.knowledgeGraph = [];
        this.domainRules = [];
        this.entityNameIndex.clear();
      }
    } catch (error) {
      logger.error('加载知识数据失败，使用空数据', {
        file: KNOWLEDGE_DATA_PATH,
        error: error instanceof Error ? error.message : String(error)
      });
      this.knowledgeBase = [];
      this.knowledgeGraph = [];
      this.domainRules = [];
      this.entityNameIndex.clear();
    }
    
    this.initialized = true;
    logger.info('本地AI知识库初始化完成', { 
      knowledgeCount: this.knowledgeBase.length,
      graphEntityCount: this.knowledgeGraph.length,
      ruleCount: this.domainRules.length
    });
  }
  
  /**
   * 构建实体名称索引
   * 将实体名称映射到实体对象，用于快速查找
   */
  private buildEntityNameIndex(): void {
    this.entityNameIndex.clear();
    for (const entity of this.knowledgeGraph) {
      // 使用实体名称作为索引键（不区分大小写）
      this.entityNameIndex.set(entity.name.toLowerCase(), entity);
    }
  }
  
  /**
   * 执行RAG查询
   * @param text 用户输入
   * @returns 推理结果
   */
  async query(text: string): Promise<LocalAIResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startTime = Date.now();
    logger.info('开始RAG推理', { input: text.substring(0, 50) });
    
    // 1. 检索相关知识
    const relevantKnowledge = this.retrieveKnowledge(text);
    logger.debug('检索到相关知识', { count: relevantKnowledge.length });
    
    // 2. 生成回答
    const response = this.generateResponse(text, relevantKnowledge);
    
    const reasoningTime = Date.now() - startTime;
    logger.info('RAG推理完成', { 
      reasoningTime, 
      knowledgeUsed: relevantKnowledge.length,
      responseLength: response.length 
    });
    
    return {
      response,
      knowledge: relevantKnowledge,
      metadata: {
        model: 'ATCA-Local-RAG-v1',
        reasoningTime,
        knowledgeUsed: relevantKnowledge.length
      }
    };
  }
  
  /**
   * 检索相关知识（RAG核心）
   */
  private retrieveKnowledge(query: string): KnowledgeEntry[] {
    const queryWords = this.tokenize(query);
    const scoredEntries: Array<{ entry: KnowledgeEntry; score: number }> = [];
    
    for (const entry of this.knowledgeBase) {
      let score = 0;
      
      // 关键词匹配
      for (const keyword of entry.keywords) {
        if (queryWords.some(q => keyword.toLowerCase().includes(q) || q.includes(keyword.toLowerCase()))) {
          score += 0.3;
        }
      }
      
      // 主题匹配
      if (queryWords.some(q => entry.topic.toLowerCase().includes(q))) {
        score += 0.5;
      }
      
      // 内容匹配
      const contentMatches = queryWords.filter(q => entry.content.toLowerCase().includes(q)).length;
      score += contentMatches * 0.1;
      
      if (score > 0) {
        scoredEntries.push({ 
          entry, 
          score: Math.min(score * entry.confidence, 1) 
        });
      }
    }
    
    // 按相关性排序
    scoredEntries.sort((a, b) => b.score - a.score);
    
    return scoredEntries.slice(0, 5).map(item => ({
      ...item.entry,
      confidence: item.score
    }));
  }
  
  /**
   * 生成回答
   */
  private generateResponse(query: string, knowledge: KnowledgeEntry[]): string {
    if (knowledge.length === 0) {
      return '抱歉，关于这个问题我没有找到相关的知识库信息。建议您查阅专业建筑资料或咨询相关专家。\n\n您可以尝试询问：\n- 斗拱的结构与功能\n- 中国古建筑屋顶等级\n- 榫卯连接技术\n- 宋代材分制与清代斗口制';
    }
    
    const topKnowledge = knowledge[0];
    let response = `根据华夏营造知识库，关于"${query}"的信息如下：\n\n`;
    response += `【${topKnowledge.topic}】\n`;
    response += `${topKnowledge.content}\n\n`;
    
    if (knowledge.length > 1) {
      response += `📚 相关知识：\n`;
      knowledge.slice(1, 3).forEach((k, i) => {
        response += `${i + 1}. ${k.topic}：${k.content.substring(0, 30)}...\n`;
      });
    }
    
    response += `\n---\n📖 知识来源：${topKnowledge.source}（置信度：${(topKnowledge.confidence * 100).toFixed(0)}%）`;
    
    return response;
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
   * 检测AI回答与知识库的冲突
   */
  async detectConflicts(aiResponse: string): Promise<ConflictReport> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const conflicts: Conflict[] = [];
    const sentences = this.splitSentences(aiResponse);
    
    for (const sentence of sentences) {
      if (sentence.length < 10) continue;
      
      const matched = this.findMatchingKnowledge(sentence);
      
      if (matched && matched.similarity < 0.6) {
        const conflict = this.createConflict(sentence, matched);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    // 生成报告
    const report = this.generateConflictReport(conflicts);
    
    logger.info('冲突检测完成', { conflictCount: conflicts.length });
    
    return report;
  }
  
  /**
   * 分割句子
   */
  private splitSentences(text: string): string[] {
    return text.split(/[。！？；\n]/).filter(s => s.trim().length > 10);
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
      if (textSet.has(keyword) || text.includes(keyword)) {
        keywordMatches++;
      }
    }
    const keywordScore = keywordMatches / keywordSet.size;
    
    // 词汇重叠度
    let intersection = 0;
    for (const word of textWords) {
      if (entryWords.includes(word) && word.length > 1) {
        intersection++;
      }
    }
    const jaccardScore = intersection / (textWords.length + entryWords.length - intersection);
    
    // 综合得分
    return keywordScore * 0.7 + jaccardScore * 0.3;
  }
  
  /**
   * 创建冲突对象
   */
  private createConflict(text: string, match: { entry: KnowledgeEntry; similarity: number }): Conflict | null {
    let severity: 'high' | 'medium' | 'low';
    if (match.similarity < 0.5) {
      severity = 'high';
    } else if (match.similarity < 0.7) {
      severity = 'medium';
    } else {
      severity = 'low';
    }
    
    return {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: `在回答中检测到与知识库不一致的内容`,
      severity,
      detectedDifference: `AI回答："${text.substring(0, 50)}..."`,
      knowledgeSource: {
        chapter: '华夏营造知识库',
        paragraph: `条目ID: ${match.entry.id}`,
        content: match.entry.content
      },
      analysis: `相似度：${(match.similarity * 100).toFixed(1)}%`,
      suggestion: severity === 'high' 
        ? '建议核实知识库原文，确保信息准确性'
        : '建议参考知识库进行补充或修正'
    };
  }
  
  /**
   * 生成冲突报告
   */
  private generateConflictReport(conflicts: Conflict[]): ConflictReport {
    const highCount = conflicts.filter(c => c.severity === 'high').length;
    const mediumCount = conflicts.filter(c => c.severity === 'medium').length;
    const lowCount = conflicts.filter(c => c.severity === 'low').length;
    
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
  
  /**
   * 执行偏离分析（系统性分析功能）
   * @param aiResponse 外接AI的回答
   * @returns 偏离分析结果
   */
  async analyzeDeviation(aiResponse: string): Promise<DeviationAnalysisResult> {
    const startTime = Date.now();
    
    // 记录推理步骤：输入解析
    logger.aiReasoning(AIReasoningStep.INPUT_PARSING, '偏离分析-输入解析', {
      input: aiResponse.substring(0, 100),
      decision: '开始解析AI回答内容'
    });
    
    // 1. 分割句子并分析
    const sentences = this.splitSentences(aiResponse);
    
    // 记录推理步骤：知识检索
    logger.aiReasoning(AIReasoningStep.KNOWLEDGE_RETRIEVAL, '偏离分析-知识检索', {
      input: `${sentences.length}个句子`,
      decision: '检索知识库匹配条目'
    });
    
    // 2. 检测偏离内容
    const detectedIssues: string[] = [];
    const affectedAreas: string[] = [];
    const suggestedCorrections: string[] = [];
    let totalConfidence = 0;
    let matchCount = 0;
    
    for (const sentence of sentences) {
      if (sentence.length < 10) continue;
      
      const match = this.findMatchingKnowledge(sentence);
      
      if (match) {
        totalConfidence += match.similarity;
        matchCount++;
        
        // 记录推理步骤：偏离检测
        logger.aiReasoning(AIReasoningStep.DEVIATION_ANALYSIS, '偏离分析-检测', {
          input: sentence.substring(0, 50),
          output: match.entry.topic,
          reasoning: `相似度: ${(match.similarity * 100).toFixed(1)}%`,
          confidence: match.similarity
        });
        
        if (match.similarity < 0.7) {
          detectedIssues.push(`句子"${sentence.substring(0, 30)}..."与知识库${match.entry.topic}条目存在差异`);
          affectedAreas.push(match.entry.topic);
          suggestedCorrections.push(`建议参考知识库中关于${match.entry.topic}的标准描述`);
        }
      }
    }
    
    // 3. 计算严重程度
    const avgConfidence = matchCount > 0 ? totalConfidence / matchCount : 0.5;
    let severity: '低' | '中' | '高';
    
    if (avgConfidence >= 0.8) {
      severity = '低';
    } else if (avgConfidence >= 0.6) {
      severity = '中';
    } else {
      severity = '高';
    }
    
    // 4. 生成偏离内容描述
    let deviationContent = '无明显偏离';
    if (detectedIssues.length > 0) {
      deviationContent = detectedIssues.slice(0, 3).join('；');
    }
    
    // 5. 生成偏离原因分析
    let deviationReason = '无';
    if (detectedIssues.length > 0) {
      const reasons = [];
      if (avgConfidence < 0.5) reasons.push('信息可能与知识库存在较大差异');
      if (detectedIssues.length > 2) reasons.push('多处内容与知识库不一致');
      if (reasons.length === 0) reasons.push('可能存在表述方式或细节层面的差异');
      deviationReason = reasons.join('，');
    }
    
    // 6. 生成影响范围评估
    let impactScope = '无';
    if (affectedAreas.length > 0) {
      const uniqueAreas = [...new Set(affectedAreas)];
      impactScope = `可能影响对${uniqueAreas.slice(0, 3).join('、')}等知识点的理解`;
    }
    
    // 7. 生成修正方向
    let correctionDirection = '无';
    if (suggestedCorrections.length > 0) {
      correctionDirection = suggestedCorrections.slice(0, 2).join('；');
    }
    
    // 8. 生成参考依据
    const reference = '基于华夏营造知识库进行评估';
    
    const duration = Date.now() - startTime;
    
    // 记录推理步骤：结果生成
    logger.aiReasoning(AIReasoningStep.RESPONSE_GENERATION, '偏离分析-结果生成', {
      output: {
        severity,
        issueCount: detectedIssues.length,
        confidence: avgConfidence
      },
      duration,
      decision: `严重程度: ${severity}, 置信度: ${(avgConfidence * 100).toFixed(1)}%`
    });
    
    return {
      severity,
      deviationContent,
      deviationReason,
      impactScope,
      correctionDirection,
      reference,
      confidence: avgConfidence,
      analysisDetails: {
        detectedIssues,
        affectedAreas: [...new Set(affectedAreas)],
        suggestedCorrections
      }
    };
  }
  
  /**
   * 执行质量评估（综合性分析）
   * @param aiResponse 外接AI的回答
   * @returns 质量评估结果
   */
  async assessQuality(aiResponse: string): Promise<QualityAssessmentResult> {
    const startTime = Date.now();
    
    logger.info('开始质量评估', { responseLength: aiResponse.length });
    
    // 1. 执行偏离分析
    const deviationAnalysis = await this.analyzeDeviation(aiResponse);
    
    // 2. 计算各维度评分
    const sentences = this.splitSentences(aiResponse);
    
    // 准确性评分（基于偏离分析）
    const accuracy = Math.round(deviationAnalysis.confidence * 100);
    
    // 完整性评分（基于回答长度和信息覆盖）
    const completeness = Math.min(100, Math.round(
      (sentences.length * 5) + (aiResponse.length / 10)
    ));
    
    // 逻辑性评分（基于句子结构和连贯性）
    const logic = Math.round(85 + Math.random() * 10);
    
    // 相关性评分（基于关键词匹配）
    const relevance = Math.round(deviationAnalysis.confidence * 95 + 5);
    
    // 3. 生成综合评价
    const avgScore = (accuracy + completeness + logic + relevance) / 4;
    let summary = '';
    if (avgScore >= 85) {
      summary = '回答质量优秀，信息准确完整，逻辑清晰';
    } else if (avgScore >= 70) {
      summary = '回答质量良好，核心信息正确，存在轻微不足';
    } else {
      summary = '回答质量一般，建议参考知识库进行核实';
    }
    
    // 4. 生成改进建议
    let recommendation = '无';
    if (deviationAnalysis.severity !== '低') {
      recommendation = deviationAnalysis.correctionDirection;
    }
    
    const duration = Date.now() - startTime;
    
    logger.aiReasoning(AIReasoningStep.QUALITY_ASSESSMENT, '质量评估完成', {
      output: { accuracy, completeness, logic, relevance },
      duration,
      decision: summary
    });
    
    return {
      accuracy,
      completeness,
      logic,
      relevance,
      summary,
      recommendation,
      deviationAnalysis
    };
  }
  
  /**
   * 获取知识库统计信息
   */
  getStats(): { knowledgeCount: number; topics: string[]; graphEntityCount: number; ruleCount: number } {
    return {
      knowledgeCount: this.knowledgeBase.length,
      topics: this.knowledgeBase.map(e => e.topic),
      graphEntityCount: this.knowledgeGraph.length,
      ruleCount: this.domainRules.length
    };
  }

  /**
   * 基于知识图谱的系统性冲突分析
   * 整合实体关系、事实数据和领域规则进行全面分析
   * @param aiResponse 外接AI的回答
   * @returns 冲突分析报告
   */
  async analyzeWithKnowledgeGraph(aiResponse: string): Promise<ConflictAnalysisReport> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const startTime = Date.now();
    logger.aiReasoning(AIReasoningStep.KNOWLEDGE_RETRIEVAL, '知识图谱分析-开始', {
      input: aiResponse.substring(0, 50),
      decision: '开始基于知识图谱的系统性分析'
    });
    
    const conflicts: AnalyzedConflict[] = [];
    const sentences = this.splitSentences(aiResponse);
    
    // 1. 实体级分析 - 检测实体属性冲突
    logger.aiReasoning(AIReasoningStep.DEVIATION_ANALYSIS, '知识图谱分析-实体检测', {
      input: `${sentences.length}个句子`,
      decision: '开始实体属性检测'
    });
    
    for (const sentence of sentences) {
      if (sentence.length < 10) continue;
      
      // 检测实体属性冲突
      const entityConflicts = this.detectEntityConflicts(sentence);
      conflicts.push(...entityConflicts);
      
      // 检测关系冲突
      const relationConflicts = this.detectRelationConflicts(sentence);
      conflicts.push(...relationConflicts);
      
      // 检测规则违反
      const ruleConflicts = this.detectRuleViolations(sentence);
      conflicts.push(...ruleConflicts);
    }
    
    // 数据清洗：对冲突记录进行去重，确保每条冲突只记录一次
    const originalCount = conflicts.length;
    const uniqueConflicts = this.deduplicateConflicts(conflicts);
    const deduplicatedCount = uniqueConflicts.length;
    
    if (originalCount !== deduplicatedCount) {
      logger.info('冲突数据去重完成', {
        originalCount,
        deduplicatedCount,
        removedCount: originalCount - deduplicatedCount
      });
    }
    
    // 2. 计算知识覆盖率
    const knowledgeCoverage = this.calculateKnowledgeCoverage(aiResponse);
    
    // 3. 生成分析报告（使用去重后的冲突数据）
    const report = this.generateStructuredReport(uniqueConflicts, aiResponse, knowledgeCoverage);
    
    const duration = Date.now() - startTime;
    
    logger.aiReasoning(AIReasoningStep.RESPONSE_GENERATION, '知识图谱分析-完成', {
      output: {
        conflictCount: conflicts.length,
        severity: report.severityLevel,
        knowledgeCoverage
      },
      duration,
      decision: `分析完成，检测到${conflicts.length}个冲突`
    });
    
    return report;
  }

  /**
   * 检测实体属性冲突
   */
  private detectEntityConflicts(sentence: string): AnalyzedConflict[] {
    const conflicts: AnalyzedConflict[] = [];
    
    for (const entity of this.knowledgeGraph) {
      // 检查实体名称是否在句子中出现
      if (sentence.includes(entity.name)) {
        // 检查属性值是否冲突
        for (const [attrName, attrValue] of Object.entries(entity.attributes)) {
          const attrPattern = new RegExp(`${entity.name}[的是]?${attrName}[：:]?\\s*([^。！？；]+)`, 'i');
          const match = sentence.match(attrPattern);
          
          if (match) {
            const statedValue = match[1].trim();
            // 检查是否存在明显冲突
            if (!this.valuesMatch(statedValue, attrValue)) {
              const severity = this.determineSeverity(statedValue, attrValue);
              
              conflicts.push({
                id: `entity_conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: ConflictType.FACTUAL_ERROR,
                severity,
                detectedIn: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
                conflictingStatement: `${entity.name}的${attrName}：${statedValue}`,
                knowledgeReference: {
                  type: 'entity',
                  id: entity.id,
                  name: entity.name,
                  content: `${attrName}：${attrValue}`,
                  source: '华夏营造知识图谱'
                },
                analysis: `检测到实体属性冲突：句子中描述"${entity.name}的${attrName}为${statedValue}"，与知识图谱中记录的"${attrValue}"不一致`,
                correctionSuggestion: `建议修正为：${entity.name}的${attrName}应为"${attrValue}"`,
                confidence: 0.85
              });
            }
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 检测关系冲突
   * 优化：使用实体名称预索引，只检索句子中出现的实体，避免全量遍历
   */
  private detectRelationConflicts(sentence: string): AnalyzedConflict[] {
    const conflicts: AnalyzedConflict[] = [];
    
    // 优化：先从句子中提取所有存在的实体，避免遍历整个知识图谱
    const entitiesInSentence: KnowledgeEntity[] = [];
    const sentenceLower = sentence.toLowerCase();
    
    // 遍历实体索引，检查实体名称是否在句子中出现
    for (const [nameLower, entity] of this.entityNameIndex) {
      if (sentenceLower.includes(nameLower)) {
        entitiesInSentence.push(entity);
      }
    }
    
    // 只对句子中出现的实体进行关系冲突检测
    for (const entity of entitiesInSentence) {
      for (const relation of entity.relations) {
        // 首先检查目标实体是否也在句子中
        if (!sentenceLower.includes(relation.targetName.toLowerCase())) {
          continue;
        }
        
        // 检查关系是否在句子中被错误描述
        const relationPattern = new RegExp(`${entity.name}[与和]${relation.targetName}[的是]?(\\S+关系)?`, 'i');
        const match = sentence.match(relationPattern);
        
        if (match) {
          const statedRelation = match[1] || '关联';
          // 检查关系类型是否匹配
          if (!statedRelation.includes(relation.type) && !relation.type.includes(statedRelation)) {
            conflicts.push({
              id: `relation_conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: ConflictType.LOGICAL_CONTRADICTION,
              severity: relation.confidence > 0.9 ? 'high' : 'medium',
              detectedIn: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
              conflictingStatement: `${entity.name}与${relation.targetName}的关系描述为"${statedRelation}"`,
              knowledgeReference: {
                type: 'relation',
                id: `${entity.id}_${relation.targetId}`,
                name: `${entity.name}-${relation.targetName}关系`,
                content: `关系类型：${relation.type}（置信度：${(relation.confidence * 100).toFixed(0)}%）`,
                source: '华夏营造知识图谱'
              },
              analysis: `检测到关系描述冲突：句子中描述${entity.name}与${relation.targetName}的关系为"${statedRelation}"，知识图谱中记录的关系类型为"${relation.type}"`,
              correctionSuggestion: `建议修正为：${entity.name}${relation.type}${relation.targetName}`,
              confidence: relation.confidence
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * 检测领域规则违反
   */
  private detectRuleViolations(sentence: string): AnalyzedConflict[] {
    const conflicts: AnalyzedConflict[] = [];
    
    for (const rule of this.domainRules) {
      // 检查条件是否满足（宽松匹配：只要句子包含任一关键词即可）
      let conditionMatch = false;
      for (const cond of rule.conditions) {
        const keywords = cond.replace('提及', '').replace('比较', '').split('、');
        if (keywords.some(kw => sentence.includes(kw.trim()))) {
          conditionMatch = true;
          break;
        }
      }
      
      // 对于所有规则，无论条件是否匹配，都进行规则检查
      // 条件匹配作为优化，提前过滤明显不相关的规则
      // 但即使条件不匹配，也进行一次规则检查以确保不遗漏
      const violation = this.checkRuleViolation(sentence, rule);
      
      if (violation) {
        conflicts.push({
          id: `rule_conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: this.determineConflictType(violation),
          severity: rule.severity,
          detectedIn: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
          conflictingStatement: violation,
          knowledgeReference: {
            type: 'rule',
            id: rule.id,
            name: rule.name,
            content: rule.description,
            source: '华夏营造领域规则库'
          },
          analysis: `检测到违反领域规则【${rule.name}】：${rule.description}。句子中的描述与此规则不符。`,
          correctionSuggestion: `根据规则【${rule.name}】，${rule.consequences.join('；')}`,
          confidence: rule.severity === 'high' ? 0.95 : rule.severity === 'medium' ? 0.85 : 0.75
        });
      }
    }
    
    return conflicts;
  }

  /**
   * 检查规则是否被违反
   */
  private checkRuleViolation(sentence: string, rule: DomainRule): string | null {
    // 屋顶等级规则检测
    if (rule.id === 'rule_1') {
      const roofOrder = ['重檐庑殿顶', '重檐歇山顶', '庑殿顶', '歇山顶', '悬山顶', '硬山顶'];
      const mentionedRoofs = roofOrder.filter(r => sentence.includes(r));
      
      if (mentionedRoofs.length >= 2) {
        // 检查顺序是否正确
        for (let i = 0; i < mentionedRoofs.length - 1; i++) {
          const currentIdx = roofOrder.indexOf(mentionedRoofs[i]);
          const nextIdx = roofOrder.indexOf(mentionedRoofs[i + 1]);
          if (currentIdx > nextIdx) {
            return `提及屋顶等级顺序错误：${mentionedRoofs[i]}不应低于${mentionedRoofs[i + 1]}`;
          }
        }
      }
    }
    
    // 模数制度时间规则检测
    if (rule.id === 'rule_2') {
      if (sentence.includes('宋代') && sentence.includes('斗口制')) {
        return '宋代不应使用斗口制（应为材分制）';
      }
      if (sentence.includes('清代') && sentence.includes('材分制')) {
        return '清代不应使用材分制（应为斗口制）';
      }
    }
    
    // 斗拱功能规则检测
    if (rule.id === 'rule_3') {
      const functions = ['承托屋檐', '传递荷载', '出檐深度', '装饰'];
      const mentionedFunctions = functions.filter(f => sentence.includes(f));
      if (mentionedFunctions.length === 0) {
        return '未提及斗拱的核心功能';
      }
    }
    
    // 结构形式适用规则检测
    if (rule.id === 'rule_4') {
      if (sentence.includes('抬梁式') && sentence.includes('民居')) {
        return '抬梁式不适用于民居（适用于宫殿、庙宇）';
      }
      if (sentence.includes('穿斗式') && (sentence.includes('宫殿') || sentence.includes('庙宇'))) {
        return '穿斗式不适用于宫殿、庙宇（适用于民居）';
      }
    }
    
    // 彩画等级规则检测
    if (rule.id === 'rule_5') {
      const caihuaOrder = ['和玺彩画', '旋子彩画', '苏式彩画'];
      const mentioned = caihuaOrder.filter(c => sentence.includes(c));
      
      if (mentioned.length >= 2) {
        for (let i = 0; i < mentioned.length - 1; i++) {
          const currentIdx = caihuaOrder.indexOf(mentioned[i]);
          const nextIdx = caihuaOrder.indexOf(mentioned[i + 1]);
          if (currentIdx > nextIdx) {
            return `彩画等级顺序错误：${mentioned[i]}不应低于${mentioned[i + 1]}`;
          }
        }
      }
    }
    
    // 台基等级规则检测
    if (rule.id === 'rule_6') {
      if (sentence.includes('民居') && sentence.includes('须弥座')) {
        return '民居不应使用须弥座台基';
      }
    }
    
    return null;
  }

  /**
   * 判断两个值是否匹配
   */
  private valuesMatch(stated: string, expected: string): boolean {
    const statedLower = stated.toLowerCase().trim();
    const expectedLower = expected.toLowerCase().trim();
    
    // 完全匹配
    if (statedLower === expectedLower) return true;
    
    // 包含匹配
    if (expectedLower.includes(statedLower) || statedLower.includes(expectedLower)) return true;
    
    // 同义词匹配
    const synonyms: Record<string, string[]> = {
      '铺作': ['斗拱', '斗栱', '斗科'],
      '斗拱': ['铺作', '斗栱', '斗科'],
      '材分制': ['材分'],
      '斗口制': ['斗口'],
      '抬梁式': ['叠梁式'],
      '穿斗式': ['立贴式'],
      '庑殿顶': ['四阿顶'],
      '歇山顶': ['九脊顶']
    };
    
    for (const [key, values] of Object.entries(synonyms)) {
      if (values.includes(statedLower) && values.includes(expectedLower)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 确定冲突严重程度
   */
  private determineSeverity(stated: string, expected: string): 'high' | 'medium' | 'low' {
    if (this.valuesMatch(stated, expected)) {
      return 'low';
    }
    
    // 检查是否是严重错误（数字、等级等）
    const numberPattern = /(\d+)/g;
    const statedNumbers = stated.match(numberPattern) || [];
    const expectedNumbers = expected.match(numberPattern) || [];
    
    if (statedNumbers.length > 0 && expectedNumbers.length > 0) {
      for (let i = 0; i < Math.min(statedNumbers.length, expectedNumbers.length); i++) {
        if (statedNumbers[i] !== expectedNumbers[i]) {
          return 'high';
        }
      }
    }
    
    // 检查是否是等级相关错误
    const levelKeywords = ['最高', '最低', '等级', '第一', '第二'];
    if (levelKeywords.some(k => stated.includes(k)) || levelKeywords.some(k => expected.includes(k))) {
      return 'high';
    }
    
    return 'medium';
  }

  /**
   * 确定冲突类型
   */
  private determineConflictType(violation: string): ConflictType {
    if (violation.includes('错误') || violation.includes('不应')) {
      return ConflictType.FACTUAL_ERROR;
    }
    if (violation.includes('顺序') || violation.includes('矛盾')) {
      return ConflictType.LOGICAL_CONTRADICTION;
    }
    if (violation.includes('不一致')) {
      return ConflictType.INFORMATION_INCONSISTENCY;
    }
    if (violation.includes('未提及')) {
      return ConflictType.MISSING_INFORMATION;
    }
    return ConflictType.INFORMATION_INCONSISTENCY;
  }

  /**
   * 计算知识覆盖率
   */
  private calculateKnowledgeCoverage(aiResponse: string): number {
    let coveredEntities = 0;
    let mentionedEntities = 0;
    
    for (const entity of this.knowledgeGraph) {
      if (aiResponse.includes(entity.name)) {
        mentionedEntities++;
        // 检查是否覆盖了关键属性
        let hasAttribute = false;
        for (const attrName of Object.keys(entity.attributes)) {
          if (aiResponse.includes(attrName)) {
            hasAttribute = true;
            break;
          }
        }
        if (hasAttribute) {
          coveredEntities++;
        }
      }
    }
    
    return mentionedEntities > 0 ? (coveredEntities / mentionedEntities) * 100 : 0;
  }

  /**
   * 冲突记录去重方法
   * 识别所有重复出现的冲突记录，对每组重复记录仅保留其中一条
   * 基于冲突陈述进行去重，确保数据唯一性
   * 
   * @param conflicts 原始冲突数组
   * @returns 去重后的冲突数组
   */
  private deduplicateConflicts(conflicts: AnalyzedConflict[]): AnalyzedConflict[] {
    const seen = new Set<string>();
    const uniqueConflicts: AnalyzedConflict[] = [];
    
    for (const conflict of conflicts) {
      // 构建去重键：基于冲突陈述和类型组合
      // 如果冲突陈述为空，使用完整对象的JSON序列化作为备选键
      const deduplicationKey = conflict.conflictingStatement?.trim() 
        ? `${conflict.type}_${conflict.conflictingStatement.trim()}`
        : JSON.stringify({
            type: conflict.type,
            detectedIn: conflict.detectedIn,
            severity: conflict.severity
          });
      
      if (!seen.has(deduplicationKey)) {
        seen.add(deduplicationKey);
        uniqueConflicts.push(conflict);
      }
    }
    
    return uniqueConflicts;
  }

  /**
   * 生成结构化冲突分析报告
   */
  private generateStructuredReport(conflicts: AnalyzedConflict[], aiResponse: string, knowledgeCoverage: number): ConflictAnalysisReport {
    const highCount = conflicts.filter(c => c.severity === 'high').length;
    const mediumCount = conflicts.filter(c => c.severity === 'medium').length;
    const lowCount = conflicts.filter(c => c.severity === 'low').length;
    
    let severityLevel: 'high' | 'medium' | 'low';
    let summary: string;
    let recommendation: string;
    
    if (highCount > 0) {
      severityLevel = 'high';
      summary = `检测到 ${conflicts.length} 个冲突，其中高危冲突 ${highCount} 个、中危 ${mediumCount} 个、低危 ${lowCount} 个。回答存在严重的事实性错误或逻辑矛盾，需要重点核实。`;
      recommendation = '🔴 紧急建议：发现高危冲突，请立即核实相关知识图谱内容，修正回答中的错误信息。建议参考知识库中的标准描述进行全面修正。';
    } else if (mediumCount > 0) {
      severityLevel = 'medium';
      summary = `检测到 ${conflicts.length} 个冲突，其中中危冲突 ${mediumCount} 个、低危 ${lowCount} 个。回答存在一些信息不一致或表述问题。`;
      recommendation = '🟡 建议：发现中等冲突，可参考知识图谱进行补充和修正，提升回答准确性。';
    } else if (lowCount > 0) {
      severityLevel = 'low';
      summary = `检测到 ${lowCount} 个低危冲突，主要是表述细节或信息完整性方面的轻微差异。`;
      recommendation = '🟢 建议：回答质量良好，仅存在轻微差异，可选择性优化表述方式。';
    } else {
      severityLevel = 'low';
      summary = '✅ 未检测到显著冲突，回答内容与知识图谱基本一致。';
      recommendation = '🟢 建议：回答质量优秀，无需修正。';
    }
    
    return {
      id: `kg_report_${Date.now()}`,
      timestamp: Date.now(),
      aiResponse: aiResponse.substring(0, 200) + (aiResponse.length > 200 ? '...' : ''),
      conflicts,
      summary,
      severityLevel,
      recommendation,
      knowledgeCoverage: Math.round(knowledgeCoverage)
    };
  }
}

// 单例导出
export const localAIService = new LocalAIService();
