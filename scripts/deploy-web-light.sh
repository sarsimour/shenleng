#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

usage() {
  cat <<'EOF'
Lightweight Shenleng frontend deploy.

This script runs on the ECS host. It deploys a prebuilt Next.js standalone
artifact without building on the server, then validates a candidate process
before promoting it to the live port.

Usage:
  scripts/deploy-web-light.sh --artifact /path/to/shenleng-artifact.tgz --yes
  scripts/deploy-web-light.sh --artifact /path/to/shenleng-artifact.tgz --candidate-only

Important:
  --yes is required to switch live traffic.
  --candidate-only validates the artifact on the candidate port and stops it.

Environment overrides:
  PROJECT_DIR=/home/ecs-user/Projects/shenleng
  PUBLIC_URL=https://shenleng.roinland.com
  ACTIVE_PORT=3000
  CANDIDATE_PORT=3101
  MIN_AVAILABLE_MEM_MB=256
  MIN_FREE_DISK_MB=2048
  MAX_LOAD_1M=2.5
  STARTUP_TIMEOUT_SECONDS=90
  KEEP_RELEASES=5
  WEB_DEPLOY_VERSECORE_API_BASE_URL=http://127.0.0.1:9100
EOF
}

log() {
  printf '[%s] %s\n' "$(timestamp)" "$*"
}

die() {
  printf '[%s] ERROR: %s\n' "$(timestamp)" "$*" >&2
  exit 1
}

timestamp() {
  date -Is 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z'
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

http_code() {
  local url="$1"
  curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "$url" 2>/dev/null || printf '000'
}

compare_number_lte() {
  awk -v actual="$1" -v max="$2" 'BEGIN { exit !(actual <= max) }'
}

available_mem_mb() {
  if [ -r /proc/meminfo ]; then
    awk '/MemAvailable/ { printf "%.0f\n", $2 / 1024 }' /proc/meminfo
    return
  fi

  if command -v sysctl >/dev/null 2>&1; then
    sysctl -n hw.memsize 2>/dev/null | awk '{ printf "%.0f\n", $1 / 1024 / 1024 }'
    return
  fi

  printf '%s\n' 0
}

load_1m_value() {
  if [ -r /proc/loadavg ]; then
    awk '{ print $1 }' /proc/loadavg
    return
  fi

  uptime | awk -F'load averages?: ' '{ print $2 }' | awk '{ gsub(",", "", $1); print $1 }'
}

free_disk_mb() {
  df -Pm "$1" | awk 'NR == 2 { print $4 }'
}

find_port_pids() {
  local port="$1"
  local pids=""

  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      printf '%s\n' "$pids" | sort -u
      return
    fi
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp "sport = :$port" 2>/dev/null \
      | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' \
      | sort -u || true
  fi
}

pid_is_listening_on_port() {
  local pid="$1"
  local port="$2"
  local listener

  for listener in $(find_port_pids "$port"); do
    if [ "$listener" = "$pid" ]; then
      return 0
    fi
  done

  return 1
}

release_is_listening_on_port() {
  local release_dir="$1"
  local port="$2"
  local listener
  local listener_cwd

  for listener in $(find_port_pids "$port"); do
    listener_cwd="$(readlink -f "/proc/$listener/cwd" 2>/dev/null || true)"
    if [ "$listener_cwd" = "$release_dir" ]; then
      return 0
    fi
  done

  return 1
}

systemctl_run() {
  if [ "$(id -u)" -eq 0 ]; then
    systemctl "$@"
  else
    sudo -n systemctl "$@"
  fi
}

can_manage_systemd_unit() {
  local unit="$1"
  command -v systemctl >/dev/null 2>&1 || return 1
  systemctl status "$unit" >/dev/null 2>&1 || systemctl list-unit-files "$unit" >/dev/null 2>&1 || return 1

  if [ "$(id -u)" -eq 0 ]; then
    return 0
  fi

  sudo -n true >/dev/null 2>&1
}

update_current_symlink() {
  local target="$1"
  local link="$PROJECT_DIR/current-web"

  ln -sfnT "$target" "$link" 2>/dev/null || ln -sfn "$target" "$link"
}

stop_pids() {
  local pids="$1"
  local timeout_seconds="${2:-12}"
  local waited=0

  if [ -z "$pids" ]; then
    return 0
  fi

  log "Stopping process(es): $(echo "$pids" | tr '\n' ' ')"
  kill $pids 2>/dev/null || true

  while [ "$waited" -lt "$timeout_seconds" ]; do
    local still_running=""
    for pid in $pids; do
      if kill -0 "$pid" 2>/dev/null; then
        still_running="$still_running $pid"
      fi
    done

    if [ -z "$still_running" ]; then
      return 0
    fi

    sleep 1
    waited=$((waited + 1))
  done

  log "Force-stopping remaining process(es):$still_running"
  kill -9 $still_running 2>/dev/null || true
}

safe_source_env() {
  local env_file="$1"
  if [ ! -f "$env_file" ]; then
    return 0
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
      *=*) ;;
      *) continue ;;
    esac

    local key="${line%%=*}"
    local value="${line#*=}"

    case "$key" in
      ''|*[!A-Za-z0-9_]*)
        continue
        ;;
    esac

    if [ -z "${!key+x}" ]; then
      export "$key=$value"
    fi
  done <"$env_file"
}

