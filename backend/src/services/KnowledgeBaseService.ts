/**
 * 筑见山河 - 知识库服务
 * 管理古建筑知识库数据
 * 实现 IService 接口以纳入统一服务注册体系
 */

import { query as dbQuery, execute } from '../config/database';
import { createLogger } from '../utils/logger';
import { IService, ServiceState } from '../core';

const logger = createLogger('KnowledgeBase');

// 知识条目接口
export interface KnowledgeTopic {
  topic_id?: number;
  topic_key: string;
  topic_name: string;
  category: string;
  content: string;
  content_en?: string;
  source?: string;
  confidence: number;
  verified: boolean;
  keywords?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 默认知识库内容
const DEFAULT_KNOWLEDGE: Omit<KnowledgeTopic, 'topic_id' | 'created_at' | 'updated_at'>[] = [
  {
    topic_key: 'tailiang',
    topic_name: '抬梁式结构',
    category: '木结构',
    content: '抬梁式（叠梁式）是中国古建筑最主要的木结构形式。特点：柱上承梁，梁上抬梁，逐层缩短，最上层立脊瓜柱承脊檩。适用于宫殿、庙宇等大型建筑。代表：北京故宫太和殿。',
    content_en: 'Tailiang-style is the most important wooden structure form in traditional Chinese architecture.',
    source: '筑见山河知识库',
    confidence: 0.98,
    verified: true,
    keywords: '抬梁,抬梁式,叠梁,梁柱,梁架,tailiang,beam'
  },
  {
    topic_key: 'chuandou',
    topic_name: '穿斗式结构',
    category: '木结构',
    content: '穿斗式（立贴式）是南方常见木结构形式。特点：柱距较密，柱头直接承檩，以穿枋连接各柱形成框架。用料省、整体性强，适用于民居等中小型建筑。',
    content_en: 'Chuandou-style is a common wooden structure form in southern China.',
    source: '筑见山河知识库',
    confidence: 0.98,
    verified: true,
    keywords: '穿斗,穿斗式,穿枋,立贴,chuandou'
  },
  {
    topic_key: 'wudian',
    topic_name: '庑殿顶',
    category: '屋顶形制',
    content: '庑殿顶（四阿顶）是中国古建筑最高等级的屋顶形制，有一条正脊和四条垂脊，四面斜坡。用于皇宫、庙宇主殿。重檐庑殿顶为最高等级，如太和殿。',
    content_en: 'Hipped roof (Wudian) is the highest-ranking roof form in traditional Chinese architecture.',
    source: '筑见山河知识库',
    confidence: 0.99,
    verified: true,
    keywords: '庑殿,庑殿顶,四阿顶,五脊顶,hipped,wudian'
  },
  {
    topic_key: 'xieshan',
    topic_name: '歇山顶',
    category: '屋顶形制',
    content: '歇山顶（九脊顶）等级仅次于庑殿顶，由正脊、垂脊、戗脊组成，上半部为悬山或硬山式，下半部为四面坡。常用于宫殿次要建筑和庙宇。',
    content_en: 'Gable-and-hipped roof is second only to the hipped roof in rank.',
    source: '筑见山河知识库',
    confidence: 0.98,
    verified: true,
    keywords: '歇山,歇山顶,九脊顶,xieshan,gable'
  },
  {
    topic_key: 'dougong',
    topic_name: '斗拱',
    category: '构件',
    content: '斗拱是中国古建筑特有的结构构件，位于柱头与梁架之间，由斗、拱、昂等构件组成。功能：承托屋檐重量、传递荷载、增加出檐深度。清代称"斗科"。斗口为模数单位。',
    content_en: 'Dougong are unique structural components in traditional Chinese architecture.',
    source: '筑见山河知识库',
    confidence: 0.99,
    verified: true,
    keywords: '斗拱,铺作,斗栱,斗科,栌斗,华拱,昂,斗口,dougong,bracket'
  },
  {
    topic_key: 'sunmao',
    topic_name: '榫卯结构',
    category: '连接方式',
    content: '榫卯是中国古代木构件的连接方式，通过凹凸结合实现连接，不用一钉一铆。类型包括燕尾榫、槽口榫、粽角榫等。体现以柔克刚的营造智慧。',
    content_en: 'Sunmao are traditional Chinese wooden joinery techniques.',
    source: '筑见山河知识库',
    confidence: 0.97,
    verified: true,
    keywords: '榫卯,榫头,卯眼,凹凸结合,燕尾榫,槽口榫,sunmao,mortise'
  },
  {
    topic_key: 'caifen',
    topic_name: '材分制',
    category: '模数制度',
    content: '材分制是宋《营造法式》确立的模数制度。"材"为基本模数，按拱高分为八等。所有构件尺寸均以材的倍数确定，实现了标准化设计与施工。',
    content_en: 'Cai Fen System is the modular system established in Song Dynasty.',
    source: '筑见山河知识库',
    confidence: 0.98,
    verified: true,
    keywords: '材,材分制,材分,宋式,营造法式,cai fen,song style'
  },
  {
    topic_key: 'doukou',
    topic_name: '斗口制',
    category: '模数制度',
    content: '斗口制是清《工程做法》确立的模数制度。以坐斗斗口宽度为基本模数，分为十一等。柱径、梁高、檩径等均以斗口倍数计算。',
    content_en: 'Doukou System is the modular system established in Qing Dynasty.',
    source: '筑见山河知识库',
    confidence: 0.98,
    verified: true,
    keywords: '斗口,斗口制,清式,工程做法,doukou,qing style'
  },
  {
    topic_key: 'caihua',
    topic_name: '彩画',
    category: '装饰',
    content: '古建筑彩画等级：和玺彩画（最高，用于皇宫，以龙凤为主要题材）、旋子彩画（次之，用于庙宇）、苏式彩画（最次，用于园林，以山水人物为题材）。',
    content_en: 'Ancient Chinese architectural painting has strict hierarchical system.',
    source: '筑见山河知识库',
    confidence: 0.95,
    verified: true,
    keywords: '彩画,和玺,旋子,苏式,龙凤,山水人物'
  },
  {
    topic_key: 'taiji',
    topic_name: '台基与基座',
    category: '基座',
    content: '古建筑台基高度有严格等级规定：皇宫太和殿台基最高（三层须弥座），民居台基最低。须弥座为最高等级台基，源于佛教须弥山造型。',
    content_en: 'Ancient Chinese building platforms have strict hierarchical regulations.',
    source: '筑见山河知识库',
    confidence: 0.96,
    verified: true,
    keywords: '台基,基座,须弥座,台阶,三层台基'
  }
];

/**
 * 知识库服务类
 * 实现 IService 接口以纳入统一服务注册体系
 */
class KnowledgeBaseService implements IService {
  readonly serviceId = 'knowledge-base-service';
  readonly serviceName = '知识库服务';

