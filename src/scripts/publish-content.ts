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

type CliOptions = {
  specPath: string;
  siteUrl: string;
  dryRun: boolean;
};

function usage(): never {
  console.error(
    [
      "Usage: pnpm content:publish [--site https://shenleng.roinland.com] [--dry-run] <content.json>",
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

    if (arg.startsWith("-")) usage();
    specPath = arg;
  }

  if (!specPath) usage();

  return {
    specPath: path.resolve(process.cwd(), specPath),
    siteUrl: siteUrl.replace(/\/+$/, ""),
    dryRun,
  };
}

function assertString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function normalizeSpec(raw: unknown): ContentSpec {
  if (!raw || typeof raw !== "object") {
    throw new Error("content spec must be an object");
  }

  const spec = raw as Partial<ContentSpec>;
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
  if (!token && !options.dryRun) {
    throw new Error("CONTENT_PUBLISH_TOKEN is required");
  }

  const specDir = path.dirname(options.specPath);
  const spec = normalizeSpec(JSON.parse(await fs.readFile(options.specPath, "utf8")));
  const legacyHtml = await readLegacyHtml(spec, specDir);
  const coverImage = await prepareCoverImage(spec, specDir);
  const endpoint = `${options.siteUrl}/api/content-publish`;

  const payload = {
    title: spec.title,
    slug: spec.slug,
    summary: spec.summary || "",
    legacyHtml,
    baseViews: spec.baseViews || 0,
    publishedAt: spec.publishedAt,
    coverImage,
  };

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

    if (!response.ok) {
      throw new Error(`publish failed: HTTP ${response.status} ${JSON.stringify(body)}`);
    }

    console.log(JSON.stringify(body, null, 2));
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
