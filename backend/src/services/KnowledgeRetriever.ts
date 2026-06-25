/**
 * 华夏营造 - 知识检索服务
 * 负责从知识库中检索相关知识条目
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('KnowledgeRetriever');

export interface KnowledgeEntry {
  id: number;
  topic: string;
  content: string;
  keywords: string[];
  source: string;
  confidence: number;
}

export interface RAGQueryResult {
  response: string;
  knowledge: KnowledgeEntry[];
  metadata: {
    model: string;
    reasoningTime: number;
    knowledgeUsed: number;
  };
}

export class KnowledgeRetriever {
  private knowledgeBase: KnowledgeEntry[] = [];
  private initialized = false;

  initialize(knowledgeBase: KnowledgeEntry[]): void {
    this.knowledgeBase = knowledgeBase;
    this.initialized = true;
    logger.info('知识检索服务初始化完成', { entryCount: knowledgeBase.length });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 执行RAG查询
   * @param text 用户输入
   * @returns 推理结果
   */
  async query(text: string): Promise<RAGQueryResult> {
    const startTime = Date.now();
    logger.info('开始RAG推理', { input: text.substring(0, 50) });

    const relevantKnowledge = this.retrieveKnowledge(text);
    logger.debug('检索到相关知识', { count: relevantKnowledge.length });

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
  retrieveKnowledge(query: string): KnowledgeEntry[] {
    const queryWords = this.tokenize(query);
    const scoredEntries: Array<{ entry: KnowledgeEntry; score: number }> = [];

    for (const entry of this.knowledgeBase) {
      let score = 0;

      for (const keyword of entry.keywords) {
        if (queryWords.some(q => keyword.toLowerCase().includes(q) || q.includes(keyword.toLowerCase()))) {
          score += 0.3;
        }
      }

      if (queryWords.some(q => entry.topic.toLowerCase().includes(q))) {
        score += 0.5;
      }

      const contentMatches = queryWords.filter(q => entry.content.toLowerCase().includes(q)).length;
      score += contentMatches * 0.1;

      if (score > 0) {
        scoredEntries.push({
          entry,
          score: Math.min(score * entry.confidence, 1)
        });
      }
    }

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
  tokenize(text: string): string[] {
    return text
      .replace(/[，。！？、；：""''（）《》【】]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  getStats(): { knowledgeCount: number; topics: string[] } {
    return {
      knowledgeCount: this.knowledgeBase.length,
      topics: this.knowledgeBase.map(e => e.topic)
    };
  }
}