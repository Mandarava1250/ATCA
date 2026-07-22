/**
 * 筑见山河 - AI知识图谱模块
 * 为AI助手提供项目古建筑领域的结构化知识，确保回答准确率
 */

import { architectureApi } from '@/services/api';

/** 后端知识主题 */
interface KnowledgeTopic {
  topic_id: number;
  topic_key: string;
  topic_name: string;
  category: string;
  content: string;
  content_en: string | null;
  source: string;
  confidence: number;
  verified: boolean;
}

/** 知识条目 */
export interface KnowledgeEntry {
  topic: string;           // 主题
  topicEn: string;         // 英文主题
  keywords: string[];      // 关键词（用于匹配）
  content: string;         // 知识内容（中文）
  contentEn: string;       // 知识内容（英文）
  source: string;          // 来源
  confidence: number;      // 置信度 0-1
  verified: boolean;       // 是否已验证
}

/** 知识图谱 */
class KnowledgeGraph {
  private entries: KnowledgeEntry[] = [];
  private loaded = false;
  private loadPromise: Promise<void> | null = null;

  /** 核心知识库（内嵌，防AI幻觉的保底知识） */
  private coreKnowledge: KnowledgeEntry[] = [
      // === 基本结构 ===
      {
        topic: '抬梁式结构',
        topicEn: 'Tailiang-style Structure',
        keywords: ['抬梁', '抬梁式', '叠梁', '梁柱', '梁架', 'tailiang', 'beam'],
        content: '抬梁式（叠梁式）是中国古建筑最主要的木结构形式。特点：柱上承梁，梁上抬梁，逐层缩短，最上层立脊瓜柱承脊檩。适用于宫殿、庙宇等大型建筑。代表：北京故宫太和殿。',
        contentEn: 'Tailiang-style (also called Dieliang-style) is the most important wooden structure form in traditional Chinese architecture. Features: beams are placed on columns, with each upper beam shorter than the one below, and the top ridge column supports the ridge purlin. Suitable for large buildings like palaces and temples. Representative example: Hall of Supreme Harmony in the Forbidden City.',
        source: '筑见山河知识库',
        confidence: 0.98,
        verified: true,
      },
      {
        topic: '穿斗式结构',
        topicEn: 'Chuandou-style Structure',
        keywords: ['穿斗', '穿斗式', '穿枋', '立贴', '檩柱', 'chuandou'],
        content: '穿斗式（立贴式）是南方常见木结构形式。特点：柱距较密，柱头直接承檩，以穿枋连接各柱形成框架。用料省、整体性强，适用于民居等中小型建筑。',
        contentEn: 'Chuandou-style (also called Litie-style) is a common wooden structure form in southern China. Features: closely spaced columns with purlins directly on column heads, connected by through-ties to form a frame. Economical in materials, strong integrity. Suitable for medium and small buildings like residences.',
        source: '筑见山河知识库',
        confidence: 0.98,
        verified: true,
      },
      {
        topic: '井干式结构',
        topicEn: 'Jinggan-style Structure',
        keywords: ['井干', '井干式', '木楞', '叠木', 'jinggan', 'log'],
        content: '井干式是最原始的木结构形式，以原木或方木叠垒成壁。因耗材大，主要用于东北、西南等林区。代表：云南独龙族木屋。',
        contentEn: 'Jinggan-style is the most primitive wooden structure form, using logs or squared timber stacked to form walls. Due to high material consumption, mainly used in forest areas of Northeast and Southwest China. Representative example: wooden houses of the Dulong people in Yunnan.',
        source: '筑见山河知识库',
        confidence: 0.95,
        verified: true,
      },
      // === 屋顶形制 ===
      {
        topic: '庑殿顶',
        topicEn: 'Hipped Roof (Wudian Ding)',
        keywords: ['庑殿', '庑殿顶', '四阿顶', '五脊顶', 'hipped', 'wudian'],
        content: '庑殿顶（四阿顶）是中国古建筑最高等级的屋顶形制，有一条正脊和四条垂脊，四面斜坡。用于皇宫、庙宇主殿。重檐庑殿顶为最高等级，如太和殿。',
        contentEn: 'Hipped roof (Wudian Ding) is the highest-ranking roof form in traditional Chinese architecture. It has one main ridge and four sloping ridges, with four sloped sides. Used for imperial palaces and main temple halls. Double-eaved hipped roof is the highest grade, exemplified by the Hall of Supreme Harmony.',
        source: '筑见山河知识库',
        confidence: 0.99,
        verified: true,
      },
      {
        topic: '歇山顶',
        topicEn: 'Gable-and-Hipped Roof (Xieshan Ding)',
        keywords: ['歇山', '歇山顶', '九脊顶', 'xieshan', 'gable'],
        content: '歇山顶（九脊顶）等级仅次于庑殿顶，由正脊、垂脊、戗脊组成，上半部为悬山或硬山式，下半部为四面坡。常用于宫殿次要建筑和庙宇。',
        contentEn: 'Gable-and-hipped roof (Xieshan Ding) is second only to the hipped roof in rank. It consists of a main ridge, vertical ridges, and diagonal ridges. The upper part is gable-style, while the lower part has four slopes. Often used for secondary palace buildings and temples.',
        source: '筑见山河知识库',
        confidence: 0.98,
        verified: true,
      },
      {
        topic: '悬山顶与硬山顶',
        topicEn: 'Overhanging Gable Roof and Hard Gable Roof',
        keywords: ['悬山', '悬山顶', '硬山', '硬山顶', 'overhanging', 'hard gable'],
        content: '悬山顶：两面坡，两侧悬出山墙外。硬山顶：两面坡，两侧不悬出山墙。两者等级较低，广泛用于民居。',
        contentEn: 'Overhanging Gable Roof: Double-sloped, with eaves extending beyond the gable walls. Hard Gable Roof: Double-sloped, with eaves not extending beyond the gable walls. Both are lower-ranking and widely used in residential buildings.',
        source: '筑见山河知识库',
        confidence: 0.97,
        verified: true,
      },
      {
        topic: '攒尖顶',
        topicEn: 'Spire Roof (Cuanjian Ding)',
        keywords: ['攒尖', '攒尖顶', '尖顶', '亭顶', 'spire', 'cuanjian'],
        content: '攒尖顶屋顶呈锥形，所有斜面交汇于顶部一点（宝顶）。常用于亭、阁、塔等建筑。有三角、四角、六角、八角、圆形攒尖。',
        contentEn: 'Spire roof is conical in shape, with all slopes converging at a single point (treasure top) at the summit. Often used for pavilions, towers, and pagodas. Variants include triangular, square, hexagonal, octagonal, and circular spire roofs.',
        source: '筑见山河知识库',
        confidence: 0.97,
        verified: true,
      },
      // === 斗拱 ===
      {
        topic: '斗拱（铺作）',
        topicEn: 'Dougong (Brackets)',
        keywords: ['斗拱', '铺作', '斗栱', '斗科', '栌斗', '华拱', '昂', '斗口', 'dougong', 'bracket'],
        content: '斗拱是中国古建筑特有的结构构件，位于柱头与梁架之间，由斗、拱、昂等构件组成。功能：承托屋檐重量、传递荷载、增加出檐深度。清代称"斗科"。斗口为模数单位。',
        contentEn: 'Dougong are unique structural components in traditional Chinese architecture, located between column heads and beam frames. Composed of dou (blocks), gong (arms), and ang (brackets). Functions: support eave weight, transfer loads, increase eave depth. Called "Douke" in Qing Dynasty. Doukou (bracket opening) serves as the modular unit.',
        source: '筑见山河知识库',
        confidence: 0.99,
        verified: true,
      },
      {
        topic: '斗拱出跳',
        topicEn: 'Dougong Projection',
        keywords: ['出跳', '跳', '铺作数', '单抄', '双抄', '单昂', '双昂', 'projection', 'puzuo'],
        content: '出跳指斗拱悬挑层数。宋代以"铺作"计：四铺作出一跳，五铺作出二跳，最多八铺作。华拱外挑为"抄"，斜向构件下昂也为出跳。出跳越多，屋檐越深，建筑等级越高。',
        contentEn: 'Projection refers to the number of cantilever layers in dougong. In Song Dynasty, counted as "Puzuo": 4-puzuo has one projection, 5-puzuo has two projections, maximum 8-puzuo. Horizontal arms projecting outward are called "chao", while diagonal downward arms ("ang") also count as projections. More projections mean deeper eaves and higher building rank.',
        source: '筑见山河知识库',
        confidence: 0.97,
        verified: true,
      },
      // === 模数制度 ===
      {
        topic: '材分制',
        topicEn: 'Cai Fen System',
        keywords: ['材', '材分制', '材分', '宋式', '营造法式', 'cai fen', 'song style'],
        content: '材分制是宋《营造法式》确立的模数制度。"材"为基本模数，按拱高分为八等（一等材高9寸，八等材高4.5寸）。所有构件尺寸均以材的倍数确定。实现了标准化设计与施工。',
        contentEn: 'Cai Fen System is the modular system established in Song Dynasty\'s "Yingzao Fashi" (Treatise on Architectural Methods). "Cai" is the basic module, graded into 8 classes based on arch height (Class 1: 9 cun, Class 8: 4.5 cun). All component dimensions are determined as multiples of Cai. Achieved standardized design and construction.',
        source: '筑见山河知识库',
        confidence: 0.98,
        verified: true,
      },
      {
        topic: '斗口制',
        topicEn: 'Doukou System',
        keywords: ['斗口', '斗口制', '清式', '工程做法', 'doukou', 'qing style'],
        content: '斗口制是清《工程做法》确立的模数制度。以坐斗斗口宽度为基本模数，分为十一等（一等斗口6寸，十一等斗口1寸）。柱径、梁高、檩径等均以斗口倍数计算。',
        contentEn: 'Doukou System is the modular system established in Qing Dynasty\'s "Gongcheng Zuofa" (Building Methods). Based on the width of the seated dou\'s opening as the basic module, graded into 11 classes (Class 1: 6 cun, Class 11: 1 cun). Column diameter, beam height, purlin diameter, etc., are calculated as multiples of doukou.',
        source: '筑见山河知识库',
        confidence: 0.98,
        verified: true,
      },
      // === 建筑特征 ===
      {
        topic: '侧脚与生起',
        topicEn: 'Ce Jiao and Sheng Qi',
        keywords: ['侧脚', '生起', '收分', '柱侧脚', 'cejiao', 'shengqi'],
        content: '侧脚：柱子顶部向内微倾（通常1%），增强稳定性。生起：檐柱高度自明间向两侧逐柱升高，形成柔和曲线。两者是唐宋建筑的重要特征，体现"建筑如生"的哲学。',
        contentEn: 'Ce Jiao: Column tops incline slightly inward (usually 1%), enhancing stability. Sheng Qi: Eave column heights increase gradually from the central bay to the sides, creating a gentle curve. Both are important features of Tang and Song architecture, embodying the philosophy of "architecture as living organism."',
        source: '筑见山河知识库',
        confidence: 0.97,
        verified: true,
      },
      {
        topic: '榫卯结构',
        topicEn: 'Sunmao Joints',
        keywords: ['榫卯', '榫', '卯', '燕尾榫', '馒头榫', '箍头榫', 'sunmao', 'mortise'],
        content: '榫卯是中国古建筑木构件连接方式，不用钉子。常见类型：燕尾榫（抗拉）、馒头榫（承压）、箍头榫（转角连接）、透榫（穿通固定）。体现了"以柔克刚"的哲学。',
        contentEn: 'Sunmao are traditional Chinese wooden joinery techniques that connect components without nails. Common types: swallowtail joint (tensile strength), steamed bun joint (compression), hoop joint (corner connection), through-tenon (penetrating fixation). Embodies the philosophy of "overcoming rigidity with flexibility."',
        source: '筑见山河知识库',
        confidence: 0.98,
        verified: true,
      },
      // === 朝代建筑 ===
      {
        topic: '唐代建筑特征',
        topicEn: 'Tang Dynasty Architecture Characteristics',
        keywords: ['唐代', '唐', '唐风', '佛光寺', '南禅寺', 'tang', 'tang dynasty'],
        content: '唐代建筑特征：气魄宏伟、斗拱硕大（柱高约50%）、屋面坡度平缓、出檐深远、直棱窗、梭柱。现存唐构：五台山佛光寺东大殿（857年，最早木构）、南禅寺大殿。',
        contentEn: 'Tang Dynasty architecture characteristics: majestic scale, large dougong (about 50% of column height), gentle roof slope, deep eaves, straight-lattice windows, tapered columns. Extant Tang structures: East Hall of Foguang Temple (857 AD, earliest wooden structure), Main Hall of Nanchan Temple, both in Wutai Mountain.',
        source: '筑见山河知识库',
        confidence: 0.99,
        verified: true,
      },
      {
        topic: '宋代建筑特征',
        topicEn: 'Song Dynasty Architecture Characteristics',
        keywords: ['宋代', '宋', '宋风', '晋祠', '保国寺', 'song', 'song dynasty'],
        content: '宋代建筑特征：精巧秀丽、斗拱缩小（装饰化趋势）、屋面坡度增大、升起侧脚明显、装修精美。李诫编《营造法式》标志建筑技术标准化。代表：太原晋祠圣母殿。',
        contentEn: 'Song Dynasty architecture characteristics: exquisite and elegant, smaller dougong (decorative trend), steeper roof slope, pronounced shengqi and cejiao, elaborate ornamentation. Li Jie\'s "Yingzao Fashi" marked the standardization of building techniques. Representative example: Goddess Temple of Jinci in Taiyuan.',
        source: '筑见山河知识库',
        confidence: 0.98,
        verified: true,
      },
      {
        topic: '明清建筑特征',
        topicEn: 'Ming and Qing Dynasty Architecture Characteristics',
        keywords: ['明代', '清代', '明清', '故宫', '斗口', 'ming', 'qing', 'ming qing'],
        content: '明清建筑特征：斗拱缩小为装饰性构件、屋面坡度陡峻、彩画丰富（和玺、旋子、苏式彩画）、群体布局严整。清代颁《工程做法》。代表：故宫建筑群。',
        contentEn: 'Ming and Qing Dynasty architecture characteristics: dougong reduced to decorative elements, steep roof slopes, rich painted decoration (Hexi, Xuanzi, Suzhou styles), rigorous group layout. Qing Dynasty issued "Gongcheng Zuofa". Representative example: Forbidden City complex.',
        source: '筑见山河知识库',
        confidence: 0.98,
        verified: true,
      },
      // === 著名建筑 ===
      {
        topic: '佛光寺东大殿',
        topicEn: 'East Hall of Foguang Temple',
        keywords: ['佛光寺', '东大殿', '五台山', '唐代木构', 'foguang', 'east hall'],
        content: '佛光寺东大殿（857年）位于山西五台山，是中国现存最早的木构建筑。面阔七间，进深八架椽，单檐庑殿顶。殿内有唐代彩塑、壁画和题记。梁思成、林徽因于1937年发现。',
        contentEn: 'East Hall of Foguang Temple (857 AD) is located in Wutai Mountain, Shanxi. It is the oldest extant wooden structure in China. Seven bays wide, eight rafters deep, single-eaved hipped roof. Contains Tang Dynasty sculptures, murals, and inscriptions. Discovered by Liang Sicheng and Lin Huiyin in 1937.',
        source: '筑见山河知识库',
        confidence: 0.99,
        verified: true,
      },
      {
        topic: '故宫太和殿',
        topicEn: 'Hall of Supreme Harmony',
        keywords: ['太和殿', '故宫', '紫禁城', '金銮殿', 'taihe', 'supreme harmony'],
        content: '太和殿（金銮殿）位于北京故宫中心，是中国现存最大的木构殿堂。面阔11间，进深5间，重檐庑殿顶，高35米。建于明永乐十八年（1420年），现建筑为清康熙三十四年（1695年）重建。',
        contentEn: 'Hall of Supreme Harmony (Golden Throne Hall) is located at the center of the Forbidden City in Beijing. It is the largest extant wooden hall in China. Eleven bays wide, five bays deep, double-eaved hipped roof, 35 meters high. Built in 1420 (Yongle 18, Ming Dynasty), current structure reconstructed in 1695 (Kangxi 34, Qing Dynasty).',
        source: '筑见山河知识库',
        confidence: 0.99,
        verified: true,
      },
      {
        topic: '应县木塔',
        topicEn: 'Yingxian Wooden Pagoda',
        keywords: ['应县木塔', '佛宫寺', '释迦塔', '辽代', 'yingxian', 'wooden pagoda'],
        content: '佛宫寺释迦塔（应县木塔）位于山西应县，建于辽清宁二年（1056年），是世界现存最高最古的木塔。高67.31米，平面八角形，外观五层六檐，内部九层。纯木结构，无钉无铆。',
        contentEn: 'Sakyamuni Pagoda of Fogong Temple (Yingxian Wooden Pagoda) is located in Yingxian, Shanxi. Built in 1056 (Qingning 2, Liao Dynasty), it is the tallest and oldest extant wooden pagoda in the world. 67.31 meters high, octagonal plan, five stories/six eaves externally, nine stories internally. Pure wooden structure without nails or rivets.',
        source: '筑见山河知识库',
        confidence: 0.99,
        verified: true,
      },
      // === 3D工坊相关 ===
      {
        topic: '3D古建筑建模构件',
        topicEn: '3D Ancient Architecture Components',
        keywords: ['3D', '构件', '建模', '模型', '柱', '梁', '檩', '椽', 'component', 'modeling'],
        content: '筑见山河3D工坊提供多种古建筑构件：柱（檐柱、金柱、梭柱）、梁（月梁、直梁、顺梁）、檩（脊檩、金檩、檐檩）、椽（飞椽、檐椽）、斗拱（栌斗、华拱、令拱）、屋顶（庑殿、歇山、悬山、攒尖）、台基、墙体、门窗等。支持自由创建和真实搭建两种模式。',
        contentEn: 'Huaxia Yingzao 3D Workshop provides various ancient architecture components: columns (eave columns, golden columns, tapered columns), beams (moon beams, straight beams, parallel beams), purlins (ridge purlin, golden purlin, eave purlin), rafters (flying rafters, eave rafters), dougong (base blocks, horizontal arms, linggong), roofs (hipped, gable-and-hipped, overhanging gable, spire), platforms, walls, doors and windows. Supports two modes: free creation and authentic construction.',
        source: '筑见山河3D工坊',
        confidence: 0.99,
        verified: true,
      },
      {
        topic: '自由创建与真实搭建',
        topicEn: 'Free Creation vs Authentic Construction',
        keywords: ['自由创建', '真实搭建', '搭建模式', '规则搭建', 'free', 'authentic', 'mode'],
        content: '3D工坊提供两种搭建模式：自由创建模式——可随意摆放构件，不受约束；真实搭建模式——遵循古建筑营造法则（材分制、榫卯匹配、结构力学约束），系统自动检测违规并提示。',
        contentEn: 'The 3D Workshop offers two construction modes: Free Creation Mode - place components freely without constraints; Authentic Construction Mode - follows ancient building rules (Cai Fen system, sunmao joint matching, structural mechanics constraints), with automatic violation detection and prompts.',
        source: '筑见山河3D工坊',
        confidence: 0.99,
        verified: true,
      },
    ];

