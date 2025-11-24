-- 修复 user_role 枚举类型，添加缺失的 'admin' 值
-- 这个脚本用于修复生产环境中缺少 'admin' 角色的问题
-- 注意：PostgreSQL 中枚举类型名称可能是 'user_role' 或 'userrole'（小写）

-- 检查 'admin' 是否已存在于枚举类型中
DO $$ 
DECLARE
    enum_type_name TEXT;
BEGIN
    -- 首先查找枚举类型名称（可能是 user_role 或 userrole）
    SELECT typname INTO enum_type_name
    FROM pg_type 
    WHERE typname IN ('user_role', 'userrole')
    LIMIT 1;
    
    IF enum_type_name IS NULL THEN
        RAISE EXCEPTION '未找到 user_role 或 userrole 枚举类型';
    END IF;
    
    RAISE NOTICE '找到枚举类型: %', enum_type_name;
    
    -- 检查是否存在 'admin' 值
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = enum_type_name)
    ) THEN
        -- 添加 'admin' 值到枚举类型
        -- 注意：PostgreSQL 9.1+ 支持在枚举末尾添加值
        -- PostgreSQL 10+ 支持 AFTER 子句，但需要小心使用
        BEGIN
            -- 使用动态SQL添加枚举值
            EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type_name, 'admin');
            RAISE NOTICE '成功添加 admin 角色到 % 枚举类型', enum_type_name;
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'admin 角色已存在（可能由并发操作添加）';
            WHEN OTHERS THEN
                RAISE NOTICE '无法添加 admin 角色: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'admin 角色已存在于 % 枚举类型中', enum_type_name;
    END IF;
END $$;

-- 显示当前枚举类型的所有值（支持 user_role 和 userrole）
SELECT 
    t.typname as enum_type_name,
    e.enumlabel as role_value, 
    e.enumsortorder as sort_order
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname IN ('user_role', 'userrole')
ORDER BY t.typname, e.enumsortorder;

