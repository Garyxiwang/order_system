-- 数据库初始化脚本
-- 这个文件会在PostgreSQL容器首次启动时自动执行

-- 创建数据库（如果不存在）
SELECT 'CREATE DATABASE order_system'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'order_system')\gexec

-- 创建用户（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'orderuser') THEN
        CREATE USER orderuser WITH PASSWORD 'PLACEHOLDER_PASSWORD';
    END IF;
END $$;

-- 授予数据库权限
GRANT ALL PRIVILEGES ON DATABASE order_system TO orderuser;

-- 连接到order_system数据库
\c order_system;

-- 授予schema权限
GRANT ALL ON SCHEMA public TO orderuser;

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建用户角色枚举类型（如果不存在）
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 订单状态枚举类型已废弃，现在使用VARCHAR类型
-- 支持的状态值：量尺、初稿、报价、打款、延期、暂停、等硬装、客户待打款、待客户确认、待下单、已下单、已撤销等

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

-- 授予orderuser用户对所有表、序列和函数的权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO orderuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO orderuser;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO orderuser;

-- 设置默认权限（对未来创建的对象）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO orderuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO orderuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO orderuser;

-- 输出初始化完成信息
\echo 'Database initialization completed successfully!'