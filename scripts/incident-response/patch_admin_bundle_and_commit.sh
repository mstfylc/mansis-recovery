#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BKP_DIR="/root/security-backups/${STAMP}-admin-bundle-pos-link"
mkdir -p "$BKP_DIR"
chmod 700 "$BKP_DIR"

JS_FILE="$(docker exec mansis-admin sh -lc 'grep -R -l "https://pos.posanto.com/" /usr/share/nginx/html/assets/*.js | head -1')"
if [ -z "$JS_FILE" ]; then
  echo "POS target not found in admin bundle" >&2
  exit 1
fi

docker cp "mansis-admin:${JS_FILE}" "$BKP_DIR/$(basename "$JS_FILE").before"

docker exec mansis-admin sh -lc '
set -e
for f in /usr/share/nginx/html/assets/*.js; do
  sed -i \
    -e "s#https://pos.posanto.com/#https://pos.mansis.com.tr/#g" \
    -e "s#https://<SENTRY_DSN>##g" \
    "$f"
done
rm -f /usr/share/nginx/html/assets/*.map
'

echo "--- patched refs in running container ---"
docker exec mansis-admin sh -lc '
echo "old_pos_count=$(grep -R "https://pos.posanto.com/" -n /usr/share/nginx/html 2>/dev/null | wc -l)"
echo "new_pos_count=$(grep -R "https://pos.mansis.com.tr/" -n /usr/share/nginx/html 2>/dev/null | wc -l)"
echo "sentry_count=$(grep -R "ingest.de.sentry.io" -n /usr/share/nginx/html 2>/dev/null | wc -l)"
'

LOCAL_IMAGE="mansis-admin-local:pos-link-fixed-${STAMP}"
docker commit mansis-admin "$LOCAL_IMAGE" >/tmp/mansis-admin-local-image-id
LOCAL_IMAGE_ID="$(cat /tmp/mansis-admin-local-image-id)"

cd /root/mansis-admin
cp -a docker-compose.prod.yaml "$BKP_DIR/docker-compose.prod.yaml.before-local-image"
python3 - "$LOCAL_IMAGE" <<'PY'
import re
import sys
from pathlib import Path

image = sys.argv[1]
p = Path("docker-compose.prod.yaml")
text = p.read_text()
text = re.sub(r"image:\s+\S+", f"image: {image}", text, count=1)
p.write_text(text)
PY

docker compose -f docker-compose.prod.yaml up -d --force-recreate mansis-admin
sleep 35

echo "--- post-recreate refs ---"
docker exec mansis-admin sh -lc '
echo "old_pos_count=$(grep -R "https://pos.posanto.com/" -n /usr/share/nginx/html 2>/dev/null | wc -l)"
echo "new_pos_count=$(grep -R "https://pos.mansis.com.tr/" -n /usr/share/nginx/html 2>/dev/null | wc -l)"
echo "sentry_count=$(grep -R "ingest.de.sentry.io" -n /usr/share/nginx/html 2>/dev/null | wc -l)"
'

docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}' | grep mansis-admin
docker inspect mansis-admin --format 'admin_health={{.State.Health.Status}} failing={{.State.Health.FailingStreak}} image={{.Config.Image}}'

echo "local_image=$LOCAL_IMAGE"
echo "local_image_id=$LOCAL_IMAGE_ID"
echo "backup=$BKP_DIR"
