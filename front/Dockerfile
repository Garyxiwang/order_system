# syntax=docker/dockerfile:1.5
# 前端 Dockerfile
FROM node:18-alpine AS base

# 构建阶段
FROM base AS builder
# 使用国内 APK 镜像并安装依赖
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && apk add --no-cache libc6-compat
WORKDIR /app

# 复制 package 文件并安装所有依赖（包括 devDependencies）
COPY package*.json ./
# 使用国内 npm 镜像并优化安装配置（移除无效 network-timeout）
RUN npm config set registry https://registry.npmmirror.com && npm config set progress=false && npm config set fetch-retries=3 && npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retry-mintimeout 10000
# 使用 BuildKit 缓存并改为 npm install（兼容无 package-lock 的情况）
RUN --mount=type=cache,target=/root/.npm npm install --no-audit --prefer-offline --progress=false --legacy-peer-deps

# 复制源代码
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 构建应用
RUN npm run build

# 验证构建结果（确保 .next 目录存在）
RUN test -d .next || (echo "错误: .next 目录不存在" && exit 1)
RUN test -d .next/static || (echo "错误: .next/static 目录不存在" && exit 1)
RUN test -d .next/static/chunks || (echo "错误: .next/static/chunks 目录不存在" && exit 1)
RUN echo "构建验证通过: .next/static/chunks 目录存在"

# 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 package.json 并安装生产依赖
COPY --from=builder /app/package.json ./package.json
# 使用国内 npm 镜像并启用缓存（移除无效 network-timeout）
RUN npm config set registry https://registry.npmmirror.com && npm config set progress=false && npm config set fetch-retries=3 && npm config set fetch-retry-maxtimeout 600000 && npm config set fetch-retry-mintimeout 10000
RUN --mount=type=cache,target=/root/.npm npm install --only=production --no-audit --prefer-offline --progress=false --legacy-peer-deps && npm cache clean --force

# 复制构建产物
COPY --from=builder /app/public ./public

# 复制 .next 目录的所有内容（确保所有 chunk 文件都被复制）
# 使用 --chown 确保文件权限正确，避免权限问题导致的文件无法访问
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# 验证复制后的文件（在 runner 阶段验证）
RUN test -d .next || (echo "错误: .next 目录复制失败" && exit 1)
RUN test -d .next/static || (echo "错误: .next/static 目录复制失败" && exit 1)
RUN test -d .next/static/chunks || (echo "错误: .next/static/chunks 目录复制失败" && exit 1)
RUN echo "复制验证通过: .next/static/chunks 目录存在"

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动应用
CMD ["npm", "start"]