from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
import math
import json
from datetime import datetime
from urllib.parse import unquote

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.split import Split
from app.models.order import Order
from app.models.production import Production
from app.models.production_progress import ProductionProgress, ItemType as ProductionItemType
from app.models.progress import Progress
from app.models.split_progress import SplitProgress, ItemType
from app.models.category import Category, CategoryType
from app.schemas.split import (
    SplitListQuery,
    SplitListResponse,
    SplitResponse,
    SplitUpdate,
    SplitProgressUpdate,
    SplitStatusUpdate,
    ProductionItem
)
from app.core.response import success_response, error_response

router = APIRouter()


def get_current_user(username: Optional[str] = Header(None, alias="X-Username"), db: Session = Depends(get_db)) -> Optional[User]:
    """获取当前用户信息"""
    if not username:
        return None
    # 解码URL编码的用户名
    username = unquote(username)
    return db.query(User).filter(User.username == username).first()


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

        # 按下单日期降序排序，再按订单编号降序排序
        query = query.order_by(Split.order_date.desc(), Split.order_number.desc())

        # 获取总数
        total = query.count()

        # 分页处理
        if query_data.no_pagination:
            # 不分页，获取所有数据
            splits = query.all()
            page = 1
            page_size = total
            total_pages = 1
        else:
            # 分页
            offset = (query_data.page - 1) * query_data.page_size
            splits = query.offset(offset).limit(query_data.page_size).all()
            page = query_data.page
            page_size = query_data.page_size
            total_pages = (total + page_size - 1) // page_size

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
                    # 格式："类目:实际时间:拆单周期"
                    if item.split_date:
                        if isinstance(item.split_date, str):
                            split_date = item.split_date
                        else:
                            split_date = item.split_date.strftime('%Y-%m-%d')
                         # 动态计算拆单周期：split_date - order_date
                        try:
                            split_dt = datetime.strptime(split_date, '%Y-%m-%d')
                            order_dt = datetime.strptime(split.order_date, '%Y-%m-%d')
                            cycle_days = (split_dt - order_dt).days
                        except ValueError:
                            cycle_days = 0
                    else:
                        split_date = ''
                        cycle_days = 0  # 没有split_date时为0
                    item_str = f"{item.category_name}:{split_date}:{cycle_days}"
                    internal_items.append(item_str)
                elif item.item_type == ItemType.EXTERNAL:
                    # 格式："类目:实际时间:拆单周期"
                    if item.purchase_date:
                        if isinstance(item.purchase_date, str):
                            purchase_date = item.purchase_date
                        else:
                            purchase_date = item.purchase_date.strftime(
                                '%Y-%m-%d')
                        # 动态计算拆单周期：purchase_date - order_date
                        try:
                            purchase_dt = datetime.strptime(purchase_date, '%Y-%m-%d')
                            order_dt = datetime.strptime(split.order_date, '%Y-%m-%d')
                            cycle_days = (purchase_dt - order_dt).days
                        except ValueError:
                            cycle_days = 0
                    else:
                        purchase_date = ''
                        cycle_days = 0  # 没有purchase_date时为0
                    item_str = f"{item.category_name}:{purchase_date}:{cycle_days}"
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
                "actual_payment_date": split.actual_payment_date,
                "completion_date": split.completion_date,
                "remarks": split.remarks,
                "created_at": split.created_at,
                "updated_at": split.updated_at
            }
            split_responses.append(split_dict)

        # 计算总页数
        if query_data.no_pagination:
            total_pages = 1
        else:
            total_pages = math.ceil(
                total / query_data.page_size) if total > 0 else 0

        return SplitListResponse(
            items=split_responses,
            total=total,
            page=page,
            page_size=page_size,
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
            # 格式："类目:实际时间:拆单周期"
            if item.split_date:
                if isinstance(item.split_date, str):
                    split_date = item.split_date
                else:
                    split_date = item.split_date.strftime('%Y-%m-%d')
                # 动态计算拆单周期：split_date - order_date
                try:
                    split_dt = datetime.strptime(split_date, '%Y-%m-%d')
                    order_dt = datetime.strptime(split.order_date, '%Y-%m-%d')
                    cycle_days = (split_dt - order_dt).days
                except ValueError:
                    cycle_days = 0
            else:
                split_date = ''
                cycle_days = 0  # 没有split_date时为0
            item_str = f"{item.category_name}:{split_date}:{cycle_days}"
            internal_items.append(item_str)
        elif item.item_type == ItemType.EXTERNAL:
            # 格式："类目:实际时间:拆单周期"
            if item.purchase_date:
                if isinstance(item.purchase_date, str):
                    purchase_date = item.purchase_date
                else:
                    purchase_date = item.purchase_date.strftime('%Y-%m-%d')
                # 动态计算拆单周期：purchase_date - order_date
                try:
                    purchase_dt = datetime.strptime(purchase_date, '%Y-%m-%d')
                    order_dt = datetime.strptime(split.order_date, '%Y-%m-%d')
                    cycle_days = (purchase_dt - order_dt).days
                except ValueError:
                    cycle_days = 0
            else:
                purchase_date = ''
                cycle_days = 0  # 没有purchase_date时为0
            item_str = f"{item.category_name}:{purchase_date}:{cycle_days}"
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
        "actual_payment_date": split.actual_payment_date,
        "completion_date": split.completion_date,
        "remarks": split.remarks,
        "created_at": split.created_at,
        "updated_at": split.updated_at
    }

    return split_dict


