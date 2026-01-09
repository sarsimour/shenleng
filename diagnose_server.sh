#!/bin/bash

# ==========================================
# 申冷官网部署全自动诊断脚本
# ==========================================

echo "🔍 === Shenleng Deployment Diagnosis ==="
echo "📅 Date: $(date)"

# --- 1. 检查宿主机目录与权限 ---
echo -e "\n📂 [1/5] Checking Directories..."
DATA_DIR="$HOME/data/shenleng"
PERSISTENCE_DIR="$DATA_DIR/persistence"

if [ ! -d "$PERSISTENCE_DIR" ]; then
    echo "❌ 错误: 找不到持久化目录 $PERSISTENCE_DIR"
else
    echo "✅ 持久化目录存在."
    OWNER=$(stat -c '%u' "$PERSISTENCE_DIR")
    if [ "$OWNER" -eq "1000" ]; then
        echo "✅ 目录归属 UID 1000 (正确)."
    else
        echo "❌ 警告: 目录归属 UID $OWNER (期望 1000). Docker 写入可能会失败."
    fi
fi

# --- 2. 检查数据库文件 ---
echo -e "\n💾 [2/5] Checking Database..."
DB_FILE="$PERSISTENCE_DIR/sqlite/payload.db"
if [ -f "$DB_FILE" ]; then
    SIZE=$(ls -lh "$DB_FILE" | awk '{print $5}')
    echo "✅ payload.db 已找到 (大小: $SIZE)."
    # 检查文件权限
    DB_OWNER=$(stat -c '%u' "$DB_FILE")
    if [ "$DB_OWNER" -ne "1000" ]; then
        echo "❌ 错误: payload.db 归属 UID $DB_OWNER (期望 1000)!"
    fi
else
    echo "❌ 错误: payload.db 不存在! 迁移脚本是否运行成功?"
fi

# --- 3. 检查 Docker 状态 ---
echo -e "\n🐳 [3/5] Checking Docker Container..."
CONTAINER_NAME="shenleng-container"
if docker ps --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
    echo "✅ 容器 '$CONTAINER_NAME' 正在运行."
    
    echo "   挂载检查:"
    docker inspect $CONTAINER_NAME | grep -A 5 "Mounts" | grep "Source" | grep "data/shenleng" > /dev/null
    if [ $? -eq 0 ]; then
        echo "   ✅ 宿主机数据卷已挂载."
    else
        echo "   ❌ 挂载路径疑似错误 (请运行 docker inspect 确认)."
    fi
    
    echo "   容器内部权限检查:"
    PERM=$(docker exec $CONTAINER_NAME ls -ld /app/database | awk '{print $3}')
    if [ "$PERM" == "node" ] || [ "$PERM" == "1000" ]; then
        echo "   ✅ 容器内 /app/database 归属 '$PERM' (正确)."
    else
        echo "   ❌ 容器内 /app/database 归属 '$PERM' (期望 node/1000)!"
    fi
else
    echo "❌ 容器 '$CONTAINER_NAME' 未运行."
    echo "   最后 10 行日志:"
    docker logs --tail 10 $CONTAINER_NAME 2>/dev/null
fi

# --- 4. 检查网络连接 ---
echo -e "\n🌐 [4/5] Checking Network (Port 3000)..."
STATUS_CODE=$(curl -o /dev/null -s -w "%{http_code}\n" http://127.0.0.1:3000)
if [ "$STATUS_CODE" -eq "200" ]; then
    echo "✅ Localhost:3000 返回 200 OK. 应用健康."
elif [ "$STATUS_CODE" -eq "404" ]; then
    echo "⚠️  Localhost:3000 返回 404. 应用已启动但页面找不到 (Next.js 路由问题)."
elif [ "$STATUS_CODE" -eq "000" ]; then
    echo "❌ Localhost:3000 拒绝连接. 服务未启动或端口不对."
else
    echo "❌ Localhost:3000 返回代码: $STATUS_CODE"
fi

# --- 5. 检查 Payload 响应 ---
echo -e "\n📡 [5/5] Checking Payload API..."
API_CODE=$(curl -o /dev/null -s -w "%{http_code}\n" http://127.0.0.1:3000/api/articles)
if [ "$API_CODE" -eq "200" ]; then
    echo "✅ /api/articles 返回 200 OK. 数据库读取正常."
else
    echo "❌ /api/articles 返回 $API_CODE. 数据库或 API 故障."
fi

echo -e "\n🏁 诊断完成."
