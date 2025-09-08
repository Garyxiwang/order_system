from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.models.order import Order
from app.models.progress import Progress
from app.models.split import Split
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
            query = query.filter(Order.order_number.ilike(
                f"%{query_data.order_number}%"))

        if query_data.customer_name:
            query = query.filter(Order.customer_name.ilike(
                f"%{query_data.customer_name}%"))

        if query_data.designer:
            query = query.filter(Order.designer.ilike(
                f"%{query_data.designer}%"))

        if query_data.salesperson:
            query = query.filter(Order.salesperson.ilike(
                f"%{query_data.salesperson}%"))

        if query_data.order_status:
            # 定义所有已知的订单状态
            defined_statuses = [
                "量尺", "初稿", "报价", "打款", "延期", "暂停", 
                "等硬装", "客户待打款", "待客户确认", "待下单", "已下单", "已撤销"
            ]
            
            # 检查是否包含"其他"状态
            if "其他" in query_data.order_status:
                # 如果只选择了"其他"，则筛选出不在已定义状态中的订单
                if len(query_data.order_status) == 1:
                    query = query.filter(~Order.order_status.in_(defined_statuses))
                else:
                    # 如果同时选择了"其他"和其他状态，则包含其他状态和不在已定义状态中的订单
                    other_selected_statuses = [s for s in query_data.order_status if s != "其他"]
                    query = query.filter(
                        or_(
                            Order.order_status.in_(other_selected_statuses),
                            ~Order.order_status.in_(defined_statuses)
                        )
                    )
            else:
                # 如果没有选择"其他"，则按原逻辑筛选
                query = query.filter(
                    Order.order_status.in_(query_data.order_status))

        if query_data.order_type:
            query = query.filter(Order.order_type == query_data.order_type)

        if query_data.design_cycle:
            query = query.filter(Order.design_cycle == query_data.design_cycle)

        if query_data.category_names:
            # 使用包含关系查询，只要订单中包含任一选中的类目就匹配
            category_conditions = []
            for category in query_data.category_names:
                category_conditions.append(Order.category_name.like(f"%{category}%"))
            query = query.filter(or_(*category_conditions))

        if query_data.assignment_date_start:
            query = query.filter(Order.assignment_date >=
                                 query_data.assignment_date_start)

        if query_data.assignment_date_end:
            query = query.filter(Order.assignment_date <=
                                 query_data.assignment_date_end)

        if query_data.order_date_start:
            query = query.filter(func.date(Order.order_date)
                                 >= query_data.order_date_start)

        if query_data.order_date_end:
            query = query.filter(func.date(Order.order_date)
                                 <= query_data.order_date_end)

        # 获取总数
        total = query.count()

        # 默认按分单日期倒序排列
        query = query.order_by(Order.assignment_date.desc())

        # 分页
        offset = (query_data.page - 1) * query_data.page_size
        orders = query.offset(offset).limit(query_data.page_size).all()

        # 转换为响应格式
        order_items = []
        for order in orders:
            # 获取设计过程（进度信息）- 格式化为"事件名：实际时间"
            design_process_items = []
            if order.progresses:
                for p in order.progresses:
                    if p.actual_date:
                        design_process_items.append(
                            f"{p.task_item}:{p.actual_date.strftime('%Y-%m-%d')}")
                    else:
                        design_process_items.append(f"{p.task_item}:-")
                design_process = ",".join(design_process_items)
            else:
                design_process = "暂无进度"

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
                order_date=order.order_date,
                order_type=order.order_type,
                is_installation=order.is_installation,
                cabinet_area=order.cabinet_area,
                wall_panel_area=order.wall_panel_area,
                order_amount=order.order_amount,
                remarks=order.remarks,
                order_status=order.order_status
            )
            order_items.append(order_item)

        # 计算总页数
        total_pages = (total + query_data.page_size -
                       1) // query_data.page_size

        return OrderListResponse(
            items=order_items,
            total=total,
            page=query_data.page,
            page_size=query_data.page_size,
            total_pages=total_pages
        )

    except Exception as e:
        return error_response(message=f"获取订单列表失败: {str(e)}")


