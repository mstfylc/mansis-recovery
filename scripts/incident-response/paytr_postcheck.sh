#!/usr/bin/env bash
set -euo pipefail

echo "--- payment service sensitive snippets ---"
docker exec mansis-backend sh -lc 'sed -n "40,125p" /usr/src/app/dist/src/payment/payment.service.js; sed -n "210,235p" /usr/src/app/dist/src/payment/payment.service.js' | \
  sed -E 's/(merchant_key|merchant_salt|MERCHANT_KEY|MERCHANT_SALT)([^A-Za-z0-9_]|$)/\1\2/g'

echo "--- containers ---"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E 'mansis-backend|mansis-db|mansis-redis'
