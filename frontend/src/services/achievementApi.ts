// ============================================
// 华夏营造 - 成就管理API服务
// ============================================

import { http } from './api';
import type { 
  Achievement, 
  UserAchievement, 
  CreateAchievementRequest, 
  UpdateAchievementRequest,
  AchievementStats 
} from '@/types/achievements';

/**
 * 获取所有成就列表（管理员）
 */
export const getAchievements = async (): Promise<{ success: boolean; data: Achievement[] }> => {
  return http.get('/activities/achievements');
};

/**
 * 获取单个成就详情
 */
export const getAchievementById = async (id: number): Promise<{ success: boolean; data: Achievement }> => {
  return http.get(`/activities/achievements/${id}`);
};

/**
 * 创建新成就（管理员）
 */
export const createAchievement = async (
  data: CreateAchievementRequest
): Promise<{ success: boolean; data: Achievement }> => {
  return http.post('/activities/achievements', data);
};

/**
 * 更新成就（管理员）
 */
export const updateAchievement = async (
  id: number,
  data: UpdateAchievementRequest
): Promise<{ success: boolean; data: Achievement }> => {
  return http.put(`/activities/achievements/${id}`, data);
};

/**
 * 删除成就（管理员）
 */
export const deleteAchievement = async (id: number): Promise<{ success: boolean; message: string }> => {
  return http.delete(`/activities/achievements/${id}`);
};

/**
 * 获取当前用户的成就列表
 */
export const getUserAchievements = async (): Promise<{ success: boolean; data: UserAchievement[] }> => {
  return http.get('/activities/user-achievements');
};

/**
 * 获取用户成就进度
 */
export const getUserAchievementProgress = async (): Promise<{ success: boolean; data: any[] }> => {
  return http.get('/activities/user-achievements/progress');
};

/**
 * 获取成就统计数据
 */
export const getAchievementStats = async (): Promise<{ success: boolean; data: AchievementStats }> => {
  return http.get('/activities/achievements/stats');
};

/**
 * 解锁成就（内部使用）
 */
export const unlockAchievement = async (
  achievementId: number
): Promise<{ success: boolean; data: UserAchievement }> => {
  return http.post(`/activities/achievements/${achievementId}/unlock`);
};

/**
 * 批量导入成就（管理员）
 */
export const importAchievements = async (
  data: CreateAchievementRequest[]
): Promise<{ success: boolean; data: Achievement[]; failed?: string[] }> => {
  return http.post('/activities/achievements/import', data);
};

export const achievementApi = {
  getAchievements,
  getAchievementById,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getUserAchievements,
  getUserAchievementProgress,
  getAchievementStats,
  unlockAchievement,
  importAchievements
};
