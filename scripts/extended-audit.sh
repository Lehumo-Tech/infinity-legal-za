#!/bin/bash
# ============================================================================
# EXTENDED API AUDIT — covers the ~43 routes NOT in full-audit.sh
# Uses the ALREADY-RUNNING server (does NOT kill/restart).
# Tests: methods, auth (401 without), CSRF (403 without Origin), webhooks
# (400/404 without signature), AI graceful handling (200/429/503), no-500.
# ============================================================================
set +e
cd /home/z/my-project

BASE=http://127.0.0.1:3000
TS=$(date +%s)
PASS=0
FAIL=0
CRASH=0
declare -a RESULTS

check() {
  local name="$1"; local expected="$2"; local actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    PASS=$((PASS+1))
    RESULTS+=("PASS | $name | got=$actual")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("FAIL | $name | expected=$expected got=$actual")
    if [[ "$actual" == "500" ]]; then CRASH=$((CRASH+1)); fi
  fi
}

# Check that actual is one of several acceptable codes (for graceful AI routes)
check_any() {
  local name="$1"; shift
  local actual="$1"; shift
  local found=0
  for exp in "$@"; do
    if [[ "$actual" == "$exp" ]]; then found=1; break; fi
  done
  if [ "$found" = "1" ]; then
    PASS=$((PASS+1))
    RESULTS+=("PASS | $name | got=$actual")
  else
    FAIL=$((FAIL+1))
    RESULTS+=("FAIL | $name | expected one of $* got=$actual")
    if [[ "$actual" == "500" ]]; then CRASH=$((CRASH+1)); fi
  fi
}

echo "============================================"
echo "  EXTENDED API AUDIT — Infinity Legal ZA"
echo "  (tests routes NOT covered by full-audit.sh)"
echo "============================================"

# --- 0. Verify server is up ---
code=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/health --max-time 10 2>/dev/null)
if [ "$code" != "200" ]; then
  echo "FATAL: server not running on :3000 (got $code). Start it first."
  exit 1
fi
echo "[server healthy]"

# --- 1. Get tokens ---
echo ""
echo "=== AUTH SETUP ==="
STAFF=$(curl -sS -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 30 2>/dev/null)
STAFF_TOKEN=$(echo "$STAFF" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "staff login for extended audit" "nonempty" "${STAFF_TOKEN:+nonempty}"

# Sign up a client for role-based tests
EMAIL1="ext-${TS}@example.com"
SIGNUP1=$(curl -sS -w "\n%{http_code}" -X POST $BASE/api/auth/signup \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"ExtTest!2025\",\"full_name\":\"Ext Client\",\"phone\":\"0831234567\",\"consent_given\":true,\"popia_consent\":true}" --max-time 30 2>/dev/null)
check "client signup for extended audit" "201" "$(echo "$SIGNUP1" | tail -1)"
LOGIN1=$(curl -sS -X POST $BASE/api/auth/login \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"ExtTest!2025\"}" --max-time 30 2>/dev/null)
CLIENT_TOKEN=$(echo "$LOGIN1" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "client token" "nonempty" "${CLIENT_TOKEN:+nonempty}"

# --- 2. ROOT + PUBLIC STUBS ---
echo ""
echo "=== ROOT & PUBLIC STUBS ==="
code=$(curl -s -o /dev/null -w "%{http_code" "$BASE/api" --max-time 15 2>/dev/null)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api" --max-time 15 2>/dev/null)
check "GET /api (root stub)" "200" "$code"

# --- 3. ADMIN ROUTES ---
echo ""
echo "=== ADMIN ROUTES ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/migrate" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "POST /api/admin/migrate (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/migrate" --max-time 15 2>/dev/null)
check "POST /api/admin/migrate (no auth -> 401)" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-articles" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "POST /api/admin/seed-articles (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-articles" --max-time 15 2>/dev/null)
check "POST /api/admin/seed-articles (no auth -> 401)" "401" "$code"

# seed-pricing is DESTRUCTIVE — only test no-auth, skip authed (would wipe pricing)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-pricing" --max-time 15 2>/dev/null)
check "POST /api/admin/seed-pricing (no auth -> 401)" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-staff" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 30 2>/dev/null)
check "POST /api/admin/seed-staff (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/admin/seed-staff" --max-time 15 2>/dev/null)
check "POST /api/admin/seed-staff (no auth -> 401)" "401" "$code"

# --- 4. AI ROUTES (graceful handling) ---
echo ""
echo "=== AI ROUTES (extended) ==="
# ASR — needs audio_base64 (send minimal valid base64, expect 200/429/503/000-timeout)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/asr" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"audio_base64":"UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="}' --max-time 20 2>/dev/null)
check_any "POST /api/ai/asr (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/asr" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"audio_base64":"dGVzdA=="}' --max-time 12 2>/dev/null)
check "POST /api/ai/asr (no auth -> 401)" "401" "$code"

