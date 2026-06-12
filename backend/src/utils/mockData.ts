// ============================================
// 华夏营造 - Mock 数据服务
// 当数据库不可用时提供降级数据
// ============================================

let mockMode = false;

export function setMockMode(enabled: boolean) {
  mockMode = enabled;
}

export function isMockMode(): boolean {
  return mockMode;
}

// 古建筑 Mock 数据
export const mockArchitectures = [
  {
    architecture_id: 1, name: '太和殿', chinese_name: '太和殿',
    location: '北京', coordinates: '39.9163,116.3972',
    type: '宫殿', founding_dynasty: '明', completed_dynasty: '清',
    protection_level: '世界文化遗产', brief_description: '故宫核心建筑，中国现存最大的木结构大殿',
    full_description: '太和殿俗称金銮殿，位于北京紫禁城南北主轴线的显要位置，是中国现存最大的木结构大殿。建于明永乐十八年（1420年），后多次毁于火灾并重建。',
    main_image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01',
    view_count: 12500, favorite_count: 3200
  },
  {
    architecture_id: 2, name: '祈年殿', chinese_name: '祈年殿',
    location: '北京', coordinates: '39.8822,116.4066',
    type: '祭祀建筑', founding_dynasty: '明', completed_dynasty: '明',
    protection_level: '世界文化遗产', brief_description: '天坛主体建筑，圆形攒尖顶建筑的代表',
    full_description: '祈年殿是北京天坛的主体建筑，为明清两代皇帝孟春祈谷之所。殿为圆形，象征天圆；瓦为蓝色，象征蓝天。',
    main_image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01',
    view_count: 9800, favorite_count: 2800
  },
  {
    architecture_id: 3, name: '佛光寺东大殿', chinese_name: '佛光寺东大殿',
    location: '山西五台', coordinates: null,
    type: '寺庙', founding_dynasty: '唐', completed_dynasty: '唐',
    protection_level: '全国重点文物保护单位', brief_description: '中国现存最早的木构建筑之一',
    full_description: '佛光寺东大殿建于唐大中十一年（857年），是中国现存最早的木构建筑之一，被梁思成称为"中国第一国宝"。',
    main_image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01',
    view_count: 6500, favorite_count: 2100
  },
  {
    architecture_id: 4, name: '晋祠圣母殿', chinese_name: '晋祠圣母殿',
    location: '山西太原', coordinates: null,
    type: '祭祀建筑', founding_dynasty: '北宋', completed_dynasty: '北宋',
    protection_level: '全国重点文物保护单位', brief_description: '宋代建筑的代表作',
    full_description: '圣母殿位于山西太原晋祠内，建于北宋天圣年间（1023-1032年），是晋祠的主体建筑。殿内43尊宋代彩塑侍女像为中国雕塑史上的精品。',
    main_image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01',
    view_count: 7200, favorite_count: 1900
  },
  {
    architecture_id: 5, name: '独乐寺观音阁', chinese_name: '独乐寺观音阁',
    location: '天津蓟州', coordinates: null,
    type: '寺庙', founding_dynasty: '辽', completed_dynasty: '辽',
    protection_level: '全国重点文物保护单位', brief_description: '中国现存最古老的阁楼式建筑',
    full_description: '独乐寺观音阁建于辽统和二年（984年），是中国现存最古老的阁楼式建筑。阁高23米，外观两层，内部三层。',
    main_image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01',
    view_count: 5400, favorite_count: 1600
  },
  {
    architecture_id: 6, name: '应县木塔', chinese_name: '佛宫寺释迦塔',
    location: '山西应县', coordinates: null,
    type: '塔', founding_dynasty: '辽', completed_dynasty: '辽',
    protection_level: '全国重点文物保护单位', brief_description: '世界现存最高最古的木塔',
    full_description: '应县木塔全称佛宫寺释迦塔，建于辽清宁二年（1056年），高67.31米，是世界现存最高最古的木塔。全塔耗材红松木料3000立方米，2600多吨。',
    main_image_url: null, created_at: '2024-01-01', updated_at: '2024-01-01',
    view_count: 8900, favorite_count: 2500
  }
];

export const mockHistorical = [
  { development_id: 1, architecture_id: 1, dynasty_period: '明永乐', start_year: 1406, end_year: 1420, development_title: '初建', development_content: '明成祖朱棣下令修建紫禁城，太和殿作为核心建筑动工。', architectural_changes: '采用最高等级建筑形制', historical_context: '迁都北京' },
  { development_id: 2, architecture_id: 1, dynasty_period: '清康熙', start_year: 1695, end_year: 1697, development_title: '重建', development_content: '康熙三十四年太和殿遭雷击焚毁，后按原样重建。', architectural_changes: '基本保持明代形制', historical_context: '康熙盛世' }
];

