// ============================================
// 筑见山河 - 前端API类型定义
// 引用共享类型库，确保前后端类型一致性
// ============================================

// 从共享类型库导入基础类型
export type { ApiResponse } from '@shared/types';

// 分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}
