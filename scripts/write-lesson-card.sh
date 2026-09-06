#!/usr/bin/env bash
set -euo pipefail
sha=$(git rev-parse --short HEAD)
subj=$(git log -1 --pretty=%s)
out=${1:-docs/LESSON_CARD.md}
mkdir -p "$(dirname "$out")"
cat > "$out" <<EOF
# Lesson card — $sha

1. What changed
$subj

2. Where a human taps it
https://quirky-rhinoceros-204.convex.site/
Show a GRANT / Show a REFUSE
Email ceilinggate-claims@agentmail.to

3. What GRANT looks like
Every line is at or under the receipt.

4. What REFUSE looks like
A named line is over the receipt, written in dollars.

5. What not to weld
MAGPIE 19/658,750. A second product name. Workshop on the home board.
EOF
echo "wrote $out"
