#!/bin/bash

# 服务器端Nginx配置部署脚本
# 在服务器上直接执行，更新nginx配置并重启容器

set -e

# 检测部署目录（从当前目录或常见路径）
if [ -f "docker-compose.yml" ]; then
    DEPLOY_DIR="$(pwd)"
elif [ -f "/root/order_system/docker-compose.yml" ]; then
    DEPLOY_DIR="/root/order_system"
elif [ -f "/opt/order_system/docker-compose.yml" ]; then
    DEPLOY_DIR="/opt/order_system"
else
    echo "错误: 无法找到docker-compose.yml文件"
    echo "请确保在项目根目录执行此脚本"
    exit 1
fi

echo "=========================================="
echo "服务器端Nginx配置部署脚本"
echo "=========================================="
echo "部署目录: $DEPLOY_DIR"
echo ""

cd "$DEPLOY_DIR"

# 优先使用项目根目录的nginx.conf（适合conf.d/default.conf）
# 如果没有，则使用cloud-deployment/nginx/nginx.conf并提取server块
if [ -f "$DEPLOY_DIR/nginx.conf" ]; then
    LOCAL_CONF="$DEPLOY_DIR/nginx.conf"
    echo "   使用项目根目录的nginx.conf"
elif [ -f "$DEPLOY_DIR/cloud-deployment/nginx/nginx.conf" ]; then
    # 从完整配置中提取server块
    LOCAL_CONF=$(mktemp)
    echo "   从完整配置中提取server块..."
    # 提取server块（从第一个server到文件结束）
    sed -n '/^[[:space:]]*server[[:space:]]*{/,/^}$/p' "$DEPLOY_DIR/cloud-deployment/nginx/nginx.conf" > "$LOCAL_CONF"
    # 添加HTTP重定向server块
    {
        echo "# HTTP 重定向到 HTTPS"
        echo "server {"
        echo "    listen 80;"
        echo "    server_name www.greenspring-order.cn greenspring-order.cn _;"
        echo "    return 301 https://\$host\$request_uri;"
        echo "}"
        echo ""
        cat "$LOCAL_CONF"
    } > "${LOCAL_CONF}.tmp"
    mv "${LOCAL_CONF}.tmp" "$LOCAL_CONF"
else
    echo "错误: 找不到nginx配置文件"
    exit 1
fi

# 检测SSL目录路径（容器内路径）
# 根据docker-compose.yml，SSL证书应该挂载到容器内
if [ -d "$DEPLOY_DIR/ssl" ]; then
    SSL_DIR="$DEPLOY_DIR/ssl"
    SSL_CONTAINER_PATH="/etc/nginx/ssl"  # 容器内的路径
else
    SSL_DIR="$DEPLOY_DIR/ssl"
    SSL_CONTAINER_PATH="/etc/nginx/ssl"
    mkdir -p "$SSL_DIR"
fi

echo "   Nginx配置文件: $LOCAL_CONF"
echo "   SSL证书目录: $SSL_DIR"

# 查找nginx容器
NGINX_CONTAINER=$(docker ps --format '{{.Names}}' | grep nginx | head -1)

if [ -z "$NGINX_CONTAINER" ]; then
    echo "错误: 未找到运行中的nginx容器"
    echo "请确保nginx容器正在运行: docker-compose ps"
    exit 1
fi

echo "   找到nginx容器: $NGINX_CONTAINER"
echo ""

echo "1. 备份当前nginx配置..."
# 从容器中备份配置（如果容器内挂载了配置文件）
BACKUP_DIR="$DEPLOY_DIR/nginx-backup"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="${NGINX_CONF_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# 尝试从容器中复制配置（如果可能）
if docker exec "$NGINX_CONTAINER" test -f /etc/nginx/nginx.conf 2>/dev/null; then
    docker cp "$NGINX_CONTAINER:/etc/nginx/nginx.conf" "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || true
fi

# 如果本地有配置文件，也备份
if [ -f "$NGINX_CONF_DIR/$NGINX_CONF_FILE" ]; then
    cp "$NGINX_CONF_DIR/$NGINX_CONF_FILE" "$BACKUP_DIR/$BACKUP_FILE.local" 2>/dev/null || true
fi

echo "   备份文件: $BACKUP_DIR/$BACKUP_FILE"
echo ""

echo "2. 准备nginx配置文件..."
# 创建临时配置文件
TMP_CONF=$(mktemp)

