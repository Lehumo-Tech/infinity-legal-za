#!/bin/bash
# Robust API audit with retry logic — handles Next.js memory-restart gracefully
# Usage: bash audit-batch.sh [batch_num]
# batch_num: 1, 2, 3, or 4 (default: all, but may timeout — use batches)

BASE="http://localhost:3000"
BATCH="${1:-all}"
RESULTS_FILE="/tmp/audit-results.txt"
PASS=0; FAIL=0; CRASH=0
ERRORS=()

# Get token
TOKEN=$(curl -s --max-time 30 -X POST -H "Content-Type: application/json" \
  -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' \
  "$BASE/api/auth/login" 2>/dev/null | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "FAILED to get token"
  exit 1
fi

# Robust check: retries on 000 (server restarting)
rcheck() {
  local method="$1" url="$2" expect="$3" desc="$4" data="$5" use_auth="$6"
  local code="" tries=0
  while [ $tries -lt 3 ]; do
    if [ "$use_auth" = "auth" ]; then
      if [ -n "$data" ]; then
        code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 45 -X "$method" \
          -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
          -d "$data" "$BASE$url" 2>/dev/null)
      else
        code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 45 -X "$method" \
          -H "Authorization: Bearer $TOKEN" "$BASE$url" 2>/dev/null)
      fi
    else
      if [ -n "$data" ]; then
        code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 45 -X "$method" \
          -H "Content-Type: application/json" -d "$data" "$BASE$url" 2>/dev/null)
      else
        code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 45 -X "$method" "$BASE$url" 2>/dev/null)
      fi
    fi
    if [ "$code" != "000" ]; then break; fi
    tries=$((tries+1))
    sleep 8  # Wait for server restart + recompile
  done

  if [ "$code" = "500" ]; then
    CRASH=$((CRASH+1)); ERRORS+=("CRASH [500] $method $url — $desc")
    echo "  ❌ CRASH [500] $method $url — $desc"
  elif [ "$code" = "000" ]; then
    CRASH=$((CRASH+1)); ERRORS+=("UNREACHABLE [000] $method $url — $desc (3 retries failed)")
    echo "  ❌ UNREACHABLE $method $url — $desc (3 retries)"
  elif echo "$code" | grep -qE "$expect"; then
    PASS=$((PASS+1))
    echo "  ✅ [$code] $method $url — $desc"
  else
    FAIL=$((FAIL+1)); ERRORS+=("UNEXPECTED [$code≠$expect] $method $url — $desc")
    echo "  ⚠️  [$code≠$expect] $method $url — $desc"
  fi
  sleep 1  # Small delay between checks
}

