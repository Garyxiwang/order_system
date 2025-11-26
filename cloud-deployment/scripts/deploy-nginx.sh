#!/bin/bash

# Nginx配置部署脚本
# 用于上传nginx配置到服务器并重载nginx

set -e

SERVER="root@106.54.235.3"
NGINX_CONF_DIR="/etc/nginx"
NGINX_CONF_FILE="nginx.conf"
LOCAL_CONF="$(dirname "$0")/../nginx/$NGINX_CONF_FILE"

echo "=========================================="
echo "Nginx配置部署脚本"
echo "=========================================="

# 检查配置文件是否存在
if [ ! -f "$LOCAL_CONF" ]; then
    echo "错误: 找不到nginx配置文件 $LOCAL_CONF"
    exit 1
fi

echo "1. 备份当前nginx配置..."
ssh $SERVER "cp $NGINX_CONF_DIR/$NGINX_CONF_FILE $NGINX_CONF_DIR/${NGINX_CONF_FILE}.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true"

echo "2. 上传nginx配置文件..."
scp "$LOCAL_CONF" $SERVER:$NGINX_CONF_DIR/$NGINX_CONF_FILE

echo "3. 测试nginx配置..."
if ssh $SERVER "nginx -t"; then
    echo "✓ Nginx配置测试通过"
else
    echo "✗ Nginx配置测试失败，已恢复备份"
    ssh $SERVER "cp $NGINX_CONF_DIR/${NGINX_CONF_FILE}.backup.* $NGINX_CONF_DIR/$NGINX_CONF_FILE"
    exit 1
fi

echo "4. 重载nginx配置..."
if ssh $SERVER "nginx -s reload"; then
    echo "✓ Nginx配置已重载"
else
    echo "✗ Nginx重载失败，请检查日志"
    exit 1
fi

echo ""
echo "=========================================="
echo "Nginx配置部署完成！"
echo "=========================================="
echo "配置文件位置: $NGINX_CONF_DIR/$NGINX_CONF_FILE"
echo ""

