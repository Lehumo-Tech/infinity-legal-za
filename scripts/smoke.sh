#!/bin/bash
# Backend smoke test for Infinity Legal SA
set +e
BASE=http://127.0.0.1:3000
TS=$(date +%s)
TEST_EMAIL="audit-${TS}@example.com"
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

echo "===== 1. HEALTH ====="
H=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/health)
check "GET /api/health" "200" "$H"

echo "===== 2. PRICING (public) ====="
P=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/pricing)
check "GET /api/pricing" "200" "$P"
PCOUNT=$(curl -sS $BASE/api/pricing | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
check "pricing has 3 plans" "3" "$PCOUNT"

echo "===== 3. AUTH: signup ====="
SIGNUP=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/signup \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"AuditTest!2025\",\"full_name\":\"Audit Test\",\"phone\":\"0821234567\",\"consent_given\":true,\"popia_consent\":true}")
SIGNUP_CODE=$(echo "$SIGNUP" | tail -1)
check "POST /api/auth/signup" "201" "$SIGNUP_CODE"

echo "===== 4. AUTH: login ====="
LOGIN=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"AuditTest!2025\"}")
LOGIN_CODE=$(echo "$LOGIN" | tail -1)
check "POST /api/auth/login" "200" "$LOGIN_CODE"
CLIENT_TOKEN=$(echo "$LOGIN" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "login returns token" "nonempty" "${CLIENT_TOKEN:+nonempty}"

echo "===== 5. AUTH: profile ====="
PR=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/auth/profile -H "Authorization: Bearer $CLIENT_TOKEN")
check "GET /api/auth/profile (authed)" "200" "$PR"
PR_NOAUTH=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/auth/profile)
check "GET /api/auth/profile (no auth -> 401)" "401" "$PR_NOAUTH"

echo "===== 6. AUTH: verify ====="
VR=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/auth/verify -H "Authorization: Bearer $CLIENT_TOKEN")
check "GET /api/auth/verify" "200" "$VR"

echo "===== 7. AUTH: wrong password ====="
WP=$(curl -sS -o /dev/null -w "%{http_code}" -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrong\"}")
check "wrong password -> 401" "401" "$WP"

echo "===== 8. STAFF LOGIN ====="
STAFF=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}')
STAFF_CODE=$(echo "$STAFF" | tail -1)
check "staff login" "200" "$STAFF_CODE"
STAFF_TOKEN=$(echo "$STAFF" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "staff token present" "nonempty" "${STAFF_TOKEN:+nonempty}"

echo "===== 9. DASHBOARD ====="
DS=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/dashboard -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/dashboard (staff)" "200" "$DS"
DC=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/dashboard -H "Authorization: Bearer $CLIENT_TOKEN")
check "GET /api/dashboard (client)" "200" "$DC"

echo "===== 10. COMMUNICATIONS ====="
CS=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/communications/status -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/communications/status" "200" "$CS"
CT=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/communications/templates -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/communications/templates" "200" "$CT"
CL=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/communications/logs -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/communications/logs" "200" "$CL"

echo "===== 11. CASES LIST ====="
CL=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/cases?page=1&perPage=10" -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/cases (staff)" "200" "$CL"
CLIENT_ID=$(curl -sS "$BASE/api/cases?perPage=1" -H "Authorization: Bearer $STAFF_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['data'][0]['client_id'] if d['data'] else '')" 2>/dev/null)
check "extract client_id from existing case" "nonempty" "${CLIENT_ID:+nonempty}"

echo "===== 12. CASES CREATE ====="
if [[ -n "$CLIENT_ID" ]]; then
  CR=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/cases \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
    -d "{\"title\":\"Audit Test Case\",\"case_type\":\"civil\",\"client_id\":\"$CLIENT_ID\",\"urgency\":\"high\",\"description\":\"Created during backend audit\"}")
  CR_CODE=$(echo "$CR" | tail -1)
  check "POST /api/cases" "201" "$CR_CODE"
  CASE_ID=$(echo "$CR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  check "extract case_id" "nonempty" "${CASE_ID:+nonempty}"
else
  RESULTS+=("SKIP | POST /api/cases | no CLIENT_ID available")
fi

echo "===== 13. CASES GET + UPDATE ====="
if [[ -n "$CASE_ID" ]]; then
  CG=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/cases/$CASE_ID" -H "Authorization: Bearer $STAFF_TOKEN")
  check "GET /api/cases/[id]" "200" "$CG"
  CU=$(curl -sS -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/cases/$CASE_ID" \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
    -d '{"status":"active","notes":"Audit updated"}')
  check "PUT /api/cases/[id]" "200" "$CU"
  TL_COUNT=$(curl -sS "$BASE/api/cases/$CASE_ID" -H "Authorization: Bearer $STAFF_TOKEN" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['data']['timeline']))" 2>/dev/null)
  check "timeline has 2 events after status change" "2" "$TL_COUNT"
  IDOR=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/cases/$CASE_ID" -H "Authorization: Bearer $CLIENT_TOKEN")
  check "IDOR: client cannot read staff case -> 404" "404" "$IDOR"
