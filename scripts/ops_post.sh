#!/usr/bin/env bash
# Post to CeilingGate ops. Uses OPS_TOKEN if set; never prints it.
set -euo pipefail
SITE="${CEILINGGATE_SITE:-https://quirky-rhinoceros-204.convex.site}"
FROM="${1:-manager}"
BODY="${2:-}"
KIND="${3:-note}"
if [ -z "$BODY" ]; then
  echo "usage: $0 manager|taylor 'body' [kind]" >&2
  exit 2
fi
AUTH=()
if [ -n "${OPS_TOKEN:-}" ]; then
  AUTH=(-H "Authorization: Bearer ${OPS_TOKEN}")
fi
curl -fsS -X POST "$SITE/api/ops-messages" \
  -H "Content-Type: application/json" \
  "${AUTH[@]}" \
  -d "$(python3 -c 'import json,sys; print(json.dumps({"from":sys.argv[1],"body":sys.argv[2],"kind":sys.argv[3]}))' "$FROM" "$BODY" "$KIND")"
echo
