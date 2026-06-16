#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

fix_compose() {
  local dir="$1"
  local file="$2"
  local service="$3"

  cd "$dir"
  mkdir -p "/root/security-backups/$STAMP-healthcheck"
  cp -a "$file" "/root/security-backups/$STAMP-healthcheck/$(basename "$dir")-$file.before"
  python3 - "$file" <<'PY'
import sys
from pathlib import Path

p = Path(sys.argv[1])
text = p.read_text()
text = text.replace("http://localhost:80/health", "http://127.0.0.1:80/health")
text = text.replace("http://localhost/health", "http://127.0.0.1/health")
p.write_text(text)
PY
  docker compose -f "$file" up -d --force-recreate "$service"
}

fix_compose /root/mansis-admin docker-compose.prod.yaml mansis-admin
fix_compose /root/mansis-mobile-web docker-compose.prod.yaml uyanik-mobile-web

sleep 35

docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'mansis-admin|uyanik-mobile-web'
docker inspect mansis-admin --format 'admin_health={{.State.Health.Status}} failing={{.State.Health.FailingStreak}}'
docker inspect uyanik-mobile-web --format 'mobile_health={{.State.Health.Status}} failing={{.State.Health.FailingStreak}}'
