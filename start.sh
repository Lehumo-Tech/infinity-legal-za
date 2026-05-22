#!/bin/bash
cd /home/z/my-project
# Kill any existing server
pkill -f "next dev" 2>/dev/null
sleep 2
# Start with webpack (more stable than Turbopack for this app)
exec node node_modules/.bin/next dev -p 3000 --webpack
