import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

const MAX_TEXT_LENGTH = 1024;

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

function clamp(value: unknown, limit = MAX_TEXT_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.slice(0, limit).trim();
}

function getClientIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "";
  }
  return req.headers.get("x-real-ip") || "";
}

function hashIP(ip: string): string {
  if (!ip) return "";
  const secret = process.env.PAYLOAD_SECRET || "dev-secret";
  return createHash("sha256").update(`${ip}|${secret}`).digest("hex").slice(0, 24);
}

function getReferrerHost(referrer: string): string {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname;
  } catch {
    return "";
  }
}

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

    const path = clamp(body.path, 512) || "/";
    const query = clamp(body.query, 1024);
    const referrer = clamp(body.referrer, 1024);
    const pageTitle = clamp(body.pageTitle, 256);
    const sessionId = clamp(body.sessionId, 128);
    const userAgent = clamp(req.headers.get("user-agent"), 512);
    const ipHash = hashIP(getClientIP(req));

    const payload = await getPayload({ config });

    await payload.create({
      collection: "visitorEvents",
      overrideAccess: true,
      data: {
        eventType: clamp(body.eventType, 64) || "pageview",
        target: clamp(body.target, 256),
        label: clamp(body.label, 256),
        value: clampNumber(body.value),
        path,
        query,
        pageTitle,
        referrer,
        referrerHost: getReferrerHost(referrer),
        sessionId,
        ipHash,
        userAgent,
        utmSource: clamp(body.utmSource, 128),
        utmMedium: clamp(body.utmMedium, 128),
        utmCampaign: clamp(body.utmCampaign, 128),
        utmContent: clamp(body.utmContent, 128),
        utmTerm: clamp(body.utmTerm, 128),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track pageview failed:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
