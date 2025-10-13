import api from "./api";

// 拆单进度项类型
export interface SplitProgressItem {
  id?: number;
  split_id: number;
  category_name: string;
  item_type: "internal" | "external";
  planned_date?: string;
  split_date?: string;
  purchase_date?: string;
  created_at?: string;
  updated_at?: string;
  remarks?: string;
}

// 批量更新拆单进度的请求数据
export interface BatchUpdateSplitProgressRequest {
  internalItems: Record<
    string,
    {
      plannedDate?: string;
      splitDate?: string;
    }
  >;
  externalItems: Record<
    string,
    {
      plannedDate?: string;
      purchaseDate?: string;
    }
  >;
}

// 拆单进度列表响应接口
export interface SplitProgressListResponse {
  items: SplitProgressItem[];
  total: number;
}

// 拆单进度API
export const splitProgressApi = {
  // 获取拆单的进度列表
  getProgressList: async (splitId: number): Promise<SplitProgressItem[]> => {
    const response: SplitProgressListResponse = await api.get(`/v1/split-progress/split/${splitId}`);
    return response.items;
  },

  // 通过订单号获取拆单进度列表
  getProgressByOrderNumber: async (orderNumber: string): Promise<SplitProgressItem[]> => {
    const response: SplitProgressListResponse = await api.get(`/v1/split-progress/order/${orderNumber}`);
    return response.items;
  },

  // 批量更新拆单进度
  batchUpdate: async (
    splitId: number,
    data: BatchUpdateSplitProgressRequest
  ): Promise<SplitProgressItem[]> => {
    return await api.post(`/v1/split-progress/split/${splitId}/batch`, data);
  },

  // 更新单个进度项
  updateProgress: async (
    progressId: number,
    data: Partial<SplitProgressItem>
  ): Promise<SplitProgressItem> => {
    return await api.put(`/v1/split-progress/${progressId}`, data);
  },

  // 删除进度项
  deleteProgress: async (progressId: number): Promise<void> => {
    return await api.delete(`/v1/split-progress/${progressId}`);
  },
};
