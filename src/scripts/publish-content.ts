import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULT_SITE_URL = "https://shenleng.roinland.com";
const MAX_UPLOAD_IMAGE_BYTES = 1_000_000;
const TARGET_IMAGE_BYTES = 700_000;

type ContentSpec = {
  title: string;
  slug: string;
  summary?: string;
  legacyHtml?: string;
  legacyHtmlPath?: string;
  baseViews?: number;
  publishedAt?: string;
  coverImage: {
    path: string;
    filename?: string;
    alt?: string;
  };
};

type MigratedContentSpec = {
  title?: unknown;
  slug?: unknown;
  description?: unknown;
  content_html?: unknown;
  featured_image?: unknown;
  views?: unknown;
  date?: unknown;
};

type CliOptions = {
  specPath: string;
  siteUrl: string;
  dryRun: boolean;
  packageOutput: string;
};

function usage(): never {
  console.error(
    [
      "Usage: pnpm content:publish [--site https://shenleng.roinland.com] [--dry-run] <content.json>",
      "       pnpm content:publish --package-output /tmp/content-package.json <content.json>",
      "",
      "The content file can be a publish spec or a migrated data/nextjs_content JSON file.",
      "",
      "Required env:",
      "  CONTENT_PUBLISH_TOKEN",
    ].join("\n"),
  );
  process.exit(1);
}

function parseArgs(argv: string[]): CliOptions {
  let siteUrl = process.env.CONTENT_PUBLISH_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  let dryRun = false;
  let packageOutput = "";
  let specPath = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--site") {
      const value = argv[index + 1];
      if (!value) usage();
      siteUrl = value;
      index += 1;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--package-output") {
      const value = argv[index + 1];
      if (!value) usage();
      packageOutput = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("-")) usage();
    specPath = arg;
  }

  if (!specPath) usage();

  return {
    specPath: path.resolve(process.cwd(), specPath),
    siteUrl: siteUrl.replace(/\/+$/, ""),
    dryRun,
    packageOutput: packageOutput ? path.resolve(process.cwd(), packageOutput) : "",
  };
}

function assertString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value);
  return 0;
}

function normalizeFeaturedImagePath(featuredImage: string) {
  const normalized = featuredImage.trim();
  if (!normalized) {
    throw new Error("featured_image is required");
  }

  if (path.isAbsolute(normalized) && !normalized.startsWith("/images/")) {
    throw new Error("absolute featured_image paths are not supported for migrated content");
  }

  if (normalized.startsWith("/images/")) {
    return path.resolve(process.cwd(), "public", normalized.replace(/^\/+/, ""));
  }

  return normalized;
}

function isMigratedContentSpec(raw: Partial<ContentSpec> & MigratedContentSpec) {
  return typeof raw.content_html === "string" || typeof raw.featured_image === "string";
}

function normalizeSpec(raw: unknown): ContentSpec {
  if (!raw || typeof raw !== "object") {
    throw new Error("content spec must be an object");
  }

  const spec = raw as Partial<ContentSpec> & MigratedContentSpec;
  if (isMigratedContentSpec(spec)) {
    const featuredImage = assertString(spec.featured_image, "featured_image");
    return {
      title: assertString(spec.title, "title"),
      slug: assertString(spec.slug, "slug"),
      summary: optionalString(spec.description),
      legacyHtml: assertString(spec.content_html, "content_html"),
      baseViews: optionalInteger(spec.views),
      publishedAt: optionalString(spec.date) || undefined,
      coverImage: {
        path: normalizeFeaturedImagePath(featuredImage),
        filename: path.basename(featuredImage),
        alt: assertString(spec.title, "title"),
      },
    };
  }

  const coverImage = spec.coverImage;
  if (!coverImage || typeof coverImage !== "object") {
    throw new Error("coverImage is required");
  }

  return {
    title: assertString(spec.title, "title"),
    slug: assertString(spec.slug, "slug"),
    summary: typeof spec.summary === "string" ? spec.summary : "",
    legacyHtml: typeof spec.legacyHtml === "string" ? spec.legacyHtml : undefined,
    legacyHtmlPath: typeof spec.legacyHtmlPath === "string" ? spec.legacyHtmlPath : undefined,
    baseViews: typeof spec.baseViews === "number" ? spec.baseViews : 0,
    publishedAt: typeof spec.publishedAt === "string" ? spec.publishedAt : undefined,
    coverImage: {
      path: assertString(coverImage.path, "coverImage.path"),
      filename: typeof coverImage.filename === "string" ? coverImage.filename : undefined,
      alt: typeof coverImage.alt === "string" ? coverImage.alt : undefined,
    },
  };
}

function resolveRelative(baseDir: string, filePath: string) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
}

