#!/bin/bash
# ============================================================================
# FULL API AUDIT v2 — fixed test bugs from v1:
#  - cases PUT uses 'active' (not 'in_progress' which isn't a valid Case status)
#  - leads POST uses first_name/last_name (not full_name)
#  - curl -L to follow trailing-slash redirects on dynamic routes
#  - IDOR check uses a SECOND client (not the same one the case was created for)
#  - AI/intake routes tested with longer timeouts
# ============================================================================
set +e
cd /home/z/my-project

BASE=http://127.0.0.1:3000
TS=$(date +%s)
PASS=0
FAIL=0
declare -a RESULTS

check() {
  local name="$1"; local expected="$2"; local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    PASS=$((PASS+1))
    RESULTS+=("PASS | $name | got=$actual")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("FAIL | $name | expected=$expected got=$actual")
  fi
}

echo "============================================"
echo "  FULL API AUDIT v2 — Infinity Legal ZA"
echo "============================================"

# --- 1. Start fresh server ---
pkill -9 -f "next" 2>/dev/null
sleep 2
# Use 2560MB heap (sandbox has 3.5GB available). Disable Next.js memory-restart
# which kills in-flight requests when memory pressure rises during cold compiles.
NEXT_PRIVATE_DEBUG_MEMORY=0 NODE_OPTIONS="--max-old-space-size=2560 --max-semi-space-size=64" node node_modules/.bin/next dev -p 3000 --webpack >> dev.log 2>&1 &
echo "[$(date)] server starting (heap=2560MB)..."

UP=0
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/health --max-time 5 2>/dev/null)
  if [ "$code" = "200" ]; then echo "[$(date)] HEALTHY after $((i*2))s"; UP=1; break; fi
  sleep 2
done
if [ "$UP" != "1" ]; then echo "FATAL: server did not start"; exit 1; fi

# --- 2. Warm up routes ---
echo "[$(date)] warming routes..."
for r in /api/health /api/pricing /api/articles /api/holidays; do
  curl -s -o /dev/null $BASE$r --max-time 30 2>/dev/null
done

# --- 3. PUBLIC ROUTES ---
echo ""
echo "=== PUBLIC ROUTES ==="
for route in "/api/health" "/api/pricing" "/api/holidays"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$route" --max-time 30 2>/dev/null)
  check "GET $route" "200" "$code"
done
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles?limit=5" --max-time 30 2>/dev/null)
check "GET /api/articles?limit=5" "200" "$code"
PCOUNT=$(curl -sS $BASE/api/pricing --max-time 30 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
check "pricing has 3 plans" "3" "$PCOUNT"

# --- 4. AUTH: signup TWO clients (for IDOR test) ---
echo ""
echo "=== AUTH FLOW ==="
EMAIL1="audit1-${TS}@example.com"
EMAIL2="audit2-${TS}@example.com"

SIGNUP1=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/signup \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"AuditTest!2025\",\"full_name\":\"Audit One\",\"phone\":\"0821234567\",\"consent_given\":true,\"popia_consent\":true}" --max-time 30 2>/dev/null)
check "POST /api/auth/signup (client1)" "201" "$(echo "$SIGNUP1" | tail -1)"

SIGNUP2=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/signup \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"AuditTest!2025\",\"full_name\":\"Audit Two\",\"phone\":\"0821234568\",\"consent_given\":true,\"popia_consent\":true}" --max-time 30 2>/dev/null)
check "POST /api/auth/signup (client2 for IDOR)" "201" "$(echo "$SIGNUP2" | tail -1)"

LOGIN1=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"AuditTest!2025\"}" --max-time 30 2>/dev/null)
check "POST /api/auth/login (client1)" "200" "$(echo "$LOGIN1" | tail -1)"
CLIENT1_TOKEN=$(echo "$LOGIN1" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "client1 token" "nonempty" "${CLIENT1_TOKEN:+nonempty}"

LOGIN2=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"AuditTest!2025\"}" --max-time 30 2>/dev/null)
CLIENT2_TOKEN=$(echo "$LOGIN2" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "client2 token (for IDOR)" "nonempty" "${CLIENT2_TOKEN:+nonempty}"

# Profile
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/auth/profile -H "Authorization: Bearer $CLIENT1_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/auth/profile (authed)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/auth/profile --max-time 30 2>/dev/null)
check "GET /api/auth/profile (no auth -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/auth/verify -H "Authorization: Bearer $CLIENT1_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/auth/verify" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"wrong\"}" --max-time 30 2>/dev/null)
check "wrong password -> 401" "401" "$code"

