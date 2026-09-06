#!/usr/bin/env bash
# Fail if POSITIVE chat-demo / rebrand smell appears in ship UI (src), not anti-rebrand docs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bad=0
echo "CeilingGate originality check (UI)"
# Positive smells only in src/
while IFS= read -r pat; do
  if rg -n -i --glob '!node_modules' -e "$pat" "$ROOT/src" 2>/dev/null | rg -v -i 'not a |not |never |≠|vs |anti'; then
    echo "FAIL positive smell in src: $pat"
    bad=1
  fi
done <<'PATS'
chat with your
talk to your inbox
AI assistant on your inbox
docs search chat
PATS
if ! rg -q 'ResidualGates' "$ROOT/src/App.tsx"; then
  echo "FAIL missing ResidualGates in App.tsx"; bad=1
fi
if ! rg -q 'CLAIMED\|claimed' "$ROOT/src/App.tsx"; then
  echo "WARN claimed column weak"
fi
if rg -n 'LINE|CLAIMED|ON RECEIPT|lineItems.map' "$ROOT/src/App.tsx" >/dev/null; then
  echo "OK forensic line ledger present"
else
  echo "FAIL no line ledger in App.tsx"; bad=1
fi
exit $bad
