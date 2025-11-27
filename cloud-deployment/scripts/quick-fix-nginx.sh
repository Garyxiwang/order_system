#!/bin/bash

# 快速修复nginx容器启动问题

set -e

echo "=========================================="
echo "快速修复Nginx容器"
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

NGINX_CONF="$DEPLOY_DIR/nginx.conf"
NGINX_CONTAINER="order_system_nginx"

echo "1. 停止并删除现有nginx容器..."
docker-compose stop nginx 2>/dev/null || true
docker rm -f "$NGINX_CONTAINER" 2>/dev/null || true
echo "✓ 容器已停止"
echo ""

echo "2. 修复nginx.conf文件..."
# 使用fix-nginx-conf.sh修复配置文件
if [ -f "cloud-deployment/scripts/fix-nginx-conf.sh" ]; then
    bash cloud-deployment/scripts/fix-nginx-conf.sh
else
    echo "   运行修复脚本..."
    # 直接创建正确的配置文件
    cat > "$NGINX_CONF" << 'EOF'
# Nginx Server配置 - 用于conf.d/default.conf

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name www.greenspring-order.cn greenspring-order.cn _;
    return 301 https://$host$request_uri;
}

# HTTPS 主服务器配置
server {
    listen 443 ssl http2;
    server_name www.greenspring-order.cn greenspring-order.cn;

    ssl_certificate /etc/nginx/ssl/www.greenspring-order.cn_bundle.pem;
    ssl_certificate_key /etc/nginx/ssl/www.greenspring-order.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    client_max_body_size 50m;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    echo "✓ 已创建正确的nginx.conf"
fi
echo ""

echo "3. 验证配置文件..."
# 检查是否包含主配置指令
if grep -q "^[[:space:]]*user[[:space:]]" "$NGINX_CONF" || \
   grep -q "^[[:space:]]*events[[:space:]]*{" "$NGINX_CONF" || \
   grep -q "^[[:space:]]*http[[:space:]]*{" "$NGINX_CONF"; then
    echo "✗ 配置文件仍然包含主配置指令，需要修复"
    echo "   请运行: bash cloud-deployment/scripts/fix-nginx-conf.sh"
    exit 1
else
    echo "✓ 配置文件格式正确（只包含server块）"
fi
echo ""

echo "4. 检查SSL证书..."
SSL_DIR="$DEPLOY_DIR/ssl"
if [ ! -f "$SSL_DIR/www.greenspring-order.cn_bundle.pem" ] || \
   [ ! -f "$SSL_DIR/www.greenspring-order.cn.key" ]; then
    echo "⚠ 警告: SSL证书文件不存在"
    echo "   请先运行: bash cloud-deployment/scripts/deploy-ssl-server.sh"
    echo "   或手动部署SSL证书到: $SSL_DIR"
else
    echo "✓ SSL证书文件存在"
fi
echo ""

echo "5. 启动nginx容器..."
if docker-compose up -d nginx 2>&1; then
    sleep 3
    if docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
        echo "✓ Nginx容器已启动"
        
        # 测试配置
        sleep 2
        if docker exec "$NGINX_CONTAINER" nginx -t 2>&1; then
            echo "✓ Nginx配置测试通过"
        else
            echo "⚠ 警告: 配置测试失败，查看日志:"
            docker logs --tail 20 "$NGINX_CONTAINER"
        fi
    else
        echo "✗ 容器启动后立即退出"
        echo "   查看日志:"
        docker logs --tail 50 "$NGINX_CONTAINER" 2>&1 || true
        exit 1
    fi
else
    echo "✗ 容器启动失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "修复完成！"
echo "=========================================="
echo ""
echo "检查容器状态:"
docker-compose ps nginx
echo ""

