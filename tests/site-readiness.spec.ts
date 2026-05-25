import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const baseURL = process.env.TEST_BASE_URL || "http://localhost:3010";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const dbPath = path.resolve(process.cwd(), "database/payload.db");

function sqlite(query: string): string {
  return execFileSync("sqlite3", [dbPath, query], { encoding: "utf8" }).trim();
}

test("tracking endpoint treats empty beacon bodies as non-fatal", async ({ request }) => {
  const response = await request.post(`${baseURL}/api/track/pageview`);

  expect(response.status()).toBeLessThan(400);
});

test("tracking endpoint persists conversion event details", async ({ request }) => {
  const sessionId = `readiness-${Date.now()}`;

  const response = await request.post(`${baseURL}/api/track/pageview`, {
    data: {
      path: "/",
      pageTitle: "申冷物流",
      sessionId,
      eventType: "phone_click",
      target: "header_phone",
      label: "021-38930219",
    },
  });

  expect(response.ok()).toBeTruthy();

  const stored = sqlite(
    `select event_type || '|' || target || '|' || label from visitor_events where session_id='${sessionId}' order by created_at desc limit 1;`,
  );
  expect(stored).toBe("phone_click|header_phone|021-38930219");

  sqlite(`delete from visitor_events where session_id='${sessionId}';`);
});

test("legacy redirect map covers old high-value navigation URLs", () => {
  const mapPath = path.resolve(process.cwd(), "redirects/url_map.json");
  const urlMap = JSON.parse(fs.readFileSync(mapPath, "utf8")) as Record<string, string>;

  expect(urlMap["/view.asp?id=1191"]).toBe("/about");
  expect(urlMap["/view.asp?id=1240"]).toBe("/services/container");
});

test("articles index has page-specific SEO title", async ({ page }) => {
  await page.goto(`${baseURL}/articles`, { waitUntil: "networkidle" });

  await expect(page).toHaveTitle(/行业洞察与动态/);
});

test("home page first load does not call VerseCore proxy", async ({ page }) => {
  const proxyRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/proxy/")) {
      proxyRequests.push(url);
    }
  });

  await page.goto(baseURL, { waitUntil: "networkidle" });

  expect(proxyRequests).toEqual([]);
});

test("home exposes canonical URL and structured business facts on configured site URL", async ({
  page,
}) => {
  await page.goto(baseURL, { waitUntil: "networkidle" });

  const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(new URL(canonicalHref || "").href).toBe(`${siteUrl}/`);

  const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(
    "\n",
  );
  expect(jsonLd).toContain(siteUrl);
  expect(jsonLd).toContain("上海申冷国际物流有限公司");
  expect(jsonLd).toContain("上海港冷链车队");
  expect(jsonLd).not.toContain("https://www.sl-cold.com");
});

test("AI discovery endpoints expose freight-forwarder search facts", async ({ request }) => {
  const llmsResponse = await request.get(`${baseURL}/llms.txt`);
  expect(llmsResponse.ok()).toBeTruthy();
  expect(llmsResponse.headers()["content-type"]).toContain("text/plain");

  const llmsText = await llmsResponse.text();
  expect(llmsText).toContain("上海申冷国际物流有限公司");
  expect(llmsText).toContain("上海港冷链车队");
  expect(llmsText).toContain("冷藏集装箱");
  expect(llmsText).toContain(`${siteUrl}/contact`);
  expect(llmsText).toContain(`${siteUrl}/ai-profile.json`);

  const profileResponse = await request.get(`${baseURL}/ai-profile.json`);
  expect(profileResponse.ok()).toBeTruthy();
  expect(profileResponse.headers()["content-type"]).toContain("application/json");

  const profile = await profileResponse.json();
  expect(profile.company.legalName).toBe("上海申冷国际物流有限公司");
  expect(profile.discoveryQueries).toContain("上海港冷链车队");
  expect(profile.serviceKeywords).toContain("冷藏集装箱进出口公路运输");
});

test("robots keeps public discovery crawlable while excluding private surfaces", async ({
  request,
}) => {
  const response = await request.get(`${baseURL}/robots.txt`);
  expect(response.ok()).toBeTruthy();

  const robotsText = await response.text();
  expect(robotsText).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
  expect(robotsText).toContain("User-Agent: Bytespider");
  expect(robotsText).toContain("User-Agent: Doubaobot");
  expect(robotsText).toContain("Disallow: /api/");
  expect(robotsText).toContain("Disallow: /knowledge-admin");
  expect(robotsText).not.toContain("Disallow: /llms.txt");
});

test("core pages have no horizontal overflow on 390px mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/", "/about", "/services/container", "/development", "/contact", "/articles"]) {
    await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(dimensions.scrollWidth, `${route} should fit mobile viewport`).toBeLessThanOrEqual(
      dimensions.innerWidth,
    );
  }
});