normalize_backend_url() {
  local configured="${WEB_DEPLOY_VERSECORE_API_BASE_URL:-${VERSECORE_API_BASE_URL:-http://127.0.0.1:9100}}"
  case "$configured" in
    http://versecore-api:9000|http://versecore-api:9000/)
      printf '%s\n' "http://127.0.0.1:9100"
      ;;
    *)
      printf '%s\n' "$configured"
      ;;
  esac
}

start_next_server() {
  local release_dir="$1"
  local port="$2"
  local hostname="$3"
  local database_uri="$4"
  local log_file="$5"
  local pid_file="$6"

  (
    cd "$release_dir"
    nohup env \
      NODE_ENV=production \
      NEXT_TELEMETRY_DISABLED=1 \
      PORT="$port" \
      HOSTNAME="$hostname" \
      PAYLOAD_SECRET="$PAYLOAD_SECRET" \
      DATABASE_URI="$database_uri" \
      PAYLOAD_CONFIG_PATH=src/payload.config.ts \
      VERSECORE_API_BASE_URL="$RUNTIME_VERSECORE_API_BASE_URL" \
      NEXT_PUBLIC_VERSECORE_APP_ID="$NEXT_PUBLIC_VERSECORE_APP_ID" \
      NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME="$NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME" \
      NEXT_PUBLIC_LOGISTICS_CHATBOT_ID="$NEXT_PUBLIC_LOGISTICS_CHATBOT_ID" \
      NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
      REQUEST_LOG_SHARED_SECRET="${REQUEST_LOG_SHARED_SECRET:-}" \
      node server.js >"$log_file" 2>&1 &
    echo "$!" >"$pid_file"
  )

  cat "$pid_file"
}

wait_for_ready() {
  local port="$1"
  local pid="$2"
  local log_file="$3"
  local timeout_seconds="$4"
  local expected_release_dir="${5:-}"
  local started_at
  started_at="$(date +%s)"

  while true; do
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
      tail -n 160 "$log_file" || true
      log "Process $pid exited before becoming ready on port $port."
      return 1
    fi

    if curl -fsS --max-time 5 "http://127.0.0.1:$port/" >/tmp/shenleng-web-health-home.html 2>/dev/null; then
      if [ -n "$expected_release_dir" ] && release_is_listening_on_port "$expected_release_dir" "$port"; then
        return 0
      fi
      if [ -z "$expected_release_dir" ] && [ -n "$pid" ] && pid_is_listening_on_port "$pid" "$port"; then
        return 0
      fi
      log "Port $port responded, but expected release is not the listener yet."
    fi

    if [ $(( $(date +%s) - started_at )) -ge "$timeout_seconds" ]; then
      tail -n 160 "$log_file" || true
      log "Timed out waiting for port $port to become ready."
      return 1
    fi

    sleep 2
  done
}

