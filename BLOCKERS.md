# CeilingGate — remaining after PUBLISH GO

Not local demo blockers. MANAGER unblocks via browser login:

1. **Public GitHub** — `gh auth login` (or UI create) → Create pushes `/workspace/ceilinggate`
2. **Convex / `*.convex.site`** — `npx convex login` → Create deploys
3. **Live scrapes / webhook** — `FIRECRAWL_API_KEY`, `AGENTMAIL_API_KEY`, webhook secret in Convex env

Offline demo already green. See `PUBLISH.md`.
