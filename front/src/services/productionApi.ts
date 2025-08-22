// 生产订单相关API

// 生产订单接口
export interface ProductionOrder {
  id: string;
  orderCode: string; // 订单编码
  customerName: string; // 客户名称
  deliveryAddress: string; // 发货地址
  isInstallation: boolean; // 是否安装
  customerPaymentDate?: string; // 客户打款日期
  splitOrderDate?: string; // 拆单下单日期
  orderDays?: number; // 下单天数
  expectedDeliveryDate?: string; // 交货日期
  expectedMaterialDate?: string; // 预计齐料日期
  actualMaterialStatus?: string; // 实际齐料状况
  board18?: number; // 18板
  board09?: number; // 09板
  remarks?: string; // 备注
  doorBody?: string; // 门体
  external?: string; // 外部
  cuttingDate?: string; // 下料日期
  warehouseDate?: string; // 入库日期
  status: string; // 状态
  expectedShipmentDate?: string; // 预计出货日期
  actualShipmentDate?: string; // 实际出货日期
  shipmentStatus?: string; // 出货状态
}

// API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 模拟数据
const mockProductionOrders: ProductionOrder[] = [
  {
    id: "1",
    orderCode: "GBB241015-05",
    customerName: "白水绿色家-民族小区增补（浴室柜）",
    deliveryAddress: "白水",
    isInstallation: true,
    customerPaymentDate: "2025-01-01",
    splitOrderDate: "2025-01-16",
    orderDays: 15,
    expectedDeliveryDate: "2025-01-20",
    actualMaterialStatus: "木门:2025/07/01,柜体:",
    board18: 62,
    board09: 13,
    remarks: "客户要求加急",
    doorBody: "木门:2025/07/01:3,柜体:2025/07/03:10",
    external: "石材:2025/07/01:3,板材:2025/07/01:2",
    cuttingDate: "",
    warehouseDate: "2024-02-08",
    status: "未齐料",
    expectedShipmentDate: "2024-02-15",
    actualShipmentDate: "2024-02-14",
    shipmentStatus: "已发货",
  },
];

// 获取生产订单列表
export const getProductionOrders = async (): Promise<
  ApiResponse<ProductionOrder[]>
> => {
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    code: 200,
    message: "获取成功",
    data: mockProductionOrders,
  };
};

// 更新生产订单
export const updateProductionOrder = async (
  id: string,
  data: Partial<ProductionOrder>
): Promise<ApiResponse<ProductionOrder>> => {
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  const orderIndex = mockProductionOrders.findIndex((order) => order.id === id);
  if (orderIndex === -1) {
    return {
      code: 404,
      message: "订单不存在",
      data: {} as ProductionOrder,
    };
  }

  mockProductionOrders[orderIndex] = {
    ...mockProductionOrders[orderIndex],
    ...data,
  };

  return {
    code: 200,
    message: "更新成功",
    data: mockProductionOrders[orderIndex],
  };
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
      order.orderCode.toLowerCase().includes(params.orderCode!.toLowerCase())
    );
  }

  if (params.customerName) {
    filteredOrders = filteredOrders.filter((order) =>
      order.customerName
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