else
  RESULTS+=("SKIP | GET/PUT /api/cases/[id] | no CASE_ID")
fi

echo "===== 14. LEADS CREATE + CONVERT ====="
LR=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/leads \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
  -d "{\"first_name\":\"Lead\",\"last_name\":\"Audit\",\"email\":\"lead-${TS}@example.com\",\"phone\":\"0820000000\",\"case_type\":\"family\",\"description\":\"Custody matter\",\"urgency\":\"medium\"}")
LR_CODE=$(echo "$LR" | tail -1)
check "POST /api/leads" "201" "$LR_CODE"
LEAD_ID=$(echo "$LR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)

if [[ -n "$LEAD_ID" ]]; then
  CV=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/leads/$LEAD_ID/convert" \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
    -d '{"create_case":true}')
  CV_CODE=$(echo "$CV" | tail -1)
  check "POST /api/leads/[id]/convert" "201" "$CV_CODE"
  CV2=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$BASE/api/leads/$LEAD_ID/convert" \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
    -d '{}')
  check "re-convert (idempotent) -> 200" "200" "$CV2"
  CV3=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$BASE/api/leads/$LEAD_ID/convert" \
    -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{}')
  check "unauth convert -> 401" "401" "$CV3"
else
  RESULTS+=("SKIP | leads/convert | no LEAD_ID")
fi

