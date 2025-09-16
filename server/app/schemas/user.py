from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserLogin(BaseModel):
    """用户登录请求模型"""
    username: str = Field(..., min_length=1, max_length=50, description="用户名")
    password: str = Field(..., min_length=1, description="密码")


class UserCreate(BaseModel):
    """创建用户请求模型"""
    username: str = Field(..., min_length=1, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, description="密码，最少6位")
    role: UserRole = Field(default=UserRole.CLERK, description="用户角色")


class UserResponse(BaseModel):
    """用户响应模型"""
    id: int
    username: str
    role: UserRole
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """用户列表响应模型"""
    username: str
    role: UserRole

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """登录响应模型"""
    code: int
    message: str
    data: dict
    # 这里可以后续添加token等认证信息


class ChangePasswordRequest(BaseModel):
    """修改密码请求模型"""
    old_password: str = Field(..., min_length=1, description="原密码")
    new_password: str = Field(..., min_length=6, description="新密码，最少6位")


class ChangePasswordResponse(BaseModel):
    """修改密码响应模型"""
    code: int
    message: str
    data: dict


class DeleteUserResponse(BaseModel):
    """删除用户响应模型"""
    code: int
    message: str
    data: dict