# Nginx 独立部署转发配置指南

## 场景说明

当前端和后端已经分别部署在不同服务器上时，可以使用独立的 Nginx 服务器作为反向代理，实现统一访问入口。

## 部署架构

```
用户请求 → Nginx服务器 (80端口) → 转发到对应服务
├── / → 前端服务器 (IP1:3000)
└── /api/ → 后端服务器 (IP2:8000)
```

## 配置步骤

### 1. 准备工作

确认您的服务部署情况：
- 前端服务地址：`http://前端IP:3000`
- 后端服务地址：`http://后端IP:8000`
- Nginx 服务器：独立服务器或与前端/后端同一服务器

### 2. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
# 或
sudo dnf install nginx

# macOS
brew install nginx
```

### 3. 配置 Nginx

#### 方法一：修改主配置文件

```bash
# 编辑主配置文件
sudo nano /etc/nginx/nginx.conf

# 在 http 块中添加 server 配置
# 或者包含我们的配置文件
include /etc/nginx/conf.d/order_system.conf;
```

#### 方法二：创建独立配置文件（推荐）

```bash
# 复制配置文件
sudo cp nginx_simple.conf /etc/nginx/conf.d/order_system.conf

# 编辑配置文件，替换实际的服务器地址
sudo nano /etc/nginx/conf.d/order_system.conf
```

### 4. 修改配置文件

编辑 `/etc/nginx/conf.d/order_system.conf`，替换以下内容：

```nginx
# 将这些占位符替换为实际地址
proxy_pass http://前端服务器IP:3000;  # 改为 http://192.168.1.100:3000
proxy_pass http://后端服务器IP:8000/; # 改为 http://192.168.1.101:8000/
```

**具体示例：**

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 您的域名
    
    # 前端转发
    location / {
        proxy_pass http://192.168.1.100:3000;  # 前端服务器
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 后端 API 转发
    location /api/ {
        proxy_pass http://192.168.1.101:8000/;  # 后端服务器
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. 测试和启动

```bash
# 测试配置文件语法
sudo nginx -t

# 如果测试通过，重新加载配置
sudo nginx -s reload

# 或者重启 Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

### 6. 验证配置

```bash
# 测试前端访问
curl http://您的Nginx服务器IP/

# 测试后端 API
curl http://您的Nginx服务器IP/api/health

# 查看 Nginx 状态
sudo systemctl status nginx

# 查看访问日志
sudo tail -f /var/log/nginx/order_system.log
```

## 常见配置场景

### 场景1：所有服务在同一内网

```nginx
# 前端：192.168.1.100:3000
# 后端：192.168.1.101:8000
# Nginx：192.168.1.102

location / {
    proxy_pass http://192.168.1.100:3000;
}

location /api/ {
    proxy_pass http://192.168.1.101:8000/;
}
```

### 场景2：使用域名访问

```nginx
# 前端：frontend.internal:3000
# 后端：backend.internal:8000

location / {
    proxy_pass http://frontend.internal:3000;
}

location /api/ {
    proxy_pass http://backend.internal:8000/;
}
```

### 场景3：不同端口的服务

```nginx
# 前端：同服务器不同端口
# 后端：远程服务器

location / {
    proxy_pass http://localhost:3000;  # 本地前端
}

location /api/ {
    proxy_pass http://remote-server.com:8000/;  # 远程后端
}
```

## 安全配置（可选）

### 1. 限制访问来源

```nginx
server {
    # 只允许特定 IP 访问
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
    
    # 其他配置...
}
```

### 2. 添加 SSL 支持

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # 其他配置...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. 速率限制

```nginx
http {
    # 定义速率限制
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend-server:8000/;
        }
    }
}
```

## 故障排除

### 1. 常见错误

**502 Bad Gateway**
```bash
# 检查后端服务是否运行
curl http://后端IP:8000/health

# 检查网络连通性
ping 后端IP
telnet 后端IP 8000
```

**404 Not Found**
```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查配置文件是否被包含
sudo nginx -T | grep order_system
```

### 2. 调试命令

```bash
# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log

# 检查端口占用
sudo netstat -tlnp | grep :80

# 检查 Nginx 进程
ps aux | grep nginx
```

### 3. 测试脚本

```bash
#!/bin/bash
# 简单的连通性测试

NGINX_IP="您的Nginx服务器IP"

echo "测试前端访问..."
curl -I http://$NGINX_IP/

echo "测试后端 API..."
curl -I http://$NGINX_IP/api/health

echo "测试完成"
```

## 性能优化建议

1. **启用 Gzip 压缩**
2. **设置适当的缓存策略**
3. **调整 worker 进程数**
4. **优化 buffer 大小**
5. **启用 keepalive 连接**

通过以上配置，您就可以实现前后端的统一访问入口，用户只需要访问 Nginx 服务器的地址即可使用完整的应用功能！