import { getSiteUrl } from "../lib/site";

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const REQUIRED_PATHS = ["/", "/robots.txt", "/sitemap.xml", "/llms.txt", "/ai-profile.json"];
const DEFAULT_DISALLOWED = [
  "localhost",
  "127.0.0.1",
  "120.55.164.232",
  "www.finverse.top",
  "finverse.top",
];

function parseArgs(): { baseURL: string; disallowed: string[] } {
  const argMap = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=", 2);
    argMap.set(key, value ?? "true");
  }

  const baseURL = (argMap.get("base-url") || process.env.SITE_CHECK_BASE_URL || getSiteUrl()).replace(
    /\/+$/,
    "",
  );
  const extraDisallowed = (process.env.DISALLOWED_PUBLIC_URLS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    baseURL,
    disallowed: [...DEFAULT_DISALLOWED, ...extraDisallowed].filter((value) => {
      const expected = new URL(baseURL);
      return value !== expected.hostname && value !== expected.host && !expected.origin.includes(value);
    }),
  };
}

function fail(name: string, detail: string): CheckResult {
  return { name, ok: false, detail };
}

function pass(name: string, detail: string): CheckResult {
  return { name, ok: true, detail };
}

function findDisallowed(content: string, disallowed: string[]): string[] {
  const lower = content.toLowerCase();
  return disallowed.filter((value) => lower.includes(value.toLowerCase()));
}

function extractCanonical(html: string): string {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  return match?.[1] || "";
}

async function fetchText(baseURL: string, path: string): Promise<{ status: number; text: string }> {
  const response = await fetch(`${baseURL}${path}`, {
    headers: {
      "user-agent": "ShenlengVisibilityCheck/1.0",
    },
  });
  return { status: response.status, text: await response.text() };
}

async function run() {
  const { baseURL, disallowed } = parseArgs();
  const expectedOrigin = new URL(baseURL).origin;
  const results: CheckResult[] = [];
  const fetched = new Map<string, string>();

  console.log(`Visibility check baseURL=${baseURL}`);

  for (const path of REQUIRED_PATHS) {
    try {
      const { status, text } = await fetchText(baseURL, path);
      fetched.set(path, text);
      if (status >= 200 && status < 300) {
        results.push(pass(`${path} reachable`, `HTTP ${status}`));
      } else {
        results.push(fail(`${path} reachable`, `HTTP ${status}`));
      }

      const blocked = findDisallowed(text, disallowed);
      if (blocked.length) {
        results.push(fail(`${path} disallowed URL scan`, `found: ${blocked.join(", ")}`));
      } else {
        results.push(pass(`${path} disallowed URL scan`, "clean"));
      }
    } catch (error) {
      results.push(fail(`${path} reachable`, error instanceof Error ? error.message : String(error)));
    }
  }

  const home = fetched.get("/") || "";
  const canonical = extractCanonical(home);
  if (canonical === `${expectedOrigin}/` || canonical === expectedOrigin) {
    results.push(pass("home canonical", canonical));
  } else {
    results.push(fail("home canonical", canonical || "missing"));
  }

  const robots = fetched.get("/robots.txt") || "";
  if (robots.includes(`${expectedOrigin}/sitemap.xml`)) {
    results.push(pass("robots sitemap origin", `${expectedOrigin}/sitemap.xml`));
  } else {
    results.push(fail("robots sitemap origin", "sitemap URL missing or wrong origin"));
  }

  const sitemap = fetched.get("/sitemap.xml") || "";
  if (sitemap.includes(`<loc>${expectedOrigin}`)) {
    results.push(pass("sitemap origin", expectedOrigin));
  } else {
    results.push(fail("sitemap origin", "no URL with expected origin"));
  }

  const llms = fetched.get("/llms.txt") || "";
  const aiProfile = fetched.get("/ai-profile.json") || "";
  for (const keyword of ["上海港冷链车队", "冷藏集装箱", "申冷物流"]) {
    results.push(
      llms.includes(keyword)
        ? pass(`llms keyword ${keyword}`, "present")
        : fail(`llms keyword ${keyword}`, "missing"),
    );
    results.push(
      aiProfile.includes(keyword)
        ? pass(`ai-profile keyword ${keyword}`, "present")
        : fail(`ai-profile keyword ${keyword}`, "missing"),
    );
  }

  const failed = results.filter((result) => !result.ok);
  for (const result of results) {
    console.log(`${result.ok ? "OK" : "FAIL"} ${result.name}: ${result.detail}`);
  }

  if (failed.length) {
    console.error(`Visibility check failed: ${failed.length} issue(s).`);
    process.exit(1);
  }

  console.log("Visibility check passed.");
}

run().catch((error) => {
  console.error("Visibility check failed.", error);
  process.exit(1);
});
