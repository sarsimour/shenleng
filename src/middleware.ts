import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
const PUBLIC_FILE_PATTERN = /^\/(robots\.txt|sitemap\.xml|llms\.txt|ai-profile\.json)$/;
const PUBLIC_PAGE_PREFIXES = ["/about", "/contact", "/services", "/development", "/articles"];
const PRIVATE_PREFIXES = ["/api", "/admin", "/knowledge-admin", "/_next", "/static"];

function getCanonicalSiteURL(): URL | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return null;

  try {
    return new URL(configured);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest, event: NextFetchEvent) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return NextResponse.next();
  }

  const canonicalURL = getCanonicalSiteURL();
  if (!canonicalURL) {
    return NextResponse.next();
  }

  const currentHost = req.headers.get("host")?.trim();
  if (!currentHost || LOCAL_HOST_PATTERN.test(currentHost)) {
    return NextResponse.next();
  }

  if (currentHost.toLowerCase() === canonicalURL.host.toLowerCase()) {
    scheduleRequestLog(req, event, "request_seen");
    return NextResponse.next();
  }

  const redirectURL = req.nextUrl.clone();
  redirectURL.protocol = canonicalURL.protocol;
  redirectURL.hostname = canonicalURL.hostname;
  redirectURL.port = canonicalURL.port;

  scheduleRequestLog(req, event, "canonical_redirect", 308);
  return NextResponse.redirect(redirectURL, 308);
}

function shouldLogRequest(req: NextRequest): boolean {
  const path = req.nextUrl.pathname;
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  if (PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return false;
  }
  if (path === "/") return true;
  if (PUBLIC_FILE_PATTERN.test(path)) return true;
  return PUBLIC_PAGE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function scheduleRequestLog(
  req: NextRequest,
  event: NextFetchEvent,
  eventType: "request_seen" | "canonical_redirect",
  statusCode?: number,
): void {
  if (process.env.REQUEST_LOG_ENABLED === "false" || !shouldLogRequest(req)) return;

  const secret = process.env.REQUEST_LOG_SHARED_SECRET?.trim();
  const headers = new Headers({
    "content-type": "application/json",
    "user-agent": req.headers.get("user-agent") || "",
    referer: req.headers.get("referer") || "",
    "x-forwarded-for": req.headers.get("x-forwarded-for") || "",
    "x-real-ip": req.headers.get("x-real-ip") || "",
    "cf-connecting-ip": req.headers.get("cf-connecting-ip") || "",
    "cf-ipcountry": req.headers.get("cf-ipcountry") || "",
    "cf-ray": req.headers.get("cf-ray") || "",
    "x-request-id": req.headers.get("x-request-id") || "",
  });

  if (secret) {
    headers.set("x-sl-request-log-secret", secret);
  }

  const body = JSON.stringify({
    eventType,
    source: "middleware",
    method: req.method,
    path: req.nextUrl.pathname,
    query: req.nextUrl.searchParams.toString(),
    statusCode,
    referrer: req.headers.get("referer") || "",
    userAgent: req.headers.get("user-agent") || "",
    country: req.headers.get("cf-ipcountry") || "",
    requestId: req.headers.get("cf-ray") || req.headers.get("x-request-id") || "",
  });

  const endpoint = new URL("/api/track/request-log", req.nextUrl.origin);
  event.waitUntil(
    fetch(endpoint, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    }).catch((error) => {
      console.error("Request log dispatch failed:", error);
    }),
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
