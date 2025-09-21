-- 修复user_role枚举类型，添加缺失的'auditor'角色
-- 这个脚本用于修复已存在的数据库

-- 检查auditor角色是否已存在
DO $$ 
BEGIN
    -- 尝试添加auditor角色
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'auditor' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'user_role'
        )
    ) THEN
        ALTER TYPE user_role ADD VALUE 'auditor';
        RAISE NOTICE 'Added auditor role to user_role enum';
    ELSE
        RAISE NOTICE 'auditor role already exists in user_role enum';
    END IF;
END $$;

-- 验证所有角色是否存在
SELECT enumlabel as role_name 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') 
ORDER BY enumsortorder;