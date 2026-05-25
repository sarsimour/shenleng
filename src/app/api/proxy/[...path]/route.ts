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

const SERVER_APP_ID = process.env.NEXT_PUBLIC_VERSECORE_APP_ID?.trim() || "logistics-web";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const KNOWLEDGE_ROUTES = new Map<string, Set<string>>([
  ["GET", new Set(["knowledge/get_docs", "users/me/organization"])],
  ["POST", new Set(["knowledge/add_doc", "users/anonymous", "users/login"])],
  ["PUT", new Set(["knowledge/update_doc"])],
  ["DELETE", new Set(["knowledge/delete_doc"])],
]);

function normalizeBaseURL(raw: string | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/\/+$/, "");
}

function resolveBackendBaseURL(): string[] {
  const configured = normalizeBaseURL(process.env.VERSECORE_API_BASE_URL);
  if (configured) return [configured];

  if (process.env.NODE_ENV === "production") {
    return ["http://versecore-api:9000"];
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
    const normalizedKey = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(normalizedKey)) return;
    if (normalizedKey === "x-app-id") return;
    headers.set(key, value);
  });

  headers.set("X-App-ID", SERVER_APP_ID);

  return headers;
}

function isUuid(value: string | undefined): boolean {
  return Boolean(value && UUID_PATTERN.test(value));
}

function isAllowedChatbotRoute(method: string, pathSegments: string[]): boolean {
  const [resource, chatbotId, chat, sessionId, action] = pathSegments;

  if (resource !== "chatbots" || !isUuid(chatbotId) || chat !== "chat") {
    return false;
  }

  if (method === "POST" && sessionId === "start" && pathSegments.length === 4) {
    return true;
  }

  if (method === "POST" && isUuid(sessionId) && pathSegments.length === 4) {
    return true;
  }

  if (method === "GET" && isUuid(sessionId) && action === "history" && pathSegments.length === 5) {
    return true;
  }

  return false;
}

function isAllowedProxyRoute(method: string, pathSegments: string[]): boolean {
  const normalizedPath = pathSegments.join("/");
  if (KNOWLEDGE_ROUTES.get(method)?.has(normalizedPath)) {
    return true;
  }

  return isAllowedChatbotRoute(method, pathSegments);
}

async function proxy(req: NextRequest, pathSegments: string[]) {
  const baseURLs = resolveBackendBaseURL();
  const method = req.method.toUpperCase();

  if (method === "OPTIONS") {
    return new NextResponse(null, { status: 204 });
  }

  if (!isAllowedProxyRoute(method, pathSegments)) {
    return NextResponse.json(
      { error: "VERSECORE_PROXY_ROUTE_BLOCKED" },
      { status: 404 },
    );
  }

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
