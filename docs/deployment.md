# 部署方案（GH Build → ACR → ECS Pull）

线上 finverse.top 的 Docker 部署流程。

## 架构

```
master push
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

- 流水线：`.github/workflows/deploy.yml`
- 运行时编排：`docker-compose.yml`（image 字段指向 ACR）
- 镜像构建：`Dockerfile`（多阶段，runner stage 显式 COPY 运行时需要的 `src/lib`、`src/scripts`、`src/payload.config.ts` 等）

## 必需的 GitHub Secrets

| Secret | 用途 |
|---|---|
| `ACR_USERNAME` | 阿里云 ACR 个人版用户名（控制台「访问凭证」） |
| `ACR_PASSWORD` | ACR 固定密码 |
| `ECS_HOST` / `ECS_USER` / `ECS_SSH_KEY` | SSH 到 ECS 的凭据 |
| `PAYLOAD_SECRET` | Payload CMS 加密 secret |
| `VERSECORE_API_BASE_URL` | 可选，默认 `http://versecore-api:9000`（容器网络内） |

## 触发方式

- 自动：push 到 `master`
- 手动：GitHub Actions → Deploy Shenleng → Run workflow

## 时间预期

- 冷缓存首次 build：~9-10 分钟（build + push 跨境 + ECS pull/restart + smoke）
- 命中 GHA cache 的增量 build：~3-5 分钟

## 镜像产物

- 仓库：`crpi-magb6k3sv0c9s8ci.cn-shanghai.personal.cr.aliyuncs.com/sl-2026/slgw`
- Tag：`latest`（每次部署覆盖；想留版本快照请新增 tag）
- 大小：~2.45 GB（包含完整 prod node_modules，因为运行时跑 tsx 脚本）

## ECS 上的状态

- 项目目录：`/home/ecs-user/Projects/shenleng/`
- 持久化卷：`./persistence/sqlite`、`./persistence/media`（不在镜像里，不会被覆盖）
- `.env` 由 workflow 写入，包含 `PAYLOAD_SECRET` 和 `VERSECORE_API_BASE_URL`

## 磁盘维护

ECS 系统盘 40 GB。Docker 旧镜像会堆积，建议每月做一次：

```bash
ssh aliyun "docker container prune -f && docker image prune -f && docker builder prune -af"
```

如果不再用旧的 `versecore-api:<tag>` 标签镜像，可用 `docker rmi` 单独清理。

## 回滚

ACR 上每次 push 都会更新 `latest`，没有保留旧 digest 的 tag。如果要回滚：

1. 在 GitHub Actions 找到上一个绿色 run，重跑（rerun）—— 它会用当时的源码重新 build push
2. 或者本地 checkout 旧 commit、手动 `docker build && docker push <ACR>/sl-2026/slgw:rollback-<sha>`，然后 SSH 上 ECS `docker pull` 后改 compose 临时切 tag

后续如果发布频率上来，建议改成每次 push 同时打 `:latest` 和 `:<git-sha>` tag。
