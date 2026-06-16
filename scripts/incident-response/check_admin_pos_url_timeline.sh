#!/usr/bin/env bash
set -euo pipefail

echo "--- backups containing old POS URL ---"
while IFS= read -r f; do
  if grep -a -q 'https://pos.posanto.com/' "$f" 2>/dev/null; then
    stat -c '%y %n' "$f"
  fi
done < <(find /root/security-backups -type f 2>/dev/null | sort)

echo "--- backups containing new POS URL ---"
while IFS= read -r f; do
  if grep -a -q 'https://pos.mansis.com.tr/' "$f" 2>/dev/null; then
    stat -c '%y %n' "$f"
  fi
done < <(find /root/security-backups -type f 2>/dev/null | sort)

echo "--- current original ghcr image contains old URL? ---"
docker run --rm --entrypoint sh ghcr.io/uyanik-app/uyanik-admin@sha256:af7b85224e7fd190e759630230d5fecc2c69f5c2d1087a5f8d8a42a0a7ba2a02 -lc '
echo old_pos_count=$(grep -R "https://pos.posanto.com/" -n /usr/share/nginx/html 2>/dev/null | wc -l)
echo new_pos_count=$(grep -R "https://pos.mansis.com.tr/" -n /usr/share/nginx/html 2>/dev/null | wc -l)
' 2>/dev/null || true
