from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryListResponse,
    DeleteCategoryResponse
)

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    """新增类目"""
    # 检查类目名称是否已存在
    existing_category = db.query(Category).filter(Category.name == category_data.name).first()
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="类目名称已存在"
        )
    
    # 创建新类目
    db_category = Category(
        name=category_data.name,
        category_type=category_data.category_type
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return {
        "message": "类目创建成功",
        "category_id": db_category.id,
        "name": db_category.name,
        "category_type": db_category.category_type.value
    }


@router.get("/", response_model=CategoryListResponse)
def get_categories(db: Session = Depends(get_db)):
    """查询类目列表"""
    categories = db.query(Category).order_by(Category.created_at.desc()).all()
    
    return CategoryListResponse(
        categories=categories,
        total=len(categories)
    )


@router.delete("/{category_id}", response_model=DeleteCategoryResponse)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """删除类目（真删除）"""
    # 查找类目
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="类目不存在"
        )
    
    category_name = category.name
    
    # 真删除
    db.delete(category)
    db.commit()
    
    return DeleteCategoryResponse(
        message="类目删除成功",
        deleted_category=category_name
    )