import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export function clampText(value: unknown, limit: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, limit).trim();
}

export function getClientIPFromHeaders(headers: Headers): string {
  const cfIP = headers.get("cf-connecting-ip");
  if (cfIP) return cfIP.trim();

  const xRealIP = headers.get("x-real-ip");
  if (xRealIP) return xRealIP.trim();

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "";
  }

  return "";
}

export function getClientIP(req: NextRequest): string {
  return getClientIPFromHeaders(req.headers);
}

export function hashIP(ip: string): string {
  if (!ip) return "";
  const secret = process.env.PAYLOAD_SECRET || "dev-secret";
  return createHash("sha256").update(`${ip}|${secret}`).digest("hex").slice(0, 24);
}

export function getReferrerHost(referrer: string): string {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname;
  } catch {
    return "";
  }
}

export function readGeoHeaders(headers: Headers): { country: string; region: string } {
  return {
    country:
      headers.get("cf-ipcountry") ||
      headers.get("x-vercel-ip-country") ||
      headers.get("x-aliyun-country") ||
      "",
    region:
      headers.get("x-vercel-ip-country-region") ||
      headers.get("x-aliyun-region") ||
      headers.get("x-client-region") ||
      "",
  };
}

export function readRequestId(headers: Headers): string {
  return (
    headers.get("x-request-id") ||
    headers.get("cf-ray") ||
    headers.get("x-amzn-trace-id") ||
    ""
  );
}
