#!/bin/bash
# Comprehensive QC — writes results to /home/z/my-project/qc-results.txt
# Server runs as a child of this shell so it survives the whole check.
cd /home/z/my-project

OUT=/home/z/my-project/qc-results.txt
> "$OUT"

pkill -f "next dev" 2>/dev/null; pkill -f "bun run dev" 2>/dev/null; pkill -f keepalive 2>/dev/null; sleep 2

nohup bun run dev >> dev.log 2>&1 &
echo "Server PID: $!" | tee -a "$OUT"

UP=0
for i in $(seq 1 14); do
  sleep 5
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 30 2>/dev/null)
  if [ "$code" = "200" ]; then echo "SERVER UP after $((i*5))s" | tee -a "$OUT"; UP=1; break; fi
done
if [ "$UP" != "1" ]; then echo "SERVER FAILED TO START" | tee -a "$OUT"; exit 1; fi

{
echo ""
echo "=========================================="
echo "  QC REPORT — Infinity Legal ZA"
echo "=========================================="

echo ""
echo "=== 1. SERVER ==="
curl -s -o /dev/null -w "  GET / : HTTP %{http_code} in %{time_total}s\n" http://localhost:3000/ --max-time 30

echo ""
echo "=== 2. ESLINT ==="
LINT_OUT=$(bun run lint 2>&1)
LINT_CODE=$?
if [ "$LINT_CODE" = "0" ]; then echo "  PASS — 0 errors"; else echo "$LINT_OUT" | tail -8; fi

echo ""
echo "=== 3. TYPESCRIPT ==="
TSC_OUT=$(npx tsc --noEmit 2>&1)
TSC_CODE=$?
if [ "$TSC_CODE" = "0" ]; then echo "  PASS — 0 errors"; else echo "$TSC_OUT" | tail -10; fi

echo ""
echo "=== 4. PUBLIC API ROUTES (expect 200) ==="
for route in "/api/health" "/api/pricing" "/api/articles?limit=5" "/api/holidays"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route" --max-time 25 2>/dev/null)
  echo "  $route → $code"
done

echo ""
echo "=== 5. AUTH FLOW ==="
LOGIN_RESP=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 25)
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)
SUCCESS=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success'))" 2>/dev/null)
echo "  /api/auth/login → success=$SUCCESS  token_len=${#TOKEN}"

echo ""
echo "=== 6. AUTHED API ROUTES (expect 200 with Bearer token) ==="
if [ -n "$TOKEN" ]; then
  for route in "/api/auth/profile" "/api/dashboard" "/api/cases" "/api/consultations" "/api/tasks" "/api/documents" "/api/leads" "/api/notifications" "/api/subscriptions" "/api/staff" "/api/analytics" "/api/communications/logs"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route" -H "Authorization: Bearer $TOKEN" --max-time 25 2>/dev/null)
    echo "  $route → $code"
  done
fi

echo ""
echo "=== 7. SECURITY: unauthed protected route (expect 401) ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/dashboard" --max-time 15 2>/dev/null)
echo "  /api/dashboard (no token) → $code"

echo ""
echo "=== 8. DEV LOG (recent) ==="
tail -6 dev.log

echo ""
echo "=== QC COMPLETE — server left running for browser verification ==="
} >> "$OUT" 2>&1

cat "$OUT"
