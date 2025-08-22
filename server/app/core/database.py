from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# 创建数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    # SQLite特定配置
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    # 连接池配置（PostgreSQL等）
    pool_pre_ping=True,
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
    finally:
        db.close()


def create_tables():
    """创建所有数据库表"""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """删除所有数据库表（谨慎使用）"""
    Base.metadata.drop_all(bind=engine)