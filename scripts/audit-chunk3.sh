#!/bin/bash
# ============================================================================
# AUDIT CHUNK 3: Routes that OOM'd before testing — leads/convert, consults,
# tasks, notifs, crm, docs, stripe, translate, webhooks, intake, AI auth gates
# Uses 1536MB heap. Tests ~30 checks.
# ============================================================================
set +e
cd /home/z/my-project
BASE=http://127.0.0.1:3000
TS=$(date +%s)
PASS=0; FAIL=0; CRASH=0
declare -a RESULTS

check() { local n="$1" e="$2" a="$3"; if [[ "$a" == "$e" ]]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | expected=$e got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }
check_any() { local n="$1"; shift; local a="$1"; shift; local f=0; for x in "$@"; do [[ "$a" == "$x" ]] && f=1 && break; done; if [ "$f" = "1" ]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | expected one of $* got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }

echo "=== STARTING SERVER (1536MB) ==="
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
EMAIL1="c1-${TS}@example.com"
curl -sS -o /dev/null -X POST $BASE/api/auth/signup -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"AuditTest!2025\",\"full_name\":\"Audit Client\",\"phone\":\"0821234567\",\"consent_given\":true,\"popia_consent\":true}" --max-time 20 2>/dev/null
L1=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"$EMAIL1\",\"password\":\"AuditTest!2025\"}" --max-time 20 2>/dev/null)
C1T=$(echo "$L1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
STAFF=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 20 2>/dev/null)
ST=$(echo "$STAFF" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "client token" "nonempty" "${C1T:+nonempty}"
check "staff token" "nonempty" "${ST:+nonempty}"

# === LEADS CONVERT (was OOM) ===
echo "=== LEADS CONVERT ==="
LR=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/leads" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"first_name\":\"Lead\",\"last_name\":\"Test\",\"email\":\"lead-$TS@example.com\",\"phone\":\"0821234567\",\"case_type\":\"civil\",\"description\":\"test\"}" --max-time 15 2>/dev/null)
check "POST /api/leads" "201" "$(echo "$LR" | tail -1)"
LID=$(echo "$LR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "lead_id" "nonempty" "${LID:+nonempty}"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X POST "$BASE/api/leads/$LID/convert" -H "Authorization: Bearer $ST" -H "Origin: http://localhost:3000" --max-time 15 2>/dev/null)
check "POST /api/leads/[id]/convert" "201" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X POST "$BASE/api/leads/$LID/convert" -H "Authorization: Bearer $ST" -H "Origin: http://localhost:3000" --max-time 15 2>/dev/null)
check "re-convert -> 200" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X POST "$BASE/api/leads/$LID/convert" -H "Origin: http://localhost:3000" --max-time 15 2>/dev/null)
check "unauth convert -> 401" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/leads/$LID" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/leads/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/leads/$LID" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"status":"contacted","notes":"Called"}' --max-time 15 2>/dev/null)
check "PUT /api/leads/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/leads/nonexistent" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/leads/[id] (404)" "404" "$code"

