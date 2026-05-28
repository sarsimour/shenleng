# 服务器运行层恢复与迁移复现

这份文档记录申冷前端在 ECS 上的运行层配置。它解决的是“服务器重启或前端进程异常后，网站能自动恢复”的问题，和镜像构建、代码发布是两层事情。

## 当前生产服务器改动

当前 ECS 上新增或调整了这些文件和状态：

```text
/etc/systemd/system/shenleng-web.service
/etc/systemd/system/shenleng-web-watchdog.service
/etc/systemd/system/shenleng-web-watchdog.timer
/home/ecs-user/Projects/shenleng/scripts/shenleng-web-watchdog.sh
/home/ecs-user/Projects/shenleng/scripts/deploy-web-light.sh
/home/ecs-user/Projects/shenleng/current-web
/home/ecs-user/Projects/shenleng/state/web-deploy/current-release
```

`current-web` 是一个软链接，指向当前正在运行的前端 release：

```text
/home/ecs-user/Projects/shenleng/current-web
  -> /home/ecs-user/Projects/shenleng/releases/web-<timestamp>-<sha>
```

这些服务已启用开机自启：

```text
shenleng-web.service
shenleng-web-watchdog.timer
ssh.service
cloudflared.service
aliyun.service
nginx.service
docker.service
```

## 目录约定

项目根目录：

```text
/home/ecs-user/Projects/shenleng
```

前端 release 目录：

```text
/home/ecs-user/Projects/shenleng/releases/
```

持久化数据目录，不随 release 覆盖：

```text
/home/ecs-user/Projects/shenleng/.env
/home/ecs-user/Projects/shenleng/persistence/sqlite/payload.db
/home/ecs-user/Projects/shenleng/persistence/media/
/home/ecs-user/Projects/shenleng/persistence/images/
```

## systemd 服务职责

`shenleng-web.service` 负责托管前端 Next.js standalone 进程：

```text
WorkingDirectory=/home/ecs-user/Projects/shenleng/current-web
ExecStart=/usr/bin/node server.js
PORT=3000
DATABASE_URI=file:/home/ecs-user/Projects/shenleng/persistence/sqlite/payload.db
VERSECORE_API_BASE_URL=http://127.0.0.1:9000
```

它的作用是：

- ECS 重启后自动拉起前端。
- 前端进程异常退出后自动重启。
- 始终从 `current-web` 指向的 release 启动。
- 不执行构建、不安装依赖、不拉镜像、不重启 ECS。

`shenleng-web-watchdog.timer` 每分钟运行一次 `shenleng-web-watchdog.sh`。它只做轻量健康检查和服务级恢复：

- `aliyun.service` 不活跃时重启云助手。
- `cloudflared.service` 不活跃时重启 tunnel。
- `ssh.service` / `sshd.service` 不活跃时重启 SSH。
- `ssh.service` / `sshd.service` 显示活跃但本机 SSH banner 探测失败时，重启 SSH。
- 本机 `127.0.0.1:3000` 不健康时重启 `shenleng-web.service`。
- 本机前端健康但公网不健康时重启 `cloudflared.service`。

watchdog 不会执行以下操作：

- 不重启 ECS。
- 不构建 Next.js。
- 不安装 npm/pnpm 依赖。
- 不拉取或清理 Docker 镜像。
- 不修改数据库。

## 从零迁移复现

迁移到一台新 ECS 时，先准备基础环境：

1. 安装 Node.js，并确保 `node` 可执行。
2. 安装并配置 `cloudflared`，确保 `/etc/cloudflared/config.yml` 中 `shenleng.roinland.com` 指向 `http://127.0.0.1:3000`。
3. 恢复 `/home/ecs-user/Projects/shenleng/.env`。
4. 恢复 `persistence/sqlite/payload.db`。
5. 恢复 `persistence/media/` 和 `persistence/images/`。
6. 放置一个已经构建好的 Next.js standalone release 到 `releases/`。
7. 创建 `current-web` 软链接，指向这个 release。

示例：

```bash
cd /home/ecs-user/Projects/shenleng

ln -sfn \
  /home/ecs-user/Projects/shenleng/releases/web-20260528091322-16e8c38b6d5f \
  /home/ecs-user/Projects/shenleng/current-web
```