function safeJpegFilename(spec: ContentSpec) {
  const requested = spec.coverImage.filename || `${spec.slug}-cover.jpg`;
  const parsed = path.parse(requested.toLowerCase());
  const base = parsed.name.replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!base) {
    throw new Error("coverImage.filename must contain a safe basename");
  }
  return `${base}.jpg`;
}

function logStatus(message: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(`[content-publish] ${message} ${JSON.stringify(details)}`);
    return;
  }

  console.log(`[content-publish] ${message}`);
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    const cause =
      error.cause instanceof Error
        ? { causeName: error.cause.name, causeMessage: error.cause.message }
        : error.cause
          ? { cause: String(error.cause) }
          : {};

    return {
      name: error.name,
      message: error.message || "(empty error message)",
      ...cause,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === "string" ? error : JSON.stringify(error),
  };
}

async function readLegacyHtml(spec: ContentSpec, specDir: string) {
  if (spec.legacyHtml) return spec.legacyHtml;
  if (!spec.legacyHtmlPath) {
    throw new Error("legacyHtml or legacyHtmlPath is required");
  }

  return fs.readFile(resolveRelative(specDir, spec.legacyHtmlPath), "utf8");
}

async function prepareCoverImage(spec: ContentSpec, specDir: string) {
  const imagePath = resolveRelative(specDir, spec.coverImage.path);
  const input = await fs.readFile(imagePath);
  const metadata = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("cover image is invalid");
  }

  let width = Math.min(metadata.width, 1600);
  let quality = 82;
  let output: Buffer<ArrayBufferLike> | undefined;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    output = await sharp(input, { limitInputPixels: 40_000_000 })
      .resize({
        width,
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true, mozjpeg: true })
      .toBuffer();

    if (output.length <= TARGET_IMAGE_BYTES) break;
    if (quality > 54) {
      quality -= 8;
    } else {
      width = Math.max(720, Math.floor(width * 0.82));
    }
  }

  if (!output) {
    throw new Error("cover image compression failed");
  }

  if (output.length > MAX_UPLOAD_IMAGE_BYTES) {
    throw new Error(`cover image remains too large after compression: ${output.length} bytes`);
  }

  return {
    filename: safeJpegFilename(spec),
    alt: spec.coverImage.alt || spec.title,
    mimeType: "image/jpeg",
    dataBase64: output.toString("base64"),
    bytes: output.length,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const token = process.env.CONTENT_PUBLISH_TOKEN?.trim();
  if (!token && !options.dryRun && !options.packageOutput) {
    throw new Error("CONTENT_PUBLISH_TOKEN is required");
  }

  const specDir = path.dirname(options.specPath);
  const spec = normalizeSpec(JSON.parse(await fs.readFile(options.specPath, "utf8")));
  const legacyHtml = await readLegacyHtml(spec, specDir);
  const coverImage = await prepareCoverImage(spec, specDir);
  const endpoint = `${options.siteUrl}/api/content-publish`;
  logStatus("prepared payload", {
    slug: spec.slug,
    dryRun: options.dryRun,
    legacyHtmlBytes: Buffer.byteLength(legacyHtml, "utf8"),
    coverFilename: coverImage.filename,
    coverBytes: coverImage.bytes,
    tokenLength: token?.length || 0,
  });

  const payload = {
    title: spec.title,
    slug: spec.slug,
    summary: spec.summary || "",
    legacyHtml,
    baseViews: spec.baseViews || 0,
    publishedAt: spec.publishedAt,
    coverImage,
  };

  if (options.packageOutput) {
    await fs.mkdir(path.dirname(options.packageOutput), { recursive: true });
    const packageBody = JSON.stringify(payload);
    await fs.writeFile(options.packageOutput, packageBody);
    console.log(
      JSON.stringify(
        {
          ok: true,
          packageOutput: options.packageOutput,
          slug: spec.slug,
          bytes: Buffer.byteLength(packageBody, "utf8"),
          coverImage: {
            filename: coverImage.filename,
            bytes: coverImage.bytes,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dryRun: true,
          endpoint,
          slug: spec.slug,
          coverImage: {
            filename: coverImage.filename,
            bytes: coverImage.bytes,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const payloadBytes = Buffer.byteLength(JSON.stringify(payload), "utf8");
  logStatus("posting", { endpoint, payloadBytes });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    logStatus("response received", { status: response.status, ok: response.ok });

    if (!response.ok) {
      throw new Error(`publish failed: HTTP ${response.status} ${JSON.stringify(body)}`);
    }

    console.log(JSON.stringify(body, null, 2));
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((error) => {
  console.error("[content-publish] error", JSON.stringify(describeError(error), null, 2));
  process.exit(1);
});