  /** 初始化entries：核心知识+动态知识 */
  private initCoreKnowledge(): void {
    this.entries = [...this.coreKnowledge];
  }

  /** 从后端加载动态知识 */
  private async loadDynamicKnowledge() {
    try {
      const [dynastiesRes, typesRes] = await Promise.all([
        architectureApi.dynasties().catch(() => null),
        architectureApi.types().catch(() => null),
      ]);

      if (dynastiesRes?.success && dynastiesRes.data) {
        for (const d of dynastiesRes.data as any[]) {
          const name = d.dynasty_name || d.name || String(d);
          const nameEn = this.getDynastyEnglishName(name);
          this.entries.push({
            topic: `${name}朝建筑`,
            topicEn: `${nameEn} Dynasty Architecture`,
            keywords: [name, `${name}代`, `${name}朝`, nameEn.toLowerCase(), 'dynasty'],
            content: `${name}朝是中国古建筑发展的重要时期。`,
            contentEn: `The ${nameEn} Dynasty was an important period in the development of traditional Chinese architecture.`,
            source: '筑见山河数据库',
            confidence: 0.85,
            verified: false,
          });
        }
      }

      if (typesRes?.success && typesRes.data) {
        for (const t of typesRes.data as any[]) {
          const typeName = typeof t === 'string' ? t : (t.type_name || t.name || String(t));
          const typeNameEn = this.getArchitectureTypeNameEn(typeName);
          this.entries.push({
            topic: typeName,
            topicEn: typeNameEn,
            keywords: [typeName, typeNameEn.toLowerCase()],
            content: `${typeName}是中国古建筑的典型类型之一。`,
            contentEn: `${typeNameEn} is one of the typical types of traditional Chinese architecture.`,
            source: '筑见山河数据库',
            confidence: 0.8,
            verified: false,
          });
        }
      }
    } catch {
      // 静默失败，核心知识已足够
    }
  }

