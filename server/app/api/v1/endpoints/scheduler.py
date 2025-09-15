from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.response import success_response, error_response
from app.utils.scheduler import (
    get_scheduler_status,
    update_design_cycles,
    update_split_progress_cycles,
    start_scheduler,
    stop_scheduler
)
import asyncio

router = APIRouter()

@router.get("/status", summary="获取定时任务状态")
async def get_status():
    """获取定时任务调度器状态"""
    try:
        status = get_scheduler_status()
        return success_response(
            data=status,
            message="获取定时任务状态成功"
        )
    except Exception as e:
        return error_response(message=f"获取定时任务状态失败: {str(e)}")

@router.post("/start", summary="启动定时任务调度器")
async def start():
    """启动定时任务调度器"""
    try:
        start_scheduler()
        return success_response(
            data=None,
            message="定时任务调度器启动成功"
        )
    except Exception as e:
        return error_response(message=f"启动定时任务调度器失败: {str(e)}")

@router.post("/stop", summary="停止定时任务调度器")
async def stop():
    """停止定时任务调度器"""
    try:
        stop_scheduler()
        return success_response(
            data=None,
            message="定时任务调度器停止成功"
        )
    except Exception as e:
        return error_response(message=f"停止定时任务调度器失败: {str(e)}")

@router.post("/update-design-cycles", summary="手动执行设计周期更新")
async def manual_update_design_cycles():
    """手动触发设计周期更新任务"""
    try:
        # 在后台执行任务，避免阻塞API响应
        asyncio.create_task(update_design_cycles())
        return success_response(
            data=None,
            message="设计周期更新任务已启动，请查看日志了解执行结果"
        )
    except Exception as e:
        return error_response(message=f"执行设计周期更新任务失败: {str(e)}")

@router.post("/update-split-progress-cycles", summary="手动执行拆单进度周期更新")
async def manual_update_split_progress_cycles():
    """手动触发拆单进度周期更新任务"""
    try:
        # 在后台执行任务，避免阻塞API响应
        asyncio.create_task(update_split_progress_cycles())
        return success_response(
            data=None,
            message="拆单进度周期更新任务已启动，请查看日志了解执行结果"
        )
    except Exception as e:
        return error_response(message=f"执行拆单进度周期更新任务失败: {str(e)}")