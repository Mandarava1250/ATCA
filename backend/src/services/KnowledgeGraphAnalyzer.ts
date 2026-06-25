/**
 * 华夏营造 - 知识图谱分析服务
 * 负责基于知识图谱进行系统性冲突分析
 */

import { createLogger, AIReasoningStep } from '../utils/logger';
import { ConflictType } from './ConflictDetector';

const logger = createLogger('KnowledgeGraphAnalyzer');

export interface KnowledgeEntity {
  id: string;
  name: string;
  type: string;
  attributes: Record<string, string>;
  relations: Relation[];
}

export interface Relation {
  targetId: string;
  targetName: string;
  type: string;
  confidence: number;
}

export interface DomainRule {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  consequences: string[];
  severity: 'high' | 'medium' | 'low';
}

export interface KnowledgeReference {
  type: 'entity' | 'relation' | 'rule' | 'entry';
  id: string;
  name: string;
  content: string;
  source: string;
}

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

export class KnowledgeGraphAnalyzer {
  private knowledgeGraph: KnowledgeEntity[] = [];
  private domainRules: DomainRule[] = [];
  private entityNameIndex: Map<string, KnowledgeEntity> = new Map();
  private initialized = false;

  initialize(knowledgeGraph: KnowledgeEntity[], domainRules: DomainRule[]): void {
    this.knowledgeGraph = knowledgeGraph;
    this.domainRules = domainRules;
    this.buildEntityNameIndex();
    this.initialized = true;
    logger.info('知识图谱分析服务初始化完成', {
      entityCount: knowledgeGraph.length,
      ruleCount: domainRules.length
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 基于知识图谱的系统性冲突分析
   */
  async analyzeWithKnowledgeGraph(aiResponse: string): Promise<ConflictAnalysisReport> {
    const startTime = Date.now();
    logger.aiReasoning(AIReasoningStep.KNOWLEDGE_RETRIEVAL, '知识图谱分析-开始', {
      input: aiResponse.substring(0, 50),
      decision: '开始基于知识图谱的系统性分析'
    });

    const conflicts: AnalyzedConflict[] = [];
    const sentences = this.splitSentences(aiResponse);

    logger.aiReasoning(AIReasoningStep.DEVIATION_ANALYSIS, '知识图谱分析-实体检测', {
      input: `${sentences.length}个句子`,
      decision: '开始实体属性检测'
    });

    for (const sentence of sentences) {
      if (sentence.length < 10) continue;

      const entityConflicts = this.detectEntityConflicts(sentence);
      conflicts.push(...entityConflicts);

      const relationConflicts = this.detectRelationConflicts(sentence);
      conflicts.push(...relationConflicts);

      const ruleConflicts = this.detectRuleViolations(sentence);
      conflicts.push(...ruleConflicts);
    }

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

    const knowledgeCoverage = this.calculateKnowledgeCoverage(aiResponse);

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

  private buildEntityNameIndex(): void {
    this.entityNameIndex.clear();
    for (const entity of this.knowledgeGraph) {
      this.entityNameIndex.set(entity.name.toLowerCase(), entity);
    }
  }

  private splitSentences(text: string): string[] {
    return text.split(/[。！？；\n]/).filter(s => s.trim().length > 10);
  }

  private detectEntityConflicts(sentence: string): AnalyzedConflict[] {
    const conflicts: AnalyzedConflict[] = [];

    for (const entity of this.knowledgeGraph) {
      if (sentence.includes(entity.name)) {
        for (const [attrName, attrValue] of Object.entries(entity.attributes)) {
          const attrPattern = new RegExp(`${entity.name}[的是]?${attrName}[：:]?\\s*([^。！？；]+)`, 'i');
          const match = sentence.match(attrPattern);

          if (match) {
            const statedValue = match[1].trim();
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

  private detectRelationConflicts(sentence: string): AnalyzedConflict[] {
    const conflicts: AnalyzedConflict[] = [];

    const entitiesInSentence: KnowledgeEntity[] = [];
    const sentenceLower = sentence.toLowerCase();

    for (const [nameLower, entity] of this.entityNameIndex) {
      if (sentenceLower.includes(nameLower)) {
        entitiesInSentence.push(entity);
      }
    }

    for (const entity of entitiesInSentence) {
      for (const relation of entity.relations) {
        if (!sentenceLower.includes(relation.targetName.toLowerCase())) {
          continue;
        }

        const relationPattern = new RegExp(`${entity.name}[与和]${relation.targetName}[的是]?(\\S+关系)?`, 'i');
        const match = sentence.match(relationPattern);

        if (match) {
          const statedRelation = match[1] || '关联';
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

  private detectRuleViolations(sentence: string): AnalyzedConflict[] {
    const conflicts: AnalyzedConflict[] = [];

    for (const rule of this.domainRules) {
      for (const condition of rule.conditions) {
        if (sentence.includes(condition)) {
          let violated = false;
          for (const consequence of rule.consequences) {
            if (!sentence.includes(consequence)) {
              violated = true;
              break;
            }
          }

          if (violated) {
            conflicts.push({
              id: `rule_conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: ConflictType.LOGICAL_CONTRADICTION,
              severity: rule.severity,
              detectedIn: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
              conflictingStatement: `句子内容与领域规则"${rule.name}"不一致`,
              knowledgeReference: {
                type: 'rule',
                id: rule.id,
                name: rule.name,
                content: rule.description,
                source: '华夏营造领域规则库'
              },
              analysis: `检测到领域规则违反：句子满足条件"${rule.conditions.join('; ')}"但未满足预期结果"${rule.consequences.join('; ')}"`,
              correctionSuggestion: `建议参考领域规则"${rule.name}"进行修正`,
              confidence: 0.9
            });
          }
        }
      }
    }

    return conflicts;
  }

  private valuesMatch(stated: string, expected: string): boolean {
    const statedLower = stated.toLowerCase().trim();
    const expectedLower = expected.toLowerCase().trim();
    return statedLower === expectedLower ||
           statedLower.includes(expectedLower) ||
           expectedLower.includes(statedLower);
  }

  private determineSeverity(stated: string, expected: string): 'high' | 'medium' | 'low' {
    const statedLower = stated.toLowerCase().trim();
    const expectedLower = expected.toLowerCase().trim();
    
    if (statedLower === expectedLower) return 'low';
    if (statedLower.includes(expectedLower) || expectedLower.includes(statedLower)) return 'medium';
    return 'high';
  }

  private deduplicateConflicts(conflicts: AnalyzedConflict[]): AnalyzedConflict[] {
    const seen = new Set<string>();
    return conflicts.filter(conflict => {
      const key = `${conflict.type}_${conflict.detectedIn}_${conflict.knowledgeReference.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private calculateKnowledgeCoverage(text: string): number {
    let entityMatches = 0;
    const textLower = text.toLowerCase();
    
    for (const entity of this.knowledgeGraph) {
      if (textLower.includes(entity.name.toLowerCase())) {
        entityMatches++;
      }
    }

    return this.knowledgeGraph.length > 0 
      ? entityMatches / this.knowledgeGraph.length 
      : 0;
  }

  private generateStructuredReport(conflicts: AnalyzedConflict[], aiResponse: string, knowledgeCoverage: number): ConflictAnalysisReport {
    const highCount = conflicts.filter(c => c.severity === 'high').length;
    const mediumCount = conflicts.filter(c => c.severity === 'medium').length;

    let severityLevel: 'high' | 'medium' | 'low';
    if (highCount > 0) {
      severityLevel = 'high';
    } else if (mediumCount > 0) {
      severityLevel = 'medium';
    } else {
      severityLevel = 'low';
    }

    let summary = '';
    if (conflicts.length === 0) {
      summary = '✅ 未检测到显著冲突，回答内容与知识图谱一致';
    } else {
      summary = `检测到 ${conflicts.length} 个冲突（高危 ${highCount} 个，中危 ${mediumCount} 个，低危 ${conflicts.length - highCount - mediumCount} 个）`;
    }

    let recommendation = '';
    if (severityLevel === 'high') {
      recommendation = '🔴 建议：发现高危冲突，请立即核实相关知识图谱内容';
    } else if (severityLevel === 'medium') {
      recommendation = '🟡 建议：发现中等冲突，建议参考知识图谱进行修正';
    } else {
      recommendation = '🟢 建议：分析完成，回答与知识图谱基本一致';
    }

    return {
      id: `kg_report_${Date.now()}`,
      timestamp: Date.now(),
      aiResponse,
      conflicts,
      summary,
      severityLevel,
      recommendation,
      knowledgeCoverage
    };
  }

  getStats(): { graphEntityCount: number; ruleCount: number } {
    return {
      graphEntityCount: this.knowledgeGraph.length,
      ruleCount: this.domainRules.length
    };
  }
}