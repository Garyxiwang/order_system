from fastapi import APIRouter

from app.api.v1.endpoints import health, users, orders, designs, production, auth, categories

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

api_router.include_router(
    designs.router, 
    prefix="/designs", 
    tags=["设计管理"]
)

api_router.include_router(
    production.router, 
    prefix="/production", 
    tags=["生产管理"]
)

api_router.include_router(
    categories.router, 
    prefix="/categories", 
    tags=["类目管理"]
)