check_local_http() {
  local port="$1"
  local label="$2"

  local home_code
  home_code="$(http_code "http://127.0.0.1:$port/")"
  log "$label home_status=$home_code"
  [ "$home_code" = "200" ] || return 1

  local articles_code
  articles_code="$(http_code "http://127.0.0.1:$port/articles")"
  log "$label articles_status=$articles_code"
  [ "$articles_code" = "200" ] || return 1

  local sitemap_code
  sitemap_code="$(http_code "http://127.0.0.1:$port/sitemap.xml")"
  log "$label sitemap_status=$sitemap_code"
  [ "$sitemap_code" = "200" ] || return 1

  local headers
  headers="$(mktemp)"
  local legacy_code
  legacy_code="$(curl -sS -o /dev/null -D "$headers" -w '%{http_code}' --max-time 8 "http://127.0.0.1:$port/show.asp?id=1233" 2>/dev/null || printf '000')"
  local legacy_location
  legacy_location="$(awk 'BEGIN { IGNORECASE=1 } /^location:/ { print $2 }' "$headers" | tr -d '\r' | tail -n 1)"
  rm -f "$headers"
  log "$label legacy_status=$legacy_code legacy_location=$legacy_location"

  case "$legacy_code" in
    301|302|307|308) ;;
    *) return 1 ;;
  esac
  printf '%s\n' "$legacy_location" | grep -q '^/articles/' || return 1

  if [ -n "${MEDIA_CHECK_PATH:-}" ]; then
    local media_code
    media_code="$(http_code "http://127.0.0.1:$port$MEDIA_CHECK_PATH")"
    log "$label media_status=$media_code path=$MEDIA_CHECK_PATH"
    [ "$media_code" = "200" ] || return 1
  fi
}

check_public_http() {
  local label="$1"
  local path="${2:-/}"
  local attempt=1
  local code

  while [ "$attempt" -le 6 ]; do
    code="$(http_code "${PUBLIC_URL%/}$path" || true)"
    log "$label public_status=$code path=$path attempt=$attempt"
    if [ "$code" = "200" ]; then
      return 0
    fi
    sleep 3
    attempt=$((attempt + 1))
  done

  return 1
}

copy_sqlite_db() {
  local source_db="$1"
  local target_db="$2"

  rm -f "$target_db"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$source_db" ".backup '$target_db'"
  else
    cp "$source_db" "$target_db"
  fi
}

ensure_runtime_schema() {
  local release_dir="$1"
  local database_uri="$2"
  local schema_script="$release_dir/src/scripts/ensure-runtime-schema.mjs"

  if [ ! -f "$schema_script" ]; then
    log "No runtime schema script found in release; skipping schema sync."
    return 0
  fi

  log "Ensuring runtime schema for $database_uri"
  (
    cd "$release_dir"
    env \
      NODE_ENV=production \
      DATABASE_URI="$database_uri" \
      PAYLOAD_SECRET="$PAYLOAD_SECRET" \
      node "$schema_script"
  )
}

cleanup_old_releases() {
  local keep="$1"

  if [ "$keep" -le 0 ]; then
    return 0
  fi

  find "$RELEASES_DIR" -maxdepth 1 -type d -name 'web-*' -print \
    | sort -r \
    | awk -v keep="$keep" 'NR > keep { print }' \
    | while IFS= read -r old_release; do
        if [ -n "$old_release" ] && [ "$old_release" != "$release_dir" ]; then
          log "Removing old release: $old_release"
          rm -rf "$old_release"
        fi
      done
}

artifact_path=""
promote=0
candidate_only=0
skip_public_precheck=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --artifact)
      artifact_path="${2:-}"
      shift 2
      ;;
    --artifact=*)
      artifact_path="${1#*=}"
      shift
      ;;
    --yes)
      promote=1
      shift
      ;;
    --candidate-only)
      candidate_only=1
      shift
      ;;
    --skip-public-precheck)
      skip_public_precheck=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [ -z "$artifact_path" ]; then
        artifact_path="$1"
        shift
      else
        usage >&2
        die "Unknown argument: $1"
      fi
      ;;
  esac
done

[ -n "$artifact_path" ] || { usage >&2; die "--artifact is required."; }
[ -f "$artifact_path" ] || die "Artifact not found: $artifact_path"

if [ "$candidate_only" = "1" ] && [ "$promote" = "1" ]; then
  die "Use either --candidate-only or --yes, not both."
fi

if [ "$candidate_only" != "1" ] && [ "$promote" != "1" ]; then
  usage >&2
  die "--yes is required to promote live traffic. Use --candidate-only for validation only."
fi

