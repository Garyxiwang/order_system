# 订单管理系统 (Order Management System)

一个基于前后端分离架构的订单管理系统。

## 项目结构

```
order_system/
├── front/          # 前端项目 (Next.js + TypeScript)
│   ├── src/        # 源代码
│   ├── public/     # 静态资源
│   └── package.json
├── server/         # 后端项目 (FastAPI + Python)
│   ├── app/        # 应用代码
│   └── requirements.txt
├── logs/           # 日志文件
└── package.json    # 工作区配置
```

## 技术栈

- **Next.js**: React框架，提供服务端渲染、路由等功能
- **TypeScript**: JavaScript的超集，提供类型检查
- **Ant Design**: 企业级UI设计语言和React组件库
- **Tailwind CSS**: 实用优先的CSS框架

## 项目结构

```
src/
├── app/              # Next.js应用目录
│   ├── globals.css   # 全局样式
│   ├── layout.tsx    # 应用布局
│   └── page.tsx      # 首页
├── components/       # 组件目录
│   ├── AntdRegistry.tsx  # Ant Design服务端渲染支持
│   ├── layout/       # 布局相关组件
│   │   └── Navbar.tsx    # 导航栏组件
│   └── order/        # 订单相关组件
│       └── OrderList.tsx  # 订单列表组件
└── ...
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 分支管理

1. main 主分支，发布分支
2. dev-quotation 开发报价系统分支

## 功能

- 订单管理：查看、创建、编辑和删除订单
- 客户管理：管理客户信息
- 系统设置：配置系统参数

## 后续开发计划

- 完善订单管理功能
- 添加用户认证和权限控制
- 集成后端API
- 添加数据可视化功能
