from app.core.database import Base

# 导入所有模型以确保它们被注册到Base.metadata中
from .user import User, UserRole
from .category import Category, CategoryType
from .order import Order, DesignCycle
from .progress import Progress
from .split import Split
# from .design import Design
from .production import Production, PurchaseStatus

# 导出Base供其他模块使用
__all__ = ["Base"]