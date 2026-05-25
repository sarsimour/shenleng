# AI 助手连接 VerseCore（本地 + 服务器）

## 1) 架构说明
- 前端统一请求：`/api/proxy/*`
- Next.js 路由代理：`src/app/api/proxy/[...path]/route.ts`
- 真实后端地址：`VERSECORE_API_BASE_URL`

若未配置 `VERSECORE_API_BASE_URL`：
- 开发环境默认：`http://127.0.0.1:8000`
- 生产环境默认：`http://versecore-api:9000`（ECS Docker 共享网络内）

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
curl -i -X POST http://127.0.0.1:3000/api/proxy/users/anonymous
```

## 3) 服务器联通
1. 在服务器项目 `.env` 增加：
```env
VERSECORE_API_BASE_URL=http://versecore-api:9000
```
2. 重启容器：
```bash
cd ~/Projects/shenleng
docker compose up -d
```
3. 容器内验证：
```bash
docker compose exec -T web sh -lc "curl -i -X POST http://127.0.0.1:3000/api/proxy/users/anonymous"
```

## 4) 匿名用户模式
当前前端已按匿名模式接入：
- `POST /users/anonymous`
- `POST /users/login`（占位密码）
- `POST /chatbots/{id}/chat/start`
- `POST /chatbots/{id}/chat/{session_id}`（流式）

## 5) 多前端共享后端时的 app 信息
前端现在会在请求头中自动携带：
- `X-App-ID: logistics-web`（可通过环境变量覆盖）

`/api/proxy/*` 会由服务端固定写入 `X-App-ID`，浏览器传入的同名请求头会被丢弃，避免访客伪造其他 app scope。

公网入口还在代理层按访客 IP 做小时级限流：
- `POST /users/anonymous`：每小时 8 次，限制清 localStorage 反复新建匿名账号。
- `POST /chatbots/{id}/chat/start`：每小时 15 次。
- `POST /chatbots/{id}/chat/{session_id}`：每小时 20 次。

VerseCore 后端仍保留匿名账号自身的能量配额，代理限流只是第一道公网保护。

可选环境变量：
```env
NEXT_PUBLIC_VERSECORE_APP_ID=logistics-web
NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME=申冷售前顾问
NEXT_PUBLIC_LOGISTICS_CHATBOT_ID=<必填，固定目标 chatbot 的 UUID>
```

说明：
- 现在前端不再按名称/关键词兜底选 bot，而是强依赖 `NEXT_PUBLIC_LOGISTICS_CHATBOT_ID`。
- 若未配置该变量，聊天窗口会提示“配置缺失”，但仍保留电话直呼入口。

## 6) 知识库管理页面
官网已预留知识库管理页：
- `/knowledge-admin`

该页面会通过 VerseCore 的知识管理接口执行增删改查：
- `GET /knowledge/get_docs`
- `POST /knowledge/add_doc`
- `PUT /knowledge/update_doc`
- `DELETE /knowledge/delete_doc`

## 7) 代理边界
官网代理只允许匿名登录、固定 chatbot 会话、消息发送，以及知识库管理页面需要的 CRUD 路由。后端健康检查和知识检索调试接口请在 VerseCore 内部网络或后台工具里直接访问，不经过公网官网代理。
