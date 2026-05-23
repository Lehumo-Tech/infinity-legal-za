#!/bin/bash
cd /home/z/my-project
while true; do
  node node_modules/.bin/next dev -p 3000 2>&1
  echo "[RestartLoop] Next.js exited, restarting in 1s..."
  sleep 1
done
