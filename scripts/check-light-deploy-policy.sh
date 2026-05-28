#!/usr/bin/env bash
set -euo pipefail

workflow="${1:-.github/workflows/deploy.yml}"

if [ ! -f "$workflow" ]; then
  echo "Missing workflow: $workflow" >&2
  exit 1
fi

required_patterns=(
  "scripts/deploy-web-light.sh"
  "--yes"
  "--candidate-only"
)

for pattern in "${required_patterns[@]}"; do
  if ! grep -Fq -- "$pattern" "$workflow"; then
    echo "Light deploy policy failed: required pattern not found: $pattern" >&2
    exit 1
  fi
done

forbidden_patterns=(
  "docker/setup-buildx-action"
  "docker/build-push-action"
  "docker compose up"
  "docker-compose up"
  "docker pull"
  "docker image prune"
  "docker system prune"
  "docker container prune"
  "docker restart"
  "docker rm"
  "reboot"
  "shutdown"
)

failed=0
for pattern in "${forbidden_patterns[@]}"; do
  if grep -Fn -- "$pattern" "$workflow"; then
    echo "Light deploy policy failed: forbidden production operation found: $pattern" >&2
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "Light deploy policy check passed for $workflow"
