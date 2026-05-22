#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=512" node node_modules/.bin/next dev -p 3000 --webpack 2>>/home/z/my-project/dev.log
  echo "[$(date)] Server exited with code $?, restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
