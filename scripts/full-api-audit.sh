#!/bin/bash
# Full API Audit v2 — proper auth header handling, curl timeouts
# Run while dev server is alive on :3000

BASE="http://localhost:3000"
PASS=0; FAIL=0; CRASH=0
ERRORS=()

# Get auth token first
echo "=== Getting auth token ==="
LOGIN_RESP=$(curl -s --max-time 30 -X POST -H "Content-Type: application/json" \
  -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' \
  "$BASE/api/auth/login" 2>/dev/null)
TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "FAILED to get token. Login response:"
  echo "$LOGIN_RESP" | head -c 500
  exit 1
fi
echo "✅ Token obtained: ${TOKEN:0:30}..."
echo ""

# check_noauth: test endpoint without auth
# Args: method url expect desc [data]
check_noauth() {
  local method="$1" url="$2" expect="$3" desc="$4" data="$5"
  local code
  if [ -n "$data" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X "$method" \
      -H "Content-Type: application/json" -d "$data" "$BASE$url" 2>/dev/null)
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X "$method" "$BASE$url" 2>/dev/null)
  fi
  evaluate "$code" "$expect" "$method" "$url" "$desc"
}

# check_auth: test endpoint WITH auth token
# Args: method url expect desc [data]
check_auth() {
  local method="$1" url="$2" expect="$3" desc="$4" data="$5"
  local code
  if [ -n "$data" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X "$method" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$data" "$BASE$url" 2>/dev/null)
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 -X "$method" \
      -H "Authorization: Bearer $TOKEN" "$BASE$url" 2>/dev/null)
  fi
  evaluate "$code" "$expect" "$method" "$url" "$desc"
}

evaluate() {
  local code="$1" expect="$2" method="$3" url="$4" desc="$5"
  if [ "$code" = "500" ]; then
    CRASH=$((CRASH+1))
    ERRORS+=("CRASH [500] $method $url — $desc")
    echo "  ❌ CRASH [500] $method $url — $desc"
  elif [ "$code" = "000" ]; then
    CRASH=$((CRASH+1))
    ERRORS+=("TIMEOUT/REFUSED [000] $method $url — $desc")
    echo "  ❌ TIMEOUT [000] $method $url — $desc"
  elif echo "$code" | grep -qE "$expect"; then
    PASS=$((PASS+1))
    echo "  ✅ [$code] $method $url — $desc"
  else
    FAIL=$((FAIL+1))
    ERRORS+=("UNEXPECTED [$code≠$expect] $method $url — $desc")
    echo "  ⚠️  [$code≠$expect] $method $url — $desc"
  fi
}

echo "============================================"
echo "  FULL API AUDIT v2"
echo "============================================"

# === 1. PUBLIC ENDPOINTS ===
echo "--- 1. PUBLIC ENDPOINTS ---"
check_noauth GET "/api/health" "200" "health"
check_noauth GET "/api" "200" "api root"
check_noauth GET "/api/pricing" "200" "pricing"
check_noauth GET "/api/articles?limit=5" "200" "articles list"
check_noauth GET "/api/articles/nonexistent" "404" "article 404"
check_noauth GET "/api/holidays" "200" "holidays"
check_noauth GET "/api/translate?text=hello&to=af" "200" "translate GET"
check_noauth GET "/api/auth/profile" "401" "profile no auth → 401"

# === 2. AUTHENTICATED GET ENDPOINTS ===
echo ""
echo "--- 2. AUTHENTICATED GET ENDPOINTS ---"
check_auth GET "/api/auth/profile" "200" "profile with auth"
check_auth GET "/api/dashboard" "200" "dashboard"
check_auth GET "/api/cases" "200" "cases"
check_auth GET "/api/leads" "200" "leads"
check_auth GET "/api/consultations" "200" "consultations"
check_auth GET "/api/tasks" "200" "tasks"
check_auth GET "/api/notifications" "200" "notifications"
check_auth GET "/api/documents" "200" "documents"
check_auth GET "/api/crm" "200" "CRM"
check_auth GET "/api/crm/activity" "200" "CRM activity"
check_auth GET "/api/crm/settings" "200" "CRM settings"
check_auth GET "/api/crm/subscriptions" "200" "CRM subs"
check_auth GET "/api/crm/users" "200" "CRM users"
check_auth GET "/api/communications/logs" "200" "comm logs"
check_auth GET "/api/communications/templates" "200" "comm templates"
check_auth GET "/api/communications/status" "200" "comm status"
check_auth GET "/api/analytics" "200" "analytics"
check_auth GET "/api/report" "200" "report"
check_auth GET "/api/messages" "200" "messages"
check_auth GET "/api/staff" "200" "staff"
check_auth GET "/api/subscriptions" "200" "subscriptions"
check_auth GET "/api/integrations" "200" "integrations"
check_auth GET "/api/management" "200" "management"
check_auth GET "/api/hr" "200" "hr"
check_auth GET "/api/sales" "200" "sales"
check_auth GET "/api/paralegal" "403" "paralegal wrong role"
check_auth GET "/api/backup" "200" "backup"
check_auth GET "/api/ai/providers" "200" "AI providers"
check_auth GET "/api/ai/web-search?q=test" "200|503" "AI web search"

