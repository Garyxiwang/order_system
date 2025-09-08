from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class Progress(Base):
    """订单进度模型"""
    __tablename__ = "progresses"

    id = Column(Integer, primary_key=True, index=True)
    
    # 关联订单
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, comment="订单ID")
    order = relationship("Order", back_populates="progresses")
    
    task_item = Column(String(200), nullable=False, comment="进行事项")
    planned_date = Column(String(20), nullable=False, comment="计划日期")
    actual_date = Column(String(20), nullable=True, comment="实际日期")
    remarks = Column(Text, nullable=True, comment="备注")
    
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    def __repr__(self):
        return f"<Progress(id={self.id}, order_id={self.order_id}, task='{self.task_item}', planned='{self.planned_date}')>"