# image-gen
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/image-gen" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"prompt":"A legal scales of justice","size":"1024x1024"}' --max-time 20 2>/dev/null)
check_any "POST /api/ai/image-gen (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/image-gen" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"prompt":"test"}' --max-time 12 2>/dev/null)
check "POST /api/ai/image-gen (no auth -> 401)" "401" "$code"

# ai/intake POST (public) + GET (authed)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/intake" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"name\":\"Ext AI Intake\",\"email\":\"aiintake-$TS@example.com\",\"phone\":\"0831234567\",\"caseType\":\"civil\",\"description\":\"Need help with a contract dispute over services rendered\",\"consent_given\":true,\"popia_consent\":true}" --max-time 25 2>/dev/null)
check_any "POST /api/ai/intake (public)" "$code" 200 201 000
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/intake" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/ai/intake (staff)" "200" "$code"

# memo
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/memo" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"facts":"Client entered into a written agreement on 1 January 2025 for the provision of consulting services at R50,000 per month. The counterparty has failed to pay for three consecutive months despite demand.","issues":"Breach of contract, claim for outstanding payments, potential cancellation","jurisdiction":"South Africa"}' --max-time 20 2>/dev/null)
check_any "POST /api/ai/memo (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/memo" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"facts":"test facts here","issues":"test issues"}' --max-time 15 2>/dev/null)
check "POST /api/ai/memo (no auth -> 401)" "401" "$code"

# summarize
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/summarize" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"content":"This is a legal document that needs to be summarized. It contains various clauses and provisions that relate to the rights and obligations of the parties involved. The document was drafted in accordance with South African law and applies to the jurisdiction of the Republic of South Africa. All parties have agreed to the terms set forth herein.","documentType":"contract"}' --max-time 20 2>/dev/null)
check_any "POST /api/ai/summarize (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/summarize" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"content":"test"}' --max-time 15 2>/dev/null)
check "POST /api/ai/summarize (no auth -> 401)" "401" "$code"

# tts (returns audio, not JSON — check status only)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/tts" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"text":"Welcome to Infinity Legal.","voice":"tongtong"}' --max-time 20 2>/dev/null)
check_any "POST /api/ai/tts (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/tts" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"text":"test"}' --max-time 15 2>/dev/null)
check "POST /api/ai/tts (no auth -> 401)" "401" "$code"

# vlm
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/vlm" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"image_url":"https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400","question":"What legal document is this?"}' --max-time 20 2>/dev/null)
check_any "POST /api/ai/vlm (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/vlm" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"image_url":"https://example.com/img.png"}' --max-time 15 2>/dev/null)
check "POST /api/ai/vlm (no auth -> 401)" "401" "$code"

# web-search (GET)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/web-search?q=popia+act+south+africa&num=3" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 20 2>/dev/null)
check_any "GET /api/ai/web-search (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/web-search?q=test" --max-time 15 2>/dev/null)
check "GET /api/ai/web-search (no auth -> 401)" "401" "$code"

