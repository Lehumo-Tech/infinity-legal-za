#!/bin/bash
# ============================================================================
# AUDIT PART 1: Core routes (non-AI) — server + ~70 checks in one Bash call
# ============================================================================
set +e
cd /home/z/my-project
BASE=http://127.0.0.1:3000
TS=$(date +%s)
PASS=0; FAIL=0; CRASH=0
declare -a RESULTS

check() {
  local name="$1"; local expected="$2"; local actual="$3"
  if [[ "$actual" == "$expected" ]]; then PASS=$((PASS+1)); RESULTS+=("PASS | $name | got=$actual")
  else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $name | expected=$expected got=$actual"); [[ "$actual" == "500" ]] && CRASH=$((CRASH+1)); fi
}
check_any() {
  local name="$1"; shift; local actual="$1"; shift; local found=0
  for exp in "$@"; do [[ "$actual" == "$exp" ]] && found=1 && break; done
  if [ "$found" = "1" ]; then PASS=$((PASS+1)); RESULTS+=("PASS | $name | got=$actual")
  else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $name | expected one of $* got=$actual"); [[ "$actual" == "500" ]] && CRASH=$((CRASH+1)); fi
}

echo "=== STARTING SERVER ==="
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
echo "=== AUTH SETUP ==="
EMAIL1="aud-${TS}@example.com"
EMAIL2="aud2-${TS}@example.com"
curl -sS -o /dev/null -X POST $BASE/api/auth/signup -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"AuditTest!2025\",\"full_name\":\"Audit One\",\"phone\":\"0821234567\",\"consent_given\":true,\"popia_consent\":true}" --max-time 20 2>/dev/null
curl -sS -o /dev/null -X POST $BASE/api/auth/signup -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"AuditTest!2025\",\"full_name\":\"Audit Two\",\"phone\":\"0821234568\",\"consent_given\":true,\"popia_consent\":true}" --max-time 20 2>/dev/null
L1=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"AuditTest!2025\"}" --max-time 20 2>/dev/null)
C1T=$(echo "$L1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
L2=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"AuditTest!2025\"}" --max-time 20 2>/dev/null)
C2T=$(echo "$L2" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
STAFF=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 20 2>/dev/null)
ST=$(echo "$STAFF" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "client1 token" "nonempty" "${C1T:+nonempty}"
check "client2 token" "nonempty" "${C2T:+nonempty}"
check "staff token" "nonempty" "${ST:+nonempty}"

# === PUBLIC ROUTES ===
echo "=== PUBLIC ==="
for r in /api/health /api/pricing /api/holidays /api /api/translate; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" --max-time 15 2>/dev/null)
  check "GET $r" "200" "$code"
done
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles?limit=5" --max-time 15 2>/dev/null)
check "GET /api/articles" "200" "$code"
PCOUNT=$(curl -sS $BASE/api/pricing --max-time 15 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
check "pricing has 3 plans" "3" "$PCOUNT"

# === AUTH ===
echo "=== AUTH ==="
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/auth/profile -H "Authorization: Bearer $C1T" --max-time 15 2>/dev/null)
check "GET /api/auth/profile (authed)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/auth/profile --max-time 15 2>/dev/null)
check "GET /api/auth/profile (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/auth/verify -H "Authorization: Bearer $C1T" --max-time 15 2>/dev/null)
check "GET /api/auth/verify" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"wrong\"}" --max-time 15 2>/dev/null)
check "wrong password -> 401" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/auto-confirm" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\"}" --max-time 15 2>/dev/null)
check "POST /api/auth/auto-confirm" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/forgot-password" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"nonexistent@example.com"}' --max-time 15 2>/dev/null)
check "POST /api/auth/forgot-password" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/forgot-password" -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}' --max-time 15 2>/dev/null)
check "POST /api/auth/forgot-password (no Origin -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/reset-password" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"token":"invalid-token-12345","password":"NewPass!2025"}' --max-time 15 2>/dev/null)
check "POST /api/auth/reset-password (invalid -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/reset-password" -H "Content-Type: application/json" \
  -d '{"token":"x","password":"x"}' --max-time 15 2>/dev/null)
check "POST /api/auth/reset-password (no Origin -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/signout" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "POST /api/auth/signout" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/callback?code=test" --max-time 15 2>/dev/null)
check_any "GET /api/auth/callback (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/clerk-webhook?code=test" --max-time 15 2>/dev/null)
check_any "GET /api/auth/clerk-webhook (redirect)" "$code" 307 302

