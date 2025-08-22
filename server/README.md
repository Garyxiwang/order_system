# 订单管理系统 - 后端

基于 FastAPI + SQLAlchemy + PostgreSQL 构建的高性能订单管理系统后端 API。

## 技术栈

- **框架**: FastAPI 0.104+
- **语言**: Python 3.8+
- **数据库**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **数据迁移**: Alembic
- **认证**: JWT (JSON Web Tokens)
- **数据验证**: Pydantic
- **ASGI 服务器**: Uvicorn

## 功能模块

### 🔐 用户认证 (Authentication)
- 用户注册/登录
- JWT Token 管理
- 权限控制
- 密码加密

### 📋 订单管理 (Orders)
- 订单 CRUD 操作
- 订单状态管理
- 订单查询和筛选
- 订单统计

### 🎨 设计管理 (Design)
- 设计任务管理
- 设计进度跟踪
- 设计文件上传
- 设计审核流程

### 🏭 生产管理 (Production)
- 生产计划管理
- 生产进度监控
- 质量控制
- 生产报表

### 📊 数据分析 (Analytics)
- 订单统计分析
- 生产效率分析
- 业务报表生成
- 数据导出

## 项目结构

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py          # 用户模型
│   │   ├── order.py         # 订单模型
│   │   ├── design.py        # 设计模型
│   │   └── production.py    # 生产模型
│   ├── schemas/             # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── order.py
│   │   ├── design.py
│   │   └── production.py
│   ├── api/                 # API 路由
│   │   ├── __init__.py
│   │   ├── auth.py          # 认证路由
│   │   ├── orders.py        # 订单路由
│   │   ├── design.py        # 设计路由
│   │   └── production.py    # 生产路由
│   ├── core/                # 核心功能
│   │   ├── __init__.py
│   │   ├── auth.py          # 认证逻辑
│   │   ├── security.py      # 安全工具
│   │   └── deps.py          # 依赖注入
│   ├── crud/                # 数据库操作
│   │   ├── __init__.py
│   │   ├── base.py          # 基础 CRUD
│   │   ├── user.py
│   │   ├── order.py
│   │   ├── design.py
│   │   └── production.py
│   └── utils/               # 工具函数
│       ├── __init__.py
│       ├── logger.py        # 日志工具
│       └── helpers.py       # 辅助函数
├── alembic/                 # 数据库迁移
│   ├── versions/
│   ├── env.py
│   └── alembic.ini
├── tests/                   # 测试文件
│   ├── __init__.py
│   ├── conftest.py
│   └── test_api/
├── requirements.txt         # 依赖包
├── .env.example            # 环境变量示例
├── Dockerfile              # Docker 配置
└── README.md
```

## 开发指南

### 环境准备

1. **Python 环境**
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **数据库配置**
```bash
# 安装 PostgreSQL
# 创建数据库
createdb order_system
```

4. **环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
vim .env
```

### 开发模式

```bash
# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 数据库迁移

```bash
# 生成迁移文件
alembic revision --autogenerate -m "Initial migration"

# 执行迁移
alembic upgrade head
```

### 测试

```bash
# 运行测试
pytest

# 运行测试并生成覆盖率报告
pytest --cov=app
```

### 代码格式化

```bash
# 格式化代码
black app/

# 排序导入
isort app/

# 类型检查
mypy app/
```

## API 文档

启动服务器后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t order-system-backend .

# 运行容器
docker run -p 8000:8000 order-system-backend
```

### 生产环境

```bash
# 使用 Gunicorn 运行
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 环境变量

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost/order_system

# JWT 配置
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 应用配置
APP_NAME=订单管理系统API
DEBUG=False
ALLOWED_HOSTS=["localhost", "127.0.0.1"]

# CORS 配置
CORS_ORIGINS=["http://localhost:3000"]
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

MIT License
