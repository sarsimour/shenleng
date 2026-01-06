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

# 使用 ecs_user 匹配服务器用户 (UID 1000 是大多数云服务器默认用户的 ID)
RUN addgroup --system --gid 1000 ecs_group
RUN adduser --system --uid 1000 --ingroup ecs_group ecs_user

RUN mkdir .next
RUN chown ecs_user:ecs_group .next

# 复制全量文件
COPY --from=builder --chown=ecs_user:ecs_group /app/node_modules ./node_modules
COPY --from=builder --chown=ecs_user:ecs_group /app/.next ./.next
COPY --from=builder --chown=ecs_user:ecs_group /app/public ./public
COPY --from=builder --chown=ecs_user:ecs_group /app/package.json ./package.json
COPY --from=builder --chown=ecs_user:ecs_group /app/src/scripts ./src/scripts
COPY --from=builder --chown=ecs_user:ecs_group /app/src/payload.config.ts ./src/payload.config.ts
COPY --from=builder --chown=ecs_user:ecs_group /app/src/collections ./src/collections
COPY --from=builder --chown=ecs_user:ecs_group /app/next.config.ts ./next.config.ts

# 创建挂载点
RUN mkdir -p database && chown ecs_user:ecs_group database
RUN mkdir -p public/media && chown ecs_user:ecs_group public/media

RUN npm install -g tsx

USER ecs_user
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
