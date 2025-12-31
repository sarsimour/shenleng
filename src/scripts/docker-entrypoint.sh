#!/bin/sh
set -e

# 如果数据库文件不存在，说明是首次启动，运行迁移
if [ ! -f /app/database/payload.db ]; then
  echo "🆕 Initializing database and migrating content..."
  
  # 确保目录存在且可写
  mkdir -p /app/database
  
  # 运行迁移
  export PAYLOAD_CONFIG_PATH=src/payload.config.ts
  npm run migrate:content
else
  echo "✅ Database exists, skipping migration."
fi

# 启动主应用
echo "🚀 Starting Next.js..."
exec "$@"