from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class Production(Base):
    """生产管理模型"""
    __tablename__ = "productions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, comment="关联订单ID")
    
    # 同步数据字段
    order_number = Column(String(50), nullable=False, unique=True, index=True, comment="订单编号")
    customer_name = Column(String(100), nullable=False, comment="客户名称")
    address = Column(String(200), nullable=True, comment="地址")
    splitter = Column(String(50), nullable=True, comment="拆单员")
    is_installation = Column(Boolean, default=False, comment="是否安装")
    customer_payment_date = Column(String(50), nullable=True, comment="客户打款日期")
    split_order_date = Column(String(50), nullable=True, comment="拆单下单日期")
    internal_production_items = Column(Text, nullable=True, comment="厂内生产项")
    external_purchase_items = Column(Text, nullable=True, comment="外购项")
    
    # 新增字段
    order_days = Column(String(20), nullable=True, comment="下单天数")
    expected_delivery_date = Column(String(50), nullable=True, comment="预计交货日期")
    board_18 = Column(String(50), nullable=True, comment="18板")
    board_09 = Column(String(50), nullable=True, comment="09板")
    order_status = Column(String(20), default="未齐料", comment="订单状态")
    actual_delivery_date = Column(String(50), nullable=True, comment="实际出货日期")
    cutting_date = Column(String(50), nullable=True, comment="下料日期")
    expected_shipping_date = Column(String(50), nullable=True, comment="预计出货日期")
    remarks = Column(Text, nullable=True, comment="备注")
    special_notes = Column(Text, nullable=True, comment="特殊情况")
    designer = Column(String(50), nullable=True, comment="设计师")
    
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    order = relationship("Order", back_populates="productions")
    progress_items = relationship("ProductionProgress", back_populates="production", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Production(id={self.id}, order_number='{self.order_number}', customer='{self.customer_name}', status='{self.order_status}')>"