# === CONSULTATIONS (was OOM) ===
echo "=== CONSULTATIONS ==="
CRM_ALL=$(curl -sS "$BASE/api/crm/users" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
C1UID=$(echo "$CRM_ALL" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; [print(u['id']) for u in d if u.get('email')=='$EMAIL1']" 2>/dev/null)
[ -z "$C1UID" ] && C1UID=$(echo "$CRM_ALL" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; clients=[u['id'] for u in d if u.get('role')=='client']; print(clients[0] if clients else '')" 2>/dev/null)
CR=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/consultations" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"client_id\":\"$C1UID\",\"scheduled_at\":\"2026-08-01T10:00:00Z\",\"duration_minutes\":60,\"meeting_type\":\"video\",\"notes\":\"test\"}" --max-time 15 2>/dev/null)
check "POST /api/consultations" "201" "$(echo "$CR" | tail -1)"
COID=$(echo "$CR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "consult_id" "nonempty" "${COID:+nonempty}"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/consultations" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/consultations" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/consultations/$COID" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/consultations/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/consultations/$COID" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"status":"completed"}' --max-time 15 2>/dev/null)
check "PUT /api/consultations/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X DELETE "$BASE/api/consultations/$COID" -H "Authorization: Bearer $ST" -H "Origin: http://localhost:3000" --max-time 15 2>/dev/null)
check "DELETE /api/consultations/[id]" "200" "$code"

# === TASKS (was OOM) ===
echo "=== TASKS ==="
SID=$(echo "$CRM_ALL" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; [print(u['id']) for u in d if u.get('email')=='tidimalo@infinitylegal.org']" 2>/dev/null)
TR=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/tasks" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"title\":\"Audit Task\",\"description\":\"test\",\"assigned_to\":\"$SID\",\"priority\":\"medium\"}" --max-time 15 2>/dev/null)
check "POST /api/tasks" "201" "$(echo "$TR" | tail -1)"
TID=$(echo "$TR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "task_id" "nonempty" "${TID:+nonempty}"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/tasks" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/tasks" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/tasks/$TID" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/tasks/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/tasks/$TID" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"status":"completed"}' --max-time 15 2>/dev/null)
check "PUT /api/tasks/[id]" "200" "$code"

# === NOTIFICATIONS + CRM + DOCS (were OOM) ===
echo "=== NOTIFICATIONS + CRM + DOCS ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notifications" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET /api/notifications" "200" "$code"
for r in /api/crm /api/crm/users /api/crm/activity /api/crm/settings /api/crm/subscriptions; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET $r" "200" "$code"
done
SETTINGS_ID=$(curl -sS "$BASE/api/crm/settings" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['id'] if d else 'site_name')" 2>/dev/null)
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/crm/settings" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"id\":\"$SETTINGS_ID\",\"value\":\"Test\"}" --max-time 15 2>/dev/null); check "PATCH /api/crm/settings" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET /api/documents" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents/nonexistent" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null); check "GET /api/documents/[id] (404)" "404" "$code"

# === STRIPE (was OOM) ===
echo "=== STRIPE ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/cancel" --max-time 15 2>/dev/null); check_any "GET /api/stripe/cancel (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/success?session_id=test" --max-time 15 2>/dev/null); check_any "GET /api/stripe/success (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 15 2>/dev/null); check_any "POST /api/stripe/checkout (Origin)" "$code" 200 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 15 2>/dev/null); check "POST /api/stripe/checkout (no Origin -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/webhook" -H "Content-Type: application/json" -d '{"type":"x"}' --max-time 15 2>/dev/null); check_any "POST /api/stripe/webhook (no sig)" "$code" 400 404 503

# === PAYFAST CHECKOUT (was 404, now fixed) ===
echo "=== PAYFAST CHECKOUT (fixed) ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 15 2>/dev/null)
check_any "POST /api/payfast/checkout (slug, fixed)" "$code" 200 409
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planSlug":"labour","billingCycle":"monthly"}' --max-time 15 2>/dev/null)
check_any "POST /api/payfast/checkout (planSlug)" "$code" 200 409

# === TRANSLATE + WEBHOOKS + INTAKE (were OOM) ===
echo "=== TRANSLATE + WEBHOOKS + INTAKE ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Hello","target":"zu"}' --max-time 15 2>/dev/null); check_any "POST /api/translate" "$code" 200 429 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Hello","target":"zu"}' --max-time 15 2>/dev/null); check "POST /api/translate (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/webhooks/clerk" -H "Content-Type: application/json" -d '{"type":"user.created"}' --max-time 15 2>/dev/null); check_any "POST /api/webhooks/clerk (no sig)" "$code" 400 404
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/send" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{}' --max-time 15 2>/dev/null); check "CSRF+auth gate -> 401" "401" "$code"
INTAKE_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/intake" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"name":"Intake Test","email":"intake-'$TS'@example.com","phone":"0821234567","caseType":"civil","description":"contract dispute","consent_given":true,"popia_consent":true}' --max-time 30 2>/dev/null)
IC=$(echo "$INTAKE_RESP" | tail -1)
if [ "$IC" = "200" ] || [ "$IC" = "201" ]; then PASS=$((PASS+1)); RESULTS+=("PASS | POST /api/intake | got=$IC"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | POST /api/intake | got=$IC"); [[ "$IC" = "500" ]] && CRASH=$((CRASH+1)); fi

# === AI AUTH GATES (were OOM) ===
echo "=== AI AUTH GATES ==="
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
echo "  CHUNK 3 (PREVIOUSLY-OOM'd ROUTES) SUMMARY"
echo "============================================"
echo "PASS: $PASS  FAIL: $FAIL  CRASH(500): $CRASH"
echo "--------------------------------------------"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "============================================"
if [ "$CRASH" -gt 0 ]; then echo "!! $CRASH ENDPOINT(S) RETURNED 500 !!"; fi

pkill -9 -f "next" 2>/dev/null
exit 0
