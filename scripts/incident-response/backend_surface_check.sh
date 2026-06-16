#!/usr/bin/env bash
set -euo pipefail

echo "--- iptables input ---"
iptables -S INPUT | sed -n '1,160p'

echo "--- listening ports ---"
ss -ltnp | sed -n '1,120p'

echo "--- pm2 ---"
pm2 list || true

echo "--- 3005 references ---"
grep -R "3005" -n /etc/nginx /root 2>/dev/null | head -80 || true
