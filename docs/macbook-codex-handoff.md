# MacBook Codex Handoff

这份文档用于把申冷官网维护工作迁移到另一台 MacBook Air，并交给那台机器上的 Codex 执行。文档可以提交到仓库；真正的密钥文件、SSH key、GitHub 登录态不要提交。

## 给新 Mac 上 Codex 的提示词

把下面整段复制给新 MacBook Air 上的 Codex：

````text
你现在在一台新的 MacBook Air 上，任务是把 Shenleng 官网项目配置成可本地修改、预览、提交并触发线上部署的维护环境。

重要安全规则：
- 不要在回复、终端输出总结、文档或 commit 中展示 .secrets、.env、SSH 私钥、GitHub token、Cloudflare token、阿里云密钥的明文值。
- 可以检查 secret 文件里有哪些 key，但只能输出 key 名，不输出 value。
- 不要提交 .secrets、.env、*.pem、node_modules、.next、database、*.db。
- 日常部署走 GitHub Actions + Cloudflare R2 + ECS pull-agent；不要 SSH 到 ECS 构建，不要重启 ECS，不要 docker build。
- 如果发现本地文件有用户未提交修改，先汇报并保护它们，不要覆盖。

目标验收：
1. 本机能 clone 或打开 `sarsimour/shenleng`。
2. Node 使用 20.x。
3. `npm ci --legacy-peer-deps` 成功。
4. 从 `.secrets` 生成本地 `.env`，且 `.env` 权限为 600。
5. `npm run build` 成功。
6. `npm run dev` 能启动，浏览器打开 `http://localhost:3000` 能看到网站。
7. 能用 `sarsimour` 的 GitHub 账号 push 到 `master`。
8. push 后能看到 GitHub Actions 的 `Deploy Shenleng Web (R2 Pull Artifact)` 运行，并知道线上通常 2-4 分钟后更新。
9. 可选：`ssh aliyun` 能登录，仅作为维护通道，不作为日常发布方式。

请按下面步骤执行，并在每一步后简短汇报结果。

一、准备系统工具

先检查是否已有工具：

```bash
xcode-select -p
command -v brew
command -v git
command -v gh
command -v fnm
```

如果没有 Xcode Command Line Tools，让用户手动同意安装：

```bash
xcode-select --install
```

如果没有 Homebrew，去 https://brew.sh/ 按官方命令安装。安装后把 Homebrew 初始化写入 `~/.zprofile` 或 `~/.zshrc`：

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

安装维护需要的工具：

```bash
brew install git gh fnm
```

配置 Node 20：

```bash
eval "$(fnm env --use-on-cd)"
fnm install 20
fnm default 20
node -v
npm -v
```

如果 `node -v` 不是 `v20.x`，先修好 Node 版本再继续。

二、登录 GitHub

使用 `sarsimour` 的 GitHub 账号登录。优先用浏览器登录，不要把 token 打印出来：

```bash
gh auth login -h github.com -p https -w
gh auth status
```

配置 git identity：

```bash
git config --global user.name "sarsimour"
git config --global user.email "<GitHub commit email or noreply email>"
```

`user.email` 用旧电脑上的 git 提交邮箱或 GitHub noreply 邮箱，由用户私下提供，不要写进仓库文档。

三、获取项目

```bash
mkdir -p ~/Projects
cd ~/Projects
gh repo clone sarsimour/shenleng
cd ~/Projects/shenleng
git status --short --branch
git remote -v
```

确认远端是 `https://github.com/sarsimour/shenleng.git`。

四、复制 secrets

用户会把旧电脑上的 `.secrets` 通过 AirDrop、U 盘、加密压缩包或其他私密方式复制到新电脑。把它放到：

```text
~/Projects/shenleng/.secrets
```

设置权限：

```bash
cd ~/Projects/shenleng
chmod 600 .secrets
```

只检查 key 名，不输出 value：

```bash
bash -lc 'set -a; source ./.secrets; set +a; env | cut -d= -f1 | sort | grep -E "^(PAYLOAD_SECRET|VERSECORE_API_BASE_URL|NEXT_PUBLIC_|CONTENT_PUBLISH_|CLOUDFLARE_|ECS_|ALIYUN_|BAIDU_|REQUEST_LOG_|ANALYTICS_|SMTP_)"'
```

从 `.secrets` 生成本地 `.env`。如果 `.secrets` 缺少 `NEXT_PUBLIC_SITE_URL`，本地 `.env` 默认写入当前测试域名：

```bash
bash -lc '
set -euo pipefail
set -a
source ./.secrets
set +a
tmp="$(mktemp)"
for key in \
  PAYLOAD_SECRET \
  VERSECORE_API_BASE_URL \
  NEXT_PUBLIC_VERSECORE_APP_ID \
  NEXT_PUBLIC_LOGISTICS_CHATBOT_ID \
  NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME \
  NEXT_PUBLIC_SITE_URL \
  NEXT_PUBLIC_BAIDU_SITE_VERIFICATION \
  CONTENT_PUBLISH_TOKEN \
  REQUEST_LOG_SHARED_SECRET
do
  value="${!key-}"
  if [ -n "$value" ]; then
    escaped="${value//\\/\\\\}"
    escaped="${escaped//\"/\\\"}"
    printf "%s=\"%s\"\n" "$key" "$escaped" >> "$tmp"
  fi
done
if ! grep -q "^NEXT_PUBLIC_SITE_URL=" "$tmp"; then
  printf "%s=\"%s\"\n" NEXT_PUBLIC_SITE_URL "https://shenleng.roinland.com" >> "$tmp"
fi
mv "$tmp" .env
chmod 600 .env
'
```

