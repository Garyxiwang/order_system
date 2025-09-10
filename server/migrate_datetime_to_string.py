#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库迁移脚本：将时间字段从DateTime改为String类型
"""

import sys
import os
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 直接使用数据库文件路径
DATABASE_URL = "sqlite:///order_system.db"

def migrate_datetime_fields():
    """
    迁移数据库中的DateTime字段为String类型
    """
    # 创建数据库连接
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        try:
            print("开始迁移数据库字段类型...")
            
            # 1. 备份现有数据并转换为字符串格式
            print("1. 处理Split表的时间字段...")
            
            # 获取所有Split记录
            splits_result = db.execute(text("SELECT id, created_at, updated_at FROM splits"))
            split_data = []
            for row in splits_result:
                # 如果已经是字符串，直接使用；如果是datetime对象，转换为字符串
                if isinstance(row[1], str):
                    created_at = row[1] if row[1] else datetime.utcnow().isoformat()
                else:
                    created_at = row[1].isoformat() if row[1] else datetime.utcnow().isoformat()
                
                if isinstance(row[2], str):
                    updated_at = row[2] if row[2] else datetime.utcnow().isoformat()
                else:
                    updated_at = row[2].isoformat() if row[2] else datetime.utcnow().isoformat()
                
                split_data.append({
                    'id': row[0],
                    'created_at': created_at,
                    'updated_at': updated_at
                })
            
            print(f"   备份了 {len(split_data)} 条Split记录")
            
            # 2. 处理SplitProgress表
            print("2. 处理SplitProgress表的时间字段...")
            
            progress_result = db.execute(text("SELECT id, created_at, updated_at FROM split_progress"))
            split_progress_data = []
            for row in progress_result:
                # 如果已经是字符串，直接使用；如果是datetime对象，转换为字符串
                if isinstance(row[1], str):
                    created_at = row[1] if row[1] else datetime.utcnow().isoformat()
                else:
                    created_at = row[1].isoformat() if row[1] else datetime.utcnow().isoformat()
                
                if isinstance(row[2], str):
                    updated_at = row[2] if row[2] else datetime.utcnow().isoformat()
                else:
                    updated_at = row[2].isoformat() if row[2] else datetime.utcnow().isoformat()
                
                split_progress_data.append({
                    'id': row[0],
                    'created_at': created_at,
                    'updated_at': updated_at
                })
            
            print(f"   备份了 {len(split_progress_data)} 条SplitProgress记录")
            
            # 3. 修改表结构 (SQLite方式)
            print("3. 修改表结构...")
            
            # SQLite不支持直接修改字段类型，需要重建表
            # 修改Split表
            print("   重建Split表...")
            db.execute(text("""
                CREATE TABLE splits_new (
                    id INTEGER PRIMARY KEY,
                    order_number VARCHAR(50) NOT NULL,
                    customer_name VARCHAR(100) NOT NULL,
                    address TEXT NOT NULL,
                    order_date VARCHAR(50),
                    designer VARCHAR(50),
                    salesperson VARCHAR(50),
                    order_amount NUMERIC(12, 2),
                    cabinet_area NUMERIC(10, 2),
                    wall_panel_area NUMERIC(10, 2),
                    order_type VARCHAR(20) NOT NULL,
                    order_status VARCHAR(20) NOT NULL,
                    splitter VARCHAR(50),
                    internal_production_items JSON,
                    external_purchase_items JSON,
                    quote_status VARCHAR(20),
                    completion_date VARCHAR(50),
                    remarks TEXT,
                    created_at VARCHAR(50),
                    updated_at VARCHAR(50),
                    FOREIGN KEY(order_number) REFERENCES orders (order_number)
                )
            """))
            
            # 复制数据到新表
            db.execute(text("""
                INSERT INTO splits_new (id, order_number, customer_name, address, order_date, designer, salesperson, 
                    order_amount, cabinet_area, wall_panel_area, order_type, order_status, splitter, 
                    internal_production_items, external_purchase_items, quote_status, completion_date, remarks)
                SELECT id, order_number, customer_name, address, order_date, designer, salesperson, 
                    order_amount, cabinet_area, wall_panel_area, order_type, order_status, splitter, 
                    internal_production_items, external_purchase_items, quote_status, completion_date, remarks FROM splits
            """))
            
            # 删除旧表，重命名新表
            db.execute(text("DROP TABLE splits"))
            db.execute(text("ALTER TABLE splits_new RENAME TO splits"))
            
            # 修改SplitProgress表
            print("   重建SplitProgress表...")
            db.execute(text("""
                CREATE TABLE split_progress_new (
                    id INTEGER PRIMARY KEY,
                    split_id INTEGER NOT NULL,
                    order_number VARCHAR(50) NOT NULL,
                    item_type VARCHAR(8) NOT NULL,
                    category_name VARCHAR(100) NOT NULL,
                    planned_date VARCHAR(50),
                    split_date VARCHAR(50),
                    purchase_date VARCHAR(50),
                    status VARCHAR(20),
                    remarks TEXT,
                    created_at VARCHAR(50),
                    updated_at VARCHAR(50),
                    FOREIGN KEY(split_id) REFERENCES splits (id)
                )
            """))
            
            # 复制数据到新表
            db.execute(text("""
                INSERT INTO split_progress_new (id, split_id, order_number, item_type, category_name, planned_date, split_date, purchase_date, status, remarks)
                SELECT id, split_id, order_number, item_type, category_name, planned_date, split_date, purchase_date, status, remarks FROM split_progress
            """))
            
            # 删除旧表，重命名新表
            db.execute(text("DROP TABLE split_progress"))
            db.execute(text("ALTER TABLE split_progress_new RENAME TO split_progress"))
            
            print("   表结构重建完成")
            
            # 4. 恢复数据
            print("4. 恢复数据...")
            
            # 恢复Split数据
            for data in split_data:
                db.execute(text(
                    "UPDATE splits SET created_at = :created_at, updated_at = :updated_at WHERE id = :id"
                ), {
                    'id': data['id'],
                    'created_at': data['created_at'],
                    'updated_at': data['updated_at']
                })
            
            # 恢复SplitProgress数据
            for data in split_progress_data:
                db.execute(text(
                    "UPDATE split_progress SET created_at = :created_at, updated_at = :updated_at WHERE id = :id"
                ), {
                    'id': data['id'],
                    'created_at': data['created_at'],
                    'updated_at': data['updated_at']
                })
            
            # 提交事务
            db.commit()
            print("✅ 数据库迁移完成！")
            print(f"   - Split表: {len(split_data)} 条记录已更新")
            print(f"   - SplitProgress表: {len(split_progress_data)} 条记录已更新")
            
        except Exception as e:
            print(f"❌ 迁移过程中出现错误: {e}")
            db.rollback()
            raise

if __name__ == "__main__":
    migrate_datetime_fields()