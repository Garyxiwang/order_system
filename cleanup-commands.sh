#!/bin/bash

# 快速清理命令（按顺序执行）

echo "=== 1. 清理未标记的镜像（约释放 2.6GB）==="
docker image prune -f

echo ""
echo "=== 2. 清理未使用的容器 ==="
docker container prune -f

echo ""
echo "=== 3. 清理构建缓存 ==="
docker builder prune -a -f

echo ""
echo "=== 4. 清理其他未使用的资源 ==="
docker system prune -f

echo ""
echo "=== 清理完成！查看磁盘使用情况 ==="
docker system df