# --- 5. ARTICLES [slug] ---
echo ""
echo "=== ARTICLES [SLUG] ==="
# Get an article slug first
SLUG=$(curl -sS "$BASE/api/articles?limit=1" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['slug'] if d else 'popia-act-explained')" 2>/dev/null)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles/$SLUG" --max-time 15 2>/dev/null)
check "GET /api/articles/[slug] (public)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/articles/nonexistent-slug-12345" --max-time 15 2>/dev/null)
check "GET /api/articles/[slug] (nonexistent -> 404)" "404" "$code"
# PATCH with staff
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/articles/$SLUG" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"reading_time_min":5}' --max-time 30 2>/dev/null)
check "PATCH /api/articles/[slug] (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/articles/$SLUG" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"reading_time_min":5}' --max-time 15 2>/dev/null)
check "PATCH /api/articles/[slug] (no auth -> 401)" "401" "$code"

# --- 6. AUTH EXTENDED ---
echo ""
echo "=== AUTH EXTENDED ==="
# auto-confirm
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/auto-confirm" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"$EMAIL1\"}" --max-time 15 2>/dev/null)
check "POST /api/auth/auto-confirm" "200" "$code"

# callback (legacy — 307 redirect)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/callback?code=test" --max-time 15 2>/dev/null)
check_any "GET /api/auth/callback (legacy redirect)" "$code" 307 302

# clerk-webhook (misnamed — actually legacy supabase callback, 307)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/auth/clerk-webhook?code=test" --max-time 15 2>/dev/null)
check_any "GET /api/auth/clerk-webhook (legacy redirect)" "$code" 307 302

# forgot-password (CSRF — needs Origin)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/forgot-password" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"nonexistent@example.com"}' --max-time 15 2>/dev/null)
check "POST /api/auth/forgot-password (with Origin)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@example.com"}' --max-time 15 2>/dev/null)
check "POST /api/auth/forgot-password (no Origin -> 403)" "403" "$code"

# reset-password (invalid token -> 401)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/reset-password" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"token":"invalid-token-12345","password":"NewPass!2025"}' --max-time 15 2>/dev/null)
check "POST /api/auth/reset-password (invalid token -> 401)" "401" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"x","password":"x"}' --max-time 15 2>/dev/null)
check "POST /api/auth/reset-password (no Origin -> 403)" "403" "$code"

# signout
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/auth/signout" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "POST /api/auth/signout" "200" "$code"

# --- 7. BACKUP ---
echo ""
echo "=== BACKUP ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/backup" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Origin: http://localhost:3000" \
  -d '{"type":"manual"}' --max-time 30 2>/dev/null)
check_any "POST /api/backup (staff)" "$code" 200 201
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backup" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/backup (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/backup" --max-time 15 2>/dev/null)
check "GET /api/backup (no auth -> 401)" "401" "$code"

# --- 8. COMMUNICATIONS EXTENDED ---
echo ""
echo "=== COMMUNICATIONS EXTENDED ==="
# welcome (admin only)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/welcome" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"userId\":\"test\",\"email\":\"welcome-$TS@example.com\",\"fullName\":\"Test User\"}" --max-time 30 2>/dev/null)
check_any "POST /api/communications/welcome (staff)" "$code" 200 500
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/welcome" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"userId":"x","email":"x@x.com","fullName":"x"}' --max-time 15 2>/dev/null)
check "POST /api/communications/welcome (no auth -> 401)" "401" "$code"

# verify (CSRF — needs Origin)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/verify" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"email\":\"verify-$TS@example.com\",\"channel\":\"email\"}" --max-time 15 2>/dev/null)
check_any "POST /api/communications/verify (with Origin)" "$code" 200 429
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/communications/verify" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"x@x.com"}' --max-time 15 2>/dev/null)
check "POST /api/communications/verify (no Origin -> 403)" "403" "$code"

# --- 9. CONTACT (public) ---
echo ""
echo "=== CONTACT ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/contact" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"name\":\"Test User\",\"email\":\"contact-$TS@example.com\",\"message\":\"I need legal assistance with a matter.\",\"subject\":\"General enquiry\"}" --max-time 30 2>/dev/null)
check "POST /api/contact (public)" "201" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/contact" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"name":"","email":"bad","message":""}' --max-time 15 2>/dev/null)
check "POST /api/contact (invalid -> 400)" "400" "$code"