export const mockTechnical = [
  { structure_id: 1, architecture_id: 1, structure_name: '抬梁式构架', technical_category: '木构架', technical_description: '采用最高等级的抬梁式木构架', technical_principles: '榫卯连接', historical_value: '中国古代木构最高成就' },
  { structure_id: 2, architecture_id: 1, structure_name: '重檐庑殿顶', technical_category: '屋顶', technical_description: '中国古代建筑最高等级屋顶形制', technical_principles: '四面排水', historical_value: '皇家最高等级' }
];

export const mockFeatures = [
  { feature_id: 1, architecture_id: 1, feature_name: '面阔十一间', design_philosophy: '彰显皇权至高无上', spatial_organization: '面阔十一间，进深五间', aesthetic_characteristics: '气势磅礴，庄严肃穆' }
];

export const mockCultural = [
  { significance_id: 1, architecture_id: 1, significance_aspect: '皇权象征', philosophical_basis: '天人合一', cultural_interpretation: '太和殿是中国古代皇权的最高象征', social_influence: '影响东亚建筑文化', contemporary_value: '世界文化遗产' }
];

export const mockQuotes = [
  { quote_id: 1, architecture_id: 1, expert_name: '梁思成', expert_title: '建筑史学家', quote_content: '中国建筑之个性乃即我民族之性格。', source: null },
  { quote_id: 2, architecture_id: 1, expert_name: '林徽因', expert_title: '建筑师', quote_content: '建筑是全世界的语言。', source: null }
];

export const mockDynasties = [
  { dynasty_name: '先秦', start_year: -2070, end_year: -221, description: '夏商周时期' },
  { dynasty_name: '秦汉', start_year: -221, end_year: 220, description: '秦、西汉、东汉' },
  { dynasty_name: '魏晋南北朝', start_year: 220, end_year: 589, description: '三国、两晋、南北朝' },
  { dynasty_name: '隋唐', start_year: 581, end_year: 907, description: '隋、唐' },
  { dynasty_name: '宋', start_year: 960, end_year: 1279, description: '北宋、南宋' },
  { dynasty_name: '辽', start_year: 916, end_year: 1125, description: '辽朝' },
  { dynasty_name: '元', start_year: 1271, end_year: 1368, description: '元朝' },
  { dynasty_name: '明', start_year: 1368, end_year: 1644, description: '明朝' },
  { dynasty_name: '清', start_year: 1644, end_year: 1912, description: '清朝' }
];

export const mockCompetitionModes = [
  { mode_id: 'entry', title: '入门模式', description: '5道简单题目，适合初学者', difficulty: '入门', time_limit: 180, icon: '🌱', is_active: true, sort_order: 1 },
  { mode_id: 'basic', title: '基础模式', description: '8道基础题目，巩固知识', difficulty: '基础', time_limit: 240, icon: '📚', is_active: true, sort_order: 2 },
  { mode_id: 'challenge', title: '挑战模式', description: '10道中等难度题目', difficulty: '挑战', time_limit: 300, icon: '⚡', is_active: true, sort_order: 3 },
  { mode_id: 'advanced', title: '进阶模式', description: '12道较难题目，考验深度', difficulty: '进阶', time_limit: 360, icon: '🏛️', is_active: true, sort_order: 4 },
  { mode_id: 'expert', title: '专家模式', description: '15道高难度题目，大师挑战', difficulty: '资深', time_limit: 480, icon: '👑', is_active: true, sort_order: 5 }
];

