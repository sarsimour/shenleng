export const DEFAULT_SITE_URL = "https://www.finverse.top";

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return configured ? trimTrailingSlash(configured) : DEFAULT_SITE_URL;
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/" ? `${getSiteUrl()}/` : `${getSiteUrl()}${normalizedPath}`;
}

export function getBaiduVerification(): string | undefined {
  return process.env.NEXT_PUBLIC_BAIDU_SITE_VERIFICATION?.trim() || undefined;
}

export const shenlengCompany = {
  legalName: "上海申冷国际物流有限公司",
  brandName: "申冷物流",
  englishName: "Shenleng Logistics",
  description:
    "申冷物流专注上海港、宁波港等港口冷藏集装箱进出口公路运输，采用全自营车队模式，提供安全、准时、全程制冷的冷链运输服务。",
  phoneNumbers: ["021-38930219", "021-50673637"],
  mobileNumbers: ["18021021686", "17717010962"],
  emails: ["wangyw@sl-cold.com", "wanghh@sl-cold.com"],
  address: {
    streetAddress: "华洲路94号",
    addressLocality: "上海市",
    addressRegion: "浦东新区",
    postalCode: "200000",
    addressCountry: "CN",
  },
  areaServed: ["上海港", "宁波港", "长三角"],
  fleetFacts: [
    "自营冷箱拖车21部",
    "挂板26块",
    "进口云监控冷机10部",
    "港口冷藏集装箱运输经验近20年",
  ],
};

export const serviceKeywords = [
  "上海港冷链车队",
  "上海港冷箱车队",
  "冷藏集装箱进出口公路运输",
  "港口冷藏集装箱运输",
  "冷箱全程制冷运输",
  "冷箱插电托管",
  "冷箱暂落箱服务",
  "冷箱温度异常处理",
  "宁波港冷链运输",
];

export const discoveryQueries = [
  "上海港冷链车队",
  "上海港冷箱车队",
  "上海港冷藏集装箱运输",
  "上海冷藏集装箱拖车",
  "上海港冷冻箱运输车队",
  "冷箱全程制冷车队",
  "货代找上海港冷链车队",
];

export const publicSiteRoutes = [
  {
    path: "/",
    title: "申冷物流首页",
    summary: "公司定位、核心服务、自营车队能力和联系方式。",
  },
  {
    path: "/about",
    title: "关于申冷物流",
    summary: "公司规模、经营模式、车队资产、服务承诺和发展方向。",
  },
  {
    path: "/services/container",
    title: "冷藏集装箱运输服务",
    summary: "冷藏集装箱运输注意事项、温控要求和适运货物。",
  },
  {
    path: "/development",
    title: "企业建设",
    summary: "安全、准时、制冷和信息化建设方法。",
  },
  {
    path: "/articles",
    title: "行业洞察与动态",
    summary: "港口冷链运输、冷箱车队管理和客户服务文章。",
  },
  {
    path: "/contact",
    title: "联系我们",
    summary: "电话、邮箱、手机和地址。",
  },
];
