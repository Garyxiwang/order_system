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
        # 需要检查的角色列表（Python代码中定义的所有角色）
        required_roles = [role.value for role in UserRole]
        logger.info(f"Python代码中定义的角色: {required_roles}")
        
        # 首先查找枚举类型名称（可能是 user_role 或 userrole）
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT typname FROM pg_type 
                WHERE typname IN ('user_role', 'userrole')
                LIMIT 1;
            """))
            enum_type_row = result.fetchone()
            
            if not enum_type_row:
                logger.error("未找到 user_role 或 userrole 枚举类型")
                return False
            
            enum_type_name = enum_type_row[0]
            logger.info(f"找到枚举类型: {enum_type_name}")
            
            # 获取数据库中现有的角色
            result = conn.execute(text(f"""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = :enum_type) 
                ORDER BY enumsortorder;
            """), {"enum_type": enum_type_name})
            existing_roles = [row[0] for row in result.fetchall()]
            logger.info(f"数据库中现有的角色: {existing_roles}")
            
            # 检查并添加缺失的角色
            missing_roles = [role for role in required_roles if role not in existing_roles]
            
            if missing_roles:
                logger.info(f"发现缺失的角色: {missing_roles}")
                for role in missing_roles:
                    try:
                        # 检查角色是否已存在（防止并发添加）
                        check_result = conn.execute(text(f"""
                            SELECT COUNT(*) FROM pg_enum 
                            WHERE enumlabel = :role 
                            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = :enum_type)
                        """), {"role": role, "enum_type": enum_type_name})
                        
                        if check_result.fetchone()[0] == 0:
                            # 尝试添加角色（PostgreSQL 9.1+ 支持）
                            # 注意：ALTER TYPE ADD VALUE 不能在事务块中执行
                            # 需要关闭自动提交，然后手动提交
                            conn.commit()  # 先提交当前事务
                            
                            # 使用原始连接执行 ALTER TYPE（必须在 autocommit 模式下）
                            raw_conn = conn.connection.dbapi_connection
                            if hasattr(raw_conn, 'autocommit'):
                                old_autocommit = raw_conn.autocommit
                                raw_conn.autocommit = True
                                try:
                                    cursor = raw_conn.cursor()
                                    cursor.execute(f"ALTER TYPE {enum_type_name} ADD VALUE '{role}';")
                                    cursor.close()
                                    logger.info(f"成功添加 {role} 角色到PostgreSQL枚举类型 {enum_type_name}")
                                finally:
                                    raw_conn.autocommit = old_autocommit
                            else:
                                # 如果无法设置 autocommit，尝试直接执行
                                conn.execute(text(f"ALTER TYPE {enum_type_name} ADD VALUE '{role}';"))
                                conn.commit()
                                logger.info(f"成功添加 {role} 角色到PostgreSQL枚举类型 {enum_type_name}")
                        else:
                            logger.info(f"{role} 角色已存在（可能由并发操作添加）")
                    except Exception as e:
                        logger.warning(f"无法添加 {role} 角色（可能需要重新创建枚举类型）: {e}")
                        import traceback
                        logger.warning(traceback.format_exc())
            else:
                logger.info("所有角色都已存在于PostgreSQL枚举类型中")
                
            # 显示所有角色
            result = conn.execute(text(f"""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = :enum_type) 
                ORDER BY enumsortorder;
            """), {"enum_type": enum_type_name})
            
            roles = [row[0] for row in result.fetchall()]
            logger.info(f"修复后的数据库角色: {roles}")
            
        return True
    except Exception as e:
        logger.error(f"修复PostgreSQL枚举失败: {e}")
        import traceback
        logger.error(traceback.format_exc())
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