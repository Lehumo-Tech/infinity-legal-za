#!/usr/bin/env bash
# Robust dev-server watchdog: restarts `bun run dev` whenever it dies.
# Reparented to PID 1 via setsid so it survives sandbox shell reaping.
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=64"
while true; do
  echo "[keepalive $(date +%H:%M:%S)] starting bun run dev..." >> keepalive.log
  bun run dev >> dev.log 2>&1 &
  DEVPID=$!
  echo "[keepalive $(date +%H:%M:%S)] dev PID=$DEVPID" >> keepalive.log
  # Wait for it to die, but also health-check every 15s
  while kill -0 $DEVPID 2>/dev/null; do
    sleep 15
  done
  echo "[keepalive $(date +%H:%M:%S)] dev died (exit $?), restarting in 2s..." >> keepalive.log
  sleep 2
done
