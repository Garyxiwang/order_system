#!/bin/bash

# Docker 镜像和磁盘清理脚本
# 使用方法: ./cleanup-docker.sh [--dry-run] [--aggressive]

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

# 参数解析
DRY_RUN=false
AGGRESSIVE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
            shift ;;
        --aggressive)
            AGGRESSIVE=true
            shift ;;
        *)
            log_error "未知选项: $1"
            echo "使用方法: $0 [--dry-run] [--aggressive]"
            exit 1 ;;
    esac
done

# 显示当前磁盘使用情况
show_disk_usage() {
    log_info "=== 磁盘使用情况 ==="
    echo
    log_info "Docker 磁盘使用："
    docker system df
    echo
    log_info "系统磁盘使用："
    df -h | grep -E "^/dev|Filesystem"
    echo
}

# 显示当前镜像列表
show_images() {
    log_info "=== 当前镜像列表 ==="
    docker images -a --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}\t{{.Size}}"
    echo
}

# 清理 dangling 镜像（未标记的镜像）
cleanup_dangling_images() {
    log_info "=== 清理未标记的镜像 (dangling images) ==="
    
    local dangling_images=$(docker images -f "dangling=true" -q)
    
    if [ -z "$dangling_images" ]; then
        log_info "没有找到未标记的镜像"
        return 0
    fi
    
    log_info "找到以下未标记的镜像："
    docker images -f "dangling=true"
    echo
    
    if $DRY_RUN; then
        log_warning "[DRY RUN] 将删除以下镜像："
        docker images -f "dangling=true" --format "  - {{.ID}}: {{.Size}}"
    else
        local size_before=$(docker system df | grep "Images" | awk '{print $3}')
        docker image prune -f
        local size_after=$(docker system df | grep "Images" | awk '{print $3}')
        log_success "已清理未标记的镜像"
        log_info "释放空间: $size_before -> $size_after"
    fi
    echo
}

# 清理未使用的镜像
cleanup_unused_images() {
    log_info "=== 清理未使用的镜像 ==="
    
    if $DRY_RUN; then
        log_warning "[DRY RUN] 将清理未使用的镜像（不包括正在使用的镜像）"
        docker image prune -a --dry-run
    else
        log_warning "这将删除所有未使用的镜像（不包括正在运行的容器使用的镜像）"
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "已取消"
            return 0
        fi
        
        local size_before=$(docker system df | grep "Images" | awk '{print $3}')
        docker image prune -a -f
        local size_after=$(docker system df | grep "Images" | awk '{print $3}')
        log_success "已清理未使用的镜像"
        log_info "释放空间: $size_before -> $size_after"
    fi
    echo
}

# 清理未使用的容器
cleanup_unused_containers() {
    log_info "=== 清理未使用的容器 ==="
    
    if $DRY_RUN; then
        log_warning "[DRY RUN] 将清理已停止的容器"
        docker container prune --dry-run
    else
        local size_before=$(docker system df | grep "Containers" | awk '{print $3}')
        docker container prune -f
        local size_after=$(docker system df | grep "Containers" | awk '{print $3}')
        log_success "已清理未使用的容器"
        log_info "释放空间: $size_before -> $size_after"
    fi
    echo
}

# 清理未使用的卷
cleanup_unused_volumes() {
    log_info "=== 清理未使用的卷 ==="
    
    if $DRY_RUN; then
        log_warning "[DRY RUN] 将清理未使用的卷"
        docker volume prune --dry-run
    else
        log_warning "这将删除所有未使用的卷"
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "已取消"
            return 0
        fi
        
        local size_before=$(docker system df | grep "Local Volumes" | awk '{print $4}')
        docker volume prune -f
        local size_after=$(docker system df | grep "Local Volumes" | awk '{print $4}')
        log_success "已清理未使用的卷"
        log_info "释放空间: $size_before -> $size_after"
    fi
    echo
}

# 清理构建缓存
cleanup_build_cache() {
    log_info "=== 清理构建缓存 ==="
    
    if $DRY_RUN; then
        log_warning "[DRY RUN] 将清理构建缓存"
        docker builder prune --dry-run
    else
        log_warning "这将清理所有构建缓存"
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "已取消"
            return 0
        fi
        
        local size_before=$(docker system df | grep "Build Cache" | awk '{print $3}')
        docker builder prune -a -f
        local size_after=$(docker system df | grep "Build Cache" | awk '{print $4}' || echo "0B")
        log_success "已清理构建缓存"
        log_info "释放空间: $size_before -> $size_after"
    fi
    echo
}

# 清理所有未使用的资源（保守模式）
cleanup_all_conservative() {
    log_info "=== 清理所有未使用的资源（保守模式）==="
    
    if $DRY_RUN; then
        log_warning "[DRY RUN] 将清理所有未使用的资源"
        docker system prune --dry-run
    else
        log_warning "这将清理所有未使用的资源（不包括镜像）"
        read -p "确认继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "已取消"
            return 0
        fi
        
        local size_before=$(docker system df | grep "Total" | awk '{print $3}')
        docker system prune -f
        local size_after=$(docker system df | grep "Total" | awk '{print $3}')
        log_success "已清理未使用的资源"
        log_info "释放空间: $size_before -> $size_after"
    fi
    echo
}

# 显示正在使用的镜像
show_used_images() {
    log_info "=== 正在使用的镜像（不会被清理）==="
    
    # 获取正在运行的容器使用的镜像
    local used_images=$(docker ps --format "{{.Image}}" | sort -u)
    
    if [ -z "$used_images" ]; then
        log_info "没有正在运行的容器"
    else
        log_info "以下镜像正在被使用，不会被清理："
        for img in $used_images; do
            docker images "$img" --format "  - {{.Repository}}:{{.Tag}} ({{.ID}})"
        done
    fi
    echo
}

# 主函数
main() {
    echo "=========================================="
    echo "Docker 镜像和磁盘清理工具"
    echo "=========================================="
    echo
    
    if $DRY_RUN; then
        log_warning "运行模式: DRY RUN（仅预览，不会实际删除）"
    fi
    echo
    
    # 显示当前状态
    show_disk_usage
    show_images
    show_used_images
    
    # 清理步骤
    cleanup_dangling_images
    
    if $AGGRESSIVE; then
        cleanup_unused_images
    fi
    
    cleanup_unused_containers
    cleanup_unused_volumes
    cleanup_build_cache
    
    if $AGGRESSIVE; then
        cleanup_all_conservative
    fi
    
    # 显示清理后的状态
    echo
    log_info "=== 清理后的状态 ==="
    show_disk_usage
    show_images
    
    log_success "清理完成！"
    echo
    log_info "提示："
    log_info "  - 使用 --dry-run 查看将要清理的内容"
    log_info "  - 使用 --aggressive 进行更激进的清理（包括未使用的镜像）"
    log_info "  - 定期运行此脚本可以保持磁盘空间充足"
}

# 捕获中断信号
trap 'log_error "操作被中断"; exit 1' INT TERM

# 执行主函数
main "$@"

