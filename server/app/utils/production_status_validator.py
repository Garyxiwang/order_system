"""
生产状态自动校验工具
根据生产进度数据自动判断并更新生产状态
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.production import Production
from app.models.production_progress import ProductionProgress, ItemType


class ProductionStatusValidator:
    """生产状态校验器"""
    
    # 状态优先级定义（数字越大优先级越高）
    STATUS_PRIORITY = {
        "未齐料": 1,
        "已齐料": 2, 
        "已下料": 3,
        "已入库": 4,
        "已发货": 5,
        "已完成": 6
    }
    
    @classmethod
    def validate_and_update_status(cls, db: Session, production_id: int) -> str:
        """
        校验并更新生产状态
        
        Args:
            db: 数据库会话
            production_id: 生产记录ID
            
        Returns:
            str: 更新后的状态
        """
        # 获取生产记录
        production = db.query(Production).filter(Production.id == production_id).first()
        if not production:
            raise ValueError(f"生产记录不存在: {production_id}")
        
        # 获取该生产记录的所有进度项
        progress_items = db.query(ProductionProgress).filter(
            ProductionProgress.production_id == production_id
        ).all()
        
        # 计算新状态
        new_status = cls._calculate_status(production, progress_items)
        
        # 更新状态（如果有变化）
        if production.order_status != new_status:
            production.order_status = new_status
            db.commit()
        
        return new_status
    
    @classmethod
    def _calculate_status(cls, production: Production, progress_items: List[ProductionProgress]) -> str:
        """
        根据生产记录和进度项计算状态
        
        状态判断逻辑：
        1. 未齐料: 默认状态
        2. 已齐料: 判断厂内生产都填写实际日期
        3. 已下料: 生产进度 - 存在料日期
        4. 已入库: 存在实际入库日期
        5. 已发货: 存在实际发货日期
        6. 已完成: 最后手动修改（保持不变）
        """
        # 如果当前状态是"已完成"，保持不变（手动设置）
        if production.order_status == "已完成":
            return "已完成"
        
        # 检查实际发货日期
        if production.actual_delivery_date:
            return "已发货"
        
        # 检查是否已入库（所有厂内生产项都有实际入库日期）
        internal_items = [item for item in progress_items if item.item_type == ItemType.INTERNAL]
        if internal_items:
            all_have_storage_time = all(
                item.storage_time and item.storage_time.strip() 
                for item in internal_items
            )
            if all_have_storage_time:
                return "已入库"
        
        # 检查下料日期
        if production.cutting_date:
            return "已下料"
        
        # 检查是否已齐料（厂内生产项都有实际齐料日期）
        internal_items = [item for item in progress_items if item.item_type == ItemType.INTERNAL]
        if internal_items:
            # 检查所有厂内生产项是否都有实际齐料日期（actual_storage_date）
            all_have_actual_storage_date = all(
                item.actual_storage_date and item.actual_storage_date.strip() 
                for item in internal_items
            )
            if all_have_actual_storage_date:
                return "已齐料"
        
        # 默认状态
        return "未齐料"
    
    @classmethod
    def get_status_priority(cls, status: str) -> int:
        """获取状态优先级"""
        return cls.STATUS_PRIORITY.get(status, 0)
    
    @classmethod
    def get_higher_priority_status(cls, status1: str, status2: str) -> str:
        """获取优先级更高的状态（就近原则）"""
        priority1 = cls.get_status_priority(status1)
        priority2 = cls.get_status_priority(status2)
        return status1 if priority1 >= priority2 else status2


def validate_production_status(db: Session, production_id: int) -> str:
    """
    便捷函数：校验并更新生产状态
    
    Args:
        db: 数据库会话
        production_id: 生产记录ID
        
    Returns:
        str: 更新后的状态
    """
    return ProductionStatusValidator.validate_and_update_status(db, production_id)


def batch_validate_production_status(db: Session, production_ids: List[int]) -> Dict[int, str]:
    """
    批量校验并更新生产状态
    
    Args:
        db: 数据库会话
        production_ids: 生产记录ID列表
        
    Returns:
        Dict[int, str]: 生产ID到状态的映射
    """
    results = {}
    for production_id in production_ids:
        try:
            status = ProductionStatusValidator.validate_and_update_status(db, production_id)
            results[production_id] = status
        except Exception as e:
            # 记录错误但继续处理其他记录
            print(f"校验生产状态失败 (ID: {production_id}): {e}")
            results[production_id] = "校验失败"
    
    return results