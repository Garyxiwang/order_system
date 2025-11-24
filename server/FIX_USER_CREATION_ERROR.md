# 修复正式环境用户创建错误

## 问题描述

在正式环境中创建用户时出现 500 错误。主要原因是 PostgreSQL 数据库的 `user_role` 枚举类型中缺少 `admin` 角色，但 Python 代码和前端都支持该角色。

## 修复内容

### 1. 改进错误处理
- 在 `server/app/api/v1/endpoints/users.py` 中添加了详细的错误日志记录
- 添加了堆栈跟踪信息，便于定位问题
- 改进了角色值验证逻辑

### 2. 修复数据库枚举类型
- 更新了 `server/init.sql`，在枚举类型中添加了 `admin` 角色
- 创建了 `server/fix_user_role_enum.sql` 修复脚本，用于为现有数据库添加缺失的角色
- 更新了 `server/migrate_enum.py`，使其能够自动检查并添加所有缺失的角色

## 修复步骤

根据日志显示，数据库中的枚举类型名称是 `userrole`（小写），而不是 `user_role`。修复脚本已更新以支持这两种情况。

### 方法一：使用快速修复脚本（最简单，推荐）

1. 在服务器上设置数据库连接环境变量：
   ```bash
   export DATABASE_URL='postgresql://user:password@host:port/database'
   ```

2. 运行快速修复脚本：
   ```bash
   cd server
   python quick_fix_admin_role.py
   ```

   脚本会自动：
   - 检测枚举类型名称（`user_role` 或 `userrole`）
   - 检查 `admin` 角色是否存在
   - 如果不存在，自动添加
   - 显示所有当前角色

### 方法二：使用 SQL 脚本

1. 连接到正式环境的 PostgreSQL 数据库
2. 执行修复脚本：
   ```bash
   psql -h <数据库主机> -U <用户名> -d <数据库名> -f server/fix_user_role_enum.sql
   ```

   或者直接执行 SQL：
   ```sql
   -- 脚本会自动检测枚举类型名称并添加 admin 角色
   \i server/fix_user_role_enum.sql
   ```

### 方法三：手动执行 SQL

如果上述方法不可用，可以手动执行以下 SQL：

```sql
-- 首先查找枚举类型名称（可能是 user_role 或 userrole）
SELECT typname FROM pg_type 
WHERE typname IN ('user_role', 'userrole');

-- 假设找到的是 'userrole'，执行：
ALTER TYPE userrole ADD VALUE 'admin';

-- 或者如果是 'user_role'，执行：
ALTER TYPE user_role ADD VALUE 'admin';
```

**注意**：`ALTER TYPE ADD VALUE` 不能在事务块中执行，必须使用 autocommit 模式。

## 验证修复

修复后，可以通过以下方式验证：

1. 检查枚举类型中的所有角色：
   ```sql
   SELECT enumlabel FROM pg_enum 
   WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
   ORDER BY enumsortorder;
   ```

2. 尝试创建角色为 `admin` 的用户，应该不再出现 500 错误

3. 查看服务器日志，应该能看到详细的错误信息（如果还有其他问题）

## 注意事项

- PostgreSQL 的 `ALTER TYPE ADD VALUE` 不能在事务块中执行
- 如果数据库版本较旧（PostgreSQL < 9.1），可能需要重新创建枚举类型
- 修复后需要重新部署服务器代码以应用改进的错误处理

## 相关文件

- `server/app/api/v1/endpoints/users.py` - 用户创建接口（已改进错误处理）
- `server/init.sql` - 数据库初始化脚本（已添加 admin 角色）
- `server/fix_user_role_enum.sql` - SQL 修复脚本（支持 user_role 和 userrole）
- `server/quick_fix_admin_role.py` - 快速修复脚本（推荐使用）
- `server/migrate_enum.py` - 自动修复脚本（已更新）

