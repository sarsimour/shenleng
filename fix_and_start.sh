#!/bin/bash
set -e

# 配置
DATA_ROOT="$HOME/data/shenleng"
PROJECT_DIR="$HOME/Projects/shenleng"
SECRET="manual_fix_secret_123" # 临时 Secret，为了跑通流程

echo "🔧 === Shenleng Fix & Start Script ==="

# 1. 修复目录与权限
echo -e "\n📂 [1/4] Ensuring Directories & Permissions..."
mkdir -p "$DATA_ROOT/persistence/sqlite"
mkdir -p "$DATA_ROOT/persistence/media"
mkdir -p "$DATA_ROOT/migration_source"

# 强制将数据目录归属 UID 1000
echo "   Chowning $DATA_ROOT to 1000:1000..."
sudo chown -R 1000:1000 "$DATA_ROOT"

# 2. 拉取最新镜像
echo -e "\n📥 [2/4] Pulling Latest Image..."
cd "$PROJECT_DIR"
# 如果 docker-compose pull 失败（权限问题），尝试 sudo
docker compose pull || echo "⚠️ Pull warning, trying to use local image if available."

# 3. 执行数据迁移 (一次性容器)
echo -e "\n🚀 [3/4] Running Migration..."
docker run --rm \
    --user "1000:1000" \
    -v "$DATA_ROOT/persistence/sqlite":/app/database \
    -v "$DATA_ROOT/persistence/media":/app/public/media \
    -v "$DATA_ROOT/migration_source":/app/migration_data \
    -e PAYLOAD_SECRET="$SECRET" \
    -e DATABASE_URI="file:/app/database/payload.db" \
    -e PAYLOAD_CONFIG_PATH="src/payload.config.ts" \
    -e MIGRATION_DATA_DIR="/app/migration_data" \
    ghcr.io/sarsimour/shenleng:latest \
    npx tsx src/scripts/migrate_server_local.ts

# 4. 启动服务
echo -e "\n▶️ [4/4] Starting Service..."
docker compose down || true
docker compose up -d

echo "✅ Done! Please verify with ./diagnose_server.sh"
