import { NextRequest, NextResponse } from "next/server";

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

function getCanonicalSiteURL(): URL | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return null;

  try {
    return new URL(configured);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
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
    return NextResponse.next();
  }

  const redirectURL = req.nextUrl.clone();
  redirectURL.protocol = canonicalURL.protocol;
  redirectURL.hostname = canonicalURL.hostname;
  redirectURL.port = canonicalURL.port;

  return NextResponse.redirect(redirectURL, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
