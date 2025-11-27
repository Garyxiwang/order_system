#!/bin/bash

# 修复nginx.conf文件，确保只包含server块配置
# 在服务器上直接执行此脚本来修复nginx.conf

set -e

# 检测部署目录
if [ -f "docker-compose.yml" ]; then
    DEPLOY_DIR="$(pwd)"
elif [ -f "/root/order_system/docker-compose.yml" ]; then
    DEPLOY_DIR="/root/order_system"
elif [ -f "/home/www/order_system/docker-compose.yml" ]; then
    DEPLOY_DIR="/home/www/order_system"
else
    echo "错误: 无法找到docker-compose.yml文件"
    echo "请确保在项目根目录执行此脚本"
    exit 1
fi

echo "=========================================="
echo "修复nginx.conf配置文件"
echo "=========================================="
echo "部署目录: $DEPLOY_DIR"
echo ""

cd "$DEPLOY_DIR"

NGINX_CONF="$DEPLOY_DIR/nginx.conf"

# 备份原文件
if [ -f "$NGINX_CONF" ]; then
    BACKUP_FILE="${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_CONF" "$BACKUP_FILE"
    echo "已备份原文件: $BACKUP_FILE"
fi

# 创建新的nginx.conf（只包含server块）
cat > "$NGINX_CONF" << 'NGINX_EOF'
# Nginx Server配置 - 用于conf.d/default.conf
# 注意：此文件只包含server块配置，会被挂载到 /etc/nginx/conf.d/default.conf

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

    # SSL 配置
    ssl_certificate /etc/nginx/ssl/www.greenspring-order.cn_bundle.pem;
    ssl_certificate_key /etc/nginx/ssl/www.greenspring-order.cn.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # 现代 SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 安全头
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 日志配置
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # 客户端设置
    client_max_body_size 50m;
    client_body_buffer_size 128k;

    # API 路由
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 登录接口特殊处理
    location /api/auth/login {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js 静态资源代理（优先匹配，确保 chunk 文件正确加载）
    location /_next/ {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }

    # 前端应用
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
        add_header Cache-Control "no-store, must-revalidate" always;
        
        # 超时设置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 拒绝访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 拒绝访问备份文件
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINX_EOF

echo "✓ 已创建新的nginx.conf文件（只包含server块）"
echo ""
echo "文件位置: $NGINX_CONF"
echo ""
echo "现在可以测试配置:"
echo "  docker exec order_system_nginx nginx -t"
echo ""
echo "然后重启容器:"
echo "  docker restart order_system_nginx"
echo ""

