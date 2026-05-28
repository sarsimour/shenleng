# 部署方案

测试期线上域名为 `https://shenleng.roinland.com`，正式上线域名切换时必须同步更新 `NEXT_PUBLIC_SITE_URL` 并重新构建。

默认前端发布入口是 `.github/workflows/deploy.yml`，它只走轻量 artifact 发布：GitHub Runner 构建，ECS 只接收 artifact、启动候选版本、健康检查、切换或回滚。

`scripts/check-light-deploy-policy.sh` 会在默认发布 workflow 开始时检查 `.github/workflows/deploy.yml`，如果重新混入 `docker/build-push-action`、`docker compose up`、`docker pull`、Docker prune、`reboot` 等生产重操作，workflow 会直接失败。

## 前端轻量发布（推荐日常路径）

日常前端更新不要在 ECS 上构建，也不要重启 ECS。推荐流程是：在本地或 CI 构建 Next.js standalone artifact，上传到服务器后用 `scripts/deploy-web-light.sh` 在候选端口验证，通过后再切到线上端口。

运行层由 `shenleng-web.service` 托管，前端会在 ECS 重启后自动恢复；`shenleng-web-watchdog.timer` 每分钟做轻量健康检查，只重启异常的前端、tunnel、云助手或 SSH 服务，不重启 ECS。迁移和恢复步骤见 `docs/server_runtime_recovery.md`。

这个脚本的边界：

- 不执行 `docker build`
- 不执行 `pnpm build` / `npm run build`
- 不执行依赖安装
- 不执行 `reboot`
- 不执行 Docker prune
- 不覆盖正在运行的 release

服务器侧示例：

```bash
cd /home/ecs-user/Projects/shenleng
scripts/deploy-web-light.sh \
  --artifact /home/ecs-user/Projects/shenleng/artifact-uploads/<run-id>/shenleng-artifact-candidate.tgz \
  --yes
```

只验证候选版本、不切线上：

```bash
scripts/deploy-web-light.sh \
  --artifact /path/to/shenleng-artifact-candidate.tgz \
  --candidate-only
```

固定安全检查：

- 当前公网首页必须健康，默认检查 `https://shenleng.roinland.com/`
- 1 分钟 load 不能超过 `MAX_LOAD_1M`，默认 `2.5`
- 可用内存不能低于 `MIN_AVAILABLE_MEM_MB`，默认 `256`
- 项目所在磁盘可用空间不能低于 `MIN_FREE_DISK_MB`，默认 `2048`
- 如果已有 `docker build`、`next build`、`pnpm build`、`npm install` 等重任务，拒绝部署
- 候选版本先在 `127.0.0.1:3101` 启动
- 候选版本检查 `/`、`/articles`、`/sitemap.xml`
- 候选版本检查旧 URL 映射 `/show.asp?id=1233` 必须跳到 `/articles/...`
- 线上切换后再次检查本地端口和公网首页、文章页

fallback 机制：

- 切换前记录当前 `3000` 端口进程的工作目录
- 如果 `3000` 端口不是可识别的 release 进程，默认拒绝替换，避免误杀 Docker/Nginx/其他生产进程
- 新版本切到 `3000` 后如果本地或公网检查失败，脚本会停止新进程
- 如果旧进程目录可识别，脚本会用旧 release 重新拉起 `3000`
- 每次成功后写入 `state/web-deploy/current-release`
- 保留最近 `KEEP_RELEASES` 个 release，默认 `5`

推荐运行参数：

```bash
PROJECT_DIR=/home/ecs-user/Projects/shenleng
PUBLIC_URL=https://shenleng.roinland.com
ACTIVE_PORT=3000
CANDIDATE_PORT=3101
WEB_DEPLOY_VERSECORE_API_BASE_URL=http://127.0.0.1:9000
```

如果 `.env` 里仍然是 Docker 网络地址 `http://versecore-api:9000`，脚本会在宿主机进程模式下自动改用 `http://127.0.0.1:9000`，避免前端代理找不到后端。

镜像部署仅用于运行环境变化，例如 Node 版本、系统依赖、`package.json` 依赖、Dockerfile 变化。普通页面、组件、样式、文章模板、前端代理逻辑更新都走轻量发布。

## GitHub Actions 入口

- 自动发布：push 到 `master` 触发 `.github/workflows/deploy.yml`，构建 artifact 后执行 `scripts/deploy-web-light.sh --yes`
- 手动候选验证：运行 `.github/workflows/deploy-artifact-candidate.yml`，构建 artifact 后执行 `scripts/deploy-web-light.sh --candidate-only`
- 手动只验证不切流量：运行 `.github/workflows/deploy.yml`，勾选 `candidate_only`

这两个 workflow 都复用同一个远端脚本，避免出现两套不同的部署逻辑。

当前 GitHub Actions 上传 artifact 和执行远端脚本仍依赖 SSH/SCP。它已经避免了 ECS 构建、镜像拉取和服务器重启，但还不是最终的“无 SSH 发布”。如果要彻底去掉 SSH，需要改为 GitHub 上传 OSS artifact 和 manifest，ECS 上的 pull agent 定时拉取并调用 `deploy-web-light.sh`。

## 旧镜像架构（仅运行环境变化时参考）

