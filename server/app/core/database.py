from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)

# 创建数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    # SQLite特定配置
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    # 连接池配置（PostgreSQL等）
    pool_pre_ping=True,
    pool_recycle=300,  # 连接回收时间
    pool_size=10,      # 连接池大小
    max_overflow=20,   # 最大溢出连接数
    echo=settings.DEBUG  # 开发环境下打印SQL语句
)

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 创建基础模型类
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """获取数据库会话的依赖注入函数"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """创建所有数据库表"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise


def create_initial_data():
    """创建初始数据"""
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    
    db = SessionLocal()
    try:
        # 检查是否已有管理员用户
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            # 创建默认管理员用户
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                full_name="系统管理员",
                role=UserRole.ADMIN,
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(admin_user)
            
        # 检查是否已有测试用户
        test_user = db.query(User).filter(User.username == "test").first()
        if not test_user:
            # 创建测试用户
            test_user = User(
                username="test",
                email="test@example.com",
                hashed_password=get_password_hash("test123"),
                full_name="测试用户",
                role=UserRole.USER,
                is_active=True,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            db.add(test_user)
            
        db.commit()
        logger.info("Initial data created successfully")
        
    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def drop_tables():
    """删除所有数据库表（谨慎使用）"""
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Database tables dropped successfully")
    except Exception as e:
        logger.error(f"Error dropping tables: {e}")
        raise