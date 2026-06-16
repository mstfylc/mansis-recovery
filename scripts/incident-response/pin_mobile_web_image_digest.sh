#!/usr/bin/env bash
set -euo pipefail

cd /root/mansis-mobile-web

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BKP="/root/security-backups/${STAMP}-uyanik-mobile-web-pin-image.before"
cp -a docker-compose.prod.yaml "$BKP"

IMAGE_ID="$(docker inspect uyanik-mobile-web --format '{{.Image}}')"
DIGEST="$(docker image inspect "$IMAGE_ID" --format '{{range .RepoDigests}}{{println .}}{{end}}' | grep '^ghcr.io/uyanik-app/uyanik-mobile-web@sha256:' | head -1)"

if [ -z "$DIGEST" ]; then
  echo "No ghcr digest found for running mobile web image" >&2
  docker image inspect "$IMAGE_ID" --format 'repoTags={{json .RepoTags}} repoDigests={{json .RepoDigests}} id={{.Id}} created={{.Created}}'
  exit 1
fi

python3 - "$DIGEST" <<'PY'
import sys
from pathlib import Path

digest = sys.argv[1]
p = Path("docker-compose.prod.yaml")
text = p.read_text()
old = "image: ghcr.io/uyanik-app/uyanik-mobile-web:latest"
new = f"image: {digest}"
if old not in text and digest not in text:
    raise SystemExit("expected latest image line not found")
if digest not in text:
    text = text.replace(old, new)
p.write_text(text)
PY

docker compose -f docker-compose.prod.yaml config >/tmp/uyanik-mobile-web-compose-pinned.config

echo "--- pinned image ---"
grep -n 'image:' docker-compose.prod.yaml
echo "--- running image ---"
docker image inspect "$IMAGE_ID" --format 'repoTags={{json .RepoTags}} repoDigests={{json .RepoDigests}} id={{.Id}} created={{.Created}}'
echo "backup=$BKP"
