#!/bin/bash

# 验证 Nginx 配置文件脚本
# 用于确认服务上实际使用的 nginx 配置文件

echo "=========================================="
echo "Nginx 配置验证脚本"
echo "=========================================="
echo ""

# 检查 nginx 容器是否运行
NGINX_CONTAINER=""
if docker ps | grep -q "order_system_nginx"; then
    NGINX_CONTAINER=$(docker ps | grep "order_system_nginx" | awk '{print $1}')
    echo "✓ 找到本地开发环境 nginx 容器: $NGINX_CONTAINER"
elif docker ps | grep -q "order_system_nginx_prod"; then
    NGINX_CONTAINER=$(docker ps | grep "order_system_nginx_prod" | awk '{print $1}')
    echo "✓ 找到生产环境 nginx 容器: $NGINX_CONTAINER"
else
    echo "✗ 未找到运行中的 nginx 容器"
    echo ""
    echo "请检查容器是否运行:"
    echo "  docker ps | grep nginx"
    exit 1
fi

echo ""
echo "=========================================="
echo "1. 检查容器挂载的配置文件"
echo "=========================================="
docker inspect $NGINX_CONTAINER | grep -A 10 "Mounts" | grep -E "Source|Destination" | head -10
echo ""

echo "=========================================="
echo "2. 检查容器内实际使用的配置文件"
echo "=========================================="
echo "主配置文件位置:"
docker exec $NGINX_CONTAINER nginx -T 2>/dev/null | grep -E "configuration file|# configuration file" | head -3
echo ""

echo "=========================================="
echo "3. 检查容器内的配置文件内容（关键部分）"
echo "=========================================="
echo "检查 /_next/ 配置:"
docker exec $NGINX_CONTAINER cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -A 10 "location /_next/" || \
docker exec $NGINX_CONTAINER cat /etc/nginx/nginx.conf 2>/dev/null | grep -A 10 "location /_next/" || \
echo "  ⚠ 未找到 /_next/ 配置"
echo ""

echo "检查静态资源代理地址:"
docker exec $NGINX_CONTAINER cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -E "proxy_pass.*frontend|proxy_pass.*order1" | head -5 || \
docker exec $NGINX_CONTAINER cat /etc/nginx/nginx.conf 2>/dev/null | grep -E "proxy_pass.*frontend|proxy_pass.*order1" | head -5 || \
echo "  ⚠ 未找到相关配置"
echo ""

echo "=========================================="
echo "4. 测试配置文件语法"
echo "=========================================="
if docker exec $NGINX_CONTAINER nginx -t 2>&1; then
    echo "✓ Nginx 配置语法正确"
else
    echo "✗ Nginx 配置语法有误"
fi
echo ""

echo "=========================================="
echo "5. 检查本地配置文件与容器内配置的差异"
echo "=========================================="
echo "本地 nginx.conf 的 /_next/ 配置:"
if [ -f "./nginx.conf" ]; then
    grep -A 10 "location /_next/" ./nginx.conf 2>/dev/null || echo "  ⚠ 本地 nginx.conf 中未找到 /_next/ 配置"
else
    echo "  ⚠ 本地 nginx.conf 文件不存在"
fi
echo ""

echo "生产环境 nginx.conf 的 /_next/ 配置:"
if [ -f "./cloud-deployment/nginx/nginx.conf" ]; then
    grep -A 10 "location /_next/" ./cloud-deployment/nginx/nginx.conf 2>/dev/null || echo "  ⚠ 生产环境 nginx.conf 中未找到 /_next/ 配置"
else
    echo "  ⚠ 生产环境 nginx.conf 文件不存在"
fi
echo ""

echo "=========================================="
echo "6. 检查静态资源代理地址"
echo "=========================================="
echo "本地 nginx.conf 中的静态资源代理:"
if [ -f "./nginx.conf" ]; then
    grep "proxy_pass" ./nginx.conf | grep -E "frontend|order1" | head -3
fi
echo ""

echo "=========================================="
echo "验证完成"
echo "=========================================="
echo ""
echo "提示："
echo "1. 如果容器内没有 /_next/ 配置，需要重启 nginx 容器以加载新配置"
echo "2. 如果静态资源代理指向 order1.zeabur.app，说明使用的是旧配置"
echo "3. 如果静态资源代理指向 frontend:3000，说明使用的是新配置"
echo ""
echo "重启 nginx 容器命令:"
echo "  docker-compose restart nginx"
echo "  或"
echo "  docker restart $NGINX_CONTAINER"

