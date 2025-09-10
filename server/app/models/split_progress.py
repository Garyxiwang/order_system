from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
import enum


class ItemType(enum.Enum):
    """项目类型枚举"""
    INTERNAL = "internal"  # 厂内生产项
    EXTERNAL = "external"  # 外购项


class SplitProgress(Base):
    """拆单进度管理模型"""
    __tablename__ = "split_progress"

    id = Column(Integer, primary_key=True, index=True)
    split_id = Column(Integer, ForeignKey("splits.id"), nullable=False, index=True, comment="拆单ID")
    order_number = Column(String(50), nullable=False, index=True, comment="订单编号")
    
    # 进度信息
    item_type = Column(SQLEnum(ItemType), nullable=False, comment="项目类型")
    category_name = Column(String(100), nullable=False, comment="类目名称")
    planned_date = Column(String(50), nullable=True, comment="计划日期")
    split_date = Column(String(50), nullable=True, comment="拆单日期（厂内项）")
    purchase_date = Column(String(50), nullable=True, comment="采购日期（外购项）")
    status = Column(String(20), default="待处理", comment="状态")
    remarks = Column(Text, nullable=True, comment="备注")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    split = relationship("Split", back_populates="progress_items")