  private static instance: KnowledgeBaseService | null = null;
  private initialized = false;
  private state: ServiceState = ServiceState.UNREGISTERED;

  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {
    // 私有构造函数
  }

  /**
   * 获取单例实例
   */
  static getInstance(): KnowledgeBaseService {
    if (!KnowledgeBaseService.instance) {
      KnowledgeBaseService.instance = new KnowledgeBaseService();
    }
    return KnowledgeBaseService.instance;
  }

  /**
   * 服务工厂函数（用于服务注册中心）
   */
  static createInstance(): KnowledgeBaseService {
    return KnowledgeBaseService.getInstance();
  }

  /**
   * 获取服务状态
   */
  getState(): ServiceState {
    return this.state;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    return this.state === ServiceState.READY && this.initialized;
  }

  /**
   * 销毁服务
   */
  async dispose(): Promise<void> {
    this.initialized = false;
    this.state = ServiceState.DISPOSED;
    logger.info('知识库服务已销毁');
  }

  /**
   * 初始化知识库表
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.state = ServiceState.INITIALIZING;

    try {
      // 创建知识库表（如果不存在）
      await execute('user', `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'knowledge_topics' AND xtype = 'U')
        BEGIN
          CREATE TABLE knowledge_topics (
            topic_id INT IDENTITY(1,1) PRIMARY KEY,
            topic_key NVARCHAR(100) NOT NULL UNIQUE,
            topic_name NVARCHAR(200) NOT NULL,
            category NVARCHAR(50) NOT NULL,
            content NTEXT NOT NULL,
            content_en NTEXT,
            source NVARCHAR(200),
            confidence FLOAT DEFAULT 0.9,
            verified BIT DEFAULT 0,
            keywords NVARCHAR(500),
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE()
          )
        END
      `);

      // 检查是否需要导入默认数据
      const count = await dbQuery<any>('user', 'SELECT COUNT(*) as cnt FROM knowledge_topics');
      if (count[0]?.cnt === 0) {
        await this.importDefaultKnowledge();
      }

      this.initialized = true;
      this.state = ServiceState.READY;
      logger.info('知识库初始化完成');
    } catch (error: any) {
      logger.error('知识库初始化失败', error.message);
      // 非致命错误，继续运行
      this.initialized = true;
      this.state = ServiceState.READY;
    }
  }

  /**
   * 导入默认知识库
   */
  private async importDefaultKnowledge(): Promise<void> {
    logger.info('导入默认知识库...');
    
    for (const topic of DEFAULT_KNOWLEDGE) {
      try {
        await execute('user', `
          INSERT INTO knowledge_topics (topic_key, topic_name, category, content, content_en, source, confidence, verified, keywords)
          VALUES (@topic_key, @topic_name, @category, @content, @content_en, @source, @confidence, @verified, @keywords)
        `, {
          topic_key: topic.topic_key,
          topic_name: topic.topic_name,
          category: topic.category,
          content: topic.content,
          content_en: topic.content_en || null,
          source: topic.source || '筑见山河知识库',
          confidence: topic.confidence,
          verified: topic.verified ? 1 : 0,
          keywords: topic.keywords || ''
        });
      } catch (error: any) {
        logger.warn(`导入知识条目失败: ${topic.topic_name}`, error.message);
      }
    }
    
    logger.info(`默认知识库导入完成，共 ${DEFAULT_KNOWLEDGE.length} 条`);
  }

