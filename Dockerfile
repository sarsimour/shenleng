FROM node:20-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# 2. Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_SECRET=build_secret_placeholder
ENV DATABASE_URI=file:./payload-build.db
ENV PAYLOAD_CONFIG_PATH=src/payload.config.ts

# 生成 importMap
RUN npx payload generate:importmap

# 修复：构建前初始化表结构
RUN npx tsx src/scripts/build-init.ts

# 禁用构建检查
ENV NEXT_IGNORE_ESLINT=1
ENV NEXT_IGNORE_TYPESCRIPT_ERRORS=1

RUN npm run build

# 3. Production image (Full Mode)
# 不再使用 standalone，确保所有依赖都在
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

# 复制完整的 node_modules（关键修复）
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# 复制迁移脚本所需文件
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/src/scripts ./src/scripts
COPY --from=builder --chown=nextjs:nodejs /app/src/payload.config.ts ./src/payload.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/collections ./src/collections

# 确保媒体上传目录存在
RUN mkdir -p public/media && chown nextjs:nodejs public/media

# 全局安装 tsx
RUN npm install -g tsx

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 使用标准的 npm start 启动
CMD ["npm", "start"]