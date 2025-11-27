#!/bin/bash

# Docker环境Nginx配置部署脚本
# 用于上传nginx配置到服务器并重启docker容器

set -e

SERVER="root@106.54.235.3"
LOCAL_CONF="$(dirname "$0")/../nginx/nginx.conf"

echo "=========================================="
echo "Docker环境Nginx配置部署脚本"
echo "=========================================="

# 检查配置文件是否存在
if [ ! -f "$LOCAL_CONF" ]; then
    echo "错误: 找不到nginx配置文件 $LOCAL_CONF"
    exit 1
fi

# 检测docker-compose部署目录
echo "1. 检测docker-compose部署目录..."
DEPLOY_DIR=$(ssh $SERVER "
    # 查找docker-compose.production.yml或docker-compose.yml所在目录
    if [ -f /root/order_system/cloud-deployment/docker-compose.production.yml ]; then
        echo '/root/order_system/cloud-deployment'
    elif [ -f /root/order_system/docker-compose.yml ]; then
        echo '/root/order_system'
    elif [ -f /opt/order_system/cloud-deployment/docker-compose.production.yml ]; then
        echo '/opt/order_system/cloud-deployment'
    elif [ -f /opt/order_system/docker-compose.yml ]; then
        echo '/opt/order_system'
    else
        # 尝试查找nginx容器
        NGINX_CONTAINER=\$(docker ps --format '{{.Names}}' | grep nginx | head -1)
        if [ -n \"\$NGINX_CONTAINER\" ]; then
            # 从容器挂载信息中提取路径
            docker inspect \$NGINX_CONTAINER | grep -o '\"Source\":\"[^\"]*nginx' | head -1 | cut -d'\"' -f4 | xargs dirname | xargs dirname
        else
            echo 'ERROR'
        fi
    fi
")

if [ "$DEPLOY_DIR" = "ERROR" ] || [ -z "$DEPLOY_DIR" ]; then
    echo "✗ 无法找到docker-compose部署目录"
    echo "请手动指定部署目录，或确保docker-compose.yml文件存在"
    exit 1
fi

echo "   检测到部署目录: $DEPLOY_DIR"
NGINX_CONF_DIR="$DEPLOY_DIR/nginx"
NGINX_CONF_FILE="nginx.conf"

# 检测SSL目录路径
if [ -d "$DEPLOY_DIR/ssl" ]; then
    SSL_DIR="$DEPLOY_DIR/ssl"
else
    SSL_DIR="/etc/nginx/ssl"
fi

echo "   Nginx配置目录: $NGINX_CONF_DIR"
echo "   SSL证书目录: $SSL_DIR"

echo "2. 备份当前nginx配置..."
BACKUP_FILE="${NGINX_CONF_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
ssh $SERVER "mkdir -p $NGINX_CONF_DIR && cp $NGINX_CONF_DIR/$NGINX_CONF_FILE $NGINX_CONF_DIR/$BACKUP_FILE 2>/dev/null || true"
echo "   备份文件: $NGINX_CONF_DIR/$BACKUP_FILE"

echo "3. 准备nginx配置文件..."
# 创建临时配置文件，根据检测到的路径更新SSL证书路径
TMP_CONF=$(mktemp)
cp "$LOCAL_CONF" "$TMP_CONF"

# 更新配置文件中的SSL路径
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|/etc/nginx/ssl|$SSL_DIR|g" "$TMP_CONF"
else
    # Linux
    sed -i "s|/etc/nginx/ssl|$SSL_DIR|g" "$TMP_CONF"
fi
echo "   已更新SSL证书路径为: $SSL_DIR"

echo "4. 上传nginx配置文件..."
scp "$TMP_CONF" $SERVER:$NGINX_CONF_DIR/$NGINX_CONF_FILE
rm -f "$TMP_CONF"

echo "5. 测试nginx配置（在容器内）..."
# 查找nginx容器
NGINX_CONTAINER=$(ssh $SERVER "docker ps --format '{{.Names}}' | grep nginx | head -1")

if [ -z "$NGINX_CONTAINER" ]; then
    echo "⚠ 警告: 未找到运行中的nginx容器"
    echo "   配置文件已上传，但无法测试"
else
    echo "   找到nginx容器: $NGINX_CONTAINER"
    if ssh $SERVER "docker exec $NGINX_CONTAINER nginx -t 2>&1"; then
        echo "✓ Nginx配置测试通过"
    else
        echo "✗ Nginx配置测试失败，恢复备份..."
        ssh $SERVER "cp $NGINX_CONF_DIR/$BACKUP_FILE $NGINX_CONF_DIR/$NGINX_CONF_FILE"
        exit 1
    fi
fi

echo "6. 重启nginx容器..."
if [ -n "$NGINX_CONTAINER" ]; then
    if ssh $SERVER "docker restart $NGINX_CONTAINER 2>&1"; then
        sleep 3
        # 检查容器是否正常运行
        if ssh $SERVER "docker ps --format '{{.Names}}' | grep -q '^${NGINX_CONTAINER}$'"; then
            echo "✓ Nginx容器已重启"
        else
            echo "⚠ 警告: 容器重启后可能未正常运行，请检查日志"
            echo "   查看日志: ssh $SERVER 'docker logs $NGINX_CONTAINER'"
        fi
    else
        echo "✗ Nginx容器重启失败"
        echo "   请手动重启: ssh $SERVER 'docker restart $NGINX_CONTAINER'"
        exit 1
    fi
else
    echo "⚠ 警告: 未找到nginx容器，请手动重启docker-compose服务"
    echo "   重启命令: ssh $SERVER 'cd $DEPLOY_DIR && docker-compose restart nginx'"
fi

echo ""
echo "=========================================="
echo "Nginx配置部署完成！"
echo "=========================================="
echo "配置文件位置: $NGINX_CONF_DIR/$NGINX_CONF_FILE"
echo "SSL证书目录: $SSL_DIR"
echo "Nginx容器: ${NGINX_CONTAINER:-未找到}"
echo ""

