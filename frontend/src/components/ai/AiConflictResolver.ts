/**
 * 筑见山河 - AI冲突检测与解决模块
 * 在多AI讨论模式下检测回答冲突，提供置信度评估和综合结论
 */

/** AI回答记录 */
export interface AIResponse {
  aiId: string;
  aiName: string;
  content: string;
  timestamp: number;
}

/** 冲突类型 */
export type ConflictType = 'factual' | 'opinion' | 'temporal' | 'quantitative' | 'terminological' | 'none';

/** 冲突检测结果 */
export interface ConflictResult {
  hasConflict: boolean;                          // 是否存在冲突
  conflictType: ConflictType;                    // 冲突类型
  severity: 'high' | 'medium' | 'low' | 'none'; // 严重程度
  conflictingPairs: Array<{ ai1: string; ai2: string; reason: string; conflictType: ConflictType }>; // 冲突对及类型
  consensus: string;                             // 共识部分
  recommendedAnswer: string;                     // 推荐的综合答案
  confidenceScores: Record<string, number>;      // 各AI置信度评分
  factConsistency: number;                       // 事实一致性百分比
  detailedAnalysis: Array<{
    aiId: string;
    aiName: string;
    facts: string[];
    confidence: number;
    isReliable: boolean;
  }>;                                            // 详细分析
  resolutionSuggestion: string;                  // 解决建议
}

/** 冲突检测器 */
export class ConflictResolver {
  /**
   * 分析多个AI回答，检测冲突
   */
  static analyze(responses: AIResponse[]): ConflictResult {
    if (responses.length < 2) {
      return {
        hasConflict: false,
        conflictType: 'none',
        severity: 'none',
        conflictingPairs: [],
        consensus: responses[0]?.content || '',
        recommendedAnswer: responses[0]?.content || '',
        confidenceScores: responses[0] ? { [responses[0].aiId]: 0.8 } : {},
        factConsistency: 100,
        detailedAnalysis: responses[0] ? [{
          aiId: responses[0].aiId,
          aiName: responses[0].aiName,
          facts: this.extractFacts(responses[0].content),
          confidence: 0.8,
          isReliable: true,
        }] : [],
        resolutionSuggestion: '',
      };
    }

    // 提取关键事实陈述
    const extractedFacts = responses.map(r => ({
      ...r,
      facts: this.extractFacts(r.content),
      entities: this.extractEntities(r.content),
    }));

    // 检测冲突对
    const conflicts: Array<{ ai1: string; ai2: string; reason: string; conflictType: ConflictType }> = [];
    const confidenceScores: Record<string, number> = {};

    for (let i = 0; i < extractedFacts.length; i++) {
      for (let j = i + 1; j < extractedFacts.length; j++) {
        const a = extractedFacts[i];
        const b = extractedFacts[j];
        const overlap = this.factOverlap(a.facts, b.facts);

        // 检测时间冲突
        const temporalConflicts = this.detectTemporalConflicts(a.content, b.content);
        if (temporalConflicts.length > 0) {
          conflicts.push({
            ai1: a.aiName,
            ai2: b.aiName,
            reason: `时间冲突：${temporalConflicts.join('；')}`,
            conflictType: 'temporal',
          });
        }

        // 检测数值冲突
        const numberConflicts = this.detectNumberConflicts(a.content, b.content);
        if (numberConflicts.length > 0) {
          conflicts.push({
            ai1: a.aiName,
            ai2: b.aiName,
            reason: `数值差异：${numberConflicts.join('；')}`,
            conflictType: 'quantitative',
          });
        }

        // 检测术语冲突
        const termConflicts = this.detectTerminologyConflicts(a.content, b.content);
        if (termConflicts.length > 0) {
          conflicts.push({
            ai1: a.aiName,
            ai2: b.aiName,
            reason: `术语差异：${termConflicts.join('；')}`,
            conflictType: 'terminological',
          });
        }

        // 检测事实冲突
        if (overlap < 0.3 && a.facts.length > 2 && b.facts.length > 2) {
          conflicts.push({
            ai1: a.aiName,
            ai2: b.aiName,
            reason: `事实陈述差异较大（事实重叠度：${(overlap * 100).toFixed(0)}%）`,
            conflictType: 'factual',
          });
        }

        // 检测观点冲突
        const opinionDiff = this.detectOpinionConflicts(a.content, b.content);
        if (opinionDiff) {
          conflicts.push({
            ai1: a.aiName,
            ai2: b.aiName,
            reason: `观点差异：${opinionDiff}`,
            conflictType: 'opinion',
          });
        }
      }

      // 基于回答质量计算置信度
      confidenceScores[extractedFacts[i].aiId] = this.calculateConfidence(
        extractedFacts[i].content,
        extractedFacts[i].facts.length,
        extractedFacts[i].entities.length
      );
    }

    // 提取共识
    const consensus = this.extractConsensus(responses.map(r => r.content));

    // 计算事实一致性
    const factConsistency = this.calculateFactConsistency(extractedFacts);

    // 生成推荐答案
    const recommendedAnswer = this.synthesizeAnswer(responses, confidenceScores, conflicts);

    // 生成解决建议
    const resolutionSuggestion = this.generateResolutionSuggestion(conflicts, confidenceScores);

    const hasConflict = conflicts.length > 0;
    const severity = this.calculateSeverity(conflicts.length, responses.length, factConsistency);
    const conflictType = this.determineConflictType(conflicts);

    // 详细分析
    const detailedAnalysis = extractedFacts.map(e => ({
      aiId: e.aiId,
      aiName: e.aiName,
      facts: e.facts,
      confidence: confidenceScores[e.aiId] || 0.5,
      isReliable: (confidenceScores[e.aiId] || 0.5) >= 0.7,
    }));

    return {
      hasConflict,
      conflictType,
      severity,
      conflictingPairs: conflicts,
      consensus,
      recommendedAnswer,
      confidenceScores,
      factConsistency,
      detailedAnalysis,
      resolutionSuggestion,
    };
  }

