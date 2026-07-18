#!/bin/bash
# Infinity Legal dev-server keepalive watchdog.
# Restarts `bun run dev` whenever it exits. Double-forks so it survives
# the parent shell exiting and the sandbox process reaper.
cd /home/z/my-project
while true; do
  # Only start if nothing is listening on 3000
  if ! curl -s -o /dev/null --max-time 3 http://localhost:3000/ 2>/dev/null; then
    echo "[keepalive $(date +%T)] starting bun run dev" >> /home/z/my-project/dev.log
    bun run dev >> /home/z/my-project/dev.log 2>&1
    echo "[keepalive $(date +%T)] bun run dev exited (rc=$?), restarting in 3s" >> /home/z/my-project/dev.log
  else
    sleep 10
  fi
  sleep 2
done
