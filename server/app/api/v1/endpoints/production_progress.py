from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.production import Production
from app.models.production_progress import ProductionProgress, ItemType
from app.schemas.production import (
    ProductionProgressBase,
    ProductionProgressBatchUpdate,
    ProductionProgressResponse
)
from app.core.response import success_response, error_response

router = APIRouter()


@router.get("/production/{production_id}", response_model=List[ProductionProgressResponse], summary="获取生产进度列表")
async def get_production_progress(
    production_id: int,
    db: Session = Depends(get_db)
):
    """
    获取指定生产记录的所有进度项
    """
    try:
        # 检查生产记录是否存在
        production = db.query(Production).filter(Production.id == production_id).first()
        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="生产记录不存在"
            )
        
        # 获取进度列表
        progress_items = db.query(ProductionProgress).filter(
            ProductionProgress.production_id == production_id
        ).all()
        
        return [ProductionProgressResponse.model_validate(item) for item in progress_items]
        
    except HTTPException:
        raise
    except Exception as e:
        return error_response(
            message=f"获取生产进度列表失败: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.post("/production/{production_id}/batch", response_model=List[ProductionProgressResponse], summary="批量更新生产进度")
async def batch_update_production_progress(
    production_id: int,
    progress_data: List[ProductionProgressBatchUpdate],
    db: Session = Depends(get_db)
):
    """
    批量更新生产进度
    """
    try:
        # 检查生产记录是否存在
        production = db.query(Production).filter(Production.id == production_id).first()
        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="生产记录不存在"
            )
        
        # 更新现有的进度记录
        updated_progress_items = []
        for item_data in progress_data:
            # 检查是否包含ID字段（前端发送的更新数据应该包含ID）
            if hasattr(item_data, 'id') and item_data.id:
                # 更新现有记录
                progress_item = db.query(ProductionProgress).filter(
                    ProductionProgress.id == item_data.id,
                    ProductionProgress.production_id == production_id
                ).first()
                
                if progress_item:
                    # 更新所有非None的字段
                    if item_data.order_date is not None:
                        progress_item.order_date = item_data.order_date
                    if item_data.expected_material_date is not None:
                        progress_item.expected_material_date = item_data.expected_material_date
                    if item_data.actual_storage_date is not None:
                        progress_item.actual_storage_date = item_data.actual_storage_date
                    if item_data.storage_time is not None:
                        progress_item.storage_time = item_data.storage_time
                    if item_data.quantity is not None:
                        progress_item.quantity = item_data.quantity
                    if item_data.expected_arrival_date is not None:
                        progress_item.expected_arrival_date = item_data.expected_arrival_date
                    if item_data.actual_arrival_date is not None:
                        progress_item.actual_arrival_date = item_data.actual_arrival_date
                    
                    updated_progress_items.append(progress_item)
            else:
                # 如果没有ID，创建新记录（保持向后兼容）
                item_type_enum = ItemType.INTERNAL if item_data.item_type == "internal" else ItemType.EXTERNAL
                
                progress_item = ProductionProgress(
                    production_id=production_id,
                    order_number=production.order_number,
                    item_type=item_type_enum,
                    category_name=item_data.category_name,
                    order_date=item_data.order_date,
                    expected_material_date=item_data.expected_material_date,
                    actual_storage_date=item_data.actual_storage_date,
                    storage_time=item_data.storage_time,
                    quantity=item_data.quantity,
                    expected_arrival_date=item_data.expected_arrival_date,
                    actual_arrival_date=item_data.actual_arrival_date
                )
                db.add(progress_item)
                updated_progress_items.append(progress_item)
        
        db.commit()
        
        # 刷新数据以获取ID
        for item in updated_progress_items:
            db.refresh(item)
        
        return [ProductionProgressResponse.model_validate(item) for item in updated_progress_items]
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        return error_response(
            message=f"批量更新生产进度失败: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put("/{progress_id}", response_model=ProductionProgressResponse, summary="更新单个进度项")
async def update_progress_item(
    progress_id: int,
    progress_data: ProductionProgressBase,
    db: Session = Depends(get_db)
):
    """
    更新单个进度项
    """
    try:
        progress_item = db.query(ProductionProgress).filter(
            ProductionProgress.id == progress_id
        ).first()
        
        if not progress_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="进度项不存在"
            )
        
        # 更新字段
        for field, value in progress_data.model_dump(exclude_unset=True).items():
            setattr(progress_item, field, value)
        
        progress_item.updated_at = datetime.now()
        db.commit()
        db.refresh(progress_item)
        
        return ProductionProgressResponse.model_validate(progress_item)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        return error_response(
            message=f"更新进度项失败: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.delete("/{progress_id}", summary="删除进度项")
async def delete_progress_item(
    progress_id: int,
    db: Session = Depends(get_db)
):
    """
    删除进度项
    """
    try:
        progress_item = db.query(ProductionProgress).filter(
            ProductionProgress.id == progress_id
        ).first()
        
        if not progress_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="进度项不存在"
            )
        
        db.delete(progress_item)
        db.commit()
        
        return {"message": "删除进度项成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        return error_response(
            message=f"删除进度项失败: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )