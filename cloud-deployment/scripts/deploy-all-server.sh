#!/bin/bash

# 服务器端完整部署脚本
# 在服务器上直接执行，依次部署SSL证书和nginx配置

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "服务器端SSL和Nginx完整部署"
echo "=========================================="
echo ""

# 执行SSL证书部署
echo "步骤 1/2: 部署SSL证书..."
bash "$SCRIPT_DIR/deploy-ssl-server.sh"

echo ""
echo "步骤 2/2: 部署Nginx配置..."
bash "$SCRIPT_DIR/deploy-nginx-server.sh"

echo ""
echo "=========================================="
echo "所有部署完成！"
echo "=========================================="
echo "请访问 https://www.greenspring-order.cn 验证SSL配置"
echo ""

