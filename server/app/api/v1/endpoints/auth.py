from fastapi import APIRouter, HTTPException, status, Header
from sqlalchemy.orm import Session
from fastapi import Depends
from typing import Optional
from urllib.parse import unquote

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, LoginResponse, ChangePasswordRequest, ChangePasswordResponse
from app.utils.auth import verify_password, hash_password

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    用户登录接口
    """
    # 查找用户
    user = db.query(User).filter(
        User.username == user_data.username
    ).first()
    
    if not user:
        return LoginResponse(
            code=401,
            message="用户名或密码错误",
            data={}
        )
    
    # 验证密码
    if not verify_password(user_data.password, user.password):
        return LoginResponse(
            code=401,
            message="用户名或密码错误",
            data={}
        )
    
    # 返回登录成功信息
    return LoginResponse(
        code=200,
        message="登录成功",
        data={
            "username": user.username,
            "role": user.role
        }
    )


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    password_data: ChangePasswordRequest, 
    db: Session = Depends(get_db),
    username: Optional[str] = Header(None, alias="X-Username")
):
    """
    修改密码接口
    需要在请求头中传递 X-Username 来标识当前用户
    """
    # 检查是否提供了用户名
    if not username:
        return ChangePasswordResponse(
            code=401,
            message="用户未登录，请在请求头中提供 X-Username",
            data={}
        )
    
    # 解码URL编码的用户名
    username = unquote(username)
    
    # 查找用户
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return ChangePasswordResponse(
            code=404,
            message="用户不存在",
            data={}
        )
    
    # 验证原密码
    if not verify_password(password_data.old_password, user.password):
        return ChangePasswordResponse(
            code=400,
            message="原密码错误",
            data={}
        )
    
    # 检查新密码是否与原密码相同
    if verify_password(password_data.new_password, user.password):
        return ChangePasswordResponse(
            code=400,
            message="新密码不能与原密码相同",
            data={}
        )
    
    # 更新密码
    try:
        user.password = hash_password(password_data.new_password)
        db.commit()
        
        return ChangePasswordResponse(
            code=200,
            message="密码修改成功",
            data={}
        )
    except Exception as e:
        db.rollback()
        return ChangePasswordResponse(
            code=500,
            message="密码修改失败",
            data={}
        )