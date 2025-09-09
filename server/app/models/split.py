from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.types import Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class Split(Base):
    """拆单管理模型"""
    __tablename__ = "splits"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), ForeignKey("orders.order_number"), nullable=False, index=True, comment="订单编号")
    
    # 基本信息（从订单复制）
    customer_name = Column(String(100), nullable=False, comment="客户名称")
    address = Column(Text, nullable=False, comment="地址")
    order_date = Column(String(50), nullable=True, comment="下单日期")
    designer = Column(String(50), nullable=True, comment="设计师")
    salesperson = Column(String(50), nullable=True, comment="销售员")
    order_amount = Column(Numeric(12, 2), nullable=True, comment="订单金额")
    cabinet_area = Column(Numeric(10, 2), nullable=True, comment="柜体面积")
    wall_panel_area = Column(Numeric(10, 2), nullable=True, comment="墙板面积")
    order_type = Column(String(20), nullable=False, comment="订单类型")
    order_status = Column(String(20), nullable=False, comment="订单状态")
    
    # 拆单特有字段
    splitter = Column(String(50), nullable=True, comment="拆单员")
    internal_production_items = Column(JSON, nullable=True, comment="厂内生产项")
    external_purchase_items = Column(JSON, nullable=True, comment="外购项")
    quote_status = Column(String(20), default="未打款", comment="报价状态")
    completion_date = Column(String(50), nullable=True, comment="完成日期")
    remarks = Column(Text, nullable=True, comment="备注")
    
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    order = relationship("Order", back_populates="splits")
    
    def __repr__(self):
        return f"<Split(id={self.id}, order_number='{self.order_number}', customer='{self.customer_name}', quote_status='{self.quote_status}')>"