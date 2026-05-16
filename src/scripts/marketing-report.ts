import { URLSearchParams } from "url";
import nodemailer from "nodemailer";
import { getPayload } from "payload";
import config from "../payload.config";

type VisitorEventDoc = {
  id: number | string;
  eventType?: string | null;
  target?: string | null;
  label?: string | null;
  value?: number | null;
  path?: string | null;
  query?: string | null;
  referrer?: string | null;
  referrerHost?: string | null;
  sessionId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  createdAt?: string | null;
};

type ReportOptions = {
  days: number;
  topN: number;
  includeBots: boolean;
};

type SessionAggregate = {
  firstAt: number;
  landingPath: string;
  pages: Set<string>;
  events: number;
};

const BOT_UA_PATTERN =
  /bot|spider|crawler|curl|wget|python|scrapy|headless|lighthouse|monitor|uptime|httpclient|go-http-client|java/i;

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBool(value: string | undefined, fallback = false): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parseArgs(): ReportOptions {
  const argMap = new Map<string, string>();

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue] = arg.slice(2).split("=", 2);
    if (!rawKey) continue;
    argMap.set(rawKey, rawValue ?? "true");
  }

  return {
    days: parseNumber(argMap.get("days") || process.env.ANALYTICS_REPORT_DAYS, 7),
    topN: parseNumber(argMap.get("top") || process.env.ANALYTICS_TOP_N, 10),
    includeBots: parseBool(
      argMap.get("include-bots") || process.env.ANALYTICS_INCLUDE_BOTS,
      false,
    ),
  };
}

function increment(map: Map<string, number>, key: string, step = 1): void {
  const next = (map.get(key) ?? 0) + step;
  if (next <= 0) {
    map.delete(key);
    return;
  }
  map.set(key, next);
}

function toPercent(value: number, base: number): string {
  if (!base) return "0.00%";
  return `${((value / base) * 100).toFixed(2)}%`;
}

function clean(value: string | null | undefined, fallback = ""): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function parseReferrerHost(referrer: string): string {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname;
  } catch {
    return "";
  }
}

function isBot(event: VisitorEventDoc): boolean {
  const ua = clean(event.userAgent).toLowerCase();
  const ref = clean(event.referrerHost || parseReferrerHost(clean(event.referrer))).toLowerCase();
  return BOT_UA_PATTERN.test(ua) || ref.includes("bot");
}

function sortTop(map: Map<string, number>, topN: number): Array<[string, number]> {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);
}

function formatTopRows(
  title: string,
  items: Array<[string, number]>,
  total: number,
): string[] {
  const rows = [`${title}:`];
  if (items.length === 0) {
    rows.push("- (no data)");
    return rows;
  }
  for (const [index, [label, value]] of items.entries()) {
    rows.push(`${index + 1}. ${label} -> ${value} (${toPercent(value, total)})`);
  }
  return rows;
}

