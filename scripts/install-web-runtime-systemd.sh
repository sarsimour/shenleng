#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
Install Shenleng frontend runtime systemd units.

Usage:
  scripts/install-web-runtime-systemd.sh [options]

Options:
  --project-dir PATH   Project directory on the server.
                       Default: /home/ecs-user/Projects/shenleng
  --user USER          Runtime user. Default: ecs-user
  --node-bin PATH      Node binary path. Default: command -v node
  --public-url URL     Public site URL. Default: https://shenleng.roinland.com

This installs:
  /etc/systemd/system/shenleng-web.service
  /etc/systemd/system/shenleng-web-watchdog.service
  /etc/systemd/system/shenleng-web-watchdog.timer
  $PROJECT_DIR/scripts/shenleng-web-watchdog.sh

It does not reboot the server, build the app, install dependencies, or pull images.
EOF
}

project_dir="/home/ecs-user/Projects/shenleng"
run_user="ecs-user"
node_bin="$(command -v node || true)"
public_url="https://shenleng.roinland.com"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --project-dir)
      project_dir="${2:-}"
      shift 2
      ;;
    --user)
      run_user="${2:-}"
      shift 2
      ;;
    --node-bin)
      node_bin="${2:-}"
      shift 2
      ;;
    --public-url)
      public_url="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

[ -n "$project_dir" ] || { echo "--project-dir is required" >&2; exit 1; }
[ -n "$run_user" ] || { echo "--user is required" >&2; exit 1; }
[ -n "$node_bin" ] || { echo "node binary not found; pass --node-bin" >&2; exit 1; }
[ -x "$node_bin" ] || { echo "node binary is not executable: $node_bin" >&2; exit 1; }
[ -d "$project_dir" ] || { echo "project directory not found: $project_dir" >&2; exit 1; }
[ -f "$project_dir/.env" ] || { echo "runtime env not found: $project_dir/.env" >&2; exit 1; }
[ -s "$project_dir/persistence/sqlite/payload.db" ] || { echo "payload db not found: $project_dir/persistence/sqlite/payload.db" >&2; exit 1; }

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -e "$project_dir/current-web" ] && [ -s "$project_dir/state/web-deploy/current-release" ]; then
  current_release="$(cat "$project_dir/state/web-deploy/current-release")"
  [ -f "$current_release/server.js" ] || { echo "current release has no server.js: $current_release" >&2; exit 1; }
  ln -sfn "$current_release" "$project_dir/current-web"
fi

[ -f "$project_dir/current-web/server.js" ] || { echo "current-web/server.js not found; deploy one release first" >&2; exit 1; }

sudo install -d -m 0755 "$project_dir/scripts"
sudo install -m 0755 "$repo_dir/scripts/shenleng-web-watchdog.sh" "$project_dir/scripts/shenleng-web-watchdog.sh"

escape_sed() {
  printf '%s' "$1" | sed 's/[&/\]/\\&/g'
}

project_escaped="$(escape_sed "$project_dir")"
user_escaped="$(escape_sed "$run_user")"
node_escaped="$(escape_sed "$node_bin")"
public_escaped="$(escape_sed "$public_url")"

render_template() {
  local source="$1"
  sed \
    -e "s/{{PROJECT_DIR}}/$project_escaped/g" \
    -e "s/{{RUN_USER}}/$user_escaped/g" \
    -e "s/{{NODE_BIN}}/$node_escaped/g" \
    -e "s/{{PUBLIC_URL}}/$public_escaped/g" \
    "$source"
}

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

render_template "$repo_dir/systemd/shenleng-web.service.template" >"$tmp_dir/shenleng-web.service"
render_template "$repo_dir/systemd/shenleng-web-watchdog.service.template" >"$tmp_dir/shenleng-web-watchdog.service"
cp "$repo_dir/systemd/shenleng-web-watchdog.timer" "$tmp_dir/shenleng-web-watchdog.timer"

sudo install -m 0644 "$tmp_dir/shenleng-web.service" /etc/systemd/system/shenleng-web.service
sudo install -m 0644 "$tmp_dir/shenleng-web-watchdog.service" /etc/systemd/system/shenleng-web-watchdog.service
sudo install -m 0644 "$tmp_dir/shenleng-web-watchdog.timer" /etc/systemd/system/shenleng-web-watchdog.timer

sudo systemctl daemon-reload
sudo systemctl enable shenleng-web.service shenleng-web-watchdog.timer >/dev/null
sudo systemctl enable ssh.service cloudflared.service aliyun.service nginx.service docker.service >/dev/null 2>&1 || true
sudo systemctl restart shenleng-web.service
sudo systemctl start shenleng-web-watchdog.timer

curl -fsS --max-time 8 http://127.0.0.1:3000/ >/dev/null
systemctl is-active shenleng-web.service shenleng-web-watchdog.timer

echo "Installed Shenleng web runtime units for $project_dir"
