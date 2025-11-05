# Docker 镜像和磁盘清理指南

## 快速清理（推荐）

### 方法 1：使用自动清理脚本

```bash
# 预览将要清理的内容（不实际删除）
./cleanup-docker.sh --dry-run

# 执行清理（保守模式，只清理 dangling 镜像）
./cleanup-docker.sh

# 激进清理（包括所有未使用的镜像）
./cleanup-docker.sh --aggressive
```

### 方法 2：手动清理

#### 1. 清理未标记的镜像（最安全，推荐先做）

```bash
# 查看将要删除的镜像
docker images -f "dangling=true"

# 删除未标记的镜像
docker image prune -f
```

这会删除你看到的那些 `<none>:<none>` 镜像，每个约 869MB，可以释放约 2.6GB 空间。

#### 2. 清理未使用的容器

```bash
# 查看已停止的容器
docker ps -a -f "status=exited"

# 删除已停止的容器
docker container prune -f
```

#### 3. 清理未使用的卷

```bash
# 查看未使用的卷
docker volume ls -f "dangling=true"

# 删除未使用的卷（谨慎！确保没有重要数据）
docker volume prune -f
```

#### 4. 清理构建缓存

```bash
# 清理构建缓存
docker builder prune -a -f
```

#### 5. 全面清理（不删除未使用的镜像）

```bash
# 清理所有未使用的资源（不包括镜像）
docker system prune -f
```

#### 6. 全面清理（包括未使用的镜像）

```bash
# 清理所有未使用的资源（包括镜像）
# ⚠️ 警告：这会删除所有未使用的镜像
docker system prune -a -f
```

## 清理策略

### 保守清理（推荐）

```bash
# 1. 清理 dangling 镜像（最安全）
docker image prune -f

# 2. 清理未使用的容器
docker container prune -f

# 3. 清理构建缓存
docker builder prune -a -f

# 4. 清理其他未使用的资源（不包括镜像）
docker system prune -f
```

**预期效果**：
- 删除 3 个 dangling 镜像（约 2.6GB）
- 释放构建缓存空间
- 保留所有标记的镜像

### 激进清理（谨慎使用）

```bash
# 清理所有未使用的资源（包括镜像）
docker system prune -a -f
```

**预期效果**：
- 删除所有未使用的镜像、容器、卷、缓存
- 释放最大空间
- ⚠️ 可能删除一些有用的镜像

## 查看磁盘使用情况

```bash
# 查看 Docker 磁盘使用
docker system df

# 查看系统磁盘使用
df -h

# 查看镜像列表
docker images -a

# 查看镜像大小排序
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | sort -k3 -h
```

## 你的情况分析

从你的镜像列表来看：

1. **未标记的镜像（可以安全删除）**：
   - 3 个 `<none>:<none>` 镜像，每个约 869MB
   - 可以释放约 **2.6GB** 空间

2. **正在使用的镜像（保留）**：
   - `order_system-frontend:latest` (869MB) - 正在使用
   - `order_system-backend:latest` (666MB) - 正在使用
   - `nginx:alpine` (52.7MB) - 正在使用
   - `postgres:15-alpine` (273MB) - 正在使用

## 推荐操作

```bash
# 1. 先预览
./cleanup-docker.sh --dry-run

# 2. 执行保守清理（推荐）
./cleanup-docker.sh

# 这将：
# - 清理 3 个 dangling 镜像（约 2.6GB）
# - 清理未使用的容器
# - 清理构建缓存
# - 保留所有标记的镜像
```

## 定期维护

建议定期运行清理脚本：

```bash
# 每周运行一次
./cleanup-docker.sh

# 或每月运行一次激进清理
./cleanup-docker.sh --aggressive
```

## 注意事项

1. **备份重要数据**：清理前确保重要数据已备份
2. **检查正在使用的容器**：确保不会删除正在使用的镜像
3. **卷清理要谨慎**：卷可能包含数据库数据，清理前请确认
4. **使用 dry-run**：首次使用前先预览将要清理的内容

## 紧急清理

如果需要快速释放大量空间：

```bash
# 快速清理（最安全）
docker image prune -f && docker container prune -f && docker builder prune -a -f
```

