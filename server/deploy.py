#!/usr/bin/env python3
"""
部署脚本
用于在云平台部署时执行必要的初始化操作

使用方法:
python deploy.py
"""

import sys
import os
from pathlib import Path
import subprocess
import time

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

import logging
from app.core.config import settings
from app.core.database import engine

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def check_environment():
    """检查环境配置"""
    logger.info("🔍 检查环境配置...")
    
    # 检查必要的环境变量
    required_vars = ['DATABASE_URL']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ 缺少必要的环境变量: {', '.join(missing_vars)}")
        return False
    
    logger.info("✅ 环境配置检查通过")
    return True


def wait_for_database(max_retries=30, retry_interval=2):
    """等待数据库可用"""
    logger.info("⏳ 等待数据库连接...")
    
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            logger.info("✅ 数据库连接成功")
            return True
        except Exception as e:
            logger.warning(f"⚠️  数据库连接失败 (尝试 {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_interval)
    
    logger.error("❌ 数据库连接超时")
    return False


def run_database_initialization():
    """运行数据库初始化"""
    logger.info("🗄️  开始数据库初始化...")
    
    try:
        # 运行数据库迁移
        logger.info("📋 运行数据库迁移...")
        result = subprocess.run(
            [sys.executable, "migrate_db.py"],
            cwd=project_root,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"❌ 数据库迁移失败: {result.stderr}")
            return False
        
        logger.info("✅ 数据库迁移完成")
        
        # 运行数据库初始化
        logger.info("👤 初始化数据库数据...")
        result = subprocess.run(
            [sys.executable, "init_db.py"],
            cwd=project_root,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"❌ 数据库初始化失败: {result.stderr}")
            return False
        
        logger.info("✅ 数据库初始化完成")
        return True
        
    except Exception as e:
        logger.error(f"❌ 数据库初始化过程失败: {e}")
        return False


def install_dependencies():
    """安装Python依赖"""
    logger.info("📦 检查Python依赖...")
    
    try:
        # 检查requirements.txt是否存在
        requirements_file = project_root / "requirements.txt"
        if not requirements_file.exists():
            logger.warning("⚠️  requirements.txt 文件不存在")
            return True
        
        # 安装依赖
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            cwd=project_root,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            logger.error(f"❌ 依赖安装失败: {result.stderr}")
            return False
        
        logger.info("✅ Python依赖安装完成")
        return True
        
    except Exception as e:
        logger.error(f"❌ 依赖安装过程失败: {e}")
        return False


def create_upload_directories():
    """创建上传目录"""
    logger.info("📁 创建必要的目录...")
    
    try:
        directories = [
            project_root / "uploads",
            project_root / "logs",
            project_root / "static"
        ]
        
        for directory in directories:
            directory.mkdir(exist_ok=True)
            logger.info(f"✅ 创建目录: {directory}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ 目录创建失败: {e}")
        return False


def health_check():
    """健康检查"""
    logger.info("🏥 执行健康检查...")
    
    try:
        # 检查数据库连接
        with engine.connect() as conn:
            result = conn.execute("SELECT COUNT(*) FROM users")
            user_count = result.scalar()
            logger.info(f"✅ 数据库连接正常，用户数量: {user_count}")
        
        # 检查必要文件
        required_files = [
            "main.py",
            "requirements.txt",
            "app/__init__.py"
        ]
        
        for file_path in required_files:
            if not (project_root / file_path).exists():
                logger.error(f"❌ 缺少必要文件: {file_path}")
                return False
        
        logger.info("✅ 健康检查通过")
        return True
        
    except Exception as e:
        logger.error(f"❌ 健康检查失败: {e}")
        return False


def main():
    """主部署流程"""
    logger.info("🚀 开始部署流程...")
    
    steps = [
        ("环境检查", check_environment),
        ("创建目录", create_upload_directories),
        ("安装依赖", install_dependencies),
        ("等待数据库", wait_for_database),
        ("数据库初始化", run_database_initialization),
        ("健康检查", health_check)
    ]
    
    for step_name, step_func in steps:
        logger.info(f"📋 执行步骤: {step_name}")
        
        try:
            if not step_func():
                logger.error(f"❌ 步骤失败: {step_name}")
                return False
        except Exception as e:
            logger.error(f"❌ 步骤异常: {step_name} - {e}")
            return False
    
    logger.info("🎉 部署完成！")
    logger.info("")
    logger.info("📝 部署信息:")
    logger.info(f"   项目名称: {settings.PROJECT_NAME}")
    logger.info(f"   API版本: {settings.API_V1_STR}")
    logger.info(f"   数据库: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'SQLite'}")
    logger.info("   默认管理员: admin / admin123")
    logger.info("   测试账号: test / test123")
    logger.info("")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)