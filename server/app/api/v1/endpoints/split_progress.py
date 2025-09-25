from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.split import Split
from app.models.split_progress import SplitProgress, ItemType
from app.models.category import Category, CategoryType
from app.models.order import Order
from app.schemas.split_progress import (
    SplitProgressCreate,
    SplitProgressUpdate,
    SplitProgressBatchUpdate,
    SplitProgressResponse,
    SplitProgressListResponse
)

router = APIRouter()


@router.get("/split/{split_id}", response_model=SplitProgressListResponse, summary="获取拆单进度列表")
async def get_split_progress(
    split_id: int,
    db: Session = Depends(get_db)
):
    """
    获取指定拆单的所有进度项
    """
    try:
        # 检查拆单是否存在
        split = db.query(Split).filter(Split.id == split_id).first()
        if not split:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="拆单不存在"
            )
        
        # 获取进度列表
        progress_items = db.query(SplitProgress).filter(
            SplitProgress.split_id == split_id
        ).all()
        
        return SplitProgressListResponse(
            items=progress_items,
            total=len(progress_items)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取拆单进度失败: {str(e)}"
        )


@router.get("/order/{order_number}", response_model=SplitProgressListResponse, summary="通过订单号获取拆单进度列表")
async def get_split_progress_by_order_number(
    order_number: str,
    db: Session = Depends(get_db)
):
    """
    通过订单号获取拆单进度列表
    """
    try:
        # 获取进度列表
        progress_items = db.query(SplitProgress).filter(
            SplitProgress.order_number == order_number
        ).all()
        
        return SplitProgressListResponse(
            items=progress_items,
            total=len(progress_items)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取拆单进度失败: {str(e)}"
        )


@router.post("/split/{split_id}/batch", response_model=SplitProgressListResponse, summary="批量更新拆单进度")
async def batch_update_split_progress(
    split_id: int,
    progress_data: SplitProgressBatchUpdate,
    db: Session = Depends(get_db)
):
    """
    批量更新拆单进度
    
    根据前端传来的厂内项和外购项数据，批量创建或更新进度记录
    """
    try:
        # 检查拆单是否存在
        split = db.query(Split).filter(Split.id == split_id).first()
        if not split:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="拆单不存在"
            )
        
        # 处理厂内生产项
        if progress_data.internal_items:
            for category_name, dates in progress_data.internal_items.items():
                # 查找或创建进度记录
                progress = db.query(SplitProgress).filter(
                    SplitProgress.split_id == split_id,
                    SplitProgress.category_name == category_name,
                    SplitProgress.item_type == ItemType.INTERNAL
                ).first()
                
                if not progress:
                    # 创建新记录
                    progress = SplitProgress(
                        split_id=split_id,
                        order_number=split.order_number,
                        item_type=ItemType.INTERNAL,
                        category_name=category_name
                    )
                    db.add(progress)
                
                # 更新日期（支持删除/清空）
                if 'plannedDate' in dates:
                    progress.planned_date = dates['plannedDate'] if dates['plannedDate'] else None
                if 'splitDate' in dates:
                    progress.split_date = dates['splitDate'] if dates['splitDate'] else None
                    
                    # 注意：拆单周期已改为动态计算，不再在此处更新cycle_days字段
                
                progress.updated_at = datetime.utcnow()
        
        # 处理外购项
        if progress_data.external_items:
            for category_name, dates in progress_data.external_items.items():
                # 查找或创建进度记录
                progress = db.query(SplitProgress).filter(
                    SplitProgress.split_id == split_id,
                    SplitProgress.category_name == category_name,
                    SplitProgress.item_type == ItemType.EXTERNAL
                ).first()
                
                if not progress:
                    # 创建新记录
                    progress = SplitProgress(
                        split_id=split_id,
                        order_number=split.order_number,
                        item_type=ItemType.EXTERNAL,
                        category_name=category_name
                    )
                    db.add(progress)
                
                # 更新日期（支持删除/清空）
                if 'plannedDate' in dates:
                    progress.planned_date = dates['plannedDate'] if dates['plannedDate'] else None
                if 'purchaseDate' in dates:
                    progress.purchase_date = dates['purchaseDate'] if dates['purchaseDate'] else None
                    
                    # 注意：拆单周期已改为动态计算，不再在此处更新cycle_days字段
                
                progress.updated_at = datetime.utcnow()
        
        # 更新拆单备注
        if progress_data.remarks is not None:
            split.remarks = progress_data.remarks
            split.updated_at = datetime.utcnow()
        
        # 同步到生产管理进度
        try:
            from app.models.production import Production
            from app.models.production_progress import ProductionProgress, ItemType as ProductionItemType
            
            # 检查该订单是否存在生产管理记录
            production = db.query(Production).filter(Production.order_number == split.order_number).first()
            if production:
                # 处理厂内项的同步
                if progress_data.internal_items:
                    for category_name, dates in progress_data.internal_items.items():
                        if 'splitDate' in dates and dates['splitDate']:
                            # 查找对应的生产进度记录
                            production_progress = db.query(ProductionProgress).filter(
                                ProductionProgress.production_id == production.id,
                                ProductionProgress.category_name == category_name,
                                ProductionProgress.item_type == ProductionItemType.INTERNAL
                            ).first()
                            
                            if production_progress:
                                production_progress.order_date = dates['splitDate']
                                production_progress.updated_at = datetime.utcnow()
                
                # 处理外购项的同步
                if progress_data.external_items:
                    for category_name, dates in progress_data.external_items.items():
                        if 'purchaseDate' in dates and dates['purchaseDate']:
                            # 查找对应的生产进度记录
                            production_progress = db.query(ProductionProgress).filter(
                                ProductionProgress.production_id == production.id,
                                ProductionProgress.category_name == category_name,
                                ProductionProgress.item_type == ProductionItemType.EXTERNAL
                            ).first()
                            
                            if production_progress:
                                production_progress.order_date = dates['purchaseDate']
                                production_progress.updated_at = datetime.utcnow()
        except Exception as sync_e:
            print(f"同步到生产管理进度失败: {str(sync_e)}")
        

        db.commit()
        
        # 返回更新后的进度列表
        progress_items = db.query(SplitProgress).filter(
            SplitProgress.split_id == split_id
        ).all()
        
        return SplitProgressListResponse(
            items=progress_items,
            total=len(progress_items)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"批量更新拆单进度失败: {str(e)}"
        )


@router.put("/{progress_id}", response_model=SplitProgressResponse, summary="更新单个进度项")
async def update_progress_item(
    progress_id: int,
    progress_data: SplitProgressUpdate,
    db: Session = Depends(get_db)
):
    """
    更新单个进度项
    """
    try:
        progress = db.query(SplitProgress).filter(SplitProgress.id == progress_id).first()
        if not progress:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="进度项不存在"
            )
        
        # 更新字段
        update_data = progress_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(progress, field):
                setattr(progress, field, value)
        
        progress.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(progress)
        
        return progress
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新进度项失败: {str(e)}"
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
        progress = db.query(SplitProgress).filter(SplitProgress.id == progress_id).first()
        if not progress:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="进度项不存在"
            )
        
        db.delete(progress)
        db.commit()
        
        return {"message": "进度项删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除进度项失败: {str(e)}"
        )