@router.put("/{split_id}", summary="编辑拆单")
async def update_split(
    split_id: int,
    split_data: SplitUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
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

        # 处理下单类目更新
        if 'production_items' in update_data and update_data['production_items'] is not None:
            # 新的production_items数组处理逻辑
            production_items = update_data['production_items']

            # 获取现有的进度记录
            existing_progress = db.query(SplitProgress).filter(
                SplitProgress.split_id == split_id).all()

            # 创建现有记录的映射（category_name + item_type作为key）
            existing_map = {}
            for progress in existing_progress:
                key = f"{progress.category_name}_{progress.item_type.value}"
                existing_map[key] = progress

            # 收集新的类目名称，用于同步到设计管理
            all_category_names = []
            new_items_map = {}

            # 处理新的production_items
            for item in production_items:
                category_name = item['category_name'].strip()
                all_category_names.append(category_name)

                # 自动解析类目类型：如果没有指定item_type，根据类目表查询正确类型
                item_type = item.get('item_type')
                if not item_type:
                    # 查询类目表获取正确的类型
                    category = db.query(Category).filter(
                        Category.name == category_name).first()
                    if category:
                        if category.category_type == CategoryType.INTERNAL_PRODUCTION:
                            item_type = 'internal'
                        elif category.category_type == CategoryType.EXTERNAL_PURCHASE:
                            item_type = 'external'
                        else:
                            item_type = 'internal'  # 默认为厂内项
                    else:
                        # 如果类目不存在于类目表中，默认为厂内项
                        item_type = 'internal'

                # 转换为枚举类型
                item_type_enum = ItemType.INTERNAL if item_type == 'internal' else ItemType.EXTERNAL

                key = f"{category_name}_{item_type}"
                new_items_map[key] = {
                    'category_name': category_name,
                    'item_type': item_type_enum,
                    'planned_date': item.get('planned_date'),
                    'actual_date': item.get('actual_date'),
                    'status': item.get('status', '待处理'),
                    'remarks': item.get('remarks')
                }

            # 删除不在新列表中的现有记录
            for key, progress in existing_map.items():
                if key not in new_items_map:
                    db.delete(progress)

            # 添加新的记录（跳过已存在的重复项）
            for key, item_data in new_items_map.items():
                if key not in existing_map:
                    progress_item = SplitProgress(
                        split_id=split_id,
                        order_number=split.order_number,
                        category_name=item_data['category_name'],
                        item_type=item_data['item_type'],
                        status=item_data['status']
                    )

                    # 设置日期字段
                    if item_data['planned_date']:
                        progress_item.planned_date = item_data['planned_date'].strftime(
                            '%Y-%m-%d')

                    if item_data['actual_date']:
                        if item_data['item_type'] == ItemType.INTERNAL:
                            progress_item.split_date = item_data['actual_date'].strftime(
                                '%Y-%m-%d')
                        else:
                            progress_item.purchase_date = item_data['actual_date'].strftime(
                                '%Y-%m-%d')

                    if item_data['remarks']:
                        progress_item.remarks = item_data['remarks']

                    db.add(progress_item)

            # 同步更新设计管理中相同订单编号的category_name
            if all_category_names:
                new_category_name = ','.join(all_category_names)
                db.query(Order).filter(Order.order_number == split.order_number).update({
                    'category_name': new_category_name
                })

        # 兼容旧版本的字符串格式处理
        elif 'internal_production_items' in update_data or 'external_purchase_items' in update_data:
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
                                        parts[1].strip(), '%Y-%m-%d').strftime('%Y-%m-%d')
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
                                        parts[1].strip(), '%Y-%m-%d').strftime('%Y-%m-%d')
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
            if field not in ['production_items', 'internal_production_items', 'external_purchase_items'] and hasattr(split, field):
                setattr(split, field, value)

        # 同步更新设计订单的三个字段
        order_updates = {}
        if 'cabinet_area' in update_data:
            order_updates['cabinet_area'] = update_data['cabinet_area']
        if 'wall_panel_area' in update_data:
            order_updates['wall_panel_area'] = update_data['wall_panel_area']
        if 'order_amount' in update_data:
            order_updates['order_amount'] = update_data['order_amount']
        
        if order_updates:
            db.query(Order).filter(Order.order_number == split.order_number).update(order_updates)

        # 检查是否更新了拆单员字段，如果拆单员存在且不为空，则自动将订单状态改为拆单中
        if 'splitter' in update_data and update_data['splitter'] and update_data['splitter'].strip():
            split.order_status = "拆单中"

        split.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(split)

        # 返回更新后的拆单信息（包含从split_progress表构建的字段）
        split_data = await get_split(split_id, db)
        return success_response(
            data=split_data,
            message="拆单订单更新成功"
        )

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

        # 获取完整的拆单信息
        split_data = await get_split(split_id, db)
        return success_response(
            data=split_data,
            message="拆单状态更新成功"
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新拆单进度失败: {str(e)}"
        )


