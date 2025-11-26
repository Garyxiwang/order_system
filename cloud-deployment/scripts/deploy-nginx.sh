#!/bin/bash

# Nginx配置部署脚本
# 用于上传nginx配置到服务器并重载nginx

set -e

SERVER="root@106.54.235.3"
LOCAL_CONF="$(dirname "$0")/../nginx/nginx.conf"

echo "=========================================="
echo "Nginx配置部署脚本"
echo "=========================================="

# 检查配置文件是否存在
if [ ! -f "$LOCAL_CONF" ]; then
    echo "错误: 找不到nginx配置文件 $LOCAL_CONF"
    exit 1
fi

# 自动检测nginx配置路径（支持宝塔面板和标准安装）
echo "1. 检测nginx配置路径..."
NGINX_CONF_DIR=$(ssh $SERVER "
    if [ -f /www/server/nginx/conf/nginx.conf ]; then
        echo '/www/server/nginx/conf'
    elif [ -f /etc/nginx/nginx.conf ]; then
        echo '/etc/nginx'
    else
        echo 'ERROR'
    fi
")

if [ "$NGINX_CONF_DIR" = "ERROR" ]; then
    echo "✗ 无法找到nginx配置文件"
    exit 1
fi

echo "   检测到nginx配置路径: $NGINX_CONF_DIR"
NGINX_CONF_FILE="nginx.conf"

echo "2. 备份当前nginx配置..."
BACKUP_FILE="${NGINX_CONF_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
ssh $SERVER "cp $NGINX_CONF_DIR/$NGINX_CONF_FILE $NGINX_CONF_DIR/$BACKUP_FILE 2>/dev/null || true"
echo "   备份文件: $NGINX_CONF_DIR/$BACKUP_FILE"

echo "3. 准备nginx配置文件..."
# 创建临时配置文件，根据检测到的路径更新SSL证书路径
TMP_CONF=$(mktemp)
cp "$LOCAL_CONF" "$TMP_CONF"

# 根据nginx路径确定SSL目录并更新配置
if [ "$NGINX_CONF_DIR" = "/www/server/nginx/conf" ]; then
    SSL_DIR="/www/server/nginx/conf/ssl"
else
    SSL_DIR="/etc/nginx/ssl"
fi

# 更新配置文件中的SSL路径（兼容macOS和Linux的sed命令）
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

echo "5. 测试nginx配置..."
if ssh $SERVER "nginx -t 2>&1"; then
    echo "✓ Nginx配置测试通过"
else
    echo "✗ Nginx配置测试失败，恢复备份..."
    ssh $SERVER "cp $NGINX_CONF_DIR/$BACKUP_FILE $NGINX_CONF_DIR/$NGINX_CONF_FILE"
    exit 1
fi

echo "6. 重载nginx配置..."
# 尝试多种方式重载nginx
RELOAD_SUCCESS=false

# 根据nginx路径选择最佳重启方式
if [ "$NGINX_CONF_DIR" = "/www/server/nginx/conf" ]; then
    # 宝塔面板：优先使用宝塔的nginx管理
    echo "   检测到宝塔面板，使用宝塔nginx管理..."
    
    # 方式1: 使用宝塔面板的nginx管理脚本
    if ssh $SERVER "/etc/init.d/nginx restart 2>&1" > /dev/null 2>&1; then
        sleep 3
        if ssh $SERVER "ps aux | grep -v grep | grep '[n]ginx' > /dev/null 2>&1"; then
            echo "✓ Nginx配置已重载 (/etc/init.d/nginx restart)"
            RELOAD_SUCCESS=true
        fi
    fi
    
    # 方式2: 如果方式1失败，尝试systemctl
    if [ "$RELOAD_SUCCESS" = false ]; then
        if ssh $SERVER "systemctl restart nginx 2>&1" > /dev/null 2>&1; then
            sleep 3
            if ssh $SERVER "ps aux | grep -v grep | grep '[n]ginx' > /dev/null 2>&1"; then
                echo "✓ Nginx配置已重载 (systemctl restart)"
                RELOAD_SUCCESS=true
            fi
        fi
    fi
    
    # 方式3: 最后尝试nginx -s reload
    if [ "$RELOAD_SUCCESS" = false ]; then
        if ssh $SERVER "nginx -s reload 2>&1" > /dev/null 2>&1; then
            echo "✓ Nginx配置已重载 (nginx -s reload)"
            RELOAD_SUCCESS=true
        fi
    fi
else
    # 标准安装：优先使用nginx -s reload
    echo "   检测到标准nginx安装..."
    
    # 方式1: 使用nginx -s reload
    if ssh $SERVER "nginx -s reload 2>&1" > /dev/null 2>&1; then
        echo "✓ Nginx配置已重载 (nginx -s reload)"
        RELOAD_SUCCESS=true
    else
        echo "   方式1失败，尝试重启nginx服务..."
        
        # 方式2: 使用systemctl restart
        if ssh $SERVER "systemctl restart nginx 2>&1" > /dev/null 2>&1; then
            sleep 2
            if ssh $SERVER "systemctl is-active nginx > /dev/null 2>&1"; then
                echo "✓ Nginx配置已重载 (systemctl restart)"
                RELOAD_SUCCESS=true
            fi
        fi
    fi
fi

if [ "$RELOAD_SUCCESS" = false ]; then
    echo "✗ Nginx重载失败，恢复备份..."
    ssh $SERVER "cp $NGINX_CONF_DIR/$BACKUP_FILE $NGINX_CONF_DIR/$NGINX_CONF_FILE"
    echo ""
    echo "请手动检查nginx状态:"
    echo "  ssh $SERVER 'systemctl status nginx'"
    echo "  ssh $SERVER 'nginx -t'"
    exit 1
fi

echo ""
echo "=========================================="
echo "Nginx配置部署完成！"
echo "=========================================="
echo "配置文件位置: $NGINX_CONF_DIR/$NGINX_CONF_FILE"
echo "SSL证书目录: $SSL_DIR"
echo ""

