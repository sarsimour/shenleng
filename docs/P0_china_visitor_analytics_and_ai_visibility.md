# P0: 中国访客分析与搜索/AI 可见度建设方案

本文档为最高重要度执行文档，用于把申冷官网从“可访问、可聊天”提升为“可观测、可收录、可被中国客户与 AI 工具发现”的业务获客系统。

## 1. 背景与边界

当前站点已有基础前端埋点，可以记录页面访问、AI 客服打开、消息发送、电话点击等行为。但该数据只覆盖成功加载并执行浏览器 JS 的访问，无法覆盖以下关键场景：

- 搜索引擎和 AI 爬虫访问。
- Cloudflare/源站不可达时的失败访问。
- 纯服务端请求、curl、爬虫、异常状态码。
- 百度、豆包、字节、360、搜狗等平台是否真正抓取核心页面。

正式上线域名尚未切换。网址一致性与 Cloudflare 相关问题后续通过切换正确官网域名解决，本方案不把当前测试域名和 Cloudflare tunnel 作为长期架构前提。正式域名上线时必须统一由 `NEXT_PUBLIC_SITE_URL` 驱动 canonical、sitemap、robots、JSON-LD、llms、ai-profile 和 301 跳转。

## 2. 总目标

### 2.1 访客分析目标

- 识别真实访客来源：直接访问、搜索、外链、UTM、AI 工具、行业平台。
- 识别访客质量：访问页面、停留路径、是否打开 AI 客服、是否发送问题、是否电话点击。
- 识别技术问题：页面 4xx/5xx、接口错误、AI 会话失败、爬虫抓取失败、源站不可达。
- 识别爬虫行为：百度、字节/豆包、360、搜狗、Bing、Google、OpenAI、Claude、Perplexity 等 user-agent 的抓取情况。
- 保护隐私：不保存明文 IP，不在访客分析里保存完整聊天内容，不公开内部数据。

### 2.2 中国搜索可见度目标

- 让百度能稳定发现、抓取、索引核心页面。
- 让中文长尾词有明确落地页，而不是只靠首页承载所有关键词。
- 让正式域名成为唯一权威 URL，避免测试域名、旧域名、临时域名互相竞争。
- 通过百度搜索资源平台观察抓取、索引、死链、提交反馈。

### 2.3 AI 工具可见度目标

- 让豆包、字节相关爬虫和其他 AI 搜索工具更容易读取公司事实。
- 为 AI 提供短文本、结构化、可引用的公开资料入口。
- 降低 AI 误读概率：明确申冷做什么、不做什么、服务范围、车队事实、联系方式。
- 明确内部/外部边界：官网 AI 是外部售前助手，只能使用公开可对外信息。

## 3. 关键原则

- 公开优先：官网、`llms.txt`、`ai-profile.json`、结构化数据只能包含可对外公开内容。
- 数据最小化：分析数据只记录业务判断所需字段，IP 只存 hash，聊天只存长度桶/结果状态，必要时在后端聊天系统单独受控查看。
- 域名唯一：正式上线后所有公开 URL 只指向正式官网域名。
- 服务端可观测：不能只依赖前端 JS 埋点，必须补服务端访问日志和爬虫日志。
- 中国访问优先：避免影响中国访问速度的外部资源；正式域名阶段优先考虑备案、国内 CDN/阿里云日志服务。

## 4. 目标指标

上线后每周至少能回答以下问题：

- 最近 7 天真实访客数、会话数、页面访问数是多少。
- 百度、字节/豆包、360、搜狗等爬虫是否访问了首页、服务页、文章页、`robots.txt`、`sitemap.xml`、`llms.txt`、`ai-profile.json`。
- 哪些页面返回了 4xx/5xx，哪些爬虫抓取失败。
- 访客从哪些关键词/外链/活动进入。
- 首页访问到 AI 咨询、电话点击的转化率是多少。
- AI 客服是否有启动失败、回复失败、响应过慢。
- 正式域名是否被错误重定向、是否出现测试域名被收录风险。

## 5. P0 任务列表

### 当前已落地到代码的基础能力