# 检查源配置文件是否包含主配置指令（user, events, http等）
if grep -q "^[[:space:]]*user[[:space:]]" "$LOCAL_CONF" || \
   grep -q "^[[:space:]]*events[[:space:]]*{" "$LOCAL_CONF" || \
   grep -q "^[[:space:]]*http[[:space:]]*{" "$LOCAL_CONF"; then
    echo "   检测到完整nginx配置，提取server块..."
    # 提取所有server块（使用awk更可靠）
    awk '
        /^[[:space:]]*server[[:space:]]*{/ { 
            in_server=1
            print
            next
        }
        in_server {
            print
            if (/^[[:space:]]*}[[:space:]]*$/) {
                in_server=0
            }
        }
    ' "$LOCAL_CONF" > "$TMP_CONF"
    
    # 如果提取失败或为空，使用默认配置
    if [ ! -s "$TMP_CONF" ]; then
        echo "   警告: 无法提取server块，使用默认server块配置"
        cat > "$TMP_CONF" << 'EOF'
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

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    fi
else
    # 如果已经是server块配置，直接复制
    cp "$LOCAL_CONF" "$TMP_CONF"
    echo "   使用server块配置"
fi

# 更新配置文件中的SSL路径（使用容器内路径）
sed -i "s|/etc/nginx/ssl|$SSL_CONTAINER_PATH|g" "$TMP_CONF"
echo "   已更新SSL证书路径为: $SSL_CONTAINER_PATH (容器内)"
echo ""

# 检查docker-compose.yml中的nginx配置挂载
echo "3. 检查docker-compose配置..."
NGINX_TARGET=""

# 从docker-compose.yml中提取nginx配置挂载路径
if grep -q "nginx:" docker-compose.yml 2>/dev/null; then
    # 查找nginx配置挂载行
    NGINX_MOUNT_LINE=$(grep -A 10 "nginx:" docker-compose.yml | grep -E "nginx\.conf|\.conf:" | head -1)
    if [ -n "$NGINX_MOUNT_LINE" ]; then
        # 提取本地路径（冒号前的部分，去掉开头的./）
        NGINX_TARGET=$(echo "$NGINX_MOUNT_LINE" | sed 's/.*- *\.\?\/\?\([^:]*\):.*/\1/' | sed 's/^\.\///' | xargs)
        # 如果是相对路径，转换为绝对路径
        if [[ "$NGINX_TARGET" != /* ]]; then
            NGINX_TARGET="$DEPLOY_DIR/$NGINX_TARGET"
        fi
        echo "   检测到nginx配置挂载: $NGINX_TARGET"
    fi
fi

# 如果没找到，使用默认路径
if [ -z "$NGINX_TARGET" ]; then
    NGINX_TARGET="$DEPLOY_DIR/nginx.conf"
fi

# 确保目录存在
mkdir -p "$(dirname "$NGINX_TARGET")"

# 复制配置文件
cp "$TMP_CONF" "$NGINX_TARGET"
echo "   配置文件已更新: $NGINX_TARGET"

rm -f "$TMP_CONF"
echo ""

echo "4. 测试nginx配置（在容器内）..."
if docker exec "$NGINX_CONTAINER" nginx -t 2>&1; then
    echo "✓ Nginx配置测试通过"
else
    echo "✗ Nginx配置测试失败"
    echo "   请检查配置文件，或恢复备份:"
    echo "   cp $BACKUP_DIR/$BACKUP_FILE <配置文件路径>"
    exit 1
fi
echo ""

echo "5. 重启nginx容器..."
if docker restart "$NGINX_CONTAINER" 2>&1; then
    sleep 3
    # 检查容器是否正常运行
    if docker ps --format '{{.Names}}' | grep -q "^${NGINX_CONTAINER}$"; then
        echo "✓ Nginx容器已重启"
        
        # 检查容器健康状态
        sleep 2
        if docker exec "$NGINX_CONTAINER" nginx -t > /dev/null 2>&1; then
            echo "✓ Nginx配置验证通过"
        else
            echo "⚠ 警告: 容器重启后配置验证失败，请检查日志"
            echo "   查看日志: docker logs $NGINX_CONTAINER"
        fi
    else
        echo "✗ 容器重启后未正常运行，请检查日志"
        echo "   查看日志: docker logs $NGINX_CONTAINER"
        exit 1
    fi
else
    echo "✗ Nginx容器重启失败"
    echo "   请手动重启: docker restart $NGINX_CONTAINER"
    exit 1
fi

echo ""
echo "=========================================="
echo "Nginx配置部署完成！"
echo "=========================================="
echo "配置文件位置: $NGINX_TARGET"
echo "SSL证书目录: $SSL_DIR"
echo "Nginx容器: $NGINX_CONTAINER"
echo ""

# 清理临时文件
if [ -f "$LOCAL_CONF" ] && [ "$LOCAL_CONF" != "$DEPLOY_DIR/nginx.conf" ]; then
    rm -f "$LOCAL_CONF"
fi

