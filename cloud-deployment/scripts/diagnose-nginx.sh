#!/bin/bash

# Nginx容器诊断脚本
# 用于诊断nginx容器无法启动的问题

set -e

echo "=========================================="
echo "Nginx容器诊断脚本"
echo "=========================================="
echo ""

# 检测部署目录
if [ -f "docker-compose.yml" ]; then
    DEPLOY_DIR="$(pwd)"
elif [ -f "/root/order_system/docker-compose.yml" ]; then
    DEPLOY_DIR="/root/order_system"
elif [ -f "/home/www/order_system/docker-compose.yml" ]; then
    DEPLOY_DIR="/home/www/order_system"
else
    echo "错误: 无法找到docker-compose.yml文件"
    exit 1
fi

cd "$DEPLOY_DIR"

echo "1. 检查nginx容器状态..."
echo "----------------------------------------"
docker ps -a | grep nginx || echo "未找到nginx容器"
echo ""

echo "2. 检查nginx容器日志（最后50行）..."
echo "----------------------------------------"
NGINX_CONTAINER=$(docker ps -a --format '{{.Names}}' | grep nginx | head -1)
if [ -n "$NGINX_CONTAINER" ]; then
    echo "容器名: $NGINX_CONTAINER"
    docker logs --tail 50 "$NGINX_CONTAINER" 2>&1 || echo "无法获取日志"
else
    echo "未找到nginx容器"
fi
echo ""

echo "3. 检查nginx配置文件..."
echo "----------------------------------------"
NGINX_CONF="$DEPLOY_DIR/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
    echo "配置文件: $NGINX_CONF"
    echo "文件大小: $(wc -l < "$NGINX_CONF") 行"
    echo ""
    echo "前20行内容:"
    head -20 "$NGINX_CONF"
    echo ""
    echo "检查是否包含主配置指令（不应该有）:"
    if grep -q "^[[:space:]]*user[[:space:]]" "$NGINX_CONF"; then
        echo "  ✗ 发现 'user' 指令（不应该在conf.d配置中）"
    else
        echo "  ✓ 没有 'user' 指令"
    fi
    if grep -q "^[[:space:]]*events[[:space:]]*{" "$NGINX_CONF"; then
        echo "  ✗ 发现 'events' 块（不应该在conf.d配置中）"
    else
        echo "  ✓ 没有 'events' 块"
    fi
    if grep -q "^[[:space:]]*http[[:space:]]*{" "$NGINX_CONF"; then
        echo "  ✗ 发现 'http' 块（不应该在conf.d配置中）"
    else
        echo "  ✓ 没有 'http' 块"
    fi
    echo ""
    echo "检查SSL证书路径:"
    if grep -q "ssl_certificate" "$NGINX_CONF"; then
        grep "ssl_certificate" "$NGINX_CONF" | head -2
    else
        echo "  ⚠ 未找到SSL证书配置"
    fi
else
    echo "✗ 找不到nginx.conf文件: $NGINX_CONF"
fi
echo ""

echo "4. 检查SSL证书文件..."
echo "----------------------------------------"
SSL_DIR="$DEPLOY_DIR/ssl"
if [ -d "$SSL_DIR" ]; then
    echo "SSL目录: $SSL_DIR"
    ls -la "$SSL_DIR/" 2>/dev/null || echo "目录为空或无法访问"
else
    echo "✗ SSL目录不存在: $SSL_DIR"
fi
echo ""

echo "5. 检查docker-compose.yml配置..."
echo "----------------------------------------"
if [ -f "docker-compose.yml" ]; then
    echo "nginx服务配置:"
    grep -A 15 "nginx:" docker-compose.yml | head -20
else
    echo "✗ 找不到docker-compose.yml"
fi
echo ""

echo "6. 尝试手动测试nginx配置..."
echo "----------------------------------------"
if [ -n "$NGINX_CONTAINER" ]; then
    # 尝试启动容器并测试配置
    echo "尝试启动容器并测试配置..."
    docker start "$NGINX_CONTAINER" 2>&1 || true
    sleep 2
    if docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
        echo "容器已启动，测试配置..."
        docker exec "$NGINX_CONTAINER" nginx -t 2>&1 || echo "配置测试失败"
    else
        echo "容器启动后立即退出，查看日志获取详细信息"
    fi
else
    echo "无法测试：未找到nginx容器"
fi
echo ""

echo "=========================================="
echo "诊断完成"
echo "=========================================="
echo ""
echo "如果发现问题，建议："
echo "1. 运行修复脚本: bash cloud-deployment/scripts/fix-nginx-conf.sh"
echo "2. 检查SSL证书是否正确部署"
echo "3. 查看完整日志: docker logs $NGINX_CONTAINER"
echo ""

