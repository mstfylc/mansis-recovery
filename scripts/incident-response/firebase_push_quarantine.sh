#!/usr/bin/env bash
set -euo pipefail

cd /root/mansis-backend

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BKP_DIR="/root/security-backups/firebase-push-quarantine-$STAMP"
mkdir -p "$BKP_DIR"
cp -a .env "$BKP_DIR/.env.before"

python3 - <<'PY'
from pathlib import Path

p = Path(".env")
keys = {"FIREBASE_SERVICE_ACCOUNT_JSON", "FIREBASE_SA_POSANTO", "FIREBASE_SA_UYANIK"}
lines = p.read_text().splitlines()
out = []
changed = []

for line in lines:
    if "=" in line and not line.lstrip().startswith("#"):
        key = line.split("=", 1)[0].strip()
        if key in keys:
            out.append(f"{key}=")
            changed.append(key)
            continue
    out.append(line)

p.write_text("\n".join(out) + "\n")
print("disabled_keys=" + ",".join(changed))
PY

echo "--- firebase env keys after quarantine ---"
grep -nE '^(FIREBASE_|FCM|GOOGLE_APPLICATION_CREDENTIALS)' .env | sed 's/=.*$/=<redacted-or-empty>/' || true

docker compose up -d --force-recreate backend
sleep 8

echo "--- containers ---"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'mansis-backend|mansis-db|mansis-redis' || true

echo "--- backend health ---"
curl -fsS --max-time 10 http://127.0.0.1:3001/application-version || curl -fsS --max-time 10 http://127.0.0.1:3001 || true
echo

echo "--- firebase logs ---"
docker logs --since 2m mansis-backend 2>&1 | grep -Ei 'firebase|notification sending|credentials' | tail -40 || true

echo "backup=$BKP_DIR"
