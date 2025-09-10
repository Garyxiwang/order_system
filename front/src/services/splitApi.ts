// 拆单页面相关的API接口
import api from './api';

export interface SplitOrder {
  id: number;
  order_number: string; // 对应 designNumber
  customer_name: string; // 对应 customerName
  address: string;
  order_date: string; // 对应 createTime
  designer: string;
  salesperson: string; // 对应 salesPerson
  splitter?: string; // 对应 splitPerson
  internal_production_items?: ProductionItem[]; // 对应 doorBody
  external_purchase_items?: ProductionItem[]; // 对应 external
  quote_status: string; // 对应 priceState
  completion_date?: string; // 对应 finishTime
  order_type: string; // 对应 orderType
  order_status: string; // 对应 states
  remarks?: string; // 对应 remark
  cabinet_area?: number; // 柜体面积
  wall_panel_area?: number; // 墙板面积
  order_amount?: number; // 对应 orderAmount
  created_at: string;
  updated_at: string;
}

export interface ProductionItem {
  category_name: string;
  planned_date?: string;
  actual_date?: string;
}

// API响应接口
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 拆单列表响应接口
interface SplitListResponse {
  items: SplitOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 获取拆单列表
export const getSplitOrders = async (): Promise<SplitListResponse> => {
  const requestData = {
    page: 1,
    page_size: 100, // 暂时获取所有数据
  };

  return await api.post('/v1/splits/list', requestData);
};

// 更新拆单状态
export const updateSplitStatus = async (
  splitId: number,
  updates: { order_status?: string; quote_status?: string; actual_payment_date?: string }
): Promise<ApiResponse<SplitOrder>> => {
  return await api.put(`/v1/splits/${splitId}/status`, updates);
};

// 更新拆单信息
export const updateSplitOrder = async (
  splitId: number,
  updates: {
    splitter?: string;
    internal_production_items?: ProductionItem[];
    external_purchase_items?: ProductionItem[];
    remarks?: string;
  }
): Promise<ApiResponse<SplitOrder>> => {
  return await api.put(`/v1/splits/${splitId}`, updates);
};
