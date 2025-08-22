#!/usr/bin/env python3
"""
简化的测试服务器，用于验证基础框架
"""

try:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    import uvicorn
    
    # 创建简单的FastAPI应用
    app = FastAPI(
        title="订单管理系统测试服务",
        description="用于测试基础框架的简化版本",
        version="1.0.0"
    )
    
    @app.get("/")
    async def root():
        return JSONResponse(
            content={
                "message": "🎉 FastAPI后端框架搭建成功！",
                "service": "订单管理系统后端",
                "version": "1.0.0",
                "status": "running",
                "framework": "FastAPI"
            }
        )
    
    @app.get("/health")
    async def health():
        return {"status": "healthy", "message": "服务运行正常"}
    
    if __name__ == "__main__":
        print("🚀 启动测试服务器...")
        print("📍 服务地址: http://localhost:8000")
        print("📚 API文档: http://localhost:8000/docs")
        print("-" * 40)
        
        uvicorn.run(
            "test_server:app",
            host="0.0.0.0",
            port=8000,
            reload=True
        )
        
except ImportError as e:
    print(f"❌ 依赖模块未安装: {e}")
    print("请先运行: pip install -r requirements.txt")
except Exception as e:
    print(f"❌ 启动失败: {e}")