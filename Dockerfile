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

RUN npx payload generate:importmap
RUN npx tsx src/scripts/build-init.ts

ENV NEXT_IGNORE_ESLINT=1
ENV NEXT_IGNORE_TYPESCRIPT_ERRORS=1

RUN npm run build

# 3. Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 基础镜像 node:20-alpine 已经包含 UID/GID 为 1000 的 'node' 用户
# 直接使用它来匹配宿主机的 UID 1000

RUN mkdir .next
RUN chown node:node .next

# 复制全量文件
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/src/scripts ./src/scripts
COPY --from=builder --chown=node:node /app/src/payload.config.ts ./src/payload.config.ts
COPY --from=builder --chown=node:node /app/src/collections ./src/collections
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts

# 创建挂载点
RUN mkdir -p database && chown node:node database
RUN mkdir -p public/media && chown node:node public/media

RUN npm install -g tsx

USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]