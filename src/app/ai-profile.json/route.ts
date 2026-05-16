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
      company: shenlengCompany,
      positioning:
        "申冷物流是服务货代、外贸工厂和冷链客户的上海港冷链车队，核心业务是冷藏集装箱进出口公路运输。",
      serviceKeywords,
      discoveryQueries,
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
