# GitHub Actions 自动化部署指南

本项目支持使用 GitHub Actions 进行自动化部署，实现代码推送后自动构建、测试和部署到生产服务器。

## 🚀 功能特性

- **自动化测试**: 推送代码时自动运行前后端测试
- **Docker镜像构建**: 自动构建并推送到 GitHub Container Registry
- **零停机部署**: 使用 Docker Compose 实现平滑部署
- **健康检查**: 部署后自动验证服务状态
- **多环境支持**: 支持开发、测试、生产环境
- **安全管理**: 使用 GitHub Secrets 管理敏感信息

## 📋 部署流程

### 1. 代码推送触发
```
git push origin main
```

### 2. 自动化流程
1. **测试阶段** - 运行前后端测试
2. **构建阶段** - 构建 Docker 镜像并推送到 Registry
3. **部署阶段** - 连接服务器，拉取镜像，更新服务
4. **验证阶段** - 健康检查，确保服务正常运行

## ⚙️ 配置步骤

### 1. 设置 GitHub Secrets

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下密钥：

```bash
# 服务器连接信息
SERVER_HOST=106.54.235.3          # 服务器IP地址
SERVER_USER=root                   # SSH用户名
SERVER_SSH_KEY=<私钥内容>          # SSH私钥
SERVER_PORT=22                     # SSH端口（可选，默认22）

# 数据库配置
POSTGRES_PASSWORD=<数据库密码>      # PostgreSQL密码

# 应用配置
SECRET_KEY=<应用密钥>              # FastAPI密钥
```

### 2. 启用 GitHub Container Registry

确保仓库启用了 GitHub Packages 功能：
- 进入仓库 Settings > General
- 在 Features 部分启用 "Packages"

### 3. 服务器准备

在服务器上执行以下命令：

```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 创建项目目录
sudo mkdir -p /home/www/order_system
sudo chown -R $USER:$USER /home/www/order_system

# 克隆项目代码
cd /home/www/order_system
git clone <你的仓库地址> .
```

## 📁 文件结构

```
.github/
└── workflows/
    ├── deploy.yml                    # 主要的部署工作流
    └── docker-compose.production.yml # 生产环境配置

deploy-github-actions.sh              # 服务器端部署脚本
README-GITHUB-ACTIONS.md             # 本说明文档
```

## 🔧 工作流配置

### 触发条件
- `push` 到 `main` 或 `master` 分支
- `pull_request` 到 `main` 或 `master` 分支
- 手动触发 (`workflow_dispatch`)

### 任务说明

#### 1. Test Job
- 设置 Python 3.11 和 Node.js 18 环境
- 安装依赖并运行测试
- 构建前端项目验证

#### 2. Build-and-Push Job
- 构建后端和前端 Docker 镜像
- 推送到 GitHub Container Registry
- 仅在推送到主分支时执行

#### 3. Deploy Job
- 连接到生产服务器
- 拉取最新镜像
- 更新并重启服务
- 执行健康检查

#### 4. Notify Job
- 发送部署状态通知
- 记录部署结果

## 🐳 Docker 镜像

镜像将推送到 GitHub Container Registry：
- 后端: `ghcr.io/<用户名>/<仓库名>-backend:latest`
- 前端: `ghcr.io/<用户名>/<仓库名>-frontend:latest`

## 🔍 监控和调试

### 查看部署日志
1. 进入 GitHub 仓库的 Actions 标签页
2. 点击最新的工作流运行
3. 查看各个任务的详细日志

### 服务器端调试
```bash
# 查看容器状态
docker ps -a

# 查看服务日志
docker-compose logs -f

# 检查健康状态
curl http://localhost/api/health
```

### 常见问题

#### 1. SSH 连接失败
- 检查 `SERVER_HOST`、`SERVER_USER`、`SERVER_SSH_KEY` 是否正确
- 确保服务器防火墙允许 SSH 连接

#### 2. Docker 镜像拉取失败
- 检查 GitHub Token 权限
- 确保仓库启用了 Packages 功能

#### 3. 健康检查失败
- 检查服务器端口是否开放
- 查看容器日志排查应用启动问题

## 🔄 回滚操作

如果部署出现问题，可以快速回滚：

```bash
# 在服务器上执行
cd /home/www/order_system

# 回滚到上一个版本
docker-compose down
docker pull ghcr.io/<用户名>/<仓库名>-backend:<上一个标签>
docker pull ghcr.io/<用户名>/<仓库名>-frontend:<上一个标签>
docker-compose up -d
```

## 📈 优化建议

### 1. 缓存优化
- 使用 Docker 层缓存加速构建
- 缓存 npm 和 pip 依赖

### 2. 安全加固
- 定期轮换 SSH 密钥
- 使用最小权限原则
- 启用容器安全扫描

### 3. 监控告警
- 集成 Slack/钉钉通知
- 添加性能监控
- 设置错误告警

## 🎯 下一步

1. **多环境部署**: 配置开发、测试、生产环境
2. **蓝绿部署**: 实现零停机部署
3. **自动回滚**: 健康检查失败时自动回滚
4. **性能监控**: 集成 APM 工具
5. **安全扫描**: 添加代码和镜像安全扫描

---

## 📞 支持

如有问题，请：
1. 查看 GitHub Actions 日志
2. 检查服务器端容器状态
3. 提交 Issue 或联系维护团队