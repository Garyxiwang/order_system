#!/bin/bash

# 修复 Next.js ChunkLoadError 的脚本
# 这个问题通常是因为：
# 1. 构建不完整，部分 chunk 文件缺失
# 2. 容器重启时镜像不完整
# 3. 磁盘空间不足导致构建失败
#
# 使用方法: ./cloud-deployment/scripts/fix-chunk-error.sh

set -euo pipefail

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

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONT_DIR="$PROJECT_ROOT/../front"
VERSION="${1:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"

log_info "开始修复 ChunkLoadError 问题..."
log_info "项目根目录: $PROJECT_ROOT"
log_info "前端目录: $FRONT_DIR"
log_info "版本: $VERSION"

# 检查磁盘空间
check_disk_space() {
    log_info "检查磁盘空间..."
    local available=$(df -h . | tail -1 | awk '{print $4}')
    log_info "可用磁盘空间: $available"
    
    # 检查是否有足够的空间（至少需要 2GB）
    local available_kb=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_kb" -lt 2097152 ]; then
        log_warning "磁盘空间可能不足（可用: ${available}），建议清理后再构建"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "已取消"
            exit 0
        fi
    fi
}

# 停止前端容器
stop_frontend() {
    log_info "停止现有前端容器..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" stop frontend || true
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" rm -f frontend || true
}

# 清理旧镜像
cleanup_old_images() {
    log_info "清理旧的前端镜像..."
    # 只清理 dangling 镜像，保留有标签的镜像
    docker image prune -f || true
}

# 重新构建前端镜像
rebuild_frontend() {
    log_info "重新构建前端镜像..."
    
    cd "$FRONT_DIR"
    
    # 清理本地构建缓存（可选）
    if [ -d ".next" ]; then
        log_info "清理本地 .next 目录..."
        rm -rf .next
    fi
    
    # 构建新镜像
    log_info "构建 Docker 镜像: order-system/frontend:$VERSION"
    docker build \
        --no-cache \
        -t "order-system/frontend:$VERSION" \
        -t "order-system/frontend:latest" \
        -f Dockerfile \
        .
    
    log_success "前端镜像构建完成"
}

# 验证镜像
verify_image() {
    log_info "验证镜像内容..."
    
    # 检查镜像是否存在
    if ! docker image inspect "order-system/frontend:$VERSION" >/dev/null 2>&1; then
        log_error "镜像不存在: order-system/frontend:$VERSION"
        return 1
    fi
    
    # 临时运行容器检查 .next 目录
    log_info "检查镜像中的 .next 目录..."
    local temp_container=$(docker create "order-system/frontend:$VERSION")
    
    # 检查 .next/static/chunks 目录是否存在
    if docker exec "$temp_container" ls -la /app/.next/static/chunks >/dev/null 2>&1; then
        log_success "镜像中包含 .next/static/chunks 目录"
        
        # 列出 chunk 文件数量
        local chunk_count=$(docker exec "$temp_container" find /app/.next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
        log_info "找到 $chunk_count 个 chunk 文件"
        
        if [ "$chunk_count" -lt 10 ]; then
            log_warning "chunk 文件数量较少，可能构建不完整"
        fi
    else
        log_error "镜像中缺少 .next/static/chunks 目录！"
        docker rm "$temp_container" >/dev/null 2>&1 || true
        return 1
    fi
    
    docker rm "$temp_container" >/dev/null 2>&1 || true
    log_success "镜像验证通过"
}

# 重新部署前端
redeploy_frontend() {
    log_info "重新部署前端服务..."
    
    cd "$PROJECT_ROOT"
    
    # 更新环境变量
    export VERSION="$VERSION"
    
    # 启动服务
    docker-compose -f docker-compose.production.yml up -d frontend
    
    log_success "前端服务已启动"
}

# 等待服务就绪
wait_for_service() {
    log_info "等待前端服务就绪..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" ps frontend | grep -q "Up"; then
            # 检查健康状态
            if docker exec order_system_frontend_prod curl -f http://localhost:3000/ >/dev/null 2>&1; then
                log_success "前端服务已就绪"
                return 0
            fi
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    log_warning "前端服务启动超时，请检查日志"
    return 1
}

# 检查服务日志
check_logs() {
    log_info "检查前端服务日志..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.production.yml" logs --tail=50 frontend
}

# 主函数
main() {
    echo "=========================================="
    echo "修复 Next.js ChunkLoadError"
    echo "=========================================="
    
    check_disk_space
    stop_frontend
    cleanup_old_images
    rebuild_frontend
    verify_image
    
    if [ $? -ne 0 ]; then
        log_error "镜像验证失败，请检查构建日志"
        exit 1
    fi
    
    redeploy_frontend
    wait_for_service
    check_logs
    
    log_success "修复完成！"
    log_info "请访问网站检查是否还有 ChunkLoadError"
    log_info "如果问题仍然存在，请检查："
    log_info "  1. Nginx 配置是否正确代理静态文件"
    log_info "  2. 容器日志是否有其他错误"
    log_info "  3. 服务器磁盘空间是否充足"
}

# 捕获中断信号
trap 'log_error "操作被中断"; exit 1' INT TERM

# 执行主函数
main "$@"

