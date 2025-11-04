# Vant Weapp 安装指南

## 安装步骤

### 1. 使用 npm 安装

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

### 3. 修改 app.json

将 `app.json` 中的 `project.config.json` 的以下配置设置为 `false`：

```json
{
  "setting": {
    "packNpmManually": false,
    "packNpmRelationList": []
  }
}
```

### 4. 配置组件路径

组件路径已经在 `app.json` 中配置好了，无需额外配置。

## 验证安装

安装完成后，可以在页面中使用 Vant 组件，例如：

```xml
<van-button type="primary">按钮</van-button>
```

如果组件正常显示，说明安装成功。

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

- 检查是否在 `app.wxss` 中引入了 Vant 的样式（如果需要）
- 检查组件自定义样式是否正确

## 参考文档

- [Vant Weapp 官方文档](https://vant-contrib.gitee.io/vant-weapp/)
- [微信小程序 npm 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)

