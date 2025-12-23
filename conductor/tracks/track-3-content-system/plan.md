# Plan: Track 3 - Content System (CMS) & News Section

## 任务列表

### 1. Payload CMS 初始化 [TODO]
- [ ] 运行 Payload 安装脚本或手动安装依赖。
- [ ] 配置基础数据库连接（本地使用 SQLite/Postgres）。
- [ ] 定义 `Articles` 集合模型。

### 2. 首页区块开发 [TODO]
- [ ] 创建 `src/components/sections/News.tsx`。
- [ ] 编写 Mock 数据渲染（待 CMS 完成后接入真实数据）。
- [ ] 更新 `src/app/page.tsx` 引入 News 区块。

### 3. 文章详情页实现 [TODO]
- [ ] 创建 `src/app/articles/[slug]/page.tsx`。
- [ ] 实现基础的文章布局（标题、元数据、正文内容、转化 CTA）。
- [ ] 实现 `generateMetadata` 以支持 SEO。

### 4. 接入与测试 [TODO]
- [ ] 在 CMS 中发布测试文章。
- [ ] 验证数据流：CMS -> 首页 -> 详情页。
- [ ] 验证移动端阅读体验。

---
## 备注
- 第一阶段可以使用 Mock 数据快速搭建 UI，第二阶段完成 CMS 深度集成。
