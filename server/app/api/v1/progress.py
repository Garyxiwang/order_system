from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.order import Order
from app.models.progress import Progress
from app.schemas.progress import (
    ProgressCreate,
    ProgressUpdate,
    ProgressResponse,
    ProgressListQuery,
    ProgressListResponse
)
from app.core.response import success_response, error_response

router = APIRouter()


@router.post("/", summary="新增进度")
async def create_progress(
    progress_data: ProgressCreate,
    db: Session = Depends(get_db)
):
    """新增进度"""
    try:
        # 检查订单是否存在（根据订单编号查找）
        order = db.query(Order).filter(Order.order_number == progress_data.order_id).first()
        if not order:
            return error_response(message="指定的订单不存在")
        
        # 创建进度（使用订单的数据库ID）
        progress = Progress(
            order_id=order.id,
            task_item=progress_data.task_item,
            planned_date=progress_data.planned_date,
            actual_date=progress_data.actual_date,
            remarks=progress_data.remarks
        )
        
        # 直接使用进度事项作为订单状态
        order.order_status = progress_data.task_item
        
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
        # 手动构建响应数据，确保日期字段类型正确并包含order_number
        progress_dict = {
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
        return success_response(
            data=ProgressResponse(**progress_dict),
            message="进度创建成功"
        )
    
    except Exception as e:
        db.rollback()
        return error_response(message=f"创建进度失败: {str(e)}")


@router.post("/list", summary="获取进度列表")
async def get_progress_list(
    request_data: dict,
    db: Session = Depends(get_db)
):
    """获取指定订单的进度列表"""
    try:
        # 从请求数据中提取参数
        order_id = request_data.get("order_id")
        page = request_data.get("page", 1)
        page_size = request_data.get("page_size", 10)
        
        if not order_id:
            return error_response(message="订单ID不能为空")
        
        # 检查订单是否存在（根据订单编号查找）
        order = db.query(Order).filter(Order.order_number == order_id).first()
        if not order:
            return error_response(message="指定的订单不存在")
        
        # 查询进度列表（使用订单的数据库ID）
        query = db.query(Progress).filter(Progress.order_id == order.id)
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * page_size
        progresses = query.order_by(Progress.created_at.desc()).offset(offset).limit(page_size).all()
        
        # 转换为响应格式，包含订单编号
        progress_items = []
        for progress in progresses:
            progress_dict = {
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
            progress_items.append(ProgressResponse(**progress_dict))
        
        # 计算总页数
        total_pages = (total + page_size - 1) // page_size
        
        return success_response(
            data=ProgressListResponse(
                items=progress_items,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages
            )
        )
    
    except Exception as e:
        return error_response(message=f"获取进度列表失败: {str(e)}")


@router.put("/{progress_id}", summary="编辑进度")
async def update_progress(
    progress_id: int,
    progress_data: ProgressUpdate,
    db: Session = Depends(get_db)
):
    """编辑进度"""
    try:
        # 查找进度
        progress = db.query(Progress).filter(Progress.id == progress_id).first()
        if not progress:
            return error_response(message="进度不存在")
        
        # 更新进度字段（只更新ProgressUpdate模型中存在的字段）
        if progress_data.planned_date is not None:
            progress.planned_date = progress_data.planned_date
        if progress_data.actual_date is not None:
            progress.actual_date = progress_data.actual_date
        if progress_data.remarks is not None:
            progress.remarks = progress_data.remarks
        
        # 获取订单信息
        order = db.query(Order).filter(Order.id == progress.order_id).first()
        
        db.commit()
        db.refresh(progress)
        
        # 手动构建响应数据，确保日期字段类型正确并包含order_number
        progress_dict = {
            "id": progress.id,
            "task_item": progress.task_item,
            "planned_date": progress.planned_date,
            "actual_date": progress.actual_date,
            "remarks": progress.remarks,
            "order_id": progress.order_id,
            "order_number": order.order_number if order else None,
            "created_at": progress.created_at,
            "updated_at": progress.updated_at
        }
        
        return success_response(
            data=ProgressResponse(**progress_dict),
            message="进度更新成功"
        )
    
    except Exception as e:
        db.rollback()
        return error_response(message=f"更新进度失败: {str(e)}")


@router.get("/{progress_id}", summary="获取进度详情")
async def get_progress(
    progress_id: int,
    db: Session = Depends(get_db)
):
    """获取进度详情"""
    try:
        progress = db.query(Progress).filter(Progress.id == progress_id).first()
        
        if not progress:
            return error_response(message="进度不存在")
        
        # 手动构建响应数据，确保日期字段类型正确
        progress_dict = {
            "id": progress.id,
            "task_item": progress.task_item,
            "planned_date": progress.planned_date,
            "actual_date": progress.actual_date,
            "remarks": progress.remarks,
            "order_id": progress.order_id,
            "created_at": progress.created_at,
            "updated_at": progress.updated_at
        }
        return success_response(data=ProgressResponse(**progress_dict))
    
    except Exception as e:
        return error_response(message=f"获取进度详情失败: {str(e)}")

@router.delete("/{progress_id}", summary="删除进度")
async def delete_progress(
    progress_id: int,
    db: Session = Depends(get_db)
):
    """删除进度记录"""
    try:
        progress = db.query(Progress).filter(Progress.id == progress_id).first()
        if not progress:
            return error_response(message="进度不存在")

        # 先拿到订单对象
        order = db.query(Order).filter(Order.id == progress.order_id).first()

        # 删除进度
        db.delete(progress)
        db.commit()

        # 删除后，更新订单状态为最新的进度事项；若无进度则回退为“待处理”
        if order:
            latest_progress = (
                db.query(Progress)
                .filter(Progress.order_id == order.id)
                .order_by(Progress.created_at.desc())
                .first()
            )
            order.order_status = latest_progress.task_item if latest_progress else "待处理"
            db.commit()

        # 返回布尔型 data，兼容前端 deleteProgress 的返回类型
        return success_response(data=True, message="进度删除成功")

    except Exception as e:
        db.rollback()
        return error_response(message=f"删除进度失败: {str(e)}")