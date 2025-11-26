-- 简单修复脚本：添加 admin 角色到枚举类型
-- 使用方法: psql -h <host> -U <user> -d <database> -f fix_admin_role_simple.sql

-- 检查并添加 admin 角色（支持 user_role 和 userrole 两种枚举类型名称）

-- 如果是 userrole 枚举类型
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'userrole')
        ) THEN
            ALTER TYPE userrole ADD VALUE 'admin';
            RAISE NOTICE '成功添加 admin 角色到 userrole 枚举类型';
        ELSE
            RAISE NOTICE 'admin 角色已存在于 userrole 枚举类型中';
        END IF;
    END IF;
END $$;

-- 如果是 user_role 枚举类型
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN
            ALTER TYPE user_role ADD VALUE 'admin';
            RAISE NOTICE '成功添加 admin 角色到 user_role 枚举类型';
        ELSE
            RAISE NOTICE 'admin 角色已存在于 user_role 枚举类型中';
        END IF;
    END IF;
END $$;

-- 显示当前所有角色
SELECT 
    t.typname as enum_type_name,
    e.enumlabel as role_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname IN ('user_role', 'userrole')
ORDER BY t.typname, e.enumsortorder;

