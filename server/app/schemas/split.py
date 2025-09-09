from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProductionItem(BaseModel):
    """生产项模型"""
    category_name: str = Field(..., description="类目名称")
    planned_date: Optional[datetime] = Field(None, description="计划日期")
    actual_date: Optional[datetime] = Field(None, description="实际日期")
    status: Optional[str] = Field(None, description="状态")
    remarks: Optional[str] = Field(None, description="备注")


class SplitBase(BaseModel):
    """拆单基础模型"""
    order_number: str = Field(..., description="订单编号")
    splitter: Optional[str] = Field(None, description="拆单员")
    internal_production_items: Optional[List[ProductionItem]] = Field(None, description="厂内生产项")
    external_purchase_items: Optional[List[ProductionItem]] = Field(None, description="外购项")
    quote_status: Optional[str] = Field("未打款", description="报价状态")
    completion_date: Optional[datetime] = Field(None, description="完成日期")
    remarks: Optional[str] = Field(None, description="备注")


class SplitCreate(SplitBase):
    """创建拆单模型"""
    pass


class SplitUpdate(BaseModel):
    """更新拆单模型"""
    splitter: Optional[str] = Field(None, description="拆单员")
    internal_production_items: Optional[List[ProductionItem]] = Field(None, description="厂内生产项")
    external_purchase_items: Optional[List[ProductionItem]] = Field(None, description="外购项")
    remarks: Optional[str] = Field(None, description="备注")


class SplitProgressUpdate(BaseModel):
    """拆单进度更新模型"""
    item_type: str = Field(..., description="项目类型", pattern="^(internal|external)$")
    category_name: str = Field(..., description="类目名称")
    planned_date: Optional[datetime] = Field(None, description="计划日期")
    actual_date: Optional[datetime] = Field(None, description="实际日期")
    status: Optional[str] = Field(None, description="状态")
    remarks: Optional[str] = Field(None, description="备注")


class SplitStatusUpdate(BaseModel):
    """拆单状态更新模型"""
    order_status: Optional[str] = Field(None, description="订单状态")
    quote_status: Optional[str] = Field(None, description="报价状态")
    actual_payment_date: Optional[str] = Field(None, description="实际打款日期")


class SplitListQuery(BaseModel):
    """拆单列表查询模型"""
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(10, ge=1, le=100, description="每页数量")
    order_number: Optional[str] = Field(None, description="订单编号")
    customer_name: Optional[str] = Field(None, description="客户名称")
    designer: Optional[str] = Field(None, description="设计师")
    salesperson: Optional[str] = Field(None, description="销售员")
    splitter: Optional[str] = Field(None, description="拆单员")
    order_status: Optional[List[str]] = Field(None, description="订单状态（多选）")
    order_type: Optional[str] = Field(None, description="订单类型")
    quote_status: Optional[List[str]] = Field(None, description="报价状态（多选）")
    category_names: Optional[List[str]] = Field(None, description="下单类目（多选）")
    order_date_start: Optional[datetime] = Field(None, description="下单日期开始")
    order_date_end: Optional[datetime] = Field(None, description="下单日期结束")
    completion_date_start: Optional[datetime] = Field(None, description="完成日期开始")
    completion_date_end: Optional[datetime] = Field(None, description="完成日期结束")


class SplitResponse(BaseModel):
    """拆单响应模型"""
    id: int
    order_number: str
    customer_name: str
    address: str
    order_date: Optional[datetime]
    designer: Optional[str]
    salesperson: Optional[str]
    order_amount: Optional[float]
    cabinet_area: Optional[float]
    wall_panel_area: Optional[float]
    order_type: str
    order_status: str
    splitter: Optional[str]
    internal_production_items: Optional[List[ProductionItem]]
    external_purchase_items: Optional[List[ProductionItem]]
    quote_status: str
    completion_date: Optional[datetime]
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SplitListResponse(BaseModel):
    """拆单列表响应模型"""
    items: List[SplitResponse]
    total: int
    page: int
    page_size: int
    total_pages: int