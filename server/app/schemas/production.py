from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PurchaseStatusEnum(str, Enum):
    """采购状态枚举"""
    PENDING = "待采购"
    PURCHASING = "采购中"
    COMPLETED = "采购完成"
    DELAYED = "采购延期"


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
    address: str
    is_installation: bool
    customer_payment_date: Optional[str]
    split_order_date: Optional[str]
    order_days: Optional[int]  # 下单天数
    expected_delivery_date: Optional[str]
    purchase_status: str
    board_18_quantity: int  # 18板数量
    board_09_quantity: int  # 09板数量
    
    # 生产进度
    cutting_date: Optional[str]
    finished_storage_date: Optional[str]
    expected_shipment_date: Optional[str]
    actual_shipment_date: Optional[str]
    
    internal_production_items: Optional[str]
    external_purchase_items: Optional[str]
    remarks: Optional[str]
    order_status: str
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
    """生产管理编辑"""
    board_18_quantity: Optional[int] = Field(default=None, ge=0, description="18板数量")
    board_09_quantity: Optional[int] = Field(default=None, ge=0, description="09板数量")
    expected_delivery_date: Optional[str] = Field(default=None, description="预计交货日期")
    order_status: Optional[str] = Field(default=None, description="订单状态")
    actual_shipment_date: Optional[str] = Field(default=None, description="实际出货日期")
    remarks: Optional[str] = Field(default=None, description="备注")


class ProductionProgressUpdate(BaseModel):
    """生产进度更新"""
    cutting_date: Optional[str] = Field(default=None, description="下料日期")
    finished_storage_date: Optional[str] = Field(default=None, description="成品入库日期")
    expected_shipment_date: Optional[str] = Field(default=None, description="预计出货日期")


class ProductionResponse(BaseModel):
    """生产管理响应"""
    id: int
    order_number: str
    customer_name: str
    address: str
    is_installation: bool
    customer_payment_date: Optional[str]
    split_order_date: Optional[str]
    expected_delivery_date: Optional[str]
    purchase_status: str
    board_18_quantity: int
    board_09_quantity: int
    cutting_date: Optional[str]
    finished_storage_date: Optional[str]
    expected_shipment_date: Optional[str]
    actual_shipment_date: Optional[str]
    internal_production_items: Optional[str]
    external_purchase_items: Optional[str]
    order_status: str
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # 计算字段
    order_days: Optional[int]

    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, obj):
        data = {
            "id": obj.id,
            "order_number": obj.order_number,
            "customer_name": obj.customer_name,
            "address": obj.address,
            "is_installation": obj.is_installation,
            "customer_payment_date": obj.customer_payment_date,
            "split_order_date": obj.split_order_date,
            "expected_delivery_date": obj.expected_delivery_date,
            "purchase_status": obj.purchase_status.value if obj.purchase_status else None,
            "board_18_quantity": obj.board_18_quantity,
            "board_09_quantity": obj.board_09_quantity,
            "cutting_date": obj.cutting_date,
            "finished_storage_date": obj.finished_storage_date,
            "expected_shipment_date": obj.expected_shipment_date,
            "actual_shipment_date": obj.actual_shipment_date,
            "internal_production_items": obj.internal_production_items,
            "external_purchase_items": obj.external_purchase_items,
            "order_status": obj.order_status,
            "remarks": obj.remarks,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "order_days": obj.order_days
        }
        return cls(**data)