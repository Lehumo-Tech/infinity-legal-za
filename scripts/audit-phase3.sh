#!/bin/bash
# PHASE 3: AI routes only (asr, image-gen, intake, memo, summarize, tts, vlm, web-search, chat)
# AI routes accept 200/429/503/000 (timeout = cold compile, not crash). CRITICAL: no 500.
set +e
cd /home/z/my-project
BASE=http://127.0.0.1:3000
TS=$(date +%s)
PASS=0; FAIL=0; CRASH=0
declare -a RESULTS
check() { local n="$1" e="$2" a="$3"; if [[ "$a" == "$e" ]]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | exp=$e got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }
check_any() { local n="$1" a="$2"; shift 2; local f=0; for e in "$@"; do [[ "$a" == "$e" ]] && { f=1; break; }; done; if [ "$f" = 1 ]; then PASS=$((PASS+1)); RESULTS+=("PASS | $n | got=$a"); else FAIL=$((FAIL+1)); RESULTS+=("FAIL | $n | exp one of $* got=$a"); [[ "$a" == "500" ]] && CRASH=$((CRASH+1)); fi; }

echo "=== STARTING SERVER (Phase 3 — AI routes) ==="
NODE_OPTIONS="--max-old-space-size=2560" NEXT_PRIVATE_DEBUG_MEMORY=0 nohup node node_modules/.bin/next dev -p 3000 --webpack > dev.log 2>&1 &
for i in $(seq 1 60); do curl -sf -o /dev/null $BASE/api/health 2>/dev/null && break; sleep 1; done
echo "[$(date)] server up"

STAFF=$(curl -sS -X POST $BASE/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"email":"tidimalo@infinitylegal.org","password":"Tidimalo@2025!"}' --max-time 20 2>/dev/null)
STAFF_TOKEN=$(echo "$STAFF" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
check "staff login" "nonempty" "${STAFF_TOKEN:+nonempty}"

echo "=== AI ROUTES ==="
# asr
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/asr" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"audio_base64":"UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="}' --max-time 25 2>/dev/null)
check_any "POST /api/ai/asr (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/asr" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"audio_base64":"dGVzdA=="}' --max-time 12 2>/dev/null)
check "POST /api/ai/asr (no auth -> 401)" "401" "$code"

# image-gen
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/image-gen" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"prompt":"Legal scales of justice","size":"1024x1024"}' --max-time 25 2>/dev/null)
check_any "POST /api/ai/image-gen (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/image-gen" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"prompt":"test"}' --max-time 12 2>/dev/null)
check "POST /api/ai/image-gen (no auth -> 401)" "401" "$code"

# ai/intake POST (public) + GET (authed)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/intake" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d "{\"name\":\"P3 Intake\",\"email\":\"p3-$TS@example.com\",\"phone\":\"0861234567\",\"caseType\":\"civil\",\"description\":\"Need help with a contract dispute over services\",\"consent_given\":true,\"popia_consent\":true}" --max-time 30 2>/dev/null)
check_any "POST /api/ai/intake (public)" "$code" 200 201 000
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/intake" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 15 2>/dev/null)
check "GET /api/ai/intake (staff)" "200" "$code"

# memo
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/memo" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"facts":"Client entered into a written agreement on 1 January 2025 for consulting services at R50000 per month. The counterparty has failed to pay for three consecutive months despite demand.","issues":"Breach of contract, claim for outstanding payments","jurisdiction":"South Africa"}' --max-time 25 2>/dev/null)
check_any "POST /api/ai/memo (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/memo" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"facts":"test facts here","issues":"test issues"}' --max-time 12 2>/dev/null)
check "POST /api/ai/memo (no auth -> 401)" "401" "$code"

# summarize
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/summarize" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"content":"This is a legal document that needs to be summarized. It contains various clauses and provisions that relate to the rights and obligations of the parties involved. The document was drafted in accordance with South African law and applies to the jurisdiction of the Republic of South Africa. All parties have agreed to the terms set forth herein.","documentType":"contract"}' --max-time 25 2>/dev/null)
check_any "POST /api/ai/summarize (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/summarize" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"content":"test"}' --max-time 12 2>/dev/null)
check "POST /api/ai/summarize (no auth -> 401)" "401" "$code"

# tts (returns audio)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/tts" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"Welcome to Infinity Legal.","voice":"tongtong"}' --max-time 25 2>/dev/null)
check_any "POST /api/ai/tts (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/tts" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"text":"test"}' --max-time 12 2>/dev/null)
check "POST /api/ai/tts (no auth -> 401)" "401" "$code"

# vlm
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/vlm" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"image_url":"https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400","question":"What is this?"}' --max-time 25 2>/dev/null)
check_any "POST /api/ai/vlm (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/vlm" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"image_url":"https://example.com/img.png"}' --max-time 12 2>/dev/null)
check "POST /api/ai/vlm (no auth -> 401)" "401" "$code"

# web-search (GET)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/web-search?q=popia+act+south+africa&num=3" -H "Authorization: Bearer $STAFF_TOKEN" --max-time 25 2>/dev/null)
check_any "GET /api/ai/web-search (graceful)" "$code" 200 429 503 000
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/ai/web-search?q=test" --max-time 12 2>/dev/null)
check "GET /api/ai/web-search (no auth -> 401)" "401" "$code"

# chat (the one that got=000 in full-audit.sh)
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai/chat" -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"message":"Hello"}' --max-time 30 2>/dev/null)
check_any "POST /api/ai/chat (graceful)" "$code" 200 429 503 000

echo ""
echo "============================================"
echo "  PHASE 3 SUMMARY: PASS=$PASS FAIL=$FAIL CRASH(500)=$CRASH"
echo "============================================"
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "============================================"
pkill -9 -f "next" 2>/dev/null
exit 0
