import api from "./api";

// 进度数据接口
export interface ProgressData {
  id?: number;
  task_item: string;
  planned_date: string;
  actual_date?: string;
  remarks?: string;
  order_id: string;
  order_number?: string;
  created_at?: string;
  updated_at?: string;
}

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 进度列表响应接口
export interface ProgressListResponse {
  items: ProgressData[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 新增进度
export const createProgress = async (
  progressData: Omit<ProgressData, "id" | "created_at" | "updated_at">
): Promise<ApiResponse<ProgressData>> => {
  return api.post("/v1/progress/", progressData);
};

// 获取进度列表
export const getProgressList = async (params?: {
  page?: number;
  page_size?: number;
  order_id?: string;
  order_name?: string;
}): Promise<ProgressListResponse> => {
  return api.get("/v1/progress/list", { params });
};

// 编辑进度
export const updateProgress = async (
  progressId: number,
  updates: Partial<ProgressData>
): Promise<ApiResponse<ProgressData>> => {
  return api.put(`/v1/progress/${progressId}`, updates);
};

// 根据订单ID获取进度详情
export const getProgressByOrderId = async (
  orderId: string
): Promise<ApiResponse<ProgressListResponse>> => {
  const requestData = {
    order_id: orderId,
    page: 1,
    page_size: 100,
  };
  // 直接返回后端响应，保持数据结构一致
  return await api.post("/v1/progress/list", requestData);
};

// 删除进度记录
export const deleteProgress = async (
  progressId: number
): Promise<ApiResponse<boolean>> => {
  return api.delete(`/v1/progress/${progressId}`);
};
