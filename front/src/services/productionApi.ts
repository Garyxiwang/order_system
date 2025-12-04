// 生产订单相关API

// 生产订单接口
export interface ProductionOrder {
  id: number;
  order_number: string; // 订单编号
  customer_name: string; // 客户名称
  address?: string; // 地址
  splitter?: string; // 拆单员
  is_installation: boolean; // 是否安装
  customer_payment_date?: string; // 客户打款日期
  split_order_date?: string; // 拆单下单日期
  order_days?: string; // 下单天数
  expected_delivery_date?: string; // 预计交货日期
  board_18?: string; // 18板
  board_09?: string; // 09板
  cutting_date?: string; // 下料日期
  expected_shipping_date?: string; // 预计出货日期
  actual_delivery_date?: string; // 实际出货日期
  internal_production_items?: string; // 厂内生产项
  external_purchase_items?: string; // 外购项
  remarks?: string; // 备注
  special_notes?: string; // 特殊情况
  designer?: string; // 设计师
  order_status: string; // 订单状态
  purchase_status?: string; // 采购状态
  finished_goods_quantity?: string; // 成品入库数量
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// 生产订单分页响应接口（匹配后端实际返回结构）
export interface ProductionListResponse {
  code: number;
  message: string;
  data: ProductionOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// 模拟数据
const mockProductionOrders: ProductionOrder[] = [
  {
    id: 1,
    order_number: "GBB241015-05",
    customer_name: "白水绿色家-民族小区增补（浴室柜）",
    address: "白水",
    splitter: "张三",
    is_installation: true,
    customer_payment_date: "2025-01-01",
    split_order_date: "2025-01-16",
    order_days: "15",
    expected_delivery_date: "2025-01-20",
    board_18: "62",
    board_09: "13",
    cutting_date: "",
    expected_shipping_date: "2024-02-15",
    actual_delivery_date: "2024-02-14",
    internal_production_items: "木门:2025/07/01:3,柜体:2025/07/03:10",
    external_purchase_items: "石材:2025/07/01:3,板材:2025/07/01:2",
    remarks: "客户要求加急",
    order_status: "未齐料",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

// 获取生产订单列表
export const getProductionOrders = async (params?: {
  page?: number;
  page_size?: number;
  order_number?: string;
  customer_name?: string;
  order_status?: string[];
}): Promise<ProductionListResponse> => {
  const queryParams = {
    page: 1,
    page_size: 10,
    ...params
  };

  const response = await fetch('/api/v1/productions/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(queryParams),
  });

  if (!response.ok) {
    throw new Error('获取生产订单列表失败');
  }

  const result = await response.json();
  return {
    code: result.code || 200,
    message: result.message || '获取成功',
    data: result.data || [],
    total: result.total || 0,
    page: result.page || 1,
    page_size: result.page_size || 10,
    total_pages: result.total_pages || 0,
  };
};

// 更新生产订单
export const updateProductionOrder = async (
  id: string,
  data: Partial<ProductionOrder>
): Promise<ApiResponse<ProductionOrder>> => {
  try {
    const response = await fetch(`/api/v1/productions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || '更新失败');
    }

    return {
      code: result.code || 200,
      message: result.message || '更新成功',
      data: result.data,
    };
  } catch (error) {
    console.error('更新生产订单失败:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '更新失败',
      data: {} as ProductionOrder,
    };
  }
};

// 搜索生产订单
export const searchProductionOrders = async (params: {
  orderCode?: string;
  customerName?: string;
}): Promise<ApiResponse<ProductionOrder[]>> => {
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 400));

  let filteredOrders = [...mockProductionOrders];

  if (params.orderCode) {
    filteredOrders = filteredOrders.filter((order) =>
      order.order_number.toLowerCase().includes(params.orderCode!.toLowerCase())
    );
  }

  if (params.customerName) {
    filteredOrders = filteredOrders.filter((order) =>
      order.customer_name
        .toLowerCase()
        .includes(params.customerName!.toLowerCase())
    );
  }

  return {
    code: 200,
    message: "搜索成功",
    data: filteredOrders,
  };
};
