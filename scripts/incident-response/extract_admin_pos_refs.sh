#!/usr/bin/env bash
set -euo pipefail

docker exec mansis-admin sh -lc '
for f in /usr/share/nginx/html/assets/*.js; do
  echo "FILE:$f"
  grep -aoE "https?://[^\"'\'' )]+|window\\.location[^,;)]*|location\\.href[^,;)]*|window\\.open[^)]*|open\\([^)]*|/pos[^\"'\'' )]*|uyanikpos[^\"'\'' )]*|pos\\.mansis[^\"'\'' )]*" "$f" | sort -u | head -200 || true
done
'
