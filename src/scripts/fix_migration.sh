#!/bin/bash
# 申冷物流文章迁移一键修复脚本
set -e

echo "🚀 开始修复迁移流程..."

# 1. 定义路径
PROJECT_ROOT="/home/ecs-user/Projects/shenleng"
DATA_SOURCE="/home/ecs-user/shenleng_data_source"
DB_DIR="$PROJECT_ROOT/persistence/sqlite"
MEDIA_DIR="$PROJECT_ROOT/persistence/media"

# 2. 获取 Secret
echo "🔑 正在提取 PAYLOAD_SECRET..."
SECRET=$(docker inspect shenleng-container --format='{{range .Config.Env}}{{println .}}{{end}}' | grep PAYLOAD_SECRET | cut -d'=' -f2)

if [ -z "$SECRET" ]; then
    echo "❌ 错误: 无法获取 PAYLOAD_SECRET，请确保 shenleng-container 正在运行。"
    exit 1
fi

# 3. 确保权限正确
echo "🔧 修正目录权限..."
docker run --rm -v "$PROJECT_ROOT/persistence":/target alpine chmod -R 777 /target
docker run --rm -v "$DATA_SOURCE":/target alpine chmod -R 777 /target

# 4. 执行超级迁移容器
echo "📦 正在启动临时迁移容器灌入数据..."
docker run --rm \
  -v "$DB_DIR":/app/database \
  -v "$MEDIA_DIR":/app/public/media \
  -v "$DATA_SOURCE":/app/migration_source \
  -e PAYLOAD_SECRET="$SECRET" \
  -e DATABASE_URI="file:/app/database/payload.db" \
  -e PAYLOAD_CONFIG_PATH="src/payload.config.ts" \
  -e MIGRATION_SOURCE_DIR="/app/migration_source" \
  shenleng-site \
  npm run migrate:content

echo "✅ 数据灌入完成！"

# 5. 重启主容器
echo "🔄 正在重启主服务以加载数据..."
docker restart shenleng-container

echo "🎉 修复成功！请刷新 https://www.finverse.top/articles 查看结果。"
