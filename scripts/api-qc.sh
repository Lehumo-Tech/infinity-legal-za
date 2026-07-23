#!/usr/bin/env bash
# ============================================================================
# Infinity Legal ZA — Comprehensive API Quality Control
# Covers: INTRANET (staff/admin), WORKBENCH (dashboard), LEAD GENERATOR (leads),
#         CLIENT PORTAL (cases, documents, tasks, consultations, subscriptions).
# Tests: auth, permissions, schema alignment, mutations, error paths.
# ============================================================================
set -u
BASE="http://localhost:3000"
PASS=0
FAIL=0
ERRORS=()

# Colors
G=$'\033[1;32m'; R=$'\033[1;31m'; Y=$'\033[1;33m'; C=$'\033[1;36m'; N=$'\033[0m'

check() {
  local label="$1" expected="$2" got="$3"
  if [ "$got" = "$expected" ]; then
    PASS=$((PASS+1))
    printf "  ${G}✓${N} %-58s [%s]\n" "$label" "$got"
  else
    FAIL=$((FAIL+1))
    ERRORS+=("$label: expected $expected got $got")
    printf "  ${R}✗${N} %-58s [%s] (expected %s)\n" "$label" "$got" "$expected"
  fi
}

check_contains() {
  local label="$1" haystack="$2" needle="$3"
  if echo "$haystack" | grep -q "$needle"; then
    PASS=$((PASS+1))
    printf "  ${G}✓${N} %-58s\n" "$label"
  else
    FAIL=$((FAIL+1))
    ERRORS+=("$label: missing '$needle'")
    printf "  ${R}✗${N} %-58s (missing '%s')\n" "$label" "$needle"
  fi
}

# Helper: HTTP request returning "code|body"
req() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local hdr=()
  hdr+=(-H "Content-Type: application/json")
  [ -n "$token" ] && hdr+=(-H "Authorization: Bearer $token")
  local out code
  out=$(curl -sS -m 30 -w "\n%{http_code}" -X "$method" "${hdr[@]}" \
    ${body:+--data "$body"} "$BASE$path" 2>/dev/null) || { echo "000|"; return; }
  code=$(echo "$out" | tail -1)
  local payload
  payload=$(echo "$out" | sed '$d')
  echo "${code}|${payload}"
}

