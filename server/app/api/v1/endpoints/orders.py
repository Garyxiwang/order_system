from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.models.order import Order, OrderStatus, OrderType, DesignCycle
from app.models.progress import Progress
# from app.models.category import Category  # 不再需要
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderStatusUpdate,
    OrderResponse,
    OrderListQuery,
    OrderListResponse,
    OrderListItem
)
from app.core.response import success_response, error_response

router = APIRouter()


@router.post("/list", response_model=OrderListResponse, summary="获取订单列表")
async def get_orders(
    query_data: OrderListQuery,
    db: Session = Depends(get_db)
):
    """获取订单列表，支持多种搜索条件"""
    try:
        # 构建查询
        query = db.query(Order).options(
            joinedload(Order.progresses)
        )
        
        # 应用搜索条件
        if query_data.order_number:
            query = query.filter(Order.order_number.ilike(f"%{query_data.order_number}%"))
        
        if query_data.customer_name:
            query = query.filter(Order.customer_name.ilike(f"%{query_data.customer_name}%"))
        
        if query_data.designer:
            query = query.filter(Order.designer.ilike(f"%{query_data.designer}%"))
        
        if query_data.salesperson:
            query = query.filter(Order.salesperson.ilike(f"%{query_data.salesperson}%"))
        
        if query_data.order_status:
            query = query.filter(Order.order_status.in_(query_data.order_status))
        
        if query_data.order_type:
            query = query.filter(Order.order_type == query_data.order_type)
        
        if query_data.design_cycle:
            query = query.filter(Order.design_cycle == query_data.design_cycle)
        
        if query_data.category_names:
            query = query.filter(Order.category_name.in_(query_data.category_names))
        
        if query_data.assignment_date_start:
            query = query.filter(Order.assignment_date >= query_data.assignment_date_start)
        
        if query_data.assignment_date_end:
            query = query.filter(Order.assignment_date <= query_data.assignment_date_end)
        
        if query_data.order_date_start:
            query = query.filter(func.date(Order.order_date) >= query_data.order_date_start)
        
        if query_data.order_date_end:
            query = query.filter(func.date(Order.order_date) <= query_data.order_date_end)
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (query_data.page - 1) * query_data.page_size
        orders = query.offset(offset).limit(query_data.page_size).all()
        
        # 转换为响应格式
        order_items = []
        for order in orders:
            # 获取设计过程（进度信息）
            design_process = ", ".join([
                f"{p.task_item}({p.actual_date.strftime('%Y-%m-%d') if p.actual_date else '未完成'})"
                for p in order.progresses
            ]) if order.progresses else "暂无进度"
            
            order_item = OrderListItem(
                id=order.id,
                order_number=order.order_number,
                customer_name=order.customer_name,
                address=order.address,
                designer=order.designer,
                salesperson=order.salesperson,
                assignment_date=order.assignment_date,
                design_process=design_process,
                category_name=order.category_name,
                design_cycle=order.design_cycle,
                order_date=order.created_at.date(),
                order_type=order.order_type,
                is_installation=order.is_installation,
                design_area=order.design_area,
                order_amount=order.order_amount,
                remarks=order.remarks,
                order_status=order.order_status
            )
            order_items.append(order_item)
        
        # 计算总页数
        total_pages = (total + query_data.page_size - 1) // query_data.page_size
        
        return OrderListResponse(
            items=order_items,
            total=total,
            page=query_data.page,
            page_size=query_data.page_size,
            total_pages=total_pages
        )
    
    except Exception as e:
        return error_response(message=f"获取订单列表失败: {str(e)}")


@router.post("/", response_model=OrderResponse, summary="新增订单")
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):
    """新增订单"""
    try:
        # 检查订单编号是否已存在
        existing_order = db.query(Order).filter(Order.order_number == order_data.order_number).first()
        if existing_order:
            return error_response(message="订单编号已存在")
        
        # 创建订单
        order = Order(
            order_number=order_data.order_number,
            customer_name=order_data.customer_name,

            address=order_data.address,
            designer=order_data.designer,
            salesperson=order_data.salesperson,
            assignment_date=order_data.assignment_date,
            order_date=order_data.order_date,
            category_name=order_data.category_name,
            order_type=order_data.order_type,
            design_cycle=order_data.design_cycle,
            cabinet_area=getattr(order_data, 'cabinet_area', 0) or 0,
            wall_panel_area=getattr(order_data, 'wall_panel_area', 0) or 0,
            design_area=(getattr(order_data, 'cabinet_area', 0) or 0) + (getattr(order_data, 'wall_panel_area', 0) or 0),
            order_amount=order_data.order_amount,
            is_installation=getattr(order_data, 'is_installation', False),
            remarks=getattr(order_data, 'remarks', None),
            order_status=OrderStatus.PENDING
        )
        
        db.add(order)
        db.commit()
        db.refresh(order)
        
        return OrderResponse.from_orm(order)
    
    except Exception as e:
        db.rollback()
        return error_response(message=f"创建订单失败: {str(e)}")


@router.put("/{order_id}", response_model=OrderResponse, summary="编辑订单")
async def update_order(
    order_id: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db)
):
    """编辑订单"""
    try:
        # 查找订单
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return error_response(message="订单不存在")
        

        # 如果更新了订单编号，检查是否重复
        if order_data.order_number and order_data.order_number != order.order_number:
            existing_order = db.query(Order).filter(
                Order.order_number == order_data.order_number,
                Order.id != order_id
            ).first()
            if existing_order:
                return error_response(message="订单编号已存在")
        
        # 更新订单字段
        update_data = order_data.dict(exclude_unset=True)
        
        # 如果更新了面积，重新计算设计面积
        if 'cabinet_area' in update_data or 'wall_panel_area' in update_data:
            cabinet_area = update_data.get('cabinet_area', order.cabinet_area)
            wall_panel_area = update_data.get('wall_panel_area', order.wall_panel_area)
            update_data['design_area'] = cabinet_area + wall_panel_area
        
        for field, value in update_data.items():
            setattr(order, field, value)
        
        db.commit()
        db.refresh(order)
        
        return OrderResponse.from_orm(order)
    
    except Exception as e:
        db.rollback()
        return error_response(message=f"更新订单失败: {str(e)}")


@router.patch("/{order_id}/status", response_model=OrderResponse, summary="更新订单状态")
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    """更新订单状态"""
    try:
        # 查找订单
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return error_response(message="订单不存在")
        
        # 更新状态
        order.order_status = status_data.order_status
        
        db.commit()
        db.refresh(order)
        
        return OrderResponse.from_orm(order)
    
    except Exception as e:
        db.rollback()
        return error_response(message=f"更新订单状态失败: {str(e)}")


@router.get("/{order_id}", response_model=OrderResponse, summary="获取订单详情")
async def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    """获取订单详情"""
    try:
        order = db.query(Order).options(
            joinedload(Order.category),
            joinedload(Order.progresses)
        ).filter(Order.id == order_id).first()
        
        if not order:
            return error_response(message="订单不存在")
        
        return OrderResponse.from_orm(order)
    
    except Exception as e:
        return error_response(message=f"获取订单详情失败: {str(e)}")