# Spec: Content Migration & SEO Preservation

## 1. 概述
本任务旨在将旧网站的文章数据（JSON 格式 + 本地图片）迁移到新的 Payload CMS `Articles` 集合中。核心目标是完整保留历史内容、元数据（阅读数、发布日期），并生成 URL 重定向规则以维持百度 SEO 排名。

## 2. 功能需求

### 2.1 数据源分析
- **源 JSON 位置**: `data/nextjs_content/content/json/*.json`
- **源图片位置**: `data/nextjs_content/public/images/`
- **JSON 关键字段映射**:
  - `title` -> `title`
  - `url` (旧 URL) -> `slug` (需处理格式)
  - `date` -> `publishedAt`
  - `summary` -> `summary`
  - `content_html` -> `legacyHtml`
  - `featured_image` -> `coverImage` (需上传到 Media 集合)
  - `views` (如有) -> `viewCount` / `baseViews`

### 2.2 迁移脚本逻辑
1.  **遍历**: 读取源 JSON 文件。
2.  **封面图处理**:
    - 根据 `featured_image` 字段在 `data/nextjs_content/public/images` 中找到文件。
    - 上传到 Payload `Media` 集合，获取 ID。
3.  **HTML 内容处理**:
    - **不做修改**：假设我们将旧图片文件夹整体迁移到新站点的 `public/images`，保持相对路径有效。
    - *备注*：后续接入 CDN 时，只需在 Nginx 或 Next.js 配置中将 `/images` 路径代理到 CDN 即可，无需修改数据库中的 HTML 文本。
4.  **文章创建**:
    - 写入 `Articles` 集合，标记 `isLegacy = true`。
5.  **SEO 映射生成**:
    - 输出 `redirects/nginx_rewrite_rules.conf` (Nginx `rewrite` 指令)。
    - 输出 `redirects/url_map.json`。

### 2.3 静态资源迁移
- 将 `data/nextjs_content/public/images` 目录下的所有内容**复制**到新项目的 `public/images` 目录下，确保旧文章内部的 `<img src="/images/...">` 能够正常加载。

### 2.4 前端适配
- 修改 `src/app/(app)/articles/[slug]/page.tsx`：优先渲染 `legacyHtml`。

## 3. 验收标准
- [ ] 脚本运行无报错，所有 JSON 数据导入数据库。
- [ ] 访问新文章页，能看到旧 HTML 内容。
- [ ] 旧文章内的图片能正常加载（依赖 `public/images` 的文件）。
- [ ] 生成了 Nginx 重定向文件和 JSON 映射文件。

## 4. 排除范围
- 不对 HTML 文本进行正则替换（保持原样，降低风险）。
