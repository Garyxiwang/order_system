#!/bin/bash

# GitHub Actions 自动化部署脚本
# 用于在服务器端执行部署操作

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的环境变量
check_env_vars() {
    log_info "检查环境变量..."
    
    required_vars=("GITHUB_REPOSITORY" "GITHUB_TOKEN" "POSTGRES_PASSWORD" "SECRET_KEY")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "环境变量 $var 未设置"
            exit 1
        fi
    done
    
    log_success "环境变量检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p /home/www/order_system/nginx/ssl
    mkdir -p /home/www/order_system/logs
    
    log_success "目录创建完成"
}

# 设置环境文件
setup_env_file() {
    log_info "设置环境文件..."
    
    cat > /home/www/order_system/.env << EOF
# 数据库配置
POSTGRES_PASSWORD=orderpass123
DATABASE_URL=postgresql://orderuser:orderpass123@localhost:5432/order_system

# Redis配置
REDIS_URL=redis://redis:6379

# 应用配置
SECRET_KEY=${SECRET_KEY}
ENVIRONMENT=production

# GitHub配置
GITHUB_REPOSITORY=${GITHUB_REPOSITORY}
EOF
    
    log_success "环境文件设置完成"
}

# 登录到GitHub Container Registry
login_to_registry() {
    log_info "登录到GitHub Container Registry..."
    
    echo "${GITHUB_TOKEN}" | docker login ghcr.io -u "${GITHUB_ACTOR}" --password-stdin
    
    log_success "Registry登录成功"
}

# 拉取最新镜像
pull_images() {
    log_info "拉取最新Docker镜像..."
    
    docker pull "ghcr.io/${GITHUB_REPOSITORY}-backend:latest"
    docker pull "ghcr.io/${GITHUB_REPOSITORY}-frontend:latest"
    
    log_success "镜像拉取完成"
}

# 更新docker-compose配置
update_compose_config() {
    log_info "更新docker-compose配置..."
    
    # 复制生产环境配置
    cp .github/workflows/docker-compose.production.yml docker-compose.production.yml
    
    # 替换环境变量
    envsubst < docker-compose.production.yml > docker-compose.yml
    
    log_success "docker-compose配置更新完成"
}

# 部署服务
deploy_services() {
    log_info "部署服务..."
    
    # 停止旧服务
    docker-compose down --remove-orphans || true
    
    # 启动新服务
    docker-compose up -d
    
    log_success "服务部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 30
    
    # 检查后端健康状态
    max_attempts=10
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost/api/health > /dev/null 2>&1; then
            log_success "后端服务健康检查通过"
            break
        else
            log_warning "健康检查失败，重试 $attempt/$max_attempts"
            sleep 10
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "健康检查失败，部署可能有问题"
        return 1
    fi
    
    # 检查前端
    if curl -f http://localhost > /dev/null 2>&1; then
        log_success "前端服务健康检查通过"
    else
        log_warning "前端服务可能未完全启动"
    fi
}

# 清理旧镜像
cleanup_images() {
    log_info "清理旧Docker镜像..."
    
    docker image prune -f
    docker system prune -f --volumes
    
    log_success "镜像清理完成"
}

# 显示部署状态
show_status() {
    log_info "显示服务状态..."
    
    echo "=== Docker容器状态 ==="
    docker ps -a
    
    echo -e "\n=== 服务访问地址 ==="
    echo "前端: http://$(hostname -I | awk '{print $1}')"
    echo "后端API: http://$(hostname -I | awk '{print $1}')/api"
    echo "健康检查: http://$(hostname -I | awk '{print $1}')/api/health"
}

# 主函数
main() {
    log_info "开始GitHub Actions自动化部署..."
    
    # 进入项目目录
    cd /home/www/order_system
    
    # 执行部署步骤
    check_env_vars
    create_directories
    setup_env_file
    login_to_registry
    pull_images
    update_compose_config
    deploy_services
    health_check
    cleanup_images
    show_status
    
    log_success "🎉 GitHub Actions自动化部署完成!"
}

# 错误处理
trap 'log_error "部署过程中发生错误，退出码: $?"' ERR

# 执行主函数
main "$@"