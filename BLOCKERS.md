# CeilingGate blockers

1. **Keep local** — no public GitHub push until Taylor says publish
2. **Convex project** — need logged-in account for `npx convex dev` / deploy / `*.convex.site`
3. **API keys (Convex env, never commit)** — `AGENTMAIL_API_KEY`, `AGENTMAIL_WEBHOOK_SECRET`, `FIRECRAWL_API_KEY` (+ optional `FIRECRAWL_WEBHOOK_SECRET`)
4. **Origin / gh auth** — deferred; when publishing: Origin namespace or `gh` login
5. **Luma register** — HELD pending Taylor

Offline OK: `npm run test:gate` and `npm test` (Lean refuse mask 10 PASS).
