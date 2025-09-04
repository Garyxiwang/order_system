#!/usr/bin/env python3
"""
应用启动脚本
用于 Zeabur 部署时的启动管理
"""

import os
import sys
import logging
from pathlib import Path

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def check_environment():
    """检查环境配置"""
    logger.info("🔍 检查环境配置...")
    
    # 检查Python版本
    python_version = sys.version_info
    logger.info(f"Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # 检查环境变量
    port = os.environ.get("PORT", "未设置")
    database_url = os.environ.get("DATABASE_URL", "未设置")
    environment = os.environ.get("ENVIRONMENT", "未设置")
    
    logger.info(f"端口: {port}")
    logger.info(f"数据库URL: {database_url[:50]}..." if len(str(database_url)) > 50 else f"数据库URL: {database_url}")
    logger.info(f"环境: {environment}")
    
    # 检查必要文件
    required_files = [
        "main.py",
        "app/__init__.py",
        "app/core/config.py",
        "app/core/database.py"
    ]
    
    for file_path in required_files:
        if Path(file_path).exists():
            logger.info(f"✅ {file_path} 存在")
        else:
            logger.error(f"❌ {file_path} 不存在")
            return False
    
    return True

def main():
    """主启动函数"""
    logger.info("🚀 启动订单管理系统...")
    
    # 检查环境
    if not check_environment():
        logger.error("❌ 环境检查失败")
        sys.exit(1)
    
    # 导入并启动应用
    try:
        logger.info("📦 导入应用模块...")
        from main import app
        import uvicorn
        
        # 获取配置
        port = int(os.environ.get("PORT", 8000))
        host = "0.0.0.0"
        
        logger.info(f"🌐 启动服务器 {host}:{port}")
        
        # 启动服务器
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            workers=1,
            log_level="info",
            access_log=True
        )
        
    except Exception as e:
        logger.error(f"❌ 启动失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()