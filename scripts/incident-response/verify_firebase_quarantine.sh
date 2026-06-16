#!/usr/bin/env bash
set -euo pipefail

echo "--- container firebase env ---"
docker exec mansis-backend sh -lc 'env | grep -E "^FIREBASE_" | sed "s/=.*$/=<redacted-or-empty>/" || true'

echo "--- backend firebase logs ---"
docker logs --since 5m mansis-backend 2>&1 | grep -Ei 'firebase|notification sending|credentials' | tail -80 || true

echo "--- db counts ---"
docker exec mansis-db psql -U postgres -d mansis -P pager=off <<'SQL'
select count(*) as fcm_token_count from "FcmToken";
select status, count(*) from "NotificationCampaign" group by status order by status;
SQL

echo "--- local health ---"
curl -fsS --max-time 10 http://127.0.0.1:3001/application-version
echo

echo "--- socket polling ---"
curl -i --max-time 10 'http://127.0.0.1:3001/socket.io/?EIO=4&transport=polling' | head -20 || true
