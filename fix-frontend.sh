#!/bin/bash

# 修复 Next.js ChunkLoadError 的快速修复脚本
# 使用方法: ./fix-frontend.sh

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

log_info "开始修复前端 ChunkLoadError 问题..."

# 检查磁盘空间
check_disk_space() {
    log_info "检查磁盘空间..."
    local available=$(df -h . | tail -1 | awk '{print $4}')
    log_info "可用磁盘空间: $available"
    
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

# 停止前端容器（可选，docker compose up 会自动处理）
stop_frontend() {
    log_info "停止现有前端容器..."
    docker compose stop frontend || true
}

# 重新构建前端（使用 --no-cache 确保完整构建）
rebuild_frontend() {
    log_info "重新构建前端镜像（使用 --no-cache）..."
    log_info "这可能需要几分钟时间..."
    
    if docker compose build --no-cache frontend; then
        log_success "前端镜像构建完成"
    else
        log_error "前端镜像构建失败，请检查构建日志"
        exit 1
    fi
}

# 验证构建结果
verify_build() {
    log_info "验证构建结果..."
    
    # Docker Compose 使用 build 时，镜像名格式为：目录名-服务名
    # 获取当前目录名（去掉路径，只保留目录名）
    local project_dir=$(basename $(pwd))
    # 将目录名转换为小写，并替换特殊字符为下划线
    local project_name=$(echo "$project_dir" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    local image_name="${project_name}-frontend"
    
    log_info "检查镜像: $image_name"
    
    # 检查镜像是否存在
    if ! docker image inspect "$image_name" >/dev/null 2>&1; then
        log_warning "镜像不存在，可能使用不同的命名规则，跳过验证"
        log_info "尝试查找所有前端相关镜像..."
        docker images | grep -E "(frontend|order)" || true
        return 0  # 不阻止部署
    fi
    
    # 临时运行容器检查 .next 目录
    log_info "验证镜像内容..."
    local temp_container=$(docker create "$image_name" 2>/dev/null || echo "")
    
    if [ -n "$temp_container" ]; then
        # 检查 .next/static/chunks 目录
        if docker exec "$temp_container" ls -la /app/.next/static/chunks >/dev/null 2>&1; then
            local chunk_count=$(docker exec "$temp_container" find /app/.next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
            log_success "镜像验证通过，找到 $chunk_count 个 chunk 文件"
            
            if [ "$chunk_count" -lt 10 ]; then
                log_warning "chunk 文件数量较少，可能构建不完整"
            fi
        else
            log_warning "镜像中可能缺少 .next/static/chunks 目录，但继续部署..."
            log_info "注意：如果部署后仍有问题，请检查容器内的文件"
        fi
        
        docker rm "$temp_container" >/dev/null 2>&1 || true
    else
        log_warning "无法验证镜像，但继续部署..."
    fi
}

# 重新部署前端并重启 nginx
redeploy() {
    log_info "重新部署前端服务并重启 Nginx..."
    
    if docker compose up -d frontend && docker compose restart nginx; then
        log_success "前端服务和 Nginx 已重启"
    else
        log_error "部署失败，请检查日志"
        exit 1
    fi
}

# 等待服务就绪
wait_for_service() {
    log_info "等待前端服务就绪..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        # 检查容器状态
        if docker compose ps frontend | grep -q "Up"; then
            # 检查服务是否响应
            if docker compose exec -T frontend curl -f http://localhost:3000/ >/dev/null 2>&1 || \
               curl -f http://localhost:3000/ >/dev/null 2>&1; then
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
show_logs() {
    log_info "查看前端服务日志（最近 50 行）..."
    docker compose logs --tail=50 frontend
}

# 主函数
main() {
    echo "=========================================="
    echo "修复 Next.js ChunkLoadError"
    echo "=========================================="
    
    check_disk_space
    stop_frontend
    rebuild_frontend
    verify_build
    
    if [ $? -ne 0 ]; then
        log_warning "镜像验证失败，但继续部署..."
    fi
    
    redeploy
    wait_for_service
    
    echo ""
    log_success "修复完成！"
    echo ""
    log_info "请访问网站检查是否还有 ChunkLoadError"
    log_info "如果问题仍然存在，请："
    log_info "  1. 清除浏览器缓存或使用无痕模式"
    log_info "  2. 检查容器日志: docker compose logs frontend"
    log_info "  3. 检查 Nginx 日志: docker compose logs nginx"
    echo ""
    log_info "查看完整日志:"
    show_logs
}

# 捕获中断信号
trap 'log_error "操作被中断"; exit 1' INT TERM

# 执行主函数
main "$@"

