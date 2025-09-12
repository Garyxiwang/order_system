from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List
from datetime import datetime
import math

from app.core.database import get_db
from app.models.production import Production
from app.models.production_progress import ProductionProgress, ItemType
from app.schemas.production import (
    ProductionListQuery,
    ProductionListResponse,
    ProductionListItem,
    ProductionEdit,
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
            query = query.filter(Production.expected_shipping_date >= query_data.expected_shipment_start)
        if query_data.expected_shipment_end:
            query = query.filter(Production.expected_shipping_date <= query_data.expected_shipment_end)
            
        if query_data.actual_shipment_start:
            query = query.filter(Production.actual_delivery_date >= query_data.actual_shipment_start)
        if query_data.actual_shipment_end:
            query = query.filter(Production.actual_delivery_date <= query_data.actual_shipment_end)
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (query_data.page - 1) * query_data.page_size
        productions = query.order_by(Production.created_at.desc()).offset(offset).limit(query_data.page_size).all()
        
        # 转换为响应格式
        production_items = []
        for production in productions:
            # 查询生产进度表，生成采购状态
            progress_items = db.query(ProductionProgress).filter(
                ProductionProgress.production_id == production.id
            ).all()
            
            # 生成采购状态字符串
            purchase_status_parts = []
            for progress in progress_items:
                if progress.item_type == ItemType.INTERNAL:
                    # 厂内项目：检查实际入库日期
                    if progress.actual_storage_date:
                        purchase_status_parts.append(f"{progress.category_name}:{progress.actual_storage_date}")
                    else:
                        purchase_status_parts.append(f"{progress.category_name}:")
                elif progress.item_type == ItemType.EXTERNAL:
                    # 外购项目：检查实际到厂日期
                    if progress.actual_arrival_date:
                        purchase_status_parts.append(f"{progress.category_name}:{progress.actual_arrival_date}")
                    else:
                        purchase_status_parts.append(f"{progress.category_name}:")
            
            purchase_status = "; ".join(purchase_status_parts) if purchase_status_parts else "暂无进度信息"
            
            item_data = {
                "id": production.id,
                "order_number": production.order_number,
                "customer_name": production.customer_name,
                "address": production.address,
                "splitter": production.splitter,
                "is_installation": production.is_installation,
                "customer_payment_date": production.customer_payment_date,
                "split_order_date": production.split_order_date,
                "order_days": production.order_days,
                "expected_delivery_date": production.expected_delivery_date,
                "board_18": production.board_18,
                "board_09": production.board_09,
                "cutting_date": production.cutting_date,
                "expected_shipping_date": production.expected_shipping_date,
                "actual_delivery_date": production.actual_delivery_date,
                "internal_production_items": production.internal_production_items,
                "external_purchase_items": production.external_purchase_items,
                "remarks": production.remarks,
                "order_status": production.order_status,
                "purchase_status": purchase_status,
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


@router.put("/{production_id}", summary="编辑生产记录")
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
        
        db.commit()
        db.refresh(production)
        
        # 手动构建响应数据
        production_dict = {
            "id": production.id,
            "order_number": production.order_number,
            "customer_name": production.customer_name,
            "address": production.address,
            "splitter": production.splitter,
            "is_installation": production.is_installation,
            "customer_payment_date": production.customer_payment_date,
            "split_order_date": production.split_order_date,
            "internal_production_items": production.internal_production_items,
            "external_purchase_items": production.external_purchase_items,
            "order_days": production.order_days,
            "expected_delivery_date": production.expected_delivery_date,
            "board_18": production.board_18,
            "board_09": production.board_09,
            "order_status": production.order_status,
            "actual_delivery_date": production.actual_delivery_date,
            "cutting_date": production.cutting_date,
            "expected_shipping_date": production.expected_shipping_date,
            "remarks": production.remarks,
            "created_at": production.created_at,
            "updated_at": production.updated_at,
            "progress_items": []
        }
        
        return success_response(
            data=ProductionResponse(**production_dict),
            message="生产记录编辑成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"编辑生产记录失败: {str(e)}"
        )


# 生产进度更新功能已移至独立的进度管理模块


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
        
        return success_response(
            data=ProductionResponse.model_validate(production),
            message="获取生产记录详情成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        return error_response(
            message=f"获取生产记录详情失败: {str(e)}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )