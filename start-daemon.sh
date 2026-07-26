#!/bin/bash
# Daemon wrapper for Next.js dev server with proper logging.
# Started via start-stop-daemon --background / double-fork for true process detachment.
#
# Secrets are loaded from .env (gitignored) — never hardcode credentials here.

cd /home/z/my-project

# Load all environment variables from .env (gitignored, holds secrets)
set -a
# shellcheck disable=SC1091
source .env
set +a

# Non-secret runtime config
export NODE_OPTIONS="--max-old-space-size=2048"
export NODE_ENV=development

# Self-healing loop: if next dev crashes, restart within 3s
while true; do
  echo "[$(date)] Starting next dev (Neon Postgres, heap=2048MB)..." >> /home/z/my-project/dev.log
  node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  EXIT=$?
  echo "[$(date)] next dev exited (code $EXIT), restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
