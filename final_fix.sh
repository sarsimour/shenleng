#!/bin/bash
set -e

# 1. 配置路径
PROJECT_ROOT="/home/ecs-user/Projects/shenleng"
DATA_SOURCE="/home/ecs-user/shenleng_data_source"
SECRET=$(docker inspect shenleng-container --format='{{range .Config.Env}}{{println .}}{{end}}' | grep PAYLOAD_SECRET | cut -d'=' -f2)

echo "🛠️ 正在清理并重建权限..."
docker run --rm -v "$PROJECT_ROOT/persistence":/target alpine chmod -R 777 /target

# 2. 核心迁移步骤 (开启所有挂载)
echo "📦 正在执行一次性迁移..."
docker run --rm \
  -v "$PROJECT_ROOT/persistence/sqlite":/app/database \
  -v "$PROJECT_ROOT/persistence/media":/app/public/media \
  -v "$DATA_SOURCE":/app/migration_source \
  -e PAYLOAD_SECRET="$SECRET" \
  -e DATABASE_URI="file:/app/database/payload.db" \
  -e PAYLOAD_CONFIG_PATH="src/payload.config.ts" \
  -e MIGRATION_SOURCE_DIR="/app/migration_source" \
  shenleng-site \
  npm run migrate:content

echo "✅ 迁移成功！正在重启主服务..."
docker restart shenleng-container

echo "🎉 恭喜！请刷新网站查看：https://www.finverse.top/articles"
