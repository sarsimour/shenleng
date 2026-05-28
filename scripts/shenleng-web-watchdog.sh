#!/usr/bin/env bash
set -Eeuo pipefail

PUBLIC_URL="${PUBLIC_URL:-https://shenleng.roinland.com}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3000/}"
WEB_SERVICE="${WEB_SERVICE:-shenleng-web.service}"
CLOUDFLARED_SERVICE="${CLOUDFLARED_SERVICE:-cloudflared.service}"
ALIYUN_SERVICE="${ALIYUN_SERVICE:-aliyun.service}"
STATE_DIR="${STATE_DIR:-/run/shenleng-watchdog}"

mkdir -p "$STATE_DIR"

log() {
  logger -t shenleng-watchdog "$*"
  printf '[shenleng-watchdog] %s\n' "$*"
}

recently_restarted() {
  local name="$1"
  local min_interval="$2"
  local stamp="$STATE_DIR/$name.last"
  local now last
  now="$(date +%s)"
  last=0
  [ -f "$stamp" ] && last="$(cat "$stamp" 2>/dev/null || printf '0')"
  [ $((now - last)) -lt "$min_interval" ]
}

mark_restarted() {
  date +%s >"$STATE_DIR/$1.last"
}

ssh_banner_ok() {
  if ! command -v timeout >/dev/null 2>&1; then
    return 0
  fi

  timeout 6 bash -c '
    exec 3<>/dev/tcp/127.0.0.1/22
    IFS= read -r -t 3 banner <&3
    [[ "$banner" == SSH-* ]]
  ' >/dev/null 2>&1
}

if pgrep -af '[d]eploy-web-light.sh' >/dev/null 2>&1; then
  log 'deploy in progress, skip watchdog cycle'
  exit 0
fi

if systemctl list-unit-files "$ALIYUN_SERVICE" >/dev/null 2>&1 \
  && ! systemctl is-active --quiet "$ALIYUN_SERVICE"; then
  log "$ALIYUN_SERVICE inactive; restarting"
  systemctl restart "$ALIYUN_SERVICE" || true
fi

if systemctl list-unit-files "$CLOUDFLARED_SERVICE" >/dev/null 2>&1 \
  && ! systemctl is-active --quiet "$CLOUDFLARED_SERVICE"; then
  log "$CLOUDFLARED_SERVICE inactive; restarting"
  systemctl restart "$CLOUDFLARED_SERVICE" || true
fi

if ! systemctl is-active --quiet ssh.service && ! systemctl is-active --quiet sshd.service; then
  log 'ssh service inactive; restarting'
  systemctl restart ssh.service 2>/dev/null || systemctl restart sshd.service 2>/dev/null || true
elif ! ssh_banner_ok; then
  if ! recently_restarted ssh 120; then
    log 'ssh service active but banner probe failed; restarting ssh'
    mark_restarted ssh
    systemctl restart ssh.service 2>/dev/null || systemctl restart sshd.service 2>/dev/null || true
  else
    log 'ssh banner probe failed but ssh was recently restarted; waiting'
  fi
fi

if ! curl -fsS --max-time 6 "$FRONTEND_URL" >/dev/null; then
  if ! recently_restarted web 60; then
    log "local frontend unhealthy; restarting $WEB_SERVICE"
    mark_restarted web
    systemctl restart "$WEB_SERVICE" || true
  else
    log 'local frontend unhealthy but recently restarted; waiting'
  fi
  exit 0
fi

public_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${PUBLIC_URL%/}/" 2>/dev/null || printf '000')"
case "$public_code" in
  200|301|302|304)
    ;;
  *)
    if ! recently_restarted cloudflared 300; then
      log "public frontend unhealthy status=$public_code while local is healthy; restarting $CLOUDFLARED_SERVICE"
      mark_restarted cloudflared
      systemctl restart "$CLOUDFLARED_SERVICE" || true
    else
      log "public frontend unhealthy status=$public_code but cloudflared recently restarted; waiting"
    fi
    ;;
esac