- `siteAccessLogs`：服务端访问日志集合，用于记录公开页面、sitemap、robots、llms、ai-profile 等请求。
- `/api/track/request-log`：服务端访问日志写入接口。
- `src/middleware.ts`：生产环境异步记录公开 GET/HEAD 请求；后台、API 和静态资源默认跳过。
- 统一爬虫识别：`src/lib/analytics/bot-detection.ts`，区分 human、search bot、AI bot、tool bot、unknown bot。
- 访客事件增强：`visitorEvents` 增加 botType、botName、isBot、deviceType。
- 营销日报增强：`pnpm analytics:report` 同时输出服务端访问日志、爬虫分类、AI bot 路径、搜索 bot 路径、聊天漏斗。
- URL/AI 可见度检查：`pnpm visibility:check`。
- 百度普通收录提交脚本：`pnpm baidu:submit`。
- 中文长尾服务页：`/services/*` 下新增上海港冷链车队、冷箱车队、冷箱插电托管、暂落箱、宁波港冷链运输等页面，并进入 sitemap、llms、ai-profile。

### P0-A: 访客与爬虫可观测

1. 新增服务端访问日志表或集合。
   - 字段：时间、path、query、method、status、耗时、refererHost、userAgent、botType、isSearchBot、isAIBot、ipHash、country/region（如边缘或 CDN 可提供）、requestId。
   - 不保存明文 IP。
   - 不记录请求体和聊天正文。

2. 在 Next.js 中间件或服务端入口记录公开页面访问。
   - 覆盖 `/`、`/about`、`/contact`、`/services/*`、`/articles/*`、`/robots.txt`、`/sitemap.xml`、`/llms.txt`、`/ai-profile.json`。
   - 排除 `/_next/*` 静态资源高频噪声，或只在 CDN/SLS 层分析静态资源。

3. 建立爬虫识别规则。
   - 搜索引擎：`Baiduspider`、`Sogou`、`360Spider`、`bingbot`、`Googlebot`。
   - AI/大模型相关：`Bytespider`、`Doubaobot`、`GPTBot`、`ClaudeBot`、`PerplexityBot`、其他后续发现的 UA。
   - 规则要可配置，不能写死在多个文件里。

4. 增强现有访客事件报表。
   - 分开统计 human、search bot、AI bot、unknown bot。
   - 输出页面漏斗：pageview -> chat_open -> chat_session_started -> chat_message_sent -> chat_response_completed -> phone_click。
   - 输出异常：chat_unavailable、chat_message_failed、proxy 429/4xx/5xx。

5. 增加站外健康监控。
   - 监控首页、`robots.txt`、`sitemap.xml`、`llms.txt`、`ai-profile.json`。
   - 监控结果进入日报，失败要可告警。
   - 该监控用于捕捉 Cloudflare/源站不可达等“站内日志看不到”的故障。

### P0-B: 百度与中国搜索基础设施

1. 正式域名确定后，完成百度搜索资源平台站点绑定与验证。
   - 配置 `NEXT_PUBLIC_BAIDU_SITE_VERIFICATION`。
   - 验证正式域名，不把测试域名作为长期站点提交。

2. 建立百度普通收录提交脚本。
   - 新增/更新文章、服务页后自动提交 URL。
   - 提交结果需要记录成功/失败，失败进入运维报告。

3. 保持 `sitemap.xml` 与正式域名一致。
   - 包含首页、关于、服务页、联系页、文章列表、文章详情、核心业务落地页。
   - 不包含后台、API、测试页、临时域名。

4. 审核 `robots.txt`。
   - 允许公开页面抓取。
   - 屏蔽 `/api/`、`/_next/`、`/admin/`、`/knowledge-admin` 等。
   - 明确允许百度、字节/豆包、主流搜索和 AI crawler 抓取公开资料入口。

5. 建立正式域名上线前 URL 一致性检查。
   - 检查 canonical、OpenGraph URL、sitemap、robots、llms、ai-profile、JSON-LD。
   - 检查是否仍出现测试域名、旧域名、IP、localhost。

### P0-C: 中文长尾内容与业务落地页

1. 建立核心中文长尾页面。
   - 上海港冷链车队。
   - 上海港冷箱车队。
   - 上海港冷藏集装箱运输。
   - 宁波港冷链运输。
   - 冷箱插电托管。
   - 冷箱暂落箱服务。
   - 冷藏集装箱拖车。
   - 货代找上海港冷链车队。

2. 每个页面必须包含真实业务信息。
   - 服务范围。
   - 适用客户。
   - 操作流程。
   - 车队与设备事实。
   - 报价需要的信息。
   - 联系方式和 AI 售前入口。

3. 建立 FAQ 内容。
   - 申冷是否只做上海港？
   - 申冷有多少自营冷箱车？
   - 上海港冷藏集装箱运输如何报价？
   - 出口冷箱运输需要提供哪些信息？
   - 是否支持插电托管和暂落箱？
   - 温度异常如何处理？

