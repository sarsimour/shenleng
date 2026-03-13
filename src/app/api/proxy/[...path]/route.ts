import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

function normalizeBaseURL(raw: string | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/\/+$/, "");
}

function resolveBackendBaseURL(): string[] {
  const configured = normalizeBaseURL(process.env.VERSECORE_API_BASE_URL);
  if (configured) return [configured];

  if (process.env.NODE_ENV === "production") {
    return ["https://api.finverse.top/v2"];
  }

  // Dev fallback candidates:
  // - 8000: common uvicorn local run
  // - 9000: common dockerized VerseCore run
  return ["http://127.0.0.1:8000", "http://127.0.0.1:9000"];
}

function buildTargetURL(baseURL: string, req: NextRequest, pathSegments: string[]): string {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const search = req.nextUrl.search || "";
  return `${baseURL}/${encodedPath}${search}`;
}

function buildForwardHeaders(req: NextRequest): Headers {
  const headers = new Headers();

  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  return headers;
}

async function proxy(req: NextRequest, pathSegments: string[]) {
  const baseURLs = resolveBackendBaseURL();
  const method = req.method.toUpperCase();
  const headers = buildForwardHeaders(req);
  const isBodyAllowed = method !== "GET" && method !== "HEAD";

  let body: ArrayBuffer | undefined;
  if (isBodyAllowed) {
    body = await req.arrayBuffer();
  }

  const connectionErrors: { targetURL: string; error: unknown }[] = [];

  for (const baseURL of baseURLs) {
    const targetURL = buildTargetURL(baseURL, req, pathSegments);
    try {
      const upstream = await fetch(targetURL, {
        method,
        headers,
        body,
        redirect: "manual",
      });

      const responseHeaders = new Headers();
      upstream.headers.forEach((value, key) => {
        if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
        responseHeaders.set(key, value);
      });

      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch (error) {
      connectionErrors.push({ targetURL, error });
      continue;
    }
  }

  const primaryTargetURL = buildTargetURL(baseURLs[0], req, pathSegments);
  console.error("Proxy request failed:", {
    attemptedTargets: connectionErrors.map((item) => item.targetURL),
    method,
    lastError: connectionErrors[connectionErrors.length - 1]?.error,
  });

  return NextResponse.json(
    {
      error: "VERSECORE_PROXY_FAILED",
      targetURL: primaryTargetURL,
      attemptedTargets: connectionErrors.map((item) => item.targetURL),
    },
    { status: 502 },
  );
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function handler(req: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  return proxy(req, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
