# CDN 与访客数据运维基线（阿里云）

## 1. 当前代码侧已完成
- 新增访客事件集合：`visitorEvents`（Payload CMS）。
- 新增采集接口：`POST /api/track/pageview`。
- 新增前端埋点：全站页面访问自动上报（路径、来源、UTM、会话 ID、匿名 IP Hash、UA）。
- 新增建表脚本：`npm run schema:sync`（用于首次部署后同步 SQLite schema）。
- 新增数据清理脚本：`npm run analytics:prune`，默认保留 `180` 天。
- 新增部署冒烟脚本：`npm run smoke:post-deploy`（发布一篇测试文章、验证 sitemap、验证埋点、自动清理）。

> 说明：代码中不保存明文 IP，仅保存 `ipHash`（`SHA-256(ip + secret)` 截断）。

## 2. 阿里云 CDN 建议（上线后配置）

### 2.0 首次部署后的初始化
- 执行一次 `npm run schema:sync`，确保 `visitor_events` 表存在。
- 再执行应用启动或重启，使埋点接口可直接写入。

### 2.0.1 推荐发布后自检（自动化）
- 执行一次 `npm run smoke:post-deploy`。
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
  - 每天凌晨执行一次 `npm run analytics:prune`。
  - 阿里云 ECS 用 `crontab` 或云监控定时任务触发。

## 4. 快速查询建议（Payload Admin）
- 看渠道：按 `utmSource / utmMedium / utmCampaign` 过滤。
- 看入口页：按 `path` 聚合（可后续加 BI）。
- 看外部来源：按 `referrerHost` 过滤（搜索/社媒/直接访问）。
