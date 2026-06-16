#!/usr/bin/env bash
set -euo pipefail

SITE="/etc/nginx/sites-enabled/admin.mansis.com.tr"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BKP="/root/security-backups/${STAMP}-admin-pos-redirect.before"

cp -a "$SITE" "$BKP"

python3 - <<'PY'
from pathlib import Path

site = Path("/etc/nginx/sites-enabled/admin.mansis.com.tr")
text = site.read_text()

block = """\
    # Route the POS section on admin.mansis.com.tr to the dedicated POS domain.
    location = /pos {
        return 302 https://pos.mansis.com.tr/;
    }

    location ^~ /pos/ {
        rewrite ^/pos/?(.*)$ https://pos.mansis.com.tr/$1 redirect;
    }

"""

if "location = /pos" not in text:
    marker = "    include /etc/nginx/snippets/mansis_deny_sensitive.conf;\n"
    if marker not in text:
        raise SystemExit("marker not found")
    text = text.replace(marker, marker + block, 1)
    site.write_text(text)
PY

nginx -t
systemctl reload nginx

echo "--- redirect checks ---"
curl -I --max-time 10 https://admin.mansis.com.tr/pos
curl -I --max-time 10 https://admin.mansis.com.tr/pos/
curl -I --max-time 10 https://admin.mansis.com.tr/pos/orders?x=1
echo "backup=$BKP"
