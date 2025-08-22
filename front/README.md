# 订单管理系统 - 前端

基于 Next.js 14 + TypeScript + Ant Design 构建的现代化订单管理系统前端应用。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **UI 组件库**: Ant Design 5.x
- **样式**: Tailwind CSS
- **状态管理**: React Hooks
- **HTTP 客户端**: Fetch API
- **构建工具**: Next.js 内置

## 功能模块

### 🏠 仪表板 (Dashboard)
- 订单统计概览
- 数据可视化图表
- 快速操作入口

### 🎨 设计管理 (Design)
- 设计订单列表
- 订单状态筛选
- 进度跟踪
- 订单详情管理

### 🏭 生产管理 (Production)
- 生产订单管理
- 生产进度监控
- 质量控制

### 📋 分单管理 (Split)
- 订单分配
- 任务分发
- 进度跟踪

### ⚙️ 系统配置 (Config)
- 用户管理
- 权限设置
- 系统参数配置

## 项目结构

```
front/
├── src/
│   ├── app/                 # App Router 页面
│   │   ├── dashboard/       # 仪表板
│   │   ├── design/          # 设计管理
│   │   ├── production/      # 生产管理
│   │   ├── split/           # 分单管理
│   │   ├── config/          # 系统配置
│   │   ├── login/           # 登录页面
│   │   ├── layout.tsx       # 根布局
│   │   └── page.tsx         # 首页
│   ├── components/          # 公共组件
│   │   └── layout/          # 布局组件
│   ├── services/            # API 服务
│   ├── utils/               # 工具函数
│   └── middleware/          # 中间件
├── public/                  # 静态资源
├── package.json
├── next.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

## 开发指南

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

### 代码检查
```bash
npm run lint
```

## 环境配置

创建 `.env.local` 文件：

```env
# API 基础地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 其他环境变量
NEXT_PUBLIC_APP_NAME=订单管理系统
```

## 部署说明

### Vercel 部署
1. 连接 GitHub 仓库
2. 设置环境变量
3. 自动部署

### Docker 部署
```bash
# 构建镜像
docker build -t order-system-frontend .

# 运行容器
docker run -p 3000:3000 order-system-frontend
```

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### 组件开发
- 优先使用函数组件和 Hooks
- 组件名使用 PascalCase
- 文件名使用 camelCase

### API 调用
- 统一使用 services 目录下的 API 服务
- 错误处理统一管理
- 支持请求拦截和响应拦截

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License