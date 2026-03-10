"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "sl_visitor_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";

  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  sessionStorage.setItem(SESSION_KEY, generated);
  return generated;
}

export function VisitorTracker() {
  const pathname = usePathname();
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const query = params.toString();
    const key = `${pathname}?${query}`;
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const payload = {
      path: pathname,
      query,
      pageTitle: document.title,
      referrer: document.referrer || "",
      sessionId: getSessionId(),
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || "",
      utmTerm: params.get("utm_term") || "",
    };

    const body = JSON.stringify(payload);
    const url = "/api/track/pageview";

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
