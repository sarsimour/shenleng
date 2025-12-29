# Troubleshooting Guide

## Payload CMS 3.0 + Next.js 15 Integration

### Error: `ServerFunctionsProvider requires a serverFunction prop`

**现象**:
访问 `/admin` 页面时，页面崩溃并报错：`ServerFunctionsProvider requires a serverFunction prop`。

**原因**:
Payload 3.0 (v3.69.0) 在 Next.js 15 的 App Router 中，某些环境下（特别是使用了自定义 Layout 时）无法自动通过构建插件注入 `serverFunction`。这导致 `RootLayout` 和 `RootPage` 在运行时缺少必要的服务器处理函数。

**解决方案**:
必须在 `src/app/(payload)/layout.tsx` 和 `src/app/(payload)/admin/[[...segments]]/page.tsx` 中显式导入并传递 `handleServerFunctions`。

**正确代码 (Layout.tsx)**:
```tsx
import { handleServerFunctions } from '@payloadcms/next/utilities'

// ...

const Layout = ({ children }: Args) => (
  <RootLayout 
    config={config} 
    importMap={importMap} 
    serverFunction={handleServerFunctions} // 必须显式传入
  >
    {children}
  </RootLayout>
)
```

**依赖路径注意**:
在 Payload 3.69.0 中，正确的导入路径是 `@payloadcms/next/utilities`。如果构建时报 "not exported"，可能是 TS 类型定义滞后，可以使用 `@ts-ignore` 或强制路径，但在运行时该路径是真实存在的。

---

### Deploy: Nginx 443 Port

**现象**:
部署后访问域名提示 "Unexpectedly closed the connection"。

**原因**:
阿里云安全组未开放 443 (HTTPS) 端口。Nginx 配置了强制跳转 HTTPS，导致连接被防火墙切断。

**解决方案**:
登录阿里云控制台 -> 安全组 -> 入方向 -> 添加规则：允许 TCP 443 端口。
