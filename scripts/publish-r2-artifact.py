#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import mimetypes
import os
import pathlib
import sys
import urllib.parse
import urllib.request


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
    content_type: str,
    cache_control: str,
) -> dict:
    encoded_key = urllib.parse.quote(key, safe="")
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{account_id}/r2/buckets/{bucket}/objects/{encoded_key}"
    )
    request = urllib.request.Request(url, method="PUT", data=body)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Content-Type", content_type)
    request.add_header("Cache-Control", cache_control)

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


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload a Shenleng web artifact and manifest to Cloudflare R2.")
    parser.add_argument("--artifact", required=True, help="Path to shenleng-web-standalone.tgz")
    parser.add_argument("--bucket", default=os.environ.get("CLOUDFLARE_R2_BUCKET_NAME"))
    parser.add_argument("--prefix", default=os.environ.get("CLOUDFLARE_R2_PREFIX", "shenleng/web"))
    parser.add_argument("--public-base-url", default=os.environ.get("CLOUDFLARE_R2_PUBLIC_BASE_URL", ""))
    parser.add_argument("--version", default=os.environ.get("ARTIFACT_VERSION", ""))
    parser.add_argument("--manifest-key", default=os.environ.get("CLOUDFLARE_R2_MANIFEST_KEY", ""))
    args = parser.parse_args()

    artifact_path = pathlib.Path(args.artifact)
    if not artifact_path.is_file():
        raise SystemExit(f"Artifact not found: {artifact_path}")

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

    artifact_name = artifact_path.name
    artifact_key = f"{prefix}/artifacts/{version}/{artifact_name}"
    manifest_key = args.manifest_key or f"{prefix}/manifest.json"
    version_manifest_key = f"{prefix}/manifests/{version}.json"

    digest = sha256_file(artifact_path)
    size = artifact_path.stat().st_size
    artifact_content_type = mimetypes.guess_type(artifact_name)[0] or "application/gzip"

    manifest = {
        "schema": 1,
        "provider": "cloudflare-r2",
        "app": "shenleng-web",
        "version": version,
        "commit": github_sha,
        "branch": os.environ.get("GITHUB_REF_NAME", ""),
        "runId": github_run_id,
        "createdAt": dt.datetime.now(dt.UTC).isoformat().replace("+00:00", "Z"),
        "artifact": {
            "name": artifact_name,
            "key": artifact_key,
            "url": object_url(public_base_url, artifact_key),
            "sha256": digest,
            "size": size,
        },
    }
    manifest_bytes = json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8")

    put_object(
        account_id=account_id,
        token=token,
        bucket=bucket,
        key=artifact_key,
        body=artifact_path.read_bytes(),
        content_type=artifact_content_type,
        cache_control="public, max-age=31536000, immutable",
    )
    put_object(
        account_id=account_id,
        token=token,
        bucket=bucket,
        key=version_manifest_key,
        body=manifest_bytes,
        content_type="application/json; charset=utf-8",
        cache_control="public, max-age=31536000, immutable",
    )
    put_object(
        account_id=account_id,
        token=token,
        bucket=bucket,
        key=manifest_key,
        body=manifest_bytes,
        content_type="application/json; charset=utf-8",
        cache_control="no-store",
    )

    print(json.dumps({
        "version": version,
        "provider": "cloudflare-r2",
        "artifactKey": artifact_key,
        "manifestKey": manifest_key,
        "manifestUrl": object_url(public_base_url, manifest_key),
        "sha256": digest,
        "size": size,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