# === 3. CREATE (POST) ENDPOINTS ===
echo ""
echo "--- 3. CREATE (POST) ENDPOINTS ---"
check_auth POST "/api/cases" "2.." "create case" '{"title":"Audit Case","caseType":"Civil Litigation","priority":"medium","description":"test"}'
check_auth POST "/api/leads" "2.." "create lead" '{"name":"Audit Lead","email":"audit@test.com","phone":"0123456789","caseType":"Family Law","source":"website"}'
check_auth POST "/api/consultations" "2.." "create consultation" '{"clientName":"Audit Client","clientEmail":"auditc@test.com","caseType":"Family Law","preferredDate":"2026-08-01","preferredTime":"10:00"}'
check_auth POST "/api/tasks" "2.." "create task" '{"title":"Audit Task","priority":"medium"}'
check_auth POST "/api/documents" "200|201|400" "create doc (may 400 no file)" '{"title":"Test Doc"}'
check_auth POST "/api/messages" "2..|4.." "send message" '{"recipientId":"test","content":"hello"}'

# === 4. AI ROUTES (POST) ===
echo ""
echo "--- 4. AI ROUTES ---"
check_auth POST "/api/ai/chat" "200|503" "AI chat" '{"message":"Hello"}'
check_auth POST "/api/ai/summarize" "200|503" "AI summarize" '{"text":"Test text to summarize"}'
check_auth POST "/api/ai/memo" "200|503" "AI memo" '{"caseTitle":"Test","caseType":"Civil Litigation","summary":"Test"}'
check_auth POST "/api/ai/vlm" "200|400|503" "AI VLM" '{"image":"invalid"}'

# === 5. PUBLIC POST ENDPOINTS ===
echo ""
echo "--- 5. PUBLIC POST ENDPOINTS ---"
check_noauth POST "/api/ai/intake" "200|429|503" "AI intake" '{"name":"Test","email":"test@test.com","caseType":"Family Law","urgency":"medium","description":"Test","consent":true,"popia":true}'
check_noauth POST "/api/contact" "200|400" "contact valid" '{"name":"Test","email":"test@test.com","message":"Hello"}'
check_noauth POST "/api/contact" "400" "contact empty" '{}'
check_noauth POST "/api/auth/login" "401" "login wrong pw" '{"email":"tidimalo@infinitylegal.org","password":"wrong"}'
check_noauth POST "/api/auth/login" "400|401" "login bad email" '{"email":"x","password":"y"}'
check_noauth POST "/api/auth/signup" "400" "signup empty" '{}'
check_noauth POST "/api/auth/forgot-password" "200" "forgot pw" '{"email":"tidimalo@infinitylegal.org"}'
check_noauth POST "/api/auth/signout" "200" "signout" '{}'
check_noauth POST "/api/auth/auto-confirm" "200|400|404" "auto-confirm" '{"email":"nobody@test.com"}'

# === 6. PAYMENT ROUTES ===
echo ""
echo "--- 6. PAYMENT ROUTES ---"
check_auth POST "/api/payfast/checkout" "200|400|409" "payfast checkout" '{"planSlug":"civil_legal_plan"}'
check_noauth GET "/api/payfast/cancel" "200" "payfast cancel page"
check_noauth GET "/api/payfast/success" "200" "payfast success page"
check_auth POST "/api/stripe/checkout" "403|503" "stripe checkout" '{"planSlug":"civil_legal_plan"}'
check_noauth GET "/api/stripe/cancel" "200|307" "stripe cancel"
check_noauth GET "/api/stripe/success" "200|307" "stripe success"

# === 7. ADMIN ROUTES ===
echo ""
echo "--- 7. ADMIN ROUTES ---"
check_auth POST "/api/admin/migrate" "200" "admin migrate" '{}'
check_auth GET "/api/admin/seed-pricing" "200" "seed pricing GET"

# === SUMMARY ===
echo ""
echo "============================================"
echo "  AUDIT SUMMARY"
echo "============================================"
echo "  ✅ Passed:      $PASS"
echo "  ⚠️  Unexpected:   $FAIL"
echo "  ❌ Crashed:     $CRASH"
echo "  Total checks:   $((PASS+FAIL+CRASH))"
echo ""

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "ISSUES:"
  for e in "${ERRORS[@]}"; do echo "  - $e"; done
fi

if [ "$CRASH" -gt 0 ]; then
  echo ""
  echo "❌ $CRASH CRASH(ES) detected — needs fixing"
  exit 1
else
  echo ""
  echo "✅ ZERO CRASHES — API is stable"
  exit 0
fi
