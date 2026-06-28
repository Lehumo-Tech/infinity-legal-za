#!/bin/bash
# Check if dev server is running, restart if not
if ! pgrep -f "next dev" > /dev/null 2>&1; then
  echo "[$(date)] Dev server is down, restarting..." >> /home/z/my-project/dev.log
  cd /home/z/my-project
  pkill -9 -f "next" 2>/dev/null
  sleep 2
  nohup node ./node_modules/.bin/next dev -p 3000 --webpack >> /home/z/my-project/dev.log 2>&1 &
  disown
  echo "[$(date)] Dev server restarted" >> /home/z/my-project/dev.log
fi