然后运行仓库内安装脚本：

```bash
scripts/install-web-runtime-systemd.sh \
  --project-dir /home/ecs-user/Projects/shenleng \
  --user ecs-user \
  --public-url https://shenleng.roinland.com
```

安装脚本会写入：

```text
/etc/systemd/system/shenleng-web.service
/etc/systemd/system/shenleng-web-watchdog.service
/etc/systemd/system/shenleng-web-watchdog.timer
/home/ecs-user/Projects/shenleng/scripts/shenleng-web-watchdog.sh
```

并启用：

```bash
sudo systemctl enable shenleng-web.service
sudo systemctl enable shenleng-web-watchdog.timer
sudo systemctl restart shenleng-web.service
sudo systemctl start shenleng-web-watchdog.timer
```

## 迁移后验证

本机验证：

```bash
systemctl is-active shenleng-web.service
systemctl is-active shenleng-web-watchdog.timer
systemctl is-active cloudflared.service
systemctl is-active aliyun.service
curl -fsS http://127.0.0.1:3000/ >/dev/null
curl -fsS http://127.0.0.1:3000/articles >/dev/null
```

公网验证：

```bash
curl -fsS https://shenleng.roinland.com/ >/dev/null
curl -fsS https://shenleng.roinland.com/articles >/dev/null
curl -fsS https://shenleng.roinland.com/sitemap.xml >/dev/null
```

云助手验证：

```bash
aliyun ecs RunCommand \
  --RegionId cn-shanghai \
  --Type RunShellScript \
  --InstanceId.1 <instance-id> \
  --CommandContent 'date; systemctl is-active shenleng-web.service cloudflared.service aliyun.service' \
  --Timeout 30
```

## 服务级恢复命令

遇到问题时先做服务级恢复，不要先重启 ECS：

```bash
sudo systemctl restart shenleng-web.service
sudo systemctl restart cloudflared.service
sudo systemctl restart aliyun.service
sudo systemctl restart ssh.service
```

查看日志：

```bash
journalctl -u shenleng-web.service -n 100 --no-pager
journalctl -u shenleng-web-watchdog.service -n 100 --no-pager
journalctl -u cloudflared.service -n 100 --no-pager
journalctl -u aliyun.service -n 100 --no-pager
```

## 当前边界

当前运行层已经满足“轻量、尽量不重启服务器、服务异常自动恢复”的目标。

但当前 GitHub Actions 代码发布仍然通过 SSH/SCP 上传 artifact 并执行 `deploy-web-light.sh`。这比镜像发布轻很多，但还没有完全摆脱 SSH。

另外，当前生产服务器已经出现过 `ssh.service` active 但公网 SSH banner 超时的半死状态。仓库内 watchdog 已加入本机 SSH banner 探测；如果生产服务器再次可控，需要重新运行安装脚本或同步 `scripts/shenleng-web-watchdog.sh` 到服务器。

下一步如果要让发布也不依赖 SSH，需要实现：

```text
GitHub Runner 构建 artifact
-> 上传 OSS
-> 写 manifest.json
-> ECS 本机 pull agent 定时检查 manifest
-> 下载并校验 sha256
-> 调用 deploy-web-light.sh 候选验证和切换
```

仓库已经提供试验实现：

```text
.github/workflows/deploy-oss-artifact.yml
scripts/publish-oss-artifact.py
scripts/deploy-web-pull-agent.sh
scripts/install-web-pull-agent-systemd.sh
systemd/shenleng-web-pull-agent.service.template
systemd/shenleng-web-pull-agent.timer
```

安装到 ECS：

```bash
scripts/install-web-pull-agent-systemd.sh \
  --project-dir /home/ecs-user/Projects/shenleng \
  --manifest-url https://<bucket>.<endpoint>/shenleng/web/manifest.json \
  --public-url https://shenleng.roinland.com
```

安装后会启用：

```text
shenleng-web-pull-agent.timer
```

它每 2 分钟读取一次 manifest。发现新版本后下载 artifact、校验 sha256，并调用 `deploy-web-light.sh`。这个过程不依赖 SSH，不在 ECS 上构建，也不重启服务器。
