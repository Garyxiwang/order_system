-- 创建数据库用户和权限配置脚本
-- 这个脚本确保orderuser用户有正确的权限

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

-- 授予所有表的权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO orderuser;

-- 授予所有序列的权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO orderuser;

-- 授予所有函数的权限
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO orderuser;

-- 设置默认权限（对未来创建的对象）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO orderuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO orderuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO orderuser;

-- 确保用户可以创建表
ALTER USER orderuser CREATEDB;

\echo 'User orderuser created and permissions granted successfully!'