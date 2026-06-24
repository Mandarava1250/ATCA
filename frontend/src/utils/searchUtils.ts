/**
 * 华夏营造 - 搜索工具模块
 * 提供智能搜索匹配功能，支持朝代名称的模糊匹配
 */

/**
 * 朝代名称映射表 - 支持单字到多字朝代名称的智能匹配
 */
export const dynastyNameMap: Record<string, string[]> = {
  '夏': ['夏', '夏朝', '夏代', '夏王朝'],
  '商': ['商', '商朝', '商代', '商王朝'],
  '周': ['周', '周朝', '周代', '西周', '东周', '周王朝'],
  '秦': ['秦', '秦朝', '秦代', '秦王朝'],
  '汉': ['汉', '汉朝', '汉代', '西汉', '东汉', '汉王朝'],
  '三国': ['三国', '三国时期', '三国时代'],
  '晋': ['晋', '晋朝', '晋代', '西晋', '东晋', '晋王朝'],
  '南北朝': ['南北朝', '南北朝时期', '南北时代'],
  '隋': ['隋', '隋朝', '隋代', '隋王朝'],
  '唐': ['唐', '唐朝', '唐代', '大唐', '唐王朝'],
  '宋': ['宋', '宋朝', '宋代', '北宋', '南宋', '大宋', '宋王朝'],
  '元': ['元', '元朝', '元代', '大元', '元王朝'],
  '明': ['明', '明朝', '明代', '大明', '明王朝'],
  '清': ['清', '清朝', '清代', '大清', '清王朝'],
  '民国': ['民国', '中华民国', '民国时期'],
  '现代': ['现代', '当代', '近现代'],
};

/**
 * 获取所有朝代名称的扁平列表
 */
export function getAllDynastyNames(): string[] {
  return Array.from(new Set(Object.values(dynastyNameMap).flat()));
}

/**
 * 获取朝代的所有别名
 * @param dynasty 朝代名称（可以是单字或多字）
 * @returns 该朝代的所有别名列表
 */
export function getDynastyAliases(dynasty: string): string[] {
  const lowerDynasty = dynasty.toLowerCase();
  
  // 直接查找映射表的键
  for (const [key, aliases] of Object.entries(dynastyNameMap)) {
    if (key.toLowerCase() === lowerDynasty) {
      return [...aliases];
    }
  }
  
  // 查找映射表的值
  for (const aliases of Object.values(dynastyNameMap)) {
    if (aliases.some(a => a.toLowerCase() === lowerDynasty)) {
      return [...aliases];
    }
  }
  
  // 如果找不到，返回原字符串
  return [dynasty];
}

/**
 * 搜索高亮函数 - 高亮显示匹配的关键词
 * @param text 原始文本
 * @param query 搜索关键词
 * @returns 带有高亮标记的文本
 */
