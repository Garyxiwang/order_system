# 如何查看服务器上的数据库连接信息

数据库连接信息通常存储在环境变量或配置文件中。以下是几种查看方法：

## 方法一：查看环境变量（推荐）

### 1. 查看当前环境变量

```bash
# 查看所有环境变量
env | grep DATABASE

# 或者只查看 DATABASE_URL
echo $DATABASE_URL
```

### 2. 如果使用 Docker 容器

```bash
# 查看运行中的容器
docker ps

# 查看容器的环境变量（替换 container_name 为实际容器名）
docker exec <container_name> env | grep DATABASE

# 或者查看特定容器的环境变量
docker inspect <container_name> | grep -A 20 "Env"
```

### 3. 如果使用 Docker Compose

```bash
# 进入项目目录
cd /path/to/order_system/server

# 查看 docker-compose 配置中的环境变量
cat docker-compose.yml | grep -A 10 DATABASE

# 或者查看运行中的服务环境变量
docker-compose exec app env | grep DATABASE
```

## 方法二：从运行中的应用查看

### 1. 通过 Python 脚本查看

创建一个临时脚本 `check_db_info.py`：

```python
#!/usr/bin/env python3
import os
from urllib.parse import urlparse

DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL:
    parsed = urlparse(DATABASE_URL)
    print(f"数据库主机: {parsed.hostname}")
    print(f"数据库端口: {parsed.port or 5432}")
    print(f"数据库名: {parsed.path.lstrip('/')}")
    print(f"用户名: {parsed.username}")
    print(f"密码: {'*' * len(parsed.password) if parsed.password else '未设置'}")
    print(f"\n完整连接字符串: {DATABASE_URL.split('@')[0]}@***")
else:
    print("未找到 DATABASE_URL 环境变量")
```

运行：
```bash
cd server
python3 check_db_info.py
```

### 2. 从应用日志查看

```bash
# 查看应用启动日志（通常会打印数据库连接信息）
tail -f logs/app.log | grep -i database

# 或者查看系统日志
journalctl -u your-service-name | grep -i database
```

## 方法三：从配置文件查看

### 1. 检查 .env 文件

```bash
# 在项目根目录或 server 目录查找
find . -name ".env" -type f

# 查看 .env 文件内容（如果存在）
cat .env | grep DATABASE
```

### 2. 检查 Docker Compose 文件

```bash
# 查看 docker-compose.yml
cat docker-compose.yml | grep -A 5 DATABASE

# 或者查看生产环境配置
cat cloud-deployment/docker-compose.production.yml | grep -A 5 DATABASE
```

## 方法四：从数据库容器查看

如果数据库运行在 Docker 容器中：

```bash
# 查看数据库容器的环境变量
docker exec order_system_db env | grep POSTGRES

# 这会显示：
# POSTGRES_DB=order_system
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=postgres123
```

## 方法五：直接连接测试

如果知道部分信息，可以尝试连接：

```bash
# 尝试连接（会提示输入密码）
psql -h <host> -U <username> -d <database>

# 或者使用密码环境变量
export PGPASSWORD='your_password'
psql -h <host> -U <username> -d <database>
```

## 常见情况

### 情况 1：使用 Docker Compose

根据 `docker-compose.yml`，数据库信息通常是：
- **主机**: `localhost` 或容器名 `db`（在容器内）
- **端口**: `5432`（容器内）或 `5433`（宿主机）
- **数据库名**: `order_system`
- **用户名**: `postgres`（默认）
- **密码**: 查看 `docker-compose.yml` 中的 `POSTGRES_PASSWORD`

### 情况 2：使用云服务（如 AWS RDS、阿里云 RDS）

数据库信息通常在：
- 云服务控制台
- 环境变量 `DATABASE_URL`
- 密钥管理服务（如 AWS Secrets Manager）

### 情况 3：直接部署在服务器

检查：
- 系统服务配置文件（如 systemd service 文件）
- 启动脚本
- 环境变量文件（`/etc/environment` 或 `~/.bashrc`）

## 快速检查脚本

创建一个脚本 `check_db_connection.sh`：

```bash
#!/bin/bash

echo "=== 检查数据库连接信息 ==="
echo ""

# 检查环境变量
echo "1. 环境变量 DATABASE_URL:"
if [ -n "$DATABASE_URL" ]; then
    echo "   $DATABASE_URL"
    # 解析并显示（隐藏密码）
    echo "$DATABASE_URL" | sed 's/:[^@]*@/:***@/'
else
    echo "   未设置"
fi

echo ""
echo "2. Docker 容器信息:"
if command -v docker &> /dev/null; then
    echo "   运行中的容器:"
    docker ps --format "table {{.Names}}\t{{.Image}}" | grep -E "NAME|postgres|order"
    
    echo ""
    echo "   数据库容器环境变量:"
    docker exec order_system_db env 2>/dev/null | grep POSTGRES || echo "   容器不存在或无法访问"
else
    echo "   Docker 未安装"
fi

echo ""
echo "3. 配置文件:"
if [ -f "docker-compose.yml" ]; then
    echo "   找到 docker-compose.yml"
    grep -A 3 "POSTGRES" docker-compose.yml 2>/dev/null || echo "   未找到数据库配置"
else
    echo "   未找到 docker-compose.yml"
fi
```

运行：
```bash
chmod +x check_db_connection.sh
./check_db_connection.sh
```

## 注意事项

⚠️ **安全提示**：
- 不要在日志或终端中直接显示完整密码
- 使用 `sed` 或类似工具隐藏密码部分
- 检查完信息后，及时清理临时脚本

## 如果找不到信息

如果以上方法都找不到，可以：

1. **查看应用运行进程**：
   ```bash
   ps aux | grep python | grep -i database
   ```

2. **查看系统服务配置**：
   ```bash
   systemctl status your-service-name
   cat /etc/systemd/system/your-service-name.service
   ```

3. **联系系统管理员**或查看部署文档

