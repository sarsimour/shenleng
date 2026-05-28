import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { classifyUserAgent, detectDeviceType } from "@/lib/analytics/bot-detection";
import {
  clampText,
  getClientIP,
  getReferrerHost,
  hashIP,
} from "@/lib/analytics/request-metadata";
import config from "@/payload.config";

type TrackBody = {
  eventType?: string;
  target?: string;
  label?: string;
  value?: number;
  path?: string;
  query?: string;
  pageTitle?: string;
  referrer?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

async function parseTrackBody(req: NextRequest): Promise<TrackBody | null> {
  const raw = await req.text();
  if (!raw.trim()) return null;

  try {
    return JSON.parse(raw) as TrackBody;
  } catch {
    return null;
  }
}

function clampNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

export async function POST(req: NextRequest) {
  try {
    const body = await parseTrackBody(req);
    if (!body) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 202 });
    }

    const path = clampText(body.path, 512) || "/";
    const query = clampText(body.query, 1024);
    const referrer = clampText(body.referrer, 1024);
    const pageTitle = clampText(body.pageTitle, 256);
    const sessionId = clampText(body.sessionId, 128);
    const userAgent = clampText(req.headers.get("user-agent"), 512);
    const ipHash = hashIP(getClientIP(req));
    const classification = classifyUserAgent(userAgent);

    const payload = await getPayload({ config });

    await payload.create({
      collection: "visitorEvents",
      overrideAccess: true,
      data: {
        eventType: clampText(body.eventType, 64) || "pageview",
        target: clampText(body.target, 256),
        label: clampText(body.label, 256),
        value: clampNumber(body.value),
        path,
        query,
        pageTitle,
        referrer,
        referrerHost: getReferrerHost(referrer),
        sessionId,
        ipHash,
        userAgent,
        botType: classification.botType,
        botName: classification.botName,
        isBot: classification.isBot,
        deviceType: detectDeviceType(userAgent, classification),
        utmSource: clampText(body.utmSource, 128),
        utmMedium: clampText(body.utmMedium, 128),
        utmCampaign: clampText(body.utmCampaign, 128),
        utmContent: clampText(body.utmContent, 128),
        utmTerm: clampText(body.utmTerm, 128),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track pageview failed:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
