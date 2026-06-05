#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="postgresql://neondb_owner:npg_3B6GgaFoflrz@ep-misty-star-aquxzzmo.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export POSTGRES_URL="postgresql://neondb_owner:npg_3B6GgaFoflrz@ep-misty-star-aquxzzmo.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export DIRECT_URL="postgresql://neondb_owner:npg_3B6GgaFoflrz@ep-misty-star-aquxzzmo.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"
export JWT_SECRET="cb5d76539a59ebbf870d50d983068cb7a9aeb22c94eb8a79b6519ae669b08cbf"
export ENCRYPTION_KEY="6e43ea6a7e7e581f7958d5216584e5e9072a01c76ff95c5bf76412f1e2bb734e"
export NEXT_PUBLIC_APP_URL="https://infinitylegal.org"

LOG=/home/z/my-project/dev.log

while true; do
  echo "[keep-alive] Starting at $(date)" >> "$LOG"
  node node_modules/.bin/next dev -p 3000 --webpack >> "$LOG" 2>&1
  echo "[keep-alive] Exited at $(date)" >> "$LOG"
  sleep 3
done
