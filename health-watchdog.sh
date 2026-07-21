#!/bin/bash
# Health-check + restart watchdog. Runs via cron every 2 minutes.
# If the dev server is not responding, relaunch the self-healing start-sandbox.sh.
cd /home/z/my-project
code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health --max-time 10 2>/dev/null)
if [ "$code" != "200" ]; then
  echo "[$(date)] server down (HTTP $code), restarting watchdog..." >> keepalive.log
  # Check if watchdog is already running
  if ! pgrep -f "start-sandbox.sh" >/dev/null 2>&1; then
    setsid bash start-sandbox.sh </dev/null >/dev/null 2>&1 &
    disown
    echo "[$(date)] watchdog relaunched" >> keepalive.log
  fi
else
  echo "[$(date)] server healthy (HTTP $code)" >> keepalive.log
fi
