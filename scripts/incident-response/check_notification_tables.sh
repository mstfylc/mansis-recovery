#!/usr/bin/env bash
set -euo pipefail

docker exec -i mansis-db psql -U postgres -d mansis -P pager=off <<'SQL'
\dt *Fcm*
\dt *Notification*
select count(*) as fcm_token_count from "FcmToken";
select status, count(*) from "NotificationCampaign" group by status order by status;
SQL
