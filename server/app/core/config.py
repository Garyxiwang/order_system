from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings
import os
from pathlib import Path


class Settings(BaseSettings):
    """应用配置类"""
    
    # 项目基本信息
    PROJECT_NAME: str = "订单管理系统"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "订单管理系统后端API服务"
    
    # API配置
    API_V1_STR: str = "/api/v1"
    
    # 服务器配置
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # 数据库配置
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./order_system.db")
    # 生产环境可以使用PostgreSQL
    # DATABASE_URL: str = "postgresql://user:password@localhost/order_system"
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 3306
    DATABASE_NAME: str = "order_system"
    DATABASE_USER: str = "root"
    DATABASE_PASSWORD: str = ""
    
    # CORS配置
    BACKEND_CORS_ORIGINS: str = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:8080,http://127.0.0.1:8080")
    
    def get_cors_origins(self) -> List[str]:
        """获取CORS源列表"""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
    
    # JWT配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-jwt-secret-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    # 分页配置
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建配置实例
settings = Settings()

# 确保必要的目录存在
Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
Path("logs").mkdir(exist_ok=True)