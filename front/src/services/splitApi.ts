// 拆单页面相关的API接口

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

// 获取拆单列表
export const getSplitOrders = async (): Promise<ApiResponse<SplitOrder[]>> => {
  try {
    const requestData = {
      page: 1,
      page_size: 100, // 暂时获取所有数据
    };

    const response = await fetch("/api/v1/splits/list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // 转换后端数据格式为前端期望的格式
    const transformedData = {
      code: 200,
      message: "获取成功",
      data: result.items || [],
    };

    return transformedData;
  } catch (error) {
    console.error("获取拆单列表失败:", error);
    return {
      code: 500,
      message: "获取拆单列表失败",
      data: [],
    };
  }
};

// 更新拆单状态
export const updateSplitStatus = async (
  splitId: number,
  updates: { order_status?: string; quote_status?: string; actual_payment_date?: string }
): Promise<ApiResponse<SplitOrder>> => {
  try {
    const response = await fetch(`/api/v1/splits/${splitId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  } catch (error) {
    console.error("更新拆单状态失败:", error);
    return {
      code: 500,
      message: "更新拆单状态失败",
      data: {} as SplitOrder,
    };
  }
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
  try {
    const response = await fetch(`/api/v1/splits/${splitId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return {
      code: 200,
      message: "更新成功",
      data: result,
    };
  } catch (error) {
    console.error("更新拆单信息失败:", error);
    return {
      code: 500,
      message: "更新拆单信息失败",
      data: {} as SplitOrder,
    };
  }
};
