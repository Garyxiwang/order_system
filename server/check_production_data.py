#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查生产管理数据插入结果
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import sessionmaker
from app.core.database import engine
from app.models.production import Production
from app.models.production_progress import ProductionProgress

# 创建数据库会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_production_data():
    """检查生产管理数据"""
    db = SessionLocal()
    
    try:
        # 检查生产记录总数
        production_count = db.query(Production).count()
        print(f"生产记录总数: {production_count}")
        
        # 检查生产进度记录总数
        progress_count = db.query(ProductionProgress).count()
        print(f"生产进度记录总数: {progress_count}")
        
        # 检查最新的10条生产记录
        latest_productions = db.query(Production).order_by(Production.created_at.desc()).limit(10).all()
        print(f"\n最新的10条生产记录:")
        for prod in latest_productions:
            print(f"- 订单编号: {prod.order_number}, 客户: {prod.customer_name}, 状态: {prod.order_status}")
        
        # 按状态统计
        status_stats = db.query(Production.order_status, db.func.count(Production.id)).group_by(Production.order_status).all()
        print(f"\n按状态统计:")
        for status, count in status_stats:
            print(f"- {status}: {count}条")
        
        # 检查是否有关联的生产进度记录
        productions_with_progress = db.query(Production).join(ProductionProgress).distinct().count()
        print(f"\n有生产进度记录的生产订单数: {productions_with_progress}")
        
        print(f"\n数据验证完成！")
        
    except Exception as e:
        print(f"检查数据时发生错误: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("开始检查生产管理数据...")
    check_production_data()