export const mockQuestions = [
  { question_id: 1, external_building_id: 1, question_text: '中国现存最大的木结构大殿是？', option_a: '太和殿', option_b: '祈年殿', option_c: '佛光寺东大殿', option_d: '晋祠圣母殿', correct_answer: 'A', explanation: '太和殿俗称金銮殿，是中国现存最大的木结构大殿。', difficulty: '入门', points: 10, category: '宫殿' },
  { question_id: 2, external_building_id: 2, question_text: '天坛祈年殿的屋顶瓦片颜色是？', option_a: '黄色', option_b: '蓝色', option_c: '绿色', option_d: '红色', correct_answer: 'B', explanation: '祈年殿的瓦为蓝色，象征蓝天。', difficulty: '入门', points: 10, category: '祭祀建筑' },
  { question_id: 3, external_building_id: 3, question_text: '佛光寺东大殿建于哪个朝代？', option_a: '宋代', option_b: '唐代', option_c: '明代', option_d: '辽代', correct_answer: 'B', explanation: '佛光寺东大殿建于唐大中十一年（857年）。', difficulty: '入门', points: 10, category: '寺庙' },
  { question_id: 4, external_building_id: 4, question_text: '应县木塔的高度约为多少米？', option_a: '50米', option_b: '67米', option_c: '80米', option_d: '100米', correct_answer: 'B', explanation: '应县木塔高67.31米。', difficulty: '基础', points: 15, category: '塔' },
  { question_id: 5, external_building_id: 5, question_text: '中国古代建筑中最高等级的屋顶形式是？', option_a: '悬山顶', option_b: '硬山顶', option_c: '庑殿顶', option_d: '歇山顶', correct_answer: 'C', explanation: '庑殿顶是中国古代建筑最高等级的屋顶形式。', difficulty: '基础', points: 15, category: '屋顶' }
];

export const mockActivities = [
  { activity_id: 1, title: '古建筑摄影大赛', description: '分享你拍摄的中国古建筑照片', start_date: '2024-01-01', end_date: '2024-12-31', activity_type: '比赛', banner_url: null, reward_points: 500, max_participants: 1000, current_participants: 256, is_active: true, created_at: '2024-01-01' }
];

export const mockAchievements = [
  { achievement_id: 1, achievement_name: '初出茅庐', description: '完成首次知识竞赛', achievement_type: '竞赛', required_points: 0, required_actions: '{"games_played":1}', icon: '🌱', badge_url: null, created_at: '2024-01-01' },
  { achievement_id: 2, achievement_name: '建筑达人', description: '累计获得1000积分', achievement_type: '积分', required_points: 1000, required_actions: null, icon: '🏛️', badge_url: null, created_at: '2024-01-01' }
];

export const mockTemplates = [
  { template_id: 1, template_name: '三开间硬山顶民居', description: '典型的北方民居形式', category: '民居', building_type: '硬山顶', era: '明清', complexity_level: 1, thumbnail_url: null, template_structure: '{}', default_dimensions: null, is_featured: true, is_active: true, created_by: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { template_id: 2, template_name: '五开间歇山顶大殿', description: '寺庙正殿标准形制', category: '寺庙', building_type: '歇山顶', era: '唐宋', complexity_level: 3, thumbnail_url: null, template_structure: '{}', default_dimensions: null, is_featured: true, is_active: true, created_by: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { template_id: 3, template_name: '四角攒尖亭', description: '园林中常见的亭阁', category: '园林', building_type: '攒尖顶', era: '明清', complexity_level: 2, thumbnail_url: null, template_structure: '{}', default_dimensions: null, is_featured: true, is_active: true, created_by: null, created_at: '2024-01-01', updated_at: '2024-01-01' }
];

export const mockComponentDefs = [
  { definition_id: 1, type: 'pillar_round', category: 'pillar', name: '圆柱', description: '传统圆形木柱', dimensions: '{"x":0.3,"y":3,"z":0.3}', material: '木材', snap_points: null, era: '通用', complexity: '简单', tags: '承重', is_active: true, created_at: '2024-01-01' },
  { definition_id: 2, type: 'beam_main', category: 'beam', name: '主梁', description: '主要水平承重构件', dimensions: '{"x":4,"y":0.4,"z":0.3}', material: '木材', snap_points: null, era: '通用', complexity: '简单', tags: '承重', is_active: true, created_at: '2024-01-01' },
  { definition_id: 3, type: 'roof_hipped', category: 'roof', name: '歇山顶', description: '四坡屋顶', dimensions: '{"x":4,"y":1.5,"z":4}', material: '瓦', snap_points: null, era: '唐宋', complexity: '复杂', tags: '屋顶', is_active: true, created_at: '2024-01-01' }
];

export const mockLeaderboard = [
  { rank: 1, user_id: 1, username: 'user1', nickname: '建筑达人', avatar: null, total_points: 2580, current_level: 5, games_played: 32, accuracy: 85 },
  { rank: 2, user_id: 2, username: 'user2', nickname: '古建爱好者', avatar: null, total_points: 1920, current_level: 4, games_played: 24, accuracy: 78 },
  { rank: 3, user_id: 3, username: 'user3', nickname: '新手入门', avatar: null, total_points: 860, current_level: 2, games_played: 12, accuracy: 65 }
];
