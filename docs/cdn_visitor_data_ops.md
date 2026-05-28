# CDN 与访客数据运维基线（阿里云）

## 1. 当前代码侧已完成
- 新增访客事件集合：`visitorEvents`（Payload CMS）。
- 新增采集接口：`POST /api/track/pageview`（兼容页面访问与站内转化事件）。
- 新增前端埋点：全站页面访问自动上报（路径、来源、UTM、会话 ID、匿名 IP Hash、UA），并记录电话、邮箱、AI 客服、关键 CTA 点击。
- 新增建表脚本：`pnpm schema:sync`（用于首次部署后同步 SQLite schema）。
- 新增数据清理脚本：`pnpm analytics:prune`，默认保留 `180` 天。
- 新增营销分析脚本：`pnpm analytics:report -- --days=7`（生成营销分析摘要，可邮件/Webhook发送）。
- 新增部署冒烟脚本：`pnpm smoke:post-deploy`（发布一篇测试文章、验证 sitemap、验证埋点、自动清理）。

> 说明：代码中不保存明文 IP，仅保存 `ipHash`（`SHA-256(ip + secret)` 截断）。

## 2. 阿里云 CDN 建议（上线后配置）

### 2.0 首次部署后的初始化
- 执行一次 `pnpm schema:sync`，确保 `visitor_events` 表存在。
- 再执行应用启动或重启，使埋点接口可直接写入。

### 2.0.1 推荐发布后自检（自动化）
- 执行一次 `pnpm smoke:post-deploy`。
- 验证项：
  - 新建文章可写入 `articles`。
  - `sitemap.xml` 能包含新文章链接。
  - `/api/track/pageview` 能写入 `visitor_events`。
  - 脚本结束会自动删除测试文章与测试事件。

### 2.1 回源与缓存
- 静态资源：`/_next/static/*`、`/media/*` 走 CDN 强缓存。
- HTML 页面：建议 CDN 缓存时间 5~10 分钟，并启用 stale 回源策略。
- API 路由：
  - `/api/track/*`：不缓存。
  - `/api/*` 其他接口：按业务配置，默认不缓存。

### 2.2 请求头透传（用于访客识别与来源分析）
- 透传：`X-Forwarded-For`、`User-Agent`、`Referer`。
- 如启用边缘地理信息，可额外透传国家/省份头（按阿里云产品能力配置）。

### 2.3 日志
- CDN 访问日志投递到 SLS（日志服务）。
- 关键字段：时间、URL、状态码、命中/回源、客户端 IP、UA、Referer、流量。
- 与站内 `visitorEvents` 联合分析：
  - CDN 看流量与命中率；
  - 站内看落地页、UTM、会话路径、转化入口。

## 3. 数据留存建议
- `visitorEvents`：保留 180 天（默认）。
- CDN/SLS 原始日志：保留 30~90 天（按成本调整）。
- 周期任务（建议）：
  - 每天凌晨执行一次 `pnpm analytics:prune`。
  - 阿里云 ECS 用 `crontab` 或云监控定时任务触发。

## 4. 快速查询建议（Payload Admin）
- 看渠道：按 `utmSource / utmMedium / utmCampaign` 过滤。
- 看入口页：按 `path` 聚合（可后续加 BI）。
- 看外部来源：按 `referrerHost` 过滤（搜索/社媒/直接访问）。
- 看转化：按 `eventType / target` 过滤（如 `phone_click`、`chat_open`、`chat_unavailable`）。

## 5. 营销分析报告（邮件/Webhook）
- 生成近 7 天报告：`pnpm analytics:report -- --days=7`
- 自定义 Top N：`pnpm analytics:report -- --days=14 --top=15`
- 默认会过滤机器人流量；如需包含机器人：`pnpm analytics:report -- --include-bots=true`
- 当前报告会同时汇总前端访客事件和 `siteAccessLogs` 服务端访问日志，输出搜索爬虫、AI 爬虫、请求状态码、核心路径访问和 AI 客服漏斗。

环境变量（配置任意一种推送）：
- 邮件推送：`ANALYTICS_REPORT_TO`、`ANALYTICS_REPORT_FROM`、`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`
- Webhook 推送：`ANALYTICS_WEBHOOK_URL`
- 服务端请求日志密钥（可选）：`REQUEST_LOG_SHARED_SECRET`；未配置时接口仍可写入，但有基础频率限制。
- 请求日志留存天数（可选）：`REQUEST_LOG_RETENTION_DAYS`，默认 90 天

建议定时任务（每天 08:30 发送前一天滚动周报）：
```cron
30 8 * * * cd /home/ecs-user/Projects/shenleng && pnpm analytics:report -- --days=7
```

## 6. 新文章发布 SOP（当前线上流程）

> URL 必须以当前部署环境的 `NEXT_PUBLIC_SITE_URL` 为准。测试期可使用测试域名；正式上线后必须只使用正式官网域名，不要沿用旧域名示例。

1. 进入后台：`${NEXT_PUBLIC_SITE_URL}/admin`
2. `Articles -> Create New`，填写 `title / slug / summary / content / publishedAt`
3. 保存并发布后，访问 `${NEXT_PUBLIC_SITE_URL}/articles/{slug}` 验证内容
4. 验证 sitemap：`${NEXT_PUBLIC_SITE_URL}/sitemap.xml` 中应出现新文章 URL
5. 发版后跑一次：`pnpm smoke:post-deploy`（自动创建并清理测试文章）

## 7. SEO/AI 可见度检查

正式域名上线前后执行：

```bash
NEXT_PUBLIC_SITE_URL=https://正式官网域名 pnpm visibility:check
```

检查内容：
- 首页 canonical 是否使用当前 `NEXT_PUBLIC_SITE_URL`。
- `robots.txt` 的 sitemap 是否使用当前域名。
- `sitemap.xml`、`llms.txt`、`ai-profile.json` 是否能访问。
- 是否混入旧域名、测试域名、IP、localhost。
- AI 可读文件是否包含申冷、上海港冷链车队、冷藏集装箱等核心公开事实。

## 8. 百度普通收录提交

百度搜索资源平台验证正式域名后，配置以下任一方式：

```bash
BAIDU_PUSH_ENDPOINT="https://data.zz.baidu.com/urls?site=...&token=..." pnpm baidu:submit
```

或：

```bash
BAIDU_SITE=https://正式官网域名 BAIDU_TOKEN=平台token pnpm baidu:submit
```

发布前可先 dry-run：

```bash
BAIDU_DRY_RUN=true pnpm baidu:submit
```
