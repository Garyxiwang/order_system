#!/usr/bin/env python3
"""
数据库初始化脚本
用于在部署时初始化数据库表和创建初始数据

使用方法:
python init_db.py
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.database import create_tables, create_initial_data, engine
from app.models import Base
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def init_database():
    """初始化数据库"""
    try:
        logger.info("🚀 开始初始化数据库...")
        
        # 检查数据库连接
        logger.info("📡 检查数据库连接...")
        with engine.connect() as conn:
            logger.info("✅ 数据库连接成功")
        
        # 创建数据库表
        logger.info("📋 创建数据库表...")
        create_tables()
        logger.info("✅ 数据库表创建成功")
        
        # 创建初始数据
        logger.info("👤 创建初始数据...")
        create_initial_data()
        logger.info("✅ 初始数据创建成功")
        
        logger.info("🎉 数据库初始化完成！")
        
        # 显示默认用户信息
        logger.info("")
        logger.info("📝 默认用户信息:")
        logger.info("   管理员账号: admin / admin123")
        logger.info("   测试账号: test / test123")
        logger.info("")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {e}")
        return False


def reset_database():
    """重置数据库（删除所有表并重新创建）"""
    try:
        logger.warning("⚠️  准备重置数据库（这将删除所有数据）...")
        
        # 删除所有表
        logger.info("🗑️  删除现有数据库表...")
        Base.metadata.drop_all(bind=engine)
        logger.info("✅ 数据库表删除成功")
        
        # 重新初始化
        return init_database()
        
    except Exception as e:
        logger.error(f"❌ 数据库重置失败: {e}")
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="数据库初始化脚本")
    parser.add_argument(
        "--reset", 
        action="store_true", 
        help="重置数据库（删除所有数据并重新创建）"
    )
    
    args = parser.parse_args()
    
    if args.reset:
        # 确认重置操作
        confirm = input("⚠️  确定要重置数据库吗？这将删除所有数据！(y/N): ")
        if confirm.lower() in ['y', 'yes']:
            success = reset_database()
        else:
            logger.info("❌ 操作已取消")
            success = False
    else:
        success = init_database()
    
    # 退出码
    sys.exit(0 if success else 1)