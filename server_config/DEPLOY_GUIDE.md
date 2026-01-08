# 申冷官网直接部署指南 (Bare Metal Deployment)

## 步骤 1: 清理服务器 Nginx (一次性操作)
1. 在服务器上备份并清理 `/etc/nginx/conf.d/finverse.conf`。
2. 将 `server_config/finverse_clean.conf` 的内容粘贴进去。
3. 执行：`sudo nginx -t && sudo nginx -s reload`

## 步骤 2: 提交代码并自动部署
1. 在本地提交当前代码（包含新的 `deploy.yml` 和 `nginx.conf`）。
2. 等待 GitHub Actions 运行完成。

## 步骤 3: 启用申冷 Nginx 与 SSL (一次性操作)
部署成功后，在服务器上运行：
```bash
# 1. 软链接配置 (如果尚未链接)
sudo ln -sf /home/ecs_user/Projects/shenleng/nginx.conf /etc/nginx/sites-enabled/shenleng

# 2. 重载 Nginx (启用 80 端口)
sudo nginx -t && sudo nginx -s reload

# 3. 使用 Certbot 自动申请并配置 SSL
# 过程中选择 2: Redirect (强制跳转 HTTPS)
sudo certbot --nginx -d www.finverse.top -d finverse.top
```

## 步骤 4: 执行文章迁移
在 GitHub Actions 中手动触发 **"Run Migration (Direct)"**。
迁移脚本会自动处理图片和文章数据。

---
## 验证
访问 [https://www.finverse.top](https://www.finverse.top) 确认运行正常。