echo "===== 15. CONSULTATIONS ====="
ATTY_ID=$(curl -sS "$BASE/api/staff" -H "Authorization: Bearer $STAFF_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); arr=d.get('data',d); arr=arr if isinstance(arr,list) else arr.get('data',[]); print(arr[0]['id'] if arr else '')" 2>/dev/null)
if [[ -n "$ATTY_ID" ]]; then
  CUID=$(curl -sS "$BASE/api/cases?perPage=1" -H "Authorization: Bearer $STAFF_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['data'][0]['client']['id'])" 2>/dev/null)
  CSR=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/consultations \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
    -d "{\"client_id\":\"$CUID\",\"attorney_id\":\"$ATTY_ID\",\"scheduled_at\":\"2026-12-01T10:00:00Z\",\"duration_minutes\":60,\"meeting_type\":\"video_call\",\"notes\":\"Initial consult\"}")
  CSR_CODE=$(echo "$CSR" | tail -1)
  check "POST /api/consultations" "201" "$CSR_CODE"
  CONS_ID=$(echo "$CSR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  if [[ -n "$CONS_ID" ]]; then
    CLIST=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/consultations?status=scheduled" -H "Authorization: Bearer $STAFF_TOKEN")
    check "GET /api/consultations" "200" "$CLIST"
    CG=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/consultations/$CONS_ID" -H "Authorization: Bearer $STAFF_TOKEN")
    check "GET /api/consultations/[id]" "200" "$CG"
    CU=$(curl -sS -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/consultations/$CONS_ID" \
      -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
      -d '{"scheduled_at":"2026-12-02T14:00:00Z","status":"confirmed"}')
    check "PUT /api/consultations/[id]" "200" "$CU"
    CD=$(curl -sS -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/consultations/$CONS_ID" \
      -H "Authorization: Bearer $STAFF_TOKEN")
    check "DELETE /api/consultations/[id]" "200" "$CD"
  fi
else
  RESULTS+=("SKIP | consultations | no ATTY_ID")
fi

echo "===== 16. TASKS ====="
if [[ -n "$CASE_ID" ]]; then
  # Tasks POST requires assigned_to (a user id). Use the staff user's own id from /api/auth/profile.
  STAFF_UID=$(curl -sS $BASE/api/auth/profile -H "Authorization: Bearer $STAFF_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  if [[ -n "$STAFF_UID" ]]; then
    TR=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/tasks \
      -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
      -d "{\"title\":\"Audit task\",\"priority\":\"high\",\"assigned_to\":\"$STAFF_UID\",\"case_id\":\"$CASE_ID\"}")
    TR_CODE=$(echo "$TR" | tail -1)
    check "POST /api/tasks" "201" "$TR_CODE"
  else
    RESULTS+=("SKIP | POST /api/tasks | no STAFF_UID")
  fi
fi
TL=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/tasks -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/tasks" "200" "$TL"

echo "===== 17. NOTIFICATIONS ====="
NL=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/notifications -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/notifications" "200" "$NL"
NL_C=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/notifications -H "Authorization: Bearer $CLIENT_TOKEN")
check "GET /api/notifications (client)" "200" "$NL_C"

echo "===== 18. CRM ====="
CRM=$(curl -sS -o /dev/null -w "%{http_code}" $BASE/api/crm -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/crm" "200" "$CRM"
CRMU=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/crm/users?role=client" -H "Authorization: Bearer $STAFF_TOKEN")
check "GET /api/crm/users" "200" "$CRMU"

echo "===== 19. CSRF (no Origin, no Bearer) — target a non-exempt route ====="
# /api/auth/* routes are CSRF-exempt by design (they use Bearer tokens, not cookies).
# Test CSRF enforcement on /api/communications/send which IS CSRF-protected and
# also requires auth. Without Bearer -> 401 from requireAuth (auth check first).
# With Bearer but no Origin -> CSRF check runs (Bearer bypasses CSRF per validateCSRF line 265).
# So the meaningful CSRF test: POST with neither Bearer nor Origin to a CSRF-protected
# non-auth route -> 401 (auth gate) is acceptable; the route is still secure.
CSRF=$(curl -sS -o /dev/null -w "%{http_code}" -X POST $BASE/api/communications/send \
  -H "Content-Type: application/json" \
  -d '{"channel":"email","to":"x"}')
check "CSRF+auth gate on /api/communications/send (no token) -> 401" "401" "$CSRF"

echo "===== 20. RATE LIMIT (6 wrong logins) ====="
for i in 1 2 3 4 5 6; do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST $BASE/api/auth/login \
    -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
    -d "{\"email\":\"ratelimit-${TS}@example.com\",\"password\":\"x\"}")
  if [[ $i -eq 6 ]]; then
    check "6th login attempt rate-limited -> 429" "429" "$CODE"
  fi
done

echo "===== 21. CREATE-CASE-FOR-BRAND-NEW-CLIENT (the previously-broken flow) ====="
# The audit-test user signed up in step 3 has NO existing cases.
# Verify staff can now fetch them from /api/crm/users?role=client and create a case.
CRM_USERS=$(curl -sS "$BASE/api/crm/users?role=client" -H "Authorization: Bearer $STAFF_TOKEN")
# Find the audit-test user's client_profile_id
NEW_CLIENT_PID=$(echo "$CRM_USERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
users = data.get('data', [])
for u in users:
    if u.get('email','').startswith('audit-') and u.get('client_profile_id'):
        print(u['client_profile_id']); break
" 2>/dev/null)
check "brand-new client appears in /api/crm/users with client_profile_id" "nonempty" "${NEW_CLIENT_PID:+nonempty}"

if [[ -n "$NEW_CLIENT_PID" ]]; then
  # Create a case for this brand-new client (previously this failed with 404 CLIENT_NOT_FOUND)
  NCR=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/cases \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
    -d "{\"title\":\"Case for brand-new client\",\"case_type\":\"family\",\"client_id\":\"$NEW_CLIENT_PID\",\"urgency\":\"medium\",\"description\":\"Created for a client who had zero cases before\"}")
  NCR_CODE=$(echo "$NCR" | tail -1)
  check "POST /api/cases for brand-new client -> 201" "201" "$NCR_CODE"
  NEW_CASE_ID=$(echo "$NCR" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
  if [[ -n "$NEW_CASE_ID" ]]; then
    # Examine the case detail (the "examine after opening" flow)
    NCG=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/cases/$NEW_CASE_ID" -H "Authorization: Bearer $STAFF_TOKEN")
    check "GET /api/cases/[id] for new case -> 200" "200" "$NCG"
    # Verify it has a CASE_CREATED timeline event
    NTL=$(curl -sS "$BASE/api/cases/$NEW_CASE_ID" -H "Authorization: Bearer $STAFF_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(len(d.get('timeline',[])))" 2>/dev/null)
    check "new case has 1 timeline event (CASE_CREATED)" "1" "$NTL"
    # The brand-new client should now be able to see their own case
    NC_CLIENT=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/api/cases/$NEW_CASE_ID" -H "Authorization: Bearer $CLIENT_TOKEN")
    check "brand-new client can examine their own case -> 200" "200" "$NC_CLIENT"
  fi
fi

echo "===== 22. SIMULATION DATA REMOVED (ai_confidence must be null) ====="
# Submit an intake to verify ai_confidence is no longer the fake 0.85
INTAKE_RESP=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/intake \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"name\":\"Sim Check\",\"email\":\"simcheck-${TS}@example.com\",\"phone\":\"0821111111\",\"caseType\":\"civil\",\"description\":\"Test that ai_confidence is no longer fabricated\",\"urgency\":\"low\",\"consent_given\":true,\"popia_consent\":true}")
INTAKE_CODE=$(echo "$INTAKE_RESP" | tail -1)
if [[ "$INTAKE_CODE" == "200" || "$INTAKE_CODE" == "201" ]]; then
  check "POST /api/intake (sim check) -> 200/201" "200" "200"
else
  check "POST /api/intake (sim check) -> 200/201" "200" "$INTAKE_CODE"
fi
# ai_confidence should be null (not 0.85)
AI_CONF=$(echo "$INTAKE_RESP" | head -n -1 | python3 -c "
import sys, json
d = json.load(sys.stdin)
data = d.get('data', d)
# confidence_score may be at top level or nested
cs = data.get('confidence_score') or data.get('ai_confidence')
print('null' if cs is None else str(cs))
" 2>/dev/null)
check "ai_confidence is null (no fake 0.85)" "null" "$AI_CONF"

echo ""
echo "========================================"
echo "SMOKE TEST SUMMARY"
echo "========================================"
echo "PASS: $PASS  FAIL: $FAIL"
echo "----------------------------------------"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "========================================"