@router.put("/{split_id}/status", summary="修改拆单状态")
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
            
            # 如果更新为已打款状态且提供了实际打款日期，保存到拆单表并更新设计单中的打款进度
            if status_data.quote_status == "已打款" and status_data.actual_payment_date:
                # 保存实际打款日期到拆单表
                split.actual_payment_date = status_data.actual_payment_date
                # 查找对应的订单
                order = db.query(Order).filter(
                    Order.order_number == split.order_number).first()
                if order:
                    # 查找打款进度事项
                    payment_progress = db.query(Progress).filter(
                        Progress.order_id == order.id,
                        Progress.task_item == "打款"
                    ).first()

                    if payment_progress:
                        # 更新实际打款日期
                        payment_progress.actual_date = status_data.actual_payment_date
                        payment_progress.updated_at = datetime.utcnow()
                    else:
                        # 如果没找到打款事项，创建一个新的进度事项
                        new_progress = Progress(
                            order_id=order.id,
                            task_item="打款",
                            planned_date=status_data.actual_payment_date,
                            actual_date=status_data.actual_payment_date,
                            remarks="系统自动创建"
                        )
                        db.add(new_progress)

        split.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(split)

        # 获取完整的拆单信息
        split_data = await get_split(split_id, db)
        return success_response(
            data=split_data,
            message="拆单状态更新成功"
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新拆单状态失败: {str(e)}"
        )