# Endpoint definitions
run_batch() {
  local b="$1"
  case $b in
    1)
      echo "--- BATCH 1: Public + Core Auth GETs ---"
      rcheck GET "/api/health" "200" "health" "" "noauth"
      rcheck GET "/api" "200" "api root" "" "noauth"
      rcheck GET "/api/pricing" "200" "pricing" "" "noauth"
      rcheck GET "/api/articles?limit=5" "200" "articles" "" "noauth"
      rcheck GET "/api/articles/nonexistent" "404" "article 404" "" "noauth"
      rcheck GET "/api/holidays" "200" "holidays" "" "noauth"
      rcheck GET "/api/translate?text=hello&to=af" "200" "translate" "" "noauth"
      rcheck GET "/api/auth/profile" "401" "profile no-auth" "" "noauth"
      rcheck GET "/api/auth/profile" "200" "profile auth" "" "auth"
      rcheck GET "/api/dashboard" "200" "dashboard" "" "auth"
      rcheck GET "/api/cases" "200" "cases" "" "auth"
      rcheck GET "/api/leads" "200" "leads" "" "auth"
      rcheck GET "/api/consultations" "200" "consultations" "" "auth"
      rcheck GET "/api/tasks" "200" "tasks" "" "auth"
      rcheck GET "/api/notifications" "200" "notifications" "" "auth"
      rcheck GET "/api/documents" "200" "documents" "" "auth"
      ;;
    2)
      echo "--- BATCH 2: CRM + Comms + Analytics ---"
      rcheck GET "/api/crm" "200" "CRM" "" "auth"
      rcheck GET "/api/crm/activity" "200" "CRM activity" "" "auth"
      rcheck GET "/api/crm/settings" "200" "CRM settings" "" "auth"
      rcheck GET "/api/crm/subscriptions" "200" "CRM subs" "" "auth"
      rcheck GET "/api/crm/users" "200" "CRM users" "" "auth"
      rcheck GET "/api/communications/logs" "200" "comm logs" "" "auth"
      rcheck GET "/api/communications/templates" "200" "comm templates" "" "auth"
      rcheck GET "/api/communications/status" "200" "comm status" "" "auth"
      rcheck GET "/api/analytics" "200" "analytics" "" "auth"
      rcheck GET "/api/report" "200" "report" "" "auth"
      rcheck GET "/api/messages" "200" "messages" "" "auth"
      rcheck GET "/api/staff" "200" "staff" "" "auth"
      rcheck GET "/api/subscriptions" "200" "subscriptions" "" "auth"
      rcheck GET "/api/integrations" "200" "integrations" "" "auth"
      rcheck GET "/api/management" "200" "management" "" "auth"
      rcheck GET "/api/hr" "200" "hr" "" "auth"
      ;;
    3)
      echo "--- BATCH 3: Role-based + AI + Payments ---"
      rcheck GET "/api/sales" "200" "sales" "" "auth"
      rcheck GET "/api/paralegal" "403" "paralegal wrong role" "" "auth"
      rcheck GET "/api/backup" "200" "backup" "" "auth"
      rcheck GET "/api/ai/providers" "200" "AI providers" "" "auth"
      rcheck GET "/api/ai/web-search?q=test" "200|503" "AI web search" "" "auth"
      rcheck POST "/api/ai/chat" "200|503" "AI chat" '{"message":"Hi"}' "auth"
      rcheck POST "/api/ai/summarize" "200|503" "AI summarize" '{"text":"Test"}' "auth"
      rcheck POST "/api/ai/memo" "200|503" "AI memo" '{"caseTitle":"T","caseType":"Civil Litigation","summary":"S"}' "auth"
      rcheck POST "/api/ai/intake" "200|429|503" "AI intake" '{"name":"T","email":"t@t.com","caseType":"Family Law","urgency":"medium","description":"T","consent":true,"popia":true}' "noauth"
      rcheck POST "/api/payfast/checkout" "200|400|409" "payfast checkout" '{"planSlug":"civil_legal_plan"}' "auth"
      rcheck GET "/api/payfast/cancel" "200" "payfast cancel" "" "noauth"
      rcheck GET "/api/payfast/success" "200" "payfast success" "" "noauth"
      rcheck POST "/api/stripe/checkout" "403|503" "stripe checkout" '{"planSlug":"civil_legal_plan"}' "auth"
      rcheck GET "/api/stripe/cancel" "200|307" "stripe cancel" "" "noauth"
      rcheck GET "/api/stripe/success" "200|307" "stripe success" "" "noauth"
      ;;
    4)
      echo "--- BATCH 4: POST/CRUD + Edge Cases + Admin ---"
      rcheck POST "/api/cases" "2.." "create case" '{"title":"Audit","caseType":"Civil Litigation","priority":"medium","description":"t"}' "auth"
      rcheck POST "/api/leads" "2.." "create lead" '{"name":"AL","email":"a@t.com","phone":"0123456789","caseType":"Family Law","source":"web"}' "auth"
      rcheck POST "/api/consultations" "2.." "create consult" '{"clientName":"AC","clientEmail":"a@t.com","caseType":"Family Law","preferredDate":"2026-08-01","preferredTime":"10:00"}' "auth"
      rcheck POST "/api/tasks" "2.." "create task" '{"title":"AT","priority":"medium"}' "auth"
      rcheck POST "/api/contact" "200|400" "contact valid" '{"name":"T","email":"t@t.com","message":"Hi"}' "noauth"
      rcheck POST "/api/contact" "400" "contact empty" '{}' "noauth"
      rcheck POST "/api/auth/login" "401" "login wrong pw" '{"email":"tidimalo@infinitylegal.org","password":"x"}' "noauth"
      rcheck POST "/api/auth/signup" "400" "signup empty" '{}' "noauth"
      rcheck POST "/api/auth/forgot-password" "200" "forgot pw" '{"email":"tidimalo@infinitylegal.org"}' "noauth"
      rcheck POST "/api/auth/signout" "200" "signout" '{}' "noauth"
      rcheck POST "/api/auth/auto-confirm" "200|400|404" "auto-confirm" '{"email":"n@n.com"}' "noauth"
      rcheck POST "/api/admin/migrate" "200" "admin migrate" '{}' "auth"
      rcheck GET "/api/admin/seed-pricing" "200" "seed pricing" "" "auth"
      ;;
  esac
}

if [ "$BATCH" = "all" ]; then
  for b in 1 2 3 4; do run_batch $b; done
else
  run_batch "$BATCH"
fi

# Summary
echo ""
echo "=== BATCH $BATCH SUMMARY ==="
echo "  ✅ Passed: $PASS  ⚠️  Unexpected: $FAIL  ❌ Crashed: $CRASH"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo "  ISSUES:"
  for e in "${ERRORS[@]}"; do echo "    - $e"; done
fi

# Append to results file
echo "BATCH $BATCH: pass=$PASS fail=$FAIL crash=$CRASH" >> "$RESULTS_FILE"