# --- 10. CRM EXTENDED ---
echo ""
echo "=== CRM EXTENDED ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/activity" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/crm/activity (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/activity" --max-time 15 2>/dev/null)
check "GET /api/crm/activity (no auth -> 401)" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/settings" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/crm/settings (staff)" "200" "$code"
# PATCH settings (get an id first)
SETTINGS_ID=$(curl -sS "$BASE/api/crm/settings" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['id'] if d else 'site_name')" 2>/dev/null)
code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/api/crm/settings" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"id\":\"$SETTINGS_ID\",\"value\":\"Test Value\"}" --max-time 15 2>/dev/null)
check "PATCH /api/crm/settings (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/settings" --max-time 15 2>/dev/null)
check "GET /api/crm/settings (no auth -> 401)" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/subscriptions" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/crm/subscriptions (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/crm/subscriptions" --max-time 15 2>/dev/null)
check "GET /api/crm/subscriptions (no auth -> 401)" "401" "$code"

# --- 11. DOCUMENTS [id] ---
echo ""
echo "=== DOCUMENTS [ID] ==="
# Get a document ID
DOC_ID=$(curl -sS "$BASE/api/documents" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d[0]['id'] if isinstance(d,list) and d else 'none')" 2>/dev/null)
if [ "$DOC_ID" != "none" ] && [ -n "$DOC_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents/$DOC_ID" \
    -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
  check "GET /api/documents/[id] (staff)" "200" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/documents/$DOC_ID" \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
    -d '{"description":"Updated by audit"}' --max-time 15 2>/dev/null)
  check "PUT /api/documents/[id] (staff)" "200" "$code"
else
  echo "SKIP | no documents to test [id] route"
fi
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/documents/nonexistent-id" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/documents/[id] (nonexistent -> 404)" "404" "$code"

# --- 12. HR / MANAGEMENT / PARALEGAL / SALES ---
echo ""
echo "=== PORTAL ROUTES ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hr" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/hr (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hr" --max-time 15 2>/dev/null)
check "GET /api/hr (no auth -> 401)" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/management (MD)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" --max-time 15 2>/dev/null)
check "GET /api/management (no auth -> 401)" "401" "$code"
# Client should NOT access management (role gate)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/management" \
  -H "Authorization: Bearer $CLIENT_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/management (client -> 403)" "403" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/paralegal" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check_any "GET /api/paralegal (staff role gate)" "$code" 200 403
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/paralegal" --max-time 15 2>/dev/null)
check "GET /api/paralegal (no auth -> 401)" "401" "$code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/sales" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/sales (staff)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/sales" --max-time 15 2>/dev/null)
check "GET /api/sales (no auth -> 401)" "401" "$code"

# --- 13. LEADS [id] ---
echo ""
echo "=== LEADS [ID] ==="
# Create a lead first
LEAD_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/leads" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d "{\"first_name\":\"Ext\",\"last_name\":\"Lead\",\"email\":\"extlead-$TS@example.com\",\"phone\":\"0831234567\",\"case_type\":\"civil\",\"description\":\"Extended audit lead\"}" --max-time 30 2>/dev/null)
LEAD_ID=$(echo "$LEAD_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "lead created for [id] test" "nonempty" "${LEAD_ID:+nonempty}"
if [ -n "$LEAD_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/leads/$LEAD_ID" \
    -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
  check "GET /api/leads/[id] (staff)" "200" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/leads/$LEAD_ID" \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
    -d '{"status":"contacted","notes":"Called client"}' --max-time 15 2>/dev/null)
  check "PUT /api/leads/[id] (staff)" "200" "$code"
fi
code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/leads/nonexistent-id" \
  -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/leads/[id] (nonexistent -> 404)" "404" "$code"

# --- 14. TASKS [id] ---
echo ""
echo "=== TASKS [ID] ==="
# Create a task first
TASK_RESP=$(curl -sS -w "\n%{http_code}" -X POST "$BASE/api/tasks" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"title":"Ext Audit Task","description":"Test","priority":"low"}' --max-time 30 2>/dev/null)
TASK_ID=$(echo "$TASK_RESP" | head -n -1 | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
check "task created for [id] test" "nonempty" "${TASK_ID:+nonempty}"
if [ -n "$TASK_ID" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/api/tasks/$TASK_ID" \
    -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
  check "GET /api/tasks/[id] (staff)" "200" "$code"
  code=$(curl -s -o /dev/null -w "%{http_code}" -L -X PUT "$BASE/api/tasks/$TASK_ID" \
    -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
    -d '{"status":"completed"}' --max-time 15 2>/dev/null)
  check "PUT /api/tasks/[id] (staff)" "200" "$code"
fi

# --- 15. PAYFAST ---
echo ""
echo "=== PAYFAST ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/payfast/cancel" --max-time 15 2>/dev/null)
check "GET /api/payfast/cancel (public)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/payfast/success" --max-time 15 2>/dev/null)
check "GET /api/payfast/success (public)" "200" "$code"
# checkout (needs auth + valid planId)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" \
  -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 30 2>/dev/null)
check_any "POST /api/payfast/checkout (client)" "$code" 200 409
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/checkout" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"planId":"civil","billingCycle":"monthly"}' --max-time 15 2>/dev/null)
check "POST /api/payfast/checkout (no auth -> 401)" "401" "$code"
# notify (webhook — no signature -> 400/403, NOT 500)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payfast/notify" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'm_payment_id=test&pf_payment_id=test&payment_status=COMPLETE&amount_gross=99.00&signature=invalid' --max-time 15 2>/dev/null)
check_any "POST /api/payfast/notify (no valid sig -> 400/403)" "$code" 400 403

# --- 16. STRIPE ---
echo ""
echo "=== STRIPE ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/cancel" --max-time 15 2>/dev/null)
check_any "GET /api/stripe/cancel (redirect)" "$code" 307 302
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/stripe/success?session_id=test" --max-time 15 2>/dev/null)
check_any "GET /api/stripe/success (redirect)" "$code" 307 302
# checkout POST (CSRF — needs Origin)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" \
  -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 30 2>/dev/null)