function buildReportText(input: {
  now: Date;
  from: Date;
  totalEvents: number;
  totalPageviews: number;
  totalConversions: number;
  totalSessions: number;
  totalIps: number;
  bounceSessions: number;
  avgEventsPerSession: number;
  pageViewsByPath: Map<string, number>;
  articleViewsByPath: Map<string, number>;
  landingByPath: Map<string, number>;
  referrerByHost: Map<string, number>;
  utmSource: Map<string, number>;
  utmMedium: Map<string, number>;
  utmCampaign: Map<string, number>;
  conversionByType: Map<string, number>;
  conversionByTarget: Map<string, number>;
  topN: number;
  includeBots: boolean;
}): string {
  const {
    now,
    from,
    totalEvents,
    totalPageviews,
    totalConversions,
    totalSessions,
    totalIps,
    bounceSessions,
    avgEventsPerSession,
    pageViewsByPath,
    articleViewsByPath,
    landingByPath,
    referrerByHost,
    utmSource,
    utmMedium,
    utmCampaign,
    conversionByType,
    conversionByTarget,
    topN,
    includeBots,
  } = input;

  const header = [
    "Shenleng Marketing Analytics Report",
    `Time Window: ${from.toISOString()} -> ${now.toISOString()}`,
    `Data Filter: includeBots=${includeBots}`,
    "",
    "Core KPIs:",
    `- Total Events: ${totalEvents}`,
    `- Pageviews (PV): ${totalPageviews}`,
    `- Conversion Events: ${totalConversions}`,
    `- Sessions: ${totalSessions}`,
    `- Approx Unique Visitors (by ipHash): ${totalIps}`,
    `- Bounce Sessions: ${bounceSessions} (${toPercent(bounceSessions, totalSessions)})`,
    `- Avg Events / Session: ${avgEventsPerSession.toFixed(2)}`,
    "",
  ];

  const blocks = [
    ...formatTopRows("Top Pages", sortTop(pageViewsByPath, topN), totalEvents),
    "",
    ...formatTopRows("Top Article Pages", sortTop(articleViewsByPath, topN), totalEvents),
    "",
    ...formatTopRows("Top Landing Pages", sortTop(landingByPath, topN), totalSessions),
    "",
    ...formatTopRows("Top Referrer Hosts", sortTop(referrerByHost, topN), totalEvents),
    "",
    ...formatTopRows("Top UTM Source", sortTop(utmSource, topN), totalEvents),
    "",
    ...formatTopRows("Top UTM Medium", sortTop(utmMedium, topN), totalEvents),
    "",
    ...formatTopRows("Top UTM Campaign", sortTop(utmCampaign, topN), totalEvents),
    "",
    ...formatTopRows("Top Conversion Types", sortTop(conversionByType, topN), totalConversions),
    "",
    ...formatTopRows("Top Conversion Targets", sortTop(conversionByTarget, topN), totalConversions),
  ];

  return [...header, ...blocks].join("\n");
}

async function sendEmailReport(subject: string, text: string): Promise<void> {
  const to = clean(process.env.ANALYTICS_REPORT_TO);
  const smtpHost = clean(process.env.SMTP_HOST);
  const smtpPort = parseNumber(process.env.SMTP_PORT, 587);
  const smtpUser = clean(process.env.SMTP_USER);
  const smtpPass = clean(process.env.SMTP_PASS);
  const from = clean(process.env.ANALYTICS_REPORT_FROM || process.env.SMTP_FROM);

  if (!to || !smtpHost || !from) {
    return;
  }

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  await transport.sendMail({
    from,
    to,
    subject,
    text,
  });

  console.log(`📨 Analytics report sent by email to: ${to}`);
}

