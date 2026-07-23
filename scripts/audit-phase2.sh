#!/bin/bash
# PHASE 2: Portal routes (hr, management, paralegal, sales), leads/tasks/documents [id], payfast, stripe, translate, webhooks
set +e
cd /home/z/my-project
BASE=http://127.0.0.1:3000
TS=$(date +%s)
PASS=0; FAIL=0; CRASH=0
declare -a RESULTS
check() { local n="$1" e="$2" a="$3"; if [[ "$a" == "$e" ]]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | exp=$e got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }
check_any() { local n="$1" a="$2"; shift 2; local f=0; for e in "$@"; do [[ "$a" == "$e" ]] && { f=1; break; }; done; if [ "$f" = 1 ]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | exp one of $* got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }

echo "=== STARTING SERVER (Phase 2) ==="
NODE_OPTIONS="--max-old-space-size=2560" NEXT_PRIVATE_DEBUG_MEMORY=0 nohup node node_modules/.bin/next dev -p 3000 --webpack > dev.log 2>&1 &
for i in $(seq 1 60); do curl -sf -o /dev/null $BASE/api/health 2>/dev/null && break; sleep 1; done
echo "[$(date)] server up"

STAFF=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 20 2>/dev/null)
STAFF_TOKEN=$(echo "$STAFF" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "staff login" "nonempty" "${STAFF_TOKEN:+nonempty}"
EMAIL1="p2-${TS}@example.com"
curl -sS -X POST $BASE/api/auth/signup -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"$EMAIL1\",\"password\":\"P2Test!2025\",\"full_name\":\"P2 Client\",\"phone\":\"0851234567\",\"consent_given\":true,\"popia_consent\":true}" --max-time 20 2>/dev/null > /dev/null
LOGIN1=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"$EMAIL1\",\"password\":\"P2Test!2025\"}" --max-time 20 2>/dev/null)
CLIENT_TOKEN=$(echo "$LOGIN1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "client token" "nonempty" "${CLIENT_TOKEN:+nonempty}"

echo "=== PORTAL ROUTES ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hr" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/hr (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hr" --max-time 10 2>/dev/null)
check "GET /api/hr (no auth -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/management (MD)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" --max-time 10 2>/dev/null)
check "GET /api/management (no auth -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" -H "Authorization: Bearer $CLIENT_TOKEN" --max-time 10 2>/dev/null)
check "GET /api/management (client -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/paralegal" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
check_any "GET /api/paralegal (staff role gate)" "$code" 200 403
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/paralegal" --max-time 10 2>/dev/null)
check "GET /api/paralegal (no auth -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/sales" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/sales (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/sales" --max-time 10 2>/dev/null)
check "GET /api/sales (no auth -> 401)" "401" "$code"

echo "=== LEADS [ID] ==="
LEAD_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/leads" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"first_name\":\"P2\",\"last_name\":\"Lead\",\"email\":\"p2l-$TS@example.com\",\"phone\":\"0851234567\",\"case_type\":\"civil\",\"description\":\"P2 lead\"}" --max-time 15 2>/dev/null)
LEAD_ID=$(echo "$LEAD_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "lead created" "nonempty" "${LEAD_ID:+nonempty}"
if [ -n "$LEAD_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/leads/$LEAD_ID" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
  check "GET /api/leads/[id]" "200" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/leads/$LEAD_ID" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"status":"contacted","notes":"Called"}' --max-time 10 2>/dev/null)
  check "PUT /api/leads/[id]" "200" "$code"
fi
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/leads/nonexistent-xyz" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
check "GET /api/leads/[id] (404)" "404" "$code"

echo "=== TASKS [ID] ==="
TASK_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/tasks" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"title":"P2 Task","description":"Test","priority":"low"}' --max-time 15 2>/dev/null)
TASK_ID=$(echo "$TASK_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "task created" "nonempty" "${TASK_ID:+nonempty}"
if [ -n "$TASK_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/tasks/$TASK_ID" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
  check "GET /api/tasks/[id]" "200" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/tasks/$TASK_ID" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"status":"completed"}' --max-time 10 2>/dev/null)
  check "PUT /api/tasks/[id]" "200" "$code"
fi

echo "=== DOCUMENTS [ID] ==="
DOC_ID=$(curl -sS "$BASE/api/documents" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['id'] if isinstance(d,list) and d else 'none')" 2>/dev/null)
if [ "$DOC_ID" != "none" ] && [ -n "$DOC_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents/$DOC_ID" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
  check "GET /api/documents/[id]" "200" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/documents/$DOC_ID" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"description":"Updated"}' --max-time 10 2>/dev/null)
  check "PUT /api/documents/[id]" "200" "$code"
else
  echo "SKIP | no documents to test"
fi
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents/nonexistent-xyz" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 10 2>/dev/null)
check "GET /api/documents/[id] (404)" "404" "$code"

echo "=== PAYFAST ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/payfast/cancel" --max-time 10 2>/dev/null)
check "GET /api/payfast/cancel" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/payfast/success" --max-time 10 2>/dev/null)
check "GET /api/payfast/success" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 15 2>/dev/null)
check_any "POST /api/payfast/checkout (client)" "$code" 200 409
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 10 2>/dev/null)
check "POST /api/payfast/checkout (no auth -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/notify" -H "Content-Type: application/x-www-form-urlencoded" -d 'm_payment_id=test&pf_payment_id=test&payment_status=COMPLETE&amount_gross=99.00&signature=invalid' --max-time 10 2>/dev/null)
check_any "POST /api/payfast/notify (no sig -> 400/403)" "$code" 400 403

echo "=== STRIPE ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/cancel" --max-time 10 2>/dev/null)
check_any "GET /api/stripe/cancel (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/success?session_id=test" --max-time 10 2>/dev/null)
check_any "GET /api/stripe/success (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 15 2>/dev/null)
check_any "POST /api/stripe/checkout (Origin)" "$code" 200 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 10 2>/dev/null)
check "POST /api/stripe/checkout (no Origin -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/webhook" -H "Content-Type: application/json" -d '{"type":"checkout.session.completed"}' --max-time 10 2>/dev/null)
check_any "POST /api/stripe/webhook (no sig -> 400)" "$code" 400 404

echo "=== TRANSLATE ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/translate" --max-time 10 2>/dev/null)
check "GET /api/translate (list)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Hello world","target":"zu"}' --max-time 15 2>/dev/null)
check_any "POST /api/translate (staff)" "$code" 200 429 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Hello","target":"zu"}' --max-time 10 2>/dev/null)
check "POST /api/translate (no auth -> 401)" "401" "$code"

echo "=== WEBHOOKS ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/webhooks/clerk" -H "Content-Type: application/json" -d '{"type":"user.created","data":{"id":"user_123"}}' --max-time 10 2>/dev/null)
check_any "POST /api/webhooks/clerk (no svix -> 400/404)" "$code" 400 404

echo ""
echo "============================================"
echo "  PHASE 2 SUMMARY: PASS=$PASS FAIL=$FAIL CRASH(500)=$CRASH"
echo "============================================"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "============================================"
pkill -9 -f "next" 2>/dev/null
exit 0
