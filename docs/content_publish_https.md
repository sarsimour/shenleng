# HTTPS Content Publishing

This is the lightweight publishing path for articles and cover images. It does not build the frontend, update an image, restart `shenleng-web`, or require a daily SSH session.

## Flow

1. Prepare article JSON and local cover image on a workstation or GitHub runner.
2. `src/scripts/publish-content.ts` compresses the cover image locally.
3. For local publishing, the script sends one authenticated `POST` request to:

   ```text
   https://shenleng.roinland.com/api/content-publish
   ```

4. For GitHub publishing, the workflow uploads the prepared content package to R2 first, then sends only `{ packageUrl, sha256 }` to the same endpoint. This avoids large CI POST bodies being challenged by Cloudflare.
5. The server validates the token, package URL allowlist, package sha256, payload size, image type, filename, slug, and HTML safety rules.
6. The server writes the image to `public/media`, upserts the `media` row, upserts the `articles` row, then revalidates `/articles`, the article path, and `/sitemap.xml`.

## Required Secret

Production must define:

```text
CONTENT_PUBLISH_TOKEN=<random 32+ character token>
```

The same value is needed as the GitHub repository secret `CONTENT_PUBLISH_TOKEN` if the GitHub workflow is used.

If this token is missing or shorter than 32 characters, the endpoint returns `401` and publishes nothing.

GitHub publishing also uses the existing R2 secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_R2_BUCKET_NAME
CLOUDFLARE_R2_PUBLIC_BASE_URL
```

The server accepts package URLs under `https://pub-651f3cd4b3cd4772b94feb2194349b8b.r2.dev/shenleng/content/` by default. Override with `CONTENT_PUBLISH_PACKAGE_BASE_URLS` only when moving to a different R2 public base.

## Content Spec

Example:

```json
{
  "title": "港口高位运行下，冷箱运输要把计划做在前面",
  "slug": "gang-kou-gao-wei-yun-xing-leng-xiang-ji-hua-zuo-zai-qian-mian",
  "summary": "从2026年前4个月外贸数据、上海港一季度吞吐量和冷链行业运行情况看，冷箱需求仍有韧性。",
  "legacyHtmlPath": "./article.html",
  "baseViews": 18,
  "publishedAt": "2026-05-28T11:09:30.347Z",
  "coverImage": {
    "path": "./cover.jpg",
    "filename": "2026-reefer-containers-cc0-wikideas1.jpg",
    "alt": "铁路上的冷藏集装箱，图片来源 Wikideas1 / Wikimedia Commons CC0 1.0"
  }
}
```

`legacyHtml` can be embedded directly instead of using `legacyHtmlPath`.

The publisher also accepts migrated article JSON files under `data/nextjs_content/content/json/*.json`.
For those files it maps:

- `description` -> `summary`
- `content_html` -> `legacyHtml`
- `views` -> `baseViews`
- `date` -> `publishedAt`
- `featured_image` -> cover image path under `public/images`

## Local Publish

```bash
CONTENT_PUBLISH_TOKEN=... \
npm run content:publish -- --site https://shenleng.roinland.com path/to/content.json
```

Dry run, no network request:

```bash
npm run content:publish -- --dry-run path/to/content.json
```

Create a content package for R2-based publishing:

```bash
npm run content:publish -- --package-output /tmp/content-package.json path/to/content.json
python scripts/publish-r2-content-package.py --package /tmp/content-package.json
```

## GitHub Workflow

Use `.github/workflows/publish-content.yml` with manual dispatch:

```text
content_file: content/articles/example/content.json
site_url: https://shenleng.roinland.com
```

Existing migrated content can be re-published the same way:

```text
content_file: data/nextjs_content/content/json/shang-hai-gang-jin-kou-leng-xiang-jin-ji-shu-gang-che-dui.json
site_url: https://shenleng.roinland.com
```

The runner installs dependencies on GitHub, compresses the cover image on GitHub, uploads a JSON package to R2, then triggers the server with a small authenticated HTTPS request.

## Safety Rules

- No SSH or Cloud Assistant for routine content publishing.
- The server never downloads external images.
- R2 package URLs are allowlisted and verified by sha256 before use.
- Accepted image types: JPEG, PNG, WebP.
- Max request size: 2.5 MB.
- Max uploaded image size after compression: 1.2 MB.
- Slug and filename must be lowercase safe paths.
- HTML rejects script-like tags, inline event handlers, and `javascript:` URLs.
- Publishing is idempotent by `slug` and cover `filename`.
- Do not use `journalctl` for routine production health checks on the ECS host; it has caused disk-read saturation on this instance.

## Verification

After publishing:

```bash
curl -I https://shenleng.roinland.com/articles/<slug>
curl -I https://shenleng.roinland.com/api/media/file/<filename>
curl -s https://shenleng.roinland.com/sitemap.xml | rg '<slug>'
```

Expected result: all HTTP checks return `200`, and sitemap contains the article URL.