4. 每周更新至少 1 篇真实行业/业务文章。
   - 标题围绕客户真实搜索问题。
   - 内容不能空泛堆关键词。
   - 每篇文章链接回相关服务页。

### P0-D: AI 可读资料

1. 维护 `/llms.txt`。
   - 用简洁文本说明公司、服务、港口、车队事实、联系方式、重要 URL。
   - 只放公开信息。
   - 正式域名切换后重新生成并检查所有链接。

2. 维护 `/ai-profile.json`。
   - 结构化输出公司名称、别名、服务、服务区域、车队事实、联系方式、关键词、禁止误读项。
   - 增加 `public_only: true` 或类似标记，明确这是外部可公开资料。

3. 增强 JSON-LD。
   - 首页：`Organization`、`LocalBusiness`、`WebSite`。
   - 服务页：`Service`。
   - FAQ 页：`FAQPage`。
   - 文章页：`Article`。

4. 建立 AI 可见度检查脚本。
   - 检查 `llms.txt`、`ai-profile.json`、核心服务页是否能被无 JS 客户端读取。
   - 检查是否包含正式域名。
   - 检查是否包含不应公开的内部字段。

### P0-E: 数据安全与内外部 AI 边界

1. 官网 AI 明确定义为外部售前助手。
   - 只能回答公开公司事实、服务范围、报价前信息采集、联系方式。
   - 不能访问客户、订单、运单、司机、GPS、成本、利润、内部调度。

2. 内部 AI 与外部 AI 必须隔离。
   - 不同 chatbot id。
   - 不同 workflow。
   - 不同工具权限。
   - 不同数据源。

3. 访客分析不得保存完整聊天正文。
   - 前端事件只记录长度桶、状态、耗时。
   - 后端聊天记录属于受控业务数据，不进入公开营销分析表。

4. 设定留存策略。
   - 前端访客事件：默认 180 天。
   - 服务端访问日志：30-90 天原始聚合，长期只保留汇总指标。
   - 后端聊天记录：按业务和合规要求单独定义。

## 6. P1 任务列表

1. 正式域名备案与国内 CDN/阿里云 DCDN。
   - 目标是提升中国访问速度与稳定性。
   - 接入阿里云 SLS 访问日志。

2. 建立每日可见度报告。
   - 访客数、搜索/AI 爬虫、Top 页面、Top referrer、转化漏斗、错误状态码、AI 客服异常。
   - 每天固定时间推送到邮件或企业通信工具。

3. 建立内容生产日历。
   - 每周至少 1 篇业务文章。
   - 每月复盘关键词表现和线索质量。

4. 建立线索质量字段。
   - AI 咨询是否提供路线、温度、箱量、时间窗口、联系方式。
   - 电话点击与聊天会话能否做匿名关联。

5. 接入更多站长平台。
   - 百度优先。
   - 360、搜狗、Bing 等按平台当前开放能力接入。

## 7. P2 任务列表

1. 建立营销 BI 页面。
   - 给业务方看趋势、渠道、页面、转化，不直接看原始日志。

2. 建立 SEO 内容效果评分。
   - 每个页面按收录、访问、停留、转化、AI 引用友好度评分。

3. 建立 A/B 测试。
   - 测试 AI 客服入口文案、电话按钮位置、报价信息采集流程。

## 8. 验收标准

第一阶段完成后必须满足：

- 可以区分真实访客、搜索爬虫、AI 爬虫。
- 可以看到百度/豆包相关 crawler 是否访问核心页面。
- 可以看到 AI 客服从打开到回复完成的漏斗。
- 百度搜索资源平台已绑定正式域名并可提交 URL。
- `sitemap.xml`、`robots.txt`、`llms.txt`、`ai-profile.json` 全部使用正式域名。
- 公开 AI 资料不包含内部数据。
- 正式上线前 URL 检查没有测试域名、旧域名、IP、localhost。

## 9. 非目标

- 不承诺百度、豆包或任何 AI 工具一定收录。
- 不承诺某个关键词立刻排名。
- 不通过隐藏文字、关键词堆砌、伪原创批量页等方式获取短期排名。
- 不把当前测试域名和 Cloudflare tunnel 作为长期官网架构。

## 10. 相关文档

- `docs/ai_search_discoverability.md`
- `docs/cdn_visitor_data_ops.md`
- `docs/high_priority_seo_strategy.md`
- `docs/ai_assistant_backend_connection.md`
