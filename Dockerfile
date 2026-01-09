FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

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

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir .next
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/src/scripts ./src/scripts
COPY --from=builder --chown=node:node /app/src/payload.config.ts ./src/payload.config.ts
COPY --from=builder --chown=node:node /app/src/collections ./src/collections
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts

# 挂载点占位
RUN mkdir -p database public/media && chown -R node:node database public/media

RUN npm install -g tsx
USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
