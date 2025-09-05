from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserResponse, UserListResponse, 
    DeleteUserResponse
)
from app.utils.auth import hash_password

# 设置日志
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=dict)
async def create_user(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    """
    新增用户接口
    
    - **username**: 用户名
    - **password**: 密码
    - **role**: 用户角色
    """
    try:
        # 检查用户名是否已存在
        existing_user = db.query(User).filter(
            User.username == user_create.username
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
        
        # 创建新用户
        hashed_password = hash_password(user_create.password)
        new_user = User(
            username=user_create.username,
            password=hashed_password,
            role=user_create.role
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        user_response = UserResponse.model_validate(new_user)
        
        return {
            "code": 200,
            "message": "用户创建成功",
            "data": {
                "user": user_response.model_dump()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建用户失败: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="创建用户失败")


@router.delete("/{username}", response_model=dict)
async def delete_user(
    username: str,
    db: Session = Depends(get_db)
):
    """
    删除用户接口 - RESTful风格
    
    - **username**: 要删除的用户名
    """
    try:
        # 查找用户
        user = db.query(User).filter(
            User.username == username
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        
        # 真删除用户
        db.delete(user)
        db.commit()
        
        return {
            "code": 200,
            "message": "用户删除成功",
            "data": {
                "username": username
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除用户失败: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="删除用户失败")


@router.get("/", response_model=dict)
async def get_users(
    db: Session = Depends(get_db)
):
    """
    查询所有用户列表
    
    返回用户名和角色信息
    """
    try:
        # 查询所有用户，按创建时间倒序排列
        users = db.query(User).order_by(User.created_at.desc()).all()
        
        # 只返回用户名和角色
        user_list = [
            {
                "username": user.username,
                "role": user.role.value,
                "created_at": user.created_at
            }
            for user in users
        ]
        
        return {
            "code": 200,
            "message": "获取用户列表成功",
            "data": {
                "users": user_list,
                "total": len(user_list)
            }
        }
        
    except Exception as e:
        logger.error(f"获取用户列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取用户列表失败")
