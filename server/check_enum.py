#!/usr/bin/env python3
"""
检查和修复数据库中的user_role枚举类型
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine
from app.models.user import UserRole
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_enum_values():
    """检查当前数据库中的user_role枚举值"""
    try:
        with engine.connect() as conn:
            # 查询当前的user_role枚举值
            result = conn.execute(text("""
                SELECT enumlabel 
                FROM pg_enum 
                WHERE enumtypid = (
                    SELECT oid 
                    FROM pg_type 
                    WHERE typname = 'user_role'
                ) 
                ORDER BY enumsortorder;
            """))
            
            current_values = [row[0] for row in result.fetchall()]
            
            print("当前数据库中的user_role枚举值:")
            for value in current_values:
                print(f"  - {value}")
            
            # 检查Python模型中定义的所有角色
            model_values = [role.value for role in UserRole]
            print("\nPython模型中定义的角色:")
            for value in model_values:
                print(f"  - {value}")
            
            # 找出缺失的角色
            missing_values = set(model_values) - set(current_values)
            if missing_values:
                print(f"\n缺失的角色: {missing_values}")
                return list(missing_values)
            else:
                print("\n所有角色都已存在于数据库中")
                return []
                
    except Exception as e:
        logger.error(f"检查枚举值失败: {e}")
        return None

def add_enum_values(missing_values):
    """添加缺失的枚举值"""
    if not missing_values:
        return True
        
    try:
        with engine.connect() as conn:
            for value in missing_values:
                print(f"添加枚举值: {value}")
                conn.execute(text(f"ALTER TYPE user_role ADD VALUE '{value}';"))
                conn.commit()
                
        print("成功添加所有缺失的枚举值")
        return True
        
    except Exception as e:
        logger.error(f"添加枚举值失败: {e}")
        return False

def main():
    """主函数"""
    print("检查数据库user_role枚举类型...")
    
    missing_values = check_enum_values()
    
    if missing_values is None:
        print("检查失败，请检查数据库连接")
        return False
    
    if missing_values:
        print(f"\n发现缺失的枚举值: {missing_values}")
        confirm = input("是否要添加这些缺失的枚举值? (y/N): ")
        
        if confirm.lower() == 'y':
            success = add_enum_values(missing_values)
            if success:
                print("\n重新检查枚举值...")
                check_enum_values()
            return success
        else:
            print("跳过添加枚举值")
            return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)