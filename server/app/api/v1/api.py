from fastapi import APIRouter

from app.api.v1.endpoints import health, users, orders, productions, auth, categories, splits
from app.api.v1 import progress

# 创建API路由器
api_router = APIRouter()

# 注册各个模块的路由
api_router.include_router(
    health.router, 
    prefix="/health", 
    tags=["健康检查"]
)

api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["用户认证"]
)

api_router.include_router(
    users.router, 
    prefix="/users", 
    tags=["用户管理"]
)

api_router.include_router(
    orders.router, 
    prefix="/orders", 
    tags=["订单管理"]
)

# 设计管理模块已移除

api_router.include_router(
    productions.router, 
    prefix="/productions", 
    tags=["生产管理"]
)

api_router.include_router(
    categories.router, 
    prefix="/categories", 
    tags=["类目管理"]
)

api_router.include_router(
    splits.router, 
    prefix="/splits", 
    tags=["拆单管理"]
)

api_router.include_router(
    progress.router, 
    prefix="/progress", 
    tags=["进度管理"]
)