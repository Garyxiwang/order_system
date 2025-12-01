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

// 1. 安装订单列表查询 - 从生产管理中获取 is_installation=true 的订单
export const getAfterSalesOrders = async (
  params?: AfterSalesListParams
): Promise<AfterSalesListResponse> => {
  try {
    // 从生产管理获取需要安装的订单（is_installation=true）
    const productionResponse = await getProductionOrders({
      page: params?.no_pagination ? 1 : params?.page || 1,
      page_size: params?.no_pagination ? 10000 : params?.pageSize || 10,
    });

    // 过滤出需要安装的订单
    let filteredProductionOrders = (productionResponse.data || []).filter(
      (order) => order.is_installation === true
    );

    // 应用搜索过滤条件
    if (params?.orderNumber) {
      filteredProductionOrders = filteredProductionOrders.filter((order) =>
        order.order_number.includes(params.orderNumber!)
      );
    }
    if (params?.customerName) {
      filteredProductionOrders = filteredProductionOrders.filter((order) =>
        order.customer_name.includes(params.customerName!)
      );
    }
    if (params?.splitter) {
      filteredProductionOrders = filteredProductionOrders.filter(
        (order) => order.splitter === params.splitter
      );
    }

    // 转换为安装订单格式
    // 注意：这里需要从实际的安装订单表获取已编辑的信息
    // 目前先使用生产管理的数据，后续需要合并安装订单表中的编辑信息
    const afterSalesOrders: AfterSalesOrder[] = filteredProductionOrders.map(
      (prodOrder) => ({
        id: prodOrder.id,
        order_number: prodOrder.order_number,
        customer_name: prodOrder.customer_name,
        shipping_address: prodOrder.address || "",
        customer_phone: "", // 需要从安装订单表获取
        delivery_date: undefined, // 需要从安装订单表获取
        installation_date: undefined, // 需要从安装订单表获取
        first_completion_date: undefined, // 需要从安装订单表获取
        is_completed: false, // 需要从安装订单表获取
        external_purchase_details: undefined, // 需要从安装订单表获取
        costs: undefined, // 需要从安装订单表获取
        designer: "", // 需要从安装订单表获取
        splitter: prodOrder.splitter,
      })
    );

    // 应用日期和完成状态过滤（这些字段需要从安装订单表获取）
    let finalFilteredData = afterSalesOrders;
    if (params?.isCompleted !== undefined) {
      // 暂时无法过滤，因为数据来自生产管理
      // finalFilteredData = finalFilteredData.filter(
      //   (item) => item.is_completed === params.isCompleted
      // );
    }
    if (params?.installationDateStart || params?.installationDateEnd) {
      // 暂时无法过滤，因为数据来自生产管理
      // 需要从安装订单表获取安装日期
    }

    // 分页处理
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = params?.no_pagination
      ? finalFilteredData
      : finalFilteredData.slice(start, end);

    return {
      items: paginatedData,
      total: finalFilteredData.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(finalFilteredData.length / pageSize),
    };
  } catch (error) {
    console.error("获取安装订单列表失败:", error);
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
  // 模拟数据 - 实际应该调用真实API
  // 实际应该先检查订单编号是否已存在，如果存在则更新，否则创建
  // return await api.post('/v1/after-sales/', order);
  
  // 模拟：检查是否已存在（在实际实现中，应该调用后端API检查）
  // 这里简化处理，直接创建新记录
  const newOrder: AfterSalesOrder = {
    ...order,
    id: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    code: 200,
    message: '保存成功',
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

