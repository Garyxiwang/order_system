-- 数据库初始化脚本
-- 这个文件会在PostgreSQL容器首次启动时自动执行

-- 创建数据库（如果不存在）
SELECT 'CREATE DATABASE order_system'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_system')\gexec

-- 连接到order_system数据库
\c order_system;

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建用户角色枚举类型（如果不存在）
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user', 'manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建订单状态枚举类型（如果不存在）
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建拆单状态枚举类型（如果不存在）
DO $$ BEGIN
    CREATE TYPE split_status AS ENUM ('pending', 'ordered', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建生产状态枚举类型（如果不存在）
DO $$ BEGIN
    CREATE TYPE production_status AS ENUM ('pending', 'in_progress', 'completed', 'delayed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 创建采购状态枚举类型（如果不存在）
DO $$ BEGIN
    CREATE TYPE purchase_status AS ENUM ('not_started', 'in_progress', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 输出初始化完成信息
\echo 'Database initialization completed successfully!'