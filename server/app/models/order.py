from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.types import Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base


class OrderStatus(enum.Enum):
    """订单状态枚举"""
    PENDING = "待处理"  # 待处理
    CONFIRMED = "已下单"  # 已下单
    DESIGNING = "设计中"  # 设计中
    DESIGN_COMPLETED = "设计完成"  # 设计完成
    PRODUCTION = "生产中"  # 生产中
    COMPLETED = "已完成"  # 已完成
    CANCELLED = "已撤销"  # 已撤销


class DesignCycle(enum.Enum):
    """设计周期枚举"""
    URGENT = "加急"  # 加急（1-3天）
    NORMAL = "正常"  # 正常（7-10天）
    EXTENDED = "延长"  # 延长（15-20天）


class Order(Base):
    """订单模型"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False, comment="订单编号")
    customer_name = Column(String(100), nullable=False, comment="客户名称")
    address = Column(Text, nullable=False, comment="地址")
    designer = Column(String(50), nullable=False, comment="设计师")
    salesperson = Column(String(50), nullable=False, comment="销售员")
    assignment_date = Column(String(50), nullable=False, comment="分单日期")
    order_date = Column(DateTime, nullable=True, comment="下单日期")
    
    # 类目名称
    category_name = Column(String(100), nullable=False, comment="类目名称")
    
    order_type = Column(String(50), nullable=False, comment="订单类型")
    design_cycle = Column(String(50), nullable=True, comment="设计周期")
    
    # 面积和金额
    cabinet_area = Column(Numeric(10, 2), nullable=True, comment="柜体面积")
    wall_panel_area = Column(Numeric(10, 2), nullable=True, comment="墙板面积")
    design_area = Column(Numeric(10, 2), nullable=True, comment="设计面积")
    order_amount = Column(Numeric(12, 2), nullable=True, comment="订单金额")
    
    is_installation = Column(Boolean, default=False, comment="是否安装")
    remarks = Column(Text, nullable=True, comment="备注")
    order_status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, comment="订单状态")
    
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    progresses = relationship("Progress", back_populates="order", cascade="all, delete-orphan")
    splits = relationship("Split", back_populates="order", cascade="all, delete-orphan")
    productions = relationship("Production", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order(id={self.id}, order_number='{self.order_number}', customer='{self.customer_name}', status='{self.order_status.value}')>"