  /**
   * 获取所有知识条目
   */
  async getAll(category?: string): Promise<KnowledgeTopic[]> {
    try {
      await this.initialize();
      
      let sql = 'SELECT * FROM knowledge_topics';
      const params: any = {};
      
      if (category) {
        sql += ' WHERE category = @category';
        params.category = category;
      }
      
      sql += ' ORDER BY category, topic_name';
      
      const results = await dbQuery<any>('user', sql, params);
      
      return results.map(row => ({
        topic_id: row.topic_id,
        topic_key: row.topic_key,
        topic_name: row.topic_name,
        category: row.category,
        content: row.content,
        content_en: row.content_en,
        source: row.source,
        confidence: row.confidence,
        verified: !!row.verified,
        keywords: row.keywords,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error: any) {
      logger.error('获取知识库失败', error.message);
      // 返回内存中的默认知识
      return DEFAULT_KNOWLEDGE.map((k, i) => ({
        ...k,
        topic_id: i + 1,
        created_at: new Date(),
        updated_at: new Date()
      })) as KnowledgeTopic[];
    }
  }

  /**
   * 获取知识类别列表
   */
  async getCategories(): Promise<string[]> {
    try {
      await this.initialize();
      const results = await dbQuery<any>('user', 'SELECT DISTINCT category FROM knowledge_topics ORDER BY category');
      return results.map(r => r.category);
    } catch {
      return ['木结构', '屋顶形制', '构件', '连接方式', '模数制度', '装饰', '基座'];
    }
  }

  /**
   * 搜索知识
   */
  async search(searchQuery: string, limit = 10): Promise<KnowledgeTopic[]> {
    try {
      await this.initialize();
      
      const searchPattern = `%${searchQuery}%`;
      const searchSql = `
        SELECT TOP ${limit} * FROM knowledge_topics 
        WHERE topic_name LIKE @searchQuery 
           OR content LIKE @searchQuery 
           OR keywords LIKE @searchQuery
        ORDER BY confidence DESC, verified DESC
      `;
      const rawResults = await dbQuery('user', searchSql, { searchQuery: searchPattern });
      const results: any[] = Array.isArray(rawResults) ? rawResults : [];

      return results.map((row: any) => ({
        topic_id: row.topic_id,
        topic_key: row.topic_key,
        topic_name: row.topic_name,
        category: row.category,
        content: row.content,
        content_en: row.content_en,
        source: row.source,
        confidence: row.confidence,
        verified: !!row.verified,
        keywords: row.keywords,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error: any) {
      logger.error('搜索知识失败', error.message);
      // 简单的内存搜索
      const q = searchQuery.toLowerCase();
      return DEFAULT_KNOWLEDGE
        .filter((k: any) => 
          k.topic_name.includes(searchQuery) || 
          k.content.includes(searchQuery) ||
          (typeof k.keywords === 'string' && k.keywords.toLowerCase().includes(q))
        )
        .slice(0, limit)
        .map((k: any, i: number) => ({ ...k, topic_id: i + 1 })) as KnowledgeTopic[];
    }
  }

  /**
   * 获取单条知识
   */
  async getById(id: number): Promise<KnowledgeTopic | null> {
    try {
      await this.initialize();
      const results = await dbQuery<any>('user', 'SELECT * FROM knowledge_topics WHERE topic_id = @id', { id });
      
      if (results.length === 0) return null;
      
      const row = results[0];
      return {
        topic_id: row.topic_id,
        topic_key: row.topic_key,
        topic_name: row.topic_name,
        category: row.category,
        content: row.content,
        content_en: row.content_en,
        source: row.source,
        confidence: row.confidence,
        verified: !!row.verified,
        keywords: row.keywords,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    } catch (error: any) {
      logger.error('获取知识详情失败', error.message);
      return null;
    }
  }

  /**
   * 添加知识条目
   */
  async add(topic: Omit<KnowledgeTopic, 'topic_id' | 'created_at' | 'updated_at'>): Promise<number> {
    await this.initialize();
    
    const result = await execute('user', `
      INSERT INTO knowledge_topics (topic_key, topic_name, category, content, content_en, source, confidence, verified, keywords)
      VALUES (@topic_key, @topic_name, @category, @content, @content_en, @source, @confidence, @verified, @keywords);
      SELECT SCOPE_IDENTITY() as id;
    `, {
      topic_key: topic.topic_key,
      topic_name: topic.topic_name,
      category: topic.category,
      content: topic.content,
      content_en: topic.content_en || null,
      source: topic.source || '用户添加',
      confidence: topic.confidence,
      verified: topic.verified ? 1 : 0,
      keywords: topic.keywords || ''
    });

    return result.recordset[0]?.id || 0;
  }

  /**
   * 更新知识条目
   */
  async update(id: number, topic: Partial<KnowledgeTopic>): Promise<boolean> {
    const updates: string[] = [];
    const params: any = { id };

    if (topic.topic_name !== undefined) {
      updates.push('topic_name = @topic_name');
      params.topic_name = topic.topic_name;
    }
    if (topic.category !== undefined) {
      updates.push('category = @category');
      params.category = topic.category;
    }
    if (topic.content !== undefined) {
      updates.push('content = @content');
      params.content = topic.content;
    }
    if (topic.content_en !== undefined) {
      updates.push('content_en = @content_en');
      params.content_en = topic.content_en;
    }
    if (topic.confidence !== undefined) {
      updates.push('confidence = @confidence');
      params.confidence = topic.confidence;
    }
    if (topic.verified !== undefined) {
      updates.push('verified = @verified');
      params.verified = topic.verified ? 1 : 0;
    }
    if (topic.keywords !== undefined) {
      updates.push('keywords = @keywords');
      params.keywords = topic.keywords;
    }

    if (updates.length === 0) return false;

    updates.push('updated_at = GETDATE()');

    try {
      await execute('user', `UPDATE knowledge_topics SET ${updates.join(', ')} WHERE topic_id = @id`, params);
      return true;
    } catch (error: any) {
      logger.error('更新知识失败', error.message);
      return false;
    }
  }

  /**
   * 删除知识条目
   */
  async delete(id: number): Promise<boolean> {
    try {
      await execute('user', 'DELETE FROM knowledge_topics WHERE topic_id = @id', { id });
      return true;
    } catch (error: any) {
      logger.error('删除知识失败', error.message);
      return false;
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{ total: number; categories: number; verified: number }> {
    try {
      await this.initialize();
      const results = await dbQuery<any>('user', `
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT category) as categories,
          SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified
        FROM knowledge_topics
      `);
      
      return {
        total: results[0]?.total || 0,
        categories: results[0]?.categories || 0,
        verified: results[0]?.verified || 0
      };
    } catch {
      return {
        total: DEFAULT_KNOWLEDGE.length,
        categories: 7,
        verified: DEFAULT_KNOWLEDGE.length
      };
    }
  }
}

// 导出类和服务实例
export { KnowledgeBaseService };
export const knowledgeBaseService = KnowledgeBaseService.getInstance();
