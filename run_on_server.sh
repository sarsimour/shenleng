#!/bin/bash
set -e

echo "🚀 === Shenleng Server Launcher (No Docker) ==="

# 1. 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed."
    exit 1
fi
echo "✅ Node.js $(node -v) detected."

# 2. 确保必要的目录存在
echo "📂 Creating directories..."
mkdir -p database

# 3. 设置环境变量 (如果没有 .env 文件)
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating default..."
    echo "PAYLOAD_SECRET=$(openssl rand -hex 16)" > .env
    echo "DATABASE_URI=file:./database/payload.db" >> .env
    echo "PORT=3000" >> .env
    echo "✅ Created .env with generated secret."
else
    echo "✅ .env file found."
fi

# 4. 安装依赖
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# 5. 构建项目
echo "🏗️  Building Next.js project..."
npm run build

# 6. 启动服务
echo "▶️  Starting server on port 3000..."
echo "   (Use 'Ctrl+C' to stop, or run with 'nohup ... &' for background)"
npm run start
