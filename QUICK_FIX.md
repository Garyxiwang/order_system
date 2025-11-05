# 快速修复 ChunkLoadError 指南

## 问题描述

网站出现 `ChunkLoadError: Loading chunk 611 failed` 错误，通常是因为：
- 构建不完整：Docker 构建时某些 chunk 文件未生成
- 容器重启：容器重启时镜像不完整或文件丢失
- 磁盘空间不足：构建时因磁盘空间不足导致部分文件缺失

## 快速修复（推荐）

### 方法 1：使用自动修复脚本

```bash
./fix-frontend.sh
```

### 方法 2：手动执行命令

```bash
# 1. 重新构建前端（使用 --no-cache 确保完整构建）
docker compose build --no-cache frontend

# 2. 重新部署前端并重启 Nginx
docker compose up -d frontend && docker compose restart nginx
```

## 验证修复

修复后，请：

1. **访问网站**：检查浏览器控制台是否还有 ChunkLoadError
2. **清除浏览器缓存**：使用无痕模式或清除缓存
3. **检查容器日志**：
   ```bash
   docker compose logs frontend
   docker compose logs nginx
   ```

## 如果问题仍然存在

### 检查磁盘空间

```bash
df -h
```

如果磁盘空间不足，清理 Docker 资源：

```bash
# 清理未使用的 Docker 资源
docker system prune -f

# 清理未使用的镜像
docker image prune -a -f
```

### 检查构建是否成功

```bash
# 查看构建日志
docker compose build --no-cache frontend 2>&1 | tee build.log

# 检查镜像中是否有 .next 目录
docker compose run --rm frontend ls -la /app/.next/static/chunks | head -20
```

### 检查容器状态

```bash
# 查看所有容器状态
docker compose ps

# 查看前端容器详细信息
docker compose ps frontend
docker inspect order_system_frontend
```

### 完全重新部署

```bash
# 停止所有服务
docker compose down

# 清理旧镜像
docker image rm order_system-frontend || true

# 重新构建并启动
docker compose build --no-cache frontend
docker compose up -d
docker compose restart nginx
```

## 预防措施

1. **定期检查磁盘空间**：确保有足够的空间进行构建
2. **使用版本标签**：避免使用 `latest` 标签，使用具体的版本号
3. **监控构建过程**：确保构建成功后再部署
4. **定期清理**：定期清理未使用的 Docker 资源，但保留足够的构建空间

## 常见问题

### Q: 为什么使用 `--no-cache`？

A: `--no-cache` 确保完全重新构建，不使用缓存，这样可以确保所有 chunk 文件都被正确生成。

### Q: 构建很慢怎么办？

A: 构建慢是正常的，特别是使用 `--no-cache` 时。可以：
- 在非高峰期构建
- 使用 CI/CD 自动构建
- 只在必要时使用 `--no-cache`

### Q: 如何加快构建速度？

A: 如果构建成功，可以去掉 `--no-cache`：
```bash
docker compose build frontend
docker compose up -d frontend && docker compose restart nginx
```

但是，如果问题是由于缓存导致的，请继续使用 `--no-cache`。

