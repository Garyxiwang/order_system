// 设计页面模拟API服务

export interface DesignOrder {
  orderNumber: string;
  customerName: string;
  address: string;
  designer: string;
  salesperson: string;
  splitTime: string;
  progress: string;
  category: string;
  cycle: string;
  state: string;
  orderType: string;
  remark: string;
  finishTime?: string;
}

// 模拟设计订单数据
const mockDesignData: DesignOrder[] = [
  {
    orderNumber: "D2024-022",
    customerName: "榆林古城店-段总别墅",
    address: "西安",
    designer: "张设计师",
    salesperson: "王销售员",
    splitTime: "2024-07-20",
    progress: "",
    category: "木门",
    cycle: "1",
    state: "进行中",
    orderType: "设计单",
    remark: "",
    finishTime: "",
  },
  {
    orderNumber: "D2024-001",
    customerName: "计翠艳-甘肃庆阳宏都雅居马小伟",
    address: "西安",
    designer: "张设计师",
    salesperson: "王销售员",
    splitTime: "2024-06-20",
    progress: "量尺:2025/07/11,初稿,已报价未打款",
    category: "木门,柜体,石材",
    cycle: "70",
    state: "进行中",
    orderType: "设计单",
    remark: "这个是一个备注",
    finishTime: "",
  },
  {
    orderNumber: "D2024-002",
    customerName: "县佳宁-天宝名都1号楼2108",
    address: "西安",
    designer: "张设计师",
    salesperson: "王销售员",
    splitTime: "2024-07-20",
    progress: "量尺:2025/07/11,初稿:2025/07/20,已报价未打款:2025/08/20",
    category: "木门,柜体,石材,板材",
    cycle: "21",
    state: "已下单",
    orderType: "设计单",
    remark:
      "一个很长很长很长很长很很长很长很很长很长很很长很长很很长很长很很长很长很很长很长很长很长很长很长的备注",
    finishTime: "2024-07-30",
  },
  {
    orderNumber: "D2024-001",
    customerName: "计翠艳-甘肃庆阳宏都雅居马小伟",
    address: "西安",
    designer: "张设计师",
    salesperson: "王销售员",
    splitTime: "2024-06-20",
    progress: "量尺,初稿,已报价未打款",
    category: "木门,柜体,石材",
    cycle: "70",
    state: "暂停",
    orderType: "设计单",
    remark: "这个是一个备注",
    finishTime: "2024-07-30",
  },
];

// 模拟API响应接口
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 模拟网络延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 获取设计订单列表
export const getDesignOrders = async (): Promise<
  ApiResponse<DesignOrder[]>
> => {
  await delay(300); // 模拟网络延迟

  return {
    code: 200,
    message: "获取成功",
    data: mockDesignData,
  };
};

// 根据订单号获取单个设计订单
export const getDesignOrderById = async (
  orderNumber: string
): Promise<ApiResponse<DesignOrder | null>> => {
  await delay(200);

  const order = mockDesignData.find((item) => item.orderNumber === orderNumber);

  return {
    code: 200,
    message: order ? "获取成功" : "订单不存在",
    data: order || null,
  };
};

// 创建设计订单
export const createDesignOrder = async (
  order: Omit<DesignOrder, "orderNumber">
): Promise<ApiResponse<DesignOrder>> => {
  await delay(500);

  const newOrder: DesignOrder = {
    ...order,
    orderNumber: `D2024-${String(mockDesignData.length + 1).padStart(3, "0")}`,
  };

  mockDesignData.push(newOrder);

  return {
    code: 200,
    message: "创建成功",
    data: newOrder,
  };
};

// 更新设计订单
export const updateDesignOrder = async (
  orderNumber: string,
  updates: Partial<DesignOrder>
): Promise<ApiResponse<DesignOrder | null>> => {
  await delay(400);

  const index = mockDesignData.findIndex(
    (item) => item.orderNumber === orderNumber
  );

  if (index === -1) {
    return {
      code: 404,
      message: "订单不存在",
      data: null,
    };
  }

  mockDesignData[index] = { ...mockDesignData[index], ...updates };

  return {
    code: 200,
    message: "更新成功",
    data: mockDesignData[index],
  };
};

// 删除设计订单
export const deleteDesignOrder = async (
  orderNumber: string
): Promise<ApiResponse<boolean>> => {
  await delay(300);

  const index = mockDesignData.findIndex(
    (item) => item.orderNumber === orderNumber
  );

  if (index === -1) {
    return {
      code: 404,
      message: "订单不存在",
      data: false,
    };
  }

  mockDesignData.splice(index, 1);

  return {
    code: 200,
    message: "删除成功",
    data: true,
  };
};
