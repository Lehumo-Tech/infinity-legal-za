#!/bin/bash
# Dev server keepalive with Postgres DATABASE_URL loaded from .env.
# Ensures the env var is always correct regardless of shell inheritance.
#
# Secrets are loaded from .env (gitignored) — never hardcode credentials here.

cd /home/z/my-project

# Load all environment variables from .env (gitignored, holds secrets)
set -a
# shellcheck disable=SC1091
source .env
set +a

LOG_FILE="/home/z/my-project/dev.log"
PID_FILE="/home/z/my-project/dev.pid"

# Kill any existing dev server
pkill -9 -f "next dev" 2>/dev/null
sleep 2

while true; do
  echo "[$(date)] Starting dev server (Postgres)..." >> "$LOG_FILE"
  bun run dev >> "$LOG_FILE" 2>&1 &
  DEV_PID=$!
  echo $DEV_PID > "$PID_FILE"
  wait $DEV_PID
  EXIT_CODE=$?
  echo "[$(date)] Server exited (code $EXIT_CODE), restarting in 3s..." >> "$LOG_FILE"
  sleep 3
done
