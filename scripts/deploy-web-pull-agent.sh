#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

usage() {
  cat <<'EOF'
Pull and deploy a Shenleng frontend artifact from a manifest URL.

Usage:
  scripts/deploy-web-pull-agent.sh --manifest-url https://.../manifest.json --yes
  scripts/deploy-web-pull-agent.sh --manifest-url file:///tmp/manifest.json --dry-run

Environment:
  PROJECT_DIR=/home/ecs-user/Projects/shenleng
  WEB_DEPLOY_MANIFEST_URL=https://bucket.oss-cn-shanghai.aliyuncs.com/shenleng/web/manifest.json
  PUBLIC_URL=https://shenleng.roinland.com
  WEB_DEPLOY_PULL_CANDIDATE_ONLY=1

The agent downloads a prebuilt artifact, verifies sha256, and calls
scripts/deploy-web-light.sh. It does not build, install dependencies, pull
images, prune Docker, or reboot ECS.
EOF
}

log() {
  printf '[%s] %s\n' "$(date -Is 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z')" "$*"
}

die() {
  log "ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{ print $1 }'
    return
  fi

  shasum -a 256 "$1" | awk '{ print $1 }'
}

download() {
  local url="$1"
  local output="$2"
  curl -fsSL --retry 3 --retry-delay 2 --connect-timeout 10 --max-time 600 "$url" -o "$output"
}

manifest_url="${WEB_DEPLOY_MANIFEST_URL:-}"
dry_run=0
promote=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --manifest-url)
      manifest_url="${2:-}"
      shift 2
      ;;
    --manifest-url=*)
      manifest_url="${1#*=}"
      shift
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --yes)
      promote=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      die "Unknown argument: $1"
      ;;
  esac
done

[ -n "$manifest_url" ] || { usage >&2; die "--manifest-url or WEB_DEPLOY_MANIFEST_URL is required."; }

if [ "$dry_run" != "1" ] && [ "$promote" != "1" ]; then
  usage >&2
  die "--yes is required to deploy. Use --dry-run to only download and verify."
fi

require_cmd curl
require_cmd node

PROJECT_DIR="${PROJECT_DIR:-$HOME/Projects/shenleng}"
PUBLIC_URL="${PUBLIC_URL:-https://shenleng.roinland.com}"
STATE_DIR="${STATE_DIR:-$PROJECT_DIR/state/web-deploy-pull}"
DOWNLOAD_DIR="${DOWNLOAD_DIR:-$PROJECT_DIR/artifact-uploads/pull-agent}"
DEPLOY_SCRIPT="${DEPLOY_SCRIPT:-$PROJECT_DIR/scripts/deploy-web-light.sh}"
LOCK_DIR="${LOCK_DIR:-$STATE_DIR/lock}"

mkdir -p "$STATE_DIR" "$DOWNLOAD_DIR"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log "Another pull deploy is running; exiting."
  exit 0
fi
trap 'rm -rf "$LOCK_DIR"' EXIT

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"; rm -rf "$LOCK_DIR"' EXIT

manifest_file="$tmp_dir/manifest.json"
log "Downloading manifest: $manifest_url"
download "$manifest_url" "$manifest_file"

metadata_file="$tmp_dir/metadata.tsv"
node - "$manifest_file" "$manifest_url" >"$metadata_file" <<'NODE'
const fs = require("node:fs");
const [manifestPath, manifestUrl] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const artifact = manifest.artifact || {};

const version = String(manifest.version || "");
const rawUrl = String(artifact.url || artifact.artifactUrl || "");
const sha256 = String(artifact.sha256 || "");
const name = String(artifact.name || "shenleng-web-standalone.tgz");

if (!version || !rawUrl || !sha256) {
  throw new Error("manifest requires version, artifact.url, and artifact.sha256");
}

const resolvedUrl = new URL(rawUrl, manifestUrl).toString();
process.stdout.write([version, resolvedUrl, sha256.toLowerCase(), name].join("\t") + "\n");
NODE

IFS=$'\t' read -r version artifact_url expected_sha artifact_name <"$metadata_file"
case "$version" in
  ''|*/*|*..*|*[!A-Za-z0-9._-]*)
    die "Unsafe manifest version: $version"
    ;;
esac
case "$artifact_name" in
  ''|*/*|*..*)
    die "Unsafe artifact name: $artifact_name"
    ;;
esac

if [ -f "$STATE_DIR/applied-version" ] && [ "$(cat "$STATE_DIR/applied-version")" = "$version" ]; then
  log "Version already applied: $version"
  exit 0
fi

version_dir="$DOWNLOAD_DIR/$version"
artifact_path="$version_dir/$artifact_name"
mkdir -p "$version_dir"

log "Downloading artifact version=$version url=$artifact_url"
download "$artifact_url" "$artifact_path.tmp"
actual_sha="$(sha256_file "$artifact_path.tmp")"
if [ "$actual_sha" != "$expected_sha" ]; then
  rm -f "$artifact_path.tmp"
  die "Artifact sha256 mismatch. expected=$expected_sha actual=$actual_sha"
fi
mv "$artifact_path.tmp" "$artifact_path"
log "Artifact verified: $artifact_path sha256=$actual_sha"

if [ "$dry_run" = "1" ]; then
  log "Dry run complete. No deployment executed."
  exit 0
fi

[ -x "$DEPLOY_SCRIPT" ] || die "Deploy script is not executable: $DEPLOY_SCRIPT"

deploy_mode=(--yes)
if [ "${WEB_DEPLOY_PULL_CANDIDATE_ONLY:-0}" = "1" ]; then
  deploy_mode=(--candidate-only --skip-public-precheck)
fi

log "Running deploy script for version=$version mode=${deploy_mode[*]}"
PROJECT_DIR="$PROJECT_DIR" PUBLIC_URL="$PUBLIC_URL" "$DEPLOY_SCRIPT" --artifact "$artifact_path" "${deploy_mode[@]}"

printf '%s\n' "$version" >"$STATE_DIR/applied-version"
cp "$manifest_file" "$STATE_DIR/applied-manifest.json"
log "Pull deploy complete: $version"
