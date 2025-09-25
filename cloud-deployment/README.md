# 订单系统生产环境部署指南

本指南提供了订单系统在生产环境中的完整部署方案，包括 AWS 云服务部署和 Docker 容器化部署两种方式。

## 📋 目录

- [系统架构](#系统架构)
- [部署方式对比](#部署方式对比)
- [AWS 云服务部署](#aws-云服务部署)
- [Docker 容器化部署](#docker-容器化部署)
- [监控和日志](#监控和日志)
- [安全配置](#安全配置)
- [备份和恢复](#备份和恢复)
- [故障排除](#故障排除)

## 🏗️ 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │  Application    │    │   ECS Fargate   │
│   (CDN/WAF)     │───▶│ Load Balancer   │───▶│   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   ECS Fargate   │    │   RDS MySQL     │
                       │   (Backend)     │───▶│   (Database)    │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  ElastiCache    │    │   S3 Bucket     │
                       │   (Redis)       │    │ (File Storage)  │
                       └─────────────────┘    └─────────────────┘
```

### 核心组件

- **前端**: Next.js 应用，运行在 ECS Fargate
- **后端**: Python FastAPI 应用，运行在 ECS Fargate
- **数据库**: AWS RDS MySQL 8.0
- **缓存**: AWS ElastiCache Redis
- **存储**: AWS S3 用于文件存储
- **CDN**: AWS CloudFront 用于静态资源分发
- **负载均衡**: Application Load Balancer
- **容器注册**: AWS ECR

## 🔄 部署方式对比

| 特性 | AWS 云服务部署 | Docker 容器化部署 |
|------|----------------|-------------------|
| **扩展性** | 自动扩缩容 | 手动扩缩容 |
| **可用性** | 多 AZ 高可用 | 单点故障风险 |
| **管理复杂度** | 低（托管服务） | 中等 |
| **成本** | 按需付费 | 固定服务器成本 |
| **部署速度** | 慢（首次） | 快 |
| **适用场景** | 生产环境 | 开发/测试环境 |

## ☁️ AWS 云服务部署

### 前置要求

1. **AWS 账户**：具有管理员权限的 AWS 账户
2. **工具安装**：
   ```bash
   # 安装 AWS CLI
   curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
   sudo installer -pkg AWSCLIV2.pkg -target /
   
   # 安装 Terraform
   brew install terraform
   
   # 安装 Docker
   brew install docker
   ```

3. **AWS 凭证配置**：
   ```bash
   aws configure
   # 输入 Access Key ID、Secret Access Key、Region 等信息
   ```

### 部署步骤

#### 1. 准备配置文件

```bash
# 复制并编辑 Terraform 变量文件
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
vim terraform/terraform.tfvars
```

关键配置项：
```hcl
# 基础配置
aws_region   = "us-west-2"
environment  = "production"
project_name = "order-system"
domain_name  = "yourdomain.com"

# 数据库配置
db_instance_class = "db.t3.medium"
db_password      = "your-strong-password"

# 应用配置
secret_key = "your-application-secret"
jwt_secret = "your-jwt-secret"
```

#### 2. 执行部署

```bash
# 使用自动化脚本部署
./scripts/deploy.sh aws production

# 或手动部署
cd terraform
terraform init
terraform plan
terraform apply
```

#### 3. 推送应用镜像

部署脚本会自动构建并推送镜像到 ECR，也可以手动执行：

```bash
# 获取 ECR 登录命令
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# 构建并推送镜像
docker build -t order-system/frontend ../front/
docker tag order-system/frontend:latest <ecr-frontend-uri>:latest
docker push <ecr-frontend-uri>:latest

docker build -t order-system/backend ../server/
docker tag order-system/backend:latest <ecr-backend-uri>:latest
docker push <ecr-backend-uri>:latest
```

#### 4. 验证部署

```bash
# 检查服务状态
aws ecs describe-services --cluster order-system-cluster --services order-system-frontend order-system-backend

# 访问应用
curl https://your-alb-dns-name/api/health
```

### AWS 资源清单

部署完成后将创建以下 AWS 资源：

- **网络**: VPC、子网、Internet Gateway、NAT Gateway
- **计算**: ECS 集群、Fargate 服务、Auto Scaling 组
- **存储**: RDS 实例、ElastiCache 集群、S3 存储桶
- **网络**: Application Load Balancer、CloudFront 分发
- **安全**: IAM 角色、安全组、WAF 规则
- **监控**: CloudWatch 日志组、告警

## 🐳 Docker 容器化部署

### 前置要求

1. **服务器要求**：
   - CPU: 4 核心以上
   - 内存: 8GB 以上
   - 存储: 100GB 以上 SSD
   - 操作系统: Ubuntu 20.04+ 或 CentOS 8+

2. **软件安装**：
   ```bash
   # 安装 Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # 安装 Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### 部署步骤

#### 1. 准备环境配置

```bash
# 复制环境变量文件
cp .env.example .env
vim .env
```

关键配置项：
```env
# 数据库配置
DATABASE_URL=postgresql://admin:password@database:5432/order_system
DB_PASSWORD=your-strong-password

# Redis 配置
REDIS_URL=redis://:password@redis:6379/0
REDIS_PASSWORD=your-redis-password

# 应用配置
SECRET_KEY=your-application-secret
JWT_SECRET=your-jwt-secret
API_URL=https://yourdomain.com

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### 2. 配置 SSL 证书

```bash
# 创建 SSL 证书目录
mkdir -p nginx/ssl

# 使用 Let's Encrypt 获取证书
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 复制证书到项目目录
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*
```

#### 3. 执行部署

```bash
# 使用自动化脚本部署
./scripts/deploy.sh docker production

# 或手动部署
docker-compose -f docker-compose.production.yml up -d
```

#### 4. 验证部署

```bash
# 检查服务状态
docker-compose -f docker-compose.production.yml ps

# 查看日志
docker-compose -f docker-compose.production.yml logs -f

# 健康检查
curl https://yourdomain.com/api/health
```

## 📊 监控和日志

### 监控组件

1. **Prometheus**: 指标收集
2. **Grafana**: 可视化面板
3. **Loki**: 日志聚合
4. **AlertManager**: 告警管理

### 访问监控面板

- **Grafana**: http://your-domain:3001
  - 默认用户名/密码: admin/admin
- **Prometheus**: http://your-domain:9090

### 关键监控指标

- **应用指标**: 响应时间、错误率、吞吐量
- **系统指标**: CPU、内存、磁盘、网络使用率
- **数据库指标**: 连接数、查询性能、锁等待
- **缓存指标**: 命中率、内存使用、连接数

### 日志管理

```bash
# 查看应用日志
docker logs order_system_backend_prod -f
docker logs order_system_frontend_prod -f

# 查看 Nginx 日志
docker logs order_system_nginx_prod -f

# 查看数据库日志
docker logs order_system_db_prod -f
```

## 🔒 安全配置

### 网络安全

1. **防火墙配置**：
   ```bash
   # 只开放必要端口
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **SSL/TLS 配置**：
   - 使用 TLS 1.2+ 协议
   - 配置 HSTS 头
   - 启用 OCSP Stapling

### 应用安全

1. **环境变量管理**：
   - 使用强密码
   - 定期轮换密钥
   - 不在代码中硬编码敏感信息

2. **访问控制**：
   - 实施 RBAC 权限控制
   - 启用 API 限流
   - 配置 CORS 策略

### 数据安全

1. **数据库安全**：
   - 启用数据加密
   - 配置访问白名单
   - 定期安全更新

2. **备份加密**：
   - 备份数据加密存储
   - 异地备份策略

## 💾 备份和恢复

### 自动备份策略

1. **数据库备份**：
   ```bash
   # 创建备份脚本
   #!/bin/bash
   BACKUP_DIR="/backup/database"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   # PostgreSQL 备份
   docker exec order_system_db_prod pg_dump -U admin order_system > "$BACKUP_DIR/db_backup_$DATE.sql"
   
   # 压缩备份文件
   gzip "$BACKUP_DIR/db_backup_$DATE.sql"
   
   # 删除 7 天前的备份
   find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
   ```

2. **文件备份**：
   ```bash
   # 备份上传文件
   rsync -av /var/lib/docker/volumes/order_system_backend_uploads/ /backup/uploads/
   
   # 备份到云存储
   aws s3 sync /backup/ s3://your-backup-bucket/
   ```

### 恢复流程

1. **数据库恢复**：
   ```bash
   # 停止应用服务
   docker-compose -f docker-compose.production.yml stop backend
   
   # 恢复数据库
   gunzip -c /backup/database/db_backup_20231201_120000.sql.gz | \
   docker exec -i order_system_db_prod psql -U admin -d order_system
   
   # 重启服务
   docker-compose -f docker-compose.production.yml start backend
   ```

2. **完整系统恢复**：
   ```bash
   # 恢复配置文件
   cp /backup/config/.env .env
   cp /backup/config/docker-compose.production.yml .
   
   # 恢复数据
   docker-compose -f docker-compose.production.yml up -d
   ```

## 🔧 故障排除

### 常见问题

1. **服务启动失败**：
   ```bash
   # 检查日志
   docker-compose -f docker-compose.production.yml logs service-name
   
   # 检查资源使用
   docker stats
   
   # 检查网络连接
   docker network ls
   docker network inspect order_system_network
   ```

2. **数据库连接问题**：
   ```bash
   # 测试数据库连接
   docker exec -it order_system_db_prod psql -U admin -d order_system
   
   # 检查数据库状态
   docker exec order_system_db_prod pg_isready -U admin
   ```

3. **性能问题**：
   ```bash
   # 检查系统资源
   htop
   iotop
   
   # 检查数据库性能
   docker exec -it order_system_db_prod psql -U admin -d order_system -c "SELECT * FROM pg_stat_activity;"
   ```

### 紧急恢复流程

1. **服务不可用**：
   ```bash
   # 快速重启所有服务
   docker-compose -f docker-compose.production.yml restart
   
   # 如果仍有问题，重新部署
   ./scripts/deploy.sh docker production
   ```

2. **数据丢失**：
   ```bash
   # 从最近备份恢复
   ./scripts/restore.sh latest
   
   # 检查数据完整性
   docker exec -it order_system_db_prod psql -U admin -d order_system -c "SELECT COUNT(*) FROM orders;"
   ```

## 📞 支持和维护

### 定期维护任务

1. **每日**：
   - 检查服务状态
   - 查看错误日志
   - 监控资源使用

2. **每周**：
   - 更新系统补丁
   - 清理日志文件
   - 检查备份完整性

3. **每月**：
   - 安全扫描
   - 性能优化
   - 容量规划

### 联系信息

- **技术支持**: tech-support@company.com
- **紧急联系**: +86-xxx-xxxx-xxxx
- **文档更新**: 请提交 PR 到项目仓库

---

## 📝 更新日志

- **v1.0.0** (2024-01-01): 初始版本发布
- **v1.1.0** (2024-01-15): 添加 AWS 部署支持
- **v1.2.0** (2024-02-01): 增强监控和日志功能

---

*本文档最后更新时间: 2024-01-01*