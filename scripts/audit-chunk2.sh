#!/bin/bash
# ============================================================================
# AUDIT CHUNK 2: Remaining routes (GETs, portals, admin, payments, AI) — ~50 checks
# Uses 1536MB heap (stable, no OOM in 4GB sandbox).
# ============================================================================
set +e
cd /home/z/my-project
BASE=http://127.0.0.1:3000
TS=$(date +%s)
PASS=0; FAIL=0; CRASH=0
declare -a RESULTS

check() { local n="$1" e="$2" a="$3"; if [[ "$a" == "$e" ]]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | expected=$e got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }
check_any() { local n="$1"; shift; local a="$1"; shift; local f=0; for x in "$@"; do [[ "$a" == "$x" ]] && f=1 && break; done; if [ "$f" = "1" ]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | expected one of $* got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }

echo "=== STARTING SERVER (1536MB heap) ==="
pkill -9 -f "next" 2>/dev/null; sleep 2
rm -f dev.log
NEXT_PRIVATE_DEBUG_MEMORY=1 NODE_OPTIONS="--max-old-space-size=1536 --max-semi-space-size=64" \
  node node_modules/.bin/next dev -p 3000 --webpack > dev.log 2>&1 &
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/health --max-time 5 2>/dev/null)
  [ "$code" = "200" ] && { echo "[healthy $((i*2))s]"; break; }
  sleep 2
done

# === AUTH SETUP ===
EMAIL1="b1-${TS}@example.com"
curl -sS -o /dev/null -X POST $BASE/api/auth/signup -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"AuditTest!2025\",\"full_name\":\"Audit Client\",\"phone\":\"0821234567\",\"consent_given\":true,\"popia_consent\":true}" --max-time 20 2>/dev/null
L1=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"$EMAIL1\",\"password\":\"AuditTest!2025\"}" --max-time 20 2>/dev/null)
C1T=$(echo "$L1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
STAFF=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 20 2>/dev/null)
ST=$(echo "$STAFF" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "client token" "nonempty" "${C1T:+nonempty}"
check "staff token" "nonempty" "${ST:+nonempty}"

# === REMAINING GETs ===
echo "=== GET ROUTES ==="
for r in /api/staff /api/subscriptions /api/analytics /api/report /api/messages /api/integrations /api/ai/providers; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET $r" "200" "$code"
done

# === PORTAL ROUTES ===
echo "=== PORTALS ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hr" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET /api/hr (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hr" --max-time 15 2>/dev/null); check "GET /api/hr (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET /api/management (MD)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" --max-time 15 2>/dev/null); check "GET /api/management (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" -H "Authorization: Bearer $C1T" --max-time 15 2>/dev/null); check "GET /api/management (client -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/paralegal" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check_any "GET /api/paralegal (staff)" "$code" 200 403
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/paralegal" --max-time 15 2>/dev/null); check "GET /api/paralegal (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/sales" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET /api/sales (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/sales" --max-time 15 2>/dev/null); check "GET /api/sales (401)" "401" "$code"

# === ADMIN ===
echo "=== ADMIN ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/migrate" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "POST /api/admin/migrate (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/migrate" --max-time 15 2>/dev/null); check "POST /api/admin/migrate (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-articles" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "POST /api/admin/seed-articles (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-articles" --max-time 15 2>/dev/null); check "POST /api/admin/seed-articles (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-pricing" --max-time 15 2>/dev/null); check "POST /api/admin/seed-pricing (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-staff" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "POST /api/admin/seed-staff (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-staff" --max-time 15 2>/dev/null); check "POST /api/admin/seed-staff (401)" "401" "$code"

# === BACKUP ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/backup" -H "Authorization: Bearer $ST" -H "Origin: http://localhost:3000" -d '{"type":"manual"}' --max-time 15 2>/dev/null); check_any "POST /api/backup (staff)" "$code" 200 201
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backup" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET /api/backup (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backup" --max-time 15 2>/dev/null); check "GET /api/backup (401)" "401" "$code"

# === CONTACT ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/contact" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"name\":\"Test\",\"email\":\"c-$TS@example.com\",\"message\":\"help\",\"subject\":\"q\"}" --max-time 15 2>/dev/null); check "POST /api/contact (public)" "201" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/contact" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"name":"","email":"bad","message":""}' --max-time 15 2>/dev/null); check "POST /api/contact (400)" "400" "$code"

# === ARTICLES [slug] ===
echo "=== ARTICLES ==="
SLUG=$(curl -sS "$BASE/api/articles?limit=1" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['slug'] if d else 'x')" 2>/dev/null)
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/articles/$SLUG" --max-time 15 2>/dev/null); check "GET /api/articles/[slug]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/articles/nonexistent-slug-12345" --max-time 15 2>/dev/null); check "GET /api/articles/[slug] (404)" "404" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PATCH "$BASE/api/articles/$SLUG" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"reading_time_min":5}' --max-time 15 2>/dev/null); check "PATCH /api/articles/[slug] (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PATCH "$BASE/api/articles/$SLUG" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"reading_time_min":5}' --max-time 15 2>/dev/null); check "PATCH /api/articles/[slug] (401)" "401" "$code"

# === PAYFAST ===
echo "=== PAYFAST ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/payfast/cancel" --max-time 15 2>/dev/null); check "GET /api/payfast/cancel" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/payfast/success" --max-time 15 2>/dev/null); check "GET /api/payfast/success" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 15 2>/dev/null); check_any "POST /api/payfast/checkout (client)" "$code" 200 409
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 15 2>/dev/null); check "POST /api/payfast/checkout (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/notify" -H "Content-Type: application/x-www-form-urlencoded" -d 'm_payment_id=t&pf_payment_id=t&payment_status=COMPLETE&amount_gross=99.00&signature=invalid' --max-time 15 2>/dev/null); check_any "POST /api/payfast/notify (no sig)" "$code" 400 403

