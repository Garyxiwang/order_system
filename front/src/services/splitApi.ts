// 拆单页面相关的API接口

export interface SplitOrder {
  designNumber: string;
  customerName: string;
  address: string;
  createTime: string;
  designer: string;
  salesPerson: string;
  splitPerson: string;
  doorBody: string;
  external: string;
  priceState: string;
  fixedTime: string;
  finishTime: string;
  orderType: string;
  states: string;
  remark: string;
}

// 模拟拆单数据
const mockSplitData: SplitOrder[] = [
  {
    designNumber: "D2024-022",
    customerName: "西安钻石店-济人名仕苑2-1-2101",
    address: "西安",
    createTime: "2024-07-20",
    designer: "张三",
    salesPerson: "李四",
    splitPerson: "",
    doorBody: "木门:2025/07/01:3,柜体",
    external: "石材:2025/07/01:3,板材:2025/07/01:2",
    priceState: "报价已发未打款",
    fixedTime: "2024-07-20",
    finishTime: "2024-07-30",
    orderType: "设计单",
    states: "拆单中",
    remark: "这个是一个备注",
  },
  {
    designNumber: "D2024-023",
    customerName: "潘朝龙-白桦林悦8-2-1501",
    address: "西安",
    createTime: "2024-07-20",
    designer: "张三",
    salesPerson: "李四",
    splitPerson: "拆单员A",
    doorBody: "木门:2025/07/01:3,柜体:2025/07/03:10",
    external: "石材:2025/07/01:3,板材:2025/07/01:2",
    priceState: "",
    fixedTime: "2024-07-20",
    finishTime: "2024-07-30",
    orderType: "设计单",
    states: "已完成",
    remark: "这个是一个备注",
  },
  {
    designNumber: "D2024-024",
    customerName: "计翠艳-甘肃庆阳长兴苑张先生",
    address: "西安",
    createTime: "2024-07-20",
    designer: "张三",
    salesPerson: "李四",
    splitPerson: "",
    doorBody: "木门:,柜体:",
    external: "石材:,板材:",
    priceState: "",
    fixedTime: "",
    finishTime: "",
    orderType: "设计单",
    states: "未开始",
    remark: "",
  },
];

// API响应接口
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 获取拆单列表
export const getSplitOrders = async (): Promise<ApiResponse<SplitOrder[]>> => {
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    code: 200,
    message: "获取成功",
    data: mockSplitData,
  };
};

// 创建拆单
export const createSplitOrder = async (order: Omit<SplitOrder, 'designNumber'>): Promise<ApiResponse<SplitOrder>> => {
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const newOrder: SplitOrder = {
    ...order,
    designNumber: `D2024-${String(Date.now()).slice(-3)}`,
  };
  
  mockSplitData.push(newOrder);
  
  return {
    code: 200,
    message: "创建成功",
    data: newOrder,
  };
};

// 更新拆单
export const updateSplitOrder = async (designNumber: string, updates: Partial<SplitOrder>): Promise<ApiResponse<SplitOrder>> => {
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const index = mockSplitData.findIndex(order => order.designNumber === designNumber);
  
  if (index === -1) {
    return {
      code: 404,
      message: "订单不存在",
      data: {} as SplitOrder,
    };
  }
  
  mockSplitData[index] = { ...mockSplitData[index], ...updates };
  
  return {
    code: 200,
    message: "更新成功",
    data: mockSplitData[index],
  };
};

// 删除拆单
export const deleteSplitOrder = async (designNumber: string): Promise<ApiResponse<null>> => {
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const index = mockSplitData.findIndex(order => order.designNumber === designNumber);
  
  if (index === -1) {
    return {
      code: 404,
      message: "订单不存在",
      data: null,
    };
  }
  
  mockSplitData.splice(index, 1);
  
  return {
    code: 200,
    message: "删除成功",
    data: null,
  };
};