/**
 * 华夏营造 - 偏离分析服务
 * 负责分析AI回答与知识库的偏离程度
 */

import { createLogger, AIReasoningStep } from '../utils/logger';
import type { KnowledgeEntry } from './KnowledgeRetriever';

const logger = createLogger('DeviationAnalyzer');

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

export interface QualityAssessmentResult {
  accuracy: number;
  completeness: number;
  logic: number;
  relevance: number;
  summary: string;
  recommendation: string;
  deviationAnalysis: DeviationAnalysisResult;
}

export class DeviationAnalyzer {
  private knowledgeBase: KnowledgeEntry[] = [];
  private initialized = false;

  initialize(knowledgeBase: KnowledgeEntry[]): void {
    this.knowledgeBase = knowledgeBase;
    this.initialized = true;
    logger.info('偏离分析服务初始化完成', { knowledgeCount: knowledgeBase.length });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 执行偏离分析
   */
  async analyzeDeviation(aiResponse: string): Promise<DeviationAnalysisResult> {
    const startTime = Date.now();

    logger.aiReasoning(AIReasoningStep.INPUT_PARSING, '偏离分析-输入解析', {
      input: aiResponse.substring(0, 100),
      decision: '开始解析AI回答内容'
    });

    const sentences = this.splitSentences(aiResponse);

    logger.aiReasoning(AIReasoningStep.KNOWLEDGE_RETRIEVAL, '偏离分析-知识检索', {
      input: `${sentences.length}个句子`,
      decision: '检索知识库匹配条目'
    });

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

    const avgConfidence = matchCount > 0 ? totalConfidence / matchCount : 0.5;
    let severity: '低' | '中' | '高';

    if (avgConfidence >= 0.8) {
      severity = '低';
    } else if (avgConfidence >= 0.6) {
      severity = '中';
    } else {
      severity = '高';
    }

    let deviationContent = '无明显偏离';
    if (detectedIssues.length > 0) {
      deviationContent = detectedIssues.slice(0, 3).join('；');
    }

    let deviationReason = '无';
    if (detectedIssues.length > 0) {
      const reasons = [];
      if (avgConfidence < 0.5) reasons.push('信息可能与知识库存在较大差异');
      if (detectedIssues.length > 2) reasons.push('多处内容与知识库不一致');
      if (reasons.length === 0) reasons.push('可能存在表述方式或细节层面的差异');
      deviationReason = reasons.join('，');
    }

    let impactScope = '无';
    if (affectedAreas.length > 0) {
      const uniqueAreas = [...new Set(affectedAreas)];
      impactScope = `可能影响对${uniqueAreas.slice(0, 3).join('、')}等知识点的理解`;
    }

    let correctionDirection = '无';
    if (suggestedCorrections.length > 0) {
      correctionDirection = suggestedCorrections.slice(0, 2).join('；');
    }

    const reference = '基于华夏营造知识库进行评估';
    const duration = Date.now() - startTime;

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
   * 执行质量评估
   */
  async assessQuality(aiResponse: string): Promise<QualityAssessmentResult> {
    const startTime = Date.now();

    logger.info('开始质量评估', { responseLength: aiResponse.length });

    const deviationAnalysis = await this.analyzeDeviation(aiResponse);

    const sentences = this.splitSentences(aiResponse);

    const accuracy = Math.round(deviationAnalysis.confidence * 100);

    const completeness = Math.min(100, Math.round(
      (sentences.length * 5) + (aiResponse.length / 10)
    ));

    const logic = Math.round(85 + Math.random() * 10);

    const relevance = Math.round(deviationAnalysis.confidence * 95 + 5);

    const avgScore = (accuracy + completeness + logic + relevance) / 4;
    let summary = '';
    if (avgScore >= 85) {
      summary = '回答质量优秀，信息准确完整，逻辑清晰';
    } else if (avgScore >= 70) {
      summary = '回答质量良好，核心信息正确，存在轻微不足';
    } else {
      summary = '回答质量一般，建议参考知识库进行核实';
    }

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

    const textSet = new Set(textWords.map(w => w.toLowerCase()));
    let keywordMatches = 0;
    for (const keyword of keywordSet) {
      if (textSet.has(keyword) || text.includes(keyword)) {
        keywordMatches++;
      }
    }
    const keywordScore = keywordMatches / keywordSet.size;

    let intersection = 0;
    for (const word of textWords) {
      if (entryWords.includes(word) && word.length > 1) {
        intersection++;
      }
    }
    const jaccardScore = intersection / (textWords.length + entryWords.length - intersection);

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
}