from fastapi import APIRouter
from fastapi.responses import JSONResponse
from datetime import datetime

router = APIRouter()


@router.get("/")
async def health_check():
    """健康检查端点"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "order-management-system",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "message": "服务运行正常"
        }
    )


@router.get("/ping")
async def ping():
    """简单的ping检查"""
    return {"message": "pong"}


@router.get("/status")
async def service_status():
    """详细的服务状态检查"""
    return JSONResponse(
        content={
            "service": "订单管理系统后端",
            "status": "running",
            "version": "1.0.0",
            "uptime": "运行中",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    )