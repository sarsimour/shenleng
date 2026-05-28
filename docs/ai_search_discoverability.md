# AI 搜索与站点可发现性说明

本项目在测试域名阶段先把官网做成更容易被搜索引擎和 AI 搜索读取的结构。所有公开 URL 必须从同一个 `NEXT_PUBLIC_SITE_URL` 生成，避免 canonical、sitemap、robots 和 JSON-LD 互相打架。

## 已实现机制

- 统一站点 URL：`src/lib/site.ts` 集中管理 `NEXT_PUBLIC_SITE_URL`，避免 canonical、sitemap、robots、JSON-LD 各写各的。
- Host 规范化：生产环境中 `src/middleware.ts` 会把非规范 Host 的 GET/HEAD 请求 308 跳转到 `NEXT_PUBLIC_SITE_URL`。
- Canonical：公开页面输出规范链接，减少旧域名、新域名、临时域名之间的重复页信号。
- Baidu 站点验证：配置 `NEXT_PUBLIC_BAIDU_SITE_VERIFICATION` 后，页面会输出 `baidu-site-verification` meta。
- Sitemap：`/sitemap.xml` 持续列出公开页面和文章。
- Robots：`/robots.txt` 允许公开页面抓取，屏蔽 `/api/`、`/admin/`、`/knowledge-admin` 等后台/接口路径，并为 `Bytespider`、`Doubaobot` 等 AI/搜索爬虫提供明确规则。
- 结构化数据：首页输出 Organization、WebSite、Service 的 JSON-LD，重点包含“上海港冷链车队”“冷藏集装箱进出口公路运输”等业务事实。
- AI 可读入口：`/llms.txt` 和 `/ai-profile.json` 提供直接、短文本、结构化的公司事实、服务关键词、联系方式和重要页面链接。
- 长尾服务页：`/services/*` 提供“上海港冷链车队”“上海港冷箱车队”“冷箱插电托管”“冷箱暂落箱”等具体需求落地页，并进入 sitemap、llms、ai-profile。
- 可见度检查：`pnpm visibility:check` 可检查 canonical、sitemap、robots、llms、ai-profile 是否统一使用当前 `NEXT_PUBLIC_SITE_URL`。
- 百度提交：`pnpm baidu:submit` 可在百度搜索资源平台完成正式域名验证后提交 sitemap 中的公开 URL。

## 上线前配置

```bash
NEXT_PUBLIC_SITE_URL=https://shenleng.roinland.com
NEXT_PUBLIC_BAIDU_SITE_VERIFICATION=<百度搜索资源平台给出的验证 token>
```

`NEXT_PUBLIC_SITE_URL` 是生产构建必填项。等正式替换测试域名时，只需要把 GitHub Secret / 部署环境里的 `NEXT_PUBLIC_SITE_URL` 改成最终官网域名并重新构建部署；不要在代码里写死测试域名或旧域名。

## 面向“豆包类 AI 搜索”的内容策略

AI 搜索是否收录无法由官网单方面保证，但可以提高被抓取和正确理解的概率：

1. 保持 `/llms.txt`、`/ai-profile.json`、`/sitemap.xml` 可公开访问。
2. 让首页和服务页明确出现货代会搜索的自然语言词：上海港冷链车队、上海港冷箱车队、冷藏集装箱拖车、全程制冷运输、货代找冷链车队。
3. 定期发布可被引用的行业文章，标题和摘要要回答真实问题，例如“货代如何选择上海港冷链车队”。
4. 在百度搜索资源平台提交 sitemap，并观察抓取异常。
5. 上线后从访问日志里观察 `Bytespider`、`Doubaobot` 等 user-agent 是否访问过 `/llms.txt`、`/ai-profile.json` 和核心页面。
6. 社交媒体、行业平台、公众号文章引用官网服务页，增加第三方语义信号。

## 不能承诺的部分

- 不能保证豆包、百度或其他 AI 搜索一定收录。
- 不能保证“上海港冷链车队”立刻获得排名。
- 不能用 robots 强制某个 AI 平台抓取；robots 只是开放/限制抓取的公开约定。

## 参考

- llms.txt proposal: https://llmstxt.org/
- 百度搜索资源平台站点资源提交入口: https://ziyuan.baidu.com/site/index
- Doubao/ByteDance user-agent 公开整理: https://www.xseek.io/docs/doubao-user-agents
