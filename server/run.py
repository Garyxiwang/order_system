#!/usr/bin/env python3
"""
订单管理系统后端服务启动脚本
"""

import uvicorn
import argparse
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent))

from app.core.config import settings


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="启动订单管理系统后端服务")
    parser.add_argument(
        "--host", 
        default=settings.HOST, 
        help=f"服务器主机地址 (默认: {settings.HOST})"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=settings.PORT, 
        help=f"服务器端口 (默认: {settings.PORT})"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        default=settings.DEBUG,
        help="启用热重载 (开发模式)"
    )
    parser.add_argument(
        "--log-level", 
        default=settings.LOG_LEVEL.lower(), 
        choices=["debug", "info", "warning", "error", "critical"],
        help=f"日志级别 (默认: {settings.LOG_LEVEL.lower()})"
    )
    
    args = parser.parse_args()
    
    print(f"🚀 启动 {settings.PROJECT_NAME} 后端服务...")
    print(f"📍 服务地址: http://{args.host}:{args.port}")
    print(f"📚 API文档: http://{args.host}:{args.port}{settings.API_V1_STR}/docs")
    print(f"🔄 热重载: {'启用' if args.reload else '禁用'}")
    print(f"📝 日志级别: {args.log_level.upper()}")
    print("-" * 50)
    
    # 启动服务器
    uvicorn.run(
        "main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level=args.log_level,
        access_log=True
    )


if __name__ == "__main__":
    main()