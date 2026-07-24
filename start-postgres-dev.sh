#!/bin/bash
# Dev server keepalive with explicit Postgres DATABASE_URL
# Ensures the env var is always correct regardless of shell inheritance.

export DATABASE_URL="postgresql://neondb_owner:npg_u06rdIGapCcL@ep-calm-night-apefp276-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export RESEND_API_KEY="re_jXNLgzGB_Ep9E4iba3FfPrY1qmGzukFtn"
export EMAIL_FROM="Infinity Legal SA <onboarding@resend.dev>"

cd /home/z/my-project

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
