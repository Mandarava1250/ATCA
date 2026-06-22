/**
 * 华夏营造 - 冲突检测服务
 * 负责检测AI回答与知识库之间的冲突
 */

import { createLogger } from '../utils/logger';
import type { KnowledgeEntry } from './KnowledgeRetriever';

const logger = createLogger('ConflictDetector');

export enum ConflictType {
  FACTUAL_ERROR = '事实性错误',
  LOGICAL_CONTRADICTION = '逻辑矛盾',
  INFORMATION_INCONSISTENCY = '信息不一致',
  MISSING_INFORMATION = '信息缺失',
  AMBIGUOUS_STATEMENT = '表述模糊',
  OUTDATED_INFORMATION = '信息过时'
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

export interface ConflictReport {
  id: string;
  timestamp: number;
  conflicts: Conflict[];
  summary: string;
  recommendation: string;
}

export class ConflictDetector {
  private knowledgeBase: KnowledgeEntry[] = [];
  private initialized = false;

  initialize(knowledgeBase: KnowledgeEntry[]): void {
    this.knowledgeBase = knowledgeBase;
    this.initialized = true;
    logger.info('冲突检测服务初始化完成', { knowledgeCount: knowledgeBase.length });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 检测AI回答与知识库的冲突
   */
  async detectConflicts(aiResponse: string): Promise<ConflictReport> {
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