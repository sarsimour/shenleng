# Plan: 旧网站内容迁移与 SEO 保留

## 1. 数据模型更新 (第一阶段) [DONE]
- [x] **定义字段**: 更新 `src/collections/Articles.ts` 以包含：
    - `legacyHtml`: (textarea/code) 专门用于存储旧 HTML。
    - `isLegacy`: (checkbox) 默认值为 `false`。
    - `originalUrl`: (text) 存储旧网站的完整路径，用于调试。
- [x] **验证**: 确保 Payload 配置有效且服务能正常启动。
- [x] **任务**: Conductor - 用户手册验证 '数据模型更新' (已通过自动验证)

## 2. 迁移脚本开发 (第二阶段) [DONE]
- [x] **初始化脚本**: 创建 `src/scripts/migrate-content.ts`（独立运行的 TS 脚本）。
- [x] **图片处理工具**: 实现上传功能。
- [x] **内容解析器**: 映射 JSON 字段。
- [x] **重定向生成器**: 生成 Nginx 和 JSON 映射。
- [x] **执行迁移**: 运行脚本并成功导入 56 篇文章。
- [x] **任务**: Conductor - 用户手册验证 '迁移脚本运行'

## 3. 前端与资源适配 (第三阶段) [DONE]
- [x] **资源搬运**: 将图片复制到 `public/images`。
- [x] **页面更新**: 修改文章详情页支持渲染 `legacyHtml` 并对接真实数据。
- [x] **首页更新**: 对接首页“新闻动态”真实数据。
- [x] **任务**: Conductor - 用户手册验证 '前端适配验证'

## 4. 部署配置 (第四阶段) [IN PROGRESS]
- [ ] **Nginx 更新**: 提供在 `nginx.conf` 中引入 `nginx_rewrite_rules.conf` 的说明。
- [ ] **最终测试**: 在本地模拟 Nginx 重定向，确保旧链接能跳转。
- [ ] **任务**: Conductor - 用户手册验证 '部署配置验证'
