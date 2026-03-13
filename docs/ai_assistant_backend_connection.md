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
- `POST /chatbots/{id}/chat/start`
- `POST /chatbots/{id}/chat/{session_id}`（流式）

## 5) 多前端共享后端时的 app 信息
前端现在会在请求头中自动携带：
- `X-App-ID: logistics-web`（可通过环境变量覆盖）

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

## 7) 知识检索调试接口（后端）
新增用于验证召回效果的接口：
- `POST /knowledge/retrieve_debug`

请求体：
```json
{
  "org_id": "<组织 UUID>",
  "query": "用户问题",
  "top_k": 4
}
```

返回包含：
- `access_levels`
- `hit_count`
- `documents`（`content/type/name/file_path`）
