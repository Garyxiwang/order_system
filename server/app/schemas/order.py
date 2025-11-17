from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# from app.schemas.category import CategoryResponse  # 不再需要
from app.schemas.progress import ProgressResponse
from app.utils.scheduler import calculate_design_cycle_days


class OrderBase(BaseModel):
    """订单基础模型"""
    order_number: str = Field(..., description="订单编号")
    customer_name: str = Field(..., description="客户名称")
    address: str = Field(..., description="地址")
    designer: Optional[str] = Field(None, description="设计师")
    salesperson: Optional[str] = Field(None, description="销售员")
    assignment_date: str = Field(..., description="分单日期")
    order_date: Optional[str] = Field(None, description="下单日期")
    category_name: str = Field(..., description="类目名称")
    order_type: str = Field(..., description="订单类型")
    cabinet_area: Optional[Decimal] = Field(None, description="柜体面积")
    wall_panel_area: Optional[Decimal] = Field(None, description="墙板面积")
    order_amount: Optional[Decimal] = Field(None, description="订单金额")
    is_installation: bool = Field(False, description="是否安装")
    remarks: Optional[str] = Field(None, description="备注")


class OrderCreate(OrderBase):
    """创建订单模型"""
    pass


class OrderUpdate(BaseModel):
    """更新订单模型"""
    order_number: Optional[str] = Field(None, description="订单编号")
    customer_name: Optional[str] = Field(None, description="客户名称")
    address: Optional[str] = Field(None, description="地址")
    designer: Optional[str] = Field(None, description="设计师")
    salesperson: Optional[str] = Field(None, description="销售员")
    assignment_date: Optional[str] = Field(None, description="分单日期")
    order_date: Optional[str] = Field(None, description="下单日期")
    category_name: Optional[str] = Field(None, description="类目名称")
    order_type: Optional[str] = Field(None, description="订单类型")
    cabinet_area: Optional[Decimal] = Field(None, description="柜体面积")
    wall_panel_area: Optional[Decimal] = Field(None, description="墙板面积")
    order_amount: Optional[Decimal] = Field(None, description="订单金额")
    is_installation: Optional[bool] = Field(None, description="是否安装")
    remarks: Optional[str] = Field(None, description="备注")


class OrderStatusUpdate(BaseModel):
    """订单状态更新模型"""
    order_status: str = Field(..., description="订单状态")


class OrderResponse(OrderBase):
    """订单响应模型"""
    id: int = Field(..., description="订单ID")
    design_cycle: str = Field("1", description="设计周期")
    order_status: str = Field(..., description="订单状态")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    # category: Optional[CategoryResponse] = Field(None, description="类目信息")  # 不再需要，直接使用category_name
    progresses: List[ProgressResponse] = Field(default=[], description="进度列表")
    
    @classmethod
    def from_orm(cls, obj):
        # 动态计算设计周期
        calculated_design_cycle = str(calculate_design_cycle_days(
            obj.assignment_date, 
            obj.order_date, 
            obj.order_status
        ))
            
        # 处理assignment_date字段的转换
        data = {
            'id': obj.id,
            'order_number': obj.order_number,
            'customer_name': obj.customer_name,
            'address': obj.address,
            'designer': obj.designer,
            'salesperson': obj.salesperson,
            'assignment_date': obj.assignment_date,
            'order_date': obj.order_date,
            'category_name': obj.category_name,
            'order_type': obj.order_type,
            'design_cycle': calculated_design_cycle,
            'cabinet_area': obj.cabinet_area,
            'wall_panel_area': obj.wall_panel_area,
            'order_amount': obj.order_amount,
            'is_installation': obj.is_installation,
            'remarks': obj.remarks,

            'order_status': obj.order_status,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
            'progresses': [ProgressResponse.from_orm(progress) for progress in obj.progresses]
        }
        return cls(**data)
    
    class Config:
        from_attributes = True


class OrderListItem(BaseModel):
    """订单列表项模型"""
    id: int = Field(..., description="订单ID")
    order_number: str = Field(..., description="订单编号")
    customer_name: str = Field(..., description="客户名称")
    address: str = Field(..., description="地址")
    designer: Optional[str] = Field(None, description="设计师")
    salesperson: Optional[str] = Field(None, description="销售员")
    splitter: Optional[str] = Field(None, description="拆单员")
    assignment_date: str = Field(..., description="分单日期")
    order_date: Optional[str] = Field(None, description="下单日期")
    design_cycle: Optional[str] = Field(None, description="设计周期")
    order_type: str = Field(..., description="订单类型")
    is_installation: bool = Field(..., description="是否安装")
    cabinet_area: Optional[Decimal] = Field(None, description="柜体面积")
    wall_panel_area: Optional[Decimal] = Field(None, description="墙板面积")
    order_amount: Optional[Decimal] = Field(None, description="订单金额")
    remarks: Optional[str] = Field(None, description="备注")
    order_status: str = Field(..., description="订单状态")
    quote_status: Optional[str] = Field(None, description="报价状态")
    category_name: Optional[str] = Field(None, description="类目名称")
    design_process: Optional[str] = Field(None, description="设计过程")
    
    class Config:
        from_attributes = True


class OrderListQuery(BaseModel):
    """订单列表查询模型"""
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(10, ge=1, le=100, description="每页数量")
    no_pagination: Optional[bool] = Field(False, description="是否不分页，获取所有数据")
    order_number: Optional[str] = Field(None, description="订单编号")
    customer_name: Optional[str] = Field(None, description="客户名称")
    designer: Optional[str] = Field(None, description="设计师")
    salesperson: Optional[str] = Field(None, description="销售员")
    splitter: Optional[str] = Field(None, description="拆单员")
    order_status: Optional[List[str]] = Field(None, description="订单状态（多选）")
    order_type: Optional[str] = Field(None, description="订单类型")
    quote_status: Optional[List[str]] = Field(None, description="报价状态（多选）")
    design_cycle_filter: Optional[str] = Field(None, description="设计周期筛选：lte20(小于等于20天)、gt20(大于20天)、lt50(小于50天)")
    category_names: Optional[List[str]] = Field(None, description="类目名称（多选）")
    assignment_date_start: Optional[str] = Field(None, description="分单日期开始")
    assignment_date_end: Optional[str] = Field(None, description="分单日期结束")
    order_date_start: Optional[str] = Field(None, description="下单日期开始")
    order_date_end: Optional[str] = Field(None, description="下单日期结束")
    # 新增：计划日期筛选
    planned_date_start: Optional[str] = Field(None, description="计划日期开始（设计过程中的计划日期）")
    planned_date_end: Optional[str] = Field(None, description="计划日期结束（设计过程中的计划日期）")
    # 新增：订单进度筛选（小程序使用）
    order_progress: Optional[List[str]] = Field(None, description="订单进度筛选（多选）：设计、拆单、生产，为空或包含全部时查询所有表并去重")
    # 新增：订单状态详情筛选（小程序使用，根据订单进度筛选对应的状态）
    order_status_detail: Optional[List[str]] = Field(None, description="订单状态详情筛选（多选）：根据订单进度筛选对应的状态列表")


class OrderListResponse(BaseModel):
    """订单列表响应模型"""
    items: List[OrderListItem] = Field(..., description="订单列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")