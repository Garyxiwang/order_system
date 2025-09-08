import api from './api';

// 设计订单接口
export interface DesignOrder {
  id?: number;
  order_number: string;
  customer_name: string;
  address: string;
  designer: string;
  salesperson: string;
  assignment_date: string;
  design_process: string; // 后端字段名为design_process
  progress?: string; // 兼容字段，用于显示
  category_name: string;
  order_type: string;
  design_cycle: string;
  order_date?: string;
  remarks: string;
  is_installation: boolean;
  order_amount?: string;
  cabinet_area?: string;
  wall_panel_area?: string;
  order_status: string;
}

// 进度管理接口
export interface Progress {
  id?: number;
  orderId: string;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 订单列表查询参数
export interface OrderListParams {
  page?: number;
  pageSize?: number;
  orderNumber?: string;
  customerName?: string;
  designer?: string;
  salesperson?: string;
  orderStatus?: string[];
  orderType?: string;
  designCycle?: string;
  orderCategory?: string[];
  startDate?: string;
  endDate?: string;
}

// 订单列表响应
export interface OrderListResponse {
  items: DesignOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 1. 订单列表查询 - GET /api/v1/orders/list
export const getDesignOrders = async (params?: OrderListParams): Promise<OrderListResponse> => {
  // 后端接口是POST方法，需要在请求体中传递参数
  const requestData = {
    page: params?.page || 1,
    page_size: params?.pageSize || 10,
    order_number: params?.orderNumber,
    customer_name: params?.customerName,
    designer: params?.designer,
    salesperson: params?.salesperson,
    order_status: params?.orderStatus,
    order_type: params?.orderType,
    design_cycle: params?.designCycle,
    category_names: params?.orderCategory,
    assignment_date_start: params?.startDate,
    assignment_date_end: params?.endDate,
  };
  
  // 过滤掉undefined的值，但保留page和page_size
  const filteredData: {
    page: number;
    page_size: number;
    [key: string]: string | number | string[] | undefined;
  } = {
    page: requestData.page,
    page_size: requestData.page_size
  };
  
  // 只添加非undefined的其他字段
  Object.entries(requestData).forEach(([key, value]) => {
    if (key !== 'page' && key !== 'page_size' && value !== undefined) {
      filteredData[key] = value;
    }
  });
  
  return await api.post('/v1/orders/list', filteredData);
};

// 2. 新增订单 - POST /api/v1/orders/
export const createDesignOrder = async (order: Omit<DesignOrder, 'orderNumber'>): Promise<ApiResponse<DesignOrder>> => {
  return await api.post('/v1/orders/', order);
};

// 3. 获取订单详情 - GET /api/v1/orders/{order_id}
export const getDesignOrderById = async (orderId: string): Promise<ApiResponse<DesignOrder>> => {
  return await api.get(`/v1/orders/${orderId}`);
};

// 4. 编辑订单 - PUT /api/v1/orders/{order_id}
export const updateDesignOrder = async (orderId: string, updates: Partial<DesignOrder>): Promise<ApiResponse<DesignOrder>> => {
  return await api.put(`/v1/orders/${orderId}`, updates);
};

// 5. 下单操作 - PATCH /api/v1/orders/{order_id}/status
export const updateOrderStatus = async (orderId: string, status: string): Promise<ApiResponse<DesignOrder>> => {
  return await api.patch(`/v1/orders/${orderId}/status`, { order_status: status });
};

// 进度管理相关接口

// 4.1 新增进度 - POST /api/v1/progress/
export const createProgress = async (progress: Omit<Progress, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Progress>> => {
  return await api.post('/v1/progress/', progress);
};

// 4.2 进度列表 - GET /api/v1/progress/{order_id}
export const getProgressList = async (orderId: string): Promise<ApiResponse<Progress[]>> => {
  return await api.get(`/v1/progress/${orderId}`);
};

// 4.3 编辑进度 - PUT /api/v1/progress/{progress_id}
export const updateProgress = async (progressId: number, updates: Partial<Progress>): Promise<ApiResponse<Progress>> => {
  return await api.put(`/v1/progress/${progressId}`, updates);
};

// 删除进度 - DELETE /api/v1/progress/{progress_id}
export const deleteProgress = async (progressId: number): Promise<ApiResponse<boolean>> => {
  return await api.delete(`/v1/progress/${progressId}`);
};

// 删除订单 - DELETE /api/v1/orders/{order_id}
export const deleteDesignOrder = async (orderId: string): Promise<ApiResponse<boolean>> => {
  return await api.delete(`/v1/orders/${orderId}`);
};

// 批量操作接口

// 批量更新订单状态
export const batchUpdateOrderStatus = async (orderIds: string[], status: string): Promise<ApiResponse<boolean>> => {
  return await api.put('/v1/orders/batch/status', { orderIds, status });
};

// 批量删除订单
export const batchDeleteOrders = async (orderIds: string[]): Promise<ApiResponse<boolean>> => {
  return await api.delete('/v1/orders/batch', { data: { orderIds } });
};

// 导出订单数据
export const exportOrders = async (params?: OrderListParams): Promise<Blob> => {
  return await api.get('/v1/orders/export', {
    params,
    responseType: 'blob'
  });
};

// 统计数据接口
export interface OrderStatistics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
}

// 获取统计数据
export const getOrderStatistics = async (): Promise<ApiResponse<OrderStatistics>> => {
  return await api.get('/v1/orders/statistics');
};
