#!/bin/bash

# 订单系统快速启动脚本
# 使用方法: ./start.sh [dev|prod|docker]

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "端口 $1 已被占用"
        return 1
    fi
    return 0
}

# 等待服务启动
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_info "等待 $service_name 启动..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s $url > /dev/null 2>&1; then
            print_success "$service_name 已启动"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name 启动超时"
    return 1
}

# 开发环境启动
start_dev() {
    print_info "启动开发环境..."
    
    # 检查必要的命令
    check_command "node"
    check_command "npm"
    check_command "python3"
    check_command "pip"
    
    # 检查端口
    if ! check_port 8000; then
        print_error "后端端口 8000 被占用，请先停止相关服务"
        exit 1
    fi
    
    if ! check_port 3000; then
        print_error "前端端口 3000 被占用，请先停止相关服务"
        exit 1
    fi
    
    # 启动后端
    print_info "启动后端服务..."
    cd server
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        print_info "创建 Python 虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境并安装依赖
    source venv/bin/activate
    pip install -r requirements.txt
    
    # 后台启动后端服务
    nohup python startup.py > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    
    cd ..
    
    # 等待后端启动
    wait_for_service "http://localhost:8000/health" "后端服务"
    
    # 启动前端
    print_info "启动前端服务..."
    cd front
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        print_info "安装前端依赖..."
        npm install
    fi
    
    # 后台启动前端服务
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    
    cd ..
    
    # 等待前端启动
    wait_for_service "http://localhost:3000" "前端服务"
    
    print_success "开发环境启动完成！"
    print_info "前端地址: http://localhost:3000"
    print_info "后端API: http://localhost:8000/docs"
    print_info "查看日志: tail -f logs/backend.log logs/frontend.log"
}

# 生产环境启动
start_prod() {
    print_info "启动生产环境..."
    
    # 检查必要的命令
    check_command "node"
    check_command "npm"
    check_command "python3"
    check_command "nginx"
    
    # 构建前端
    print_info "构建前端应用..."
    cd front
    npm install
    npm run build
    cd ..
    
    # 启动后端
    print_info "启动后端服务..."
    cd server
    source venv/bin/activate 2>/dev/null || {
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    }
    
    export ENVIRONMENT=production
    nohup python startup.py > ../logs/backend_prod.log 2>&1 &
    echo $! > ../logs/backend_prod.pid
    cd ..
    
    # 等待后端启动
    wait_for_service "http://localhost:8000/health" "后端服务"
    
    # 启动前端
    print_info "启动前端服务..."
    cd front
    nohup npm start > ../logs/frontend_prod.log 2>&1 &
    echo $! > ../logs/frontend_prod.pid
    cd ..
    
    # 等待前端启动
    wait_for_service "http://localhost:3000" "前端服务"
    
    # 配置并启动 Nginx
    print_info "配置 Nginx..."
    
    # 检查 Nginx 配置
    sudo nginx -t -c $(pwd)/nginx.conf || {
        print_error "Nginx 配置文件有误，请检查 nginx.conf"
        exit 1
    }
    
    # 重新加载 Nginx 配置
    sudo nginx -s reload 2>/dev/null || sudo nginx -c $(pwd)/nginx.conf
    
    print_success "生产环境启动完成！"
    print_info "应用地址: http://localhost"
    print_info "API文档: http://localhost/api/docs"
}

# Docker 环境启动
start_docker() {
    print_info "启动 Docker 环境..."
    
    # 检查必要的命令
    check_command "docker"
    check_command "docker-compose"
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        print_warning ".env 文件不存在，复制示例文件..."
        cp .env.example .env
        print_warning "请编辑 .env 文件配置相关参数"
    fi
    
    # 创建日志目录
    mkdir -p logs/nginx
    
    # 构建并启动服务
    print_info "构建 Docker 镜像..."
    docker-compose build
    
    print_info "启动 Docker 服务..."
    docker-compose up -d
    
    # 等待服务启动
    sleep 10
    wait_for_service "http://localhost/health" "应用服务"
    
    print_success "Docker 环境启动完成！"
    print_info "应用地址: http://localhost"
    print_info "查看状态: docker-compose ps"
    print_info "查看日志: docker-compose logs -f"
}

# 停止服务
stop_services() {
    print_info "停止服务..."
    
    # 停止 Docker 服务
    if [ -f "docker-compose.yml" ]; then
        docker-compose down 2>/dev/null || true
    fi
    
    # 停止开发/生产环境服务
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if kill -0 $pid 2>/dev/null; then
                print_info "停止进程 $pid"
                kill $pid
            fi
            rm "$pidfile"
        fi
    done
    
    print_success "服务已停止"
}

# 显示帮助信息
show_help() {
    echo "订单系统启动脚本"
    echo ""
    echo "使用方法:"
    echo "  ./start.sh dev     - 启动开发环境"
    echo "  ./start.sh prod    - 启动生产环境"
    echo "  ./start.sh docker  - 启动 Docker 环境"
    echo "  ./start.sh stop    - 停止所有服务"
    echo "  ./start.sh help    - 显示帮助信息"
    echo ""
    echo "环境说明:"
    echo "  dev    - 开发环境，前端热重载，后端调试模式"
    echo "  prod   - 生产环境，前端构建优化，使用 Nginx 代理"
    echo "  docker - 容器化部署，一键启动完整环境"
}

# 创建必要的目录
mkdir -p logs

# 主逻辑
case "${1:-help}" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "docker")
        start_docker
        ;;
    "stop")
        stop_services
        ;;
    "help")
        show_help
        ;;
    *)
        print_error "未知参数: $1"
        show_help
        exit 1
        ;;
esac