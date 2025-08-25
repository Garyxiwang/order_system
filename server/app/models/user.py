from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.sql import func
from app.models.base import BaseModel
import enum


class UserRole(str, enum.Enum):
    """用户角色枚举"""
    ADMIN = "admin"          # 管理员
    MANAGER = "manager"      # 经理
    DESIGNER = "designer"    # 设计师
    PRODUCTION = "production" # 生产人员
    CUSTOMER = "customer"    # 客户


class User(BaseModel):
    """用户表模型"""
    __tablename__ = "users"
    
    # 用户基本信息
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    password = Column(String(255), nullable=False, comment="密码哈希")
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CUSTOMER, comment="用户角色")
    
    # 用户详细信息
    email = Column(String(100), unique=True, index=True, nullable=True, comment="邮箱")
    phone = Column(String(20), nullable=True, comment="手机号")
    full_name = Column(String(100), nullable=True, comment="真实姓名")
    
    # 账户状态
    is_verified = Column(Boolean, default=False, comment="是否已验证")
    last_login = Column(DateTime(timezone=True), nullable=True, comment="最后登录时间")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
    
    def to_dict(self):
        """转换为字典，排除敏感信息"""
        data = super().to_dict()
        # 移除密码字段
        data.pop('password', None)
        return data
    
    def is_admin(self) -> bool:
        """检查是否为管理员"""
        return self.role == UserRole.ADMIN
    
    def is_manager(self) -> bool:
        """检查是否为经理"""
        return self.role == UserRole.MANAGER
    
    def is_designer(self) -> bool:
        """检查是否为设计师"""
        return self.role == UserRole.DESIGNER
    
    def is_production_staff(self) -> bool:
        """检查是否为生产人员"""
        return self.role == UserRole.PRODUCTION
    
    def is_customer(self) -> bool:
        """检查是否为客户"""
        return self.role == UserRole.CUSTOMER
    
    def has_permission(self, required_roles: list) -> bool:
        """检查用户是否具有指定角色权限"""
        return self.role in required_roles