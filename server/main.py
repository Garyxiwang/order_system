from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, create_tables, create_initial_data
from app.models import Base, User, UserRole
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("🚀 启动订单管理系统后端服务...")
    
    # 创建数据库表
    try:
        create_tables()
        print("✅ 数据库表创建成功")
    except Exception as e:
        print(f"❌ 数据库表创建失败: {e}")
        raise
    
    # 创建初始数据
    try:
        create_initial_data()
        print("✅ 初始数据创建成功")
    except Exception as e:
        print(f"❌ 初始数据创建失败: {e}")
        # 初始数据创建失败不应该阻止应用启动
        pass
    
    yield
    
    # 关闭时执行
    print("🛑 关闭订单管理系统后端服务...")


# 创建FastAPI应用实例
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="订单管理系统后端API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """根路径健康检查"""
    return JSONResponse(
        content={
            "message": "订单管理系统后端服务运行正常",
            "version": "1.0.0",
            "status": "healthy"
        }
    )


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "order-management-system",
            "version": "1.0.0"
        }
    )


if __name__ == "__main__":
    # 支持动态端口配置，优先使用环境变量PORT
    port = int(os.environ.get("PORT", 8000))
    # 生产环境不使用reload
    reload = os.environ.get("ENVIRONMENT", "development") == "development"
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=reload,
        log_level="info"
    )