  /** 获取朝代英文名称 */
  private getDynastyEnglishName(chineseName: string): string {
    const mapping: Record<string, string> = {
      '唐': 'Tang', '宋': 'Song', '元': 'Yuan', '明': 'Ming', '清': 'Qing',
      '汉': 'Han', '秦': 'Qin', '隋': 'Sui', '晋': 'Jin', '魏': 'Wei',
      '南北朝': 'Northern and Southern', '五代': 'Five Dynasties', '辽': 'Liao',
      '金': 'Jin', '夏': 'Xia', '春秋': 'Spring and Autumn', '战国': 'Warring States',
    };
    return mapping[chineseName] || chineseName;
  }

  /** 获取建筑类型英文名称 */
  private getArchitectureTypeNameEn(chineseName: string): string {
    const mapping: Record<string, string> = {
      '宫殿': 'Palace', '庙宇': 'Temple', '民居': 'Residence', '园林': 'Garden',
      '塔': 'Pagoda', '亭': 'Pavilion', '台': 'Terrace', '楼': 'Tower',
      '阁': 'Belvedere', '桥': 'Bridge', '牌坊': 'Memorial Arch', '陵墓': 'Mausoleum',
    };
    return mapping[chineseName] || chineseName;
  }

  /** 初始化知识图谱 */
  async initialize() {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      this.initCoreKnowledge(); // 核心知识保底，防AI幻觉
      await this.loadDynamicKnowledge();
      this.loaded = true;
    })();

    return this.loadPromise;
  }

  /** 查询相关知识（按关键词匹配度排序） */
  query(userQuestion: string, maxResults: number = 3): KnowledgeEntry[] {
    const lowerQ = userQuestion.toLowerCase();
    const scored = this.entries.map(entry => {
      let score = 0;
      for (const kw of entry.keywords) {
        if (lowerQ.includes(kw.toLowerCase())) {
          score += entry.confidence * (kw.length >= 4 ? 1.5 : 1.0) * (entry.verified ? 1.2 : 1.0);
        }
      }
      // 内容模糊匹配
      if (lowerQ.length > 2 && entry.content.toLowerCase().includes(lowerQ)) {
        score += 0.3;
      }
      // 英文关键词匹配
      if (entry.topicEn && lowerQ.includes(entry.topicEn.toLowerCase())) {
        score += entry.confidence * 0.5;
      }
      return { entry, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score > 0).slice(0, maxResults).map(s => s.entry);
  }

  /** 构建增强提示词（中文） */
  buildEnhancedPrompt(userQuestion: string): { enhancedPrompt: string; sources: string[] } {
    return this.buildPrompt(userQuestion, 'zh');
  }

  /** 构建增强提示词（英文） */
  buildEnhancedPromptEn(userQuestion: string): { enhancedPrompt: string; sources: string[] } {
    return this.buildPrompt(userQuestion, 'en');
  }

  /** 构建增强提示词（通用） */
  private buildPrompt(userQuestion: string, lang: 'zh' | 'en'): { enhancedPrompt: string; sources: string[] } {
    const knowledge = this.query(userQuestion, 5);

    if (knowledge.length === 0) {
      return { enhancedPrompt: userQuestion, sources: [] };
    }

    const verifiedCount = knowledge.filter(k => k.verified).length;
    const allVerified = verifiedCount === knowledge.length;

    const contextParts = knowledge.map((k, i) => {
      const content = lang === 'en' ? (k.contentEn || k.content) : k.content;
      const topic = lang === 'en' ? (k.topicEn || k.topic) : k.topic;
      const verifiedMark = k.verified ? (lang === 'en' ? '[VERIFIED]' : '[已验证]') : '';
      return `[知识${i + 1}] ${verifiedMark} ${topic}（来源：${k.source}，置信度：${(k.confidence * 100).toFixed(0)}%）：${content}`;
    });

    const systemPromptZh = `
你是一位中国古建筑领域的专业导览员。请严格按照以下规则回答：

【约束规则】
1. 必须优先使用知识库中的信息回答，不得编造事实
2. 如果知识库内容与你的内部知识冲突，以知识库为准
3. 如果知识库没有相关信息，应明确说明"知识库未收录相关信息"，然后谨慎补充你的知识
4. 对于不确定的信息，必须标注"[待验证]"
5. 所有数据和年代必须准确，不得猜测

【回答要求】
- 使用中文回答
- 确保信息准确无误
- 涉及专业术语时给出通俗解释
- 如果引用知识库内容，请注明"根据知识库"

${contextParts.join('\n\n')}

用户问题：${userQuestion}

请基于以上知识库内容回答。
`;

    const systemPromptEn = `
You are a professional guide in the field of traditional Chinese architecture. Please strictly follow these rules:

[Constraint Rules]
1. Must prioritize information from the knowledge base, do not fabricate facts
2. If knowledge base content conflicts with your internal knowledge, the knowledge base takes precedence
3. If the knowledge base lacks relevant information, explicitly state "Not found in knowledge base" before supplementing with caution
4. For uncertain information, must mark with "[UNVERIFIED]"
5. All data and dates must be accurate, no speculation allowed

[Response Requirements]
- Answer in English
- Ensure information accuracy
- Provide explanations for technical terms
- If citing knowledge base content, indicate "According to knowledge base"

${contextParts.join('\n\n')}

User Question: ${userQuestion}

Please answer based on the knowledge base content above.
`;

    const enhancedPrompt = lang === 'en' ? systemPromptEn : systemPromptZh;

    return {
      enhancedPrompt,
      sources: knowledge.map(k => k.source),
    };
  }

  /** 获取验证过的知识条目 */
  getVerifiedEntries(): KnowledgeEntry[] {
    return this.entries.filter(k => k.verified);
  }

  /** 添加知识条目 */
  addEntry(entry: Omit<KnowledgeEntry, 'topicEn' | 'contentEn' | 'verified'> & { topicEn?: string; contentEn?: string; verified?: boolean }) {
    this.entries.push({
      topicEn: entry.topicEn || entry.topic,
      contentEn: entry.contentEn || entry.content,
      verified: entry.verified || false,
      ...entry,
    });
  }

  /** 获取所有知识条目数 */
  getEntryCount(): number {
    return this.entries.length;
  }

  /** 是否已加载 */
  isReady(): boolean {
    return this.loaded;
  }

  // ==================== 知识扩充机制 ====================

  /**
   * 批量添加知识条目（数据扩充机制）
   * @param newEntries 新知识条目数组
   * @param validate 是否验证数据格式
   * @returns 添加结果统计
   */
  addKnowledgeBatch(
    newEntries: Array<Omit<KnowledgeEntry, 'topicEn' | 'contentEn' | 'verified'> & { 
      topicEn?: string; 
      contentEn?: string; 
      verified?: boolean;
      category?: string;
    }>,
    validate = true
  ): { success: number; failed: number; errors: string[] } {
    const result = { success: 0, failed: 0, errors: [] as string[] };

    for (const entry of newEntries) {
      try {
        // 数据验证
        if (validate) {
          if (!entry.topic || entry.topic.trim().length === 0) {
            result.errors.push(`条目缺少主题(topic)`);
            result.failed++;
            continue;
          }
          if (!entry.content || entry.content.trim().length < 10) {
            result.errors.push(`条目"${entry.topic}"内容过短`);
            result.failed++;
            continue;
          }
          if (!entry.keywords || entry.keywords.length === 0) {
            result.errors.push(`条目"${entry.topic}"缺少关键词`);
            result.failed++;
            continue;
          }
          if (entry.confidence !== undefined && (entry.confidence < 0 || entry.confidence > 1)) {
            result.errors.push(`条目"${entry.topic}"置信度超出范围(0-1)`);
            result.failed++;
            continue;
          }
        }

        // 规范化后添加
        this.entries.push({
          topic: entry.topic.trim(),
          topicEn: (entry.topicEn || entry.topic).trim(),
          keywords: entry.keywords.map(k => k.toLowerCase().trim()),
          content: entry.content.trim(),
          contentEn: (entry.contentEn || entry.content).trim(),
          source: entry.source || '用户添加',
          confidence: entry.confidence ?? 0.8,
          verified: entry.verified ?? false,
        });

        result.success++;
      } catch (e: any) {
        result.errors.push(`添加条目"${entry.topic}"时出错: ${e.message}`);
        result.failed++;
      }
    }

    console.log('[KnowledgeGraph] 批量添加知识完成', result);
    return result;
  }

  /**
   * 从JSON导入知识数据
   * @param jsonData JSON格式的知识数据
   * @returns 导入结果
   */
  importFromJson(jsonData: string): { success: number; failed: number; errors: string[] } {
    try {
      const data = JSON.parse(jsonData);
      const entries = Array.isArray(data) ? data : data.entries || [];
      return this.addKnowledgeBatch(entries);
    } catch (e: any) {
      return { success: 0, failed: 0, errors: [`JSON解析失败: ${e.message}`] };
    }
  }

  /**
   * 导出知识数据为JSON
   * @param includeCore 是否包含核心知识
   * @returns JSON字符串
   */
  exportToJson(includeCore = false): string {
    const entriesToExport = includeCore 
      ? this.entries 
      : this.entries.filter(e => !this.coreKnowledge.includes(e));
    
    return JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      count: entriesToExport.length,
      entries: entriesToExport.map(e => ({
        topic: e.topic,
        topicEn: e.topicEn,
        keywords: e.keywords,
        content: e.content,
        contentEn: e.contentEn,
        source: e.source,
        confidence: e.confidence,
        verified: e.verified,
      }))
    }, null, 2);
  }

  /**
   * 更新现有知识条目
   * @param topic 主题（作为查找键）
   * @param updates 要更新的字段
   * @returns 是否成功
   */
  updateEntry(topic: string, updates: Partial<KnowledgeEntry>): boolean {
    const index = this.entries.findIndex(e => e.topic === topic);
    if (index === -1) return false;
    
    this.entries[index] = {
      ...this.entries[index],
      ...updates,
    };
    
    console.log(`[KnowledgeGraph] 更新知识条目: ${topic}`);
    return true;
  }

  /**
   * 删除知识条目
   * @param topic 主题
   * @returns 是否成功
   */
  removeEntry(topic: string): boolean {
    const index = this.entries.findIndex(e => e.topic === topic);
    if (index === -1) return false;
    
    // 不允许删除核心知识
    if (this.coreKnowledge.includes(this.entries[index])) {
      console.warn(`[KnowledgeGraph] 不能删除核心知识: ${topic}`);
      return false;
    }
    
    this.entries.splice(index, 1);
    console.log(`[KnowledgeGraph] 删除知识条目: ${topic}`);
    return true;
  }

  /**
   * 搜索知识条目
   * @param query 搜索关键词
   * @returns 匹配的知识条目
   */
  searchEntries(query: string): KnowledgeEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.entries.filter(e => 
      e.topic.toLowerCase().includes(lowerQuery) ||
      e.keywords.some(k => k.includes(lowerQuery)) ||
      e.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 获取知识统计信息
   */
  getStatistics(): {
    total: number;
    core: number;
    dynamic: number;
    verified: number;
    unverified: number;
    bySource: Record<string, number>;
  } {
    const bySource: Record<string, number> = {};
    
    for (const entry of this.entries) {
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;
    }
    
    return {
      total: this.entries.length,
      core: this.coreKnowledge.length,
      dynamic: this.entries.length - this.coreKnowledge.length,
      verified: this.entries.filter(e => e.verified).length,
      unverified: this.entries.filter(e => !e.verified).length,
      bySource,
    };
  }
}

// 导出单例
export const knowledgeGraph = new KnowledgeGraph();
