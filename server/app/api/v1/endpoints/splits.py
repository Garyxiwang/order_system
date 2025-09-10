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
from app.models.split_progress import SplitProgress, ItemType
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
            query = query.filter(
                Split.order_number.contains(query_data.order_number))
        if query_data.customer_name:
            query = query.filter(
                Split.customer_name.contains(query_data.customer_name))
        if query_data.designer:
            query = query.filter(Split.designer.contains(query_data.designer))
        if query_data.salesperson:
            query = query.filter(
                Split.salesperson.contains(query_data.salesperson))
        if query_data.splitter:
            query = query.filter(Split.splitter.contains(query_data.splitter))
        if query_data.order_type:
            query = query.filter(Split.order_type == query_data.order_type)

        # 多选状态过滤
        if query_data.order_status:
            query = query.filter(
                Split.order_status.in_(query_data.order_status))
        if query_data.quote_status:
            query = query.filter(
                Split.quote_status.in_(query_data.quote_status))

        # 类目过滤（从split_progress表中查询）
        if query_data.category_names:
            # 查询包含指定类目的拆单ID
            split_ids_with_categories = db.query(SplitProgress.split_id).filter(
                SplitProgress.category_name.in_(query_data.category_names)
            ).distinct().subquery()

            query = query.filter(Split.id.in_(split_ids_with_categories))

        # 日期区间过滤
        if query_data.order_date_start:
            query = query.filter(Split.order_date >=
                                 query_data.order_date_start)
        if query_data.order_date_end:
            query = query.filter(Split.order_date <= query_data.order_date_end)
        if query_data.completion_date_start:
            query = query.filter(Split.completion_date >=
                                 query_data.completion_date_start)
        if query_data.completion_date_end:
            query = query.filter(Split.completion_date <=
                                 query_data.completion_date_end)

        # 获取总数
        total = query.count()

        # 分页
        offset = (query_data.page - 1) * query_data.page_size
        splits = query.offset(offset).limit(query_data.page_size).all()

        # 为每个拆单构建internal_production_items和external_purchase_items字段
        split_responses = []
        for split in splits:
            # 查询该拆单的进度记录
            progress_items = db.query(SplitProgress).filter(
                SplitProgress.split_id == split.id
            ).all()

            # 构建厂内生产项字符串
            internal_items = []
            external_items = []

            for item in progress_items:
                if item.item_type == ItemType.INTERNAL:
                    # 格式："类目:实际时间:消耗时间"
                    if item.split_date:
                        if isinstance(item.split_date, str):
                            split_date = item.split_date
                        else:
                            split_date = item.split_date.strftime('%Y-%m-%d')
                    else:
                        split_date = ''
                    item_str = f"{item.category_name}:{split_date}:-"
                    internal_items.append(item_str)
                elif item.item_type == ItemType.EXTERNAL:
                    # 格式："类目:实际时间:消耗时间"
                    if item.purchase_date:
                        if isinstance(item.purchase_date, str):
                            purchase_date = item.purchase_date
                        else:
                            purchase_date = item.purchase_date.strftime(
                                '%Y-%m-%d')
                    else:
                        purchase_date = ''
                    item_str = f"{item.category_name}:{purchase_date}:-"
                    external_items.append(item_str)
            # 创建响应对象
            split_dict = {
                "id": split.id,
                "order_number": split.order_number,
                "customer_name": split.customer_name,
                "address": split.address,
                "order_date": split.order_date,
                "designer": split.designer,
                "salesperson": split.salesperson,
                "order_amount": split.order_amount,
                "cabinet_area": split.cabinet_area,
                "wall_panel_area": split.wall_panel_area,
                "order_type": split.order_type,
                "order_status": split.order_status,
                "splitter": split.splitter,
                "internal_production_items": ",".join(internal_items) if internal_items else "",
                "external_purchase_items": ",".join(external_items) if external_items else "",
                "quote_status": split.quote_status,
                "completion_date": split.completion_date,
                "remarks": split.remarks,
                "created_at": split.created_at,
                "updated_at": split.updated_at
            }
            split_responses.append(split_dict)

        # 计算总页数
        total_pages = math.ceil(
            total / query_data.page_size) if total > 0 else 0

        return SplitListResponse(
            items=split_responses,
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

    # 查询该拆单的进度记录
    progress_items = db.query(SplitProgress).filter(
        SplitProgress.split_id == split.id
    ).all()

    # 构建厂内生产项和外购项字符串
    internal_items = []
    external_items = []

    for item in progress_items:
        if item.item_type == ItemType.INTERNAL:
            # 格式："类目:实际时间:消耗时间"
            if item.split_date:
                if isinstance(item.split_date, str):
                    split_date = item.split_date
                else:
                    split_date = item.split_date.strftime('%Y-%m-%d')
            else:
                split_date = ''
            item_str = f"{item.category_name}:{split_date}:-"
            internal_items.append(item_str)
        elif item.item_type == ItemType.EXTERNAL:
            # 格式："类目:实际时间:消耗时间"
            if item.purchase_date:
                if isinstance(item.purchase_date, str):
                    purchase_date = item.purchase_date
                else:
                    purchase_date = item.purchase_date.strftime('%Y-%m-%d')
            else:
                purchase_date = ''
            item_str = f"{item.category_name}:{purchase_date}:-"
            external_items.append(item_str)

    # 创建响应对象
    split_dict = {
        "id": split.id,
        "order_number": split.order_number,
        "customer_name": split.customer_name,
        "address": split.address,
        "order_date": split.order_date,
        "designer": split.designer,
        "salesperson": split.salesperson,
        "order_amount": split.order_amount,
        "cabinet_area": split.cabinet_area,
        "wall_panel_area": split.wall_panel_area,
        "order_type": split.order_type,
        "order_status": split.order_status,
        "splitter": split.splitter,
        "internal_production_items": ",".join(internal_items) if internal_items else "",
        "external_purchase_items": ",".join(external_items) if external_items else "",
        "quote_status": split.quote_status,
        "completion_date": split.completion_date,
        "remarks": split.remarks,
        "created_at": split.created_at,
        "updated_at": split.updated_at
    }

    return split_dict


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

        # 处理下单类目更新（internal_production_items和external_purchase_items）
        if 'internal_production_items' in update_data or 'external_purchase_items' in update_data:
            # 先删除现有的进度记录
            db.query(SplitProgress).filter(
                SplitProgress.split_id == split_id).delete()

            # 收集所有类目名称，用于同步到设计管理
            all_category_names = []

            # 重新创建进度记录
            if 'internal_production_items' in update_data and update_data['internal_production_items']:
                # 解析厂内生产项字符串（格式："类目1::-,类目2::-"）
                internal_items = update_data['internal_production_items'].split(
                    ',')
                for item_str in internal_items:
                    if item_str.strip():
                        parts = item_str.split(':')
                        if len(parts) >= 1:
                            category_name = parts[0].strip()
                            all_category_names.append(category_name)
                            progress_item = SplitProgress(
                                split_id=split_id,
                                order_number=split.order_number,
                                category_name=category_name,
                                item_type=ItemType.INTERNAL
                            )
                            # 如果有日期信息，也要设置
                            if len(parts) >= 2 and parts[1].strip():
                                try:
                                    from datetime import datetime as dt
                                    progress_item.split_date = dt.strptime(
                                        parts[1].strip(), '%Y-%m-%d')
                                except:
                                    pass
                            db.add(progress_item)

            if 'external_purchase_items' in update_data and update_data['external_purchase_items']:
                # 解析外购项字符串
                external_items = update_data['external_purchase_items'].split(
                    ',')
                for item_str in external_items:
                    if item_str.strip():
                        parts = item_str.split(':')
                        if len(parts) >= 1:
                            category_name = parts[0].strip()
                            all_category_names.append(category_name)
                            progress_item = SplitProgress(
                                split_id=split_id,
                                order_number=split.order_number,
                                category_name=category_name,
                                item_type=ItemType.EXTERNAL
                            )
                            # 如果有日期信息，也要设置
                            if len(parts) >= 2 and parts[1].strip():
                                try:
                                    from datetime import datetime as dt
                                    progress_item.purchase_date = dt.strptime(
                                        parts[1].strip(), '%Y-%m-%d')
                                except:
                                    pass
                            db.add(progress_item)

            # 同步更新设计管理中相同订单编号的category_name
            if all_category_names:
                new_category_name = ','.join(all_category_names)
                db.query(Order).filter(Order.order_number == split.order_number).update({
                    'category_name': new_category_name
                })

        # 更新其他字段（排除已处理的类目字段）
        for field, value in update_data.items():
            if field not in ['internal_production_items', 'external_purchase_items'] and hasattr(split, field):
                setattr(split, field, value)

        split.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(split)

        # 返回更新后的拆单信息（包含从split_progress表构建的字段）
        return await get_split(split_id, db)

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

        # 根据项目类型获取对应的生产项字符串
        if progress_data.item_type == "internal":
            items_str = split.internal_production_items or ""
        elif progress_data.item_type == "external":
            items_str = split.external_purchase_items or ""
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的项目类型"
            )

        # 解析字符串格式的生产项（格式："类目:实际时间:消耗时间"）
        items_list = items_str.split(",") if items_str else []
        updated_items = []
        item_found = False

        for item_str in items_list:
            if not item_str.strip():
                continue

            parts = item_str.split(":")
            if len(parts) >= 3:
                category_name = parts[0]
                actual_time = parts[1] if parts[1] != "-" else ""
                consume_time = parts[2] if parts[2] != "-" else ""

                # 如果是要更新的类目
                if category_name == progress_data.category_name:
                    # 更新实际时间（如果提供了actual_date）
                    if progress_data.actual_date is not None:
                        actual_time = progress_data.actual_date.isoformat()
                    # 这里可以根据需要添加消耗时间的更新逻辑

                    item_found = True

                # 重新组装项目字符串
                actual_time = actual_time if actual_time else "-"
                consume_time = consume_time if consume_time else "-"
                updated_items.append(
                    f"{category_name}:{actual_time}:{consume_time}")
            else:
                # 保持原格式
                updated_items.append(item_str)

        if not item_found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"未找到类目: {progress_data.category_name}"
            )

        # 重新组装字符串
        updated_items_str = ",".join(updated_items)

        # 更新数据库
        if progress_data.item_type == "internal":
            split.internal_production_items = updated_items_str
        else:
            split.external_purchase_items = updated_items_str

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
                order = db.query(Order).filter(
                    Order.order_number == split.order_number).first()
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
        order = db.query(Order).filter(
            Order.order_number == split.order_number).first()
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
                customer_payment_date=getattr(
                    order, 'customer_payment_date', None),
                split_order_date=datetime.utcnow().date(),
                expected_delivery_date=getattr(
                    order, 'expected_delivery_date', None),
                purchase_status=PurchaseStatus.PENDING,
                board_18_quantity=0,
                board_09_quantity=0,
                internal_production_items=split.internal_production_items or "",
                external_purchase_items=split.external_purchase_items or "",
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
