#!/bin/bash

# 查找 Linux 系统上的大文件
# 使用方法: ./find-large-files.sh [size] [directory]

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

# 参数
SIZE="${1:-100M}"  # 默认查找大于 100M 的文件
DIR="${2:-.}"      # 默认当前目录

echo "=========================================="
echo "查找大于 ${SIZE} 的文件 (在 ${DIR} 目录下)"
echo "=========================================="
echo

# 方法 1: 使用 find + du（推荐，显示可读大小）
log_info "方法 1: 查找大于 ${SIZE} 的文件（按大小排序）"
find "$DIR" -type f -size +"$SIZE" -print0 | xargs -0 du -h | sort -rh | head -20
echo

# 方法 2: 只显示文件路径和大小（更快）
log_info "方法 2: 查找大于 ${SIZE} 的文件（仅显示路径）"
find "$DIR" -type f -size +"$SIZE" -exec ls -lh {} \; | awk '{print $5, $9}' | sort -hr | head -20
echo

# 方法 3: 查找大目录（按目录总大小排序）
log_info "方法 3: 查找大目录（按总大小排序，前 20 个）"
du -h --max-depth=1 "$DIR" 2>/dev/null | sort -rh | head -20
echo

# 方法 4: 查找 Docker 相关的大文件
log_info "方法 4: 查找 Docker 相关的大文件"
if [ -d /var/lib/docker ]; then
    echo "Docker 数据目录:"
    du -sh /var/lib/docker/* 2>/dev/null | sort -rh | head -10
fi
echo

# 方法 5: 查找日志文件
log_info "方法 5: 查找大日志文件（大于 50M）"
find "$DIR" -type f \( -name "*.log" -o -name "*.log.*" \) -size +50M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -10
echo

# 方法 6: 查找常见的大文件类型
log_info "方法 6: 查找常见的大文件（.tar, .gz, .zip, .sql, .dump）"
find "$DIR" -type f \( -name "*.tar" -o -name "*.tar.gz" -o -name "*.gz" -o -name "*.zip" -o -name "*.sql" -o -name "*.dump" \) -size +50M -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}' | sort -hr | head -10
echo

log_success "查找完成！"

