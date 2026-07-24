#!/bin/bash
# Daemon wrapper for Next.js dev server with proper logging.
# Started via start-stop-daemon --background for true process detachment.

cd /home/z/my-project

export DATABASE_URL="postgresql://neondb_owner:npg_u06rdIGapCcL@ep-calm-night-apefp276-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export RESEND_API_KEY="re_jXNLgzGB_Ep9E4iba3FfPrY1qmGzukFtn"
export EMAIL_FROM="Infinity Legal SA <onboarding@resend.dev>"
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
