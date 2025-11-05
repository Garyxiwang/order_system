# Next.js ChunkLoadError 修复指南

## 问题描述

网站出现 `ChunkLoadError: Loading chunk 611 failed` 错误，通常是因为：
- 404 错误：chunk 文件在服务器上不存在
- 构建不完整：Docker 构建时某些 chunk 文件未生成
- 容器重启：容器重启时镜像不完整或文件丢失
- 磁盘空间不足：构建时因磁盘空间不足导致部分文件缺失

## 快速修复

### 方法 1：使用自动修复脚本（推荐）

在项目根目录执行：

```bash
./cloud-deployment/scripts/fix-chunk-error.sh
```

或指定版本：

```bash
./cloud-deployment/scripts/fix-chunk-error.sh v1.0.0
```

### 方法 2：手动修复

#### 步骤 1：检查磁盘空间

```bash
df -h
```

如果磁盘空间不足（< 2GB），先清理空间：

```bash
# 清理 Docker 未使用的资源
docker system prune -f

# 清理旧镜像
docker image prune -a -f
```

#### 步骤 2：停止前端容器

```bash
cd cloud-deployment
docker-compose -f docker-compose.production.yml stop frontend
docker-compose -f docker-compose.production.yml rm -f frontend
```

#### 步骤 3：重新构建前端镜像

```bash
cd ../front
docker build --no-cache -t order-system/frontend:latest -f Dockerfile .
```

#### 步骤 4：验证镜像

```bash
# 检查镜像中是否有 .next 目录
docker run --rm order-system/frontend:latest ls -la /app/.next/static/chunks | head -20
```

#### 步骤 5：重新部署

```bash
cd ../cloud-deployment
docker-compose -f docker-compose.production.yml up -d frontend
```

#### 步骤 6：检查日志

```bash
docker-compose -f docker-compose.production.yml logs --tail=50 frontend
```

#### 步骤 7：验证修复

访问网站，检查浏览器控制台是否还有 ChunkLoadError。

## 预防措施

### 1. 确保构建完整性

在 Dockerfile 中，确保正确复制所有构建产物：

```dockerfile
# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
```

### 2. 监控磁盘空间

定期检查服务器磁盘空间：

```bash
# 设置磁盘空间监控
df -h | grep -E '^/dev'
```

### 3. 使用健康检查

确保 docker-compose 配置中有健康检查：

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 4. 定期备份构建产物

在构建成功后，可以保存构建产物到外部存储：

```bash
# 导出构建产物
docker run --rm -v $(pwd):/output order-system/frontend:latest \
  tar czf /output/frontend-build.tar.gz /app/.next
```

## 常见问题

### Q: 修复后仍然出现错误？

A: 检查以下几点：
1. 浏览器缓存：清除浏览器缓存或使用无痕模式
2. CDN 缓存：如果使用了 CDN，清除 CDN 缓存
3. Nginx 缓存：重启 Nginx 或清除 Nginx 缓存
4. 容器日志：检查容器日志是否有其他错误

### Q: 如何避免再次发生？

A: 
1. 定期清理磁盘空间（但保留足够的构建空间）
2. 使用 CI/CD 自动构建和部署
3. 监控构建过程，确保构建成功
4. 使用版本标签管理镜像，避免使用 latest

### Q: 构建时磁盘空间不足怎么办？

A: 
1. 清理旧的 Docker 镜像和容器
2. 使用 `--no-cache` 构建会占用更多空间，但可以确保构建完整
3. 考虑使用多阶段构建的 BuildKit 缓存

## 联系支持

如果问题仍然存在，请提供：
1. 容器日志：`docker-compose logs frontend`
2. 镜像信息：`docker image inspect order-system/frontend:latest`
3. 磁盘空间：`df -h`
4. 浏览器控制台错误信息

