// 拆单页面相关的API接口
import api from "./api";

export interface SplitOrder {
  id: number;
  order_number: string; // 对应 designNumber
  customer_name: string; // 对应 customerName
  address: string;
  order_date: string; // 对应 createTime
  designer: string;
  salesperson: string; // 对应 salesPerson
  splitter?: string; // 对应 splitPerson
  internal_production_items?: ProductionItem[] | string; // 对应 doorBody，支持数组或字符串格式
  external_purchase_items?: ProductionItem[] | string; // 对应 external，支持数组或字符串格式
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
  cycle_days?: string;
}

// 搜索参数接口
export interface SplitListParams {
  orderNumber?: string;
  customerName?: string;
  designer?: string;
  salesperson?: string;
  splitter?: string;
  orderStatus?: string[];
  quoteStatus?: string[];
  orderType?: string;
  orderCategory?: string[];
  startDate?: string;
  endDate?: string;
  orderDateStart?: string;
  orderDateEnd?: string;
  page?: number;
  pageSize?: number;
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
export const getSplitOrders = async (
  params?: SplitListParams
): Promise<SplitListResponse> => {
  // 将前端参数名映射为后端期望的参数名
  const requestData: Record<string, unknown> = {
    page: params?.page || 1,
    page_size: params?.pageSize || 10,
  };

  // 映射搜索参数
  if (params?.orderNumber) requestData.order_number = params.orderNumber;
  if (params?.customerName) requestData.customer_name = params.customerName;
  if (params?.designer) requestData.designer = params.designer;
  if (params?.salesperson) requestData.salesperson = params.salesperson;
  if (params?.splitter) requestData.splitter = params.splitter;
  if (params?.orderStatus) requestData.order_status = params.orderStatus;
  if (params?.quoteStatus) requestData.quote_status = params.quoteStatus;
  if (params?.orderType) requestData.order_type = params.orderType;
  if (params?.orderCategory) requestData.category_names = params.orderCategory;
  if (params?.orderDateStart)
    requestData.order_date_start = params.orderDateStart;
  if (params?.orderDateEnd) requestData.order_date_end = params.orderDateEnd;
  if (params?.startDate) requestData.completion_date_start = params.startDate;
  if (params?.endDate) requestData.completion_date_end = params.endDate;

  return await api.post("/v1/splits/list", requestData);
};

// 更新拆单状态
export const updateSplitStatus = async (
  splitId: number,
  updates: {
    order_status?: string;
    quote_status?: string;
    actual_payment_date?: string;
  }
): Promise<ApiResponse<SplitOrder>> => {
  return await api.put(`/v1/splits/${splitId}/status`, updates);
};

// 更新拆单信息
export const updateSplitOrder = async (
  splitId: number,
  updates: {
    splitter?: string;
    production_items?: ProductionItem[];
    remarks?: string;
  }
): Promise<ApiResponse<SplitOrder>> => {
  return await api.put(`/v1/splits/${splitId}`, updates);
};

// 拆单下单
export const placeSplitOrder = async (splitId: number): Promise<SplitOrder> => {
  return await api.put(`/v1/splits/${splitId}/place-order`);
};