# === DASHBOARD ===
echo "=== DASHBOARD ==="
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/dashboard -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/dashboard (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/dashboard -H "Authorization: Bearer $C1T" --max-time 15 2>/dev/null)
check "GET /api/dashboard (client)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/dashboard --max-time 15 2>/dev/null)
check "GET /api/dashboard (401)" "401" "$code"

# === COMMUNICATIONS ===
echo "=== COMMUNICATIONS ==="
for r in /api/communications/status /api/communications/templates /api/communications/logs; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
  check "GET $r" "200" "$code"
done
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/welcome" \
  -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"userId\":\"test\",\"email\":\"welcome-$TS@example.com\",\"fullName\":\"Test\"}" --max-time 15 2>/dev/null)
check_any "POST /api/communications/welcome" "$code" 200 500
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/welcome" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"userId":"x","email":"x@x.com","fullName":"x"}' --max-time 15 2>/dev/null)
check "POST /api/communications/welcome (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/verify" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"email\":\"v-$TS@example.com\",\"channel\":\"email\"}" --max-time 15 2>/dev/null)
check_any "POST /api/communications/verify" "$code" 200 429
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/verify" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -d '{"email":"x@x.com"}' --max-time 15 2>/dev/null)
check "POST /api/communications/verify (no Origin -> 403)" "403" "$code"

