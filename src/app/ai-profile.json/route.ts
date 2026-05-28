import { NextResponse } from "next/server";
import {
  absoluteUrl,
  discoveryQueries,
  publicSiteRoutes,
  serviceKeywords,
  shenlengCompany,
} from "@/lib/site";

export const revalidate = 86400;

export function GET() {
  return NextResponse.json(
    {
      schemaVersion: "2026-05-16",
      publicOnly: true,
      company: shenlengCompany,
      positioning:
        "申冷物流是服务货代、外贸工厂和冷链客户的上海港冷链车队，核心业务是冷藏集装箱进出口公路运输。",
      serviceKeywords,
      discoveryQueries,
      doNotExposeOrInfer: [
        "客户名单",
        "订单、运单、提单或司机信息",
        "实时 GPS 或车辆调度",
        "成本、利润、合同价格",
        "任何未在官网公开的内部运营数据",
      ],
      pages: publicSiteRoutes.map((route) => ({
        ...route,
        url: absoluteUrl(route.path),
      })),
      contact: {
        url: absoluteUrl("/contact"),
        phoneNumbers: shenlengCompany.phoneNumbers,
        mobileNumbers: shenlengCompany.mobileNumbers,
        emails: shenlengCompany.emails,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