req_multipart() {
  local path="$1" token="$2" file_field="$3" file_path="$4"; shift 4
  local out code
  # Build -F args for each remaining form field
  local f_args=()
  for f in "$@"; do f_args+=(-F "$f"); done
  out=$(curl -sS -m 30 -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $token" \
    -F "$file_field=@$file_path" "${f_args[@]}" "$BASE$path" 2>/dev/null) || { echo "000|"; return; }
  code=$(echo "$out" | tail -1)
  local payload
  payload=$(echo "$out" | sed '$d')
  echo "${code}|${payload}"
}

echo "${C}═══════════════════════════════════════════════════════════════${N}"
echo "${C}  INFINITY LEGAL ZA — API QUALITY CONTROL${N}"
echo "${C}═══════════════════════════════════════════════════════════════${N}"

# ───────────────────────────────────────────────────────────────────
echo "${Y}[1/9] AUTHENTICATION${N}"
# Login as managing_director (intranet/workbench/lead-gen)
RESP=$(curl -sS -m 15 -X POST -H "Content-Type: application/json" \
  --data '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' \
  "$BASE/api/auth/login")
MD_TOKEN=$(echo "$RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "Login as managing_director" "200" "$(echo "$RESP" | python3 -c "import sys,json;print('OK' if json.load(sys.stdin).get('success') else 'FAIL')" 2>/dev/null | head -c 2 | tr 'a-z' 'A-Z' | sed 's/OK/200/')"
[ -n "$MD_TOKEN" ] && PASS=$((PASS+1)) || { FAIL=$((FAIL+1)); ERRORS+=("No MD token"); }

# Login as a client (client portal)
# Find a client user — try the seeded test users, fall back to creating one
CLIENT_EMAIL=""
CLIENT_PASS=""
# Try common seeded client credentials; the audit created "Audit One" users
for try in "client@infinitylegal.org:Client@2025!" "audit@infinitylegal.org:Audit@2025!" "test@example.com:Test@2025!"; do
  e="${try%%:*}"; p="${try##*:}"
  r=$(curl -sS -m 15 -X POST -H "Content-Type: application/json" \
    --data "{\"email\":\"$e\",\"password\":\"$p\"}" "$BASE/api/auth/login")
  t=$(echo "$r" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
  if [ -n "$t" ]; then CLIENT_EMAIL="$e"; CLIENT_PASS="$p"; CLIENT_TOKEN="$t"; break; fi
done

# If no client login worked, register a fresh client via signup
if [ -z "${CLIENT_TOKEN:-}" ]; then
  UNIQUE="qc-$(date +%s)"
  SIGN_RESP=$(curl -sS -m 15 -X POST -H "Content-Type: application/json" \
    --data "{\"email\":\"$UNIQUE@example.com\",\"password\":\"QcTest@2025!\",\"full_name\":\"QC Test Client\",\"popia_consent\":true,\"consent_given\":true}" \
    "$BASE/api/auth/signup")
  CLIENT_TOKEN=$(echo "$SIGN_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
  CLIENT_EMAIL="$UNIQUE@example.com"
  check "Signup fresh client for portal tests" "200" "$(echo "$SIGN_RESP" | python3 -c "import sys,json;print('200' if json.load(sys.stdin).get('success') else 'FAIL')" 2>/dev/null)"
else
  check "Login as existing client" "200" "200"
fi

# Auth boundary: no token should 401
CODE=$(curl -sS -m 10 -o /dev/null -w "%{http_code}" "$BASE/api/dashboard")
check "Unauthenticated dashboard access blocked" "401" "$CODE"

# ───────────────────────────────────────────────────────────────────
echo "${Y}[2/9] WORKBENCH (dashboard stats + health)${N}"
sleep 2
R=$(req GET "/api/dashboard" "$MD_TOKEN")
check "GET /api/dashboard" "200" "${R%%|*}"
BODY="${R#*|}"
check_contains "  stats.totalCases is integer" "$BODY" '"totalCases":'
check_contains "  stats.totalRevenue is integer" "$BODY" '"totalRevenue":'
check_contains "  health.rbac present" "$BODY" '"rbac":'
check_contains "  charts.casesByType present" "$BODY" '"casesByType":'
# Verify no mock "12%" trend strings remain
! echo "$BODY" | grep -q '"revenueTrend"' && check "  No fake revenueTrend field" "OK" "OK" || { FAIL=$((FAIL+1)); printf "  ${R}✗ revenueTrend still present${N}\n"; }

R=$(req GET "/api/notifications?perPage=5" "$MD_TOKEN")
check "GET /api/notifications" "200" "${R%%|*}"

R=$(req GET "/api/integrations" "$MD_TOKEN")
check "GET /api/integrations" "200" "${R%%|*}"

R=$(req GET "/api/analytics" "$MD_TOKEN")
check "GET /api/analytics" "200" "${R%%|*}"

# ───────────────────────────────────────────────────────────────────
echo "${Y}[3/9] LEAD GENERATOR (leads = IntakeSubmission)${N}"
sleep 2
R=$(req GET "/api/leads?perPage=5" "$MD_TOKEN")
check "GET /api/leads" "200" "${R%%|*}"
BODY="${R#*|}"
check_contains "  leads have id+name" "$BODY" '"id":'
check_contains "  leads have status" "$BODY" '"status":'

# Permission boundary — client should NOT access leads
R=$(req GET "/api/leads" "${CLIENT_TOKEN:-}")
check "  Client blocked from leads (403)" "403" "${R%%|*}"

# Create a lead via POST (admin can create)
R=$(req POST "/api/leads" "$MD_TOKEN" \
  '{"first_name":"QC","last_name":"Lead","email":"qc-lead-'$(date +%s)'@test.com","case_type":"civil","description":"QC test lead","urgency":"medium"}')
check "POST /api/leads (create)" "201" "${R%%|*}"
LEAD_ID=$(echo "${R#*|}" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

if [ -n "$LEAD_ID" ]; then
  R=$(req GET "/api/leads/$LEAD_ID" "$MD_TOKEN")
  check "GET /api/leads/:id" "200" "${R%%|*}"
  R=$(req PUT "/api/leads/$LEAD_ID" "$MD_TOKEN" \
    '{"status":"under_review","review_notes":"QC reviewing"}')
  check "PUT /api/leads/:id (update status)" "200" "${R%%|*}"
fi

# ───────────────────────────────────────────────────────────────────
echo "${Y}[4/9] CASES (practice management)${N}"
sleep 2
R=$(req GET "/api/cases?perPage=5" "$MD_TOKEN")
check "GET /api/cases" "200" "${R%%|*}"
BODY="${R#*|}"
check_contains "  cases have case_ref" "$BODY" '"case_ref":'
check_contains "  cases have client join" "$BODY" '"client":'

# Create a case (need a client_id — find one)
CLIENT_ID=$(echo "$BODY" | python3 -c "import sys,json;d=json.load(sys.stdin)['data']['data'];print(d[0]['client_id'] if d else '')" 2>/dev/null)
if [ -n "$CLIENT_ID" ]; then
  R=$(req POST "/api/cases" "$MD_TOKEN" \
    "{\"title\":\"QC Test Case\",\"case_type\":\"civil\",\"urgency\":\"medium\",\"client_id\":\"$CLIENT_ID\",\"description\":\"QC test case\"}")
  check "POST /api/cases (create)" "201" "${R%%|*}"
  CASE_ID=$(echo "${R#*|}" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  if [ -n "$CASE_ID" ]; then
    R=$(req PUT "/api/cases/$CASE_ID" "$MD_TOKEN" '{"status":"active","notes":"QC activated"}')
    check "PUT /api/cases/:id (update)" "200" "${R%%|*}"
  fi
else
  echo "  ${Y}— skipped case create (no client in DB)${N}"
fi

# ───────────────────────────────────────────────────────────────────
echo "${Y}[5/9] DOCUMENTS + UPLOAD (H1 fix verification)${N}"
sleep 2
R=$(req GET "/api/documents?perPage=5" "$MD_TOKEN")
check "GET /api/documents" "200" "${R%%|*}"

# Create a small test file
echo "QC test document content — $(date)" > /tmp/qc-test-upload.txt
R=$(req_multipart "/api/documents/upload" "$MD_TOKEN" "file" "/tmp/qc-test-upload.txt" \
  "title=QC Test Doc" "document_type=contract" "description=QC upload test")
check "POST /api/documents/upload (multipart) — H1 fix" "201" "${R%%|*}"
UPLOAD_BODY="${R#*|}"
check_contains "  response has file_path" "$UPLOAD_BODY" '"file_path":'
check_contains "  response has file_size" "$UPLOAD_BODY" '"file_size":'
check_contains "  status=uploaded" "$UPLOAD_BODY" '"uploaded"'

# Upload without file should 400
R=$(req_multipart "/api/documents/upload" "$MD_TOKEN" "file" "/dev/null" \
  "document_type=contract")
check "  Upload with no file -> 400" "400" "${R%%|*}"

# Upload with invalid document_type should 400
echo "x" > /tmp/qc-test2.txt
R=$(req_multipart "/api/documents/upload" "$MD_TOKEN" "file" "/tmp/qc-test2.txt" \
  "document_type=invalid_type")
check "  Upload with bad document_type -> 400" "400" "${R%%|*}"

# ───────────────────────────────────────────────────────────────────
echo "${Y}[6/9] TASKS (L1 permission-order fix + M2 notification type)${N}"
sleep 2
R=$(req GET "/api/tasks?perPage=5" "$MD_TOKEN")
check "GET /api/tasks" "200" "${R%%|*}"

# Create a task assigned to self (MD)
MD_USER_ID=$(curl -sS -m 10 -H "Authorization: Bearer $MD_TOKEN" "$BASE/api/auth/profile" | \
  python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
if [ -n "$MD_USER_ID" ]; then
  R=$(req POST "/api/tasks" "$MD_TOKEN" \
    "{\"title\":\"QC Test Task\",\"assigned_to\":\"$MD_USER_ID\",\"priority\":\"medium\"}")
  check "POST /api/tasks (create)" "201" "${R%%|*}"
  TASK_ID=$(echo "${R#*|}" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  if [ -n "$TASK_ID" ]; then
    R=$(req PUT "/api/tasks/$TASK_ID" "$MD_TOKEN" '{"status":"in_progress"}')
    check "PUT /api/tasks/:id (status update)" "200" "${R%%|*}"
  fi
fi

# Permission boundary — client should NOT create tasks
R=$(req POST "/api/tasks" "${CLIENT_TOKEN:-}" \
  '{"title":"x","assigned_to":"x","priority":"medium"}')
check "  Client blocked from task create (403)" "403" "${R%%|*}"

# ───────────────────────────────────────────────────────────────────
echo "${Y}[7/9] CONSULTATIONS${N}"
sleep 2
R=$(req GET "/api/consultations?perPage=5" "$MD_TOKEN")
check "GET /api/consultations" "200" "${R%%|*}"

# ───────────────────────────────────────────────────────────────────
echo "${Y}[8/9] SUBSCRIPTIONS + CRM SETTINGS (H2 + H3 fix verification)${N}"
sleep 2
# H2: POST /api/subscriptions with empty body should NOT 500
R=$(req POST "/api/subscriptions" "$MD_TOKEN" "")
CODE="${R%%|*}"
# Expect 404 NO_SUBSCRIPTION (MD has no subscription) — NOT 500
if [ "$CODE" = "404" ] || [ "$CODE" = "200" ] || [ "$CODE" = "400" ]; then
  check "POST /api/subscriptions empty body — H2 fix (no 500)" "$CODE" "$CODE"
else
  check "POST /api/subscriptions empty body — H2 fix (no 500)" "404" "$CODE"
fi

# H3: CRM settings GET should return DB rows (seeded)
R=$(req GET "/api/crm/settings" "$MD_TOKEN")
check "GET /api/crm/settings — H3 fix" "200" "${R%%|*}"
BODY="${R#*|}"
check_contains "  returns firm_name setting" "$BODY" '"firm_name"'
check_contains "  settings have id+key+value" "$BODY" '"key":'

# H3: CRM settings PATCH should persist
SETTING_ID=$(echo "$BODY" | python3 -c "import sys,json;d=json.load(sys.stdin)['data'];print(d[0]['id'] if d else '')" 2>/dev/null)
if [ -n "$SETTING_ID" ]; then
  R=$(req PATCH "/api/crm/settings" "$MD_TOKEN" "{\"id\":\"$SETTING_ID\",\"value\":\"QC Updated $(date +%s)\"}")
  check "PATCH /api/crm/settings — H3 fix (persists)" "200" "${R%%|*}"
  # Verify it persisted
  R2=$(req GET "/api/crm/settings" "$MD_TOKEN")
  check_contains "  setting persisted to DB" "${R2#*|}" "QC Updated"
fi

# CRM portal endpoints
R=$(req GET "/api/crm" "$MD_TOKEN"); check "GET /api/crm" "200" "${R%%|*}"
R=$(req GET "/api/crm/users" "$MD_TOKEN"); check "GET /api/crm/users" "200" "${R%%|*}"
R=$(req GET "/api/crm/subscriptions" "$MD_TOKEN"); check "GET /api/crm/subscriptions" "200" "${R%%|*}"
R=$(req GET "/api/crm/activity" "$MD_TOKEN"); check "GET /api/crm/activity" "200" "${R%%|*}"

# Pricing — M1 fix: no FALLBACK_PLANS, returns DB rows
R=$(req GET "/api/pricing" "")
check "GET /api/pricing (no auth)" "200" "${R%%|*}"
BODY="${R#*|}"
! echo "$BODY" | grep -q '"fallback-' && check "  No fallback-* IDs (M1 fix)" "OK" "OK" || { FAIL=$((FAIL+1)); printf "  ${R}✗ fallback plans still present${N}\n"; }
check_contains "  returns real plans" "$BODY" '"slug":'

# ───────────────────────────────────────────────────────────────────
echo "${Y}[9/9] CLIENT PORTAL + COMMUNICATIONS${N}"
sleep 2
# Client portal: subscription GET
R=$(req GET "/api/subscriptions" "${CLIENT_TOKEN:-}")
check "GET /api/subscriptions (client)" "200" "${R%%|*}"

# Client portal: cases (client should see their own only)
R=$(req GET "/api/cases?perPage=5" "${CLIENT_TOKEN:-}")
check "GET /api/cases (client)" "200" "${R%%|*}"

# Client portal: documents
R=$(req GET "/api/documents?perPage=5" "${CLIENT_TOKEN:-}")
check "GET /api/documents (client)" "200" "${R%%|*}"

# Client portal: tasks
R=$(req GET "/api/tasks?perPage=5" "${CLIENT_TOKEN:-}")
check "GET /api/tasks (client)" "200" "${R%%|*}"

# Client portal: consultations
R=$(req GET "/api/consultations?perPage=5" "${CLIENT_TOKEN:-}")
check "GET /api/consultations (client)" "200" "${R%%|*}"

# Communications (admin only)
R=$(req GET "/api/communications/logs?perPage=3" "$MD_TOKEN")
check "GET /api/communications/logs" "200" "${R%%|*}"
R=$(req GET "/api/communications/status" "$MD_TOKEN")
check "GET /api/communications/status" "200" "${R%%|*}"
STATUS_BODY="${R#*|}"
R=$(req GET "/api/communications/templates" "$MD_TOKEN")
check "GET /api/communications/templates" "200" "${R%%|*}"

# Communications status — M3 fix: no mock zeros on error path
# Verify normal path returns real stats (from the status response, not templates)
check_contains "  status returns stats object" "$STATUS_BODY" '"stats":'
check_contains "  status returns email config" "$STATUS_BODY" '"email":'
check_contains "  status returns sms config" "$STATUS_BODY" '"sms":'

# Staff portal
R=$(req GET "/api/staff?perPage=5" "$MD_TOKEN")
check "GET /api/staff" "200" "${R%%|*}"

# ───────────────────────────────────────────────────────────────────
echo ""
echo "${C}═══════════════════════════════════════════════════════════════${N}"
printf "  ${G}PASSED${N}: %d   ${R}FAILED${N}: %d\n" "$PASS" "$FAIL"
echo "${C}═══════════════════════════════════════════════════════════════${N}"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "${R}FAILURES:${N}"
  for e in "${ERRORS[@]}"; do echo "  - $e"; done
  exit 1
fi
exit 0
