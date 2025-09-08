from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session
from fastapi import Depends

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, LoginResponse
from app.utils.auth import verify_password

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