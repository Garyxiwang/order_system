# Docker环境SSL和Nginx部署说明

## 概述

本目录包含用于Docker环境部署SSL证书和Nginx配置的脚本。

## 服务器信息

- 服务器地址: `root@106.54.235.3`
- 域名: `www.greenspring-order.cn`
- 部署方式: Docker Compose

## Docker部署架构

根据 `docker-compose.production.yml`，nginx配置和SSL证书的挂载路径为：

- Nginx配置: `./nginx/nginx.conf:/etc/nginx/nginx.conf:ro`
- SSL证书: `./ssl:/etc/nginx/ssl:ro`

## 部署脚本

### 1. deploy-docker-ssl.sh
上传SSL证书到服务器的docker-compose目录。

**功能:**
- 自动检测docker-compose部署目录
- 解压证书zip文件
- 创建SSL证书目录
- 上传证书文件到服务器
- 设置正确的文件权限

**使用方法:**
```bash
cd cloud-deployment/scripts
./deploy-docker-ssl.sh
```

### 2. deploy-docker-nginx.sh
部署Nginx配置文件到服务器的docker-compose目录并重启容器。

**功能:**
- 自动检测docker-compose部署目录
- 备份当前nginx配置
- 上传新的nginx配置文件
- 在容器内测试nginx配置
- 重启nginx容器

**使用方法:**
```bash
cd cloud-deployment/scripts
./deploy-docker-nginx.sh
```

### 3. deploy-docker-all.sh
一键部署SSL证书和Nginx配置。

**使用方法:**
```bash
cd cloud-deployment/scripts
./deploy-docker-all.sh
```

## 部署步骤

### 方式一：一键部署（推荐）

```bash
cd cloud-deployment/scripts
./deploy-docker-all.sh
```

### 方式二：分步部署

1. **部署SSL证书:**
   ```bash
   cd cloud-deployment/scripts
   ./deploy-docker-ssl.sh
   ```

2. **部署Nginx配置:**
   ```bash
   ./deploy-docker-nginx.sh
   ```

## 脚本自动检测

脚本会自动检测以下路径（按优先级）：

1. `/root/order_system/cloud-deployment/`
2. `/root/order_system/`
3. `/opt/order_system/cloud-deployment/`
4. `/opt/order_system/`
5. 从运行中的nginx容器挂载信息中提取

如果自动检测失败，可以手动指定部署目录。

## 前置要求

1. **SSH密钥配置**
   - 确保已配置SSH密钥，可以无密码登录服务器
   - 或使用 `ssh-copy-id root@106.54.235.3` 配置密钥

2. **证书文件**
   - 确保 `www.greenspring-order.cn_nginx.zip` 文件在项目根目录

3. **Docker环境**
   - 确保服务器上已安装Docker和Docker Compose
   - 确保nginx容器正在运行

## 验证部署

部署完成后，可以通过以下方式验证：

1. **检查SSL证书:**
   ```bash
   ssh root@106.54.235.3 "ls -la <部署目录>/ssl/"
   ```

2. **检查Nginx配置:**
   ```bash
   ssh root@106.54.235.3 "docker exec <nginx容器名> nginx -t"
   ```

3. **检查容器状态:**
   ```bash
   ssh root@106.54.235.3 "docker ps | grep nginx"
   ```

4. **查看容器日志:**
   ```bash
   ssh root@106.54.235.3 "docker logs <nginx容器名>"
   ```

5. **访问网站:**
   - 打开浏览器访问: `https://www.greenspring-order.cn`
   - 检查浏览器地址栏是否显示SSL锁图标

## 故障排查

### 问题1: 无法找到docker-compose部署目录

**解决方案:**
1. 手动指定部署目录，修改脚本中的 `DEPLOY_DIR` 变量
2. 或确保docker-compose.yml文件存在于常见路径

### 问题2: 容器重启失败

**解决方案:**
```bash
# 查看容器日志
ssh root@106.54.235.3 "docker logs <nginx容器名>"

# 手动重启容器
ssh root@106.54.235.3 "docker restart <nginx容器名>"

# 或使用docker-compose重启
ssh root@106.54.235.3 "cd <部署目录> && docker-compose restart nginx"
```

### 问题3: Nginx配置测试失败

**解决方案:**
```bash
# 在容器内测试配置
ssh root@106.54.235.3 "docker exec <nginx容器名> nginx -t"

# 查看详细错误信息
ssh root@106.54.235.3 "docker exec <nginx容器名> nginx -t 2>&1"
```

### 问题4: SSL证书不生效

**解决方案:**
1. 确认证书文件路径正确
2. 检查证书文件权限
3. 确认nginx配置中的SSL路径正确
4. 重启nginx容器

## 手动部署（如果脚本失败）

如果自动部署脚本失败，可以手动执行：

```bash
# 1. SSH到服务器
ssh root@106.54.235.3

# 2. 进入部署目录（根据实际情况调整）
cd /root/order_system/cloud-deployment  # 或其他路径

# 3. 创建SSL目录
mkdir -p ssl

# 4. 上传证书文件（从本地）
# 在本地执行：
scp www.greenspring-order.cn_nginx.zip root@106.54.235.3:/tmp/
# 在服务器执行：
cd /root/order_system/cloud-deployment
unzip /tmp/www.greenspring-order.cn_nginx.zip -d /tmp/ssl
cp /tmp/ssl/www.greenspring-order.cn_nginx/*.pem ssl/
cp /tmp/ssl/www.greenspring-order.cn_nginx/*.key ssl/
chmod 644 ssl/*.pem
chmod 600 ssl/*.key

# 5. 上传nginx配置
# 在本地执行：
scp cloud-deployment/nginx/nginx.conf root@106.54.235.3:/root/order_system/cloud-deployment/nginx/

# 6. 测试配置
docker exec <nginx容器名> nginx -t

# 7. 重启容器
docker restart <nginx容器名>
# 或
docker-compose restart nginx
```

## 注意事项

1. **备份配置**: 脚本会自动备份nginx配置，备份文件位于 `<部署目录>/nginx/nginx.conf.backup.*`

2. **证书有效期**: 定期检查SSL证书有效期，及时更新证书

3. **容器重启**: 修改配置后需要重启nginx容器才能生效

4. **域名解析**: 确保域名 `www.greenspring-order.cn` 已正确解析到服务器IP

5. **防火墙**: 确保服务器防火墙已开放443端口（HTTPS）

## 更新日志

- 2025-11-26: 创建Docker环境部署脚本，支持自动检测部署目录和容器管理

