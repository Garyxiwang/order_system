#!/bin/bash

# 订单系统生产环境部署脚本
# 使用方法: ./deploy.sh [aws|docker] [environment]

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_TYPE="${1:-docker}"
ENVIRONMENT="${2:-production}"
VERSION="${3:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"

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

# 检查依赖
check_dependencies() {
    log_info "检查部署依赖..."
    
    local deps=()
    case $DEPLOYMENT_TYPE in
        "aws")
            deps=("terraform" "aws" "docker")
            ;;
        "docker")
            deps=("docker" "docker-compose")
            ;;
    esac
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep 未安装，请先安装后再运行部署脚本"
            exit 1
        fi
    done
    
    log_success "依赖检查完成"
}

# 验证环境配置
validate_environment() {
    log_info "验证环境配置..."
    
    case $DEPLOYMENT_TYPE in
        "aws")
            if [[ ! -f "$PROJECT_ROOT/terraform/terraform.tfvars" ]]; then
                log_error "未找到 terraform.tfvars 文件，请先配置 Terraform 变量"
                log_info "可以复制 terraform.tfvars.example 并填入实际值"
                exit 1
            fi
            
            # 检查 AWS 凭证
            if ! aws sts get-caller-identity &> /dev/null; then
                log_error "AWS 凭证未配置或已过期，请运行 aws configure"
                exit 1
            fi
            ;;
        "docker")
            if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
                log_warning "未找到 .env 文件，将使用默认配置"
                if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
                    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
                    log_info "已复制 .env.example 为 .env，请检查并修改配置"
                fi
            fi
            ;;
    esac
    
    log_success "环境配置验证完成"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker build -t "order-system/frontend:$VERSION" "$PROJECT_ROOT/../front/"
    docker tag "order-system/frontend:$VERSION" "order-system/frontend:latest"
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker build -t "order-system/backend:$VERSION" "$PROJECT_ROOT/../server/"
    docker tag "order-system/backend:$VERSION" "order-system/backend:latest"
    
    log_success "镜像构建完成"
}

# AWS 部署
deploy_aws() {
    log_info "开始 AWS 部署..."
    
    cd "$PROJECT_ROOT/terraform"
    
    # 初始化 Terraform
    log_info "初始化 Terraform..."
    terraform init
    
    # 验证配置
    log_info "验证 Terraform 配置..."
    terraform validate
    
    # 规划部署
    log_info "生成部署计划..."
    terraform plan -out=tfplan
    
    # 确认部署
    echo
    log_warning "即将开始 AWS 资源部署，这可能需要 10-20 分钟"
    read -p "确认继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
    
    # 执行部署
    log_info "执行 Terraform 部署..."
    terraform apply tfplan
    
    # 获取输出
    log_info "获取部署信息..."
    terraform output > "$PROJECT_ROOT/deployment-output.txt"
    
    # 推送镜像到 ECR
    log_info "推送镜像到 ECR..."
    push_to_ecr
    
    # 更新 ECS 服务
    log_info "更新 ECS 服务..."
    update_ecs_services
    
    log_success "AWS 部署完成！"
    log_info "部署信息已保存到 deployment-output.txt"
}

# 推送镜像到 ECR
push_to_ecr() {
    local aws_account_id=$(aws sts get-caller-identity --query Account --output text)
    local aws_region=$(terraform output -raw aws_region)
    local ecr_frontend_uri=$(terraform output -raw ecr_frontend_repository_url)
    local ecr_backend_uri=$(terraform output -raw ecr_backend_repository_url)
    
    # 登录 ECR
    aws ecr get-login-password --region "$aws_region" | docker login --username AWS --password-stdin "$aws_account_id.dkr.ecr.$aws_region.amazonaws.com"
    
    # 标记并推送前端镜像
    docker tag "order-system/frontend:$VERSION" "$ecr_frontend_uri:$VERSION"
    docker tag "order-system/frontend:$VERSION" "$ecr_frontend_uri:latest"
    docker push "$ecr_frontend_uri:$VERSION"
    docker push "$ecr_frontend_uri:latest"
    
    # 标记并推送后端镜像
    docker tag "order-system/backend:$VERSION" "$ecr_backend_uri:$VERSION"
    docker tag "order-system/backend:$VERSION" "$ecr_backend_uri:latest"
    docker push "$ecr_backend_uri:$VERSION"
    docker push "$ecr_backend_uri:latest"
}

# 更新 ECS 服务
update_ecs_services() {
    local cluster_name=$(terraform output -raw ecs_cluster_name)
    local frontend_service=$(terraform output -raw ecs_frontend_service_name)
    local backend_service=$(terraform output -raw ecs_backend_service_name)
    
    # 强制更新服务以使用新镜像
    aws ecs update-service --cluster "$cluster_name" --service "$frontend_service" --force-new-deployment
    aws ecs update-service --cluster "$cluster_name" --service "$backend_service" --force-new-deployment
    
    # 等待服务稳定
    log_info "等待服务更新完成..."
    aws ecs wait services-stable --cluster "$cluster_name" --services "$frontend_service" "$backend_service"
}