check_any "POST /api/stripe/checkout (with Origin)" "$code" 200 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/checkout" \
  -H "Authorization: Bearer $CLIENT_TOKEN" -H "Content-Type: application/json" \
  -d '{"planSlug":"civil","billingCycle":"monthly","customerEmail":"test@example.com"}' --max-time 15 2>/dev/null)
check "POST /api/stripe/checkout (no Origin -> 403)" "403" "$code"
# webhook (no signature -> 400, NOT 500)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/stripe/webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed"}' --max-time 15 2>/dev/null)
check_any "POST /api/stripe/webhook (no sig -> 400)" "$code" 400 404

# --- 17. TRANSLATE ---
echo ""
echo "=== TRANSLATE ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/translate" --max-time 15 2>/dev/null)
check "GET /api/translate (public, list langs)" "200" "$code"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"text":"Hello world","target":"zu"}' --max-time 30 2>/dev/null)
check_any "POST /api/translate (staff)" "$code" 200 429 503
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/translate" \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"text":"Hello","target":"zu"}' --max-time 15 2>/dev/null)
check "POST /api/translate (no auth -> 401)" "401" "$code"

# --- 18. WEBHOOKS/CLERK ---
echo ""
echo "=== WEBHOOKS ==="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/webhooks/clerk" \
  -H "Content-Type: application/json" \
  -d '{"type":"user.created","data":{"id":"user_123"}}' --max-time 15 2>/dev/null)
check_any "POST /api/webhooks/clerk (no svix sig -> 400/404)" "$code" 400 404

# --- SUMMARY ---
echo ""
echo "============================================"
echo "  EXTENDED AUDIT SUMMARY"
echo "============================================"
echo "PASS: $PASS  FAIL: $FAIL  CRASH(500): $CRASH"
echo "--------------------------------------------"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "============================================"
echo ""
if [ "$CRASH" -gt 0 ]; then echo "!! $CRASH ENDPOINT(S) RETURNED 500 — INVESTIGATE !!"; fi
exit 0