PROJECT_DIR="${PROJECT_DIR:-$HOME/Projects/shenleng}"
PUBLIC_URL="${PUBLIC_URL:-https://shenleng.roinland.com}"
ACTIVE_PORT="${ACTIVE_PORT:-3000}"
CANDIDATE_PORT="${CANDIDATE_PORT:-3101}"
MIN_AVAILABLE_MEM_MB="${MIN_AVAILABLE_MEM_MB:-256}"
MIN_FREE_DISK_MB="${MIN_FREE_DISK_MB:-2048}"
MAX_LOAD_1M="${MAX_LOAD_1M:-2.5}"
STARTUP_TIMEOUT_SECONDS="${STARTUP_TIMEOUT_SECONDS:-90}"
STOP_TIMEOUT_SECONDS="${STOP_TIMEOUT_SECONDS:-12}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

RELEASES_DIR="${RELEASES_DIR:-$PROJECT_DIR/releases}"
PERSISTENCE_DIR="${PERSISTENCE_DIR:-$PROJECT_DIR/persistence}"
LOG_DIR="${LOG_DIR:-$PROJECT_DIR/logs/web-deploy}"
STATE_DIR="${STATE_DIR:-$PROJECT_DIR/state/web-deploy}"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"

require_cmd curl
require_cmd tar
require_cmd awk
require_cmd sha256sum
require_cmd node

mkdir -p "$RELEASES_DIR" "$PERSISTENCE_DIR/sqlite" "$PERSISTENCE_DIR/media" "$PERSISTENCE_DIR/images" "$LOG_DIR" "$STATE_DIR"

safe_source_env "$ENV_FILE"

: "${PAYLOAD_SECRET:?PAYLOAD_SECRET is required in the environment or .env}"
: "${NEXT_PUBLIC_LOGISTICS_CHATBOT_ID:?NEXT_PUBLIC_LOGISTICS_CHATBOT_ID is required in the environment or .env}"
: "${NEXT_PUBLIC_SITE_URL:?NEXT_PUBLIC_SITE_URL is required in the environment or .env}"

NEXT_PUBLIC_VERSECORE_APP_ID="${NEXT_PUBLIC_VERSECORE_APP_ID:-logistics-web}"
NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME="${NEXT_PUBLIC_LOGISTICS_CHATBOT_NAME:-Shenleng Presales Advisor}"
RUNTIME_VERSECORE_API_BASE_URL="$(normalize_backend_url)"

prod_db="$PERSISTENCE_DIR/sqlite/payload.db"
[ -s "$prod_db" ] || die "Production database not found: $prod_db"

log "Preflight: no heavy build or destructive operation will be run."
if pgrep -af 'docker build|next build|npm run build|pnpm build|pnpm install|npm install' >/tmp/shenleng-web-heavy-processes.txt 2>/dev/null; then
  cat /tmp/shenleng-web-heavy-processes.txt >&2
  die "A heavy build/install process is already running. Refusing to deploy."
fi

load_1m="$(load_1m_value)"
log "Preflight load_1m=$load_1m max=$MAX_LOAD_1M"
compare_number_lte "$load_1m" "$MAX_LOAD_1M" || die "Load is too high for a safe deploy."

mem_mb="$(available_mem_mb)"
log "Preflight mem_available_mb=$mem_mb min=$MIN_AVAILABLE_MEM_MB"
[ "$mem_mb" -ge "$MIN_AVAILABLE_MEM_MB" ] || die "Available memory is too low for a safe deploy."

disk_mb="$(free_disk_mb "$PROJECT_DIR")"
log "Preflight disk_free_mb=$disk_mb min=$MIN_FREE_DISK_MB"
[ "$disk_mb" -ge "$MIN_FREE_DISK_MB" ] || die "Free disk is too low for a safe deploy."

if [ "$skip_public_precheck" != "1" ]; then
  check_public_http "preflight" "/" || die "Current public site is unhealthy; refusing to deploy over an incident."
fi

candidate_pids="$(find_port_pids "$CANDIDATE_PORT")"
if [ -n "$candidate_pids" ]; then
  log "Cleaning stale candidate port $CANDIDATE_PORT."
  stop_pids "$candidate_pids" "$STOP_TIMEOUT_SECONDS"
fi

