import { getPayload } from "payload";
import config from "../payload.config";

async function pruneVisitorEvents() {
  const retentionDays = Number(process.env.VISITOR_DATA_RETENTION_DAYS || 180);
  const requestLogRetentionDays = Number(process.env.REQUEST_LOG_RETENTION_DAYS || 90);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const requestLogCutoff = new Date(
    Date.now() - requestLogRetentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const payload = await getPayload({ config });

  const visitorResult = await payload.delete({
    collection: "visitorEvents",
    where: {
      createdAt: {
        less_than: cutoff,
      },
    },
    overrideAccess: true,
  });

  const requestLogResult = await payload.delete({
    collection: "siteAccessLogs",
    where: {
      createdAt: {
        less_than: requestLogCutoff,
      },
    },
    overrideAccess: true,
  });

  const removed = Array.isArray(visitorResult.docs) ? visitorResult.docs.length : 0;
  const removedRequestLogs = Array.isArray(requestLogResult.docs)
    ? requestLogResult.docs.length
    : 0;
  console.log(
    `🧹 Visitor events pruned: ${removed}, retention days: ${retentionDays}, cutoff: ${cutoff}`,
  );
  console.log(
    `🧹 Site access logs pruned: ${removedRequestLogs}, retention days: ${requestLogRetentionDays}, cutoff: ${requestLogCutoff}`,
  );
}

pruneVisitorEvents().catch((error) => {
  console.error("❌ Failed to prune visitor events", error);
  process.exit(1);
});
