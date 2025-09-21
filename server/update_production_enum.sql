-- 更新生产环境数据库的user_role枚举类型
-- 移除多余的角色，确保与Python UserRole枚举完全一致

-- 首先检查是否有用户使用了要删除的角色
SELECT role, COUNT(*) as user_count 
FROM users 
WHERE role IN ('admin', 'customer') 
GROUP BY role;

-- 如果有用户使用了这些角色，需要先更新他们的角色
-- 例如：将admin用户改为superAdmin，将customer用户改为clerk
-- UPDATE users SET role = 'superAdmin' WHERE role = 'admin';
-- UPDATE users SET role = 'clerk' WHERE role = 'customer';

-- 删除多余的枚举值（注意：PostgreSQL不支持直接删除枚举值）
-- 需要重新创建枚举类型

-- 备份当前用户表数据
CREATE TABLE users_backup AS SELECT * FROM users;

-- 删除外键约束和表
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
DROP TABLE users;

-- 删除旧的枚举类型
DROP TYPE user_role;

-- 创建新的枚举类型
CREATE TYPE user_role AS ENUM (
    'superAdmin',
    'manager', 
    'auditor',
    'designer', 
    'splitting', 
    'clerk', 
    'procurement', 
    'salesperson', 
    'finance', 
    'workshop', 
    'shipper'
);

-- 重新创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'clerk',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 恢复数据（过滤掉无效的角色）
INSERT INTO users (id, username, password, role, created_at, updated_at)
SELECT 
    id, 
    username, 
    password, 
    CASE 
        WHEN role = 'admin' THEN 'superAdmin'::user_role
        WHEN role = 'customer' THEN 'clerk'::user_role
        ELSE role::user_role
    END,
    created_at, 
    updated_at
FROM users_backup
WHERE role NOT IN ('admin', 'customer') 
   OR role IN ('admin', 'customer');

-- 重置序列
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 删除备份表
DROP TABLE users_backup;

-- 验证结果
SELECT role, COUNT(*) as user_count 
FROM users 
GROUP BY role 
ORDER BY role;