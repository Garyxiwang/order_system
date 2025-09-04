# Docker 部署指南

本指南介绍如何使用 Docker 部署订单系统后端服务。

## 📋 前置要求

- Docker (版本 20.10+)
- Docker Compose (版本 2.0+)
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

## 🚀 快速部署

### 方法一：使用部署脚本（推荐）

```bash
# 进入服务端目录
cd server

# 运行部署脚本
./docker-deploy.sh
```

### 方法二：手动部署

```bash
# 1. 创建必要目录
mkdir -p uploads logs

# 2. 构建并启动服务
docker-compose up --build -d

# 3. 查看服务状态
docker-compose ps
```

## 📁 文件结构

```
server/
├── Dockerfile              # Docker镜像构建文件
├── docker-compose.yml      # Docker Compose配置
├── .dockerignore          # Docker忽略文件
├── init.sql               # 数据库初始化脚本
├── docker-deploy.sh       # 自动部署脚本
└── DOCKER_DEPLOY.md       # 本文档
```

## 🔧 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres123@db:5432/order_system` | 数据库连接URL |
| `ENVIRONMENT` | `production` | 运行环境 |
| `PORT` | `8000` | 应用端口 |
| `PYTHONPATH` | `/app` | Python路径 |
| `PYTHONUNBUFFERED` | `1` | Python输出缓冲 |

### 端口映射

- **应用服务**: `8000:8000`
- **数据库服务**: `5432:5432`

### 数据卷

- `postgres_data`: PostgreSQL数据持久化
- `./uploads`: 文件上传目录
- `./logs`: 应用日志目录

## 🌐 访问地址

部署成功后，可以通过以下地址访问：

- **API服务**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health
- **数据库**: localhost:5432

## 📊 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f db
```

### 容器操作

```bash
# 进入应用容器
docker-compose exec app bash

# 进入数据库容器
docker-compose exec db psql -U postgres -d order_system

# 查看容器资源使用
docker stats
```

### 数据库操作

```bash
# 数据库备份
docker-compose exec db pg_dump -U postgres order_system > backup.sql

# 数据库恢复
docker-compose exec -T db psql -U postgres order_system < backup.sql

# 重置数据库
docker-compose down -v
docker-compose up -d
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :8000
   lsof -i :5432
   
   # 修改docker-compose.yml中的端口映射
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库容器状态
   docker-compose logs db
   
   # 重启数据库服务
   docker-compose restart db
   ```

3. **应用启动失败**
   ```bash
   # 查看应用日志
   docker-compose logs app
   
   # 检查依赖安装
   docker-compose exec app pip list
   ```

4. **磁盘空间不足**
   ```bash
   # 清理Docker资源
   docker system prune -a
   docker volume prune
   ```

### 健康检查

```bash
# 检查应用健康状态
curl http://localhost:8000/health

# 检查数据库连接
docker-compose exec db pg_isready -U postgres
```

## 🔒 安全建议

1. **修改默认密码**
   - 在生产环境中修改 `docker-compose.yml` 中的数据库密码
   - 使用环境变量文件 `.env` 管理敏感信息

2. **网络安全**
   - 在生产环境中不要暴露数据库端口
   - 使用反向代理（如 Nginx）

3. **数据备份**
   - 定期备份数据库
   - 备份上传文件目录

## 📈 性能优化

1. **资源限制**
   ```yaml
   # 在docker-compose.yml中添加资源限制
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
       reservations:
         cpus: '0.5'
         memory: 512M
   ```

2. **数据库优化**
   - 调整PostgreSQL配置参数
   - 定期执行VACUUM和ANALYZE

3. **应用优化**
   - 使用多个worker进程
   - 启用应用缓存

## 🚀 生产部署

对于生产环境，建议：

1. 使用外部数据库服务
2. 配置SSL证书
3. 设置监控和日志收集
4. 使用容器编排工具（如Kubernetes）
5. 实施CI/CD流水线

---

如有问题，请查看日志或联系开发团队。