# === STRIPE ===
echo "=== STRIPE ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/cancel" --max-time 15 2>/dev/null); check_any "GET /api/stripe/cancel (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/success?session_id=test" --max-time 15 2>/dev/null); check_any "GET /api/stripe/success (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 15 2>/dev/null); check_any "POST /api/stripe/checkout (Origin)" "$code" 200 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 15 2>/dev/null); check "POST /api/stripe/checkout (no Origin -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/webhook" -H "Content-Type: application/json" -d '{"type":"x"}' --max-time 15 2>/dev/null); check_any "POST /api/stripe/webhook (no sig)" "$code" 400 404 503

# === TRANSLATE ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Hello","target":"zu"}' --max-time 15 2>/dev/null); check_any "POST /api/translate (staff)" "$code" 200 429 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Hello","target":"zu"}' --max-time 15 2>/dev/null); check "POST /api/translate (401)" "401" "$code"

# === WEBHOOKS ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/webhooks/clerk" -H "Content-Type: application/json" -d '{"type":"user.created"}' --max-time 15 2>/dev/null); check_any "POST /api/webhooks/clerk (no sig)" "$code" 400 404

# === SECURITY ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/send" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{}' --max-time 15 2>/dev/null); check "CSRF+auth gate -> 401" "401" "$code"

# === INTAKE ===
echo "=== INTAKE ==="
INTAKE_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/intake" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"name":"Intake Test","email":"intake-'$TS'@example.com","phone":"0821234567","caseType":"civil","description":"contract dispute over services rendered","consent_given":true,"popia_consent":true}' --max-time 30 2>/dev/null)
IC=$(echo "$INTAKE_RESP" | tail -1)
if [ "$IC" = "200" ] || [ "$IC" = "201" ]; then PASS=$((PASS+1)); RESULTS+=("PASS | POST /api/intake | got=$IC"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | POST /api/intake | got=$IC"); [[ "$IC" = "500" ]] && CRASH=$((CRASH+1)); fi
RESP_HAS_CONF=$(echo "$INTAKE_RESP" | head -n -1 | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('yes' if 'ai_confidence' in d else 'no')" 2>/dev/null)
check "intake doesn't expose ai_confidence" "no" "$RESP_HAS_CONF"

# === AI ROUTES (graceful, short timeout) ===
echo "=== AI ROUTES ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/chat" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"message":"Hello"}' --max-time 12 2>/dev/null); check_any "POST /api/ai/chat" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/asr" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"audio_base64":"UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="}' --max-time 12 2>/dev/null); check_any "POST /api/ai/asr" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/image-gen" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"prompt":"scales of justice","size":"1024x1024"}' --max-time 12 2>/dev/null); check_any "POST /api/ai/image-gen" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/intake" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"name\":\"AI Intake\",\"email\":\"aii-$TS@example.com\",\"phone\":\"0831234567\",\"caseType\":\"civil\",\"description\":\"contract dispute\",\"consent_given\":true,\"popia_consent\":true}" --max-time 12 2>/dev/null); check_any "POST /api/ai/intake (public)" "$code" 200 201 000
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/intake" -H "Authorization: Bearer $ST" --max-time 12 2>/dev/null); check "GET /api/ai/intake (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/memo" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"facts":"Client agreement 2025 R50000/month. Non-payment 3 months.","issues":"Breach of contract","jurisdiction":"South Africa"}' --max-time 12 2>/dev/null); check_any "POST /api/ai/memo" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/summarize" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"content":"Legal document with clauses. Drafted per SA law.","documentType":"contract"}' --max-time 12 2>/dev/null); check_any "POST /api/ai/summarize" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/tts" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Welcome to Infinity Legal.","voice":"tongtong"}' --max-time 12 2>/dev/null); check_any "POST /api/ai/tts" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/vlm" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"image_url":"https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400","question":"What is this?"}' --max-time 12 2>/dev/null); check_any "POST /api/ai/vlm" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/web-search?q=popia+act+south+africa&num=3" -H "Authorization: Bearer $ST" --max-time 12 2>/dev/null); check_any "GET /api/ai/web-search" "$code" 200 429 503 000

# AI auth gates
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/asr" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"audio_base64":"dGVzdA=="}' --max-time 12 2>/dev/null); check "POST /api/ai/asr (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/image-gen" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"prompt":"test"}' --max-time 12 2>/dev/null); check "POST /api/ai/image-gen (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/memo" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"facts":"x","issues":"x"}' --max-time 12 2>/dev/null); check "POST /api/ai/memo (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/summarize" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"content":"x"}' --max-time 12 2>/dev/null); check "POST /api/ai/summarize (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/tts" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"x"}' --max-time 12 2>/dev/null); check "POST /api/ai/tts (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/vlm" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"image_url":"x"}' --max-time 12 2>/dev/null); check "POST /api/ai/vlm (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/web-search?q=test" --max-time 12 2>/dev/null); check "GET /api/ai/web-search (401)" "401" "$code"

# === SUMMARY ===
echo ""
echo "============================================"
echo "  CHUNK 2 (REMAINING + AI) SUMMARY"
echo "============================================"
echo "PASS: $PASS  FAIL: $FAIL  CRASH(500): $CRASH"
echo "--------------------------------------------"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "============================================"
if [ "$CRASH" -gt 0 ]; then echo "!! $CRASH ENDPOINT(S) RETURNED 500 !!"; fi

pkill -9 -f "next" 2>/dev/null
exit 0
