# 申冷官网部署指南 (Alibaba Cloud ACR + ECS)

## 一、阿里云容器镜像服务 (ACR) 配置

### 1. 创建 ACR 实例
1. 登录 [阿里云容器镜像服务控制台](https://cr.console.aliyun.com/)
2. 选择地域（推荐上海 `cn-shanghai`）
3. 创建个人版实例（免费）或企业版实例
4. 创建命名空间，如 `shenleng`
5. 在该命名空间下创建镜像仓库 `website`

### 2. 获取访问凭证
1. 在 ACR 控制台 → 访问凭证
2. 设置固定密码（用于 Docker 登录）
3. 记录以下信息：
   - Registry 地址: `registry.cn-shanghai.aliyuncs.com`
   - 用户名: 阿里云账号或 RAM 用户名
   - 密码: 刚才设置的固定密码

---

## 二、GitHub Secrets 配置

在 GitHub 仓库 → Settings → Secrets and variables → Actions 中添加以下 Secrets:

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `ACR_REGISTRY` | ACR 地域地址 | `registry.cn-shanghai.aliyuncs.com` |
| `ACR_NAMESPACE` | ACR 命名空间 | `shenleng` |
| `ACR_USERNAME` | ACR 登录用户名 | 阿里云账号或 RAM 用户 |
| `ACR_PASSWORD` | ACR 登录密码 | 固定密码 |
| `ECS_HOST` | ECS 服务器公网 IP | `47.xxx.xxx.xxx` |
| `ECS_USER` | SSH 登录用户名 | `ecs-user` |
| `ECS_SSH_KEY` | SSH 私钥内容 | `-----BEGIN OPENSSH...` |
| `PAYLOAD_SECRET` | Payload CMS 加密密钥 | 随机字符串 (32位+) |

---

## 三、ECS 服务器初始化 (一次性)

### 1. 安装 Docker
```bash
# CentOS / Alibaba Cloud Linux
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

### 2. 准备项目目录
```bash
mkdir -p ~/Projects/shenleng/persistence/sqlite
mkdir -p ~/Projects/shenleng/persistence/media
chmod -R 777 ~/Projects/shenleng/persistence/
```

### 3. 配置 Nginx
```bash
# 创建配置软链接
sudo ln -sf ~/Projects/shenleng/nginx.conf /etc/nginx/sites-enabled/shenleng

# 测试并重载
sudo nginx -t && sudo nginx -s reload
```

### 4. 配置 SSL (使用 Certbot)
```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 申请证书 (选择 2: Redirect 强制 HTTPS)
sudo certbot --nginx -d www.finverse.top -d finverse.top
```

---

## 四、部署流程

### 自动部署 (推荐)
1. 提交代码到 `master` 分支
2. GitHub Actions 自动执行:
   - 构建 Docker 镜像
   - 推送到阿里云 ACR
   - SSH 到 ECS 服务器拉取并部署

### 手动部署
```bash
# 在 ECS 服务器上
cd ~/Projects/shenleng

# 登录 ACR
docker login registry.cn-shanghai.aliyuncs.com

# 拉取最新镜像
docker pull registry.cn-shanghai.aliyuncs.com/shenleng/website:latest

# 重启服务
docker compose down
docker compose up -d
```

---

## 五、数据迁移

首次部署后需要迁移文章数据:

```bash
# 在 ECS 服务器上
cd ~/Projects/shenleng

# 确保 migration 数据存在
# 将 data/nextjs_content 目录复制到服务器

# 进入容器执行迁移
docker compose exec web sh -c "cd /app && npx tsx src/scripts/migrate-content.ts"
```

或在 GitHub Actions 中手动触发 `workflow_dispatch` 事件。

---

## 六、验证

1. 访问 https://www.finverse.top 检查首页
2. 访问 https://www.finverse.top/articles 检查文章列表
3. 访问 https://www.finverse.top/admin 检查后台管理

---

## 七、常见问题

### 镜像拉取失败
- 检查 ACR 凭证是否正确
- 检查 ECS 服务器是否能访问 ACR (同地域内网更快)

### 权限错误
```bash
# 重置权限
sudo chmod -R 777 ~/Projects/shenleng/persistence/
```

### 数据库锁定
```bash
# 重启容器
docker compose restart
```

### Nginx 502 错误
```bash
# 检查容器是否运行
docker compose ps
docker compose logs web
```
