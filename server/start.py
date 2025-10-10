#!/usr/bin/env python3
"""
简单的FastAPI启动脚本
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="订单管理系统", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "订单管理系统后端服务正在运行", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "order-backend"}

@app.get("/api/test")
async def test():
    return {"message": "API测试成功", "timestamp": "2024-01-01"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)