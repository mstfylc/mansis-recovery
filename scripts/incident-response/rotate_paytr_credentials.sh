#!/usr/bin/env bash
set -euo pipefail

cd /root/mansis-backend

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BKP_DIR="/root/security-backups/${STAMP}-paytr-rotation"
mkdir -p "$BKP_DIR"
chmod 700 "$BKP_DIR"
cp -a .env "$BKP_DIR/.env.before"
chmod 600 "$BKP_DIR/.env.before"

python3 - <<'PY'
from pathlib import Path

updates = {
    "MERCHANT_KEY": "<PAYTR_MERCHANT_KEY>",
    "MERCHANT_SALT": "<PAYTR_MERCHANT_SALT>",
}

p = Path(".env")
lines = p.read_text().splitlines()
seen = set()
out = []

for line in lines:
    if "=" in line and not line.lstrip().startswith("#"):
        key = line.split("=", 1)[0].strip()
        if key in updates:
            out.append(f"{key}={updates[key]}")
            seen.add(key)
            continue
    out.append(line)

for key, value in updates.items():
    if key not in seen:
        out.append(f"{key}={value}")

p.write_text("\n".join(out) + "\n")
PY

echo "--- paytr env keys after update ---"
grep -nE '^(MERCHANT_ID|MERCHANT_KEY|MERCHANT_SALT|MERCHANT_OK_URL|MERCHANT_FAIL_URL|PAYTR_)' .env | sed 's/=.*$/=<redacted>/'

docker compose -f docker-compose.prod.yml up -d --force-recreate backend
sleep 12

echo "--- backend health ---"
curl -fsS --max-time 10 http://127.0.0.1:3001/application-version
echo

echo "--- container paytr keys present ---"
docker exec mansis-backend sh -lc 'env | grep -E "^(MERCHANT_ID|MERCHANT_KEY|MERCHANT_SALT|MERCHANT_OK_URL|MERCHANT_FAIL_URL|PAYTR_)" | sed "s/=.*$/=<redacted>/"'

echo "--- recent payment/paytr logs ---"
docker logs --since 3m mansis-backend 2>&1 | grep -Ei 'paytr|payment' | tail -80 || true

echo "backup=$BKP_DIR"
