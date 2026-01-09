#!/bin/bash
set -e

# 申冷物流 - 最后的线上修复脚本
# 运行环境：阿里云服务器

PROJECT_ROOT="/home/ecs-user/Projects/shenleng"
DATA_SOURCE="/home/ecs-user/shenleng_data_source"

echo "Step 1: 正在自动提取生产环境密钥..."
SECRET=$(docker inspect shenleng-container --format='{{range .Config.Env}}{{println .}}{{end}}' | grep PAYLOAD_SECRET | cut -d'=' -f2)

if [ -z "$SECRET" ]; then
    echo "❌ 无法找到密钥，请确保 shenleng-container 正在运行。"
    exit 1
fi

echo "Step 2: 正在强行同步数据库表结构 (解决 no such table)..."
# 使用新的 push 补丁代码运行一次性容器
docker run --rm \
  -v "$PROJECT_ROOT/persistence/sqlite":/app/database \
  -e PAYLOAD_SECRET="$SECRET" \
  -e DATABASE_URI="file:/app/database/payload.db" \
  -e PAYLOAD_CONFIG_PATH="src/payload.config.ts" \
  shenleng-site npx payload migrate:push --force

echo "Step 3: 正在执行 56 篇文章的灌入..."
docker run --rm \
  -v "$PROJECT_ROOT/persistence/sqlite":/app/database \
  -v "$PROJECT_ROOT/persistence/media":/app/public/media \
  -v "$DATA_SOURCE":/app/migration_source \
  -e PAYLOAD_SECRET="$SECRET" \
  -e DATABASE_URI="file:/app/database/payload.db" \
  -e PAYLOAD_CONFIG_PATH="src/payload.config.ts" \
  -e MIGRATION_SOURCE_DIR="/app/migration_source" \
  shenleng-site npm run migrate:content

echo "Step 4: 正在重启主服务..."
docker restart shenleng-container

echo "✅ 修复完成。请访问 https://www.finverse.top/articles"
