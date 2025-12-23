# 申冷物流官网 AI 驱动升级改造 · 开发指导文档

> **定位**：B2B 冷链物流官网（国内客户 / 货代为主）
> **目标**：轻、快、可信、可增长，可由 AI 编程工具高效完成与长期维护

---

## 一、总体技术方案概览（给 AI 的总指令）

> **请你作为一名资深前端 + 全栈工程师，基于以下技术栈，逐步实现一个高性能、响应式、SEO 友好的 B2B 冷链物流官网。**

### 核心技术栈

* 框架：**Next.js（App Router）**
* 语言：**TypeScript**
* 样式：**Tailwind CSS**
* 渲染策略：**静态优先（SSG）+ 少量 Server Actions**
* CMS：**Headless CMS（Payload CMS 或 Strapi，自托管）**
* 部署：国内云 + CDN

### 核心原则

* 首页与核心业务页必须是静态生成（速度优先）
* CMS 只用于“内容”，不接管布局
* 所有设计必须响应式，优先移动端
* 联系转化优先于展示

---

## 二、项目目录结构（直接给 AI 用）

```
shenleng-site/
├── app/
│   ├── page.tsx                # 首页
│   ├── services/               # 业务介绍页
│   │   └── page.tsx
│   ├── advantages/             # 我们的优势
│   │   └── page.tsx
│   ├── about/                  # 关于我们
│   │   └── page.tsx
│   ├── contact/                # 联系我们
│   │   └── page.tsx
│   ├── articles/               # CMS 文章列表
│   │   └── [slug]/page.tsx
│   └── actions/                # Server Actions
│       └── contact.ts
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MobileCTA.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Services.tsx
│   │   ├── Advantages.tsx
│   │   └── Clients.tsx
│   └── ui/
│       └── Button.tsx
│
├── lib/
│   ├── seo.ts
│   ├── analytics.ts
│   └── geo.ts
│
├── styles/
│   └── globals.css
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## 三、页面结构与文案指令（给 AI 精确描述）

### 1️⃣ 首页（/）

**目标**：3 秒内让客户知道“你是谁 + 你能干什么 + 怎么联系你”

#### Hero 区块

* 主标题（大字）：

  * “港口冷藏集装箱运输 · 专注冷链物流”
* 副标题：

  * “安全 · 准时 · 全程制冷”
* 行动按钮：

  * 「立即联系」 / 「获取报价」

#### 核心优势（3–4 个卡片）

* 全自营冷藏车队
* 港口冷链经验
* 全程制冷与监控
* 保险与风控保障

#### 服务范围

* 冷藏集装箱进出口运输
* 暂落箱与插电
* 内装仓储
* 多式联运

#### 信任背书

* 行业客户名称（文字即可）
* 服务行业图标

---

### 2️⃣ 服务页（/services）

* 每个服务模块独立区块
* 图标 + 标题 + 2–3 行说明
* 不超过一屏半

---

### 3️⃣ 优势页（/advantages）

结构：

* 标题：为什么货代选择申冷
* 模块化说明：

  * 资产保障
  * 制度保障
  * 风控保障
  * 港口经验

---

### 4️⃣ 联系页（/contact）

必须包含：

* 电话（可点击）
* 微信二维码
* 简单表单（姓名 / 公司 / 电话 / 需求）

---

## 四、CMS 数据模型设计（第二部分重点）

### 1️⃣ 文章（Articles）

字段：

* title: string
* slug: string
* summary: string
* content: richtext / markdown
* coverImage: image
* publishedAt: date

用途：

* 公司理念文章
* 行业文章
* 新闻

---

### 2️⃣ 媒体（Media）

* 图片：官网展示 / 案例
* 视频：只存封面 + 外链

---

## 五、Server Actions（联系表单 + 分析）

### 联系表单逻辑

```ts
export async function submitContact(formData) {
  // 1. 校验字段
  // 2. 记录 IP / UA / 来源页面
  // 3. GeoIP 获取城市
  // 4. 发送邮件 / 企业微信通知
}
```

记录信息：

* 姓名
* 公司
* 电话
* 需求
* 城市
* 来源页面

---

## 六、SEO 与性能指令

### SEO

* 每页独立 title / description
* 关键词聚焦：

  * 上海 冷链物流
  * 冷藏集装箱运输
  * 港口冷链运输

### 性能

* 所有图片用 Next/Image
* 禁止首屏视频自动播放
* CDN 部署

---

## 七、AI 使用方式建议（非常重要）

### 推荐工作流

1. 用 AI 生成页面 JSX 结构
2. 用 AI 微调 Tailwind 样式
3. 用 AI 写 Server Action
4. 人工判断、删减

### 给 AI 的典型指令示例

> “请基于 Tailwind CSS 设计一个适合冷链物流公司的首页 Hero 区块，白底、蓝色点缀、响应式。”

---

## 八、阶段划分（避免过度设计）

### Phase 1（上线即可用）

* 首页
* 服务页
* 联系页
* 静态部署

### Phase 2（优化）

* CMS 内容
* 分析数据
* SEO 调整

---

## 九、最终目标判断标准

* 手机打开 < 1 秒
* 3 秒内知道你是谁
* 1 步即可联系
* 你可以不用写代码就更新内容

> **这是一个“长期可演进”的官网，而不是一次性工程。**
