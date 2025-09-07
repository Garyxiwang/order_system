#!/usr/bin/env python3
"""
数据库迁移脚本
用于处理数据库结构变更和数据迁移

使用方法:
python migrate_db.py
"""

import sys
import os
from pathlib import Path
from datetime import datetime

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.database import SessionLocal, engine
from app.models import Base
from sqlalchemy import text, inspect
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseMigrator:
    """数据库迁移器"""
    
    def __init__(self):
        self.db = SessionLocal()
        self.inspector = inspect(engine)
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()
    
    def table_exists(self, table_name: str) -> bool:
        """检查表是否存在"""
        return table_name in self.inspector.get_table_names()
    
    def column_exists(self, table_name: str, column_name: str) -> bool:
        """检查列是否存在"""
        if not self.table_exists(table_name):
            return False
        columns = [col['name'] for col in self.inspector.get_columns(table_name)]
        return column_name in columns
    
    def add_column_if_not_exists(self, table_name: str, column_definition: str):
        """如果列不存在则添加"""
        column_name = column_definition.split()[0]
        if not self.column_exists(table_name, column_name):
            try:
                sql = f"ALTER TABLE {table_name} ADD COLUMN {column_definition}"
                self.db.execute(text(sql))
                self.db.commit()
                logger.info(f"✅ 添加列 {table_name}.{column_name}")
            except Exception as e:
                logger.error(f"❌ 添加列失败 {table_name}.{column_name}: {e}")
                self.db.rollback()
                raise
        else:
            logger.info(f"⏭️  列已存在 {table_name}.{column_name}")
    
    def create_migration_table(self):
        """创建迁移记录表"""
        if not self.table_exists('migrations'):
            sql = """
            CREATE TABLE migrations (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                version VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            self.db.execute(text(sql))
            self.db.commit()
            logger.info("✅ 创建迁移记录表")
    
    def is_migration_applied(self, version: str) -> bool:
        """检查迁移是否已应用"""
        if not self.table_exists('migrations'):
            return False
        result = self.db.execute(
            text("SELECT COUNT(*) FROM migrations WHERE version = :version"),
            {"version": version}
        ).scalar()
        return result > 0
    
    def record_migration(self, version: str, description: str):
        """记录迁移"""
        self.db.execute(
            text("INSERT INTO migrations (version, description) VALUES (:version, :description)"),
            {"version": version, "description": description}
        )
        self.db.commit()
        logger.info(f"✅ 记录迁移 {version}: {description}")
    
    def run_migration_v1_0_1(self):
        """迁移 v1.0.1: 添加用户表的额外字段"""
        version = "v1.0.1"
        description = "添加用户表的额外字段"
        
        if self.is_migration_applied(version):
            logger.info(f"⏭️  迁移 {version} 已应用")
            return
        
        logger.info(f"🔄 应用迁移 {version}: {description}")
        
        # 添加用户表的额外字段（如果需要）
        if self.table_exists('users'):
            # 示例：添加电话号码字段
            self.add_column_if_not_exists('users', 'phone VARCHAR(20)')
            # 示例：添加最后登录时间字段
            self.add_column_if_not_exists('users', 'last_login_at TIMESTAMP')
        
        self.record_migration(version, description)
    
    def run_migration_v1_0_2(self):
        """迁移 v1.0.2: 优化订单表结构"""
        version = "v1.0.2"
        description = "优化订单表结构"
        
        if self.is_migration_applied(version):
            logger.info(f"⏭️  迁移 {version} 已应用")
            return
        
        logger.info(f"🔄 应用迁移 {version}: {description}")
        
        # 添加订单表的索引（如果需要）
        if self.table_exists('orders'):
            try:
                # 示例：为订单号添加索引
                self.db.execute(text("CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)"))
                # 示例：为客户ID添加索引
                self.db.execute(text("CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)"))
                self.db.commit()
                logger.info("✅ 添加订单表索引")
            except Exception as e:
                logger.error(f"❌ 添加索引失败: {e}")
                self.db.rollback()
        
        self.record_migration(version, description)
    
    def run_migration_v1_0_3(self):
        """迁移 v1.0.3: 修改订单表字段类型"""
        version = "v1.0.3"
        description = "修改订单表字段类型：order_date改为可选，order_type和design_cycle改为字符串"
        
        if self.is_migration_applied(version):
            logger.info(f"⏭️  迁移 {version} 已应用")
            return
        
        logger.info(f"🔄 应用迁移 {version}: {description}")
        
        if self.table_exists('orders'):
            try:
                # 修改 order_date 为可选 (MySQL语法)
                self.db.execute(text("ALTER TABLE orders MODIFY COLUMN order_date DATETIME NULL"))
                logger.info("✅ order_date 字段改为可选")
                
                # 修改 order_type 为字符串类型 (MySQL语法)
                self.db.execute(text("ALTER TABLE orders MODIFY COLUMN order_type VARCHAR(50) NOT NULL"))
                logger.info("✅ order_type 字段改为字符串类型")
                
                # 修改 design_cycle 为字符串类型并设置默认值 (MySQL语法)
                self.db.execute(text("ALTER TABLE orders MODIFY COLUMN design_cycle VARCHAR(50) NOT NULL DEFAULT '0'"))
                logger.info("✅ design_cycle 字段改为字符串类型并设置默认值")
                
                self.db.commit()
                
            except Exception as e:
                logger.error(f"❌ 修改订单表字段失败: {e}")
                self.db.rollback()
                raise
        
        self.record_migration(version, description)
    
    def run_all_migrations(self):
        """运行所有迁移"""
        logger.info("🚀 开始数据库迁移...")
        
        # 创建迁移记录表
        self.create_migration_table()
        
        # 按顺序运行所有迁移
        migrations = [
            self.run_migration_v1_0_1,
            self.run_migration_v1_0_2,
            self.run_migration_v1_0_3,
            # 在这里添加新的迁移方法
        ]
        
        for migration in migrations:
            try:
                migration()
            except Exception as e:
                logger.error(f"❌ 迁移失败: {e}")
                raise
        
        logger.info("🎉 数据库迁移完成！")


def main():
    """主函数"""
    try:
        with DatabaseMigrator() as migrator:
            migrator.run_all_migrations()
        return True
    except Exception as e:
        logger.error(f"❌ 迁移过程失败: {e}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)