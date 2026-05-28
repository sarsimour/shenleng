import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createHash, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";
import sharp from "sharp";
import { readAppliedContentVersion } from "@/lib/server/content-publish-poller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 2_500_000;
const MAX_IMAGE_BYTES = 1_200_000;
const MAX_HTML_BYTES = 200_000;
const MAX_SUMMARY_BYTES = 1_000;
const MAX_TITLE_BYTES = 180;
const MAX_SLUG_BYTES = 140;
const DEFAULT_PACKAGE_BASE_URL = "https://pub-651f3cd4b3cd4772b94feb2194349b8b.r2.dev/shenleng/content/";

const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9-]{2,139}$/;
const SAFE_FILENAME_RE = /^[a-z0-9][a-z0-9._-]{2,179}\.(jpe?g|png|webp)$/;

type CoverImageInput = {
  filename?: unknown;
  alt?: unknown;
  mimeType?: unknown;
  dataBase64?: unknown;
};

type ContentPublishInput = {
  title?: unknown;
  slug?: unknown;
  summary?: unknown;
  legacyHtml?: unknown;
  baseViews?: unknown;
  publishedAt?: unknown;
  coverImage?: CoverImageInput;
};

type PackagePublishInput = {
  packageUrl?: unknown;
  sha256?: unknown;
};

type ValidatedInput = {
  title: string;
  slug: string;
  summary: string;
  legacyHtml: string;
  baseViews: number;
  publishedAt: string;
  coverImage: {
    filename: string;
    alt: string;
    mimeType: string;
    data: Buffer;
    width: number;
    height: number;
  };
};

type PublishResult = {
  action: "created" | "updated";
  articleId: number;
  mediaId: number;
};

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

