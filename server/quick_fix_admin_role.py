#!/usr/bin/env python3
"""
快速修复脚本：为 PostgreSQL 数据库添加缺失的 'admin' 角色
这个脚本可以直接在生产环境运行
使用 SQLAlchemy 而不是直接使用 psycopg2
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# 从环境变量获取数据库连接信息
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("错误: 未设置 DATABASE_URL 环境变量")
    print("请设置: export DATABASE_URL='postgresql://user:password@host:port/database'")
    sys.exit(1)

def fix_admin_role():
    """修复 admin 角色"""
    try:
        from sqlalchemy import create_engine, text
        from app.models.user import UserRole
        
        # 创建数据库引擎
        engine = create_engine(DATABASE_URL)
        
        # 需要检查的角色列表（Python代码中定义的所有角色）
        required_roles = [role.value for role in UserRole]
        print(f"需要检查的角色: {required_roles}")
        
        with engine.connect() as conn:
            # 首先查找枚举类型名称（可能是 user_role 或 userrole）
            result = conn.execute(text("""
                SELECT typname FROM pg_type 
                WHERE typname IN ('user_role', 'userrole')
                LIMIT 1;
            """))
            
            enum_type_row = result.fetchone()
            if not enum_type_row:
                print("错误: 未找到 user_role 或 userrole 枚举类型")
                return False
            
            enum_type_name = enum_type_row[0]
            print(f"找到枚举类型: {enum_type_name}")
            
            # 获取数据库中现有的角色
            result = conn.execute(text(f"""
                SELECT enumlabel FROM pg_enum 
                WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = :enum_type) 
                ORDER BY enumsortorder;
            """), {"enum_type": enum_type_name})
            existing_roles = [row[0] for row in result.fetchall()]
            print(f"数据库中现有的角色: {existing_roles}")
            
            # 检查并添加缺失的角色
            missing_roles = [role for role in required_roles if role not in existing_roles]
            
            if missing_roles:
                print(f"发现缺失的角色: {missing_roles}，开始修复...")
                
                # 提交当前事务，因为 ALTER TYPE ADD VALUE 不能在事务块中执行
                conn.commit()
                
                # 使用原始连接执行 ALTER TYPE（必须在 autocommit 模式下）
                # 获取底层 psycopg2 连接
                raw_conn = conn.connection
                
                # 尝试获取 psycopg2 连接
                if hasattr(raw_conn, 'dbapi_connection'):
                    dbapi_conn = raw_conn.dbapi_connection
                    if hasattr(dbapi_conn, 'autocommit'):
                        old_autocommit = dbapi_conn.autocommit
                        dbapi_conn.autocommit = True
                        try:
                            cursor = dbapi_conn.cursor()
                            for role in missing_roles:
                                try:
                                    # 再次检查（防止并发添加）
                                    check_result = conn.execute(text(f"""
                                        SELECT COUNT(*) FROM pg_enum 
                                        WHERE enumlabel = :role 
                                        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = :enum_type)
                                    """), {"role": role, "enum_type": enum_type_name})
                                    
                                    if check_result.fetchone()[0] == 0:
                                        cursor.execute(f"ALTER TYPE {enum_type_name} ADD VALUE %s;", (role,))
                                        print(f"✓ 成功添加 {role} 角色到 {enum_type_name} 枚举类型")
                                    else:
                                        print(f"✓ {role} 角色已存在")
                                except Exception as e:
                                    if 'duplicate' in str(e).lower() or 'already exists' in str(e).lower():
                                        print(f"✓ {role} 角色已存在（重复对象）")
                                    else:
                                        print(f"⚠️  无法添加 {role} 角色: {e}")
                            cursor.close()
                        finally:
                            dbapi_conn.autocommit = old_autocommit
                    else:
                        print("⚠️  无法设置 autocommit 模式，请手动执行 SQL 脚本")
                        return False
                else:
                    print("⚠️  无法获取原始数据库连接，请手动执行 SQL 脚本")
                    print("   或者安装 psycopg2: pip install psycopg2-binary")
                    return False
                
                # 显示修复后的所有角色
                result = conn.execute(text(f"""
                    SELECT enumlabel FROM pg_enum 
                    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = :enum_type) 
                    ORDER BY enumsortorder;
                """), {"enum_type": enum_type_name})
                
                roles = [row[0] for row in result.fetchall()]
                print(f"\n修复后的数据库角色: {', '.join(roles)}")
            else:
                print("✓ 所有角色都已存在于枚举类型中，无需修复")
                print(f"当前角色: {', '.join(existing_roles)}")
        
        return True
        
    except ImportError as e:
        print(f"错误: 缺少必要的模块 - {e}")
        print("请确保已安装 SQLAlchemy: pip install sqlalchemy")
        return False
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("开始修复 admin 角色...")
    print(f"数据库连接: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else '已设置'}")
    print()
    
    if fix_admin_role():
        print("\n✓ 修复完成！现在可以尝试创建 admin 角色的用户了。")
        sys.exit(0)
    else:
        print("\n✗ 修复失败，请检查错误信息。")
        sys.exit(1)

