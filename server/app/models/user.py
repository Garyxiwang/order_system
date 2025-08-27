from sqlalchemy import Column, String, Enum
from app.models.base import BaseModel
import enum


class UserRole(str, enum.Enum):
    """用户角色枚举"""
    ADMIN = "admin"          # 管理员
    MANAGER = "manager"      # 经理
    DESIGNER = "designer"    # 设计师
    SPLITTING = "splitting"  # 拆单员
    CLERK = "clerk"    # 文员
    PROCUREMENT = "procurement"  # 采购人员
    SALESPERSON = "salesperson"  # 销售员
    FINANCE = "finance"  # 财务
    WORKSHOP = "workshop"  # 车间
    SHIPPER = "shipper"  # 发货人
    CUSTOMER = "customer"    # 客户（兼容旧数据）


class User(BaseModel):
    """用户表模型"""
    __tablename__ = "users"

    # 用户基本信息
    username = Column(String(50), unique=True, index=True,
                      nullable=False, comment="用户名")
    password = Column(String(255), nullable=False, comment="密码哈希")
    role = Column(Enum(UserRole, values_callable=lambda obj: [e.value for e in obj]), nullable=False,
                  default=UserRole.CLERK, comment="用户角色")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"

    def to_dict(self):
        """转换为字典，排除敏感信息"""
        data = super().to_dict()
        # 移除密码字段
        data.pop('password', None)
        return data