artifact_sha="$(sha256sum "$artifact_path" | awk '{ print substr($1, 1, 12) }')"
release_id="web-$(date +%Y%m%d%H%M%S)-$artifact_sha"
release_dir="$RELEASES_DIR/$release_id"
tmp_release_dir="$release_dir.tmp"
candidate_log="$LOG_DIR/$release_id-candidate.log"
candidate_pid_file="$STATE_DIR/$release_id-candidate.pid"
live_log="$LOG_DIR/$release_id-live.log"
live_pid_file="$STATE_DIR/live.pid"

log "Preparing release $release_id from $artifact_path"
rm -rf "$tmp_release_dir" "$release_dir"
mkdir -p "$tmp_release_dir"
tar -xzf "$artifact_path" -C "$tmp_release_dir"

[ -f "$tmp_release_dir/server.js" ] || die "Artifact does not contain server.js."
[ -d "$tmp_release_dir/.next/static" ] || die "Artifact does not contain .next/static."
mkdir -p "$tmp_release_dir/public" "$tmp_release_dir/database"

if [ -d "$tmp_release_dir/public/images" ] && [ -z "$(find "$PERSISTENCE_DIR/images" -mindepth 1 -print -quit)" ]; then
  log "Seeding persistent public/images from artifact."
  cp -a "$tmp_release_dir/public/images/." "$PERSISTENCE_DIR/images/"
fi

rm -rf "$tmp_release_dir/public/media" "$tmp_release_dir/public/images"
ln -s "$PERSISTENCE_DIR/media" "$tmp_release_dir/public/media"
ln -s "$PERSISTENCE_DIR/images" "$tmp_release_dir/public/images"

mv "$tmp_release_dir" "$release_dir"
log "Release ready: $release_dir"

candidate_db="$release_dir/database/payload-candidate.db"
copy_sqlite_db "$prod_db" "$candidate_db"
log "Candidate database prepared."
ensure_runtime_schema "$release_dir" "file:$candidate_db"

candidate_pid=""
rollback_pid=""
cleanup_candidate() {
  local candidate_cleanup_pids
  candidate_cleanup_pids="$(printf '%s\n%s\n' "${candidate_pid:-}" "$(find_port_pids "$CANDIDATE_PORT")" | awk 'NF' | sort -u)"
  stop_pids "$candidate_cleanup_pids" "$STOP_TIMEOUT_SECONDS"
}
trap cleanup_candidate EXIT

log "Starting candidate on 127.0.0.1:$CANDIDATE_PORT"
candidate_pid="$(start_next_server "$release_dir" "$CANDIDATE_PORT" "127.0.0.1" "file:$candidate_db" "$candidate_log" "$candidate_pid_file")"
log "candidate_pid=$candidate_pid"
wait_for_ready "$CANDIDATE_PORT" "$candidate_pid" "$candidate_log" "$STARTUP_TIMEOUT_SECONDS" \
  "$release_dir" \
  || die "Candidate did not become ready."
check_local_http "$CANDIDATE_PORT" "candidate" \
  || die "Candidate HTTP validation failed."

log "Candidate resource snapshot:"
ps -o pid,ppid,rss,vsz,pcpu,pmem,etime,comm -p "$candidate_pid" || true
df -h "$PROJECT_DIR" || true
if command -v free >/dev/null 2>&1; then
  free -h || true
fi

if [ "$candidate_only" = "1" ]; then
  log "Candidate validation complete. No live traffic was switched."
  exit 0
fi

old_pids="$(find_port_pids "$ACTIVE_PORT")"
old_release=""
if [ -n "$old_pids" ]; then
  first_old_pid="$(echo "$old_pids" | awk 'NR == 1 { print }')"
  old_release="$(readlink -f "/proc/$first_old_pid/cwd" 2>/dev/null || true)"
  log "Current live pid(s): $(echo "$old_pids" | tr '\n' ' ') cwd=$old_release"
fi

if [ -n "$old_release" ] && [ -f "$old_release/server.js" ]; then
  printf '%s\n' "$old_release" >"$STATE_DIR/previous-release"
else
  if [ -n "$old_pids" ] && [ "${ALLOW_UNMANAGED_ACTIVE_REPLACE:-0}" != "1" ]; then
    ps -fp $old_pids || true
    die "Active port $ACTIVE_PORT is occupied by a process that is not a restartable release. Refusing to replace it without fallback."
  fi
  log "No active release detected on port $ACTIVE_PORT. This will be treated as an initial deploy."
