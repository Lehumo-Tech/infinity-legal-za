#!/bin/bash
# Dev server keepalive script - restarts the server if it dies
cd /home/z/my-project

LOG_FILE="/home/z/my-project/dev.log"
PID_FILE="/home/z/my-project/dev.pid"

# Kill any existing dev server
pkill -9 -f "next dev" 2>/dev/null
sleep 2

while true; do
  echo "[$(date)] Starting dev server..." >> "$LOG_FILE"
  node ./node_modules/.bin/next dev -p 3000 --webpack >> "$LOG_FILE" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> "$LOG_FILE"
  sleep 3
done
