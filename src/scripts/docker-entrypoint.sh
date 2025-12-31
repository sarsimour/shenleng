#!/bin/sh
set -e

# 如果数据库文件不存在，说明是首次启动，运行迁移
if [ ! -f /app/payload.db ]; then
  echo "🆕 Initializing database and migrating content..."
  
  # 确保文件存在以避免权限问题，虽然 Payload 会创建它
  # 但这里的关键是运行迁移脚本
  # 注意：migrate:content 脚本里已经包含了 payload.init
  
  # 我们需要使用 payload-config 环境变量
  export PAYLOAD_CONFIG_PATH=src/payload.config.ts
  
  # 运行迁移
  # 注意：此时主进程还没启动，所以没有锁冲突
  npm run migrate:content
fi

# 启动主应用
echo "🚀 Starting Next.js..."
exec "$@"
