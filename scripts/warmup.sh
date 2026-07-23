#!/usr/bin/env bash
# Warm up all API routes so the QC test doesn't trigger mid-test restarts.
BASE="http://localhost:3000"
TOKEN=$(curl -sS -m 15 -X POST -H "Content-Type: application/json" \
  --data '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' \
  "$BASE/api/auth/login" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "FATAL: could not login as tidimalo"
  exit 1
fi

echo "Warming up routes (with delays to avoid memory-threshold restart)..."
ROUTES=(
  "GET /api/dashboard"
  "GET /api/notifications?perPage=5"
  "GET /api/integrations"
  "GET /api/analytics"
  "GET /api/leads?perPage=5"
  "GET /api/cases?perPage=5"
  "GET /api/documents?perPage=5"
  "GET /api/tasks?perPage=5"
  "GET /api/consultations?perPage=5"
  "GET /api/staff?perPage=5"
  "GET /api/subscriptions"
  "GET /api/pricing"
  "GET /api/crm"
  "GET /api/crm/users"
  "GET /api/crm/subscriptions"
  "GET /api/crm/activity"
  "GET /api/crm/settings"
  "GET /api/communications/logs?perPage=3"
  "GET /api/communications/status"
  "GET /api/communications/templates"
  "GET /api/auth/profile"
)

for route in "${ROUTES[@]}"; do
  METHOD="${route%% *}"
  PATH_="${route#* }"
  CODE=$(curl -sS -m 30 -o /dev/null -w "%{http_code}" -X "$METHOD" \
    -H "Authorization: Bearer $TOKEN" "$BASE$PATH_" 2>/dev/null)
  printf "  %-45s %s\n" "$PATH_" "$CODE"
  sleep 3
done

# Warm up the upload route with a tiny file (will return 400 for missing type — that's fine,
# we just want Next.js to compile the route)
echo "  /api/documents/upload (compile trigger)..."
echo "warmup" > /tmp/warmup.txt
curl -sS -m 30 -o /dev/null -w "  -> %{http_code}\n" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/warmup.txt" \
  "$BASE/api/documents/upload" 2>/dev/null
sleep 3

echo "Warmup complete."
