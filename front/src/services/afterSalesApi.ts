import api from './api';

// 售后订单接口
export interface AfterSalesOrder {
  id?: number;
  order_number: string;
  customer_name: string;
  shipping_address: string; // 发货地址
  customer_phone: string; // 客户电话
  delivery_date?: string; // 送货日期
  installation_date?: string; // 安装日期
  first_completion_date?: string; // 首次完工日期
  is_completed: boolean; // 是否完工
  after_sales_log?: string; // 售后日志
  external_purchase_details?: string; // 外购产品明细
  remaining_issues?: string; // 遗留问题
  costs?: string; // 产生费用
  designer: string; // 设计师
  splitter?: string; // 拆单员
  follow_up_issues?: string; // 回访问题
  created_at?: string;
  updated_at?: string;
}

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 售后订单列表查询参数
export interface AfterSalesListParams {
  page?: number;
  pageSize?: number;
  no_pagination?: boolean;
  orderNumber?: string;
  customerName?: string;
  designer?: string;
  splitter?: string;
  installationDateStart?: string; // 安装日期开始
  installationDateEnd?: string; // 安装日期结束
  isCompleted?: boolean; // 是否完工
}

// 售后订单列表响应
export interface AfterSalesListResponse {
  items: AfterSalesOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 1. 售后订单列表查询 - POST /api/v1/after-sales/list
export const getAfterSalesOrders = async (
  params?: AfterSalesListParams
): Promise<AfterSalesListResponse> => {
  const requestData: Record<string, unknown> = {
    page: params?.page || 1,
    page_size: params?.pageSize || 10,
  };

  if (params?.orderNumber) requestData.order_number = params.orderNumber;
  if (params?.customerName) requestData.customer_name = params.customerName;
  if (params?.designer) requestData.designer = params.designer;
  if (params?.splitter) requestData.splitter = params.splitter;
  if (params?.installationDateStart)
    requestData.installation_date_start = params.installationDateStart;
  if (params?.installationDateEnd)
    requestData.installation_date_end = params.installationDateEnd;
  if (params?.isCompleted !== undefined)
    requestData.is_completed = params.isCompleted;
  if (params?.no_pagination) requestData.no_pagination = params.no_pagination;

  // 模拟数据 - 实际应该调用真实API
  // return await api.post('/v1/after-sales/list', requestData);
  
  // 返回模拟数据
  const mockData: AfterSalesOrder[] = [
    {
      id: 1,
      order_number: 'ORD001',
      customer_name: '客户A',
      shipping_address: '北京市朝阳区xxx',
      customer_phone: '13800138000',
      delivery_date: '2024-01-15',
      installation_date: '2024-01-20',
      first_completion_date: '2024-01-25',
      is_completed: true,
      after_sales_log: '已完成安装，客户满意',
      external_purchase_details: '外购配件A、配件B',
      remaining_issues: '无',
      costs: '500',
      designer: '设计师1',
      splitter: '拆单员1',
      follow_up_issues: '无',
    },
    {
      id: 2,
      order_number: 'ORD002',
      customer_name: '客户B',
      shipping_address: '上海市浦东新区xxx',
      customer_phone: '13900139000',
      delivery_date: '2024-02-10',
      installation_date: '2024-02-15',
      first_completion_date: '2024-02-20',
      is_completed: false,
      after_sales_log: '安装中，等待配件',
      external_purchase_details: '外购配件C',
      remaining_issues: '需要更换部分配件',
      costs: '300',
      designer: '设计师2',
      splitter: '拆单员2',
      follow_up_issues: '待回访',
    },
  ];

  const filteredData = mockData.filter((item) => {
    if (params?.orderNumber && !item.order_number.includes(params.orderNumber))
      return false;
    if (
      params?.customerName &&
      !item.customer_name.includes(params.customerName)
    )
      return false;
    if (params?.designer && item.designer !== params.designer) return false;
    if (params?.splitter && item.splitter !== params.splitter) return false;
    if (
      params?.isCompleted !== undefined &&
      item.is_completed !== params.isCompleted
    )
      return false;
    if (params?.installationDateStart && item.installation_date) {
      if (item.installation_date < params.installationDateStart) return false;
    }
    if (params?.installationDateEnd && item.installation_date) {
      if (item.installation_date > params.installationDateEnd) return false;
    }
    return true;
  });

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = params?.no_pagination
    ? filteredData
    : filteredData.slice(start, end);

  return {
    items: paginatedData,
    total: filteredData.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(filteredData.length / pageSize),
  };
};

// 2. 新增售后订单 - POST /api/v1/after-sales/
export const createAfterSalesOrder = async (
  order: Omit<AfterSalesOrder, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<AfterSalesOrder>> => {
  // 模拟数据 - 实际应该调用真实API
  // return await api.post('/v1/after-sales/', order);
  
  const newOrder: AfterSalesOrder = {
    ...order,
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    code: 200,
    message: '创建成功',
    data: newOrder,
  };
};

// 3. 获取售后订单详情 - GET /api/v1/after-sales/{id}
export const getAfterSalesOrderById = async (
  id: string
): Promise<ApiResponse<AfterSalesOrder>> => {
  // 模拟数据 - 实际应该调用真实API
  // return await api.get(`/v1/after-sales/${id}`);
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      id: parseInt(id),
      order_number: 'ORD001',
      customer_name: '客户A',
      shipping_address: '北京市朝阳区xxx',
      customer_phone: '13800138000',
      delivery_date: '2024-01-15',
      installation_date: '2024-01-20',
      first_completion_date: '2024-01-25',
      is_completed: true,
      after_sales_log: '已完成安装，客户满意',
      external_purchase_details: '外购配件A、配件B',
      remaining_issues: '无',
      costs: '500',
      designer: '设计师1',
      splitter: '拆单员1',
      follow_up_issues: '无',
    },
  };
};

// 4. 编辑售后订单 - PUT /api/v1/after-sales/{id}
export const updateAfterSalesOrder = async (
  id: string,
  updates: Partial<AfterSalesOrder>
): Promise<ApiResponse<AfterSalesOrder>> => {
  // 模拟数据 - 实际应该调用真实API
  // return await api.put(`/v1/after-sales/${id}`, updates);
  
  return {
    code: 200,
    message: '更新成功',
    data: {
      id: parseInt(id),
      ...updates,
    } as AfterSalesOrder,
  };
};

// 5. 删除售后订单 - DELETE /api/v1/after-sales/{id}
export const deleteAfterSalesOrder = async (
  id: string
): Promise<ApiResponse<boolean>> => {
  // 模拟数据 - 实际应该调用真实API
  // return await api.delete(`/v1/after-sales/${id}`);
  
  return {
    code: 200,
    message: '删除成功',
    data: true,
  };
};

