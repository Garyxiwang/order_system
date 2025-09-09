from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProgressBase(BaseModel):
    """进度基础模型"""
    task_item: str = Field(..., description="进行事项")
    planned_date: str = Field(..., description="计划日期")
    actual_date: Optional[str] = Field(None, description="实际日期")
    remarks: Optional[str] = Field(None, description="备注")


class ProgressCreate(ProgressBase):
    """创建进度模型"""
    order_id: str = Field(..., description="订单编号")


class ProgressUpdate(BaseModel):
    """更新进度模型"""
    actual_date: Optional[str] = Field(None, description="实际日期")
    remarks: Optional[str] = Field(None, description="备注")


class ProgressResponse(ProgressBase):
    """进度响应模型"""
    id: int = Field(..., description="进度ID")
    order_id: int = Field(..., description="订单ID")
    order_number: str = Field(..., description="订单编号")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    
    @classmethod
    def from_orm(cls, obj):
        """从ORM对象创建响应模型"""
        return cls(
            id=obj.id,
            order_id=obj.order_id,
            order_number=obj.order.order_number if obj.order else "",
            task_item=obj.task_item,
            planned_date=obj.planned_date,
            actual_date=obj.actual_date,
            remarks=obj.remarks,
            created_at=obj.created_at,
            updated_at=obj.updated_at
        )
    
    class Config:
        from_attributes = True


class ProgressListQuery(BaseModel):
    """进度列表查询模型"""
    order_id: int = Field(..., description="订单ID")
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(10, ge=1, le=100, description="每页数量")


class ProgressListResponse(BaseModel):
    """进度列表响应模型"""
    items: List[ProgressResponse] = Field(..., description="进度列表")
    total: int = Field(..., description="总数量")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")