# 订单助手 - 小程序版

这是一个基于微信小程序的订单查看系统，使用 **Vant Weapp** UI 组件库，提供了完整的订单查询流程：登录 → 筛选 → 列表 → 详情。

## 技术栈

- **UI组件库**: [Vant Weapp](https://vant-contrib.gitee.io/vant-weapp/) - 轻量、可靠的小程序 UI 组件库
- **开发框架**: 微信小程序原生框架
- **样式**: WXSS + Vant Weapp 主题

## 功能特性

- ✅ 用户登录（系统内用户）
- ✅ 筛选页面（订单编号、客户名称、设计师、销售员、订单状态、订单类型、拆单员、报价状态等）
- ✅ 订单列表（卡片式展示，使用 Vant Card 组件）
- ✅ 订单详情（完整信息展示，使用 Vant Cell 组件）
- ✅ 下拉刷新
- ✅ 上拉加载更多
- ✅ 现代化的 UI 设计

## 安装 Vant Weapp

### 1. 安装依赖

在项目根目录（`miniprogram` 目录）下执行：

```bash
npm install @vant/weapp -S --production
```

### 2. 构建 npm

1. 在微信开发者工具中，点击菜单栏：**工具** → **构建 npm**
2. 构建完成后，会在项目根目录生成 `miniprogram_npm` 文件夹
3. 如果构建失败，可以尝试：
   - 删除 `miniprogram_npm` 文件夹
   - 删除 `node_modules` 文件夹
   - 重新执行 `npm install`
   - 再次点击"构建 npm"

### 3. 配置组件路径

组件路径已经在 `app.json` 中配置好了，无需额外配置。

## 项目结构

```
miniprogram/
├── app.js                 # 小程序入口文件
├── app.json              # 小程序全局配置（包含 Vant 组件配置）
├── app.wxss              # 小程序全局样式
├── package.json          # npm 依赖配置
├── pages/                # 页面目录
│   ├── login/            # 登录页（使用 Vant Field、Button）
│   ├── filter/           # 筛选页（使用 Vant Field、Checkbox、Radio）
│   ├── order-list/       # 订单列表页（使用 Vant Card、Tag、Empty、Loading）
│   └── order-detail/     # 订单详情页（使用 Vant Cell、Tag、Divider）
├── services/             # 服务层
│   ├── authService.js    # 认证服务
│   └── orderService.js   # 订单服务
├── utils/                # 工具函数
│   ├── api.js            # API请求封装
│   ├── config.js         # 配置文件
│   └── util.js           # 工具函数
└── INSTALL.md            # Vant 安装指南
```

## 页面流程

### 1. 登录页面 (`pages/login`)
- 使用 **Vant Field** 组件输入用户名和密码
- 使用 **Vant Button** 组件登录按钮
- 登录成功后跳转到筛选页

### 2. 筛选页面 (`pages/filter`)
- 使用 **Vant Field** 组件输入文本筛选条件
- 使用 **Vant Checkbox** 和 **CheckboxGroup** 多选
- 使用 **Vant Radio** 和 **RadioGroup** 单选
- 使用 **Vant Cell** 和 **CellGroup** 组织表单
- 使用 **Vant Button** 操作按钮

### 3. 订单列表页面 (`pages/order-list`)
- 使用 **Vant Card** 组件展示订单卡片
- 使用 **Vant Tag** 组件显示订单状态
- 使用 **Vant Empty** 组件显示空状态
- 使用 **Vant Loading** 组件显示加载状态
- 使用 **Vant Divider** 组件分隔内容

### 4. 订单详情页面 (`pages/order-detail`)
- 使用 **Vant Cell** 和 **CellGroup** 组织信息
- 使用 **Vant Tag** 组件显示状态标签
- 使用 **Vant Divider** 组件分隔内容
- 使用 **Vant Empty** 组件显示错误状态

## 快速开始

### 1. 安装 Vant Weapp

```bash
cd miniprogram
npm install @vant/weapp -S --production
```

### 2. 构建 npm

在微信开发者工具中：
- 点击菜单栏：**工具** → **构建 npm**
- 等待构建完成

### 3. 配置API地址

修改 `utils/config.js` 文件中的 `baseURL`：

```javascript
const config = {
  baseURL: 'http://your-domain.com/api/v1',
  // ...
};
```

### 4. 配置小程序AppID

修改 `project.config.json` 文件中的 `appid`：

```json
{
  "appid": "你的小程序AppID"
}
```

### 5. 使用微信开发者工具打开

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择 `miniprogram` 目录
4. 点击"确定"

## Vant Weapp 组件使用

### 已使用的组件

- **Button** - 按钮组件
- **Field** - 输入框组件
- **Cell** - 单元格组件
- **CellGroup** - 单元格组组件
- **Checkbox** - 复选框组件
- **CheckboxGroup** - 复选框组组件
- **Radio** - 单选框组件
- **RadioGroup** - 单选框组组件
- **Tag** - 标签组件
- **Card** - 卡片组件
- **Empty** - 空状态组件
- **Loading** - 加载组件
- **Divider** - 分割线组件

### 组件配置

所有组件已在 `app.json` 的 `usingComponents` 中配置，可以直接使用：

```xml
<van-button type="primary">按钮</van-button>
<van-field label="用户名" placeholder="请输入用户名" />
```

## 样式定制

### Vant 主题色

Vant Weapp 默认主题色为 `#1989fa`，可以通过修改 CSS 变量自定义：

```css
/* 在 app.wxss 中 */
page {
  --button-primary-background-color: #1890ff;
  --tag-primary-color: #1890ff;
}
```

### 自定义样式

- 使用 `custom-class` 属性可以自定义组件样式
- 使用 `custom-style` 属性可以设置内联样式

## 常见问题

### 1. 构建 npm 失败

- 确保项目根目录下有 `package.json` 文件
- 确保已执行 `npm install`
- 尝试删除 `miniprogram_npm` 和 `node_modules` 后重新安装

### 2. 组件不显示

- 检查 `app.json` 中的 `usingComponents` 配置是否正确
- 检查组件路径是否正确（`@vant/weapp/xxx/index`）
- 确保已执行"构建 npm"操作

### 3. 样式不生效

- 检查组件自定义样式是否正确
- 使用 `custom-class` 或 `custom-style` 进行样式定制

## 开发说明

### 代码规范

- 使用 ES6+ 语法
- 遵循微信小程序开发规范
- 使用 Vant Weapp 组件规范
- 统一使用 rpx 作为尺寸单位

### 样式规范

- 使用 Vant Weapp 主题色系
- 统一字体大小（标题：32rpx，正文：28rpx，小字：26rpx）
- 使用 flex 布局

### 错误处理

- API请求统一错误处理
- 网络错误提示
- 空数据状态展示（使用 Vant Empty）
- 加载状态展示（使用 Vant Loading）

## 参考文档

- [Vant Weapp 官方文档](https://vant-contrib.gitee.io/vant-weapp/)
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [微信小程序 npm 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)

## 许可证

MIT License
