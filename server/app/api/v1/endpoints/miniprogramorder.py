from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, text, Integer
from typing import List, Optional
from datetime import datetime, date
import traceback

from app.core.database import get_db
from app.models.order import Order
from app.models.progress import Progress
from app.models.split import Split
from app.models.split_progress import SplitProgress, ItemType
from app.models.production import Production
from app.models.production_progress import ProductionProgress
from app.schemas.order import (
    OrderListQuery,
    OrderListResponse,
    OrderListItem
)
from app.core.response import success_response, error_response
from app.utils.scheduler import calculate_design_cycle_days

router = APIRouter()


@router.post("/list", response_model=OrderListResponse, summary="小程序订单列表查询")
async def get_miniprogram_orders(
    query_data: OrderListQuery,
    db: Session = Depends(get_db)
):
    """
    小程序订单列表查询接口
    
    支持根据订单进度筛选：
    - 如果 order_progress 为空或包含全部（设计、拆单、生产）：查询三个表的数据并去重
    - 如果只选择某个进度：只查询对应表
    - 如果选择多个进度：查询对应表并去重
    
    所有结果按订单编号去重
    """
    try:
        # 检查是否有订单进度筛选（使用 getattr 安全获取字段，避免字段不存在时报错）
        order_progress = getattr(query_data, 'order_progress', None)
        if order_progress and len(order_progress) > 0:
            # 检查是否包含全部三个进度
            has_all = set(["设计", "拆单", "生产"]).issubset(set(order_progress))
            
            if not has_all and len(order_progress) == 1:
                # 只查询一个表
                progress = order_progress[0]
                if progress == "设计":
                    return await _get_orders_from_design(query_data, db)
                elif progress == "拆单":
                    return await _get_orders_from_split(query_data, db)
                elif progress == "生产":
                    return await _get_orders_from_production(query_data, db)
            else:
                # 查询多个表或全部表，需要合并并去重
                return await _get_orders_merged(query_data, db)
        
        # 默认查询全部订单（三个表合并去重）
        return await _get_orders_merged(query_data, db)

    except Exception as e:
        traceback.print_exc()
        # 返回空结果而不是错误响应，以符合 response_model
        return OrderListResponse(
            items=[],
            total=0,
            page=1,
            page_size=query_data.page_size,
            total_pages=0
        )


