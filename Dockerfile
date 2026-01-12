FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_SECRET=build_secret_placeholder
ENV DATABASE_URI=file:./payload-build.db
ENV PAYLOAD_CONFIG_PATH=src/payload.config.ts

RUN npx payload generate:importmap
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone 模式需要手动复制这些文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/src/payload.config.ts ./src/payload.config.ts
COPY --from=builder /app/src/collections ./src/collections

# 确保 database 目录存在
RUN mkdir -p database

USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Standalone 启动命令
CMD ["node", "server.js"]