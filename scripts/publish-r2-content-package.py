#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import os
import pathlib
import urllib.parse
import urllib.request


MAX_PACKAGE_BYTES = 2_500_000


def env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if value is None or value == "":
        raise SystemExit(f"{name} is required")
    return value


def sha256_file(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def object_url(public_base_url: str, key: str) -> str:
    return f"{public_base_url.rstrip('/')}/{key}"


def put_object(
    *,
    account_id: str,
    token: str,
    bucket: str,
    key: str,
    body: bytes,
) -> dict:
    encoded_key = urllib.parse.quote(key, safe="")
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{account_id}/r2/buckets/{bucket}/objects/{encoded_key}"
    )
    request = urllib.request.Request(url, method="PUT", data=body)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Content-Type", "application/json; charset=utf-8")
    request.add_header("Cache-Control", "public, max-age=31536000, immutable")

    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            response_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Cloudflare R2 upload failed: HTTP {exc.code} {details}") from exc

    payload = json.loads(response_body)
    if not payload.get("success"):
        raise SystemExit(f"Cloudflare R2 upload failed: {response_body}")
    return payload


def set_github_output(values: dict[str, str]) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return

    with open(output_path, "a", encoding="utf-8") as f:
        for key, value in values.items():
            f.write(f"{key}={value}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload a Shenleng content package to Cloudflare R2.")
    parser.add_argument("--package", required=True, dest="package_path", help="Path to content package JSON")
    parser.add_argument("--bucket", default=os.environ.get("CLOUDFLARE_R2_BUCKET_NAME"))
    parser.add_argument("--prefix", default=os.environ.get("CLOUDFLARE_R2_CONTENT_PREFIX", "shenleng/content"))
    parser.add_argument("--public-base-url", default=os.environ.get("CLOUDFLARE_R2_PUBLIC_BASE_URL", ""))
    parser.add_argument("--version", default=os.environ.get("CONTENT_PACKAGE_VERSION", ""))
    args = parser.parse_args()

    package_path = pathlib.Path(args.package_path)
    if not package_path.is_file():
        raise SystemExit(f"Content package not found: {package_path}")

    size = package_path.stat().st_size
    if size > MAX_PACKAGE_BYTES:
        raise SystemExit(f"Content package is too large: {size} bytes")

    account_id = env("CLOUDFLARE_ACCOUNT_ID")
    token = env("CLOUDFLARE_API_TOKEN")
    bucket = args.bucket or env("CLOUDFLARE_R2_BUCKET_NAME")
    public_base_url = args.public_base_url or env("CLOUDFLARE_R2_PUBLIC_BASE_URL")
    prefix = args.prefix.strip("/")

    github_sha = os.environ.get("GITHUB_SHA", "")
    github_run_id = os.environ.get("GITHUB_RUN_ID", "")
    version = args.version or f"{github_run_id}-{github_sha[:12]}".strip("-")
    if not version:
        version = dt.datetime.now(dt.UTC).strftime("%Y%m%d%H%M%S")

    digest = sha256_file(package_path)
    package_key = f"{prefix}/packages/{version}.json"
    package_url = object_url(public_base_url, package_key)

    put_object(
        account_id=account_id,
        token=token,
        bucket=bucket,
        key=package_key,
        body=package_path.read_bytes(),
    )

    result = {
        "version": version,
        "provider": "cloudflare-r2",
        "packageKey": package_key,
        "packageUrl": package_url,
        "sha256": digest,
        "size": size,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    set_github_output({
        "package_url": package_url,
        "sha256": digest,
        "size": str(size),
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