  /** 提取事实（关键词、数字、专有名词） */
  private static extractFacts(text: string): string[] {
    const facts: string[] = [];

    // 提取数字+单位组合
    const numberMatches = text.match(/\d+(?:\.\d+)?\s*[米年号间层座项处个百分比尺寸分]/g);
    if (numberMatches) facts.push(...numberMatches);

    // 提取朝代名
    const dynastyMatches = text.match(/[唐宋元明清辽金夏]代|春秋|战国|秦汉|南北朝|隋唐|五代十国/g);
    if (dynastyMatches) facts.push(...dynastyMatches);

    // 提取建筑术语
    const termMatches = text.match(/(?:庑殿|歇山|悬山|硬山|攒尖|斗拱|抬梁|穿斗|榫卯|台基|月台|雀替|彩画|藻井)(?:顶|式|制)?/g);
    if (termMatches) facts.push(...termMatches);

    // 提取专有名词（书名号）
    const bookMatches = text.match(/《[^》]+》/g);
    if (bookMatches) facts.push(...bookMatches);

    // 提取建筑名称
    const buildingMatches = text.match(/[北京南京西安洛阳][\u4e00-\u9fa5]+[殿楼塔阁寺]/g);
    if (buildingMatches) facts.push(...buildingMatches);

    return [...new Set(facts)];
  }

  /** 提取实体 */
  private static extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    // 提取人名
    const personMatches = text.match(/(?:梁思成|林徽因|李诫|宇文恺|蒯祥)[，。、；]/g);
    if (personMatches) entities.push(...personMatches.map(p => p.trim().replace(/[，。、；]/g, '')));
    
    // 提取地名
    const placeMatches = text.match(/[山西陕西河南河北江苏浙江安徽福建广东四川云南贵州][\u4e00-\u9fa5]+[市县镇村]/g);
    if (placeMatches) entities.push(...placeMatches);
    
