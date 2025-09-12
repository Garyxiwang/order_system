import api from "./api";

// 生产进度数据接口
export interface ProductionProgressData {
  id?: number;
  production_id: number;
  order_number: string;
  item_type: string;
  category_name: string;
  order_date?: string;
  expected_material_date?: string;
  actual_storage_date?: string;
  storage_time?: string;
  quantity?: string;
  expected_arrival_date?: string;
  actual_arrival_date?: string;
  created_at?: string;
  updated_at?: string;
}

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 获取生产进度列表
export const getProductionProgressList = async (
  productionId: number
): Promise<ProductionProgressData[]> => {
  return api.get(`/v1/production-progress/production/${productionId}`);
};

// 批量更新生产进度
export const batchUpdateProductionProgress = async (
  productionId: number,
  progressData: (Partial<ProductionProgressData> & { id: number })[]
): Promise<ProductionProgressData[]> => {
  return api.post(`/v1/production-progress/production/${productionId}/batch`, progressData);
};

// 更新单个进度项
export const updateProductionProgressItem = async (
  progressId: number,
  updates: Partial<Omit<ProductionProgressData, "id" | "production_id" | "order_number" | "created_at" | "updated_at">>
): Promise<ProductionProgressData> => {
  return api.put(`/v1/production-progress/${progressId}`, updates);
};

// 删除进度项
export const deleteProductionProgressItem = async (
  progressId: number
): Promise<{message: string}> => {
  return api.delete(`/v1/production-progress/${progressId}`);
};