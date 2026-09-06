#!/usr/bin/env bash
# Box v2 — deploy CeilingGate without printing secrets.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
cmd="${1:-help}"
SITE="${CEILINGGATE_SITE:-https://quirky-rhinoceros-204.convex.site}"

die() { echo "box: $*" >&2; exit 1; }
no_keys() {
  if env | grep -Eiq '^(CONVEX_DEPLOY_KEY|OPENAI_API_KEY|FIRECRAWL_API_KEY|AGENTMAIL|OPS_TOKEN)='; then
    echo "box: secrets present in env (names only; values not printed)"
  fi
}

case "$cmd" in
  status)
    echo "box root $ROOT"
    git rev-parse --short HEAD
    git status -sb
    no_keys
    curl -fsS "$SITE/health" || echo "health: down"
    ;;
  pull)
    git fetch origin
    git pull --ff-only origin master
    ;;
  deploy)
    git fetch origin
    git merge --ff-only origin/master || true
    if [ ! -f package-lock.json ]; then die "no lockfile"; fi
    npm ci
    npm run build
    if [ -z "${CONVEX_DEPLOY_KEY:-}" ]; then
      echo "box: CONVEX_DEPLOY_KEY unset; using existing convex login if any"
    fi
    npx convex deploy -y
    curl -fsS "$SITE/health"
    echo
    echo "box: deploy attempted. Confirm SHA on live independently."
    ;;
  *)
    echo "usage: $0 status|pull|deploy"
    exit 2
    ;;
esac
