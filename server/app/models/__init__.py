from app.core.database import Base

# 导入所有模型以确保它们被注册到Base.metadata中
from .user import User, UserRole
# from .order import Order
# from .design import Design
# from .production import Production

# 导出Base供其他模块使用
__all__ = ["Base"]