import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { classifyUserAgent, detectDeviceType } from "@/lib/analytics/bot-detection";
import {
  clampText,
  getClientIP,
  getReferrerHost,
  hashIP,
  readGeoHeaders,
  readRequestId,
} from "@/lib/analytics/request-metadata";
import config from "@/payload.config";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 240;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

type RequestLogBody = {
  eventType?: string;
  source?: string;
  method?: string;
  path?: string;
  query?: string;
  statusCode?: number;
  durationMs?: number;
  referrer?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  requestId?: string;
};

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.REQUEST_LOG_SHARED_SECRET?.trim();
  if (!expected) return true;
  return req.headers.get("x-sl-request-log-secret") === expected;
}

function checkRateLimit(req: NextRequest): boolean {
  const key = hashIP(getClientIP(req)) || "unknown";
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX;
}

function clampNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

async function parseBody(req: NextRequest): Promise<RequestLogBody | null> {
  const raw = await req.text();
  if (!raw.trim()) return null;

  try {
    return JSON.parse(raw) as RequestLogBody;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!checkRateLimit(req)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const body = await parseBody(req);
    if (!body) {
      return NextResponse.json({ ok: true, skipped: true }, { status: 202 });
    }

    const headersGeo = readGeoHeaders(req.headers);
    const referrer = clampText(body.referrer || req.headers.get("referer"), 1024);
    const userAgent = clampText(body.userAgent || req.headers.get("user-agent"), 512);
    const classification = classifyUserAgent(userAgent);
    const payload = await getPayload({ config });

    await payload.create({
      collection: "siteAccessLogs",
      overrideAccess: true,
      data: {
        eventType: clampText(body.eventType, 64) || "request_seen",
        source: clampText(body.source, 64) || "manual",
        method: clampText(body.method, 16) || req.method,
        path: clampText(body.path, 512) || "/",
        query: clampText(body.query, 1024),
        statusCode: clampNumber(body.statusCode),
        durationMs: clampNumber(body.durationMs),
        referrer,
        referrerHost: getReferrerHost(referrer),
        ipHash: hashIP(getClientIP(req)),
        userAgent,
        botType: classification.botType,
        botName: classification.botName,
        isBot: classification.isBot,
        isSearchBot: classification.isSearchBot,
        isAIBot: classification.isAIBot,
        deviceType: detectDeviceType(userAgent, classification),
        country: clampText(body.country || headersGeo.country, 16),
        region: clampText(body.region || headersGeo.region, 64),
        requestId: clampText(body.requestId || readRequestId(req.headers), 128),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track request log failed:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
