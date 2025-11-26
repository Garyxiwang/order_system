from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
import traceback

from app.core.database import get_db
from app.models.user import User, UserRole
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
        logger.info(f"开始创建用户: username={user_create.username}, role={user_create.role}")
        
        # 检查用户名是否已存在
        existing_user = db.query(User).filter(
            User.username == user_create.username
        ).first()
        
        if existing_user:
            logger.warning(f"用户名已存在: {user_create.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
        
        # 验证并转换角色值
        user_role = user_create.role
        try:
            # 确保角色是有效的枚举值（Pydantic 应该已经处理了，但为了安全再验证一次）
            if isinstance(user_role, str):
                user_role = UserRole(user_role)
        except (ValueError, AttributeError) as ve:
            logger.error(f"无效的角色值: {user_create.role}, 错误: {str(ve)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"无效的角色值: {user_create.role}"
            )
        
        # 创建新用户
        hashed_password = hash_password(user_create.password)
        new_user = User(
            username=user_create.username,
            password=hashed_password,
            role=user_role
        )
        
        logger.info(f"准备添加用户到数据库: {new_user.username}")
        db.add(new_user)
        logger.info(f"准备提交事务")
        db.commit()
        logger.info(f"事务提交成功，准备刷新用户对象")
        db.refresh(new_user)
        logger.info(f"用户创建成功: id={new_user.id}, username={new_user.username}")
        
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
    except ValueError as ve:
        logger.error(f"值错误: {str(ve)}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"数据验证失败: {str(ve)}"
        )
    except Exception as e:
        error_msg = f"创建用户失败: {str(e)}"
        error_trace = traceback.format_exc()
        logger.error(error_msg)
        logger.error(f"错误堆栈:\n{error_trace}")
        logger.error(f"请求数据: username={user_create.username}, role={user_create.role}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"创建用户失败: {str(e)}"
        )


@router.put("/{username}/reset-password", response_model=dict)
async def reset_password(
    username: str,
    db: Session = Depends(get_db)
):
    """
    重置用户密码接口
    
    - **username**: 要重置密码的用户名
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
        
        # 重置密码为默认密码 "123456"
        default_password = "123456"
        hashed_password = hash_password(default_password)
        user.password = hashed_password
        
        db.commit()
        
        return {
            "code": 200,
            "message": f"用户 {username} 密码重置成功，新密码为：{default_password}",
            "data": {
                "username": username,
                "new_password": default_password
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重置密码失败: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="重置密码失败")


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
        
        # 保护超级管理员和管理员角色，不允许删除
        if user.role == UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="超级管理员不可删除"
            )
        
        if user.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="管理员不可删除"
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
