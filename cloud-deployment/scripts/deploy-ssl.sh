#!/bin/bash

# SSL证书部署脚本
# 用于上传SSL证书到服务器并配置nginx

set -e

SERVER="root@106.54.235.3"
CERT_DIR="$(dirname "$0")/../../"

echo "=========================================="
echo "SSL证书部署脚本"
echo "=========================================="

# 检查证书文件是否存在
CERT_ZIP="$CERT_DIR/www.greenspring-order.cn_nginx.zip"
if [ ! -f "$CERT_ZIP" ]; then
    echo "错误: 找不到证书文件 $CERT_ZIP"
    exit 1
fi

# 自动检测nginx配置路径并确定SSL目录
echo "1. 检测nginx和SSL目录..."
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

# 根据nginx路径确定SSL目录
if [ "$NGINX_CONF_DIR" = "/www/server/nginx/conf" ]; then
    SSL_DIR="/www/server/nginx/conf/ssl"
else
    SSL_DIR="/etc/nginx/ssl"
fi

echo "   Nginx配置路径: $NGINX_CONF_DIR"
echo "   SSL证书目录: $SSL_DIR"

echo "2. 解压证书文件..."
TMP_DIR=$(mktemp -d)
unzip -q "$CERT_ZIP" -d "$TMP_DIR"
CERT_PATH="$TMP_DIR/www.greenspring-order.cn_nginx"

# 检查证书文件
if [ ! -f "$CERT_PATH/www.greenspring-order.cn_bundle.pem" ] || \
   [ ! -f "$CERT_PATH/www.greenspring-order.cn.key" ]; then
    echo "错误: 证书文件不完整"
    rm -rf "$TMP_DIR"
    exit 1
fi

echo "3. 创建SSL目录..."
ssh $SERVER "mkdir -p $SSL_DIR && chmod 700 $SSL_DIR"

echo "4. 上传证书文件..."
scp "$CERT_PATH/www.greenspring-order.cn_bundle.pem" $SERVER:$SSL_DIR/
scp "$CERT_PATH/www.greenspring-order.cn.key" $SERVER:$SSL_DIR/

echo "5. 设置证书文件权限..."
ssh $SERVER "chmod 600 $SSL_DIR/www.greenspring-order.cn.key && chmod 644 $SSL_DIR/www.greenspring-order.cn_bundle.pem"

echo "6. 验证证书文件..."
ssh $SERVER "ls -la $SSL_DIR/"

echo "7. 测试nginx配置..."
if ssh $SERVER "nginx -t 2>&1"; then
    echo "✓ Nginx配置测试通过"
else
    echo "⚠ 警告: Nginx配置测试失败，但证书已上传"
    echo "   请检查nginx配置文件中的SSL证书路径是否正确"
fi

echo ""
echo "=========================================="
echo "SSL证书部署完成！"
echo "=========================================="
echo "证书文件位置:"
echo "  - 证书: $SSL_DIR/www.greenspring-order.cn_bundle.pem"
echo "  - 私钥: $SSL_DIR/www.greenspring-order.cn.key"
echo ""
echo "下一步: 运行 deploy-nginx.sh 来部署nginx配置"
echo ""

# 清理临时文件
rm -rf "$TMP_DIR"

