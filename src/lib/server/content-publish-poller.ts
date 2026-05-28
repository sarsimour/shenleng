import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_MANIFEST_URL =
  "https://pub-651f3cd4b3cd4772b94feb2194349b8b.r2.dev/shenleng/content/manifest.json";
const DEFAULT_INTERVAL_MS = 120_000;
const DEFAULT_INITIAL_DELAY_MS = 45_000;

type ContentManifest = {
  version?: unknown;
  package?: {
    url?: unknown;
    sha256?: unknown;
  };
};

declare global {
  var __shenlengContentPublishPollerStarted: boolean | undefined;
}

function log(message: string, details?: Record<string, unknown>) {
  const suffix = details ? ` ${JSON.stringify(details)}` : "";
  console.log(`[content-publish-poller] ${message}${suffix}`);
}

function warn(message: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.warn(`[content-publish-poller] ${message}: ${detail}`);
}

function isLiveDatabase() {
  const databaseUri = process.env.DATABASE_URI || "";
  return databaseUri.includes("payload.db") && !databaseUri.includes("payload-candidate.db");
}

export function contentPublishStateFilePath() {
  const databaseUri = process.env.DATABASE_URI || "";
  const databasePath = databaseUri.replace(/^file:/, "");
  const persistenceMarker = `${path.sep}persistence${path.sep}`;
  const markerIndex = databasePath.indexOf(persistenceMarker);

  if (markerIndex > 0) {
    const projectDir = databasePath.slice(0, markerIndex);
    return path.join(projectDir, "state", "content-publish", "applied-version");
  }

  return path.join(process.cwd(), "state", "content-publish", "applied-version");
}

async function readAppliedVersion() {
  try {
    return (await fs.readFile(contentPublishStateFilePath(), "utf8")).trim();
  } catch {
    return "";
  }
}

export async function readAppliedContentVersion() {
  return readAppliedVersion();
}

async function writeAppliedVersion(version: string) {
  const stateFile = contentPublishStateFilePath();
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(stateFile, `${version}\n`, "utf8");
}

async function fetchJson<T>(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function parseManifest(manifest: ContentManifest | null) {
  if (!manifest) return null;

  const version = typeof manifest.version === "string" ? manifest.version.trim() : "";
  const packageUrl = typeof manifest.package?.url === "string" ? manifest.package.url.trim() : "";
  const sha256 = typeof manifest.package?.sha256 === "string" ? manifest.package.sha256.trim() : "";

  if (!version || !packageUrl || !/^[a-f0-9]{64}$/i.test(sha256)) {
    throw new Error("invalid content manifest");
  }

  return { version, packageUrl, sha256: sha256.toLowerCase() };
}

async function triggerLocalPublish(packageUrl: string, sha256: string) {
  const token = process.env.CONTENT_PUBLISH_TOKEN?.trim();
  if (!token || token.length < 32) {
    throw new Error("CONTENT_PUBLISH_TOKEN is missing or too short");
  }

  const port = process.env.PORT || "3000";
  const response = await fetch(`http://127.0.0.1:${port}/api/content-publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ packageUrl, sha256 }),
    signal: AbortSignal.timeout(60_000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`local publish failed HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  return text;
}

export function startContentPublishPoller() {
  if (globalThis.__shenlengContentPublishPollerStarted) return;
  globalThis.__shenlengContentPublishPollerStarted = true;

  if (process.env.NODE_ENV !== "production") return;
  if (!isLiveDatabase()) return;

  const manifestUrl = process.env.CONTENT_PUBLISH_MANIFEST_URL || DEFAULT_MANIFEST_URL;
  const intervalMs = Number(process.env.CONTENT_PUBLISH_POLL_INTERVAL_MS || DEFAULT_INTERVAL_MS);
  const initialDelayMs = Number(process.env.CONTENT_PUBLISH_INITIAL_DELAY_MS || DEFAULT_INITIAL_DELAY_MS);
  let running = false;

  const poll = async () => {
    if (running) return;
    running = true;

    try {
      const manifest = parseManifest(await fetchJson<ContentManifest>(manifestUrl, 20_000));
      if (!manifest) return;

      const appliedVersion = await readAppliedVersion();
      if (appliedVersion === manifest.version) return;

      log("applying content package", { version: manifest.version });
      await triggerLocalPublish(manifest.packageUrl, manifest.sha256);
      await writeAppliedVersion(manifest.version);
      log("content package applied", { version: manifest.version });
    } catch (error) {
      warn("poll failed", error);
    } finally {
      running = false;
    }
  };

  log("started", { manifestUrl, intervalMs, initialDelayMs });
  setTimeout(() => {
    void poll();
  }, initialDelayMs).unref();
  setInterval(() => {
    void poll();
  }, intervalMs).unref();
}