@router.post("/", summary="新增订单")
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):
    """新增订单"""
    try:
        # 检查订单编号是否已存在
        existing_order = db.query(Order).filter(
            Order.order_number == order_data.order_number).first()
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
            design_cycle=order_data.design_cycle or "0",
            cabinet_area=order_data.cabinet_area,
            wall_panel_area=order_data.wall_panel_area,
            design_area=(order_data.cabinet_area or 0) + (order_data.wall_panel_area or 0) if (
                order_data.cabinet_area or order_data.wall_panel_area) else None,
            order_amount=order_data.order_amount,
            is_installation=getattr(order_data, 'is_installation', False),
            remarks=getattr(order_data, 'remarks', None),
            order_status="进行中"
        )

        db.add(order)
        db.commit()
        db.refresh(order)

        return success_response(
            data=OrderResponse.from_orm(order),
            message="订单创建成功"
        )

    except Exception as e:
        db.rollback()
        return error_response(message=f"创建订单失败: {str(e)}")


@router.put("/{order_id}", summary="编辑订单")
async def update_order(
    order_id: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db)
):
    """编辑订单"""
    try:
        # 查找订单 - 按ID查找
        order = db.query(Order).filter(Order.id == order_id).first()

        if not order:
            return error_response(message="订单不存在")

        # 获取更新数据，保留None值以支持字段清空
        update_data = order_data.dict(exclude_none=False)
        # 只保留实际传递的字段
        update_data = {k: v for k, v in update_data.items(
        ) if k in order_data.__fields_set__ or v is None}

        # 如果更新了订单编号，检查是否重复
        if 'order_number' in update_data and update_data['order_number'] != order.order_number:
            existing_order = db.query(Order).filter(
                Order.order_number == update_data['order_number'],
                Order.id != order.id
            ).first()
            if existing_order:
                return error_response(message="订单编号已存在")

        # 更新订单字段

        # 如果更新了面积，重新计算设计面积
        if 'cabinet_area' in update_data or 'wall_panel_area' in update_data:
            cabinet_area = update_data.get('cabinet_area', order.cabinet_area)
            wall_panel_area = update_data.get(
                'wall_panel_area', order.wall_panel_area)
            if cabinet_area or wall_panel_area:
                update_data['design_area'] = (
                    cabinet_area or 0) + (wall_panel_area or 0)
            else:
                update_data['design_area'] = None

        for field, value in update_data.items():
            setattr(order, field, value)

        db.commit()
        db.refresh(order)

        return success_response(
            data=OrderResponse.from_orm(order),
            message="订单更新成功"
        )

    except Exception as e:
        db.rollback()
        return error_response(message=f"更新订单失败: {str(e)}")


