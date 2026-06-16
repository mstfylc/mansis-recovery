#!/usr/bin/env bash
set -euo pipefail

cd /root/mansis-admin

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BKP="/root/security-backups/${STAMP}-mansis-admin-pin-image.before"
cp -a docker-compose.prod.yaml "$BKP"

IMAGE_ID="$(docker inspect mansis-admin --format '{{.Image}}')"
DIGEST="$(docker image inspect "$IMAGE_ID" --format '{{range .RepoDigests}}{{println .}}{{end}}' | grep '^ghcr.io/uyanik-app/uyanik-admin@sha256:' | head -1)"

if [ -z "$DIGEST" ]; then
  echo "No ghcr digest found for running admin image" >&2
  docker image inspect "$IMAGE_ID" --format 'repoTags={{json .RepoTags}} repoDigests={{json .RepoDigests}} id={{.Id}} created={{.Created}}'
  exit 1
fi

python3 - "$DIGEST" <<'PY'
import sys
from pathlib import Path

digest = sys.argv[1]
p = Path("docker-compose.prod.yaml")
text = p.read_text()
old = "image: ghcr.io/uyanik-app/uyanik-admin:latest"
new = f"image: {digest}"
if old not in text and digest not in text:
    raise SystemExit("expected latest image line not found")
if digest not in text:
    text = text.replace(old, new)
p.write_text(text)
PY

docker compose -f docker-compose.prod.yaml config >/tmp/mansis-admin-compose-pinned.config

echo "--- pinned image ---"
grep -n 'image:' docker-compose.prod.yaml
echo "--- running image ---"
docker image inspect "$IMAGE_ID" --format 'repoTags={{json .RepoTags}} repoDigests={{json .RepoDigests}} id={{.Id}} created={{.Created}}'
echo "--- docker auth ghcr check ---"
if [ -f /root/.docker/config.json ]; then
  grep -E 'ghcr|auth' /root/.docker/config.json || true
fi
echo "backup=$BKP"