fi

SYSTEMD_WEB_SERVICE="${SYSTEMD_WEB_SERVICE:-shenleng-web.service}"
use_systemd_live=0
if can_manage_systemd_unit "$SYSTEMD_WEB_SERVICE"; then
  use_systemd_live=1
  log "Systemd live service detected: $SYSTEMD_WEB_SERVICE"
fi

ensure_runtime_schema "$release_dir" "file:$prod_db"

log "Promoting $release_id to live port $ACTIVE_PORT"

set +e
if [ "$use_systemd_live" = "1" ]; then
  systemctl_run stop "$SYSTEMD_WEB_SERVICE"
  stop_pids "$(find_port_pids "$ACTIVE_PORT")" "$STOP_TIMEOUT_SECONDS"
  update_current_symlink "$release_dir"
  systemctl_run start "$SYSTEMD_WEB_SERVICE"
  new_live_pid="$(systemctl show -p MainPID --value "$SYSTEMD_WEB_SERVICE" 2>/dev/null || true)"
  log "systemd_live_pid=$new_live_pid"
else
  stop_pids "$old_pids" "$STOP_TIMEOUT_SECONDS"
  remaining_active_pids="$(find_port_pids "$ACTIVE_PORT")"
  if [ -n "$remaining_active_pids" ]; then
    ps -fp $remaining_active_pids || true
    die "Active port $ACTIVE_PORT is still occupied after stopping previous live process."
  fi

  new_live_pid="$(start_next_server "$release_dir" "$ACTIVE_PORT" "0.0.0.0" "file:$prod_db" "$live_log" "$live_pid_file")"
  log "live_pid=$new_live_pid"
fi

wait_for_ready "$ACTIVE_PORT" "$new_live_pid" "$live_log" "$STARTUP_TIMEOUT_SECONDS" "$release_dir"
ready_status=$?
if [ "$ready_status" -eq 0 ]; then
  check_local_http "$ACTIVE_PORT" "live"
  ready_status=$?
fi
if [ "$ready_status" -eq 0 ]; then
  check_public_http "post-promote" "/" && check_public_http "post-promote" "/articles"
  ready_status=$?
fi
set -e

if [ "$ready_status" -ne 0 ]; then
  log "Promotion failed. Rolling back."
  if [ "$use_systemd_live" = "1" ]; then
    systemctl_run stop "$SYSTEMD_WEB_SERVICE"
  else
    stop_pids "$new_live_pid" "$STOP_TIMEOUT_SECONDS"
  fi
  stop_pids "$(find_port_pids "$ACTIVE_PORT")" "$STOP_TIMEOUT_SECONDS"

  if [ -n "$old_release" ] && [ -f "$old_release/server.js" ]; then
    if [ "$use_systemd_live" = "1" ]; then
      update_current_symlink "$old_release"
      systemctl_run start "$SYSTEMD_WEB_SERVICE"
      rollback_pid="$(systemctl show -p MainPID --value "$SYSTEMD_WEB_SERVICE" 2>/dev/null || true)"
      rollback_log="$live_log"
    else
      rollback_log="$LOG_DIR/rollback-$(date +%Y%m%d%H%M%S).log"
      rollback_pid="$(start_next_server "$old_release" "$ACTIVE_PORT" "0.0.0.0" "file:$prod_db" "$rollback_log" "$live_pid_file")"
    fi
    log "rollback_pid=$rollback_pid"
    wait_for_ready "$ACTIVE_PORT" "$rollback_pid" "$rollback_log" "$STARTUP_TIMEOUT_SECONDS" "$old_release" \
      || die "Rollback process did not become ready."
    check_local_http "$ACTIVE_PORT" "rollback" \
      || die "Rollback HTTP validation failed."
    check_public_http "rollback" "/" || true
  fi

  exit 1
fi

update_current_symlink "$release_dir"
printf '%s\n' "$release_dir" >"$STATE_DIR/current-release"
find_port_pids "$ACTIVE_PORT" >"$STATE_DIR/live.pid"
rm -f "$candidate_db"
cleanup_candidate
candidate_pid=""

cleanup_old_releases "$KEEP_RELEASES"

log "Deploy complete: $release_id"
