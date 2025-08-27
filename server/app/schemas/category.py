from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.category import CategoryType


class CategoryCreate(BaseModel):
    """创建类目请求模型"""
    name: str = Field(..., min_length=1, max_length=100, description="类目名称")
    category_type: CategoryType = Field(..., description="类目分类")


class CategoryResponse(BaseModel):
    """类目响应模型"""
    id: int
    name: str
    category_type: CategoryType
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    """类目列表响应模型"""
    categories: List[CategoryResponse]
    total: int
    
    class Config:
        from_attributes = True


class DeleteCategoryResponse(BaseModel):
    """删除类目响应模型"""
    message: str
    deleted_category: str
    
    class Config:
        from_attributes = True