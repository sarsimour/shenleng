import { getPayload } from "payload";
import config from "@/payload.config";
import sitemap from "@/app/sitemap";

type PayloadDoc = {
  id: number | string;
  slug?: string;
};

async function run() {
  const payload = await getPayload({ config });

  const now = Date.now();
  const slug = `smoke-${now}`;
  const title = `Deploy Smoke ${now}`;
  const sessionId = `smoke-session-${now}`;
  const path = `/articles/${slug}`;
  const baseURL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

  let createdArticle: PayloadDoc | null = null;
  let createdEvent: PayloadDoc | null = null;

  try {
    console.log(`🧪 Smoke start. baseURL=${baseURL}`);

    createdArticle = (await payload.create({
      collection: "articles",
      overrideAccess: true,
      data: {
        title,
        slug,
        summary: "Smoke test article created by post-deploy validation.",
        isLegacy: false,
        content: {
          root: {
            type: "root",
            children: [
              {
                type: "paragraph",
                children: [{ type: "text", text: "Smoke article body." }],
              },
            ],
          },
        },
        publishedAt: new Date().toISOString(),
      },
    })) as PayloadDoc;
    console.log(`✅ Article created: ${slug}`);

    const articleRes = await fetch(`${baseURL}${path}`);
    if (!articleRes.ok) {
      throw new Error(`Article page request failed: ${articleRes.status}`);
    }
    const articleHTML = await articleRes.text();
    if (!articleHTML.includes(title)) {
      throw new Error("Article page does not contain expected title.");
    }
    console.log("✅ New article page is reachable.");

    const generatedSitemap = await sitemap();
    const hasInSitemap = generatedSitemap.some((item) => item.url.endsWith(path));
    if (!hasInSitemap) {
      throw new Error(`Sitemap generator output does not include ${path}`);
    }
    console.log("✅ Sitemap generator includes new article.");

    const trackRes = await fetch(`${baseURL}/api/track/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        query: "utm_source=deploy_smoke&utm_medium=ci",
        pageTitle: title,
        referrer: "https://www.baidu.com/s?wd=shenleng",
        sessionId,
        utmSource: "deploy_smoke",
        utmMedium: "ci",
      }),
    });
    if (!trackRes.ok) {
      throw new Error(`Track API failed: ${trackRes.status}`);
    }
    const trackData = (await trackRes.json()) as { ok?: boolean };
    if (!trackData.ok) {
      throw new Error("Track API returned ok=false");
    }
    console.log("✅ Track API write succeeded.");

    const eventResult = await payload.find({
      collection: "visitorEvents",
      where: {
        and: [
          { sessionId: { equals: sessionId } },
          { path: { equals: path } },
        ],
      },
      limit: 1,
      sort: "-createdAt",
    });

    if (eventResult.totalDocs < 1) {
      throw new Error("Visitor event not found after tracking call.");
    }

    createdEvent = eventResult.docs[0] as PayloadDoc;
    console.log("✅ Visitor event persisted.");
    console.log("🎉 Smoke test passed.");
  } finally {
    if (createdEvent?.id !== undefined) {
      await payload.delete({
        collection: "visitorEvents",
        id: createdEvent.id,
        overrideAccess: true,
      });
      console.log("🧹 Cleaned smoke visitor event.");
    }

    if (createdArticle?.id !== undefined) {
      await payload.delete({
        collection: "articles",
        id: createdArticle.id,
        overrideAccess: true,
      });
      console.log("🧹 Cleaned smoke article.");
    }
  }
}

run().catch((error) => {
  console.error("❌ Post-deploy smoke test failed.", error);
  process.exit(1);
});
