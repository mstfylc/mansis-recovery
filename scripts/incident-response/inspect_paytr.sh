#!/usr/bin/env bash
set -euo pipefail

cd /root/mansis-backend

echo "--- env keys ---"
grep -nEi 'PAYTR|MERCHANT|PAYMENT' .env | sed 's/=.*$/=<redacted>/' || true

echo "--- code refs ---"
docker exec mansis-backend sh -lc 'grep -R -n -i -E "paytr|merchant_key|merchant_salt|merchant_id|PAYTR" /usr/src/app/dist/src 2>/dev/null | head -160' || true