function sha256Hex(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function constantTimeTokenMatch(provided: string, expected: string) {
  return timingSafeEqual(sha256(provided), sha256(expected));
}

function readBearerToken(req: NextRequest) {
  const value = req.headers.get("authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function isAuthorized(req: NextRequest) {
  const expected = process.env.CONTENT_PUBLISH_TOKEN?.trim();
  if (!expected || expected.length < 32) {
    return false;
  }

  const provided = readBearerToken(req);
  if (!provided) return false;

  return constantTimeTokenMatch(provided, expected);
}

function requiredText(value: unknown, field: string, maxBytes: number) {
  if (typeof value !== "string") {
    throw new Error(`${field}_required`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field}_required`);
  }

  if (Buffer.byteLength(trimmed, "utf8") > maxBytes) {
    throw new Error(`${field}_too_large`);
  }

  return trimmed;
}

function optionalText(value: unknown, maxBytes: number) {
  if (value == null) return "";
  if (typeof value !== "string") {
    throw new Error("invalid_text");
  }

  const trimmed = value.trim();
  if (Buffer.byteLength(trimmed, "utf8") > maxBytes) {
    throw new Error("text_too_large");
  }

  return trimmed;
}

function validateSlug(slug: string) {
  if (Buffer.byteLength(slug, "utf8") > MAX_SLUG_BYTES || !SAFE_SLUG_RE.test(slug)) {
    throw new Error("invalid_slug");
  }
}

function validateLegacyHtml(html: string) {
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    throw new Error("legacy_html_too_large");
  }

  const disallowedTags = /<\s*(script|iframe|object|embed|form|input|textarea|button|style|link|meta)\b/i;
  const eventAttributes = /\son[a-z]+\s*=/i;
  const scriptUrls = /\b(?:href|src)\s*=\s*["']?\s*javascript:/i;

  if (disallowedTags.test(html) || eventAttributes.test(html) || scriptUrls.test(html)) {
    throw new Error("unsafe_legacy_html");
  }
}

function validateBaseViews(value: unknown) {
  if (value == null) return 0;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("invalid_base_views");
  }
  if (value < 0 || value > 50_000) {
    throw new Error("invalid_base_views");
  }
  return value;
}

function validatePublishedAt(value: unknown) {
  if (value == null || value === "") return new Date().toISOString();
  if (typeof value !== "string") {
    throw new Error("invalid_published_at");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_published_at");
  }
  return date.toISOString();
}

function packageBaseUrls() {
  const configured = process.env.CONTENT_PUBLISH_PACKAGE_BASE_URLS || process.env.CONTENT_PUBLISH_PACKAGE_BASE_URL;
  const values = configured
    ? configured
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  return [...values, DEFAULT_PACKAGE_BASE_URL].map((value) => {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      throw new Error("invalid_package_base_url");
    }
    if (!url.pathname.endsWith("/")) {
      url.pathname = `${url.pathname}/`;
    }
    return url.toString();
  });
}

function validatePackagePointer(input: PackagePublishInput) {
  if (typeof input.packageUrl !== "string" || typeof input.sha256 !== "string") {
    throw new Error("invalid_package_pointer");
  }

  const packageUrl = new URL(input.packageUrl);
  if (packageUrl.protocol !== "https:" || packageUrl.username || packageUrl.password) {
    throw new Error("invalid_package_url");
  }

  const href = packageUrl.toString();
  const isAllowed = packageBaseUrls().some((baseUrl) => href.startsWith(baseUrl));
  if (!isAllowed) {
    throw new Error("package_url_not_allowed");
  }

  const expectedSha = input.sha256.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expectedSha)) {
    throw new Error("invalid_package_sha256");
  }

  return { packageUrl: href, expectedSha };
}

async function readResponseWithLimit(response: Response) {
  const contentLength = Number(response.headers.get("content-length") || "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    throw new Error("package_too_large");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_REQUEST_BYTES) {
    throw new Error("package_too_large");
  }

  return buffer;
}

async function loadPackageInput(pointer: PackagePublishInput): Promise<ContentPublishInput> {
  const { packageUrl, expectedSha } = validatePackagePointer(pointer);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(packageUrl, {
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`package_download_failed_${response.status}`);
    }

    const buffer = await readResponseWithLimit(response);
    const actualSha = sha256Hex(buffer);
    if (actualSha !== expectedSha) {
      throw new Error("package_sha256_mismatch");
    }

    try {
      return JSON.parse(buffer.toString("utf8")) as ContentPublishInput;
    } catch {
      throw new Error("invalid_package_json");
    }
  } finally {
    clearTimeout(timeout);
  }
}

function decodeBase64Image(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("image_required");
  }

  const base64 = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
  if (!/^[a-zA-Z0-9+/=\r\n]+$/.test(base64)) {
    throw new Error("invalid_image_data");
  }

  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) {
    throw new Error("invalid_image_data");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("image_too_large");
  }

  return buffer;
}

function mimeFromSharpFormat(format: string | undefined) {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "";
  }
}

function filenameExtension(filename: string) {
  return path.extname(filename).toLowerCase().replace(".", "");
}

function isExtensionCompatible(filename: string, mimeType: string) {
  const extension = filenameExtension(filename);
  if (mimeType === "image/jpeg") return extension === "jpg" || extension === "jpeg";
  if (mimeType === "image/png") return extension === "png";
  if (mimeType === "image/webp") return extension === "webp";
  return false;
}

async function validateInput(input: ContentPublishInput): Promise<ValidatedInput> {
  const title = requiredText(input.title, "title", MAX_TITLE_BYTES);
  const slug = requiredText(input.slug, "slug", MAX_SLUG_BYTES);
  validateSlug(slug);

  const summary = optionalText(input.summary, MAX_SUMMARY_BYTES);
  const legacyHtml = requiredText(input.legacyHtml, "legacy_html", MAX_HTML_BYTES);
  validateLegacyHtml(legacyHtml);

  if (!input.coverImage || typeof input.coverImage !== "object") {
    throw new Error("cover_image_required");
  }

  const filename = requiredText(input.coverImage.filename, "filename", 180).toLowerCase();
  if (!SAFE_FILENAME_RE.test(filename) || path.basename(filename) !== filename) {
    throw new Error("invalid_filename");
  }

  const imageData = decodeBase64Image(input.coverImage.dataBase64);
  const metadata = await sharp(imageData, { limitInputPixels: 40_000_000 }).metadata();
  const mimeType = mimeFromSharpFormat(metadata.format);
  if (!metadata.width || !metadata.height || !mimeType) {
    throw new Error("invalid_image");
  }

  const requestedMimeType = optionalText(input.coverImage.mimeType, 64);
  if (requestedMimeType && requestedMimeType !== mimeType) {
    throw new Error("image_mime_mismatch");
  }
  if (!isExtensionCompatible(filename, mimeType)) {
    throw new Error("image_extension_mismatch");
  }

  return {
    title,
    slug,
    summary,
    legacyHtml,
    baseViews: validateBaseViews(input.baseViews),
    publishedAt: validatePublishedAt(input.publishedAt),
    coverImage: {
      filename,
      alt: optionalText(input.coverImage.alt, 300) || title,
      mimeType,
      data: imageData,
      width: metadata.width,
      height: metadata.height,
    },
  };
}

function richTextFallback(summary: string) {
  return JSON.stringify({
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            {
              type: "text",
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: summary || "完整内容请查看网页正文。",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          textFormat: 0,
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  });
}

async function writeMediaFile(input: ValidatedInput) {
  const mediaDir = path.resolve(process.cwd(), "public/media");
  const destination = path.join(mediaDir, input.coverImage.filename);
  const normalizedMediaDir = `${mediaDir}${path.sep}`;

  if (!destination.startsWith(normalizedMediaDir)) {
    throw new Error("invalid_media_path");
  }

  await fs.mkdir(mediaDir, { recursive: true });
  const tempPath = path.join(
    mediaDir,
    `.${input.coverImage.filename}.${process.pid}.${Date.now()}.tmp`,
  );

  await fs.writeFile(tempPath, input.coverImage.data, { mode: 0o644 });
  await fs.rename(tempPath, destination);
}

async function upsertDatabase(input: ValidatedInput): Promise<PublishResult> {
  const databaseUrl = process.env.DATABASE_URI?.trim();
  if (!databaseUrl) {
    throw new Error("database_uri_missing");
  }

  const db = createClient({ url: databaseUrl });
  const now = new Date().toISOString();
  const mediaUrl = `/api/media/file/${input.coverImage.filename}`;

  await db.execute("BEGIN IMMEDIATE");

  try {
    let mediaId: number;
    const existingMedia = await db.execute({
      sql: "select id from media where filename = ? limit 1",
      args: [input.coverImage.filename],
    });

    if (existingMedia.rows.length) {
      mediaId = Number(existingMedia.rows[0].id);
      await db.execute({
        sql: `update media
              set alt = ?, updated_at = ?, url = ?, thumbnail_u_r_l = ?, mime_type = ?,
                  filesize = ?, width = ?, height = ?, focal_x = ?, focal_y = ?
              where id = ?`,
        args: [
          input.coverImage.alt,
          now,
          mediaUrl,
          null,
          input.coverImage.mimeType,
          input.coverImage.data.length,
          input.coverImage.width,
          input.coverImage.height,
          50,
          50,
          mediaId,
        ],
      });
    } else {
      const mediaInsert = await db.execute({
        sql: `insert into media
              (alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type,
               filesize, width, height, focal_x, focal_y)
              values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          input.coverImage.alt,
          now,
          now,
          mediaUrl,
          null,
          input.coverImage.filename,
          input.coverImage.mimeType,
          input.coverImage.data.length,
          input.coverImage.width,
          input.coverImage.height,
          50,
          50,
        ],
      });
      mediaId = Number(mediaInsert.lastInsertRowid);
    }

    let action: PublishResult["action"];
    let articleId: number;
    const existingArticle = await db.execute({
      sql: "select id from articles where slug = ? limit 1",
      args: [input.slug],
    });

    if (existingArticle.rows.length) {
      action = "updated";
      articleId = Number(existingArticle.rows[0].id);
      await db.execute({
        sql: `update articles
              set title = ?, summary = ?, legacy_html = ?, is_legacy = ?, original_url = ?,
                  video_url = ?, cover_image_id = ?, content = ?, base_views = ?,
                  view_count = ?, published_at = ?, updated_at = ?
              where id = ?`,
        args: [
          input.title,
          input.summary,
          input.legacyHtml,
          1,
          null,
          null,
          mediaId,
          richTextFallback(input.summary),
          input.baseViews,
          0,
          input.publishedAt,
          now,
          articleId,
        ],
      });
    } else {
      action = "created";
      const articleInsert = await db.execute({
        sql: `insert into articles
              (title, slug, summary, legacy_html, is_legacy, original_url, video_url,
               cover_image_id, content, base_views, view_count, published_at, updated_at, created_at)
              values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          input.title,
          input.slug,
          input.summary,
          input.legacyHtml,
          1,
          null,
          null,
          mediaId,
          richTextFallback(input.summary),
          input.baseViews,
          0,
          input.publishedAt,
          now,
          now,
        ],
      });
      articleId = Number(articleInsert.lastInsertRowid);
    }

    await db.execute("COMMIT");
    return { action, articleId, mediaId };
  } catch (error) {
    await db.execute("ROLLBACK");
    throw error;
  }
}

async function parseRequest(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("unsupported_content_type");
  }

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    throw new Error("request_too_large");
  }

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_REQUEST_BYTES) {
    throw new Error("request_too_large");
  }

  try {
    return JSON.parse(raw) as ContentPublishInput;
  } catch {
    throw new Error("invalid_json");
  }
}

async function resolvePublishInput(input: ContentPublishInput & PackagePublishInput) {
  if (input.packageUrl != null || input.sha256 != null) {
    return loadPackageInput(input);
  }

  return input;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return json({ ok: false }, 401);
  }

  try {
    const body = await resolvePublishInput(await parseRequest(req));
    const input = await validateInput(body);
    await writeMediaFile(input);
    const result = await upsertDatabase(input);

    revalidatePath("/articles");
    revalidatePath(`/articles/${input.slug}`);
    revalidatePath("/sitemap.xml");

    return json({
      ok: true,
      action: result.action,
      article: {
        id: result.articleId,
        slug: input.slug,
        url: `/articles/${input.slug}`,
      },
      media: {
        id: result.mediaId,
        filename: input.coverImage.filename,
        url: `/api/media/file/${input.coverImage.filename}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "publish_failed";
    console.error("[content-publish] failed:", message);
    return json({ ok: false, error: message }, message === "request_too_large" ? 413 : 400);
  }
}

export async function GET() {
  return json({
    ok: true,
    appliedVersion: await readAppliedContentVersion(),
  });
}
