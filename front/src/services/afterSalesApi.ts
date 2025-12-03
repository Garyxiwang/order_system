import api from './api';
import { getProductionOrders, type ProductionOrder } from './productionApi';

// 售后订单接口
export interface AfterSalesOrder {
  id?: number;
  order_number: string;
  customer_name: string;
  shipping_address: string; // 发货地址
  customer_phone: string; // 客户电话
  delivery_date?: string; // 送货日期
  installation_date?: string; // 安装日期
  is_completed: boolean; // 是否完工
  is_reorder?: boolean; // 是否补单
  after_sales_log?: string; // 售后日志
  external_purchase_details?: string; // 外购产品明细
  designer: string; // 设计师
  related_person?: string; // 相关人员（原拆单员）
  follow_up_issues?: string; // 回访问题
  is_installation?: boolean; // 是否安装
  after_sales_date?: string; // 售后时间
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
  relatedPerson?: string; // 相关人员（原splitter）
  installationDateStart?: string; // 安装日期开始
  installationDateEnd?: string; // 安装日期结束
  isCompleted?: boolean; // 是否完工
  isInstallation?: boolean; // 是否安装
  isReorder?: boolean; // 是否补单
  afterSalesDateStart?: string; // 售后时间开始
  afterSalesDateEnd?: string; // 售后时间结束
}

