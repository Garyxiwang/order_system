from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List
from datetime import datetime
import math

from app.core.database import get_db
from app.models.production import Production, PurchaseStatus
from app.schemas.production import (
    ProductionListQuery,
    ProductionListResponse,
    ProductionListItem,
    ProductionEdit,
    ProductionProgressUpdate,
    ProductionResponse
)
from app.core.response import success_response, error_response

router = APIRouter()


@router.post("/list", response_model=ProductionListResponse, summary="获取生产管理列表")
async def get_productions(
    query_data: ProductionListQuery,
    db: Session = Depends(get_db)
):
    """
    获取生产管理列表
    支持多种搜索条件和分页
    """
    try:
        # 构建查询
        query = db.query(Production)
        
        # 搜索条件
        if query_data.order_number:
            query = query.filter(Production.order_number.like(f"%{query_data.order_number}%"))
        
        if query_data.customer_name:
            query = query.filter(Production.customer_name.like(f"%{query_data.customer_name}%"))
        
        if query_data.order_status:
            query = query.filter(Production.order_status.in_(query_data.order_status))
        
        # 日期区间搜索
        if query_data.expected_delivery_start:
            query = query.filter(Production.expected_delivery_date >= query_data.expected_delivery_start)
        if query_data.expected_delivery_end:
            query = query.filter(Production.expected_delivery_date <= query_data.expected_delivery_end)
            
        if query_data.cutting_date_start:
            query = query.filter(Production.cutting_date >= query_data.cutting_date_start)
        if query_data.cutting_date_end:
            query = query.filter(Production.cutting_date <= query_data.cutting_date_end)
            
        if query_data.expected_shipment_start:
            query = query.filter(Production.expected_shipment_date >= query_data.expected_shipment_start)
        if query_data.expected_shipment_end:
            query = query.filter(Production.expected_shipment_date <= query_data.expected_shipment_end)
            
        if query_data.actual_shipment_start:
            query = query.filter(Production.actual_shipment_date >= query_data.actual_shipment_start)
        if query_data.actual_shipment_end:
            query = query.filter(Production.actual_shipment_date <= query_data.actual_shipment_end)
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (query_data.page - 1) * query_data.page_size
        productions = query.order_by(Production.created_at.desc()).offset(offset).limit(query_data.page_size).all()
        
        # 转换为响应格式
        production_items = []
        for production in productions:
            item_data = {
                "id": production.id,
                "order_number": production.order_number,
                "customer_name": production.customer_name,
                "address": production.address,
                "is_installation": production.is_installation,
                "customer_payment_date": production.customer_payment_date,
                "split_order_date": production.split_order_date,
                "order_days": production.order_days,
                "expected_delivery_date": production.expected_delivery_date,
                "purchase_status": production.purchase_status.value if production.purchase_status else None,
                "board_18_quantity": production.board_18_quantity,
                "board_09_quantity": production.board_09_quantity,
                "cutting_date": production.cutting_date,
                "finished_storage_date": production.finished_storage_date,
                "expected_shipment_date": production.expected_shipment_date,
                "actual_shipment_date": production.actual_shipment_date,
                "internal_production_items": production.internal_production_items,
                "external_purchase_items": production.external_purchase_items,
                "remarks": production.remarks,
                "order_status": production.order_status,
                "created_at": production.created_at,
                "updated_at": production.updated_at
            }
            production_items.append(ProductionListItem(**item_data))
        
        # 计算总页数
        total_pages = math.ceil(total / query_data.page_size) if total > 0 else 0
        
        return ProductionListResponse(
            data=production_items,
            total=total,
            page=query_data.page,
            page_size=query_data.page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取生产管理列表失败: {str(e)}"
        )


@router.put("/{production_id}", response_model=ProductionResponse, summary="编辑生产记录")
async def update_production(
    production_id: int,
    production_data: ProductionEdit,
    db: Session = Depends(get_db)
):
    """
    编辑生产记录
    可编辑字段：18板、09板、预计交货日期、订单状态、实际出货日期、备注
    """
    try:
        production = db.query(Production).filter(Production.id == production_id).first()
        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="生产记录不存在"
            )
        
        # 更新字段
        update_data = production_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(production, field, value)
        
        production.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(production)
        
        return ProductionResponse.from_orm(production)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"编辑生产记录失败: {str(e)}"
        )


@router.patch("/{production_id}/progress", response_model=ProductionResponse, summary="更新生产进度")
async def update_production_progress(
    production_id: int,
    progress_data: ProductionProgressUpdate,
    db: Session = Depends(get_db)
):
    """
    更新生产进度
    可更新字段：下料日期、成品入库日期、预计出货日期
    """
    try:
        production = db.query(Production).filter(Production.id == production_id).first()
        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="生产记录不存在"
            )
        
        # 更新进度字段
        update_data = progress_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(production, field, value)
        
        production.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(production)
        
        return ProductionResponse.from_orm(production)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新生产进度失败: {str(e)}"
        )


@router.get("/{production_id}", response_model=ProductionResponse, summary="获取生产记录详情")
async def get_production(
    production_id: int,
    db: Session = Depends(get_db)
):
    """
    获取生产记录详情
    """
    try:
        production = db.query(Production).filter(Production.id == production_id).first()
        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="生产记录不存在"
            )
        
        return ProductionResponse.from_orm(production)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取生产记录详情失败: {str(e)}"
        )