from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text, Integer
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.models.order import Order
from app.models.progress import Progress
from app.models.split import Split
from app.models.split_progress import SplitProgress, ItemType
from app.models.category import Category, CategoryType
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
from app.utils.scheduler import calculate_design_cycle_days

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
                    query = query.filter(
                        ~Order.order_status.in_(defined_statuses))
                else:
                    # 如果同时选择了"其他"和其他状态，则包含其他状态和不在已定义状态中的订单
                    other_selected_statuses = [
                        s for s in query_data.order_status if s != "其他"]
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

        if query_data.design_cycle_filter:
            # 设计周期范围筛选
            if query_data.design_cycle_filter == "lte20":
                # 小于等于20天
                query = query.filter(
                    func.cast(Order.design_cycle, Integer) <= 20)
            elif query_data.design_cycle_filter == "gt20":
                # 大于20天
                query = query.filter(
                    func.cast(Order.design_cycle, Integer) > 20)
            elif query_data.design_cycle_filter == "lt50":
                # 小于50天
                query = query.filter(
                    func.cast(Order.design_cycle, Integer) < 50)

        if query_data.category_names:
            # 使用包含关系查询，只要订单中包含任一选中的类目就匹配
            category_conditions = []
            for category in query_data.category_names:
                category_conditions.append(
                    Order.category_name.like(f"%{category}%"))
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

        # 按更新时间降序，然后按下单日期降序排序
        query = query.order_by(Order.updated_at.desc(), Order.order_date.desc())

        # 分页处理
        if query_data.no_pagination:
            # 不分页，获取所有数据
            orders = query.all()
            page = 1
            page_size = total
            total_pages = 1
        else:
            # 分页
            offset = (query_data.page - 1) * query_data.page_size
            orders = query.offset(offset).limit(query_data.page_size).all()
            page = query_data.page
            page_size = query_data.page_size
            total_pages = (total + page_size - 1) // page_size

        # 转换为响应格式
        order_items = []
        for order in orders:
            # 获取设计过程（进度信息）- 格式化为"事件名：实际时间"
            design_process_items = []
            if order.progresses:
                # 按照created_at从近到远排序
                sorted_progresses = sorted(
                    order.progresses, key=lambda p: p.created_at, reverse=True)
                for p in sorted_progresses:
                    if p.actual_date:
                        design_process_items.append(
                            f"{p.task_item}:{p.actual_date}")
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

        return OrderListResponse(
            items=order_items,
            total=total,
            page=page,
            page_size=page_size,
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

        # 根据订单类型设置初始状态
        initial_status = "已下单" if order_data.order_type == "生产单" else "进行中"

        # 计算设计周期（基于分单日期）
        design_cycle_days = calculate_design_cycle_days(
            order_data.assignment_date)

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
            design_cycle=str(design_cycle_days),  # 设置计算出的设计周期
            cabinet_area=order_data.cabinet_area,
            wall_panel_area=order_data.wall_panel_area,

            order_amount=order_data.order_amount,
            is_installation=getattr(order_data, 'is_installation', False),
            remarks=getattr(order_data, 'remarks', None),
            order_status=initial_status
        )

        db.add(order)
        db.commit()
        db.refresh(order)

        # 如果是生产单，自动创建拆单数据
        if order_data.order_type == "生产单":
            # 生产单的下单日期和分单日期一致
            split_order_date = order.assignment_date

            split = Split(
                order_number=order.order_number,
                customer_name=order.customer_name,
                address=order.address,
                order_date=split_order_date,
                designer=order.designer,
                salesperson=order.salesperson,
                order_amount=order.order_amount,
                cabinet_area=order.cabinet_area,
                wall_panel_area=order.wall_panel_area,
                order_type=order.order_type,
                order_status="未开始",
                quote_status="未打款"
            )
            db.add(split)
            db.flush()  # 获取split.id

            # 根据订单类目创建拆单进度记录
            if order.category_name:
                # 解析类目名称（可能是逗号分隔的多个类目）
                category_names = [
                    name.strip() for name in order.category_name.split(',') if name.strip()]

                for category_name in category_names:
                    # 查询类目表获取类目类型
                    category = db.query(Category).filter(
                        Category.name == category_name).first()

                    if category:
                        # 根据类目类型创建对应的进度记录
                        if category.category_type == CategoryType.INTERNAL_PRODUCTION:
                            progress_item = SplitProgress(
                                split_id=split.id,
                                order_number=order.order_number,
                                category_name=category_name,
                                item_type=ItemType.INTERNAL
                            )
                        elif category.category_type == CategoryType.EXTERNAL_PURCHASE:
                            progress_item = SplitProgress(
                                split_id=split.id,
                                order_number=order.order_number,
                                category_name=category_name,
                                item_type=ItemType.EXTERNAL
                            )
                        else:
                            # 默认为厂内生产项
                            progress_item = SplitProgress(
                                split_id=split.id,
                                order_number=order.order_number,
                                category_name=category_name,
                                item_type=ItemType.INTERNAL
                            )
                        db.add(progress_item)
                    else:
                        # 如果类目不存在，默认创建厂内生产项
                        progress_item = SplitProgress(
                            split_id=split.id,
                            order_number=order.order_number,
                            category_name=category_name,
                            item_type=ItemType.INTERNAL
                        )
                        db.add(progress_item)

            db.commit()

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
        # 查找订单 - 按ID查找，预加载进度数据
        order = db.query(Order).options(
            joinedload(Order.progresses)
        ).filter(Order.id == order_id).first()

        if not order:
            return error_response(message="订单不存在")

        # 获取更新数据，只包含实际传递的字段
        update_data = order_data.dict(exclude_unset=True)

        # 不允许修改订单编号
        if 'order_number' in update_data:
            return error_response(message="不允许修改订单编号")

        # 更新订单字段
        # 如果更新了订单相关字段，同步更新拆单表中的数据
        split_update_fields = {
            'customer_name': 'customer_name',
            'address': 'address',
            'order_date': 'order_date',
            'designer': 'designer',
            'salesperson': 'salesperson',
            'order_amount': 'order_amount',
            'cabinet_area': 'cabinet_area',
            'wall_panel_area': 'wall_panel_area',
            'order_type': 'order_type',
            'order_status': 'order_status'
        }

        # 检查是否有需要同步到拆单表的字段更新
        split_updates = {}
        for order_field, split_field in split_update_fields.items():
            if order_field in update_data:
                split_updates[split_field] = update_data[order_field]

        # 如果有字段需要同步更新，更新拆单表
        if split_updates:
            db.query(Split).filter(Split.order_number ==
                                   order.order_number).update(split_updates)

        # 如果更新了category_name，需要同步更新split_progress表
        if 'category_name' in update_data:
            # 查找对应的拆单记录
            split = db.query(Split).filter(
                Split.order_number == order.order_number).first()
            if split:
                # 获取新的类目名称列表
                new_category_name = update_data['category_name']
                new_category_names = set()
                if new_category_name:
                    new_category_names = set(
                        name.strip() for name in new_category_name.split(',') if name.strip())

                # 获取现有的split_progress记录
                existing_progress = db.query(SplitProgress).filter(
                    SplitProgress.split_id == split.id).all()
                existing_category_names = set(
                    progress.category_name for progress in existing_progress)

                # 找出需要添加的类目（新类目中有，但现有记录中没有的）
                categories_to_add = new_category_names - existing_category_names
                
                # 找出需要删除的类目（现有记录中有，但新类目中没有的）
                categories_to_remove = existing_category_names - new_category_names

                # 删除多余的类目记录
                if categories_to_remove:
                    db.query(SplitProgress).filter(
                        SplitProgress.split_id == split.id,
                        SplitProgress.category_name.in_(categories_to_remove)
                    ).delete(synchronize_session=False)

                # 添加新的类目记录
                for category_name in categories_to_add:
                    # 查询类目表获取类目类型
                    category = db.query(Category).filter(
                        Category.name == category_name).first()

                    if category:
                        item_type = ItemType.INTERNAL if category.category_type == CategoryType.INTERNAL_PRODUCTION else ItemType.EXTERNAL

                        split_progress = SplitProgress(
                            split_id=split.id,
                            order_number=order.order_number,
                            category_name=category_name,
                            item_type=item_type
                        )
                        db.add(split_progress)

        # 更新订单表字段
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

            # 重新计算设计周期（基于下单日期）
            design_cycle_days = calculate_design_cycle_days(order.order_date)
            order.design_cycle = str(design_cycle_days)

            # 更新进度表中下单事项的实际时间
            order_progress = db.query(Progress).filter(
                Progress.order_id == order.id,
                Progress.task_item == "下单"
            ).first()
            if order_progress:
                order_progress.actual_date = datetime.strptime(
                    order.order_date, '%Y-%m-%d').date()
            # 检查是否已存在拆单记录
            existing_split = db.query(Split).filter(
                Split.order_number == order.order_number
            ).first()

            if not existing_split:
                # 检查打款状态
                payment_progress = db.query(Progress).filter(
                    Progress.order_id == order.id,
                    Progress.task_item == "打款"
                ).first()

                # 如果存在打款事项且已填写实际日期，则为已打款，否则为未打款
                quote_status = "已打款" if (
                    payment_progress and payment_progress.actual_date) else "未打款"
                
                # 获取实际打款日期
                actual_payment_date = None
                if payment_progress and payment_progress.actual_date:
                    actual_payment_date = payment_progress.actual_date.strftime('%Y-%m-%d') if isinstance(payment_progress.actual_date, date) else str(payment_progress.actual_date)

                # 创建拆单记录
                split = Split(
                    order_number=order.order_number,
                    customer_name=order.customer_name,
                    address=order.address,
                    order_date=order.order_date,
                    designer=order.designer,
                    salesperson=order.salesperson,
                    order_amount=order.order_amount,
                    cabinet_area=getattr(order, 'cabinet_area', None),
                    wall_panel_area=getattr(order, 'wall_panel_area', None),
                    order_status="未开始",
                    order_type=order.order_type,
                    quote_status=quote_status,
                    actual_payment_date=actual_payment_date,
                    remarks="",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(split)
                db.flush()  # 获取split.id

                # 根据订单类目创建拆单进度记录
                if order.category_name:
                    # 解析类目名称（可能是逗号分隔的多个类目）
                    category_names = [
                        name.strip() for name in order.category_name.split(',') if name.strip()]

                    for category_name in category_names:
                        # 查询类目表获取类目类型
                        category = db.query(Category).filter(
                            Category.name == category_name).first()

                        if category:
                            # 根据类目类型创建对应的进度记录
                            if category.category_type == CategoryType.INTERNAL_PRODUCTION:
                                progress_item = SplitProgress(
                                    split_id=split.id,
                                    order_number=order.order_number,
                                    category_name=category_name,
                                    item_type=ItemType.INTERNAL
                                )
                            elif category.category_type == CategoryType.EXTERNAL_PURCHASE:
                                progress_item = SplitProgress(
                                    split_id=split.id,
                                    order_number=order.order_number,
                                    category_name=category_name,
                                    item_type=ItemType.EXTERNAL
                                )
                            else:
                                # 默认为厂内生产项
                                progress_item = SplitProgress(
                                    split_id=split.id,
                                    order_number=order.order_number,
                                    category_name=category_name,
                                    item_type=ItemType.INTERNAL
                                )
                            db.add(progress_item)
                        else:
                            # 如果类目不存在，默认创建厂内生产项
                            progress_item = SplitProgress(
                                split_id=split.id,
                                order_number=order.order_number,
                                category_name=category_name,
                                item_type=ItemType.INTERNAL
                            )
                            db.add(progress_item)

        # 如果订单状态变更为已撤销，同步更新拆单管理中相同订单的状态为撤销中
        if status_data.order_status == "已撤销":
            existing_split = db.query(Split).filter(
                Split.order_number == order.order_number
            ).first()
            if existing_split:
                existing_split.order_status = "撤销中"

        # 如果订单状态变更为已下单，检查拆单管理中相同订单是否为撤销中，如果是则改为进行中
        if status_data.order_status == "已下单":
            existing_split = db.query(Split).filter(
                Split.order_number == order.order_number
            ).first()
            if existing_split and existing_split.order_status == "撤销中":
                existing_split.order_status = "拆单中"

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
            "order_status": order.order_status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "progresses": [
                {
                    "id": progress.id,
                    "task_item": progress.task_item,
                    "planned_date": progress.planned_date,
                    "actual_date": progress.actual_date,
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
            "order_status": order.order_status,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "progresses": [
                {
                    "id": progress.id,
                    "task_item": progress.task_item,
                    "planned_date": progress.planned_date if progress.planned_date else None,
                    "actual_date": progress.actual_date if progress.actual_date else None,
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
