# Spec: Track 1 - Foundation Setup

## 目标
建立项目的视觉基础、配置核心 UI 工具，并实现全局布局组件。

## 关键需求
1. **Tailwind 主题配置**:
   - 定义“深海蓝” (Deep Ocean Blue) 作为主色。
   - 配置响应式断点。
2. **基础依赖安装**:
   - `lucide-react` (图标)。
   - `clsx` & `tailwind-merge` (类名管理)。
3. **全局样式**:
   - 设置中文字体栈。
   - 配置基础排版样式。
4. **核心布局组件**:
   - `Header`: 包含 Logo、导航和“获取解决方案” CTA。
   - `Footer`: 包含备案信息、版权和快速链接。
   - `MobileCTA`: 移动端常驻的联系按钮。

## 验收标准
- 页面能正常渲染。
- Tailwind 主题颜色生效。
- 在移动端和桌面端布局表现正常。
