# 部署方案

测试期线上域名为 `https://shenleng.roinland.com`，正式上线域名切换时必须同步更新 `NEXT_PUBLIC_SITE_URL` 并重新构建。

默认前端发布入口是 `.github/workflows/deploy.yml`，它走 Cloudflare R2 manifest pull：GitHub Runner 构建 standalone artifact 并上传 R2，ECS 上的 pull-agent 每 2 分钟检查 manifest，有新版本才下载、校验、启动候选版本、健康检查、切换或回滚。

`scripts/check-light-deploy-policy.sh` 会在默认发布 workflow 开始时检查 `.github/workflows/deploy.yml`，如果重新混入 `docker/build-push-action`、`docker compose up`、`docker pull`、Docker prune、SSH/SCP、`reboot` 等生产重操作，workflow 会直接失败。

## 前端轻量发布（推荐日常路径）

日常前端更新不要在 ECS 上构建，也不要重启 ECS。推荐流程是：GitHub Actions 构建 Next.js standalone artifact，上传到 R2 并更新 `manifest.json`；ECS pull-agent 自动下载新 artifact 后用 `scripts/deploy-web-light.sh` 在候选端口验证，通过后再切到线上端口。

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

- 自动发布：push 到 `master` 触发 `.github/workflows/deploy.yml`，构建 artifact 后上传到 R2，并更新 `shenleng/web/manifest.json`
- ECS 自动拉取：`shenleng-web-pull-agent.timer` 每 2 分钟读取 manifest，发现新版本后下载、校验 sha256，并执行 `scripts/deploy-web-light.sh --yes`
- 手动候选验证：运行 `.github/workflows/deploy-artifact-candidate.yml`，构建 artifact 后执行 `scripts/deploy-web-light.sh --candidate-only`

日常发布不再需要 SSH。SSH/SCP 只保留给一次性安装 pull-agent、极端恢复、候选验证等人工维护场景。

默认 workflow 不把运行时 `.env` 写入 ECS。运行时环境由服务器上的 `/home/ecs-user/Projects/shenleng/.env` 管理；只有 `NEXT_PUBLIC_*` 这类构建期公开变量来自 GitHub Secrets 并写入 artifact。

## 内容轻量发布（文章和封面图）

文章、封面图这类内容更新不走前端 artifact，不触发构建，不重启 `shenleng-web`。默认路径是：

```text
GitHub Runner 准备文章 JSON 和封面图
  -> Runner 压缩封面图并生成内容包
  -> 上传内容包到 R2
  -> HTTPS POST 小体积触发请求 /api/content-publish
  -> 服务器从 R2 下载内容包并校验 sha256
  -> 服务器写入 persistence/media 和 SQLite
  -> revalidate /articles、文章页、sitemap
```

相关文件：

- `src/app/api/content-publish/route.ts`
- `src/scripts/publish-content.ts`
- `scripts/publish-r2-content-package.py`
- `.github/workflows/publish-content.yml`
- `docs/content_publish_https.md`

生产环境必须设置 `CONTENT_PUBLISH_TOKEN`，GitHub workflow 使用同名 repository secret。日常内容发布不要使用 SSH、SCP、Cloud Assistant，也不要让服务器下载外部图片。GitHub workflow 使用 R2 存放临时内容包，避免大体积 POST 被 Cloudflare challenge 拦截；服务器只接受 allowlist 内的 R2 package URL，并校验 sha256。

`src/scripts/publish-content.ts` 支持两类输入：新的发布 spec，以及仓库里已有的 `data/nextjs_content/content/json/*.json` 迁移文章。迁移文章会在 GitHub Runner 上读取 `public/images` 封面图、本地压缩后再通过 HTTPS 写入线上。

## 无 SSH 发布路径（R2 manifest pull）

为了解决 SSH 经常不可用的问题，默认发布链路是：

```text
GitHub Actions 构建 standalone artifact
  -> 上传到 Cloudflare R2
  -> 写 manifest.json
  -> ECS pull agent 定时读取 manifest
  -> 下载 artifact
  -> 校验 sha256
  -> 调用 scripts/deploy-web-light.sh
```

相关文件：

- `.github/workflows/deploy.yml`
- `scripts/publish-r2-artifact.py`
- `scripts/deploy-web-pull-agent.sh`
- `scripts/install-web-pull-agent-systemd.sh`
- `systemd/shenleng-web-pull-agent.service.template`
- `systemd/shenleng-web-pull-agent.timer`

这条链路的资源消耗：

- GitHub Runner 负责 `npm ci` 和 `npm run build`
- ECS 只负责下载、sha256 校验、解压、候选端口验证和切换
- ECS 不执行 `npm install`
- ECS 不执行 `npm run build`
- ECS 不执行 `docker build`
- ECS 不执行 `docker pull`
- ECS 不重启

GitHub workflow 需要这些 Secrets：