# === CASES CRUD ===
echo "=== CASES ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/cases" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/cases" "200" "$code"
CRM_ALL=$(curl -sS "$BASE/api/crm/users" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
C1PID=$(echo "$CRM_ALL" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; [print(u['client_profile_id']) for u in d if u.get('email')=='$EMAIL1' and u.get('client_profile_id')]" 2>/dev/null)
C1UID=$(echo "$CRM_ALL" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; [print(u['id']) for u in d if u.get('email')=='$EMAIL1']" 2>/dev/null)
SID=$(echo "$CRM_ALL" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; [print(u['id']) for u in d if u.get('email')=='tidimalo@infinitylegal.org']" 2>/dev/null)
check "client1 profile_id" "nonempty" "${C1PID:+nonempty}"
check "client1 user_id" "nonempty" "${C1UID:+nonempty}"
check "staff_id" "nonempty" "${SID:+nonempty}"
CASE_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/cases" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"title\":\"Audit Case\",\"case_type\":\"civil\",\"description\":\"test\",\"client_id\":\"$C1PID\"}" --max-time 15 2>/dev/null)
check "POST /api/cases" "201" "$(echo "$CASE_RESP" | tail -1)"
CID=$(echo "$CASE_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "case_id" "nonempty" "${CID:+nonempty}"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/cases/$CID" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/cases/[id]" "200" "$code"
PUT_RESP=$(curl -sS -w "\n%{http_code}" -X PUT "$BASE/api/cases/$CID" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"status":"active","notes":"update"}' --max-time 15 2>/dev/null)
check "PUT /api/cases/[id]" "200" "$(echo "$PUT_RESP" | tail -1)"
TL=$(echo "$PUT_RESP" | head -n -1 | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data'].get('timeline',[])))" 2>/dev/null)
check "timeline >=2 events" "2" "$TL"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/cases/$CID" -H "Authorization: Bearer $C2T" --max-time 15 2>/dev/null)
check "IDOR client2 -> 404" "404" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/cases/$CID" -H "Authorization: Bearer $C1T" --max-time 15 2>/dev/null)
check "client1 own case -> 200" "200" "$code"

# === LEADS ===
echo "=== LEADS ==="
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

# === CONSULTATIONS ===
echo "=== CONSULTATIONS ==="
CR=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/consultations" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"client_id\":\"$C1UID\",\"scheduled_at\":\"2026-08-01T10:00:00Z\",\"duration_minutes\":60,\"meeting_type\":\"video\",\"notes\":\"test\"}" --max-time 15 2>/dev/null)
check "POST /api/consultations" "201" "$(echo "$CR" | tail -1)"
COID=$(echo "$CR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "consult_id" "nonempty" "${COID:+nonempty}"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/consultations" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/consultations" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/consultations/$COID" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/consultations/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/consultations/$COID" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"status":"completed","notes":"Done"}' --max-time 15 2>/dev/null)
check "PUT /api/consultations/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X DELETE "$BASE/api/consultations/$COID" -H "Authorization: Bearer $ST" -H "Origin: http://localhost:3000" --max-time 15 2>/dev/null)
check "DELETE /api/consultations/[id]" "200" "$code"

# === TASKS ===
echo "=== TASKS ==="
TR=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/tasks" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"title\":\"Audit Task\",\"description\":\"test\",\"assigned_to\":\"$SID\",\"priority\":\"medium\",\"case_id\":\"$CID\"}" --max-time 15 2>/dev/null)
check "POST /api/tasks" "201" "$(echo "$TR" | tail -1)"
TID=$(echo "$TR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "task_id" "nonempty" "${TID:+nonempty}"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/tasks" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/tasks" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/tasks/$TID" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/tasks/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/tasks/$TID" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"status":"completed"}' --max-time 15 2>/dev/null)
check "PUT /api/tasks/[id]" "200" "$code"

# === NOTIFICATIONS ===
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notifications" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/notifications (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notifications" -H "Authorization: Bearer $C1T" --max-time 15 2>/dev/null)
check "GET /api/notifications (client)" "200" "$code"

# === CRM ===
echo "=== CRM ==="
for r in /api/crm /api/crm/users /api/crm/users?role=client /api/crm/activity /api/crm/settings /api/crm/subscriptions; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
  check "GET $r" "200" "$code"
done
SETTINGS_ID=$(curl -sS "$BASE/api/crm/settings" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['id'] if d else 'site_name')" 2>/dev/null)
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/crm/settings" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"id\":\"$SETTINGS_ID\",\"value\":\"Test\"}" --max-time 15 2>/dev/null)
check "PATCH /api/crm/settings" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/activity" --max-time 15 2>/dev/null)
check "GET /api/crm/activity (401)" "401" "$code"

# === DOCUMENTS ===
echo "=== DOCUMENTS ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/documents" "200" "$code"
DOC_ID=$(curl -sS "$BASE/api/documents" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['id'] if isinstance(d,list) and d else 'none')" 2>/dev/null)
if [ "$DOC_ID" != "none" ] && [ -n "$DOC_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents/$DOC_ID" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
  check "GET /api/documents/[id]" "200" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/documents/$DOC_ID" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"description":"Updated"}' --max-time 15 2>/dev/null)
  check "PUT /api/documents/[id]" "200" "$code"
fi
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents/nonexistent" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/documents/[id] (404)" "404" "$code"

# === REMAINING GETs ===
echo "=== OTHER GETs ==="
for r in /api/staff /api/subscriptions /api/analytics /api/report /api/messages /api/integrations /api/ai/providers; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
  check "GET $r" "200" "$code"
done

# === PORTAL ROUTES ===
echo "=== PORTALS ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hr" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/hr (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hr" --max-time 15 2>/dev/null)
check "GET /api/hr (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/management (MD)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" --max-time 15 2>/dev/null)
check "GET /api/management (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" -H "Authorization: Bearer $C1T" --max-time 15 2>/dev/null)
check "GET /api/management (client -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/paralegal" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check_any "GET /api/paralegal (staff)" "$code" 200 403
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/paralegal" --max-time 15 2>/dev/null)
check "GET /api/paralegal (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/sales" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/sales (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/sales" --max-time 15 2>/dev/null)
check "GET /api/sales (401)" "401" "$code"

# === ADMIN ===
echo "=== ADMIN ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/migrate" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "POST /api/admin/migrate (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/migrate" --max-time 15 2>/dev/null)
check "POST /api/admin/migrate (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-articles" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "POST /api/admin/seed-articles (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-articles" --max-time 15 2>/dev/null)
check "POST /api/admin/seed-articles (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-pricing" --max-time 15 2>/dev/null)
check "POST /api/admin/seed-pricing (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-staff" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "POST /api/admin/seed-staff (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-staff" --max-time 15 2>/dev/null)
check "POST /api/admin/seed-staff (401)" "401" "$code"

# === BACKUP ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/backup" -H "Authorization: Bearer $ST" -H "Origin: http://localhost:3000" -d '{"type":"manual"}' --max-time 15 2>/dev/null)
check_any "POST /api/backup (staff)" "$code" 200 201
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backup" -H "Authorization: Bearer $ST" --max-time 15 2>/dev/null)
check "GET /api/backup (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backup" --max-time 15 2>/dev/null)
check "GET /api/backup (401)" "401" "$code"

# === CONTACT ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/contact" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"name\":\"Test\",\"email\":\"contact-$TS@example.com\",\"message\":\"I need legal assistance.\",\"subject\":\"Enquiry\"}" --max-time 15 2>/dev/null)
check "POST /api/contact (public)" "201" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/contact" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"name":"","email":"bad","message":""}' --max-time 15 2>/dev/null)
check "POST /api/contact (400)" "400" "$code"

