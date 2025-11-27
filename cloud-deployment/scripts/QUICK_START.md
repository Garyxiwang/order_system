# 快速部署指南（服务器端）

## 前提条件

✅ 文件已通过git上传到服务器  
✅ Docker容器正在运行  
✅ 在项目根目录 `/root/order_system` 执行

## 一键部署

```bash
cd /root/order_system
bash cloud-deployment/scripts/deploy-all-server.sh
```

## 分步部署

### 步骤1: 部署SSL证书

```bash
cd /root/order_system
bash cloud-deployment/scripts/deploy-ssl-server.sh
```

### 步骤2: 更新docker-compose.yml（如果需要）

如果docker-compose.yml中还没有SSL证书挂载，需要添加：

```yaml
volumes:
  - ./nginx.conf:/etc/nginx/conf.d/default.conf
  - ./ssl:/etc/nginx/ssl:ro  # 添加这一行
  - ./logs/nginx:/var/log/nginx
```

然后重启nginx容器：
```bash
docker-compose restart nginx
```

### 步骤3: 部署Nginx配置

```bash
bash cloud-deployment/scripts/deploy-nginx-server.sh
```

## 验证

```bash
# 检查SSL证书
ls -la ssl/

# 测试nginx配置
docker exec order_system_nginx nginx -t

# 查看容器状态
docker-compose ps

# 访问网站
curl -I https://www.greenspring-order.cn
```

## 常见问题

**Q: 容器内找不到SSL证书？**  
A: 确保docker-compose.yml中包含 `./ssl:/etc/nginx/ssl:ro` 挂载，然后重启容器。

**Q: Nginx配置测试失败？**  
A: 运行 `docker exec order_system_nginx nginx -t` 查看详细错误信息。

**Q: 容器重启失败？**  
A: 查看日志：`docker logs order_system_nginx`

