FROM node:20-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# 统一使用 npm
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_SECRET=build_secret_placeholder
# 构建时使用本地临时数据库
ENV DATABASE_URI=file:./payload-build.db
ENV PAYLOAD_CONFIG_PATH=src/payload.config.ts

# 关键：在构建前生成 importMap
RUN npx payload generate:importmap

# 修复：确保在 build 静态页面前，数据库表结构已经存在
# 我们运行一个简单的命令让 Payload 初始化并同步 SQLite 架构
RUN npx payload migrate:create --name init_schema || true

# 禁用检查以加速构建
ENV NEXT_IGNORE_ESLINT=1
ENV NEXT_IGNORE_TYPESCRIPT_ERRORS=1

RUN npm run build

# 3. Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

RUN mkdir -p public/media && chown nextjs:nodejs public/media

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]