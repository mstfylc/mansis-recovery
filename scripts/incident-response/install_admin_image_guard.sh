#!/usr/bin/env bash
set -euo pipefail

cat >/usr/local/sbin/mansis-admin-image-guard.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail

LOG=/var/log/mansis-security/admin-image-guard.log
EXPECTED_IMAGE="mansis-admin-local:pos-link-fixed-20260615T100712Z"
COMPOSE_DIR="/root/mansis-admin"
COMPOSE_FILE="docker-compose.prod.yaml"

mkdir -p "$(dirname "$LOG")"

current_image="$(docker inspect mansis-admin --format '{{.Config.Image}}' 2>/dev/null || true)"
if [ "$current_image" != "$EXPECTED_IMAGE" ]; then
  echo "$(date -u +%FT%TZ) unexpected-admin-image current=${current_image:-missing} expected=$EXPECTED_IMAGE" >> "$LOG"
  cd "$COMPOSE_DIR"
  docker compose -f "$COMPOSE_FILE" up -d mansis-admin >> "$LOG" 2>&1 || true
fi

old_pos_count="$(docker exec mansis-admin sh -lc 'grep -R "https://pos.posanto.com/" -n /usr/share/nginx/html 2>/dev/null | wc -l' 2>/dev/null || echo 0)"
sentry_count="$(docker exec mansis-admin sh -lc 'grep -R "ingest.de.sentry.io" -n /usr/share/nginx/html 2>/dev/null | wc -l' 2>/dev/null || echo 0)"

if [ "${old_pos_count:-0}" != "0" ] || [ "${sentry_count:-0}" != "0" ]; then
  echo "$(date -u +%FT%TZ) unexpected-admin-bundle old_pos=$old_pos_count sentry=$sentry_count" >> "$LOG"
  cd "$COMPOSE_DIR"
  docker compose -f "$COMPOSE_FILE" up -d --force-recreate mansis-admin >> "$LOG" 2>&1 || true
fi
SH

chmod 700 /usr/local/sbin/mansis-admin-image-guard.sh

cat >/etc/systemd/system/mansis-admin-image-guard.service <<'UNIT'
[Unit]
Description=Mansis admin image and bundle guard
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/mansis-admin-image-guard.sh
UNIT

cat >/etc/systemd/system/mansis-admin-image-guard.timer <<'UNIT'
[Unit]
Description=Run Mansis admin image guard every minute

[Timer]
OnBootSec=60
OnUnitActiveSec=60
AccuracySec=10
Unit=mansis-admin-image-guard.service

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable --now mansis-admin-image-guard.timer
systemctl start mansis-admin-image-guard.service

systemctl is-active mansis-admin-image-guard.timer
tail -20 /var/log/mansis-security/admin-image-guard.log 2>/dev/null || true
