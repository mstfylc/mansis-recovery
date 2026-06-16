#!/usr/bin/env bash
set -euo pipefail

echo "--- iptables input ---"
iptables -S INPUT | sed -n '1,180p'

echo "--- listening ports ---"
ss -ltnp | sed -n '1,120p'

echo "--- nginx refs ---"
grep -R -E "8082|uyanik-mobile|server_name" -n /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null | head -160 || true

echo "--- docker inspect uyanik-mobile-web ---"
docker inspect uyanik-mobile-web --format 'ports={{json .HostConfig.PortBindings}} labels={{json .Config.Labels}} health={{json .State.Health}}' 2>/dev/null || true
