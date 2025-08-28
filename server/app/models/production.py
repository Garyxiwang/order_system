from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base


class PurchaseStatus(enum.Enum):
    """采购状态枚举"""
    PENDING = "待采购"  # 待采购
    PURCHASING = "采购中"  # 采购中
    COMPLETED = "采购完成"  # 采购完成
    DELAYED = "采购延期"  # 采购延期


class Production(Base):
    """生产管理模型"""
    __tablename__ = "productions"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), ForeignKey("orders.order_number"), nullable=False, index=True, comment="订单编号")
    
    # 基本信息（从订单和拆单复制）
    customer_name = Column(String(100), nullable=False, comment="客户名称")
    address = Column(Text, nullable=False, comment="地址")
    is_installation = Column(Boolean, default=False, comment="是否安装")
    
    # 日期信息
    customer_payment_date = Column(DateTime, nullable=True, comment="客户打款日期")
    split_order_date = Column(DateTime, nullable=True, comment="拆单下单日期")
    expected_delivery_date = Column(DateTime, nullable=True, comment="预计交货日期")
    
    # 采购和材料信息
    purchase_status = Column(Enum(PurchaseStatus), default=PurchaseStatus.PENDING, comment="采购状态")
    board_18_quantity = Column(Integer, default=0, comment="18板数量")
    board_09_quantity = Column(Integer, default=0, comment="09板数量")
    
    # 生产进度
    cutting_date = Column(DateTime, nullable=True, comment="下料日期")
    finished_storage_date = Column(DateTime, nullable=True, comment="成品入库日期")
    expected_shipment_date = Column(DateTime, nullable=True, comment="预计出货日期")
    actual_shipment_date = Column(DateTime, nullable=True, comment="实际出货日期")
    
    # 生产项信息（从拆单复制）
    internal_production_items = Column(Text, nullable=True, comment="厂内生产项")
    external_purchase_items = Column(Text, nullable=True, comment="外购项")
    
    # 其他信息
    order_status = Column(String(20), nullable=False, comment="订单状态")
    remarks = Column(Text, nullable=True, comment="备注")
    
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # 关联关系
    order = relationship("Order", back_populates="productions")
    
    @property
    def order_days(self):
        """下单天数：拆单下单日期减去客户打款日期"""
        if self.split_order_date and self.customer_payment_date:
            return (self.split_order_date - self.customer_payment_date).days
        return None
    
    def __repr__(self):
        return f"<Production(id={self.id}, order_number='{self.order_number}', customer='{self.customer_name}', status='{self.order_status}')>"