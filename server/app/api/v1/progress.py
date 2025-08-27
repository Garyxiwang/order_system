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
        # 检查订单是否存在
        order = db.query(Order).filter(Order.id == progress_data.order_id).first()
        if not order:
            return error_response(message="指定的订单不存在")
        
        # 创建进度
        progress = Progress(
            order_id=progress_data.order_id,
            task_item=progress_data.task_item,
            planned_date=progress_data.planned_date,
            actual_date=progress_data.actual_date,
            remarks=progress_data.remarks
        )
        
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
        return success_response(
            data=ProgressResponse.from_orm(progress),
            message="进度创建成功"
        )
    
    except Exception as e:
        db.rollback()
        return error_response(message=f"创建进度失败: {str(e)}")


@router.get("/list", summary="获取进度列表")
async def get_progress_list(
    order_id: int = Query(..., description="订单ID"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db)
):
    """获取指定订单的进度列表"""
    try:
        # 检查订单是否存在
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return error_response(message="指定的订单不存在")
        
        # 构建查询
        query = db.query(Progress).filter(Progress.order_id == order_id)
        
        # 获取总数
        total = query.count()
        
        # 分页
        offset = (page - 1) * page_size
        progresses = query.order_by(Progress.created_at.desc()).offset(offset).limit(page_size).all()
        
        # 转换为响应格式
        progress_items = [ProgressResponse.from_orm(progress) for progress in progresses]
        
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
        
        # 更新进度字段
        update_data = progress_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(progress, field, value)
        
        db.commit()
        db.refresh(progress)
        
        return success_response(
            data=ProgressResponse.from_orm(progress),
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
        
        return success_response(data=ProgressResponse.from_orm(progress))
    
    except Exception as e:
        return error_response(message=f"获取进度详情失败: {str(e)}")

# 注意：删除进度接口已被移除，只保留创建、查询、编辑功能