@router.patch("/{order_id}/status", summary="更新订单状态")
async def update_order_status(
    order_id: str,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    """更新订单状态"""
    try:
        # 查找订单 - 支持通过ID或订单编号查找
        if order_id.isdigit():
            # 如果是数字，按ID查找
            order = db.query(Order).filter(Order.id == int(order_id)).first()
        else:
            # 如果不是数字，按订单编号查找
            order = db.query(Order).filter(
                Order.order_number == order_id).first()

        if not order:
            return error_response(message="订单不存在")

        # 记录原状态
        old_status = order.order_status

        # 如果要下单，检查是否存在下单进度事项
        if status_data.order_status == "已下单":
            if not order.has_order_progress():
                return error_response(message="订单中不存在下单进度事项，无法下单")

        # 更新状态
        order.order_status = status_data.order_status

        # 如果订单状态变更为下单，设置下单时间并自动创建拆单记录
        if (old_status != "已下单" and
                status_data.order_status == "已下单"):
            # 设置下单时间
            order.order_date = datetime.now().strftime('%Y-%m-%d')
            print("---=-=-=-,", datetime.now().strftime('%Y-%m-%d'))
            
            # 更新进度表中下单事项的实际时间
            order_progress = db.query(Progress).filter(
                Progress.order_id == order.id,
                Progress.task_item == "下单"
            ).first()
            if order_progress:
                order_progress.actual_date = datetime.strptime(order.order_date, '%Y-%m-%d').date()
                print(f"更新下单进度实际时间: {order_progress.actual_date}")
            # 检查是否已存在拆单记录
            existing_split = db.query(Split).filter(
                Split.order_number == order.order_number
            ).first()

            if not existing_split:
                # 创建拆单记录
                split = Split(
                    order_number=order.order_number,
                    customer_name=order.customer_name,
                    address=order.address,
                    order_date=order.order_date,
                    designer=order.designer,
                    salesperson=order.salesperson,
                    order_amount=order.order_amount,
                    design_area=getattr(order, 'design_area', None),
                    order_status=status_data.order_status,
                    order_type=order.order_type,
                    quote_status="未打款",
                    remarks=getattr(order, 'remarks', None),
                    # 根据订单类目创建生产项
                    internal_production_items=[
                        {
                            "category_name": order.category_name,
                            "planned_date": None,
                            "actual_date": None,
                            "status": "待开始",
                            "remarks": ""
                        }
                    ] if order.category_name else [],
                    external_purchase_items=[],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(split)

        db.commit()
        db.refresh(order)

        # 手动构建响应数据，确保progresses包含order_number
        order_dict = {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "address": order.address,
            "designer": order.designer,
            "salesperson": order.salesperson,
            "assignment_date": order.assignment_date,
            "order_date": order.order_date,
            "category_name": order.category_name,
            "order_type": order.order_type,
            "design_cycle": order.design_cycle or "0",
            "cabinet_area": order.cabinet_area,
            "wall_panel_area": order.wall_panel_area,
            "order_amount": order.order_amount,
            "is_installation": order.is_installation,
            "remarks": order.remarks,
            "design_area": order.design_area,
            "order_status": order.order_status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "progresses": [
                {
                    "id": progress.id,
                    "task_item": progress.task_item,
                    "planned_date": progress.planned_date.strftime("%Y-%m-%d") if progress.planned_date else None,
                    "actual_date": progress.actual_date.strftime("%Y-%m-%d") if progress.actual_date else None,
                    "remarks": progress.remarks,
                    "order_id": progress.order_id,
                    "order_number": order.order_number,
                    "created_at": progress.created_at,
                    "updated_at": progress.updated_at
                }
                for progress in order.progresses
            ]
        }

        return success_response(
            data=OrderResponse(**order_dict),
            message="订单状态更新成功"
        )

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
            joinedload(Order.progresses)
        ).filter(Order.id == order_id).first()

        if not order:
            raise HTTPException(status_code=404, detail="订单不存在")

        # 手动构建响应数据，确保progresses包含order_number
        order_dict = {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": order.customer_name,
            "address": order.address,
            "designer": order.designer,
            "salesperson": order.salesperson,
            "assignment_date": order.assignment_date,
            "order_date": order.order_date,
            "category_name": order.category_name,
            "order_type": order.order_type,
            "design_cycle": order.design_cycle or "0",
            "cabinet_area": order.cabinet_area,
            "wall_panel_area": order.wall_panel_area,
            "order_amount": order.order_amount,
            "is_installation": order.is_installation,
            "remarks": order.remarks,
            "design_area": order.design_area,
            "order_status": order.order_status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "progresses": [
                {
                    "id": progress.id,
                    "task_item": progress.task_item,
                    "planned_date": progress.planned_date.strftime("%Y-%m-%d") if progress.planned_date else None,
                    "actual_date": progress.actual_date.strftime("%Y-%m-%d") if progress.actual_date else None,
                    "remarks": progress.remarks,
                    "order_id": progress.order_id,
                    "order_number": order.order_number,
                    "created_at": progress.created_at,
                    "updated_at": progress.updated_at
                }
                for progress in order.progresses
            ]
        }

        return OrderResponse(**order_dict)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取订单详情失败: {str(e)}")
