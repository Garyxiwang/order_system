FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖和构建工具
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    build-essential \
    rustc \
    cargo \
    && rm -rf /var/lib/apt/lists/*

# 升级pip和构建工具
RUN pip install --upgrade pip setuptools wheel

# 先安装容易出问题的包
RUN pip install --no-cache-dir \
    "pydantic>=2.0.0,<3.0.0" \
    "psycopg2-binary>=2.9.0" \
    "mysqlclient>=2.2.0"

# 复制requirements文件并安装其他Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["python", "main.py"]