# --- 5. STAFF LOGIN ---
echo ""
echo "=== STAFF AUTH ==="
STAFF=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 30 2>/dev/null)
check "staff login" "200" "$(echo "$STAFF" | tail -1)"
STAFF_TOKEN=$(echo "$STAFF" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "staff token" "nonempty" "${STAFF_TOKEN:+nonempty}"

# --- 6. DASHBOARD ---
echo ""
echo "=== DASHBOARD ==="
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/dashboard -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/dashboard (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/dashboard -H "Authorization: Bearer $CLIENT1_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/dashboard (client)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/dashboard --max-time 30 2>/dev/null)
check "GET /api/dashboard (no auth -> 401)" "401" "$code"

# --- 7. COMMUNICATIONS ---
echo ""
echo "=== COMMUNICATIONS ==="
for r in /api/communications/status /api/communications/templates /api/communications/logs; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
  check "GET $r" "200" "$code"
done

# --- 8. CASES CRUD ---
echo ""
echo "=== CASES CRUD ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/cases" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/cases (staff)" "200" "$code"

# Get client1's profile_id — CRM users WITHOUT role filter so we get staff + clients
CRM_ALL=$(curl -sS "$BASE/api/crm/users" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)

# Find client1's profile_id (Client table PK — needed by POST /api/cases)
CLIENT1_PROFILE_ID=$(echo "$CRM_ALL" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
for u in d:
  if u.get('email')=='$EMAIL1' and u.get('client_profile_id'):
    print(u['client_profile_id']); break
" 2>/dev/null)
check "client1 profile_id found" "nonempty" "${CLIENT1_PROFILE_ID:+nonempty}"

# Find client1's USER ID (User table PK — needed by POST /api/consultations,
# because Consultation.client_id references User.id, not Client.id)
CLIENT1_USER_ID=$(echo "$CRM_ALL" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
for u in d:
  if u.get('email')=='$EMAIL1': print(u['id']); break
" 2>/dev/null)
check "client1 user_id found" "nonempty" "${CLIENT1_USER_ID:+nonempty}"

# Find staff user ID for task assignment
STAFF_ID=$(echo "$CRM_ALL" | python3 -c "
import sys,json
d=json.load(sys.stdin)['data']
for u in d:
  if u.get('email')=='tidimalo@infinitylegal.org': print(u['id']); break
" 2>/dev/null)
check "staff_id found" "nonempty" "${STAFF_ID:+nonempty}"

# Create case for client1
CASE_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/cases" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"title\":\"Audit Test Case\",\"case_type\":\"civil\",\"description\":\"Created by API audit\",\"client_id\":\"$CLIENT1_PROFILE_ID\"}" --max-time 30 2>/dev/null)
check "POST /api/cases" "201" "$(echo "$CASE_RESP" | tail -1)"
CASE_ID=$(echo "$CASE_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "case_id extractable" "nonempty" "${CASE_ID:+nonempty}"

# Get case detail
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/cases/$CASE_ID" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/cases/[id] (staff)" "200" "$code"

# Update case — use 'active' (valid status), NOT 'in_progress'
PUT_RESP=$(curl -sS -w "\n%{http_code}" -X PUT "$BASE/api/cases/$CASE_ID" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"status":"active","notes":"Audit update"}' --max-time 30 2>/dev/null)
check "PUT /api/cases/[id] (status=active)" "200" "$(echo "$PUT_RESP" | tail -1)"

# Timeline events after update (CASE_CREATED + status_change = 2)
TL_COUNT=$(echo "$PUT_RESP" | head -n -1 | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data'].get('timeline',[])))" 2>/dev/null)
check "timeline has >=2 events after update" "2" "$TL_COUNT"

# IDOR: client2 (different client) cannot read client1's case -> 404
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/cases/$CASE_ID" -H "Authorization: Bearer $CLIENT2_TOKEN" --max-time 30 2>/dev/null)
check "IDOR: client2 cannot read client1's case -> 404" "404" "$code"

# client1 CAN read their own case -> 200
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/cases/$CASE_ID" -H "Authorization: Bearer $CLIENT1_TOKEN" --max-time 30 2>/dev/null)
check "client1 can read own case -> 200" "200" "$code"

# --- 9. LEADS (use first_name/last_name, not full_name) ---
echo ""
echo "=== LEADS ==="
LEAD_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/leads" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"first_name\":\"Lead\",\"last_name\":\"Test\",\"email\":\"lead-$TS@example.com\",\"phone\":\"0821234567\",\"case_type\":\"civil\",\"description\":\"Test lead\"}" --max-time 30 2>/dev/null)
check "POST /api/leads" "201" "$(echo "$LEAD_RESP" | tail -1)"
LEAD_ID=$(echo "$LEAD_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "lead_id extractable" "nonempty" "${LEAD_ID:+nonempty}"

# Convert lead (use -L to follow trailing-slash redirect)
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X POST "$BASE/api/leads/$LEAD_ID/convert" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Origin: http://localhost:3000" --max-time 30 2>/dev/null)
check "POST /api/leads/[id]/convert" "201" "$code"

# Idempotent re-convert
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X POST "$BASE/api/leads/$LEAD_ID/convert" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Origin: http://localhost:3000" --max-time 30 2>/dev/null)
check "re-convert (idempotent) -> 200" "200" "$code"

# Unauth convert
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X POST "$BASE/api/leads/$LEAD_ID/convert" -H "Origin: http://localhost:3000" --max-time 30 2>/dev/null)
check "unauth convert -> 401" "401" "$code"

# --- 10. CONSULTATIONS (use -L for trailing slash) ---
echo ""
echo "=== CONSULTATIONS ==="
# Consultation.client_id references User.id (NOT Client.id) per the Prisma schema.
CONSULT_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/consultations" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"client_id\":\"$CLIENT1_USER_ID\",\"scheduled_at\":\"2026-08-01T10:00:00Z\",\"duration_minutes\":60,\"meeting_type\":\"video\",\"notes\":\"Audit consult\"}" --max-time 30 2>/dev/null)
check "POST /api/consultations" "201" "$(echo "$CONSULT_RESP" | tail -1)"
CONSULT_ID=$(echo "$CONSULT_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "consult_id extractable" "nonempty" "${CONSULT_ID:+nonempty}"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/consultations" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/consultations" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/consultations/$CONSULT_ID" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/consultations/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/consultations/$CONSULT_ID" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"status":"completed","notes":"Done"}' --max-time 30 2>/dev/null)
check "PUT /api/consultations/[id]" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -L -X DELETE "$BASE/api/consultations/$CONSULT_ID" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Origin: http://localhost:3000" --max-time 30 2>/dev/null)
check "DELETE /api/consultations/[id]" "200" "$code"

# --- 11. TASKS ---
echo ""
echo "=== TASKS ==="
TASK_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/tasks" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"title\":\"Audit Task\",\"description\":\"Test\",\"assigned_to\":\"$STAFF_ID\",\"priority\":\"medium\",\"case_id\":\"$CASE_ID\"}" --max-time 30 2>/dev/null)
check "POST /api/tasks" "201" "$(echo "$TASK_RESP" | tail -1)"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/tasks" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/tasks" "200" "$code"

# --- 12. NOTIFICATIONS ---
echo ""
echo "=== NOTIFICATIONS ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notifications" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/notifications (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notifications" -H "Authorization: Bearer $CLIENT1_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/notifications (client)" "200" "$code"

# --- 13. CRM ---
echo ""
echo "=== CRM ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/crm" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/users" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/crm/users" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/users?role=client" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "GET /api/crm/users?role=client" "200" "$code"

# --- 14. DOCUMENTS / STAFF / SUBS / ANALYTICS / REPORT / MESSAGES / INTEGRATIONS ---
# Run these BEFORE the slow intake/AI routes so they don't get server-reaped.
echo ""
echo "=== REMAINING GET ROUTES (batch) ==="
for r in /api/documents /api/staff /api/subscriptions /api/analytics /api/report /api/messages /api/integrations /api/ai/providers; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$r" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
  check "GET $r" "200" "$code"
done

# --- 15. SECURITY ---
echo ""
echo "=== SECURITY ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/send" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{}' --max-time 30 2>/dev/null)
check "CSRF+auth gate on /api/communications/send (no token) -> 401" "401" "$code"

# --- 16. SIMULATION DATA CHECK ---
echo ""
echo "=== SIMULATION DATA ==="
INTAKE_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/intake" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"name":"Intake Test","email":"intake-'$TS'@example.com","phone":"0821234567","caseType":"civil","description":"Need help with a contract dispute","consent_given":true,"popia_consent":true}' --max-time 60 2>/dev/null)
INTAKE_CODE=$(echo "$INTAKE_RESP" | tail -1)
if [ "$INTAKE_CODE" = "200" ] || [ "$INTAKE_CODE" = "201" ]; then
  check "POST /api/intake -> 200/201" "ok" "ok"
else
  check "POST /api/intake -> 200/201" "ok" "FAIL($INTAKE_CODE)"
fi
# The intake API stores ai_confidence in the DB but does NOT expose it in the
# response (by design — it's an internal field). Verify the response doesn't
# claim a fake confidence value, and that the DB record has null.
INTAKE_ID=$(echo "$INTAKE_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
# The response should NOT contain an ai_confidence field (it's internal)
RESP_HAS_CONF=$(echo "$INTAKE_RESP" | head -n -1 | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print('yes' if 'ai_confidence' in d else 'no')" 2>/dev/null)
check "intake response does not expose ai_confidence" "no" "$RESP_HAS_CONF"
# Verify the DB record has ai_confidence=null (no fake 0.85)
DB_CONF=$(cd /home/z/my-project && bunx tsx scripts/check-ai-conf.ts "$INTAKE_ID" 2>/dev/null | tail -1)
check "DB ai_confidence is null (no fake 0.85)" "None" "$DB_CONF"

# --- 17. AI ROUTES ---
echo ""
echo "=== AI ROUTES (graceful handling) ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/chat" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"message":"Hello"}' --max-time 60 2>/dev/null)
if [ "$code" = "200" ] || [ "$code" = "429" ] || [ "$code" = "503" ]; then
  check "POST /api/ai/chat (graceful: $code)" "$code" "$code"
else
  check "POST /api/ai/chat (graceful)" "200/429/503" "$code"
fi

# --- SUMMARY ---
echo ""
echo "============================================"
echo "  AUDIT SUMMARY"
echo "============================================"
echo "PASS: $PASS  FAIL: $FAIL"
echo "--------------------------------------------"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "============================================"

pkill -9 -f "next" 2>/dev/null
exit 0
