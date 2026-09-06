#!/usr/bin/env bash
# All Gas judge-path smoke — public assets only (no keys, no phone).
set -euo pipefail
SITE="${SITE:-https://quirky-rhinoceros-204.convex.site}"
GH="${GH:-https://github.com/snowphamtom/ceilinggate}"
REL="${REL:-https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-20260905}"
fail=0
pass() { echo "PASS  $*"; }
bad()  { echo "FAIL  $*"; fail=1; }

code=$(curl -sS -o /tmp/cg-h.json -w '%{http_code}' "$SITE/health" || echo 000)
if [[ "$code" == "200" ]] && grep -q CeilingGate /tmp/cg-h.json; then pass "health $SITE/health"; else bad "health ($code)"; fi

code=$(curl -sS -o /tmp/cg-i.html -w '%{http_code}' "$SITE/" || echo 000)
if [[ "$code" == "200" ]]; then pass "SPA index"; else bad "SPA index ($code)"; fi
js=$(grep -oE '/assets/index-[^"]+\.js' /tmp/cg-i.html | head -1 || true)
if [[ -n "$js" ]]; then
  curl -sS -o /tmp/cg.js "$SITE$js"
  for s in "Demo GRANT" "Demo REFUSE" "Demo signature" "claimed" "mask "; do
    if grep -q "$s" /tmp/cg.js; then pass "bundle has $s"; else bad "bundle missing $s"; fi
  done
else bad "no js asset in index"; fi

code=$(curl -sS -o /dev/null -w '%{http_code}' "$SITE/fixtures/demo.json" || echo 000)
[[ "$code" == "200" ]] && pass "fixtures/demo.json" || bad "fixtures ($code)"

# webhook should reject unsigned (live), not 404
wcode=$(curl -sS -o /tmp/wh.txt -w '%{http_code}' -X POST "$SITE/agentmail/webhook" -H 'content-type: application/json' -d '{}' || echo 000)
if [[ "$wcode" == "401" || "$wcode" == "400" ]]; then pass "webhook live ($wcode unsigned)"; else bad "webhook unexpected $wcode"; fi

echo "GH: $GH"
echo "Release: $REL"
echo "Inbox: ceilinggate-claims@agentmail.to"
exit $fail
