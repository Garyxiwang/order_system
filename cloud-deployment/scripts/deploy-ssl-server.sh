#!/bin/bash

# 服务器端SSL证书部署脚本
# 在服务器上直接执行，无需上传

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
echo "服务器端SSL证书部署脚本"
echo "=========================================="
echo "部署目录: $DEPLOY_DIR"
echo ""

cd "$DEPLOY_DIR"

# 检查证书文件是否存在
CERT_ZIP="www.greenspring-order.cn_nginx.zip"
if [ ! -f "$CERT_ZIP" ]; then
    echo "错误: 找不到证书文件 $CERT_ZIP"
    echo "请确保证书文件在项目根目录"
    exit 1
fi

SSL_DIR="$DEPLOY_DIR/ssl"

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
mkdir -p "$SSL_DIR"
chmod 755 "$SSL_DIR"

echo "3. 复制证书文件..."
cp "$CERT_PATH/www.greenspring-order.cn_bundle.pem" "$SSL_DIR/"
cp "$CERT_PATH/www.greenspring-order.cn.key" "$SSL_DIR/"

echo "4. 设置证书文件权限..."
chmod 644 "$SSL_DIR/www.greenspring-order.cn_bundle.pem"
chmod 600 "$SSL_DIR/www.greenspring-order.cn.key"

echo "5. 验证证书文件..."
ls -la "$SSL_DIR/"

echo ""
echo "=========================================="
echo "SSL证书部署完成！"
echo "=========================================="
echo "证书文件位置:"
echo "  - 证书: $SSL_DIR/www.greenspring-order.cn_bundle.pem"
echo "  - 私钥: $SSL_DIR/www.greenspring-order.cn.key"
echo ""
echo "下一步: 运行 deploy-nginx-server.sh 来更新nginx配置"
echo ""

# 清理临时文件
rm -rf "$TMP_DIR"

