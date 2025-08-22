from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db

router = APIRouter()


@router.get("/")
async def get_users(db: Session = Depends(get_db)):
    """获取用户列表"""
    return {
        "message": "用户管理模块",
        "description": "此处将实现用户相关的API接口",
        "endpoints": [
            "GET /users - 获取用户列表",
            "POST /users - 创建用户",
            "GET /users/{user_id} - 获取用户详情",
            "PUT /users/{user_id} - 更新用户信息",
            "DELETE /users/{user_id} - 删除用户"
        ]
    }


@router.post("/")
async def create_user(db: Session = Depends(get_db)):
    """创建用户"""
    return {"message": "创建用户接口 - 待实现"}


@router.get("/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """获取用户详情"""
    return {"message": f"获取用户 {user_id} 详情 - 待实现"}


@router.put("/{user_id}")
async def update_user(user_id: int, db: Session = Depends(get_db)):
    """更新用户信息"""
    return {"message": f"更新用户 {user_id} 信息 - 待实现"}


@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """删除用户"""
    return {"message": f"删除用户 {user_id} - 待实现"}