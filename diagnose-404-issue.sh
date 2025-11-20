#!/bin/bash

# 诊断前端资源404问题的脚本
# 检查可能导致文件丢失的原因

echo "=========================================="
echo "前端资源404问题诊断脚本"
echo "=========================================="
echo ""

# 检查前端容器
FRONTEND_CONTAINER=""
if docker ps | grep -q "order_system_frontend"; then
    FRONTEND_CONTAINER=$(docker ps | grep "order_system_frontend" | awk '{print $1}')
    echo "✓ 找到前端容器: $FRONTEND_CONTAINER"
elif docker ps | grep -q "order_system_frontend_prod"; then
    FRONTEND_CONTAINER=$(docker ps | grep "order_system_frontend_prod" | awk '{print $1}')
    echo "✓ 找到生产环境前端容器: $FRONTEND_CONTAINER"
else
    echo "✗ 未找到运行中的前端容器"
    exit 1
fi

echo ""
echo "=========================================="
echo "1. 检查容器重启历史"
echo "=========================================="
echo "容器启动时间:"
docker inspect $FRONTEND_CONTAINER --format='{{.State.StartedAt}}' 2>/dev/null
echo ""
echo "容器重启次数:"
docker inspect $FRONTEND_CONTAINER --format='{{.RestartCount}}' 2>/dev/null
echo ""
echo "容器状态:"
docker inspect $FRONTEND_CONTAINER --format='{{.State.Status}}' 2>/dev/null
echo ""

echo "=========================================="
echo "2. 检查容器内文件是否存在"
echo "=========================================="
echo "检查 .next 目录:"
if docker exec $FRONTEND_CONTAINER test -d /app/.next 2>/dev/null; then
    echo "  ✓ .next 目录存在"
    echo "  目录大小:"
    docker exec $FRONTEND_CONTAINER du -sh /app/.next 2>/dev/null || echo "  无法获取大小"
else
    echo "  ✗ .next 目录不存在！"
fi
echo ""

echo "检查 .next/static 目录:"
if docker exec $FRONTEND_CONTAINER test -d /app/.next/static 2>/dev/null; then
    echo "  ✓ .next/static 目录存在"
else
    echo "  ✗ .next/static 目录不存在！"
fi
echo ""

echo "检查 .next/static/chunks 目录:"
if docker exec $FRONTEND_CONTAINER test -d /app/.next/static/chunks 2>/dev/null; then
    echo "  ✓ .next/static/chunks 目录存在"
    echo "  chunk 文件数量:"
    docker exec $FRONTEND_CONTAINER find /app/.next/static/chunks -type f 2>/dev/null | wc -l || echo "  无法统计"
    echo "  示例文件列表（前10个）:"
    docker exec $FRONTEND_CONTAINER ls -la /app/.next/static/chunks 2>/dev/null | head -12 || echo "  无法列出文件"
else
    echo "  ✗ .next/static/chunks 目录不存在！"
fi
echo ""

echo "=========================================="
echo "3. 检查镜像信息"
echo "=========================================="
IMAGE_ID=$(docker inspect $FRONTEND_CONTAINER --format='{{.Image}}' 2>/dev/null)
echo "容器使用的镜像: $IMAGE_ID"
echo ""
echo "镜像创建时间:"
docker inspect $IMAGE_ID --format='{{.Created}}' 2>/dev/null
echo ""
echo "镜像标签:"
docker inspect $IMAGE_ID --format='{{range .RepoTags}}{{.}}{{println}}{{end}}' 2>/dev/null
echo ""

echo "=========================================="
echo "4. 检查磁盘空间"
echo "=========================================="
echo "系统磁盘使用:"
df -h | grep -E "^/dev|Filesystem" | head -5
echo ""
echo "Docker 磁盘使用:"
docker system df 2>/dev/null || echo "无法获取Docker磁盘使用情况"
echo ""

echo "=========================================="
echo "5. 检查容器日志（最近50行）"
echo "=========================================="
echo "查找错误或警告:"
docker logs $FRONTEND_CONTAINER --tail 50 2>&1 | grep -iE "error|warn|fail|404|chunk|missing" || echo "  未发现明显错误"
echo ""

echo "=========================================="
echo "6. 检查是否有定时任务"
echo "=========================================="
echo "检查 crontab:"
if crontab -l 2>/dev/null | grep -q "order_system\|cleanup\|prune"; then
    echo "  ⚠ 发现可能相关的定时任务:"
    crontab -l 2>/dev/null | grep -E "order_system|cleanup|prune"
else
    echo "  ✓ 未发现相关定时任务"
fi
echo ""

echo "检查 root 用户的 crontab:"
if sudo crontab -l 2>/dev/null | grep -q "order_system\|cleanup\|prune"; then
    echo "  ⚠ 发现可能相关的定时任务:"
    sudo crontab -l 2>/dev/null | grep -E "order_system|cleanup|prune"
else
    echo "  ✓ 未发现相关定时任务"
fi
echo ""

echo "检查系统定时任务:"
if [ -d /etc/cron.d ] && ls /etc/cron.d/* 2>/dev/null | xargs grep -l "order_system\|cleanup\|prune" 2>/dev/null; then
    echo "  ⚠ 发现可能相关的系统定时任务"
    ls /etc/cron.d/* 2>/dev/null | xargs grep -l "order_system\|cleanup\|prune" 2>/dev/null | xargs cat
else
    echo "  ✓ 未发现相关系统定时任务"
fi
echo ""

echo "=========================================="
echo "7. 检查 Docker 事件（最近1小时）"
echo "=========================================="
echo "查找容器重启、停止等事件:"
docker events --since 1h --until now --filter "container=$FRONTEND_CONTAINER" 2>/dev/null | head -20 || echo "  无法获取事件（可能需要权限）"
echo ""

echo "=========================================="
echo "8. 检查镜像构建历史"
echo "=========================================="
echo "最近构建的镜像:"
docker images order-system/frontend --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedSince}}\t{{.Size}}" 2>/dev/null | head -5
echo ""

echo "=========================================="
echo "诊断完成"
echo "=========================================="
echo ""
echo "可能的原因分析:"
echo "1. 如果 .next/static/chunks 目录不存在或为空："
echo "   - 镜像构建不完整"
echo "   - 需要重新构建前端镜像"
echo ""
echo "2. 如果容器重启次数较多："
echo "   - 可能是容器崩溃导致重启"
echo "   - 检查容器日志查找崩溃原因"
echo ""
echo "3. 如果磁盘空间不足："
echo "   - 可能导致构建失败或文件丢失"
echo "   - 需要清理磁盘空间"
echo ""
echo "4. 如果有定时清理任务："
echo "   - 可能清理了镜像或容器"
echo "   - 需要检查清理脚本的配置"
echo ""
echo "建议的修复步骤:"
echo "1. 如果文件缺失，重新构建前端镜像:"
echo "   cd front && docker build --no-cache -t order-system/frontend:latest -f Dockerfile ."
echo ""
echo "2. 重启前端容器:"
echo "   docker restart $FRONTEND_CONTAINER"
echo ""
echo "3. 检查并清理磁盘空间（如果需要）:"
echo "   ./cleanup-docker.sh --dry-run"

