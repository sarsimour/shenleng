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

---

### Deploy: ACR 自动构建不再触发

**现象**:
推到 master 后，GitHub Actions 的 deploy 步骤一直在轮询 ACR 等新镜像，最后超时 `ACR automated build did not publish a new image before timeout`。控制台「构建日志」是空的。

**原因**:
阿里云 ACR 个人版的「GitHub 源码自动构建」不稳定，会静默停止工作。

**解决方案**:
不再依赖 ACR 的源码自动构建。改为 GitHub Actions Runner 上 build → push 到 ACR → ECS pull。详见 `docs/deployment.md`。

---

### Deploy: ECS 上 docker build 中途死亡（无 OOM 日志）

**现象**:
SSH 到 ECS 直接跑 `docker compose build`，build 跑到一半进程全部消失，没有错误日志，dmesg 也没有 OOM kill 记录。

**原因**:
ECS 实例只有 1.6 GB 内存，Next.js + Payload 的 TypeScript 编译需要至少 4 GB。OOM killer 在 container/cgroup 内部触发，不一定在宿主 dmesg 留痕。

**解决方案**:
不要在 ECS 上 build。改在 GH Actions Runner（7 GB RAM）上 build 然后 push 到 ACR。

---

### Deploy: smoke test 报 `Cannot find module '/app/src/lib/site'`

**现象**:
容器启动正常，站点 200 OK，但 `pnpm smoke:post-deploy` 因为 sitemap 模块解析失败而退出非 0。

**原因**:
Dockerfile 的 runner stage 只 `COPY src/app/sitemap.ts`，但 sitemap.ts `import` 了 `../lib/site`，依赖文件没拷进镜像。

**解决方案**:
确保 runner stage 拷贝完 sitemap 及其依赖目录：

```dockerfile
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/app/sitemap.ts ./src/app/sitemap.ts
```

---

### Deploy: ECS 无法访问 github.com

**现象**:
在 ECS 上 `curl https://github.com` 超时；`git clone https://github.com/...` 卡住或失败。但 `codeload.github.com` 和 `api.github.com` 是通的。

**原因**:
阿里云大陆 region 出网到 `github.com` 主站被网络环境拦截/限速。

**解决方案**:
部署流程不要依赖 ECS 上 git pull。源码或镜像由 GitHub Actions Runner 推过来（push 到 ACR 后 ECS 只 pull image，详见 `docs/deployment.md`）。
