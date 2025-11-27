# 服务器端部署脚本使用说明

## 概述

这些脚本用于在服务器上直接执行SSL证书和Nginx配置部署，无需从本地上传文件。

## 前提条件

1. **文件已通过git上传到服务器**
   - 证书文件: `www.greenspring-order.cn_nginx.zip` 在项目根目录
   - Nginx配置: `cloud-deployment/nginx/nginx.conf`

2. **Docker环境**
   - Docker和Docker Compose已安装
   - Nginx容器正在运行

3. **执行位置**
   - 在项目根目录（`/root/order_system`）执行脚本

## 部署脚本

### 1. deploy-ssl-server.sh
在服务器上解压并部署SSL证书。

**功能:**
- 自动检测项目根目录
- 解压证书zip文件
- 创建SSL证书目录
- 复制证书文件并设置权限

**使用方法:**
```bash
cd /root/order_system
bash cloud-deployment/scripts/deploy-ssl-server.sh
```

### 2. deploy-nginx-server.sh
更新Nginx配置并重启容器。

**功能:**
- 自动检测项目根目录和docker-compose配置
- 备份当前nginx配置
- 更新nginx配置文件
- 在容器内测试配置
- 重启nginx容器

**使用方法:**
```bash
cd /root/order_system
bash cloud-deployment/scripts/deploy-nginx-server.sh
```

### 3. deploy-all-server.sh
一键部署SSL证书和Nginx配置。

**使用方法:**
```bash
cd /root/order_system
bash cloud-deployment/scripts/deploy-all-server.sh
```

## 部署步骤

### 方式一：一键部署（推荐）

```bash
cd /root/order_system
bash cloud-deployment/scripts/deploy-all-server.sh
```

### 方式二：分步部署

1. **部署SSL证书:**
   ```bash
   cd /root/order_system
   bash cloud-deployment/scripts/deploy-ssl-server.sh
   ```

2. **更新docker-compose.yml添加SSL证书挂载（如果需要）:**
   ```bash
   # 检查docker-compose.yml中nginx的volumes配置
   # 确保包含SSL证书挂载：
   # - ./ssl:/etc/nginx/ssl:ro
   ```

3. **部署Nginx配置:**
   ```bash
   bash cloud-deployment/scripts/deploy-nginx-server.sh
   ```

## 重要：更新docker-compose.yml

在部署SSL之前，需要确保docker-compose.yml中nginx服务包含SSL证书挂载：

```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: order_system_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl:ro  # 添加这一行
      - ./logs/nginx:/var/log/nginx
    # ... 其他配置
```

添加SSL挂载后，需要重启nginx容器：
```bash
docker-compose restart nginx
```

## 验证部署

部署完成后，可以通过以下方式验证：

1. **检查SSL证书:**
   ```bash
   ls -la /root/order_system/ssl/
   ```

2. **检查Nginx配置:**
   ```bash
   docker exec order_system_nginx nginx -t
   ```

3. **检查容器状态:**
   ```bash
   docker-compose ps
   ```

4. **查看容器日志:**
   ```bash
   docker logs order_system_nginx
   ```

5. **访问网站:**
   - 打开浏览器访问: `https://www.greenspring-order.cn`
   - 检查浏览器地址栏是否显示SSL锁图标

## 故障排查

### 问题1: 找不到证书文件

**解决方案:**
```bash
# 确认证书文件在项目根目录
ls -la /root/order_system/www.greenspring-order.cn_nginx.zip

# 如果不在，从git拉取或手动上传
```

### 问题2: 容器内找不到SSL证书

**解决方案:**
1. 检查docker-compose.yml中是否包含SSL挂载
2. 添加SSL挂载后重启容器：
   ```bash
   docker-compose restart nginx
   ```

### 问题3: Nginx配置测试失败

**解决方案:**
```bash
# 在容器内测试配置
docker exec order_system_nginx nginx -t

# 查看详细错误
docker exec order_system_nginx nginx -t 2>&1

# 查看容器日志
docker logs order_system_nginx
```

### 问题4: 容器重启失败

**解决方案:**
```bash
# 查看容器日志
docker logs order_system_nginx

# 检查容器状态
docker ps -a | grep nginx

# 手动重启
docker restart order_system_nginx
```

## 文件结构

部署后的文件结构应该是：

```
/root/order_system/
├── docker-compose.yml
├── nginx.conf                    # Nginx配置文件（挂载到容器）
├── ssl/                         # SSL证书目录（挂载到容器）
│   ├── www.greenspring-order.cn_bundle.pem
│   └── www.greenspring-order.cn.key
├── www.greenspring-order.cn_nginx.zip
└── cloud-deployment/
    └── nginx/
        └── nginx.conf           # 源配置文件
```

## 注意事项

1. **SSL证书挂载**: 确保docker-compose.yml中包含SSL证书挂载配置
2. **文件权限**: 脚本会自动设置正确的文件权限
3. **备份配置**: 脚本会自动备份nginx配置
4. **容器重启**: 修改配置后需要重启nginx容器才能生效

## 更新日志

- 2025-11-26: 创建服务器端部署脚本，支持在服务器上直接执行

