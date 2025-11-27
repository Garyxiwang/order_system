#!/bin/bash

# Docker环境SSL证书部署脚本
# 用于上传SSL证书到服务器并配置docker nginx

set -e

SERVER="root@106.54.235.3"
CERT_DIR="$(dirname "$0")/../../"

echo "=========================================="
echo "Docker环境SSL证书部署脚本"
echo "=========================================="

# 检查证书文件是否存在
CERT_ZIP="$CERT_DIR/www.greenspring-order.cn_nginx.zip"
if [ ! -f "$CERT_ZIP" ]; then
    echo "错误: 找不到证书文件 $CERT_ZIP"
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
SSL_DIR="$DEPLOY_DIR/ssl"

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
ssh $SERVER "mkdir -p $SSL_DIR && chmod 755 $SSL_DIR"

echo "4. 上传证书文件..."
scp "$CERT_PATH/www.greenspring-order.cn_bundle.pem" $SERVER:$SSL_DIR/
scp "$CERT_PATH/www.greenspring-order.cn.key" $SERVER:$SSL_DIR/

echo "5. 设置证书文件权限..."
ssh $SERVER "chmod 644 $SSL_DIR/www.greenspring-order.cn_bundle.pem && chmod 600 $SSL_DIR/www.greenspring-order.cn.key"

echo "6. 验证证书文件..."
ssh $SERVER "ls -la $SSL_DIR/"

echo ""
echo "=========================================="
echo "SSL证书部署完成！"
echo "=========================================="
echo "证书文件位置:"
echo "  - 证书: $SSL_DIR/www.greenspring-order.cn_bundle.pem"
echo "  - 私钥: $SSL_DIR/www.greenspring-order.cn.key"
echo ""
echo "下一步: 运行 deploy-docker-nginx.sh 来部署nginx配置"
echo ""

# 清理临时文件
rm -rf "$TMP_DIR"

