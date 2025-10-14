import time
import logging
import logging.handlers
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

# 配置日志
timed_handler = logging.handlers.TimedRotatingFileHandler(
    filename="logs/app.log",
    when="D",           # 按天滚动
    interval=1,          # 每1天滚动一次
    backupCount=2,       # 最多保留2天的旧日志
    encoding="utf-8"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        timed_handler,
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """日志中间件"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 记录请求开始时间
        start_time = time.time()
        
        # 记录请求信息
        logger.info(
            f"请求开始 - {request.method} {request.url} - "
            f"客户端IP: {request.client.host if request.client else 'unknown'}"
        )
        
        # 处理请求
        response = await call_next(request)
        
        # 计算处理时间
        process_time = time.time() - start_time
        
        # 记录响应信息
        logger.info(
            f"请求完成 - {request.method} {request.url} - "
            f"状态码: {response.status_code} - "
            f"处理时间: {process_time:.4f}s"
        )
        
        # 添加处理时间到响应头
        response.headers["X-Process-Time"] = str(process_time)
        
        return response