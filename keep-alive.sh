#!/bin/bash
# Infinity Legal ZA - Keep-Alive Script
# Auto-restarts the Next.js dev server if it crashes
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=512" node node_modules/.bin/next dev -p 3000 2>&1
  echo "[$(date)] Server crashed, restarting in 3s..." >> /home/z/my-project/crash.log
  sleep 3
done