验证 `.env` 只输出 key：

```bash
cut -d= -f1 .env | sort
git check-ignore -v .env .secrets
```

五、安装并验证项目

本项目线上 workflow 使用 npm，所以本机也使用 npm：

```bash
npm ci --legacy-peer-deps
npm run generate:importmap
npm run build
```

启动本地预览：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

如果需要验证聊天入口：

```bash
curl -i -X POST http://127.0.0.1:3000/api/proxy/users/anonymous
```

如果 VerseCore 后端没有在本机运行，聊天代理失败是可以接受的；前提是线上环境仍由服务器 `.env` 配置 `VERSECORE_API_BASE_URL`。

六、日常修改流程

每次开始前：

```bash
cd ~/Projects/shenleng
git pull --rebase origin master
npm run dev
```

常见文案位置：

```text
src/components/sections/Hero.tsx
src/components/sections/Services.tsx
src/components/sections/RealityProof.tsx
src/components/sections/ValueProp.tsx
src/components/sections/Trust.tsx
src/components/layout/Header.tsx
src/components/layout/Footer.tsx
src/lib/service-pages.ts
src/app/(app)/about/page.tsx
src/app/(app)/contact/page.tsx
```

图片通常在：

```text
public/images/
```

修改后：

```bash
npm run build
git status --short
git diff --stat
```

确认没有 `.env`、`.secrets`、`*.pem`、数据库文件后再提交：

```bash
git add <本次相关文件>
git commit -m "fix(ui): update website copy"
git push origin master
```

观察自动部署：

```bash
gh run list --workflow deploy.yml --limit 5
gh run watch
```

线上验证：

```bash
curl -I https://shenleng.roinland.com/
curl -I https://shenleng.roinland.com/articles
curl -s https://shenleng.roinland.com/sitemap.xml | head
```

七、文章发布

新增或重发文章优先阅读：

```text
docs/content_publish_https.md
```

日常内容包发布不要 SSH，不要让服务器下载外部图片。可以用 GitHub Actions 手动运行 `Publish Shenleng Content`，输入：

```text
content_file: <仓库内文章 JSON 路径>
site_url: https://shenleng.roinland.com
```

八、可选 SSH 维护通道

SSH 只用于服务器维护、排障、检查服务状态，不用于日常发布。

如果用户提供了旧电脑上的 SSH config 和私钥，把私钥放到：

```text
~/.ssh/<key-file>.pem
```

设置权限：

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/<key-file>.pem
chmod 600 ~/.ssh/config
```

`~/.ssh/config` 中可以配置 host alias `aliyun`，但不要把真实 HostName 或私钥内容写进仓库。配置好后验证：

```bash
ssh aliyun 'hostname; date; systemctl is-active shenleng-web.service shenleng-web-pull-agent.timer cloudflared.service'
```

如果 SSH 不通，不要因此阻塞日常网站发布。默认发布链路不依赖 SSH。

九、最终交付说明

完成后请向用户汇报：
- Node/npm 版本。
- 项目路径。
- `.env` 和 `.secrets` 是否被 git ignore。
- `npm run build` 是否成功。
- 本地预览 URL。
- GitHub auth 当前账号。
- 是否已验证 push 权限。
- 如果做了测试 commit/push，给出 commit hash 和 GitHub Actions 运行状态。
````

## 给人的准备清单

在旧电脑上准备这些东西，然后私下传到新电脑：

- `.secrets`：包含本地运行和可选发布所需环境变量。不要放进仓库。
- 可选 `.env`：如果 `.secrets` 足够完整，可以不传 `.env`，让新 Mac 的 Codex 生成。
- 可选 SSH 私钥和 `~/.ssh/config` 中的 `aliyun` 配置：只用于维护通道。
- GitHub 账号 `sarsimour` 的登录方式：推荐浏览器登录 `gh auth login` 或 GitHub Desktop。

当前项目的日常前端发布方式是 push 到 `master`，由 GitHub Actions 自动部署。服务器上的 `.env`、数据库和媒体持久化目录不应该由新 Mac 覆盖。

## 不要交给新 Mac 的东西

- 不要把服务器 `/home/ecs-user/Projects/shenleng/.env` 随意覆盖到本地后再提交。
- 不要把 ECS 数据库、`persistence/`、`payload.db` 当作普通源码同步。
- 不要把 Cloudflare、阿里云、GitHub token 写进 README、issue、commit message 或聊天记录。
- 不要在 ECS 上运行 `npm install`、`npm run build`、`docker build` 或重启 ECS 来完成日常页面更新。

## 迁移后推荐演练

新 Mac 配好后，做一次低风险演练：

1. 修改一处不影响业务的页面文案。
2. 本地 `npm run build`。
3. commit 信息使用 `fix(ui): test MacBook handoff`。
4. push 到 `master`。
5. 等 GitHub Actions 成功。
6. 线上确认更新。
7. 如只是测试，再提交一次正式文案把测试内容改回。

如果这次演练成功，以后她只需要按“日常修改流程”操作即可。
