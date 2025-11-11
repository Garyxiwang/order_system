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
from app.utils.production_status_validator import validate_production_status

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
        # 构建基础查询
        query = db.query(Production)

        # 搜索条件
        if query_data.order_number:
            query = query.filter(Production.order_number.like(
                f"%{query_data.order_number}%"))

        if query_data.customer_name:
            query = query.filter(Production.customer_name.like(
                f"%{query_data.customer_name}%"))

        if query_data.order_status:
            query = query.filter(
                Production.order_status.in_(query_data.order_status))

        # 类目和完成状态组合过滤（从production_progress表中查询）
        if query_data.completion_status:
            # 根据完成状态筛选
            if query_data.completion_status == "completed":
                # 查询完成的：所有类目都有实际日期
                if query_data.order_category:
                    # 如果指定了类目，查询这些类目都完成的订单
                    # 对于厂内生产项（INTERNAL），检查 actual_storage_date 不为空
                    # 对于外购项（EXTERNAL），检查 actual_arrival_date 不为空
                    completed_internal = db.query(ProductionProgress.production_id).filter(
                        ProductionProgress.category_name.in_(query_data.order_category),
                        ProductionProgress.item_type == ItemType.INTERNAL,
                        ProductionProgress.actual_storage_date.isnot(None),
                        ProductionProgress.actual_storage_date != ""
                    ).distinct()
                    
                    completed_external = db.query(ProductionProgress.production_id).filter(
                        ProductionProgress.category_name.in_(query_data.order_category),
                        ProductionProgress.item_type == ItemType.EXTERNAL,
                        ProductionProgress.actual_arrival_date.isnot(None),
                        ProductionProgress.actual_arrival_date != ""
                    ).distinct()
                    
                    # 合并两个查询结果
                    completed_production_ids = completed_internal.union(completed_external).subquery()
                    query = query.filter(Production.id.in_(completed_production_ids))
                else:
                    # 如果没有指定类目，查询所有类目都完成的订单
                    # 需要确保订单的所有类目都有实际日期
                    # 查询有实际日期的类目数量
                    completed_counts = db.query(
                        ProductionProgress.production_id,
                        func.count(ProductionProgress.id).label('completed_count')
                    ).filter(
                        or_(
                            and_(
                                ProductionProgress.item_type == ItemType.INTERNAL,
                                ProductionProgress.actual_storage_date.isnot(None),
                                ProductionProgress.actual_storage_date != ""
                            ),
                            and_(
                                ProductionProgress.item_type == ItemType.EXTERNAL,
                                ProductionProgress.actual_arrival_date.isnot(None),
                                ProductionProgress.actual_arrival_date != ""
                            )
                        )
                    ).group_by(ProductionProgress.production_id).subquery()
                    
                    # 查询总类目数量
                    total_counts = db.query(
                        ProductionProgress.production_id,
                        func.count(ProductionProgress.id).label('total_count')
                    ).group_by(ProductionProgress.production_id).subquery()
                    
                    # 查询完成数量等于总数量的生产ID
                    fully_completed = db.query(total_counts.c.production_id).join(
                        completed_counts,
                        total_counts.c.production_id == completed_counts.c.production_id
                    ).filter(
                        total_counts.c.total_count == completed_counts.c.completed_count
                    ).subquery()
                    
                    query = query.filter(Production.id.in_(fully_completed))
            elif query_data.completion_status == "incomplete":
                # 查询未完成的：至少有一个类目没有实际日期
                if query_data.order_category:
                    # 如果指定了类目，查询这些类目未完成的订单
                    incomplete_internal = db.query(ProductionProgress.production_id).filter(
                        ProductionProgress.category_name.in_(query_data.order_category),
                        ProductionProgress.item_type == ItemType.INTERNAL,
                        or_(
                            ProductionProgress.actual_storage_date.is_(None),
                            ProductionProgress.actual_storage_date == ""
                        )
                    ).distinct()
                    
                    incomplete_external = db.query(ProductionProgress.production_id).filter(
                        ProductionProgress.category_name.in_(query_data.order_category),
                        ProductionProgress.item_type == ItemType.EXTERNAL,
                        or_(
                            ProductionProgress.actual_arrival_date.is_(None),
                            ProductionProgress.actual_arrival_date == ""
                        )
                    ).distinct()
                    
                    # 合并两个查询结果
                    incomplete_production_ids = incomplete_internal.union(incomplete_external).subquery()
                    query = query.filter(Production.id.in_(incomplete_production_ids))
                else:
                    # 如果没有指定类目，查询至少有一个类目未完成的订单
                    incomplete_internal = db.query(ProductionProgress.production_id).filter(
                        ProductionProgress.item_type == ItemType.INTERNAL,
                        or_(
                            ProductionProgress.actual_storage_date.is_(None),
                            ProductionProgress.actual_storage_date == ""
                        )
                    ).distinct()
                    
                    incomplete_external = db.query(ProductionProgress.production_id).filter(
                        ProductionProgress.item_type == ItemType.EXTERNAL,
                        or_(
                            ProductionProgress.actual_arrival_date.is_(None),
                            ProductionProgress.actual_arrival_date == ""
                        )
                    ).distinct()
                    
                    # 合并两个查询结果
                    incomplete_production_ids = incomplete_internal.union(incomplete_external).subquery()
                    query = query.filter(Production.id.in_(incomplete_production_ids))
        elif query_data.order_category:
            # 如果只选择了类目，没有选择完成状态，查询包含指定类目的生产ID
            # 需要JOIN ProductionProgress表
            query = query.join(ProductionProgress, Production.id == ProductionProgress.production_id)
            query = query.filter(ProductionProgress.category_name.in_(query_data.order_category))
            # 去重，因为一个Production可能对应多个ProductionProgress记录
            query = query.distinct()

        # 日期区间搜索
        if query_data.expected_delivery_start:
            query = query.filter(
                Production.expected_delivery_date >= query_data.expected_delivery_start)
        if query_data.expected_delivery_end:
            query = query.filter(
                Production.expected_delivery_date <= query_data.expected_delivery_end)

        if query_data.cutting_date_start:
            query = query.filter(Production.cutting_date >=
                                 query_data.cutting_date_start)
        if query_data.cutting_date_end:
            query = query.filter(Production.cutting_date <=
                                 query_data.cutting_date_end)

        if query_data.expected_shipment_start:
            query = query.filter(
                Production.expected_shipping_date >= query_data.expected_shipment_start)
        if query_data.expected_shipment_end:
            query = query.filter(
                Production.expected_shipping_date <= query_data.expected_shipment_end)

        if query_data.actual_shipment_start:
            query = query.filter(
                Production.actual_delivery_date >= query_data.actual_shipment_start)
        if query_data.actual_shipment_end:
            query = query.filter(
                Production.actual_delivery_date <= query_data.actual_shipment_end)

        # 获取总数
        total = query.count()

        # 排序处理
        sort_field = query_data.sort
        sort_order = query_data.sort_order or "desc"  # 默认降序

        # 定义排序字段映射
        sort_mapping = {
            "expected_delivery_date": Production.expected_delivery_date,
            "expected_shipping_date": Production.expected_shipping_date,
            "split_order_date": Production.split_order_date,
        }

        # 获取排序字段，如果页面没有传入排序字段则默认使用预计出货日期
        if sort_field and sort_field in sort_mapping:
            order_column = sort_mapping[sort_field]
        else:
            # 默认按预计出货日期排序
            order_column = Production.expected_shipping_date

        # 根据排序规则设置排序方向
        if sort_order.lower() == "asc":
            # 升序：从远到近
            primary_order = order_column.asc().nulls_last()
        else:
            # 降序：从近到远（默认）
            primary_order = order_column.desc().nulls_last()

        # 分页处理
        if query_data.no_pagination:
            # 不分页，返回全部数据
            # 使用 NULLS LAST 确保空值排在最后，然后按订单编号降序
            productions = query.order_by(
                primary_order,
                Production.order_number.desc()
            ).all()
        else:
            # 分页
            offset = (query_data.page - 1) * query_data.page_size
            # 使用 NULLS LAST 确保空值排在最后，然后按订单编号降序
            productions = query.order_by(
                primary_order,
                Production.order_number.desc()
            ).offset(offset).limit(query_data.page_size).all()

        # 转换为响应格式
        production_items = []
        for production in productions:
            # 查询生产进度表，生成采购状态
            progress_items = db.query(ProductionProgress).filter(
                ProductionProgress.production_id == production.id
            ).all()

            # 生成采购状态字符串
            purchase_status_parts = []
            # 生成成品入库数量字符串
            finished_goods_quantity_parts = []

            for progress in progress_items:
                if progress.item_type == ItemType.INTERNAL:
                    # 厂内项目：同时返回计划齐料日期与实际入库日期
                    planned = progress.expected_material_date or ""
                    actual = progress.actual_storage_date or ""
                    purchase_status_parts.append(
                        f"{progress.category_name}材料:{planned}:{actual}"
                    )

                    # 厂内项目：生成成品入库数量信息
                    if progress.quantity:
                        finished_goods_quantity_parts.append(
                            f"{progress.category_name}:{progress.quantity}"
                        )
                    else:
                        finished_goods_quantity_parts.append(
                            f"{progress.category_name}:"
                        )

                elif progress.item_type == ItemType.EXTERNAL:
                    # 外购项目：同时返回计划到厂日期与实际到厂日期
                    planned = progress.expected_arrival_date or ""
                    actual = progress.actual_arrival_date or ""
                    purchase_status_parts.append(
                        f"{progress.category_name}:{planned}:{actual}"
                    )

                    # 外购项目：也生成成品入库数量信息
                    if progress.quantity:
                        finished_goods_quantity_parts.append(
                            f"{progress.category_name}:{progress.quantity}"
                        )
                    else:
                        finished_goods_quantity_parts.append(
                            f"{progress.category_name}:"
                        )

            purchase_status = "; ".join(
                purchase_status_parts) if purchase_status_parts else "暂无进度信息"
            finished_goods_quantity = "; ".join(
                finished_goods_quantity_parts) if finished_goods_quantity_parts else "暂无数量信息"
            print(purchase_status)
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
                "finished_goods_quantity": finished_goods_quantity,
                "created_at": production.created_at,
                "updated_at": production.updated_at
            }
            production_items.append(ProductionListItem(**item_data))

        # 计算总页数
        if query_data.no_pagination:
            total_pages = 1  # 不分页时总页数为1
        else:
            total_pages = math.ceil(
                total / query_data.page_size) if total > 0 else 0

        return ProductionListResponse(
            data=production_items,
            total=total,
            page=query_data.page if not query_data.no_pagination else 1,
            page_size=len(
                production_items) if query_data.no_pagination else query_data.page_size,
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
        production = db.query(Production).filter(
            Production.id == production_id).first()
        if not production:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="生产记录不存在"
            )

        # 更新字段
        update_data = production_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(production, field, value)

        # 使用新的状态校验方法自动更新状态
        validate_production_status(db, production_id)

        db.commit()
        db.refresh(production)

        # 手动构建响应数据
        production_dict = {
            "id": production.id,
            "order_id": production.order_id,
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
        production = db.query(Production).filter(
            Production.id == production_id).first()
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
