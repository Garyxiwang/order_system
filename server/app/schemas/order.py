from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus, OrderType, DesignCycle
# from app.schemas.category import CategoryResponse  # 不再需要
from app.schemas.progress import ProgressResponse


class OrderBase(BaseModel):
    """订单基础模型"""
    order_number: str = Field(..., description="订单编号")
    customer_name: str = Field(..., description="客户名称")
    address: str = Field(..., description="地址")
    designer: str = Field(..., description="设计师")
    salesperson: str = Field(..., description="销售员")
    assignment_date: datetime = Field(..., description="分单日期")
    order_date: datetime = Field(..., description="下单日期")
    category_name: str = Field(..., description="类目名称")
    order_type: OrderType = Field(..., description="订单类型")
    design_cycle: DesignCycle = Field(..., description="设计周期")
    cabinet_area: Optional[Decimal] = Field(None, description="柜体面积")
    wall_panel_area: Optional[Decimal] = Field(None, description="墙板面积")
    order_amount: Decimal = Field(..., description="订单金额")
    is_installation: bool = Field(False, description="是否安装")
    remarks: Optional[str] = Field(None, description="备注")


class OrderCreate(OrderBase):
    """创建订单模型"""
    pass


class OrderUpdate(BaseModel):
    """更新订单模型"""
    customer_name: Optional[str] = Field(None, description="客户名称")
    address: Optional[str] = Field(None, description="地址")
    designer: Optional[str] = Field(None, description="设计师")
    salesperson: Optional[str] = Field(None, description="销售员")
    assignment_date: Optional[datetime] = Field(None, description="分单日期")
    order_date: Optional[datetime] = Field(None, description="下单日期")
    category_name: Optional[str] = Field(None, description="类目名称")
    order_type: Optional[OrderType] = Field(None, description="订单类型")
    design_cycle: Optional[DesignCycle] = Field(None, description="设计周期")
    cabinet_area: Optional[Decimal] = Field(None, description="柜体面积")
    wall_panel_area: Optional[Decimal] = Field(None, description="墙板面积")
    order_amount: Optional[Decimal] = Field(None, description="订单金额")
    is_installation: Optional[bool] = Field(None, description="是否安装")
    remarks: Optional[str] = Field(None, description="备注")


class OrderStatusUpdate(BaseModel):
    """订单状态更新模型"""
    order_status: OrderStatus = Field(..., description="订单状态")


class OrderResponse(OrderBase):
    """订单响应模型"""
    id: int = Field(..., description="订单ID")
    design_area: Optional[Decimal] = Field(None, description="设计面积")
    order_status: OrderStatus = Field(..., description="订单状态")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    # category: Optional[CategoryResponse] = Field(None, description="类目信息")  # 不再需要，直接使用category_name
    progresses: List[ProgressResponse] = Field(default=[], description="进度列表")
    
    class Config:
        from_attributes = True


class OrderListItem(BaseModel):
    """订单列表项模型"""
    id: int = Field(..., description="订单ID")
    order_number: str = Field(..., description="订单编号")
    customer_name: str = Field(..., description="客户名称")
    address: str = Field(..., description="地址")
    designer: str = Field(..., description="设计师")
    salesperson: str = Field(..., description="销售员")
    assignment_date: datetime = Field(..., description="分单日期")
    order_date: datetime = Field(..., description="下单日期")
    design_cycle: DesignCycle = Field(..., description="设计周期")
    order_type: OrderType = Field(..., description="订单类型")
    is_installation: bool = Field(..., description="是否安装")
    design_area: Optional[Decimal] = Field(None, description="设计面积")
    order_amount: Decimal = Field(..., description="订单金额")
    remarks: Optional[str] = Field(None, description="备注")
    order_status: OrderStatus = Field(..., description="订单状态")
    category_name: Optional[str] = Field(None, description="类目名称")
    design_process: Optional[str] = Field(None, description="设计过程")
    
    class Config:
        from_attributes = True


class OrderListQuery(BaseModel):
    """订单列表查询模型"""
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(10, ge=1, le=100, description="每页数量")
    order_number: Optional[str] = Field(None, description="订单编号")
    customer_name: Optional[str] = Field(None, description="客户名称")
    designer: Optional[str] = Field(None, description="设计师")
    salesperson: Optional[str] = Field(None, description="销售员")
    order_status: Optional[List[OrderStatus]] = Field(None, description="订单状态（多选）")
    order_type: Optional[OrderType] = Field(None, description="订单类型")
    design_cycle: Optional[DesignCycle] = Field(None, description="设计周期")
    category_names: Optional[List[str]] = Field(None, description="类目名称（多选）")
    assignment_date_start: Optional[datetime] = Field(None, description="分单日期开始")
    assignment_date_end: Optional[datetime] = Field(None, description="分单日期结束")
    order_date_start: Optional[datetime] = Field(None, description="下单日期开始")
    order_date_end: Optional[datetime] = Field(None, description="下单日期结束")


class OrderListResponse(BaseModel):
    """订单列表响应模型"""
    items: List[OrderListItem] = Field(..., description="订单列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")