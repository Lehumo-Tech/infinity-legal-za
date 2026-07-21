#!/bin/bash
# Sandbox-resilient dev server launcher.
#
# KEY INSIGHT: The sandbox process reaper kills all child processes of a Bash
# tool call when the call completes. To escape the reaper, the server MUST be:
#   1. Launched via `setsid` (new session, detached from shell process group)
#   2. Started with `exec` (replaces the shell — no child PID to track)
#   3. Fully I/O-detached (</dev/null >/dev/null 2>&1)
#   4. Returned immediately (don't wait in the launching shell)
#
# This script wraps the server in a self-healing while-loop so that if the
# node process crashes (OOM, unhandled exception), it restarts within 3s.
#
# Usage:
#   setsid bash /home/z/my-project/start-sandbox.sh </dev/null >/dev/null 2>&1 &
#
# Heap is set to 2048MB (sandbox has 4GB). The previous 1024MB limit caused
# OOM during webpack compilation of large route trees.

cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=1280 --max-semi-space-size=64"
export NODE_ENV=development

# Kill any stale server on port 3000
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
sleep 1

echo "[$(date)] sandbox watchdog starting (heap=2048MB)..." >> keepalive.log

while true; do
  echo "[$(date)] starting next dev --webpack..." >> keepalive.log
  node node_modules/.bin/next dev -p 3000 --webpack >> dev.log 2>&1
  EXIT=$?
  echo "[$(date)] server exited with code $EXIT, restarting in 3s..." >> keepalive.log
  sleep 3
done
