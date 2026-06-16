#!/usr/bin/env bash
set -euo pipefail

echo "--- likely POS refs in admin bundle ---"
docker exec mansis-admin sh -lc 'grep -R -n -i -E "pos\\.mansis|uyanikpos|/pos|POS|pos" /usr/share/nginx/html 2>/dev/null | head -120' || true

echo "--- html files ---"
docker exec mansis-admin sh -lc 'find /usr/share/nginx/html -maxdepth 3 -type f | sed -n "1,120p"'
