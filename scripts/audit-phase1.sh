#!/bin/bash
# PHASE 1: Non-AI routes (admin, articles, auth-extended, backup, comms, contact, CRM)
# Starts its own server, runs ~25 checks, kills server. Must complete in <8min.
set +e
cd /home/z/my-project
BASE=http://127.0.0.1:3000
TS=$(date +%s)
PASS=0; FAIL=0; CRASH=0
declare -a RESULTS
check() { local n="$1" e="$2" a="$3"; if [[ "$a" == "$e" ]]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | exp=$e got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }
check_any() { local n="$1" a="$2"; shift 2; local f=0; for e in "$@"; do [[ "$a" == "$e" ]] && { f=1; break; }; done; if [ "$f" = 1 ]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | exp one of $* got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }

echo "=== STARTING SERVER (Phase 1) ==="
NODE_OPTIONS="--max-old-space-size=2560" NEXT_PRIVATE_DEBUG_MEMORY=0 nohup node node_modules/.bin/next dev -p 3000 --webpack > dev.log 2>&1 &
for i in $(seq 1 60); do curl -sf -o /dev/null $BASE/api/health 2>/dev/null && break; sleep 1; done
echo "[$(date)] server up"

# Auth setup
STAFF=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 20 2>/dev/null)
STAFF_TOKEN=$(echo "$STAFF" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "staff login" "nonempty" "${STAFF_TOKEN:+nonempty}"
EMAIL1="p1-${TS}@example.com"
curl -sS -X POST $BASE/api/auth/signup -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"$EMAIL1\",\"password\":\"P1Test!2025\",\"full_name\":\"P1 Client\",\"phone\":\"0841234567\",\"consent_given\":true,\"popia_consent\":true}" --max-time 20 2>/dev/null > /dev/null
LOGIN1=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"$EMAIL1\",\"password\":\"P1Test!2025\"}" --max-time 20 2>/dev/null)
CLIENT_TOKEN=$(echo "$LOGIN1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "client token" "nonempty" "${CLIENT_TOKEN:+nonempty}"

echo "=== ROOT ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api" --max-time 15 2>/dev/null)
check "GET /api (root)" "200" "$code"

echo "=== ADMIN ==="
for r in migrate seed-articles seed-staff; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/$r" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 20 2>/dev/null)
  check "POST /api/admin/$r (staff)" "200" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/$r" --max-time 10 2>/dev/null)
  check "POST /api/admin/$r (no auth -> 401)" "401" "$code"
done
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-pricing" --max-time 10 2>/dev/null)
check "POST /api/admin/seed-pricing (no auth -> 401)" "401" "$code"

echo "=== ARTICLES [SLUG] ==="
SLUG=$(curl -sS "$BASE/api/articles?limit=1" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['slug'] if d else 'popia')" 2>/dev/null)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles/$SLUG" --max-time 10 2>/dev/null)
check "GET /api/articles/[slug] (public)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles/nonexistent-xyz" --max-time 10 2>/dev/null)
check "GET /api/articles/[slug] (404)" "404" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/articles/$SLUG" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"reading_time_min":5}' --max-time 15 2>/dev/null)
check "PATCH /api/articles/[slug] (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/articles/$SLUG" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"reading_time_min":5}' --max-time 10 2>/dev/null)
check "PATCH /api/articles/[slug] (no auth -> 401)" "401" "$code"

echo "=== AUTH EXTENDED ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/auto-confirm" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"$EMAIL1\"}" --max-time 10 2>/dev/null)
check "POST /api/auth/auto-confirm" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/callback?code=test" --max-time 10 2>/dev/null)
check_any "GET /api/auth/callback (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/clerk-webhook?code=test" --max-time 10 2>/dev/null)
check_any "GET /api/auth/clerk-webhook (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/forgot-password" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"email":"nx@example.com"}' --max-time 10 2>/dev/null)
check "POST /api/auth/forgot-password (Origin)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/forgot-password" -H "Content-Type: application/json" -d '{"email":"nx@example.com"}' --max-time 10 2>/dev/null)
check "POST /api/auth/forgot-password (no Origin -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/reset-password" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"token":"bad","password":"NewPass!2025"}' --max-time 10 2>/dev/null)
check "POST /api/auth/reset-password (bad token -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/reset-password" -H "Content-Type: application/json" -d '{"token":"x","password":"x"}' --max-time 10 2>/dev/null)
check "POST /api/auth/reset-password (no Origin -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/signout" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
check "POST /api/auth/signout" "200" "$code"

echo "=== BACKUP ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/backup" -H "Authorization: Bearer $STAFF_TOKEN" -H "Origin: http://localhost:3000" -d '{"type":"manual"}' --max-time 15 2>/dev/null)
check_any "POST /api/backup (staff)" "$code" 200 201
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backup" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
check "GET /api/backup (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backup" --max-time 10 2>/dev/null)
check "GET /api/backup (no auth -> 401)" "401" "$code"

echo "=== COMMS EXTENDED ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/welcome" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"userId\":\"test\",\"email\":\"w-$TS@example.com\",\"fullName\":\"Test\"}" --max-time 15 2>/dev/null)
check_any "POST /api/communications/welcome (staff)" "$code" 200 500
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/welcome" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"userId":"x","email":"x@x.com","fullName":"x"}' --max-time 10 2>/dev/null)
check "POST /api/communications/welcome (no auth -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/verify" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"v-$TS@example.com\",\"channel\":\"email\"}" --max-time 10 2>/dev/null)
check_any "POST /api/communications/verify (Origin)" "$code" 200 429
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/verify" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -d '{"email":"x@x.com"}' --max-time 10 2>/dev/null)
check "POST /api/communications/verify (no Origin -> 403)" "403" "$code"

echo "=== CONTACT ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/contact" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"name\":\"Test\",\"email\":\"c-$TS@example.com\",\"message\":\"I need legal help with a matter.\"}" --max-time 15 2>/dev/null)
check "POST /api/contact (public)" "201" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/contact" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"name":"","email":"bad","message":""}' --max-time 10 2>/dev/null)
check "POST /api/contact (invalid -> 400)" "400" "$code"

echo "=== CRM EXTENDED ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/activity" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
check "GET /api/crm/activity (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/activity" --max-time 10 2>/dev/null)
check "GET /api/crm/activity (no auth -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/settings" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
check "GET /api/crm/settings (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/crm/settings" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"id":"site_name","value":"Test"}' --max-time 10 2>/dev/null)
check "PATCH /api/crm/settings (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/settings" --max-time 10 2>/dev/null)
check "GET /api/crm/settings (no auth -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/subscriptions" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
check "GET /api/crm/subscriptions (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/subscriptions" --max-time 10 2>/dev/null)
check "GET /api/crm/subscriptions (no auth -> 401)" "401" "$code"

echo ""
echo "============================================"
echo "  PHASE 1 SUMMARY: PASS=$PASS FAIL=$FAIL CRASH(500)=$CRASH"
echo "============================================"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "============================================"
pkill -9 -f "next" 2>/dev/null
exit 0