export function highlightSearchTerm(text: string, query: string): string {
  if (!text || !query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * 综合搜索匹配函数 - 支持部分匹配和完整匹配
 * @param text 目标文本
 * @param query 搜索关键词
 * @returns 匹配分数（0-100）
 */
export function matchSearchTerm(text: string, query: string): number {
  if (!text || !query) return 0;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // 完全匹配：最高优先级
  if (lowerText === lowerQuery) return 100;
  
  // 前缀匹配：高优先级
  if (lowerText.startsWith(lowerQuery)) return 80;
  
  // 后缀匹配
  if (lowerText.endsWith(lowerQuery)) return 70;
  
  // 完整单词匹配（被空格或标点包围）
  const wordBoundary = new RegExp(`(^|\\s|\\p{Punctuation})${lowerQuery}($|\\s|\\p{Punctuation})`, 'gu');
  if (wordBoundary.test(lowerText)) return 60;
  
  // 包含匹配：中优先级
  if (lowerText.includes(lowerQuery)) return 40;
  
  // 首字匹配（中文词汇）- 支持顺序匹配
  const chars = [...lowerText];
  const queryChars = [...lowerQuery];
  if (chars.length > 0 && queryChars.length > 0) {
    let matchCount = 0;
    let textIndex = 0;
    for (const qChar of queryChars) {
      const foundIndex = chars.indexOf(qChar, textIndex);
      if (foundIndex !== -1) {
        matchCount++;
        textIndex = foundIndex + 1;
      }
    }
    // 根据匹配字符比例评分
    if (matchCount > 0) {
      return Math.round((matchCount / queryChars.length) * 30);
    }
  }
  
  return 0;
}

/**
 * 朝代匹配函数 - 支持单字、多字朝代名称和别名的智能匹配
 * 当用户输入单个汉字（如"明"）时，能够匹配完整朝代名称（如"明朝"、"明代"等）
 * 
 * @param dynasty 朝代名称
 * @param query 搜索关键词
 * @returns 匹配分数（0-100）
 */
export function matchDynasty(dynasty: string, query: string): number {
  if (!dynasty || !query) return 0;
  
  const lowerDynasty = dynasty.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // 直接匹配检查
  if (lowerDynasty === lowerQuery) return 100;
  if (lowerDynasty.startsWith(lowerQuery)) return 85;
  if (lowerDynasty.includes(lowerQuery)) return 50;
  if (lowerQuery.includes(lowerDynasty)) return 40;
  
  // 检查映射表中的别名 - 核心智能匹配逻辑
  for (const aliases of Object.values(dynastyNameMap)) {
    const lowerAliases = aliases.map(a => a.toLowerCase());
    
    // 如果朝代在当前组中
    if (lowerAliases.includes(lowerDynasty)) {
      // 检查查询词是否匹配组中的任何别名
      for (const alias of lowerAliases) {
        if (alias === lowerQuery) return 95;          // 完全匹配别名
        if (alias.startsWith(lowerQuery)) return 80;   // 前缀匹配别名
        if (alias.includes(lowerQuery)) return 45;     // 包含匹配别名
        if (lowerQuery.includes(alias)) return 35;     // 查询词包含别名
      }
    }
    
    // 检查查询词是否与任何别名相关
    for (const alias of lowerAliases) {
      if (alias.includes(lowerQuery) || lowerQuery.includes(alias)) {
        // 如果朝代与查询词相关，给予匹配分数
        if (lowerDynasty.length > 0) {
          return 20;
        }
      }
    }
  }
  
  return 0;
}

/**
 * 根据关键词搜索朝代名称
 * @param query 搜索关键词
 * @returns 匹配的朝代名称列表
 */
export function searchDynasties(query: string): string[] {
  if (!query || query.trim() === '') {
    return getAllDynastyNames();
  }
  
  const lowerQuery = query.toLowerCase().trim();
  const results: Set<string> = new Set();
  
  // 遍历所有朝代别名
  for (const aliases of Object.values(dynastyNameMap)) {
    for (const alias of aliases) {
      const lowerAlias = alias.toLowerCase();
      
      // 完全匹配
      if (lowerAlias === lowerQuery) {
        results.add(alias);
        continue;
      }
      
      // 前缀匹配
      if (lowerAlias.startsWith(lowerQuery)) {
        results.add(alias);
        continue;
      }
      
      // 包含匹配
      if (lowerAlias.includes(lowerQuery)) {
        results.add(alias);
        continue;
      }
      
      // 单字匹配（当查询词是单个汉字时）
      if (query.length === 1 && lowerAlias.includes(lowerQuery)) {
        results.add(alias);
        continue;
      }
    }
  }
  
  return Array.from(results).sort();
}

/**
 * 综合搜索函数 - 对多个字段进行搜索并计算综合得分
 * @param item 目标对象
 * @param query 搜索关键词
 * @param fields 需要搜索的字段配置
 * @returns 综合匹配分数
 */
export interface SearchFieldConfig {
  field: string;
  weight: number;
  type?: 'text' | 'dynasty';
}

export function searchMatch(
  item: Record<string, any>,
  query: string,
  fields: SearchFieldConfig[]
): number {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const config of fields) {
    const value = item[config.field];
    if (!value) continue;
    
    let score = 0;
    if (config.type === 'dynasty') {
      score = matchDynasty(String(value), query);
    } else {
      score = matchSearchTerm(String(value), query);
    }
    
    totalScore += score * config.weight;
    totalWeight += config.weight;
  }
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * 搜索并排序函数
 * @param items 待搜索的列表
 * @param query 搜索关键词
 * @param fields 搜索字段配置
 * @returns 排序后的结果列表
 */
export function searchAndSort<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: SearchFieldConfig[]
): T[] {
  if (!query || query.trim() === '') {
    return [...items];
  }
  
  const scored = items.map(item => ({
    item,
    score: searchMatch(item, query, fields)
  }));
  
  // 过滤掉分数为0的结果，并按分数降序排序
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);
}