# AI 助手连接 VerseCore（本地 + 服务器）

## 1) 架构说明
- 前端统一请求：`/api/proxy/*`
- Next.js 路由代理：`src/app/api/proxy/[...path]/route.ts`
- 真实后端地址：`VERSECORE_API_BASE_URL`

若未配置 `VERSECORE_API_BASE_URL`：
- 开发环境默认：`http://127.0.0.1:8000`
- 生产环境默认：`https://api.finverse.top/v2`

## 2) 本地联通
1. 启动 VerseCore：
```bash
cd /Users/s/Projects/VerseCore
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```
2. 启动 shenleng：
```bash
cd /Users/s/Projects/shenleng
pnpm dev
```
3. 验证代理：
```bash
curl -i http://127.0.0.1:3000/api/proxy/health
```

## 3) 服务器联通
1. 在服务器项目 `.env` 增加：
```env
VERSECORE_API_BASE_URL=https://api.finverse.top/v2
```
2. 重启容器：
```bash
cd ~/Projects/shenleng
docker compose up -d
```
3. 容器内验证：
```bash
docker compose exec -T web sh -lc "curl -i http://127.0.0.1:3000/api/proxy/health"
```

## 4) 匿名用户模式
当前前端已按匿名模式接入：
- `POST /users/anonymous`
- `POST /users/login`（占位密码）
- `GET /chatbots`
- `POST /chatbots/{id}/chat/start`
- `POST /chatbots/{id}/chat/{session_id}`（流式）
