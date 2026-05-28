#!/usr/bin/env python3
import argparse
import datetime as dt
import hashlib
import json
import os
import pathlib
import sys


def require_oss2():
    try:
        import oss2  # type: ignore
    except ImportError:
        print("Missing dependency: oss2. Install with: python -m pip install oss2", file=sys.stderr)
        raise
    return oss2


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


def object_url(public_base_url: str, endpoint: str, bucket: str, key: str) -> str:
    if public_base_url:
        return f"{public_base_url.rstrip('/')}/{key}"

    endpoint_host = endpoint.replace("https://", "").replace("http://", "").rstrip("/")
    return f"https://{bucket}.{endpoint_host}/{key}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload a Shenleng web artifact and manifest to Alibaba Cloud OSS.")
    parser.add_argument("--artifact", required=True, help="Path to shenleng-web-standalone.tgz")
    parser.add_argument("--bucket", default=os.environ.get("ALIYUN_OSS_BUCKET"))
    parser.add_argument("--endpoint", default=os.environ.get("ALIYUN_OSS_ENDPOINT"))
    parser.add_argument("--prefix", default=os.environ.get("ALIYUN_OSS_PREFIX", "shenleng/web"))
    parser.add_argument("--public-base-url", default=os.environ.get("ALIYUN_OSS_PUBLIC_BASE_URL", ""))
    parser.add_argument("--version", default=os.environ.get("ARTIFACT_VERSION", ""))
    parser.add_argument("--manifest-key", default=os.environ.get("ALIYUN_OSS_MANIFEST_KEY", ""))
    parser.add_argument("--acl", choices=["", "public-read", "private"], default=os.environ.get("ALIYUN_OSS_OBJECT_ACL", ""))
    args = parser.parse_args()

    artifact_path = pathlib.Path(args.artifact)
    if not artifact_path.is_file():
        raise SystemExit(f"Artifact not found: {artifact_path}")

    access_key_id = env("ALIYUN_ACCESS_KEY_ID")
    access_key_secret = env("ALIYUN_ACCESS_KEY_SECRET")
    endpoint = args.endpoint or env("ALIYUN_OSS_ENDPOINT")
    bucket_name = args.bucket or env("ALIYUN_OSS_BUCKET")
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
    artifact_url = object_url(args.public_base_url, endpoint, bucket_name, artifact_key)

    manifest = {
        "schema": 1,
        "app": "shenleng-web",
        "version": version,
        "commit": github_sha,
        "branch": os.environ.get("GITHUB_REF_NAME", ""),
        "runId": github_run_id,
        "createdAt": dt.datetime.now(dt.UTC).isoformat().replace("+00:00", "Z"),
        "artifact": {
            "name": artifact_name,
            "key": artifact_key,
            "url": artifact_url,
            "sha256": digest,
            "size": size,
        },
    }
    manifest_bytes = json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8")

    oss2 = require_oss2()
    auth = oss2.Auth(access_key_id, access_key_secret)
    bucket = oss2.Bucket(auth, endpoint, bucket_name)

    headers = {}
    if args.acl:
        headers["x-oss-object-acl"] = args.acl

    bucket.put_object_from_file(artifact_key, str(artifact_path), headers=headers)
    bucket.put_object(version_manifest_key, manifest_bytes, headers={**headers, "Content-Type": "application/json"})
    bucket.put_object(manifest_key, manifest_bytes, headers={**headers, "Content-Type": "application/json"})

    print(json.dumps({
        "version": version,
        "artifactKey": artifact_key,
        "manifestKey": manifest_key,
        "manifestUrl": object_url(args.public_base_url, endpoint, bucket_name, manifest_key),
        "sha256": digest,
        "size": size,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
