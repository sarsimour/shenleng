export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startContentPublishPoller } = await import("./lib/server/content-publish-poller");
    startContentPublishPoller();
  }
}
