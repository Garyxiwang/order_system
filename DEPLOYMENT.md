# 订单管理系统部署方案

## 目录
- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [环境要求](#环境要求)
- [部署步骤](#部署步骤)
- [配置说明](#配置说明)
- [常见问题](#常见问题)
- [维护指南](#维护指南)
- [稳定性分析](#稳定性分析)

## 系统架构

### 整体架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     用户端      │────│   Nginx 反向    │────│   前端服务      │
│   (浏览器)      │    │     代理        │    │  (Next.js)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   后端服务      │────│   数据库服务    │
                       │  (FastAPI)      │    │ (PostgreSQL)    │
                       └─────────────────┘    └─────────────────┘
```

### 服务组件
- **Nginx**: 反向代理服务器，处理静态资源和API路由
- **Frontend**: Next.js前端应用，端口3000
- **Backend**: FastAPI后端服务，端口8000
- **Database**: PostgreSQL数据库，端口5432

## 技术栈

### 前端技术栈
- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: React Context
- **HTTP客户端**: Axios

### 后端技术栈
- **框架**: FastAPI
- **语言**: Python 3.11
- **数据库ORM**: SQLAlchemy
- **认证**: JWT + bcrypt
- **API文档**: Swagger/OpenAPI

### 基础设施
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **数据库**: PostgreSQL 15
- **操作系统**: Ubuntu 20.04

## 环境要求

### 服务器要求
- **CPU**: 2核心以上
- **内存**: 4GB以上
- **存储**: 20GB以上可用空间
- **网络**: 公网IP，开放80端口

### 软件要求
- Docker 20.10+
- Docker Compose 2.0+
- Git

## 部署步骤

### 1. 环境准备

#### 1.1 安装Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 1.2 克隆项目
```bash
git clone <repository-url>
cd order_system
```

### 2. 配置文件设置

#### 2.1 环境变量配置
创建 `.env` 文件：
```bash
# 数据库配置
POSTGRES_DB=order_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# JWT配置
SECRET_KEY=your_jwt_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 应用配置
DEBUG=false
ENVIRONMENT=production
```

#### 2.2 Nginx配置
确认 `nginx.conf` 配置正确：
```nginx
server {
    listen 80;
    server_name _;

    # 前端路由
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API路由
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 健康检查
    location /health {
        proxy_pass http://backend:8000/health;
    }
}
```

### 3. 部署执行

#### 3.1 首次部署
```bash
# 1. 构建并启动服务
docker-compose up -d --build

# 2. 检查服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f backend
```

#### 3.2 重新部署
```bash
# 1. 停止服务
docker-compose down

# 2. 清理旧数据（可选）
docker volume rm order_system_postgres_data

# 3. 重新构建并启动
docker-compose up -d --build
```

### 4. 验证部署

#### 4.1 服务健康检查
```bash
# 检查容器状态
docker-compose ps

# 检查后端健康
curl http://your-server-ip/health

# 检查前端访问
curl -I http://your-server-ip
```

#### 4.2 功能测试
```bash
# 测试登录API
curl -X POST http://your-server-ip/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superAdmin","password":"admin123"}'
```

## 配置说明

### Docker Compose配置
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: order_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./server
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/order_system
    ports:
      - "8000:8000"

  frontend:
    build: ./front
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

### 数据库初始化
系统启动时会自动：
1. 创建数据库表结构
2. 初始化基础数据
3. 创建超级管理员账户（superAdmin/admin123）

## 常见问题

### 1. bcrypt版本兼容性问题

**问题**: 密码加密失败，提示bcrypt版本不兼容
```
ValueError: password exceeds maximum length (72 bytes)
```

**解决方案**:
```bash
# 方法1: 手动更新容器内bcrypt版本
docker exec order_system_backend pip install bcrypt==3.2.2
docker-compose restart backend

# 方法2: 重新构建镜像
# 修改server/requirements.txt中bcrypt版本为3.2.2
docker-compose build --no-cache backend
docker-compose up -d
```

### 2. 数据库连接失败

**问题**: 后端无法连接数据库
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**解决方案**:
```bash
# 检查数据库容器状态
docker-compose logs db

# 重启数据库服务
docker-compose restart db

# 检查网络连接
docker network ls
```

### 3. 前端页面无法访问

**问题**: 浏览器显示502 Bad Gateway

**解决方案**:
```bash
# 检查Nginx配置
docker-compose logs nginx

# 检查前端服务状态
docker-compose logs frontend

# 重启相关服务
docker-compose restart nginx frontend
```

### 4. Docker构建缓慢

**问题**: Docker镜像构建时间过长

**解决方案**:
```bash
# 使用国内镜像源
# 在Dockerfile中添加：
RUN pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ -r requirements.txt

# 清理Docker缓存
docker system prune -a
```

## 维护指南

### 日常维护

#### 1. 日志管理
```bash
# 查看实时日志
docker-compose logs -f [service_name]

# 清理日志
docker-compose logs --tail=0 -f

# 日志轮转（建议设置cron任务）
find /var/lib/docker/containers/ -name "*.log" -exec truncate -s 0 {} \;
```

#### 2. 数据库管理

##### 数据备份与恢复
```bash
# 数据库备份
docker exec order_system_db pg_dump -U postgres order_system > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i order_system_db psql -U postgres order_system < backup_20240101.sql
```

##### 数据库连接与查询
```bash
# 连接到数据库容器
docker exec -it order_system_db psql -U postgres -d order_system

# 直接执行SQL查询
docker exec order_system_db psql -U postgres -d order_system -c "SELECT * FROM users LIMIT 10;"

# 查看所有表
docker exec order_system_db psql -U postgres -d order_system -c "\dt"

# 查看表结构
docker exec order_system_db psql -U postgres -d order_system -c "\d users"

# 查看数据库大小
docker exec order_system_db psql -U postgres -d order_system -c "SELECT pg_size_pretty(pg_database_size('order_system'));"
```

##### 常用数据查询命令
```bash
# 查看用户数据
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 20;"

# 查看订单统计
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT status, COUNT(*) as count, SUM(total_amount) as total 
FROM orders 
GROUP BY status;"

# 查看最近的订单
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT o.id, o.order_number, u.username, o.status, o.total_amount, o.created_at
FROM orders o 
JOIN users u ON o.user_id = u.id 
ORDER BY o.created_at DESC 
LIMIT 10;"

# 查看产品库存
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT name, sku, stock_quantity, price, status 
FROM products 
WHERE stock_quantity < 10 
ORDER BY stock_quantity ASC;"

# 查看系统统计信息
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completed_orders;"
```

##### 数据库性能监控
```bash
# 查看数据库连接数
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT count(*) as connections 
FROM pg_stat_activity 
WHERE datname = 'order_system';"

# 查看慢查询
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# 查看表大小
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

##### 数据删除操作
```bash
# ⚠️ 危险操作：删除特定用户（除超级管理员外）
docker exec order_system_db psql -U postgres -d order_system -c "
DELETE FROM users 
WHERE username != 'superAdmin' AND id = 具体用户ID;"

# ⚠️ 危险操作：删除特定订单
docker exec order_system_db psql -U postgres -d order_system -c "
DELETE FROM orders 
WHERE id = 具体订单ID;"

# ⚠️ 危险操作：删除特定产品
docker exec order_system_db psql -U postgres -d order_system -c "
DELETE FROM products 
WHERE id = 具体产品ID;"

# ⚠️ 危险操作：清空测试数据（保留超级管理员）
docker exec order_system_db psql -U postgres -d order_system -c "
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products WHERE name LIKE '%测试%';
DELETE FROM users WHERE username != 'superAdmin';"

# ⚠️ 极度危险：完全重置数据库
docker exec order_system_db psql -U postgres -d order_system -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;"

# 安全的数据清理：按条件删除过期数据
docker exec order_system_db psql -U postgres -d order_system -c "
DELETE FROM orders 
WHERE status = 'cancelled' 
AND created_at < NOW() - INTERVAL '30 days';"

# 删除无效的订单项
docker exec order_system_db psql -U postgres -d order_system -c "
DELETE FROM order_items 
WHERE order_id NOT IN (SELECT id FROM orders);"
```

##### 数据删除前的安全检查
```bash
# 删除前先查看要删除的数据
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT id, username, email, created_at 
FROM users 
WHERE username != 'superAdmin' 
LIMIT 10;"

# 检查订单关联关系
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT o.id, o.order_number, COUNT(oi.id) as item_count
FROM orders o 
LEFT JOIN order_items oi ON o.id = oi.order_id 
WHERE o.id = 具体订单ID
GROUP BY o.id, o.order_number;"

# 检查产品使用情况
docker exec order_system_db psql -U postgres -d order_system -c "
SELECT p.id, p.name, COUNT(oi.id) as used_in_orders
FROM products p 
LEFT JOIN order_items oi ON p.id = oi.product_id 
WHERE p.id = 具体产品ID
GROUP BY p.id, p.name;"
```



#### 3. 系统监控
```bash
# 检查容器资源使用
docker stats

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 磁盘清理与日志轮转

构建/发布次数多时，Docker 镜像、构建缓存和容器日志会持续增长。建议定期执行如下清理，并开启日志轮转：

```bash
# 1) 查看 Docker 磁盘占用
docker system df

# 2) 仅列出（不删除）可清理项（dry-run）
bash cloud-deployment/scripts/cleanup.sh --dry-run

# 3) 按需清理：删除 7 天前未使用的镜像/容器/构建缓存，并清理超大日志
bash cloud-deployment/scripts/cleanup.sh --prune --days 7 --truncate-logs --max-size 200M

# 4) 如需轮转 Nginx 文件日志（本地 compose 的 nginx 容器名为 order_system_nginx）
bash cloud-deployment/scripts/cleanup.sh --rotate-nginx --container order_system_nginx
```

本地开发 `docker-compose.yml` 已为各服务设置 `json-file` 日志 `max-size=10m, max-file=3`；生产编排建议也开启容器日志轮转，并在宿主机使用 `logrotate` 针对 `/var/log/nginx/*.log` 做文件级轮转（或使用上面的脚本进行简单轮转）。

### 更新部署

#### 1. 代码更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose down
docker-compose up -d --build
```

#### 2. 依赖更新
```bash
# 更新Python依赖
# 修改server/requirements.txt后重新构建

# 更新Node.js依赖
# 修改front/package.json后重新构建
```

## 稳定性分析

### 当前稳定性评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 服务可用性 | 8/10 | 容器化部署，自动重启机制 |
| 数据安全性 | 7/10 | 数据持久化，但缺少备份 |
| 故障恢复 | 6/10 | 手动运维，恢复时间较长 |
| 扩展性 | 5/10 | 单机部署，扩展能力有限 |
| 监控告警 | 3/10 | 缺少监控体系 |
| **综合评分** | **6.5/10** | **中等稳定性** |

### 稳定性改进建议

#### 短期改进（1-2周）
1. **修复依赖管理**: 重新构建镜像，固化bcrypt版本
2. **添加健康检查**: 在docker-compose.yml中添加健康检查配置
3. **设置自动备份**: 添加定时备份脚本

#### 中期改进（1-2月）
1. **添加监控系统**: 部署Prometheus + Grafana
2. **日志管理**: 集中化日志收集和轮转
3. **安全加固**: HTTPS配置，防火墙规则

#### 长期改进（3-6月）
1. **高可用部署**: 多服务器集群，数据库主从复制
2. **CI/CD流水线**: 自动化测试和部署
3. **容器编排**: 迁移到Kubernetes

### 适用场景
- ✅ 中小型企业内部使用
- ✅ 用户量不大（<1000并发）
- ✅ 对可用性要求不是特别严格
- ❌ 高并发生产环境
- ❌ 7×24小时关键业务
- ❌ 对数据安全要求极高的场景

## 联系信息

如有部署问题，请联系技术支持团队。

---

**最后更新**: 2024年1月
**文档版本**: v1.0