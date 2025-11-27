#!/bin/bash

# Docker环境完整部署脚本
# 依次执行SSL证书部署和nginx配置部署

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "Docker环境SSL和Nginx完整部署"
echo "=========================================="
echo ""

# 执行SSL证书部署
echo "步骤 1/2: 部署SSL证书..."
bash "$SCRIPT_DIR/deploy-docker-ssl.sh"

echo ""
echo "步骤 2/2: 部署Nginx配置..."
bash "$SCRIPT_DIR/deploy-docker-nginx.sh"

echo ""
echo "=========================================="
echo "所有部署完成！"
echo "=========================================="
echo "请访问 https://www.greenspring-order.cn 验证SSL配置"
echo ""