// 售后订单列表响应
export interface AfterSalesListResponse {
  items: AfterSalesOrder[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Mock数据存储（用于演示流程）
const mockAfterSalesOrders: AfterSalesOrder[] = [
  {
    id: 1,
    order_number: "GBB241015-05",
    customer_name: "白水绿色家-民族小区增补（浴室柜）",
    shipping_address: "白水",
    customer_phone: "13800138000",
    delivery_date: "2024-01-15",
    installation_date: "2024-01-20",
    is_completed: false,
    is_reorder: false,
    external_purchase_details: "石材:2025/07/01:3,板材:2025/07/01:2",
    designer: "设计师A",
    related_person: "拆单员B",
    is_installation: true,
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
  },
  {
    id: 2,
    order_number: "GBB241015-06",
    customer_name: "测试客户-补单测试",
    shipping_address: "北京市朝阳区",
    customer_phone: "13900139000",
    delivery_date: "2024-01-18",
    installation_date: "2024-01-25",
    is_completed: false,
    is_reorder: true,
    external_purchase_details: "单门板，木门，柜体",
    designer: "设计师B",
    related_person: "拆单员C",
    is_installation: true,
    created_at: "2024-01-12T00:00:00Z",
    updated_at: "2024-01-12T00:00:00Z",
  },
];

// 1. 安装订单列表查询 - 使用Mock数据
export const getAfterSalesOrders = async (
  params?: AfterSalesListParams
): Promise<AfterSalesListResponse> => {
  try {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 合并从生产管理获取的数据和mock数据
    const allOrders: AfterSalesOrder[] = [...mockAfterSalesOrders];

    // 从生产管理获取需要安装的订单（is_installation=true）
    try {
      const productionResponse = await getProductionOrders({
        page: params?.no_pagination ? 1 : params?.page || 1,
        page_size: params?.no_pagination ? 10000 : params?.pageSize || 10,
      });

      // 过滤出需要安装的订单
      const filteredProductionOrders = (productionResponse.data || []).filter(
        (order) => order.is_installation === true
      );

      // 转换为售后订单格式，并检查是否已存在于mock数据中
      filteredProductionOrders.forEach((prodOrder) => {
        const exists = allOrders.some(
          (order) => order.order_number === prodOrder.order_number
        );
        if (!exists) {
          allOrders.push({
            id: prodOrder.id,
            order_number: prodOrder.order_number,
            customer_name: prodOrder.customer_name,
            shipping_address: prodOrder.address || "",
            customer_phone: "",
            delivery_date: undefined,
            installation_date: undefined,
            is_completed: false,
            is_reorder: false,
            external_purchase_details: prodOrder.external_purchase_items || "",
            designer: "",
            related_person: prodOrder.splitter,
            is_installation: true,
            created_at: prodOrder.created_at,
            updated_at: prodOrder.updated_at,
          });
        }
      });
    } catch (error) {
      console.warn("从生产管理获取数据失败，仅使用mock数据:", error);
    }

    // 应用搜索过滤条件
    let filteredData = allOrders;

    if (params?.orderNumber) {
      filteredData = filteredData.filter((order) =>
        order.order_number.includes(params.orderNumber!)
      );
    }
    if (params?.customerName) {
      filteredData = filteredData.filter((order) =>
        order.customer_name.includes(params.customerName!)
      );
    }
    if (params?.relatedPerson) {
      filteredData = filteredData.filter(
        (order) => order.related_person === params.relatedPerson
      );
    }
    if (params?.designer) {
      filteredData = filteredData.filter(
        (order) => order.designer === params.designer
      );
    }
    if (params?.isCompleted !== undefined) {
      filteredData = filteredData.filter(
        (order) => order.is_completed === params.isCompleted
      );
    }
    if (params?.isInstallation !== undefined) {
      filteredData = filteredData.filter(
        (order) => order.is_installation === params.isInstallation
      );
    }
    if (params?.isReorder !== undefined) {
      filteredData = filteredData.filter(
        (order) => (order.is_reorder || false) === params.isReorder
      );
    }
    if (params?.installationDateStart || params?.installationDateEnd) {
      filteredData = filteredData.filter((order) => {
        if (!order.installation_date) return false;
        const installDate = new Date(order.installation_date);
        if (params.installationDateStart) {
          const startDate = new Date(params.installationDateStart);
          if (installDate < startDate) return false;
        }
        if (params.installationDateEnd) {
          const endDate = new Date(params.installationDateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (installDate > endDate) return false;
        }
        return true;
      });
    }

    // 分页处理
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
  } catch (error) {
    console.error("获取售后订单列表失败:", error);
    // 返回空数据
    return {
      items: [],
      total: 0,
      page: params?.page || 1,
      page_size: params?.pageSize || 10,
      total_pages: 0,
    };
  }
};

// 2. 新增售后订单 - POST /api/v1/after-sales/
// 注意：如果订单编号已存在，会先查找并更新，否则创建新记录
export const createAfterSalesOrder = async (
  order: Omit<AfterSalesOrder, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<AfterSalesOrder>> => {
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  // 检查是否已存在
  const existingIndex = mockAfterSalesOrders.findIndex(
    (item) => item.order_number === order.order_number
  );

  const now = new Date().toISOString();
  let resultOrder: AfterSalesOrder;

  if (existingIndex >= 0) {
    // 更新现有记录
    resultOrder = {
      ...mockAfterSalesOrders[existingIndex],
      ...order,
      updated_at: now,
    };
    mockAfterSalesOrders[existingIndex] = resultOrder;
  } else {
    // 创建新记录
    resultOrder = {
      ...order,
      id: Date.now(),
      created_at: now,
      updated_at: now,
    };
    mockAfterSalesOrders.push(resultOrder);
  }

  return {
    code: 200,
    message: '保存成功',
    data: resultOrder,
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
  // 模拟API延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  const orderId = parseInt(id);
  const index = mockAfterSalesOrders.findIndex((item) => item.id === orderId);

  if (index >= 0) {
    // 更新现有记录
    mockAfterSalesOrders[index] = {
      ...mockAfterSalesOrders[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return {
      code: 200,
      message: '更新成功',
      data: mockAfterSalesOrders[index],
    };
  } else {
    // 如果不存在，创建新记录
    const newOrder: AfterSalesOrder = {
      id: orderId,
      order_number: `ORDER-${orderId}`,
      customer_name: '',
      shipping_address: '',
      customer_phone: '',
      is_completed: false,
      designer: '',
      ...updates,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockAfterSalesOrders.push(newOrder);
    return {
      code: 200,
      message: '更新成功',
      data: newOrder,
    };
  }
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