@router.put("/{split_id}/place-order", summary="拆单下单")
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
        # 设置完成时间
        split.completion_date = datetime.now().strftime('%Y-%m-%d')

        # 更新关联的订单状态
        order = db.query(Order).filter(
            Order.order_number == split.order_number).first()
        if order:
            order.order_status = "已下单"

        # 检查是否已存在生产记录，如果不存在则创建
        existing_production = db.query(Production).filter(
            Production.order_number == split.order_number
        ).first()

        # 获取拆单进度项（无论是否存在生产记录都需要）
        split_progress_items = db.query(SplitProgress).filter(
            SplitProgress.split_id == split.id
        ).all()

        if not existing_production and order:
            # 计算预计交货日期（实际打款日期往后推迟20天）
            expected_delivery_date = None
            payment_date = None
            if split.actual_payment_date:
                if isinstance(split.actual_payment_date, str):
                    payment_date = datetime.strptime(split.actual_payment_date, '%Y-%m-%d')
                else:
                    payment_date = split.actual_payment_date
            elif hasattr(order, 'customer_payment_date') and order.customer_payment_date:
                if isinstance(order.customer_payment_date, str):
                    payment_date = datetime.strptime(order.customer_payment_date, '%Y-%m-%d')
                else:
                    payment_date = order.customer_payment_date
            
            if payment_date:
                from datetime import timedelta
                expected_delivery_date = (payment_date + timedelta(days=20)).strftime('%Y-%m-%d')
            
            # 计算下单天数（拆单日期 - 打款日期）
            order_days = 0
            if payment_date:
                split_order_date = datetime.now()
                order_days = (split_order_date - payment_date).days
            
            # 拆单进度项已在上面获取
            
            # 构建生产项字符串
            internal_items = []
            external_items = []
            for item in split_progress_items:
                if item.item_type == ItemType.INTERNAL:
                    internal_items.append(item.category_name)
                elif item.item_type == ItemType.EXTERNAL:
                    external_items.append(item.category_name)
            
            internal_production_items = ','.join(internal_items)
            external_purchase_items = ','.join(external_items)
            
            # 创建生产记录
            production = Production(
                order_id=order.id,
                order_number=split.order_number,
                customer_name=split.customer_name,
                address=getattr(order, 'address', ''),
                splitter=split.splitter,
                is_installation=getattr(order, 'is_installation', False),
                customer_payment_date=split.actual_payment_date if split.actual_payment_date else getattr(order, 'customer_payment_date', None),
                split_order_date=split.completion_date if split.completion_date else datetime.now().strftime('%Y-%m-%d'),
                internal_production_items=internal_production_items,
                external_purchase_items=external_purchase_items,
                order_days=order_days,
                expected_delivery_date=expected_delivery_date,
                board_18="",
                board_09="",
                order_status="未齐料",
                actual_delivery_date=None,
                cutting_date=None,
                expected_shipping_date=None,
                remarks=getattr(split, 'remarks', '')
            )
            db.add(production)
            db.flush()  # 获取生产记录ID
            
            # 创建生产进度记录
            # 处理厂内生产项（下单日期允许为空，供页面录入）
            for item in split_progress_items:
                if item.item_type == ItemType.INTERNAL:
                    split_date = item.split_date if item.split_date else None
                    
                    progress_item = ProductionProgress(
                         production_id=production.id,
                         order_number=split.order_number,
                         item_type=ProductionItemType.INTERNAL,
                         category_name=item.category_name,
                         order_date=split_date,
                         expected_material_date=None,
                         actual_storage_date=None,
                         storage_time=None,
                         quantity=None
                     )
                    db.add(progress_item)
                elif item.item_type == ItemType.EXTERNAL:
                    purchase_date = item.purchase_date if item.purchase_date else None
                    
                    progress_item = ProductionProgress(
                         production_id=production.id,
                         order_number=split.order_number,
                         item_type=ProductionItemType.EXTERNAL,
                         category_name=item.category_name,
                         order_date=purchase_date,
                         expected_arrival_date=None,
                         actual_arrival_date=None
                     )
                    db.add(progress_item)
            
            # 默认为厂内生产添加五金类目
            default_date = split.completion_date if split.completion_date else datetime.now().strftime('%Y-%m-%d')
            hardware_progress_item = ProductionProgress(
                production_id=production.id,
                order_number=split.order_number,
                item_type=ProductionItemType.INTERNAL,
                category_name="五金",
                order_date=default_date,
                expected_material_date=None,
                actual_storage_date=None,
                storage_time=None,
                quantity=None
            )
            db.add(hardware_progress_item)
        
        # 如果生产记录已存在，需要同步生产进度记录与类目类型
        elif existing_production:
            # 1) 构建当前拆单类目映射：{category_name: (目标类型, 参考日期)}
            split_map = {}
            internal_items = []
            external_items = []
            for item in split_progress_items:
                if item.item_type == ItemType.INTERNAL:
                    # 厂内生产参考拆单日期（允许为空）
                    ref_date = item.split_date if item.split_date else None
                    split_map[item.category_name] = (ProductionItemType.INTERNAL, ref_date)
                    internal_items.append(item.category_name)
                elif item.item_type == ItemType.EXTERNAL:
                    # 外采参考采购日期
                    ref_date = item.purchase_date if item.purchase_date else None
                    split_map[item.category_name] = (ProductionItemType.EXTERNAL, ref_date)
                    external_items.append(item.category_name)

            # 2) 读取现有生产进度，按类目分组
            existing_progresses = db.query(ProductionProgress).filter(
                ProductionProgress.production_id == existing_production.id
            ).all()
            progress_map = {}
            for p in existing_progresses:
                progress_map.setdefault(p.category_name, []).append(p)

            # 3) 删除不在拆单中的类目（保留“五金”默认项）
            for category, entries in list(progress_map.items()):
                if category == "五金":
                    continue
                if category not in split_map:
                    for entry in entries:
                        db.delete(entry)
                    del progress_map[category]

            # 4) 更新或新增拆单中的类目到生产进度
            for category, (target_type, ref_date) in split_map.items():
                if category in progress_map:
                    # 更新所有同类目的条目为目标类型，并清理无关字段
                    for entry in progress_map[category]:
                        if entry.item_type != target_type:
                            entry.item_type = target_type
                            # 切换为厂内时清理外采字段
                            if target_type == ProductionItemType.INTERNAL:
                                entry.expected_arrival_date = None
                                entry.actual_arrival_date = None
                                # 厂内字段保留现值，不强制覆盖
                            else:
                                # 切换为外采时清理厂内字段
                                entry.expected_material_date = None
                                entry.actual_storage_date = None
                                entry.storage_time = None
                                entry.quantity = None
                        # 补齐参考日期（仅在原为空时）
                        if not entry.order_date and ref_date:
                            entry.order_date = ref_date
                else:
                    # 新增生产进度记录
                    if target_type == ProductionItemType.INTERNAL:
                        progress_item = ProductionProgress(
                            production_id=existing_production.id,
                            order_number=split.order_number,
                            item_type=ProductionItemType.INTERNAL,
                            category_name=category,
                            order_date=ref_date,
                            expected_material_date=None,
                            actual_storage_date=None,
                            storage_time=None,
                            quantity=None
                        )
                    else:
                        progress_item = ProductionProgress(
                            production_id=existing_production.id,
                            order_number=split.order_number,
                            item_type=ProductionItemType.EXTERNAL,
                            category_name=category,
                            order_date=ref_date,
                            expected_arrival_date=None,
                            actual_arrival_date=None
                        )
                    db.add(progress_item)
                    progress_map.setdefault(category, []).append(progress_item)

            # 5) 保留并补齐默认“五金”类目
            existing_hardware = db.query(ProductionProgress).filter(
                ProductionProgress.production_id == existing_production.id,
                ProductionProgress.category_name == "五金"
            ).first()
            if not existing_hardware:
                default_date = split.completion_date if split.completion_date else datetime.now().strftime('%Y-%m-%d')
                hardware_progress_item = ProductionProgress(
                    production_id=existing_production.id,
                    order_number=split.order_number,
                    item_type=ProductionItemType.INTERNAL,
                    category_name="五金",
                    order_date=default_date,
                    expected_material_date=None,
                    actual_storage_date=None,
                    storage_time=None,
                    quantity=None
                )
                db.add(hardware_progress_item)

            # 6) 同步生产单的类目字符串字段
            existing_production.internal_production_items = ','.join(internal_items)
            existing_production.external_purchase_items = ','.join(external_items)

        db.commit()
        db.refresh(split)

        return success_response(
            data={
                "split_id": split.id,
                "order_number": split.order_number,
                "order_status": split.order_status,
                "completion_date": split.completion_date,
                "production_created": not existing_production
            },
            message="拆单下单成功，生产管理订单已创建"
        )

    except Exception as e:
        db.rollback()
        return error_response(
            message=f"拆单下单失败: {str(e)}",
            code=500
        )
