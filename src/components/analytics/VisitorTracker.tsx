"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "sl_visitor_session_id";

type SiteEventInput = {
  eventType?: string;
  target?: string;
  label?: string;
  value?: number;
  path?: string;
};

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

function sendEvent(payload: Record<string, string | number | undefined>) {
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
}

export function trackSiteEvent(input: SiteEventInput = {}) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const query = params.toString();

  sendEvent({
    eventType: input.eventType || "pageview",
    target: input.target || "",
    label: input.label || "",
    value: input.value,
    path: input.path || window.location.pathname || "/",
    query,
    pageTitle: document.title,
    referrer: document.referrer || "",
    sessionId: getSessionId(),
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    utmTerm: params.get("utm_term") || "",
  });
}

function readAnalyticsElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-analytics-event]");
}

function readTrackedAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLAnchorElement>("a[href^='tel:'], a[href^='mailto:']");
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

    trackSiteEvent({
      eventType: "pageview",
      path: pathname,
    });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleClick(event: MouseEvent) {
      const analyticsElement = readAnalyticsElement(event.target);
      if (analyticsElement) {
        trackSiteEvent({
          eventType: analyticsElement.dataset.analyticsEvent || "cta_click",
          target: analyticsElement.dataset.analyticsTarget || analyticsElement.id || "",
          label: analyticsElement.dataset.analyticsLabel || analyticsElement.textContent?.trim() || "",
        });
        return;
      }

      const anchor = readTrackedAnchor(event.target);
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      const isPhone = href.startsWith("tel:");
      trackSiteEvent({
        eventType: isPhone ? "phone_click" : "email_click",
        target: anchor.dataset.analyticsTarget || (isPhone ? "phone_link" : "email_link"),
        label: anchor.dataset.analyticsLabel || href.replace(/^(tel:|mailto:)/, ""),
      });
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
