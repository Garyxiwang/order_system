# SSL证书部署快速指南

## ⚠️ 重要提示

**如果您的服务器使用Docker部署，请使用Docker专用脚本：**

```bash
cd cloud-deployment/scripts
./deploy-docker-all.sh
```

详细说明请查看: [DOCKER_DEPLOY.md](scripts/DOCKER_DEPLOY.md)

---

## 快速开始（非Docker环境）

### 一键部署（推荐）

```bash
cd cloud-deployment/scripts
./deploy-all.sh
```

## 已完成的配置

✅ **Nginx配置已更新:**
- 域名: `www.greenspring-order.cn` 和 `greenspring-order.cn`
- SSL证书路径: `/etc/nginx/ssl/www.greenspring-order.cn_bundle.pem`
- SSL私钥路径: `/etc/nginx/ssl/www.greenspring-order.cn.key`
- HTTP自动重定向到HTTPS

✅ **部署脚本已创建:**
- `deploy-ssl.sh` - 上传SSL证书
- `deploy-nginx.sh` - 部署Nginx配置
- `deploy-all.sh` - 一键部署

## 部署前检查

1. **确认SSH连接:**
   ```bash
   ssh root@106.54.235.3 "echo 'SSH连接成功'"
   ```

2. **确认证书文件存在:**
   ```bash
   ls -la www.greenspring-order.cn_nginx.zip
   ```

## 部署步骤

### 方式一：一键部署
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

## 验证部署

部署完成后，执行以下命令验证：

```bash
# 1. 检查证书文件
ssh root@106.54.235.3 "ls -la /etc/nginx/ssl/"

# 2. 测试Nginx配置
ssh root@106.54.235.3 "nginx -t"

# 3. 检查Nginx状态
ssh root@106.54.235.3 "systemctl status nginx"

# 4. 查看Nginx错误日志（如果有问题）
ssh root@106.54.235.3 "tail -20 /var/log/nginx/error.log"
```

## 访问测试

在浏览器中访问：
- `https://www.greenspring-order.cn`
- 检查浏览器地址栏是否显示SSL锁图标

## 常见问题

### 如果部署失败

1. **检查SSH连接:**
   ```bash
   ssh root@106.54.235.3
   ```

2. **手动上传证书（如果需要）:**
   ```bash
   # 解压证书
   unzip www.greenspring-order.cn_nginx.zip -d /tmp/ssl
   
   # 上传证书
   scp /tmp/ssl/www.greenspring-order.cn_nginx/www.greenspring-order.cn_bundle.pem root@106.54.235.3:/etc/nginx/ssl/
   scp /tmp/ssl/www.greenspring-order.cn_nginx/www.greenspring-order.cn.key root@106.54.235.3:/etc/nginx/ssl/
   
   # 设置权限
   ssh root@106.54.235.3 "chmod 600 /etc/nginx/ssl/www.greenspring-order.cn.key && chmod 644 /etc/nginx/ssl/www.greenspring-order.cn_bundle.pem"
   ```

3. **手动部署Nginx配置:**
   ```bash
   scp cloud-deployment/nginx/nginx.conf root@106.54.235.3:/etc/nginx/nginx.conf
   ssh root@106.54.235.3 "nginx -t && nginx -s reload"
   ```

## 服务器信息

- **服务器地址:** root@106.54.235.3
- **域名:** www.greenspring-order.cn
- **SSL证书目录:** /etc/nginx/ssl
- **Nginx配置:** /etc/nginx/nginx.conf

## 注意事项

⚠️ **重要提示:**
- 确保服务器防火墙已开放443端口
- 确保域名DNS已正确解析到服务器IP
- 部署前会自动备份nginx配置
- 如果nginx配置测试失败，会自动恢复备份