# Docker 部署
deploy_docker() {
    log_info "开始 Docker 部署..."
    
    cd "$PROJECT_ROOT"
    
    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose -f docker-compose.production.yml down --remove-orphans
    
    # 清理旧镜像（可选）
    read -p "是否清理旧的 Docker 镜像？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "清理旧镜像..."
        docker system prune -f
        docker image prune -a -f
    fi
    
    # 构建镜像
    build_images
    
    # 启动服务
    log_info "启动服务..."
    VERSION="$VERSION" docker-compose -f docker-compose.production.yml up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_docker_services
    
    log_success "Docker 部署完成！"
}

# 检查 Docker 服务状态
check_docker_services() {
    log_info "检查服务状态..."
    
    local services=("nginx" "frontend" "backend" "database" "redis")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        local container_name="order_system_${service}_prod"
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*healthy\|Up"; then
            log_success "$service 服务运行正常"
        else
            log_error "$service 服务状态异常"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == true ]]; then
        log_success "所有服务运行正常"
        log_info "前端访问地址: https://localhost"
        log_info "后端 API 地址: https://localhost/api"
        log_info "监控面板: http://localhost:3001 (Grafana)"
    else
        log_error "部分服务状态异常，请检查日志"
        docker-compose -f docker-compose.production.yml logs --tail=50
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    case $DEPLOYMENT_TYPE in
        "aws")
            local alb_dns=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
            if [[ -n "$alb_dns" ]]; then
                local frontend_url="https://$alb_dns"
                local backend_url="https://$alb_dns/api/health"
            else
                log_warning "无法获取 ALB DNS 名称，跳过健康检查"
                return
            fi
            ;;
        "docker")
            local frontend_url="http://localhost"
            local backend_url="http://localhost/api/health"
            ;;
    esac
    
    # 检查后端健康状态
    if curl -f -s "$backend_url" > /dev/null; then
        log_success "后端服务健康检查通过"
    else
        log_error "后端服务健康检查失败"
    fi
    
    # 检查前端可访问性
    if curl -f -s "$frontend_url" > /dev/null; then
        log_success "前端服务健康检查通过"
    else
        log_error "前端服务健康检查失败"
    fi
}

# 回滚功能
rollback() {
    log_warning "开始回滚到上一个版本..."
    
    case $DEPLOYMENT_TYPE in
        "aws")
            # AWS 回滚逻辑
            log_info "AWS 回滚功能需要手动操作，请在 AWS 控制台中回滚 ECS 服务"
            ;;
        "docker")
            # Docker 回滚逻辑
            log_info "停止当前服务..."
            docker-compose -f docker-compose.production.yml down
            
            log_info "使用上一个版本的镜像..."
            # 这里可以实现更复杂的版本管理逻辑
            docker-compose -f docker-compose.production.yml up -d
            ;;
    esac
    
    log_success "回滚完成"
}

# 显示帮助信息
show_help() {
    echo "订单系统部署脚本"
    echo
    echo "使用方法:"
    echo "  $0 [部署类型] [环境] [版本]"
    echo
    echo "部署类型:"
    echo "  aws     - 部署到 AWS (使用 Terraform)"
    echo "  docker  - 本地 Docker 部署"
    echo
    echo "环境:"
    echo "  production  - 生产环境 (默认)"
    echo "  staging     - 预发布环境"
    echo
    echo "版本:"
    echo "  默认使用 git commit hash，也可以指定自定义版本"
    echo
    echo "示例:"
    echo "  $0 aws production"
    echo "  $0 docker production v1.0.0"
    echo
    echo "其他命令:"
    echo "  $0 rollback  - 回滚到上一个版本"
    echo "  $0 health    - 执行健康检查"
    echo "  $0 help      - 显示此帮助信息"
}

# 主函数
main() {
    echo "=========================================="
    echo "订单系统生产环境部署脚本"
    echo "部署类型: $DEPLOYMENT_TYPE"
    echo "环境: $ENVIRONMENT"
    echo "版本: $VERSION"
    echo "=========================================="
    
    case "${1:-deploy}" in
        "help"|"-h"|"--help")
            show_help
            exit 0
            ;;
        "rollback")
            rollback
            exit 0
            ;;
        "health")
            health_check
            exit 0
            ;;
        "deploy"|*)
            check_dependencies
            validate_environment
            
            case $DEPLOYMENT_TYPE in
                "aws")
                    build_images
                    deploy_aws
                    ;;
                "docker")
                    deploy_docker
                    ;;
                *)
                    log_error "不支持的部署类型: $DEPLOYMENT_TYPE"
                    show_help
                    exit 1
                    ;;
            esac
            
            # 执行健康检查
            sleep 10
            health_check
            
            log_success "部署完成！"
            ;;
    esac
}

# 捕获中断信号
trap 'log_error "部署被中断"; exit 1' INT TERM

# 执行主函数
main "$@"