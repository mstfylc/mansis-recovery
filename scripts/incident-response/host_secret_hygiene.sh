#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

if [ -d /root/security-backups ]; then
  chmod 700 /root/security-backups
  find /root/security-backups -type d -exec chmod 700 {} +
  find /root/security-backups -type f -exec chmod 600 {} +
fi

RETIRE_DIR="/root/security-backups/retired-ssh-keys-$STAMP"
mkdir -p "$RETIRE_DIR"
chmod 700 "$RETIRE_DIR"

for key in /root/.ssh/deploy /root/.ssh/deploy.pub /root/.ssh/uyanik-admin-deploy /root/.ssh/uyanik-admin-deploy.pub; do
  if [ -e "$key" ]; then
    mv "$key" "$RETIRE_DIR/"
  fi
done

chmod -R go-rwx "$RETIRE_DIR"

echo "--- retired keys dir ---"
find "$RETIRE_DIR" -maxdepth 1 -type f -printf '%f\n' | sort || true

echo "--- security backup permissions ---"
ls -ld /root/security-backups "$RETIRE_DIR"

echo "--- ssh dir after cleanup ---"
ls -la /root/.ssh
