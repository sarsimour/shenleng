# Tech Stack: 申冷物流官网

## Frontend Framework
- **Next.js 16.1.1 (App Router)**: 高性能 React 框架，支持 SSG/SSR。
- **React 19.2.3**: 最新稳定版。

## Languages & Logic
- **TypeScript 5**: 类型安全。
- **Server Actions**: 用于处理联系表单提交。

## Styling
- **Tailwind CSS 4**: 原子化 CSS 框架，响应式设计。
- **PostCSS 4**: 配合 Tailwind。

## Content Management
- **Headless CMS**: **Payload CMS 3.0** (Next.js Native Integration).
  - *Why*: 原生支持 Next.js App Router, 极致的开发体验与性能。

## Rendering Strategy
- **Static First (SSG)**: 核心页面静态生成以实现极速加载。

## Infrastructure
- **Deployment**: 国内云 + CDN (如阿里云、腾讯云)。
