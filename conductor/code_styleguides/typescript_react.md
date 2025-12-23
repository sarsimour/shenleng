# Code Style Guide: TypeScript & React (Next.js)

## 命名规范
- **组件**: PascalCase (如 `HeroSection.tsx`)。
- **函数/变量**: camelCase (如 `submitForm`)。
- **常量**: UPPER_SNAKE_CASE (如 `API_TIMEOUT`)。
- **文件目录**: 建议使用 kebab-case (如 `about-us/page.tsx`)。

## React 组件
- 优先使用 **Functional Components** 和 **Hooks**。
- **Props**: 使用接口 (Interface) 定义 Props 类型。
- **解构**: 在函数参数中直接解构 Props。
- **导出**: 优先使用具名导出 (Named Exports)，但在 Next.js 页面中必须使用默认导出 (Default Export)。

## Tailwind CSS
- 遵循类名顺序：布局 -> 盒模型 -> 字体 -> 背景 -> 边框 -> 交互。
- 复杂组件使用 `clsx` 和 `tailwind-merge` 管理类名。
- 避免在 JSX 中写过长的类名字符串，必要时拆分组件。

## TypeScript
- 严禁使用 `any`。
- 优先推断类型，显式定义复杂接口。
- 使用 `type` 定义联合类型，使用 `interface` 定义对象结构。

## Next.js (App Router)
- **Server Components**: 默认使用 Server Components 以提升性能。
- **Client Components**: 仅在需要交互 (Hooks, Events) 时添加 `'use client'`。
- **Data Fetching**: 在 Server Components 中直接使用 `fetch` 或数据库调用。