async def _get_orders_from_design(query_data: OrderListQuery, db: Session):
    """从设计订单表查询"""
    try:
        # 构建查询
        query = db.query(Order).options(
            joinedload(Order.progresses)
        )

        # 判断是否需要关联拆单表（用于拆单员和报价状态筛选）
        need_join_split = query_data.splitter or query_data.quote_status
        
        if need_join_split:
            # 使用 LEFT JOIN 关联拆单表，避免丢失没有拆单记录的订单
            query = query.outerjoin(Split, Order.order_number == Split.order_number)

        # 应用搜索条件（仅保留小程序需要的字段）
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

        # 拆单员筛选：通过关联的拆单表筛选
        if query_data.splitter:
            query = query.filter(Split.splitter.ilike(
                f"%{query_data.splitter}%"))

        # 报价状态筛选：通过关联的拆单表筛选
        if query_data.quote_status:
            query = query.filter(Split.quote_status.in_(query_data.quote_status))

        if query_data.order_type:
            query = query.filter(Order.order_type == query_data.order_type)

        if query_data.category_names:
            category_conditions = []
            for category in query_data.category_names:
                category_conditions.append(
                    Order.category_name.like(f"%{category}%"))
            query = query.filter(or_(*category_conditions))
        
        # 订单状态详情筛选（设计管理）
        order_status_detail = getattr(query_data, 'order_status_detail', None)
        if order_status_detail and len(order_status_detail) > 0:
            # 定义设计管理的所有已知状态
            design_statuses = [
                "量尺", "初稿", "公司对方案", "线上对方案", "改图", "客户确认图",
                "客户硬装阶段", "出内部结构图", "出下单图", "复尺", "报价", "打款", 
                "下单", "暂停", "已下单", "已撤销", "其他"
            ]
            
            # 检查是否包含"其他"状态
            if "其他" in order_status_detail:
                # 如果只选择了"其他"，则筛选出不在已定义状态中的订单
                if len(order_status_detail) == 1:
                    query = query.filter(
                        ~Order.order_status.in_(design_statuses))
                else:
                    # 如果同时选择了"其他"和其他状态，则包含其他状态和不在已定义状态中的订单
                    other_selected_statuses = [
                        s for s in order_status_detail if s != "其他"]
                    query = query.filter(
                        or_(
                            Order.order_status.in_(other_selected_statuses),
                            ~Order.order_status.in_(design_statuses)
                        )
                    )
            else:
                # 如果没有选择"其他"，则按原逻辑筛选
                query = query.filter(
                    Order.order_status.in_(order_status_detail))
        
        # 如果关联了拆单表，需要去重（因为一个订单可能对应多个拆单记录，虽然理论上应该只有一个）
        if need_join_split:
            query = query.distinct()

        query = query.order_by(Order.assignment_date.desc())

        # 分页
        total = query.count()
        if query_data.no_pagination:
            orders = query.all()
            page = 1
            page_size = total
            total_pages = 1
        else:
            offset = (query_data.page - 1) * query_data.page_size
            orders = query.offset(offset).limit(query_data.page_size).all()
            page = query_data.page
            page_size = query_data.page_size
            total_pages = (total + page_size - 1) // page_size

        # 转换为响应格式
        order_items = []
        for order in orders:
            design_process_items = []
            if order.progresses:
                sorted_progresses = sorted(
                    order.progresses, key=lambda p: p.created_at, reverse=True)
                for p in sorted_progresses:
                    planned = p.planned_date if p.planned_date else "-"
                    actual = p.actual_date if p.actual_date else "-"
                    design_process_items.append(f"{p.task_item}:{planned}:{actual}")
                design_process = ",".join(design_process_items)
            else:
                design_process = "暂无进度"

            calculated_design_cycle = str(calculate_design_cycle_days(
                order.assignment_date, 
                order.order_date, 
                order.order_status
            ))

            # 动态获取订单状态：如果设计阶段已下单，查看拆单状态；如果拆单阶段已下单，查看生产状态
            final_order_status = order.order_status
            quote_status = None
            splitter = None
            progress_prefix = "设计"  # 默认前缀
            
            # 检查前端是否选择了具体的进度
            order_progress = getattr(query_data, 'order_progress', None)
            is_specific_progress = order_progress and len(order_progress) == 1 and order_progress[0] == "设计"
            
            # 查询拆单表获取拆单员和报价状态
            split = db.query(Split).filter(Split.order_number == order.order_number).first()
            if split:
                splitter = split.splitter
                quote_status = split.quote_status
                # 如果前端选择了具体的进度，就不自动变更状态前缀
                if not is_specific_progress:
                    # 如果设计阶段状态是"已下单"，查看拆单表的状态
                    if order.order_status == "已下单":
                        # 如果拆单状态也是"已下单"，查询生产表的状态
                        if split.order_status == "已下单":
                            production = db.query(Production).filter(Production.order_number == order.order_number).first()
                            if production:
                                final_order_status = production.order_status
                                progress_prefix = "生产"
                            else:
                                final_order_status = split.order_status
                                progress_prefix = "拆单"
                        else:
                            final_order_status = split.order_status
                            progress_prefix = "拆单"
            
            # 添加进度前缀
            final_order_status = f"{progress_prefix}-{final_order_status}"

            order_item = OrderListItem(
                id=order.id,
                order_number=order.order_number,
                customer_name=order.customer_name,
                address=order.address,
                designer=order.designer,
                salesperson=order.salesperson,
                splitter=splitter,
                assignment_date=order.assignment_date,
                design_process=design_process,
                category_name=order.category_name,
                design_cycle=calculated_design_cycle,
                order_date=order.order_date,
                order_type=order.order_type,
                is_installation=order.is_installation,
                cabinet_area=order.cabinet_area,
                wall_panel_area=order.wall_panel_area,
                order_amount=order.order_amount,
                remarks=order.remarks,
                order_status=final_order_status,
                quote_status=quote_status
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
        traceback.print_exc()
        # 返回空结果而不是错误响应
        return OrderListResponse(
            items=[],
            total=0,
            page=query_data.page,
            page_size=query_data.page_size,
            total_pages=0
        )


async def _get_orders_from_split(query_data: OrderListQuery, db: Session):
    """从拆单表查询"""
    try:
        # 直接查询拆单表
        query = db.query(Split)
        
        # 应用搜索条件（仅保留小程序需要的字段）
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
        if query_data.quote_status:
            query = query.filter(Split.quote_status.in_(query_data.quote_status))
        if query_data.category_names:
            # 通过SplitProgress查询
            split_ids_with_categories = db.query(SplitProgress.split_id).filter(
                SplitProgress.category_name.in_(query_data.category_names)
            ).distinct().subquery()
            query = query.filter(Split.id.in_(split_ids_with_categories))
        
        # 订单状态详情筛选（拆单管理）
        order_status_detail = getattr(query_data, 'order_status_detail', None)
        if order_status_detail and len(order_status_detail) > 0:
            # 定义拆单管理的所有已知状态
            split_statuses = [
                "未开始", "拆单中", "撤销中", "未审核", "已审核", "已下单"
            ]
            
            # 检查是否包含"其他"状态
            if "其他" in order_status_detail:
                # 如果只选择了"其他"，则筛选出不在已定义状态中的订单
                if len(order_status_detail) == 1:
                    query = query.filter(
                        ~Split.order_status.in_(split_statuses))
                else:
                    # 如果同时选择了"其他"和其他状态，则包含其他状态和不在已定义状态中的订单
                    other_selected_statuses = [
                        s for s in order_status_detail if s != "其他"]
                    query = query.filter(
                        or_(
                            Split.order_status.in_(other_selected_statuses),
                            ~Split.order_status.in_(split_statuses)
                        )
                    )
            else:
                # 如果没有选择"其他"，则按原逻辑筛选
                query = query.filter(
                    Split.order_status.in_(order_status_detail))
        
        # 排序
        query = query.order_by(Split.order_date.desc(), Split.order_number.desc())
        
        # 分页
        total = query.count()
        if query_data.no_pagination:
            splits = query.all()
            page = 1
            page_size = total
            total_pages = 1
        else:
            offset = (query_data.page - 1) * query_data.page_size
            splits = query.offset(offset).limit(query_data.page_size).all()
            page = query_data.page
            page_size = query_data.page_size
            total_pages = (total + page_size - 1) // page_size
        
        # 转换为 OrderListResponse 格式
        order_items = []
        # 检查前端是否选择了具体的进度
        order_progress = getattr(query_data, 'order_progress', None)
        is_specific_progress = order_progress and len(order_progress) == 1 and order_progress[0] == "拆单"
        
        for split in splits:
            # 动态获取订单状态：如果拆单阶段状态是"已下单"，查看生产表的状态
            final_order_status = split.order_status
            progress_prefix = "拆单"  # 默认前缀
            # 如果前端选择了具体的进度，就不自动变更状态前缀
            if not is_specific_progress:
                if split.order_status == "已下单":
                    production = db.query(Production).filter(Production.order_number == split.order_number).first()
                    if production:
                        final_order_status = production.order_status
                        progress_prefix = "生产"
            
            # 添加进度前缀
            final_order_status = f"{progress_prefix}-{final_order_status}"
            
            order_item = OrderListItem(
                id=split.id,
                order_number=split.order_number,
                customer_name=split.customer_name,
                address=split.address,
                designer=split.designer,
                salesperson=split.salesperson,
                splitter=split.splitter,  # 拆单表有拆单员
                assignment_date=split.order_date or "",  # 拆单没有assignment_date，使用order_date
                design_process="",
                category_name="",  # 拆单的类目信息在split_progress中
                design_cycle="",
                order_date=split.order_date,
                order_type=split.order_type,
                is_installation=False,  # 拆单表没有is_installation字段
                cabinet_area=split.cabinet_area,
                wall_panel_area=split.wall_panel_area,
                order_amount=split.order_amount,
                remarks=split.remarks,
                order_status=final_order_status,
                quote_status=split.quote_status
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
        traceback.print_exc()
        # 返回空结果而不是错误响应
        return OrderListResponse(
            items=[],
            total=0,
            page=query_data.page,
            page_size=query_data.page_size,
            total_pages=0
        )


async def _get_orders_from_production(query_data: OrderListQuery, db: Session):
    """从生产表查询"""
    try:
        # 直接查询生产表
        query = db.query(Production)
        
        # 判断是否需要关联拆单表（用于设计师、销售员、订单类型、报价状态筛选）
        need_join_split = (query_data.designer or query_data.salesperson or 
                          query_data.order_type or query_data.quote_status)
        
        if need_join_split:
            # 使用 LEFT JOIN 关联拆单表
            query = query.outerjoin(Split, Production.order_number == Split.order_number)
        
        # 应用搜索条件（仅保留小程序需要的字段）
        if query_data.order_number:
            query = query.filter(Production.order_number.like(f"%{query_data.order_number}%"))
        if query_data.customer_name:
            query = query.filter(Production.customer_name.like(f"%{query_data.customer_name}%"))
        
        # 设计师筛选：通过关联的拆单表筛选
        if query_data.designer:
            query = query.filter(Split.designer.ilike(
                f"%{query_data.designer}%"))
        
        # 销售员筛选：通过关联的拆单表筛选
        if query_data.salesperson:
            query = query.filter(Split.salesperson.ilike(
                f"%{query_data.salesperson}%"))
        
        # 拆单员筛选：生产表本身有splitter字段
        if query_data.splitter:
            query = query.filter(Production.splitter.ilike(
                f"%{query_data.splitter}%"))
        
        # 订单类型筛选：通过关联的拆单表筛选
        if query_data.order_type:
            query = query.filter(Split.order_type == query_data.order_type)
        
        # 报价状态筛选：通过关联的拆单表筛选
        if query_data.quote_status:
            query = query.filter(Split.quote_status.in_(query_data.quote_status))
        
        if query_data.category_names:
            # 通过ProductionProgress查询
            query = query.join(ProductionProgress, Production.id == ProductionProgress.production_id)
            query = query.filter(ProductionProgress.category_name.in_(query_data.category_names))
            query = query.distinct()
        elif need_join_split:
            # 如果关联了拆单表但没有关联ProductionProgress，也需要去重
            query = query.distinct()
        
        # 订单状态详情筛选（生产管理）
        order_status_detail = getattr(query_data, 'order_status_detail', None)
        if order_status_detail and len(order_status_detail) > 0:
            # 定义生产管理的所有已知状态
            production_statuses = [
                "未齐料", "已齐料", "已下料", "已入库", "已发货", "已完成"
            ]
            
            # 检查是否包含"其他"状态
            if "其他" in order_status_detail:
                # 如果只选择了"其他"，则筛选出不在已定义状态中的订单
                if len(order_status_detail) == 1:
                    query = query.filter(
                        ~Production.order_status.in_(production_statuses))
                else:
                    # 如果同时选择了"其他"和其他状态，则包含其他状态和不在已定义状态中的订单
                    other_selected_statuses = [
                        s for s in order_status_detail if s != "其他"]
                    query = query.filter(
                        or_(
                            Production.order_status.in_(other_selected_statuses),
                            ~Production.order_status.in_(production_statuses)
                        )
                    )
            else:
                # 如果没有选择"其他"，则按原逻辑筛选
                query = query.filter(
                    Production.order_status.in_(order_status_detail))
        
        # 排序
        query = query.order_by(Production.expected_shipping_date.desc().nulls_last(), Production.order_number.desc())
        
        # 分页
        total = query.count()
        if query_data.no_pagination:
            productions = query.all()
            page = 1
            page_size = total
            total_pages = 1
        else:
            offset = (query_data.page - 1) * query_data.page_size
            productions = query.offset(offset).limit(query_data.page_size).all()
            page = query_data.page
            page_size = query_data.page_size
            total_pages = (total + page_size - 1) // page_size
        
        # 转换为 OrderListResponse 格式
        order_items = []
        # 检查前端是否选择了具体的进度
        order_progress = getattr(query_data, 'order_progress', None)
        is_specific_progress = order_progress and len(order_progress) == 1 and order_progress[0] == "生产"
        
        for prod in productions:
            # 生产表已经是最新状态，直接使用
            # 需要查询拆单表获取设计师、销售员、订单类型、报价状态等信息
            designer = None
            salesperson = None
            order_type = None
            quote_status = None
            splitter = prod.splitter  # 生产表本身有splitter字段
            
            # 查询拆单表获取完整信息（设计师、销售员、订单类型、报价状态等）
            split = db.query(Split).filter(Split.order_number == prod.order_number).first()
            if split:
                designer = split.designer
                salesperson = split.salesperson
                order_type = split.order_type
                quote_status = split.quote_status
                # 如果生产表的splitter为空，使用拆单表的splitter
                if not splitter:
                    splitter = split.splitter
            
            # 动态获取订单状态
            final_order_status = prod.order_status
            progress_prefix = "生产"  # 默认前缀
            
            # 添加进度前缀
            final_order_status = f"{progress_prefix}-{final_order_status}"
            
            order_item = OrderListItem(
                id=prod.id,
                order_number=prod.order_number,
                customer_name=prod.customer_name,
                address=prod.address or "",
                designer=designer or "",  # 从拆单表获取设计师
                salesperson=salesperson or "",  # 从拆单表获取销售员
                splitter=splitter or "",  # 优先使用生产表的splitter，否则使用拆单表的
                assignment_date="",
                design_process="",
                category_name="",
                design_cycle="",
                order_date=prod.split_order_date or "",
                order_type=order_type or "",  # 从拆单表获取订单类型
                is_installation=prod.is_installation,
                cabinet_area=None,
                wall_panel_area=None,
                order_amount=None,
                remarks=prod.remarks,
                order_status=final_order_status,
                quote_status=quote_status  # 从拆单表获取报价状态
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
        traceback.print_exc()
        # 返回空结果而不是错误响应
        return OrderListResponse(
            items=[],
            total=0,
            page=query_data.page,
            page_size=query_data.page_size,
            total_pages=0
        )


async def _get_orders_merged(query_data: OrderListQuery, db: Session):
    """从多个表查询并合并去重（按订单编号）"""
    try:
        # 确定要查询的表
        progress_list = getattr(query_data, 'order_progress', None) or ["设计", "拆单", "生产"]
        
        # 使用字典存储，key为订单编号，value为订单项
        # 这样可以确保每个订单编号只保留一条记录（优先保留设计表的记录）
        order_dict = {}
        
        # 查询设计订单表（优先级最高）
        if "设计" in progress_list:
            design_query = OrderListQuery(**query_data.model_dump())
            design_query.order_progress = None  # 避免递归
            design_query.no_pagination = True  # 获取所有数据，不分页
            design_response = await _get_orders_from_design(design_query, db)
            if isinstance(design_response, OrderListResponse) and hasattr(design_response, 'items'):
                for item in design_response.items:
                    # 只保留第一次出现的订单编号（设计表优先）
                    if item.order_number not in order_dict:
                        order_dict[item.order_number] = item
        
        # 查询拆单表（优先级次之）
        if "拆单" in progress_list:
            split_query = OrderListQuery(**query_data.model_dump())
            split_query.order_progress = None  # 避免递归
            split_query.no_pagination = True  # 获取所有数据，不分页
            split_response = await _get_orders_from_split(split_query, db)
            if isinstance(split_response, OrderListResponse) and hasattr(split_response, 'items'):
                for item in split_response.items:
                    # 如果订单编号已存在（在设计表中），则跳过；否则添加
                    if item.order_number not in order_dict:
                        order_dict[item.order_number] = item
        
        # 查询生产表（优先级最低）
        if "生产" in progress_list:
            prod_query = OrderListQuery(**query_data.model_dump())
            prod_query.order_progress = None  # 避免递归
            prod_query.no_pagination = True  # 获取所有数据，不分页
            prod_response = await _get_orders_from_production(prod_query, db)
            if isinstance(prod_response, OrderListResponse) and hasattr(prod_response, 'items'):
                for item in prod_response.items:
                    # 如果订单编号已存在（在设计表或拆单表中），则跳过；否则添加
                    if item.order_number not in order_dict:
                        order_dict[item.order_number] = item
        
        # 将字典转换为列表，按订单编号排序（降序）
        all_items = list(order_dict.values())
        all_items.sort(key=lambda x: x.order_number, reverse=True)
        
        # 分页处理
        total = len(all_items)
        if query_data.no_pagination:
            items = all_items
            page = 1
            page_size = total
            total_pages = 1
        else:
            offset = (query_data.page - 1) * query_data.page_size
            items = all_items[offset:offset + query_data.page_size]
            page = query_data.page
            page_size = query_data.page_size
            total_pages = (total + page_size - 1) // page_size
        
        return OrderListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    except Exception as e:
        traceback.print_exc()
        # 返回空结果而不是错误响应
        return OrderListResponse(
            items=[],
            total=0,
            page=query_data.page,
            page_size=query_data.page_size,
            total_pages=0
        )


@router.get("/detail/{order_number}", summary="小程序订单综合详情查询")
async def get_miniprogram_order_detail(
    order_number: str,
    db: Session = Depends(get_db)
):
    """
    小程序订单综合详情查询接口
    综合查询设计、拆单、生产三个表的信息
    """
    try:
        result = {}
        split = None
        production = None
        
        # 1. 查询设计表
        order = db.query(Order).options(
            joinedload(Order.progresses)
        ).filter(Order.order_number == order_number).first()
        
        if order:
            # 处理设计过程
            design_process_items = []
            if order.progresses:
                sorted_progresses = sorted(
                    order.progresses, key=lambda p: p.created_at, reverse=True)
                for p in sorted_progresses:
                    planned = p.planned_date if p.planned_date else "-"
                    actual = p.actual_date if p.actual_date else "-"
                    design_process_items.append(f"{p.task_item}:{planned}:{actual}")
                design_process = ",".join(design_process_items)
            else:
                design_process = "暂无进度"
            
            calculated_design_cycle = str(calculate_design_cycle_days(
                order.assignment_date, 
                order.order_date, 
                order.order_status
            ))
            
            result['order_info'] = {
                'order_number': order.order_number,
                'order_status': order.order_status,
                'customer_name': order.customer_name,
                'address': order.address,
                'order_type': order.order_type,
                'category_name': order.category_name,
                'is_installation': order.is_installation,
                'designer': order.designer,
                'salesperson': order.salesperson,
                'cabinet_area': float(order.cabinet_area) if order.cabinet_area else None,
                'wall_panel_area': float(order.wall_panel_area) if order.wall_panel_area else None,
                'order_amount': float(order.order_amount) if order.order_amount else None,
                'assignment_date': order.assignment_date
            }
            
            result['design_progress'] = {
                'order_date': order.order_date,
                'design_cycle': calculated_design_cycle,
                'design_process': design_process,
                'design_remarks': order.remarks,
            }
        
        # 2. 查询拆单表
        split = db.query(Split).options(
            joinedload(Split.progress_items)
        ).filter(Split.order_number == order_number).first()
        
        if split:
            if not result.get('order_info'):
                result['order_info'] = {}
            result['order_info']['splitter'] = split.splitter
            result['order_info']['quote_status'] = split.quote_status
            
            # 处理拆单进度
            internal_items = []
            external_items = []
            for item in split.progress_items:
                item_data = {
                    'category_name': item.category_name,
                    'planned_date': item.planned_date,
                    'split_date': item.split_date if item.item_type.value == 'internal' else None,
                    'purchase_date': item.purchase_date if item.item_type.value == 'external' else None,
                    'cycle_days': item.cycle_days,
                    'status': item.status,
                    'remarks': item.remarks
                }
                if item.item_type.value == 'internal':
                    internal_items.append(item_data)
                else:
                    external_items.append(item_data)
            
            result['split_progress'] = {
                'order_date': split.order_date,
                'completion_date': split.completion_date,
                'internal_items': internal_items,
                'external_items': external_items,
                'split_remarks': split.remarks,
            }
        
        # 3. 查询生产表
        production = db.query(Production).options(
            joinedload(Production.progress_items)
        ).filter(Production.order_number == order_number).first()
        
        if production:
            # 处理生产进度
            production_progress_items = []
            finished_goods_quantity = []  # 成品入库数量
            for item in production.progress_items:
                # 如果是厂内项，给名称后面添加"材料"
                category_name = item.category_name
                category_name_internal = category_name
                if item.item_type.value == 'internal' and category_name:
                    category_name_internal = f"{category_name}材料"
                
                item_data = {
                    'category_name': category_name_internal,
                    'item_type': item.item_type.value,
                    'order_date': item.order_date,
                    'expected_material_date': item.expected_material_date if item.item_type.value == 'internal' else None,
                    'actual_storage_date': item.actual_storage_date if item.item_type.value == 'internal' else None,
                    'storage_time': item.storage_time if item.item_type.value == 'internal' else None,
                    'quantity': item.quantity if item.item_type.value == 'internal' else None,
                    'expected_arrival_date': item.expected_arrival_date if item.item_type.value == 'external' else None,
                    'actual_arrival_date': item.actual_arrival_date if item.item_type.value == 'external' else None
                }
                production_progress_items.append(item_data)
                
                # 生成成品入库数量信息：参考PC端逻辑，对所有 internal 和 external 类型都处理
                if item.item_type.value == 'internal' or item.item_type.value == 'external':
                    finished_goods_quantity.append({
                        'category_name': category_name,
                        'quantity': item.quantity
                    })
            
            # 计算下单天数（从拆单下单日期到当前）
            order_days = None
            if production.split_order_date:
                try:
                    split_date = datetime.strptime(production.split_order_date, '%Y-%m-%d')
                    today = datetime.now()
                    order_days = str((today - split_date).days)
                except:
                    order_days = None
            
            result['production_progress'] = {
                'customer_payment_date': production.customer_payment_date,
                'split_order_date': production.split_order_date,
                'order_days': order_days,
                'expected_delivery_date': production.expected_delivery_date,
                'purchase_status': production.order_status,  # 采购状态使用订单状态字段
                'storage_count': len([item for item in production.progress_items if item.item_type.value == 'internal' and item.actual_storage_date]),
                'material_count': len(production.progress_items),
                'cutting_date': production.cutting_date,
                'expected_shipping_date': production.expected_shipping_date,
                'progress_items': production_progress_items,
                'finished_goods_quantity': finished_goods_quantity,
                'actual_delivery_date': production.actual_delivery_date,
                "board_18": production.board_18,
                "board_09": production.board_09,
                "production_remarks": production.remarks,
            }
        
        if not result:
            raise HTTPException(status_code=404, detail="订单不存在")
        
        # 动态获取订单状态并添加前缀（与列表页逻辑一致）
        if result.get('order_info'):
            final_order_status = result['order_info'].get('order_status', '')
            progress_prefix = "设计"  # 默认前缀
            
            # 如果设计阶段状态是"已下单"，查看拆单表的状态
            if final_order_status == "已下单" and split:
                # 如果拆单状态也是"已下单"，查看生产表的状态
                if split.order_status == "已下单":
                    if production:
                        final_order_status = production.order_status
                        progress_prefix = "生产"
                    else:
                        final_order_status = split.order_status
                        progress_prefix = "拆单"
                else:
                    final_order_status = split.order_status
                    progress_prefix = "拆单"
            elif production:
                # 如果有生产进度，说明已进入生产阶段
                final_order_status = production.order_status
                progress_prefix = "生产"
            elif split:
                # 如果有拆单进度，说明已进入拆单阶段
                final_order_status = split.order_status
                progress_prefix = "拆单"
            
            # 添加进度前缀
            if final_order_status and not final_order_status.startswith(('设计-', '拆单-', '生产-')):
                final_order_status = f"{progress_prefix}-{final_order_status}"
                result['order_info']['order_status'] = final_order_status
        
        return success_response(data=result)
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"查询订单详情失败: {str(e)}")
