from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ItemType(str, Enum):
    """项目类型枚举"""
    INTERNAL = "internal"  # 厂内生产项
    EXTERNAL = "external"  # 外购项


class SplitProgressBase(BaseModel):
    """拆单进度基础模型"""
    item_type: ItemType = Field(..., description="项目类型")
    category_name: str = Field(..., description="类目名称")
    planned_date: Optional[str] = Field(None, description="计划日期")
    split_date: Optional[str] = Field(None, description="拆单日期（厂内项）")
    purchase_date: Optional[str] = Field(None, description="采购日期（外购项）")
    cycle_days: Optional[str] = Field(None, description="周期天数")
    status: Optional[str] = Field("待处理", description="状态")
    remarks: Optional[str] = Field(None, description="备注")


class SplitProgressCreate(SplitProgressBase):
    """创建拆单进度模型"""
    split_id: int = Field(..., description="拆单ID")
    order_number: str = Field(..., description="订单编号")


class SplitProgressUpdate(BaseModel):
    """更新拆单进度模型"""
    planned_date: Optional[str] = Field(None, description="计划日期")
    split_date: Optional[str] = Field(None, description="拆单日期（厂内项）")
    purchase_date: Optional[str] = Field(None, description="采购日期（外购项）")
    cycle_days: Optional[str] = Field(None, description="周期天数")
    status: Optional[str] = Field(None, description="状态")
    remarks: Optional[str] = Field(None, description="备注")


class SplitProgressBatchUpdate(BaseModel):
    """批量更新拆单进度模型"""
    internal_items: Optional[dict] = Field(None, alias="internalItems", description="厂内生产项")
    external_items: Optional[dict] = Field(None, alias="externalItems", description="外购项")
    remarks: Optional[str] = Field(None, description="备注")
    
    class Config:
        populate_by_name = True


class SplitProgressResponse(BaseModel):
    """拆单进度响应模型"""
    id: int
    split_id: int
    order_number: str
    item_type: str
    category_name: str
    planned_date: Optional[str]
    split_date: Optional[str]
    purchase_date: Optional[str]
    cycle_days: Optional[str]
    status: str
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SplitProgressListResponse(BaseModel):
    """拆单进度列表响应模型"""
    items: List[SplitProgressResponse]
    total: int