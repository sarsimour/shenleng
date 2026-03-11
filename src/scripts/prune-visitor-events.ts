import { getPayload } from "payload";
import config from "../payload.config";

async function pruneVisitorEvents() {
  const retentionDays = Number(process.env.VISITOR_DATA_RETENTION_DAYS || 180);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const payload = await getPayload({ config });

  const result = await payload.delete({
    collection: "visitorEvents",
    where: {
      createdAt: {
        less_than: cutoff,
      },
    },
    overrideAccess: true,
  });

  const removed = Array.isArray(result.docs) ? result.docs.length : 0;
  console.log(
    `🧹 Visitor events pruned: ${removed}, retention days: ${retentionDays}, cutoff: ${cutoff}`,
  );
}

pruneVisitorEvents().catch((error) => {
  console.error("❌ Failed to prune visitor events", error);
  process.exit(1);
});
