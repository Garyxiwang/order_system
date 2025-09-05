# 订单系统部署指南

## 架构说明

本项目采用前后端分离架构，通过 Nginx 反向代理实现统一访问入口：

```
用户请求 → Nginx (80端口) → 前端服务 (3000端口) / 后端API (8000端口)
```

### 访问路径规则

- **前端页面**: `http://localhost/` → 代理到前端服务 `http://frontend:3000`
- **后端API**: `http://localhost/api/` → 代理到后端服务 `http://backend:8000/`
- **健康检查**: `http://localhost/health` → 代理到后端健康检查接口

## 部署方式

### 方式一：Docker Compose 部署（推荐）

#### 1. 准备环境

```bash
# 确保安装了 Docker 和 Docker Compose
docker --version
docker-compose --version
```

#### 2. 环境变量配置

创建 `.env` 文件：

```bash
# 数据库配置（如果使用 PostgreSQL）
DB_USER=admin
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://admin:your_secure_password@database:5432/order_system

# 后端配置
SECRET_KEY=your-super-secret-key-here
ENVIRONMENT=production

# 前端配置
NEXT_PUBLIC_API_URL=http://localhost/api
```

#### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 4. 访问应用

- 前端应用: http://localhost
- 后端API文档: http://localhost/api/docs
- 健康检查: http://localhost/health

### 方式二：分别部署

#### 1. 部署后端服务

```bash
cd server

# 安装依赖
pip install -r requirements.txt

# 启动服务（端口 8000）
python startup.py
```

#### 2. 部署前端服务

```bash
cd front

# 安装依赖
npm install

# 构建应用
npm run build

# 启动服务（端口 3000）
npm start
```

#### 3. 配置 Nginx

将 `nginx.conf` 复制到 Nginx 配置目录：

```bash
# macOS (使用 Homebrew 安装的 Nginx)
sudo cp nginx.conf /usr/local/etc/nginx/servers/order_system.conf

# Ubuntu/Debian
sudo cp nginx.conf /etc/nginx/sites-available/order_system
sudo ln -s /etc/nginx/sites-available/order_system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo nginx -s reload
```

**注意**: 如果分别部署，需要修改 `nginx.conf` 中的代理地址：

```nginx
# 将容器名称改为实际的服务地址
location / {
    proxy_pass http://localhost:3000;  # 前端服务
}

location /api/ {
    proxy_pass http://localhost:8000/;  # 后端服务
}
```

## 配置说明

### Nginx 配置特点

1. **路径重写**: `/api/` 请求会被代理到后端服务的根路径
2. **CORS 处理**: 自动处理跨域请求
3. **静态资源缓存**: 对 JS、CSS、图片等静态资源设置缓存
4. **Gzip 压缩**: 启用压缩以提高传输效率
5. **健康检查**: 提供服务健康状态检查

### 前端配置调整

前端的 API 请求应该使用相对路径：

```javascript
// 正确的 API 调用方式
const response = await fetch('/api/users');

// 或者使用环境变量
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const response = await fetch(`${API_BASE}/users`);
```

### 后端配置调整

确保后端允许来自 Nginx 的代理请求：

```python
# FastAPI CORS 配置
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 监控和维护

### 查看日志

```bash
# Docker Compose 方式
docker-compose logs nginx
docker-compose logs frontend
docker-compose logs backend

# 传统部署方式
sudo tail -f /var/log/nginx/order_system_access.log
sudo tail -f /var/log/nginx/order_system_error.log
```

### 服务管理

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新服务
docker-compose up -d --build
```

### 备份数据

```bash
# 备份数据库（如果使用 PostgreSQL）
docker-compose exec database pg_dump -U admin order_system > backup.sql

# 备份应用数据
docker-compose exec backend tar -czf /tmp/data_backup.tar.gz /app/data
docker cp order_system_backend:/tmp/data_backup.tar.gz ./data_backup.tar.gz
```

## 故障排除

### 常见问题

1. **502 Bad Gateway**
   - 检查后端服务是否正常运行
   - 检查端口是否正确
   - 查看 Nginx 错误日志

2. **API 请求失败**
   - 检查 `/api/` 路径配置
   - 确认后端服务可访问
   - 检查 CORS 配置

3. **静态资源加载失败**
   - 检查前端服务状态
   - 确认静态资源路径配置

### 调试命令

```bash
# 测试服务连通性
curl http://localhost/health
curl http://localhost/api/docs

# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :3000
netstat -tlnp | grep :8000

# 检查 Docker 容器状态
docker ps
docker logs <container_name>
```

## 生产环境建议

1. **安全配置**
   - 使用 HTTPS
   - 设置防火墙规则
   - 定期更新依赖

2. **性能优化**
   - 启用 Nginx 缓存
   - 配置负载均衡
   - 使用 CDN

3. **监控告警**
   - 配置日志收集
   - 设置性能监控
   - 建立告警机制

通过以上配置，您可以实现前后端的统一访问，用户只需要访问一个域名即可使用完整的应用功能。