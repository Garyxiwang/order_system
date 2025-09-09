from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List
import math
import json
from datetime import datetime

from app.core.database import get_db
from app.models.split import Split
from app.models.order import Order
from app.models.production import Production, PurchaseStatus
from app.models.progress import Progress
from app.schemas.split import (
    SplitListQuery,
    SplitListResponse,
    SplitResponse,
    SplitUpdate,
    SplitProgressUpdate,
    SplitStatusUpdate,
    ProductionItem
)

router = APIRouter()


@router.post("/list", response_model=SplitListResponse, summary="获取拆单列表")
async def get_splits(
    query_data: SplitListQuery,
    db: Session = Depends(get_db)
):
    """
    获取拆单列表
    
    支持的查询条件：
    - 订单编号、客户名称、设计师、销售员、拆单员
    - 订单状态（多选）、订单类型、报价状态（多选）
    - 下单类目（多选）、下单日期区间、完成日期区间
    """
    try:
        # 构建查询条件
        query = db.query(Split)
        
        # 基础字段过滤
        if query_data.order_number:
            query = query.filter(Split.order_number.contains(query_data.order_number))
        if query_data.customer_name:
            query = query.filter(Split.customer_name.contains(query_data.customer_name))
        if query_data.designer:
            query = query.filter(Split.designer.contains(query_data.designer))
        if query_data.salesperson:
            query = query.filter(Split.salesperson.contains(query_data.salesperson))
        if query_data.splitter:
            query = query.filter(Split.splitter.contains(query_data.splitter))
        if query_data.order_type:
            query = query.filter(Split.order_type == query_data.order_type)
            
        # 多选状态过滤
        if query_data.order_status:
            query = query.filter(Split.order_status.in_(query_data.order_status))
        if query_data.quote_status:
            query = query.filter(Split.quote_status.in_(query_data.quote_status))
            
        # 类目过滤（需要在JSON字段中搜索）
        if query_data.category_names:
            category_conditions = []
            for category in query_data.category_names:
                # 在厂内生产项中搜索
                internal_condition = Split.internal_production_items.contains(f'"category_name": "{category}"')
                # 在外购项中搜索
                external_condition = Split.external_purchase_items.contains(f'"category_name": "{category}"')
                category_conditions.append(or_(internal_condition, external_condition))
            if category_conditions:
                query = query.filter(or_(*category_conditions))
                
        # 日期区间过滤
        if query_data.order_date_start:
            query = query.filter(Split.order_date >= query_data.order_date_start)
        if query_data.order_date_end:
            query = query.filter(Split.order_date <= query_data.order_date_end)
        if query_data.completion_date_start:
            query = query.filter(Split.completion_date >= query_data.completion_date_start)
        if query_data.completion_date_end:
            query = query.filter(Split.completion_date <= query_data.completion_date_end)
            
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (query_data.page - 1) * query_data.page_size
        splits = query.offset(offset).limit(query_data.page_size).all()
        
        # 计算总页数
        total_pages = math.ceil(total / query_data.page_size) if total > 0 else 0
        
        return SplitListResponse(
            items=splits,
            total=total,
            page=query_data.page,
            page_size=query_data.page_size,
            total_pages=total_pages
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取拆单列表失败: {str(e)}"
        )


@router.get("/{split_id}", response_model=SplitResponse, summary="获取拆单详情")
async def get_split(
    split_id: int,
    db: Session = Depends(get_db)
):
    """
    根据ID获取拆单详情
    """
    split = db.query(Split).filter(Split.id == split_id).first()
    if not split:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="拆单不存在"
        )
    return split


@router.put("/{split_id}", response_model=SplitResponse, summary="编辑拆单")
async def update_split(
    split_id: int,
    split_data: SplitUpdate,
    db: Session = Depends(get_db)
):
    """
    编辑拆单信息
    
    可编辑字段：拆单员、下单类目、备注
    """
    try:
        split = db.query(Split).filter(Split.id == split_id).first()
        if not split:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="拆单不存在"
            )
            
        # 更新字段
        update_data = split_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(split, field):
                setattr(split, field, value)
                
        split.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(split)
        
        return split
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新拆单失败: {str(e)}"
        )