```
manual runtime-image rebuild
   ↓
GitHub Actions Runner（7GB RAM, AMD64）
   ├── docker buildx build  →  linux/amd64 镜像
   └── docker push          →  阿里云 ACR 个人版（cn-shanghai）
                                      ↓
                            ECS（1.6GB RAM, cn-shanghai）
                                      ↓
                            docker pull + docker compose up -d
                                      ↓
                            schema:sync → smoke:post-deploy → nginx -s reload
```

**关键约束**（决定了为什么是这条路线，详见 `troubleshooting.md`）：
- ECS 只有 1.6 GB 内存，无法本地 build Next.js + Payload
- ECS 不能访问 `github.com`，无法 git clone
- ACR 个人版的 GitHub 源码自动构建已不稳定

## 配置入口

- 默认流水线：`.github/workflows/deploy.yml`
- 手动候选验证：`.github/workflows/deploy-artifact-candidate.yml`
- 远端轻量发布脚本：`scripts/deploy-web-light.sh`
- 默认 workflow policy：`scripts/check-light-deploy-policy.sh`
- 旧镜像编排：`docker-compose.yml`（仅运行环境变化时参考）
- 旧镜像构建：`Dockerfile`（仅运行环境变化时参考）

## 必需的 GitHub Secrets

| Secret | 用途 |
|---|---|
| `ECS_HOST` / `ECS_USER` / `ECS_SSH_KEY` | SSH 到 ECS 的凭据 |
| `PAYLOAD_SECRET` | Payload CMS 加密 secret |
| `VERSECORE_API_BASE_URL` | 可选，默认 `http://127.0.0.1:9000`（宿主机前端进程访问后端） |
| `NEXT_PUBLIC_SITE_URL` | 必填，公开站点根 URL；canonical、sitemap、robots、JSON-LD 都从这里生成 |
| `NEXT_PUBLIC_LOGISTICS_CHATBOT_ID` | 必填，Next.js 构建时写入客户端的固定 VerseCore chatbot UUID |
| `NEXT_PUBLIC_VERSECORE_APP_ID` | 可选，默认 `logistics-web` |
| `NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME` | 可选，默认 `申冷售前顾问` |
| `REQUEST_LOG_SHARED_SECRET` | 可选，服务端访问日志接口共享密钥；未配置时接口仍可写入，但有基础频率限制 |
| `BAIDU_PUSH_ENDPOINT` / `BAIDU_SITE` / `BAIDU_TOKEN` | 可选，百度搜索资源平台普通收录提交脚本使用 |
| `ANALYTICS_REPORT_TO` / `ANALYTICS_WEBHOOK_URL` | 可选，营销分析日报推送 |

## 触发方式

- 自动：push 到 `master`
- 手动发布或候选验证：GitHub Actions → Deploy Shenleng Web (Light Artifact) → Run workflow

## 时间预期

- GitHub Runner 冷缓存构建：通常数分钟，资源消耗发生在 GitHub Runner，不发生在 ECS
- ECS 侧上传、候选启动、健康检查、切换：通常秒级到 1-2 分钟，取决于 artifact 大小和网络
- ECS 不执行镜像 build，不拉大镜像，不重启机器

## 镜像产物

- 轻量发布产物：`shenleng-web-standalone.tgz`
- 服务器上传目录：`/home/ecs-user/Projects/shenleng/artifact-uploads/<run-id>-<sha>/`
- 服务器 release 目录：`/home/ecs-user/Projects/shenleng/releases/web-<timestamp>-<sha>/`
- 旧镜像仓库（仅运行环境变化时参考）：`crpi-magb6k3sv0c9s8ci.cn-shanghai.personal.cr.aliyuncs.com/sl-2026/slgw`
- Tag：`latest`（每次部署覆盖；想留版本快照请新增 tag）

## ECS 上的状态

- 项目目录：`/home/ecs-user/Projects/shenleng/`
- 持久化卷：`./persistence/sqlite`、`./persistence/media`（不在镜像里，不会被覆盖）
- `.env` 由 workflow 写入，包含 `PAYLOAD_SECRET`、`VERSECORE_API_BASE_URL` 和 AI 助手公开配置
- 当前测试期 `NEXT_PUBLIC_SITE_URL` 应为 `https://shenleng.roinland.com`。正式域名启用前不要在代码里硬编码新旧域名，只改 GitHub Secret 后重新部署；生产中非规范 Host 的 GET/HEAD 请求会自动跳到该 URL。

## 磁盘维护

ECS 系统盘 40 GB。默认发布 workflow 不执行 Docker prune。前端 release 由 `KEEP_RELEASES` 控制保留数量，默认保留最近 5 个。

Docker 镜像清理、系统级清理、批量删除都属于高风险维护动作，需要人工确认后手动执行，不放进默认发布流程。

## 回滚

`scripts/deploy-web-light.sh` 在切换前会记录当前 `3000` 端口进程的 release 目录。新版本切到 `3000` 后如果本地或公网检查失败，会自动停止新进程并尝试拉回旧 release。

人工回滚也可以直接读取：

```bash
cat /home/ecs-user/Projects/shenleng/state/web-deploy/previous-release
cat /home/ecs-user/Projects/shenleng/state/web-deploy/current-release
```