    return [...new Set(entities)];
  }

  /** 计算两组事实的重叠度 */
  private static factOverlap(factsA: string[], factsB: string[]): number {
    if (factsA.length === 0 || factsB.length === 0) return 0;
    const setB = new Set(factsB);
    const overlap = factsA.filter(f => setB.has(f)).length;
    return overlap / Math.max(factsA.length, factsB.length);
  }

  /** 检测时间冲突 */
  private static detectTemporalConflicts(textA: string, textB: string): string[] {
    const conflicts: string[] = [];

    // 提取四位年份
    const yearsA = textA.match(/(?:公元)?\d{3,4}\s*年/g) || [];
    const yearsB = textB.match(/(?:公元)?\d{3,4}\s*年/g) || [];

    for (const yA of yearsA) {
      for (const yB of yearsB) {
        const numA = parseInt(yA.replace(/[^\d]/g, ''));
        const numB = parseInt(yB.replace(/[^\d]/g, ''));
        if (Math.abs(numA - numB) > 50) {
          conflicts.push(`${yA.trim()} vs ${yB.trim()}`);
        }
      }
    }

    // 检测朝代冲突
    const dynastiesA = textA.match(/[唐宋元明清]代/g) || [];
    const dynastiesB = textB.match(/[唐宋元明清]代/g) || [];
    
    if (dynastiesA.length > 0 && dynastiesB.length > 0) {
      const uniqueA = new Set(dynastiesA);
      const uniqueB = new Set(dynastiesB);
      if (uniqueA.size !== uniqueB.size || ![...uniqueA].every(d => uniqueB.has(d))) {
        conflicts.push(`朝代描述不一致：${[...uniqueA].join('、')} vs ${[...uniqueB].join('、')}`);
      }
    }

    return conflicts;
  }

  /** 检测数值冲突 */
  private static detectNumberConflicts(textA: string, textB: string): string[] {
    const conflicts: string[] = [];

    // 提取年份
    const yearsA = textA.match(/(?:公元)?\d{3,4}\s*年/g) || [];
    const yearsB = textB.match(/(?:公元)?\d{3,4}\s*年/g) || [];

    for (const yA of yearsA) {
      for (const yB of yearsB) {
        const numA = parseInt(yA.replace(/[^\d]/g, ''));
        const numB = parseInt(yB.replace(/[^\d]/g, ''));
        if (Math.abs(numA - numB) > 0 && Math.abs(numA - numB) <= 50) {
          conflicts.push(`年份：${yA.trim()} vs ${yB.trim()}`);
        }
      }
    }

    // 提取尺寸数字
    const dimsA = textA.match(/\d+(?:\.\d+)?\s*[米丈尺寸]/g) || [];
    const dimsB = textB.match(/\d+(?:\.\d+)?\s*[米丈尺寸]/g) || [];

    for (const dA of dimsA) {
      for (const dB of dimsB) {
        const numA = parseFloat(dA);
        const numB = parseFloat(dB);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB && Math.abs(numA - numB) / Math.max(numA, numB) > 0.1) {
          conflicts.push(`尺寸：${dA} vs ${dB}`);
        }
      }
    }

    // 提取数量词
    const countsA = textA.match(/\d+\s*(?:间|层|座|根|个|项)/g) || [];
    const countsB = textB.match(/\d+\s*(?:间|层|座|根|个|项)/g) || [];

    for (const cA of countsA) {
      for (const cB of countsB) {
        const unitA = cA.match(/[间层座根个项]/)?.[0];
        const unitB = cB.match(/[间层座根个项]/)?.[0];
        if (unitA === unitB) {
          const numA = parseInt(cA);
          const numB = parseInt(cB);
          if (numA !== numB) {
            conflicts.push(`数量${unitA}：${numA} vs ${numB}`);
          }
        }
      }
    }

    return conflicts;
  }

  /** 检测术语冲突 */
  private static detectTerminologyConflicts(textA: string, textB: string): string[] {
    const conflicts: string[] = [];

    // 屋顶类型冲突
    const roofTypes = ['庑殿顶', '歇山顶', '悬山顶', '硬山顶', '攒尖顶', '庑殿', '歇山', '悬山', '硬山', '攒尖'];
    const foundA = roofTypes.filter(t => textA.includes(t));
    const foundB = roofTypes.filter(t => textB.includes(t));

    if (foundA.length > 0 && foundB.length > 0 && !foundA.some(t => foundB.includes(t))) {
      conflicts.push(`屋顶类型：${foundA.join('、')} vs ${foundB.join('、')}`);
    }

    // 结构类型冲突
    const structureTypes = ['抬梁式', '穿斗式', '井干式', '抬梁', '穿斗', '井干'];
    const structA = structureTypes.filter(t => textA.includes(t));
    const structB = structureTypes.filter(t => textB.includes(t));

    if (structA.length > 0 && structB.length > 0 && !structA.some(t => structB.includes(t))) {
      conflicts.push(`结构类型：${structA.join('、')} vs ${structB.join('、')}`);
    }

    // 模数制度冲突
    const moduleSystems = ['材分制', '斗口制', '材分', '斗口'];
    const modA = moduleSystems.filter(t => textA.includes(t));
    const modB = moduleSystems.filter(t => textB.includes(t));

    if (modA.length > 0 && modB.length > 0 && !modA.some(t => modB.includes(t))) {
      conflicts.push(`模数制度：${modA.join('、')} vs ${modB.join('、')}`);
    }

    return conflicts;
  }

  /** 检测观点冲突 */
  private static detectOpinionConflicts(textA: string, textB: string): string | null {
    const positiveWords = ['优秀', '精美', '宏伟', '独特', '重要', '杰出', '经典', '典范'];
    const negativeWords = ['简陋', '粗糙', '普通', '一般', '简单', '朴素'];

    const hasPositiveA = positiveWords.some(w => textA.includes(w));
    const hasNegativeA = negativeWords.some(w => textA.includes(w));
    const hasPositiveB = positiveWords.some(w => textB.includes(w));
    const hasNegativeB = negativeWords.some(w => textB.includes(w));

    // 观点极性相反
    if ((hasPositiveA && hasNegativeB) || (hasNegativeA && hasPositiveB)) {
      return '评价观点相反';
    }

    // 程度副词差异
    const degreeWordsA = textA.match(/(非常|极其|相当|比较|略微)/g) || [];
    const degreeWordsB = textB.match(/(非常|极其|相当|比较|略微)/g) || [];
    
    if (degreeWordsA.length > 0 && degreeWordsB.length > 0) {
      const strongWords = ['非常', '极其'];
      const weakWords = ['比较', '略微'];
      const hasStrongA = degreeWordsA.some(w => strongWords.includes(w));
      const hasWeakB = degreeWordsB.some(w => weakWords.includes(w));
      const hasWeakA = degreeWordsA.some(w => weakWords.includes(w));
      const hasStrongB = degreeWordsB.some(w => strongWords.includes(w));
      
      if ((hasStrongA && hasWeakB) || (hasWeakA && hasStrongB)) {
        return '评价程度不同';
      }
    }

    return null;
  }

  /** 判断是否为观点性回答 */
  private static isOpinionBased(text: string): boolean {
    const opinionPatterns = ['我认为', '可能', '也许', '我觉得', '据推测', '或许', '或曰', '一种观点认为', '应该', '建议', '可以'];
    return opinionPatterns.some(p => text.includes(p));
  }

  /** 计算回答置信度 */
  private static calculateConfidence(text: string, factCount: number, entityCount: number): number {
    let score = 0.5;
    // 事实越多越可信
    score += Math.min(factCount * 0.05, 0.2);
    // 实体越多越可信
    score += Math.min(entityCount * 0.03, 0.1);
    // 有引用来源加分
    if (/根据|依据|《.*》|来源|记载|参考文献/.test(text)) score += 0.15;
    // 有具体时间/数字加分
    if (/\d{3,4}年|\d+\.?\d*\s*[米丈尺]/.test(text)) score += 0.1;
    // 有专业术语加分
    if (/斗拱|榫卯|材分|斗口|庑殿|歇山/.test(text)) score += 0.05;
    // 观点性表述减分
    if (this.isOpinionBased(text)) score -= 0.05;
    // 回答长度适中加分
    const lengthScore = Math.min(text.length / 500, 0.1);
    score += lengthScore;
    return Math.min(Math.max(score, 0.1), 0.99);
  }

  /** 计算严重程度 */
  private static calculateSeverity(conflictCount: number, totalResponses: number, factConsistency: number): 'high' | 'medium' | 'low' | 'none' {
    if (conflictCount === 0) return 'none';
    
    const pairCount = (totalResponses * (totalResponses - 1)) / 2;
    const ratio = conflictCount / pairCount;
    
    // 考虑事实一致性
    if (factConsistency < 50) return 'high';
    if (ratio >= 0.6 || (ratio >= 0.4 && factConsistency < 70)) return 'high';
    if (ratio >= 0.3 || (ratio >= 0.2 && factConsistency < 80)) return 'medium';
    return 'low';
  }

  /** 计算事实一致性 */
  private static calculateFactConsistency(extractedFacts: Array<{ facts: string[] }>): number {
    if (extractedFacts.length < 2) return 100;
    
    let totalOverlap = 0;
    let pairCount = 0;
    
    for (let i = 0; i < extractedFacts.length; i++) {
      for (let j = i + 1; j < extractedFacts.length; j++) {
        totalOverlap += this.factOverlap(extractedFacts[i].facts, extractedFacts[j].facts);
        pairCount++;
      }
    }
    
    return pairCount > 0 ? Math.round((totalOverlap / pairCount) * 100) : 100;
  }

  /** 确定主要冲突类型 */
  private static determineConflictType(conflicts: Array<{ conflictType: ConflictType }>): ConflictType {
    if (conflicts.length === 0) return 'none';
    
    const typeCount: Record<ConflictType, number> = {
      factual: 0, opinion: 0, temporal: 0, quantitative: 0, terminological: 0, none: 0
    };
    
    conflicts.forEach(c => {
      typeCount[c.conflictType]++;
    });
    
    const maxType = Object.entries(typeCount).reduce((max, [type, count]) => 
      count > max.count ? { type: type as ConflictType, count } : max,
      { type: 'none' as ConflictType, count: 0 }
    );
    
    return maxType.type;
  }

  /** 生成解决建议 */
  private static generateResolutionSuggestion(conflicts: Array<{ conflictType: ConflictType }>, scores: Record<string, number>): string {
    if (conflicts.length === 0) return '';
    
    const typeCount: Record<ConflictType, number> = {
      factual: 0, opinion: 0, temporal: 0, quantitative: 0, terminological: 0, none: 0
    };
    
    conflicts.forEach(c => typeCount[c.conflictType]++);
    
    const suggestions: string[] = [];
    
    if (typeCount.temporal > 0) {
      suggestions.push('建议核对历史纪年资料以确认准确年代');
    }
    if (typeCount.quantitative > 0) {
      suggestions.push('建议查阅权威文献核实具体数据');
    }
    if (typeCount.terminological > 0) {
      suggestions.push('建议参考《营造法式》《工程做法》等典籍统一术语');
    }
    if (typeCount.factual > 0) {
      suggestions.push('建议结合实物遗存和考古报告验证事实');
    }
    if (typeCount.opinion > 0) {
      suggestions.push('观点差异属正常学术讨论，可综合参考');
    }
    
    // 置信度分析建议
    const scoreValues = Object.values(scores);
    if (scoreValues.length > 1) {
      const maxScore = Math.max(...scoreValues);
      const minScore = Math.min(...scoreValues);
      if (maxScore - minScore > 0.2) {
        suggestions.push(`置信度最高的AI回答（${(maxScore * 100).toFixed(0)}%）可信度更高`);
      }
    }
    
    return suggestions.join('；');
  }

  /** 提取共识部分 */
  private static extractConsensus(contents: string[]): string {
    if (contents.length === 0) return '';
    
    // 提取所有回答中都出现的关键词/短语
    const allFacts: string[][] = contents.map(c => this.extractFacts(c));
    const commonFacts = allFacts.reduce((common, facts) => 
      common.filter(f => facts.includes(f))
    );
    
    // 提取所有回答中都包含的句子片段
    const sentences = contents[0].split(/[。；!！?？\n]/).filter(s => s.trim().length > 10);
    const commonSentences = sentences.filter(s =>
      contents.every(c => c.includes(s.trim()) || c.includes(s.trim().slice(0, -2)))
    );
    
    const consensusParts: string[] = [];
    if (commonSentences.length > 0) {
      consensusParts.push(commonSentences.join('。') + '。');
    }
    if (commonFacts.length > 0) {
      consensusParts.push(`共同提及：${commonFacts.join('、')}`);
    }
    
    return consensusParts.length > 0 ? consensusParts.join(' ') : contents[0].slice(0, 100) + '...';
  }

  /** 综合多AI回答生成推荐答案 */
  private static synthesizeAnswer(responses: AIResponse[], scores: Record<string, number>, conflicts: Array<{ conflictType: ConflictType }>): string {
    // 选择置信度最高的回答作为基础
    const sorted = [...responses].sort((a, b) => (scores[b.aiId] || 0.5) - (scores[a.aiId] || 0.5));
    const best = sorted[0];

    if (responses.length === 1) return best.content;

    // 检查是否有严重冲突
    const hasHighSeverity = conflicts.some(c => ['temporal', 'quantitative', 'factual'].includes(c.conflictType));
    
    let synthesis = `【综合结论】\n\n${best.content}`;
    
    // 添加冲突警告
    if (hasHighSeverity) {
      synthesis += '\n\n⚠️ 注意：AI回答之间存在事实性差异，请谨慎参考。';
    }
    
    // 添加参考来源
    synthesis += '\n\n---\n\n【参考来源】';
    const references = responses.map(r => {
      const score = (scores[r.aiId] || 0.5) * 100;
      const reliability = score >= 70 ? '✅' : score >= 50 ? '⚠️' : '❌';
      return `${reliability} ${r.aiName}（置信度 ${score.toFixed(0)}%）`;
    }).join('\n');

    return synthesis + '\n' + references;
  }
}

