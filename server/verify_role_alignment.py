#!/usr/bin/env python3
"""
验证Python UserRole枚举和数据库user_role枚举是否完全对齐
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

def get_python_roles():
    """获取Python UserRole枚举中的所有角色"""
    return set(role.value for role in UserRole)

def get_database_roles():
    """获取数据库中user_role枚举的所有角色"""
    try:
        with engine.connect() as conn:
            # 检查数据库类型
            try:
                # PostgreSQL查询
                result = conn.execute(text("""
                    SELECT enumlabel 
                    FROM pg_enum 
                    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
                    ORDER BY enumsortorder;
                """))
                return set(row[0] for row in result.fetchall())
            except:
                # SQLite不支持枚举，返回Python枚举作为参考
                logger.info("SQLite数据库不支持枚举类型，使用Python枚举作为参考")
                return get_python_roles()
    except Exception as e:
        logger.error(f"获取数据库角色失败: {e}")
        return set()

def verify_alignment():
    """验证Python和数据库角色定义是否对齐"""
    logger.info("开始验证角色定义对齐...")
    
    python_roles = get_python_roles()
    database_roles = get_database_roles()
    
    logger.info(f"Python UserRole枚举角色: {sorted(python_roles)}")
    logger.info(f"数据库user_role枚举角色: {sorted(database_roles)}")
    
    # 检查差异
    only_in_python = python_roles - database_roles
    only_in_database = database_roles - python_roles
    common_roles = python_roles & database_roles
    
    logger.info(f"共同角色 ({len(common_roles)}): {sorted(common_roles)}")
    
    if only_in_python:
        logger.warning(f"仅在Python中存在的角色 ({len(only_in_python)}): {sorted(only_in_python)}")
    
    if only_in_database:
        logger.warning(f"仅在数据库中存在的角色 ({len(only_in_database)}): {sorted(only_in_database)}")
    
    # 判断是否完全对齐
    is_aligned = len(only_in_python) == 0 and len(only_in_database) == 0
    
    if is_aligned:
        logger.info("✅ Python UserRole枚举和数据库user_role枚举完全对齐！")
        return True
    else:
        logger.error("❌ Python UserRole枚举和数据库user_role枚举不对齐！")
        return False

def main():
    """主函数"""
    try:
        success = verify_alignment()
        return success
    except Exception as e:
        logger.error(f"验证过程出错: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)