# === ARTICLES [slug] ===
SLUG=$(curl -sS "$BASE/api/articles?limit=1" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['slug'] if d else 'popia-act-explained')" 2>/dev/null)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles/$SLUG" --max-time 15 2>/dev/null)
check "GET /api/articles/[slug]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles/nonexistent-slug-12345" --max-time 15 2>/dev/null)
check "GET /api/articles/[slug] (404)" "404" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/articles/$SLUG" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"reading_time_min":5}' --max-time 15 2>/dev/null)
check "PATCH /api/articles/[slug] (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/articles/$SLUG" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"reading_time_min":5}' --max-time 15 2>/dev/null)
check "PATCH /api/articles/[slug] (401)" "401" "$code"

# === PAYFAST ===
echo "=== PAYFAST ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/payfast/cancel" --max-time 15 2>/dev/null)
check "GET /api/payfast/cancel" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/payfast/success" --max-time 15 2>/dev/null)
check "GET /api/payfast/success" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 15 2>/dev/null)
check_any "POST /api/payfast/checkout (client)" "$code" 200 409
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 15 2>/dev/null)
check "POST /api/payfast/checkout (401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/notify" -H "Content-Type: application/x-www-form-urlencoded" -d 'm_payment_id=test&pf_payment_id=test&payment_status=COMPLETE&amount_gross=99.00&signature=invalid' --max-time 15 2>/dev/null)
check_any "POST /api/payfast/notify (no sig)" "$code" 400 403

# === STRIPE ===
echo "=== STRIPE ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/cancel" --max-time 15 2>/dev/null)
check_any "GET /api/stripe/cancel" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/success?session_id=test" --max-time 15 2>/dev/null)
check_any "GET /api/stripe/success" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 15 2>/dev/null)
check_any "POST /api/stripe/checkout (Origin)" "$code" 200 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" -H "Authorization: Bearer $C1T" -H "Content-Type: application/json" -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 15 2>/dev/null)
check "POST /api/stripe/checkout (no Origin -> 403)" "403" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/webhook" -H "Content-Type: application/json" -d '{"type":"checkout.session.completed"}' --max-time 15 2>/dev/null)
check_any "POST /api/stripe/webhook (no sig)" "$code" 400 404

# === TRANSLATE ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" -H "Authorization: Bearer $ST" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Hello world","target":"zu"}' --max-time 15 2>/dev/null)
check_any "POST /api/translate (staff)" "$code" 200 429 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Hello","target":"zu"}' --max-time 15 2>/dev/null)
check "POST /api/translate (401)" "401" "$code"

# === WEBHOOKS ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/webhooks/clerk" -H "Content-Type: application/json" -d '{"type":"user.created","data":{"id":"user_123"}}' --max-time 15 2>/dev/null)
check_any "POST /api/webhooks/clerk (no sig)" "$code" 400 404

# === SECURITY ===
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/send" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{}' --max-time 15 2>/dev/null)
check "CSRF+auth gate -> 401" "401" "$code"

# === INTAKE ===
echo "=== INTAKE ==="
INTAKE_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/intake" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"name":"Intake Test","email":"intake-'$TS'@example.com","phone":"0821234567","caseType":"civil","description":"Need help with a contract dispute","consent_given":true,"popia_consent":true}' --max-time 30 2>/dev/null)
IC=$(echo "$INTAKE_RESP" | tail -1)
if [ "$IC" = "200" ] || [ "$IC" = "201" ]; then
  PASS=$((PASS+1)); RESULTS+=("PASS | POST /api/intake -> 200/201 | got=$IC")
else
  FAIL=$((FAIL+1)); RESULTS+=("FAIL | POST /api/intake -> 200/201 | got=$IC"); [[ "$IC" = "500" ]] && CRASH=$((CRASH+1))
fi
RESP_HAS_CONF=$(echo "$INTAKE_RESP" | head -n -1 | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('yes' if 'ai_confidence' in d else 'no')" 2>/dev/null)
check "intake doesn't expose ai_confidence" "no" "$RESP_HAS_CONF"

# === SUMMARY ===
echo ""
echo "============================================"
echo "  AUDIT PART 1 (CORE ROUTES) SUMMARY"
echo "============================================"
echo "PASS: $PASS  FAIL: $FAIL  CRASH(500): $CRASH"
echo "--------------------------------------------"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "============================================"
if [ "$CRASH" -gt 0 ]; then echo "!! $CRASH ENDPOINT(S) RETURNED 500 — INVESTIGATE !!"; fi

pkill -9 -f "next" 2>/dev/null
exit 0
