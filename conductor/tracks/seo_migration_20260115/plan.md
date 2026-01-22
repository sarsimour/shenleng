# 实施计划 - Track: SEO 优化与旧站迁移保障

## 第 1 阶段：策略文档与基础配置
- [x] Task: 创建 SEO 长期策略文档
    - [x] 创建 `docs/high_priority_seo_strategy.md`，包含内容生态闭环（百家号/小程序）及内容更新频率的专家建议。
- [x] Task: 项目全局 SEO 配置
    - [x] 在 `src/app/layout.tsx` 中定义全局 `Metadata` 对象（标题模板、关键词、描述）。
    - [x] 实现百度专用 Meta 标签（`applicable-device`, `baidu-site-verification`）。
    - [x] 在页脚 (Footer) 组件中确认并添加 ICP 备案号和公安联网备案号。
- [x] Task: Conductor - User Manual Verification '策略文档与基础配置' (Protocol in workflow.md)

## 第 2 阶段：静态化、Sitemap 与结构化数据
- [x] Task: 实现 Sitemap 和 Robots.txt
    - [x] 创建 `src/app/robots.ts` 生成符合百度规范的 `robots.txt`。
    - [x] 创建 `src/app/sitemap.ts` 动态生成 XML 站点地图（从 Payload CMS 获取所有文章链接）。
- [x] Task: 结构化数据 (JSON-LD) 实现
    - [x] 创建 `JsonLd` 组件或工具函数。
    - [x] 在首页添加企业信息 (Organization) 的 JSON-LD。
    - [x] 在文章详情页模板添加文章 (Article) 的 JSON-LD，包含 `dateModified` 字段。
- [x] Task: SSG 验证与性能审计
    - [x] 编写检查脚本或手动核对清单，确认构建后 `.next/server/app` 中生成了静态 HTML。
    - [x] 审计图片使用情况（Next/Image）并确保没有阻塞中国区访问的外部脚本。
- [x] Task: Conductor - User Manual Verification '静态化、Sitemap 与结构化数据' (Protocol in workflow.md)

## 第 3 阶段：旧站链接映射与重定向验证
- [x] Task: 数据提取与链接映射
    - [x] 编写脚本：从 Payload CMS 数据库或原始 JSON 中提取 `originalUrl`。
    - [x] 编写脚本：作为备份，爬取 `sl-cold.com` 的现有链接以防遗漏。
    - [x] 产出：生成 `redirects/url_map.json` 中间映射文件。
- [x] Task: Nginx 重定向配置生成
    - [x] 编写工具脚本 `scripts/generate_nginx_redirects.ts` 读取映射文件。
    - [x] 生成 `redirects/nginx_rewrite_rules.conf` (使用 `rewrite` 或 `map` 指令)。
- [x] Task: 自动化验证脚本
    - [x] 编写测试脚本 `tests/redirects.spec.ts`（使用 Playwright），通过抽样旧 URL 并在本地/测试环境验证其返回 301 状态码。
- [x] Task: Conductor - User Manual Verification '旧站链接映射与重定向验证' (Protocol in workflow.md)