async function sendWebhookReport(subject: string, text: string): Promise<void> {
  const webhookURL = clean(process.env.ANALYTICS_WEBHOOK_URL);
  if (!webhookURL) return;

  const response = await fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: subject,
      text,
      generatedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook send failed: ${response.status} ${response.statusText}`);
  }

  console.log(`🔔 Analytics report sent by webhook: ${webhookURL}`);
}

async function fetchVisitorEvents(days: number): Promise<VisitorEventDoc[]> {
  const payload = await getPayload({ config });
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = {
    createdAt: {
      greater_than_equal: from.toISOString(),
    },
  };

  const docs: VisitorEventDoc[] = [];
  let page = 1;
  const limit = 1000;

  while (true) {
    const result = await payload.find({
      collection: "visitorEvents",
      where,
      sort: "createdAt",
      limit,
      page,
      overrideAccess: true,
      depth: 0,
    });

    docs.push(...(result.docs as VisitorEventDoc[]));

    if (page >= result.totalPages) break;
    page += 1;
  }

  return docs;
}

async function run(): Promise<void> {
  const options = parseArgs();
  const now = new Date();
  const from = new Date(Date.now() - options.days * 24 * 60 * 60 * 1000);

  const rawEvents = await fetchVisitorEvents(options.days);
  const events = options.includeBots ? rawEvents : rawEvents.filter((event) => !isBot(event));

  const pageViewsByPath = new Map<string, number>();
  const articleViewsByPath = new Map<string, number>();
  const landingByPath = new Map<string, number>();
  const referrerByHost = new Map<string, number>();
  const utmSource = new Map<string, number>();
  const utmMedium = new Map<string, number>();
  const utmCampaign = new Map<string, number>();
  const conversionByType = new Map<string, number>();
  const conversionByTarget = new Map<string, number>();
  const uniqueIpHashes = new Set<string>();
  const sessions = new Map<string, SessionAggregate>();
  let totalPageviews = 0;
  let totalConversions = 0;

  for (const event of events) {
    const eventType = clean(event.eventType, "pageview");
    const path = clean(event.path, "/");
    const query = new URLSearchParams(clean(event.query));
    const source = clean(event.utmSource || query.get("utm_source"), "(none)");
    const medium = clean(event.utmMedium || query.get("utm_medium"), "(none)");
    const campaign = clean(event.utmCampaign || query.get("utm_campaign"), "(none)");
    const referrerHost = clean(
      event.referrerHost || parseReferrerHost(clean(event.referrer)),
      "(direct)",
    );
    const ipHash = clean(event.ipHash);
    const createdAt = new Date(clean(event.createdAt, now.toISOString())).getTime();
    const sessionId = clean(event.sessionId, ipHash ? `ip:${ipHash}` : `event:${event.id}`);

    if (eventType === "pageview") {
      totalPageviews += 1;
      increment(pageViewsByPath, path);
      if (path.startsWith("/articles/")) {
        increment(articleViewsByPath, path);
      }
    } else {
      totalConversions += 1;
      increment(conversionByType, eventType);
      increment(conversionByTarget, clean(event.target, "(unspecified)"));
    }

    increment(referrerByHost, referrerHost);
    increment(utmSource, source);
    increment(utmMedium, medium);
    increment(utmCampaign, campaign);

    if (ipHash) uniqueIpHashes.add(ipHash);

    if (eventType !== "pageview") continue;

    const session = sessions.get(sessionId);
    if (!session) {
      sessions.set(sessionId, {
        firstAt: createdAt,
        landingPath: path,
        pages: new Set([path]),
        events: 1,
      });
      increment(landingByPath, path);
      continue;
    }

    session.events += 1;
    session.pages.add(path);
    if (createdAt < session.firstAt) {
      increment(landingByPath, session.landingPath, -1);
      session.firstAt = createdAt;
      session.landingPath = path;
      increment(landingByPath, session.landingPath, 1);
    }
  }

  const totalEvents = events.length;
  const totalSessions = sessions.size;
  const bounceSessions = [...sessions.values()].filter((session) => session.pages.size <= 1).length;
  const avgEventsPerSession = totalSessions ? totalEvents / totalSessions : 0;

  const reportText = buildReportText({
    now,
    from,
    totalEvents,
    totalPageviews,
    totalConversions,
    totalSessions,
    totalIps: uniqueIpHashes.size,
    bounceSessions,
    avgEventsPerSession,
    pageViewsByPath,
    articleViewsByPath,
    landingByPath,
    referrerByHost,
    utmSource,
    utmMedium,
    utmCampaign,
    conversionByType,
    conversionByTarget,
    topN: options.topN,
    includeBots: options.includeBots,
  });

  const subject = `Finverse 营销分析报告 ${now.toISOString().slice(0, 10)} (last ${options.days}d)`;
  console.log(reportText);

  await sendEmailReport(subject, reportText);
  await sendWebhookReport(subject, reportText);
}

run().catch((error) => {
  console.error("❌ Failed to generate/send analytics report", error);
  process.exit(1);
});
