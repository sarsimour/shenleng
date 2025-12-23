# Plan: Track 1 - Foundation Setup

## 任务列表

### 1. 环境准备 & 依赖安装 [DONE]
- [x] 安装依赖: `npm install lucide-react clsx tailwind-merge`
- [x] 检查并确保 `globals.css` 包含基础的 Tailwind 指令。

### 2. 视觉主题配置 [DONE]
- [x] 修改 `tailwind.config.ts` (或 CSS v4 配置)，添加自定义颜色（深海蓝）。
- [x] 配置全局字体。

### 3. 基础组件实现 [DONE]
- [x] 实现 `src/lib/utils.ts` (类名合并辅助函数)。
- [x] 实现 `src/components/layout/Header.tsx`。
- [x] 实现 `src/components/layout/Footer.tsx`。
- [x] 修改 `src/app/layout.tsx` 集成 Header 和 Footer。

### 4. 验证 [DONE]
- [x] 运行 `npm run dev` 检查页面渲染。
- [x] 验证深海蓝色值是否生效。

---
## 备注
- 优先保持极简。
- Header 在移动端需要有汉堡菜单或直接展示核心 CTA。
