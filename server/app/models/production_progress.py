from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
import enum


class ItemType(enum.Enum):
    """项目类型枚举"""
    INTERNAL = "internal"  # 厂内生产项
    EXTERNAL = "external"  # 外购项


class ProductionProgress(Base):
    """生产进度管理模型"""
    __tablename__ = "production_progress"

    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(Integer, ForeignKey("productions.id"), nullable=False, index=True, comment="生产管理ID")
    order_number = Column(String(50), nullable=False, index=True, comment="订单编号")
    
    # 进度信息
    item_type = Column(SQLEnum(ItemType), nullable=False, comment="项目类型")
    category_name = Column(String(100), nullable=False, comment="类目名称")
    
    # 共同字段
    order_date = Column(String(50), nullable=True, comment="下单日期（实际拆单日期）")
    
    # 厂内生产项字段
    expected_material_date = Column(String(50), nullable=True, comment="预计齐料日期")
    actual_storage_date = Column(String(50), nullable=True, comment="实际入库日期")
    storage_time = Column(String(50), nullable=True, comment="入库时间")
    quantity = Column(String(20), nullable=True, comment="件数")
    
    # 外购项字段
    expected_arrival_date = Column(String(50), nullable=True, comment="预计到厂日期")
    actual_arrival_date = Column(String(50), nullable=True, comment="实际到厂日期")
    
    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    production = relationship("Production", back_populates="progress_items")