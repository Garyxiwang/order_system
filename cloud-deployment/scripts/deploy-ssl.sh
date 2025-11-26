#!/bin/bash

# SSL证书部署脚本
# 用于上传SSL证书到服务器并配置nginx

set -e

SERVER="root@106.54.235.3"
SSL_DIR="/etc/nginx/ssl"
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

echo "1. 解压证书文件..."
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

echo "2. 创建SSL目录..."
ssh $SERVER "mkdir -p $SSL_DIR && chmod 700 $SSL_DIR"

echo "3. 上传证书文件..."
scp "$CERT_PATH/www.greenspring-order.cn_bundle.pem" $SERVER:$SSL_DIR/
scp "$CERT_PATH/www.greenspring-order.cn.key" $SERVER:$SSL_DIR/

echo "4. 设置证书文件权限..."
ssh $SERVER "chmod 600 $SSL_DIR/www.greenspring-order.cn.key && chmod 644 $SSL_DIR/www.greenspring-order.cn_bundle.pem"

echo "5. 验证证书文件..."
ssh $SERVER "ls -la $SSL_DIR/"

echo "6. 测试nginx配置..."
ssh $SERVER "nginx -t"

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

