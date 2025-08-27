from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class CategoryType(enum.Enum):
    """类目分类枚举"""
    INTERNAL_PRODUCTION = "厂内生产项"  # 厂内生产项
    EXTERNAL_PURCHASE = "外购项"       # 外购项


class Category(Base):
    """类目配置表"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="类目名称")
    category_type = Column(Enum(CategoryType), nullable=False, comment="类目分类")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}', type='{self.category_type.value}')>"