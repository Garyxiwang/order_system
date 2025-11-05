#!/bin/bash

# 验证运行中的容器是否有 .next/static/chunks 目录
# 使用方法: ./verify-container.sh

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log_info "验证运行中的前端容器..."

# 检查容器是否运行
if ! docker compose ps frontend | grep -q "Up"; then
    log_error "前端容器未运行"
    exit 1
fi

log_success "前端容器正在运行"

# 检查容器内的 .next 目录
log_info "检查容器内的 .next 目录结构..."

# 检查 .next 目录
if docker compose exec -T frontend test -d /app/.next; then
    log_success ".next 目录存在"
else
    log_error ".next 目录不存在"
    exit 1
fi

# 检查 .next/static 目录
if docker compose exec -T frontend test -d /app/.next/static; then
    log_success ".next/static 目录存在"
else
    log_error ".next/static 目录不存在"
    exit 1
fi

# 检查 .next/static/chunks 目录
if docker compose exec -T frontend test -d /app/.next/static/chunks; then
    log_success ".next/static/chunks 目录存在"
    
    # 列出 chunk 文件
    log_info "列出 chunk 文件（前 20 个）："
    docker compose exec -T frontend ls -la /app/.next/static/chunks | head -20
    
    # 统计 chunk 文件数量
    chunk_count=$(docker compose exec -T frontend find /app/.next/static/chunks -name "*.js" 2>/dev/null | wc -l || echo "0")
    log_info "找到 $chunk_count 个 chunk 文件"
    
    if [ "$chunk_count" -lt 10 ]; then
        log_warning "chunk 文件数量较少，可能构建不完整"
    else
        log_success "chunk 文件数量正常"
    fi
else
    log_error ".next/static/chunks 目录不存在！"
    log_info "这可能是导致 ChunkLoadError 的原因"
    exit 1
fi

# 检查 .next/server 目录
if docker compose exec -T frontend test -d /app/.next/server; then
    log_success ".next/server 目录存在"
else
    log_warning ".next/server 目录不存在（可能不影响运行）"
fi

# 检查文件权限
log_info "检查文件权限..."
docker compose exec -T frontend ls -ld /app/.next /app/.next/static /app/.next/static/chunks 2>/dev/null || true

log_success "容器验证完成！"
log_info "如果网站可以正常访问，说明文件存在且可以访问"

