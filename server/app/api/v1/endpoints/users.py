from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.models.user import User

# 设置日志
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/")
async def get_users(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db)
):
    """获取用户列表"""
    try:
        # 查询用户总数
        total = db.query(User).filter(User.is_deleted == False).count()

        # 分页查询用户列表
        users = db.query(User).filter(
            User.is_deleted == False
        ).offset(skip).limit(limit).all()

        # 转换为字典格式，排除敏感信息
        users_data = []
        for user in users:
            user_dict = user.to_dict()
            # 移除密码字段
            user_dict.pop('password', None)
            users_data.append(user_dict)
        print("查询用户：" + str(users_data))
        return {
            "code": 200,
            "message": "获取用户列表成功",
            "data": {
                "users": users_data,
                "total": total,
                "skip": skip,
                "limit": limit,
                "has_more": skip + limit < total
            }
        }
    except Exception as e:
        logger.error(f"获取用户列表失败: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="获取用户列表失败"
        )


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
