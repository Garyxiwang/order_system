#!/usr/bin/env python3
"""
快速修复脚本：为 PostgreSQL 数据库添加缺失的 'admin' 角色
这个脚本可以直接在生产环境运行
"""

import sys
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# 从环境变量获取数据库连接信息
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("错误: 未设置 DATABASE_URL 环境变量")
    print("请设置: export DATABASE_URL='postgresql://user:password@host:port/database'")
    sys.exit(1)

def fix_admin_role():
    """修复 admin 角色"""
    try:
        # 解析数据库 URL
        # 格式: postgresql://user:password@host:port/database
        from urllib.parse import urlparse
        parsed = urlparse(DATABASE_URL)
        
        conn = psycopg2.connect(
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path.lstrip('/')
        )
        
        # 设置 autocommit 模式（ALTER TYPE ADD VALUE 需要）
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        # 首先查找枚举类型名称（可能是 user_role 或 userrole）
        cursor.execute("""
            SELECT typname FROM pg_type 
            WHERE typname IN ('user_role', 'userrole')
            LIMIT 1;
        """)
        
        enum_type_row = cursor.fetchone()
        if not enum_type_row:
            print("错误: 未找到 user_role 或 userrole 枚举类型")
            return False
        
        enum_type_name = enum_type_row[0]
        print(f"找到枚举类型: {enum_type_name}")
        
        # 检查 admin 角色是否已存在
        cursor.execute("""
            SELECT COUNT(*) FROM pg_enum 
            WHERE enumlabel = 'admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = %s);
        """, (enum_type_name,))
        
        if cursor.fetchone()[0] > 0:
            print("✓ admin 角色已存在于枚举类型中")
        else:
            # 添加 admin 角色
            try:
                cursor.execute(f"ALTER TYPE {enum_type_name} ADD VALUE 'admin';")
                print(f"✓ 成功添加 admin 角色到 {enum_type_name} 枚举类型")
            except psycopg2.errors.DuplicateObject:
                print("✓ admin 角色已存在（可能由并发操作添加）")
        
        # 显示所有角色
        cursor.execute(f"""
            SELECT enumlabel FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = %s) 
            ORDER BY enumsortorder;
        """, (enum_type_name,))
        
        roles = [row[0] for row in cursor.fetchall()]
        print(f"\n当前枚举类型中的所有角色: {', '.join(roles)}")
        
        cursor.close()
        conn.close()
        
        return True
        
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

