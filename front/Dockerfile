# 前端 Dockerfile
FROM node:18-alpine AS base

# 构建阶段
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制 package 文件并安装所有依赖（包括 devDependencies）
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 构建应用
RUN npm run build

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
RUN npm install --only=production && npm cache clean --force

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动应用
CMD ["npm", "start"]