| Secret | 用途 |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id |
| `CLOUDFLARE_API_TOKEN` | 允许写入 R2 object 的 API token |
| `CLOUDFLARE_R2_BUCKET_NAME` | R2 bucket 名称，当前使用 `shenleng-web-deploy` |
| `CLOUDFLARE_R2_PUBLIC_BASE_URL` | R2 公共读取根 URL |
| `CLOUDFLARE_R2_PREFIX` | 可选，默认 `shenleng/web` |
| `NEXT_PUBLIC_SITE_URL` | 必填，构建期公开站点 URL |
| `NEXT_PUBLIC_LOGISTICS_CHATBOT_ID` | 必填，构建期公开 chatbot id |

ECS 安装 pull-agent 示例：

```bash
cd /home/ecs-user/Projects/shenleng

scripts/install-web-pull-agent-systemd.sh \
  --project-dir /home/ecs-user/Projects/shenleng \
  --manifest-url https://<r2-public-domain>/shenleng/web/manifest.json \
  --public-url https://shenleng.roinland.com
```

安装后日常发布不再需要 SSH。GitHub 只需要更新 R2 上的 `manifest.json`；ECS 每 2 分钟检查一次，有新版本就拉取并部署。

注意：第一次安装 pull agent 仍需要一次控制通道。可以是 SSH、云助手、Workbench 或迁移镜像预装。安装后，日常前端发布可以不依赖 SSH。

`.github/workflows/deploy-oss-artifact.yml` 和 `scripts/publish-oss-artifact.py` 仍保留为阿里云 OSS 备选路径；当前默认路径不用它们。

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
- R2 上传脚本：`scripts/publish-r2-artifact.py`
- ECS pull-agent：`scripts/deploy-web-pull-agent.sh`
- 默认 workflow policy：`scripts/check-light-deploy-policy.sh`
- 旧镜像编排：`docker-compose.yml`（仅运行环境变化时参考）
- 旧镜像构建：`Dockerfile`（仅运行环境变化时参考）

## 必需的 GitHub Secrets

| Secret | 用途 |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | 上传 R2 artifact 和 manifest |
| `CLOUDFLARE_R2_BUCKET_NAME` / `CLOUDFLARE_R2_PUBLIC_BASE_URL` | R2 artifact 存储和公开读取 |
| `NEXT_PUBLIC_SITE_URL` | 必填，公开站点根 URL；canonical、sitemap、robots、JSON-LD 都从这里生成 |
| `NEXT_PUBLIC_LOGISTICS_CHATBOT_ID` | 必填，Next.js 构建时写入客户端的固定 VerseCore chatbot UUID |
| `NEXT_PUBLIC_VERSECORE_APP_ID` | 可选，默认 `logistics-web` |
| `NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME` | 可选，默认 `申冷售前顾问` |
| `ECS_HOST` / `ECS_USER` / `ECS_SSH_KEY` | 仅人工维护或候选验证需要，不在默认发布 workflow 使用 |
| `PAYLOAD_SECRET` / `VERSECORE_API_BASE_URL` | 运行时在 ECS `.env` 中管理，默认发布 workflow 不写入 |
| `REQUEST_LOG_SHARED_SECRET` | 可选，服务端访问日志接口共享密钥；未配置时接口仍可写入，但有基础频率限制 |
| `BAIDU_PUSH_ENDPOINT` / `BAIDU_SITE` / `BAIDU_TOKEN` | 可选，百度搜索资源平台普通收录提交脚本使用 |
| `ANALYTICS_REPORT_TO` / `ANALYTICS_WEBHOOK_URL` | 可选，营销分析日报推送 |

## 触发方式

- 自动：push 到 `master`
- 手动发布：GitHub Actions → Deploy Shenleng Web (R2 Pull Artifact) → Run workflow
- 手动候选验证：GitHub Actions → Deploy Artifact Candidate → Run workflow

## 时间预期

- GitHub Runner 冷缓存构建：通常数分钟，资源消耗发生在 GitHub Runner，不发生在 ECS
- ECS 侧发现 manifest、下载、候选启动、健康检查、切换：通常 2-4 分钟，取决于 pull-agent timer、artifact 大小和网络
- ECS 不执行镜像 build，不拉大镜像，不重启机器

## 镜像产物

- 轻量发布产物：`shenleng-web-standalone.tgz`
- R2 manifest：`shenleng/web/manifest.json`
- R2 artifact：`shenleng/web/artifacts/<run-id>-<sha>/shenleng-web-standalone.tgz`
- 服务器下载目录：`/home/ecs-user/Projects/shenleng/artifact-uploads/pull-agent/<version>/`
- 服务器 release 目录：`/home/ecs-user/Projects/shenleng/releases/web-<timestamp>-<sha>/`
- 旧镜像仓库（仅运行环境变化时参考）：`crpi-magb6k3sv0c9s8ci.cn-shanghai.personal.cr.aliyuncs.com/sl-2026/slgw`
- Tag：`latest`（每次部署覆盖；想留版本快照请新增 tag）

## ECS 上的状态

- 项目目录：`/home/ecs-user/Projects/shenleng/`
- 持久化卷：`./persistence/sqlite`、`./persistence/media`（不在镜像里，不会被覆盖）
- `.env` 在服务器上持久化管理，包含 `PAYLOAD_SECRET`、`VERSECORE_API_BASE_URL` 和 AI 助手配置；默认发布 workflow 不覆盖它
- `.deploy-pull.env` 保存 pull-agent 的 manifest URL、项目目录和公开 URL
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
