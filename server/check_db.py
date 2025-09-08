#!/usr/bin/env python3

import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.database import engine
from sqlalchemy import text

def check_order_status_column():
    """检查orders表的order_status字段类型"""
    try:
        with engine.connect() as conn:
            # 检查字段类型
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'orders' AND column_name = 'order_status'
            """))
            
            columns = list(result)
            print("orders表的order_status字段信息:")
            for col in columns:
                print(f"  字段名: {col[0]}")
                print(f"  数据类型: {col[1]}")
                print(f"  可为空: {col[2]}")
                print(f"  默认值: {col[3]}")
            
            # 检查表的约束（MySQL）
            result2 = conn.execute(text("""
                SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_NAME = 'orders' AND TABLE_SCHEMA = DATABASE()
            """))
            
            constraints = list(result2)
            print("\norders表的约束:")
            for constraint in constraints:
                print(f"  约束名: {constraint[0]}, 类型: {constraint[1]}")
                
            # 检查字段约束
            result3 = conn.execute(text("""
                SHOW CREATE TABLE orders
            """))
            
            create_table = list(result3)
            if create_table:
                print("\n表创建语句:")
                print(create_table[0][1])
                
    except Exception as e:
        print(f"检查失败: {e}")

if __name__ == "__main__":
    check_order_status_column()