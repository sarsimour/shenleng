FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_VERSECORE_APP_ID=logistics-web
ARG NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME=申冷售前顾问
ARG NEXT_PUBLIC_LOGISTICS_CHATBOT_ID

ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_SECRET=build_secret_placeholder
ENV DATABASE_URI=file:./payload-build.db
ENV PAYLOAD_CONFIG_PATH=src/payload.config.ts
ENV NEXT_PUBLIC_VERSECORE_APP_ID=${NEXT_PUBLIC_VERSECORE_APP_ID}
ENV NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME=${NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME}
ENV NEXT_PUBLIC_LOGISTICS_CHATBOT_ID=${NEXT_PUBLIC_LOGISTICS_CHATBOT_ID}

RUN npx payload generate:importmap
RUN test -n "$NEXT_PUBLIC_LOGISTICS_CHATBOT_ID" || (echo "NEXT_PUBLIC_LOGISTICS_CHATBOT_ID is required at build time" >&2; exit 1)
RUN npm run build

FROM deps AS prod-deps
WORKDIR /app
RUN npm prune --omit=dev --legacy-peer-deps

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
COPY --from=builder /app/src/scripts ./src/scripts
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/app/sitemap.ts ./src/app/sitemap.ts

# 复制完整生产依赖，确保运行时脚本 (schema/smoke) 可执行
COPY --from=prod-deps /app/node_modules ./node_modules

# 确保 database 目录存在并设置权限
RUN mkdir -p database && chown -R node:node /app

USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Standalone 启动命令
CMD ["node", "server.js"]
