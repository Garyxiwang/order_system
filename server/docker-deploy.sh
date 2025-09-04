#!/bin/bash

# Docker部署脚本
# 用于简化订单系统的Docker部署过程

set -e  # 遇到错误时退出

echo "🚀 开始部署订单系统..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads logs

# 停止并删除现有容器（如果存在）
echo "🛑 停止现有容器..."
docker-compose down --remove-orphans

# 清理旧的镜像（可选）
read -p "是否清理旧的Docker镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理旧镜像..."
    docker system prune -f
    docker image prune -f
fi

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查应用健康状态
echo "🏥 检查应用健康状态..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health &> /dev/null; then
        echo "✅ 应用启动成功！"
        echo "🌐 应用访问地址: http://localhost:8000"
        echo "📊 API文档地址: http://localhost:8000/docs"
        echo "🗄️  数据库连接: localhost:5432"
        break
    else
        echo "等待应用启动... ($i/30)"
        sleep 2
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ 应用启动超时，请检查日志"
        echo "查看应用日志: docker-compose logs app"
        echo "查看数据库日志: docker-compose logs db"
        exit 1
    fi
done

echo "🎉 部署完成！"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  进入容器: docker-compose exec app bash"
echo "  查看状态: docker-compose ps"