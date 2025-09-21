#!/usr/bin/env python3
"""
处理SQLite数据库中的用户角色问题
由于SQLite不支持枚举类型，我们需要确保应用程序能正确处理所有角色值
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_database_type():
    """检查数据库类型"""
    try:
        with engine.connect() as conn:
            # 尝试PostgreSQL特有的查询
            try:
                result = conn.execute(text("SELECT version();"))
                version_info = result.fetchone()[0]
                if 'PostgreSQL' in version_info:
                    return 'postgresql'
            except:
                pass
            
            # 检查是否是SQLite
            try:
                result = conn.execute(text("SELECT sqlite_version();"))
                return 'sqlite'
            except:
                pass
                
        return 'unknown'
    except Exception as e:
        logger.error(f"检查数据库类型失败: {e}")
        return 'unknown'

def fix_postgresql_enum():
    """修复PostgreSQL的枚举类型"""
    try:
        with engine.connect() as conn:
            # 检查auditor角色是否存在
            result = conn.execute(text("""
                SELECT COUNT(*) FROM pg_enum 
                WHERE enumlabel = 'auditor' 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
            """))
            
            if result.fetchone()[0] == 0:
                # 添加auditor角色
                conn.execute(text("ALTER TYPE user_role ADD VALUE 'auditor';"))
                conn.commit()
                logger.info("成功添加auditor角色到PostgreSQL枚举类型")
            else:
                logger.info("auditor角色已存在于PostgreSQL枚举类型中")
                
            # 显示所有角色
            result = conn.execute(text("""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') 
                ORDER BY enumsortorder;
            """))
            
            roles = [row[0] for row in result.fetchall()]
            logger.info(f"当前数据库中的角色: {roles}")
            
        return True
    except Exception as e:
        logger.error(f"修复PostgreSQL枚举失败: {e}")
        return False

def test_user_creation():
    """测试用户创建功能"""
    db = SessionLocal()
    try:
        # 测试创建auditor用户
        test_username = "test_auditor"
        
        # 删除可能存在的测试用户
        existing_user = db.query(User).filter(User.username == test_username).first()
        if existing_user:
            db.delete(existing_user)
            db.commit()
        
        # 创建新的auditor用户
        new_user = User(
            username=test_username,
            password=get_password_hash("test123456"),
            role=UserRole.AUDITOR
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"成功创建auditor用户: {new_user.username}, 角色: {new_user.role}")
        
        # 清理测试用户
        db.delete(new_user)
        db.commit()
        
        return True
        
    except Exception as e:
        logger.error(f"测试用户创建失败: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """主函数"""
    logger.info("开始检查和修复用户角色问题...")
    
    # 检查数据库类型
    db_type = check_database_type()
    logger.info(f"检测到数据库类型: {db_type}")
    
    if db_type == 'postgresql':
        # PostgreSQL数据库，修复枚举类型
        if fix_postgresql_enum():
            logger.info("PostgreSQL枚举类型修复成功")
        else:
            logger.error("PostgreSQL枚举类型修复失败")
            return False
    elif db_type == 'sqlite':
        # SQLite数据库，不需要修复枚举类型
        logger.info("SQLite数据库不需要修复枚举类型")
    else:
        logger.warning("未知的数据库类型，跳过枚举修复")
    
    # 测试用户创建
    if test_user_creation():
        logger.info("用户创建功能测试成功")
        return True
    else:
        logger.error("用户创建功能测试失败")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)