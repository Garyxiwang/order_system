from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProductionListQuery(BaseModel):
    """生产管理列表查询参数"""
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=10, ge=1, le=100, description="每页数量")
    
    # 搜索条件
    order_number: Optional[str] = Field(default=None, description="订单编号")
    customer_name: Optional[str] = Field(default=None, description="客户名称")
    order_status: Optional[List[str]] = Field(default=None, description="订单状态（多选）")
    
    # 日期区间搜索
    expected_delivery_start: Optional[str] = Field(default=None, description="预计交货日期开始")
    expected_delivery_end: Optional[str] = Field(default=None, description="预计交货日期结束")
    cutting_date_start: Optional[str] = Field(default=None, description="下料日期开始")
    cutting_date_end: Optional[str] = Field(default=None, description="下料日期结束")
    expected_shipment_start: Optional[str] = Field(default=None, description="预计出货日期开始")
    expected_shipment_end: Optional[str] = Field(default=None, description="预计出货日期结束")
    actual_shipment_start: Optional[str] = Field(default=None, description="实际出货日期开始")
    actual_shipment_end: Optional[str] = Field(default=None, description="实际出货日期结束")


class ProductionListItem(BaseModel):
    """生产管理列表项"""
    id: int
    order_number: str
    customer_name: str
    address: Optional[str]
    splitter: Optional[str]
    is_installation: bool
    customer_payment_date: Optional[str]
    split_order_date: Optional[str]
    internal_production_items: Optional[str]
    external_purchase_items: Optional[str]
    order_days: Optional[str]
    expected_delivery_date: Optional[str]
    board_18: Optional[str]
    board_09: Optional[str]
    order_status: str
    actual_delivery_date: Optional[str]
    
    # 生产进度
    cutting_date: Optional[str]
    expected_shipping_date: Optional[str]
    remarks: Optional[str]
    
    # 采购状态
    purchase_status: Optional[str] = Field(default=None, description="采购状态")
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductionListResponse(BaseModel):
    """生产管理列表响应"""
    code: int = 200
    message: str = "success"
    data: List[ProductionListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProductionEdit(BaseModel):
    """生产管理编辑模型"""
    customer_name: Optional[str] = Field(default=None, description="客户名称")
    address: Optional[str] = Field(default=None, description="地址")
    splitter: Optional[str] = Field(default=None, description="拆单员")
    is_installation: Optional[bool] = Field(default=None, description="是否安装")
    customer_payment_date: Optional[str] = Field(default=None, description="客户打款日期")
    split_order_date: Optional[str] = Field(default=None, description="拆单下单日期")
    internal_production_items: Optional[str] = Field(default=None, description="厂内生产项")
    external_purchase_items: Optional[str] = Field(default=None, description="外购项")
    order_days: Optional[str] = Field(default=None, description="下单天数")
    expected_delivery_date: Optional[str] = Field(default=None, description="预计交货日期")
    board_18: Optional[str] = Field(default=None, description="18板")
    board_09: Optional[str] = Field(default=None, description="09板")
    order_status: Optional[str] = Field(default=None, description="订单状态")
    actual_delivery_date: Optional[str] = Field(default=None, description="实际出货日期")
    cutting_date: Optional[str] = Field(default=None, description="下料日期")
    expected_shipping_date: Optional[str] = Field(default=None, description="预计出货日期")
    remarks: Optional[str] = Field(default=None, description="备注")


class ProductionProgressBase(BaseModel):
    """生产进度基础模型"""
    item_type: str
    category_name: str
    order_date: Optional[str] = None
    expected_material_date: Optional[str] = None
    actual_storage_date: Optional[str] = None
    storage_time: Optional[str] = None
    quantity: Optional[str] = None
    expected_arrival_date: Optional[str] = None
    actual_arrival_date: Optional[str] = None


class ProductionProgressBatchUpdate(BaseModel):
    """生产进度批量更新模型"""
    id: Optional[int] = None  # 可选ID，用于更新现有记录
    item_type: Optional[str] = None
    category_name: Optional[str] = None
    order_date: Optional[str] = None
    expected_material_date: Optional[str] = None
    actual_storage_date: Optional[str] = None
    storage_time: Optional[str] = None
    quantity: Optional[str] = None
    expected_arrival_date: Optional[str] = None
    actual_arrival_date: Optional[str] = None


class ProductionProgressResponse(ProductionProgressBase):
    """生产进度响应模型"""
    id: int
    production_id: int
    order_number: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True


class ProductionResponse(BaseModel):
    """生产管理响应模型"""
    id: int
    order_id: int
    order_number: str
    customer_name: str
    address: Optional[str]
    splitter: Optional[str]
    is_installation: bool
    customer_payment_date: Optional[str]
    split_order_date: Optional[str]
    internal_production_items: Optional[str]
    external_purchase_items: Optional[str]
    order_days: Optional[str]
    expected_delivery_date: Optional[str]
    board_18: Optional[str]
    board_09: Optional[str]
    order_status: str
    actual_delivery_date: Optional[str]
    cutting_date: Optional[str]
    expected_shipping_date: Optional[str]
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime
    progress_items: List[ProductionProgressResponse] = []

    class Config:
        from_attributes = True