# SSL证书和Nginx配置部署说明

## 概述

本目录包含用于部署SSL证书和Nginx配置的脚本。

## 服务器信息

- 服务器地址: `root@106.54.235.3`
- 域名: `www.greenspring-order.cn`
- SSL证书目录: `/etc/nginx/ssl`
- Nginx配置目录: `/etc/nginx`

## 部署脚本

### 1. deploy-ssl.sh
上传SSL证书到服务器。

**功能:**
- 解压证书zip文件
- 创建SSL证书目录
- 上传证书文件到服务器
- 设置正确的文件权限
- 验证nginx配置

**使用方法:**
```bash
cd cloud-deployment/scripts
./deploy-ssl.sh
```

### 2. deploy-nginx.sh
部署Nginx配置文件到服务器。

**功能:**
- 备份当前nginx配置
- 上传新的nginx配置文件
- 测试nginx配置
- 重载nginx服务

**使用方法:**
```bash
cd cloud-deployment/scripts
./deploy-nginx.sh
```

### 3. deploy-all.sh
一键部署SSL证书和Nginx配置。

**使用方法:**
```bash
cd cloud-deployment/scripts
./deploy-all.sh
```

## 部署步骤

### 方式一：一键部署（推荐）

```bash
cd cloud-deployment/scripts
./deploy-all.sh
```

### 方式二：分步部署

1. **部署SSL证书:**
   ```bash
   cd cloud-deployment/scripts
   ./deploy-ssl.sh
   ```

2. **部署Nginx配置:**
   ```bash
   ./deploy-nginx.sh
   ```

## 前置要求

1. **SSH密钥配置**
   - 确保已配置SSH密钥，可以无密码登录服务器
   - 或使用 `ssh-copy-id root@106.54.235.3` 配置密钥

2. **证书文件**
   - 确保 `www.greenspring-order.cn_nginx.zip` 文件在项目根目录

3. **服务器权限**
   - 确保有root权限或sudo权限

## 验证部署

部署完成后，可以通过以下方式验证：

1. **检查SSL证书:**
   ```bash
   ssh root@106.54.235.3 "ls -la /etc/nginx/ssl/"
   ```

2. **检查Nginx配置:**
   ```bash
   ssh root@106.54.235.3 "nginx -t"
   ```

3. **检查Nginx状态:**
   ```bash
   ssh root@106.54.235.3 "systemctl status nginx"
   ```

4. **访问网站:**
   - 打开浏览器访问: `https://www.greenspring-order.cn`
   - 检查浏览器地址栏是否显示SSL锁图标

## 故障排查

### 问题1: SSH连接失败
- 检查网络连接
- 确认服务器IP地址正确
- 检查SSH密钥配置

### 问题2: 证书文件权限错误
- 确保私钥文件权限为 600
- 确保证书文件权限为 644

### 问题3: Nginx配置测试失败
- 检查nginx配置文件语法
- 查看nginx错误日志: `ssh root@106.54.235.3 "tail -f /var/log/nginx/error.log"`

### 问题4: SSL证书不生效
- 确认证书文件路径正确
- 检查证书文件是否存在
- 确认域名配置正确
- 重启nginx服务: `ssh root@106.54.235.3 "systemctl restart nginx"`

## 注意事项

1. **备份配置**: 脚本会自动备份nginx配置，备份文件位于 `/etc/nginx/nginx.conf.backup.*`

2. **证书有效期**: 定期检查SSL证书有效期，及时更新证书

3. **防火墙**: 确保服务器防火墙已开放443端口（HTTPS）

4. **域名解析**: 确保域名 `www.greenspring-order.cn` 已正确解析到服务器IP

## 证书文件说明

- `www.greenspring-order.cn_bundle.pem`: SSL证书链文件（包含证书和中间证书）
- `www.greenspring-order.cn.key`: SSL私钥文件
- `www.greenspring-order.cn.csr`: 证书签名请求文件（部署时不需要）

## 更新日志

- 2025-11-26: 初始版本，支持SSL证书和Nginx配置部署

