/**
 * 华夏营造 - 增强检查模块
 * 用于AI回答的增强验证和质量评估
 */

import { knowledgeGraph } from './AiKnowledgeGraph';
import type { KnowledgeEntry } from './AiKnowledgeGraph';

/** 检查结果 */
export interface CheckResult {
  passed: boolean;
  relevance: number;
  suggestions: string[];
  matchedKnowledge: KnowledgeEntry[];
}

// 在模块加载时初始化知识图谱一次，避免每次查询重复初始化
let knowledgeGraphInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function ensureKnowledgeGraphInitialized(): Promise<void> {
  // 使用Promise避免竞态条件：如果已有初始化正在进行，直接返回同一个Promise
  if (initializationPromise) return initializationPromise;
  
  initializationPromise = (async () => {
    if (!knowledgeGraphInitialized) {
      try {
        await knowledgeGraph.initialize();
        knowledgeGraphInitialized = true;
      } catch {
        // 初始化失败，后续查询会返回空数组
      }
    }
  })();
  
  return initializationPromise;
}

/** 增强检查器 */
class EnhancedChecker {
  /**
   * 检查AI回答的质量和相关性
   */
  async checkResponse(answer: string, question: string): Promise<CheckResult> {
    const suggestions: string[] = [];
    let relevance = 0.8;
    
    // 查询相关知识库
    const matchedKnowledge = await this.queryKnowledge(question);
    
    if (matchedKnowledge.length > 0) {
      // 计算相关性分数
      let totalScore = 0;
      for (const entry of matchedKnowledge) {
        // 使用 confidence 而不是 score，因为 KnowledgeEntry 没有 score 属性
        totalScore += entry.confidence;
      }
      relevance = totalScore / matchedKnowledge.length;
      
      // 检查置信度
      const lowConfidence = matchedKnowledge.filter(k => k.confidence < 0.7);
      if (lowConfidence.length > 0) {
        suggestions.push(`检测到 ${lowConfidence.length} 条低置信度知识，建议核实`);
      }
    } else {
      suggestions.push('未找到相关知识库条目，建议人工审核');
    }
    
    // 检查回答长度
    if (answer.length < 50) {
      suggestions.push('回答内容较短，建议补充详细信息');
    }
    
    // 检查关键术语
    const keyTerms = ['斗拱', '榫卯', '庑殿', '歇山', '抬梁', '穿斗'];
    const foundTerms = keyTerms.filter(term => answer.includes(term));
    if (foundTerms.length === 0) {
      suggestions.push('回答中未包含建筑专业术语，建议增加专业性');
    }
    
    return {
      passed: relevance >= 0.6,
      relevance,
      suggestions,
      matchedKnowledge
    };
  }
  
  /**
   * 查询相关知识库
   */
  private async queryKnowledge(question: string): Promise<KnowledgeEntry[]> {
    try {
      // 确保知识图谱已初始化（幂等性检查，只初始化一次）
      await ensureKnowledgeGraphInitialized();
      return knowledgeGraph.query(question, 5);
    } catch {
      return [];
    }
  }
  
  /**
   * 验证知识条目
   */
  validateKnowledge(entry: KnowledgeEntry): boolean {
    return entry.confidence >= 0.8 && entry.verified;
  }
}

// 单例
export const enhancedChecker = new EnhancedChecker();

// Vue集成
import { ref } from 'vue';

export function useEnhancedCheck() {
  const isChecking = ref(false);
  const lastResult = ref<CheckResult | null>(null);
  const error = ref<string | null>(null);
  
  async function check(answer: string, question: string): Promise<CheckResult | null> {
    isChecking.value = true;
    error.value = null;
    
    try {
      const result = await enhancedChecker.checkResponse(answer, question);
      lastResult.value = result;
      return result;
    } catch (e: any) {
      error.value = e.message;
      return null;
    } finally {
      isChecking.value = false;
    }
  }
  
  return {
    isChecking,
    lastResult,
    error,
    check
  };
}