@router.put("/{split_id}/progress", response_model=SplitResponse, summary="更新拆单进度")
async def update_split_progress(
    split_id: int,
    progress_data: SplitProgressUpdate,
    db: Session = Depends(get_db)
):
    """
    更新拆单进度
    
    对厂内生产项或外购项中的类目填写计划日期和实际日期
    """
    try:
        split = db.query(Split).filter(Split.id == split_id).first()
        if not split:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="拆单不存在"
            )
            
        # 根据项目类型更新对应的生产项
        if progress_data.item_type == "internal":
            items = split.internal_production_items or []
        elif progress_data.item_type == "external":
            items = split.external_purchase_items or []
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的项目类型"
            )
            
        # 查找并更新对应的类目
        item_found = False
        for item in items:
            if item.get("category_name") == progress_data.category_name:
                if progress_data.planned_date is not None:
                    item["planned_date"] = progress_data.planned_date.isoformat()
                if progress_data.actual_date is not None:
                    item["actual_date"] = progress_data.actual_date.isoformat()
                if progress_data.status is not None:
                    item["status"] = progress_data.status
                if progress_data.remarks is not None:
                    item["remarks"] = progress_data.remarks
                item_found = True
                break
                
        if not item_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到类目: {progress_data.category_name}"
            )
            
        # 更新数据库
        if progress_data.item_type == "internal":
            split.internal_production_items = items
        else:
            split.external_purchase_items = items
            
        split.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(split)
        
        return split
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新拆单进度失败: {str(e)}"
        )


@router.put("/{split_id}/status", response_model=SplitResponse, summary="修改拆单状态")
async def update_split_status(
    split_id: int,
    status_data: SplitStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    修改拆单状态
    
    可以修改订单状态或报价状态
    """
    try:
        split = db.query(Split).filter(Split.id == split_id).first()
        if not split:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="拆单不存在"
            )
            
        # 更新状态
        if status_data.order_status is not None:
            split.order_status = status_data.order_status
            # 拆单状态和设计管理状态是独立的，不需要同步
                        
        if status_data.quote_status is not None:
            split.quote_status = status_data.quote_status
            
            # 如果更新为已打款状态且提供了实际打款日期，更新设计单中的打款进度
            if status_data.quote_status == "已打款" and status_data.actual_payment_date:
                # 查找对应的订单
                order = db.query(Order).filter(Order.order_number == split.order_number).first()
                if order:
                    # 查找打款进度事项
                    payment_progress = db.query(Progress).filter(
                        Progress.order_id == order.id,
                        Progress.task_item == "报价"
                    ).first()
                    
                    if payment_progress:
                        # 更新实际打款日期
                        payment_progress.actual_date = status_data.actual_payment_date
                        payment_progress.updated_at = datetime.utcnow()
                    else:
                        # 如果没找到报价事项，创建一个新的进度事项
                        new_progress = Progress(
                            order_id=order.id,
                            task_item="报价",
                            planned_date=status_data.actual_payment_date,
                            actual_date=status_data.actual_payment_date,
                            remarks="系统自动创建"
                        )
                        db.add(new_progress)
            
        split.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(split)
        
        return split
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新拆单状态失败: {str(e)}"
        )


@router.put("/{split_id}/place-order", response_model=SplitResponse, summary="拆单下单")
async def place_split_order(
    split_id: int,
    db: Session = Depends(get_db)
):
    """
    拆单下单
    
    根据订单编号修改订单状态为下单
    """
    try:
        split = db.query(Split).filter(Split.id == split_id).first()
        if not split:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="拆单不存在"
            )
            
        # 更新拆单状态
        split.order_status = "已下单"
        
        # 更新关联的订单状态
        order = db.query(Order).filter(Order.order_number == split.order_number).first()
        if order:
            order.order_status = "已下单"
            
        # 检查是否已存在生产记录，如果不存在则创建
        existing_production = db.query(Production).filter(
            Production.order_number == split.order_number
        ).first()
        
        if not existing_production and order:
            # 创建生产记录
            production = Production(
                order_number=split.order_number,
                customer_name=split.customer_name,
                address=getattr(order, 'address', ''),
                is_installation=getattr(order, 'is_installation', False),
                customer_payment_date=getattr(order, 'customer_payment_date', None),
                split_order_date=datetime.utcnow().date(),
                expected_delivery_date=getattr(order, 'expected_delivery_date', None),
                purchase_status=PurchaseStatus.PENDING,
                board_18_quantity=0,
                board_09_quantity=0,
                internal_production_items=json.dumps(split.internal_production_items or []),
                external_purchase_items=json.dumps(split.external_purchase_items or []),
                remarks=getattr(split, 'remarks', ''),
                order_status="已下单"
            )
            db.add(production)
            
        split.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(split)
        
        return split
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"拆单下单失败: {str(e)}"
        )