/** 获取冲突类型中文描述 */
function getConflictTypeLabel(type: ConflictType): string {
  const labels: Record<ConflictType, string> = {
    factual: '事实性冲突',
    opinion: '观点性冲突',
    temporal: '时间冲突',
    quantitative: '数值冲突',
    terminological: '术语冲突',
    none: '无冲突',
  };
  return labels[type];
}

/** 格式化冲突结果为展示文本 */
export function formatConflictReport(result: ConflictResult): string {
  if (!result.hasConflict) {
    return '';
  }

  let report = `\n\n---\n\n`;
  
  // 标题和严重程度
  const severityLabel = result.severity === 'high' ? '严重' : result.severity === 'medium' ? '中等' : '轻微';
  const severityIcon = result.severity === 'high' ? '🔴' : result.severity === 'medium' ? '🟡' : '🟢';
  report += `${severityIcon} **多AI回答检测到${severityLabel}差异**\n\n`;

  // 冲突类型和事实一致性
  report += `**冲突类型**：${getConflictTypeLabel(result.conflictType)}\n`;
  report += `**严重程度**：${severityLabel}\n`;
  report += `**事实一致性**：${result.factConsistency}%\n\n`;

  // 具体冲突对
  if (result.conflictingPairs.length > 0) {
    report += `**具体差异（共${result.conflictingPairs.length}处）：**\n`;
    const typeGroups: Record<string, Array<{ ai1: string; ai2: string; reason: string }>> = {};
    
    result.conflictingPairs.forEach(pair => {
      const type = getConflictTypeLabel(pair.conflictType);
      if (!typeGroups[type]) typeGroups[type] = [];
      typeGroups[type].push({ ai1: pair.ai1, ai2: pair.ai2, reason: pair.reason });
    });
    
    Object.entries(typeGroups).forEach(([type, pairs]) => {
      report += `\n📌 ${type}：\n`;
      pairs.forEach(pair => {
        report += `  - ${pair.ai1} vs ${pair.ai2}：${pair.reason}\n`;
      });
    });
    report += '\n';
  }

  // 共识部分
  if (result.consensus) {
    report += `**共识内容**：\n${result.consensus}\n\n`;
  }

  // 各AI置信度分析
  if (Object.keys(result.confidenceScores).length > 0) {
    report += `**各AI置信度评估**：\n`;
    Object.entries(result.confidenceScores).forEach(([aiId, score]) => {
      const aiInfo = result.detailedAnalysis.find(d => d.aiId === aiId);
      const aiName = aiInfo?.aiName || aiId;
      const reliability = score >= 0.7 ? '✅ 可靠' : score >= 0.5 ? '⚠️ 中等' : '❌ 较低';
      report += `  - ${aiName}：${(score * 100).toFixed(0)}% ${reliability}\n`;
    });
    report += '\n';
  }

  // 解决建议
  if (result.resolutionSuggestion) {
    report += `**建议**：${result.resolutionSuggestion}\n\n`;
  }

  return report;
}
