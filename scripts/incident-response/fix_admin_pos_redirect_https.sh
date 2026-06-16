#!/usr/bin/env bash
set -euo pipefail

SITE="/etc/nginx/sites-enabled/admin.mansis.com.tr"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BKP="/root/security-backups/${STAMP}-admin-pos-redirect-https.before"

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

ssl_marker = "    include /etc/nginx/snippets/mansis_deny_sensitive.conf;\n"
idx = text.find(ssl_marker)
if idx == -1:
    raise SystemExit("ssl marker not found")

# If the first occurrence was in the port-80 block, use the occurrence after the 443 server starts.
ssl_start = text.find("listen 443 ssl")
idx = text.find(ssl_marker, ssl_start)
if idx == -1:
    raise SystemExit("443 marker not found")

location_root_idx = text.find("    location / {", ssl_start)
existing_https_idx = text.find("location = /pos", ssl_start, location_root_idx)

if existing_https_idx == -1:
    insert_at = idx + len(ssl_marker)
    text = text[:insert_at] + block + text[insert_at:]
    site.write_text(text)
PY

nginx -t
systemctl reload nginx

echo "--- redirect checks ---"
curl -I --max-time 10 https://admin.mansis.com.tr/pos
curl -I --max-time 10 https://admin.mansis.com.tr/pos/
curl -I --max-time 10 https://admin.mansis.com.tr/pos/orders?x=1
curl -I --max-time 10 https://admin.mansis.com.tr/
echo "backup=$BKP"
