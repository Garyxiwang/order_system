#!/bin/bash

# Nginx 代理测试脚本
# 用于验证前后端通过 Nginx 代理的通信是否正常

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 打印函数
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 测试配置
NGINX_URL="http://localhost"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"

# 测试函数
test_service() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    print_info "测试 $name: $url"
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        status_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$status_code" = "$expected_status" ]; then
            print_success "$name 响应正常 (状态码: $status_code)"
            return 0
        else
            print_warning "$name 状态码异常: $status_code (期望: $expected_status)"
            return 1
        fi
    else
        print_error "$name 无法访问"
        return 1
    fi
}

# 测试 JSON API
test_json_api() {
    local url=$1
    local name=$2
    
    print_info "测试 $name JSON API: $url"
    
    if response=$(curl -s -H "Accept: application/json" "$url" 2>/dev/null); then
        if echo "$response" | python3 -m json.tool >/dev/null 2>&1; then
            print_success "$name JSON API 响应正常"
            return 0
        else
            print_warning "$name 响应不是有效的 JSON"
            echo "响应内容: $response"
            return 1
        fi
    else
        print_error "$name JSON API 无法访问"
        return 1
    fi
}

# 主测试流程
main() {
    print_info "开始测试 Nginx 代理配置..."
    echo ""
    
    # 测试计数器
    total_tests=0
    passed_tests=0
    
    # 1. 测试直接服务访问
    print_info "=== 测试直接服务访问 ==="
    
    # 测试后端健康检查
    total_tests=$((total_tests + 1))
    if test_service "$BACKEND_URL/health" "后端健康检查"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # 测试后端 API 文档
    total_tests=$((total_tests + 1))
    if test_service "$BACKEND_URL/docs" "后端 API 文档"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # 测试前端服务
    total_tests=$((total_tests + 1))
    if test_service "$FRONTEND_URL" "前端服务"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    echo ""
    
    # 2. 测试 Nginx 代理访问
    print_info "=== 测试 Nginx 代理访问 ==="
    
    # 测试前端页面代理
    total_tests=$((total_tests + 1))
    if test_service "$NGINX_URL" "Nginx 前端代理"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # 测试后端 API 代理
    total_tests=$((total_tests + 1))
    if test_service "$NGINX_URL/api/health" "Nginx 后端 API 代理"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # 测试 API 文档代理
    total_tests=$((total_tests + 1))
    if test_service "$NGINX_URL/api/docs" "Nginx API 文档代理"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    echo ""
    
    # 3. 测试 API 功能
    print_info "=== 测试 API 功能 ==="
    
    # 测试用户 API（如果存在）
    total_tests=$((total_tests + 1))
    if test_json_api "$NGINX_URL/api/users" "用户 API"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # 测试订单 API（如果存在）
    total_tests=$((total_tests + 1))
    if test_json_api "$NGINX_URL/api/orders" "订单 API"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    echo ""
    
    # 4. 测试静态资源
    print_info "=== 测试静态资源 ==="
    
    # 测试 favicon
    total_tests=$((total_tests + 1))
    if test_service "$NGINX_URL/favicon.ico" "Favicon" "200"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    echo ""
    
    # 5. 性能测试
    print_info "=== 性能测试 ==="
    
    # 测试响应时间
    print_info "测试响应时间..."
    
    # 前端响应时间
    if command -v curl >/dev/null 2>&1; then
        frontend_time=$(curl -o /dev/null -s -w "%{time_total}" "$NGINX_URL" 2>/dev/null || echo "N/A")
        print_info "前端响应时间: ${frontend_time}s"
        
        # API 响应时间
        api_time=$(curl -o /dev/null -s -w "%{time_total}" "$NGINX_URL/api/health" 2>/dev/null || echo "N/A")
        print_info "API 响应时间: ${api_time}s"
    fi
    
    echo ""
    
    # 6. 并发测试（简单版本）
    print_info "=== 并发测试 ==="
    
    print_info "执行简单并发测试..."
    concurrent_requests=5
    success_count=0
    
    for i in $(seq 1 $concurrent_requests); do
        if curl -s "$NGINX_URL/api/health" >/dev/null 2>&1; then
            success_count=$((success_count + 1))
        fi &
    done
    
    wait  # 等待所有后台任务完成
    
    print_info "并发请求成功率: $success_count/$concurrent_requests"
    
    echo ""
    
    # 测试结果汇总
    print_info "=== 测试结果汇总 ==="
    
    if [ $passed_tests -eq $total_tests ]; then
        print_success "所有测试通过! ($passed_tests/$total_tests)"
        print_success "Nginx 代理配置正常，前后端通信正常！"
        exit 0
    else
        print_warning "部分测试失败: $passed_tests/$total_tests"
        
        if [ $passed_tests -eq 0 ]; then
            print_error "所有测试都失败了，请检查服务是否正常启动"
        else
            print_warning "请检查失败的服务配置"
        fi
        
        echo ""
        print_info "故障排除建议:"
        echo "1. 检查服务是否启动: ./start.sh dev"
        echo "2. 检查端口占用: lsof -i :80 -i :3000 -i :8000"
        echo "3. 检查 Nginx 配置: sudo nginx -t"
        echo "4. 查看服务日志: tail -f logs/*.log"
        echo "5. 检查防火墙设置"
        
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    if ! command -v curl >/dev/null 2>&1; then
        print_error "curl 未安装，请先安装 curl"
        exit 1
    fi
    
    if ! command -v python3 >/dev/null 2>&1; then
        print_warning "python3 未安装，JSON 验证功能将被跳过"
    fi
}

# 显示帮助
show_help() {
    echo "Nginx 代理测试脚本"
    echo ""
    echo "使用方法:"
    echo "  ./test_proxy.sh        - 运行完整测试"
    echo "  ./test_proxy.sh help   - 显示帮助信息"
    echo ""
    echo "测试内容:"
    echo "  - 直接服务访问测试"
    echo "  - Nginx 代理访问测试"
    echo "  - API 功能测试"
    echo "  - 静态资源测试"
    echo "  - 性能测试"
    echo "  - 并发测试"
    echo ""
    echo "注意事项:"
    echo "  - 请确保服务已启动 (./start.sh dev|prod|docker)"
    echo "  - 请确保 Nginx 已配置并运行"
    echo "  - 测试需要 curl 命令支持"
}

# 主入口
case "${1:-test}" in
    "test")
        check_dependencies
        main
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