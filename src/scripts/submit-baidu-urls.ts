import { getSiteUrl } from "../lib/site";

type Options = {
  endpoint: string;
  sitemapURL: string;
  urls: string[];
  dryRun: boolean;
  limit: number;
};

function parseArgs(): Options {
  const argMap = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=", 2);
    argMap.set(key, value ?? "true");
  }

  const site = process.env.BAIDU_SITE || getSiteUrl();
  const token = process.env.BAIDU_TOKEN || "";
  const endpoint =
    argMap.get("endpoint") ||
    process.env.BAIDU_PUSH_ENDPOINT ||
    (token
      ? `https://data.zz.baidu.com/urls?site=${encodeURIComponent(site)}&token=${encodeURIComponent(
          token,
        )}`
      : "");
  const directUrls = (argMap.get("urls") || process.env.BAIDU_URLS || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return {
    endpoint,
    sitemapURL:
      argMap.get("sitemap") || process.env.BAIDU_SITEMAP_URL || `${getSiteUrl()}/sitemap.xml`,
    urls: directUrls,
    dryRun: argMap.get("dry-run") === "true" || process.env.BAIDU_DRY_RUN === "true",
    limit: Number(argMap.get("limit") || process.env.BAIDU_SUBMIT_LIMIT || 2000),
  };
}

function extractSitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => match[1]?.trim())
    .filter((url): url is string => Boolean(url));
}

async function loadUrls(options: Options): Promise<string[]> {
  if (options.urls.length > 0) return options.urls;

  const response = await fetch(options.sitemapURL, {
    headers: { "user-agent": "ShenlengBaiduSubmit/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  return extractSitemapUrls(await response.text());
}

async function run() {
  const options = parseArgs();
  const urls = [...new Set(await loadUrls(options))].slice(0, options.limit);

  if (urls.length === 0) {
    throw new Error("No URLs to submit.");
  }

  console.log(`Baidu submit URL count: ${urls.length}`);
  for (const url of urls) {
    console.log(url);
  }

  if (options.dryRun) {
    console.log("Dry run enabled; no request sent to Baidu.");
    return;
  }

  if (!options.endpoint) {
    throw new Error(
      "Missing Baidu submit endpoint. Set BAIDU_PUSH_ENDPOINT, or BAIDU_SITE + BAIDU_TOKEN.",
    );
  }

  const response = await fetch(options.endpoint, {
    method: "POST",
    headers: {
      "content-type": "text/plain",
      "user-agent": "ShenlengBaiduSubmit/1.0",
    },
    body: urls.join("\n"),
  });

  const text = await response.text();
  console.log(`Baidu submit response: HTTP ${response.status}`);
  console.log(text);

  if (!response.ok) {
    throw new Error(`Baidu submit failed: HTTP ${response.status}`);
  }
}

run().catch((error) => {
  console.error("Baidu submit failed.", error);
  process.exit(1);
});
