// ============================================
// 华夏营造 - 成就系统类型定义
// ============================================

/**
 * 成就实体
 */
export interface Achievement {
  achievement_id: number;
  name: string;
  description: string;
  icon: string; // emoji 或图片路径
  condition_type: AchievementConditionType;
  condition_value: number;
  points: number; // 获得的积分
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 用户成就记录
 */
export interface UserAchievement {
  user_achievement_id: number;
  user_id: number;
  achievement_id: number;
  achievement: Achievement;
  unlocked_at: string;
  progress?: number; // 当前进度（如果条件是累积类型）
}

/**
 * 成就条件类型
 */
export type AchievementConditionType = 
  | 'quiz_first' // 首次答题
  | 'quiz_count' // 答题次数
  | 'quiz_score' // 答题得分
  | 'favorites_count' // 收藏数量
  | 'model_upload' // 上传模型
  | 'model_download' // 下载模型
  | 'community_post' // 社区发帖
  | 'community_like' // 获得点赞
  | 'points_total' // 累计积分
  | 'days_active' // 活跃天数
  | 'invite_friend' // 邀请好友
  | 'check_in' // 签到次数
  | 'architecture_view' // 浏览建筑数量
  | 'architecture_collect' // 收藏建筑

/**
 * 创建成就请求
 */
export interface CreateAchievementRequest {
  name: string;
  description: string;
  icon: string;
  condition_type: AchievementConditionType;
  condition_value: number;
  points: number;
  is_active?: boolean;
}

/**
 * 更新成就请求
 */
export interface UpdateAchievementRequest {
  name?: string;
  description?: string;
  icon?: string;
  condition_type?: AchievementConditionType;
  condition_value?: number;
  points?: number;
  is_active?: boolean;
}

/**
 * 成就统计数据
 */
export interface AchievementStats {
  total_count: number;
  active_count: number;
  unlocked_count: number;
  locked_count: number;
}

/**
 * 成就分类
 */
export interface AchievementCategory {
  id: string;
  name: string;
  icon: string;
  achievements: Achievement[];
}
