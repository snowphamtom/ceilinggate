# CeilingGate blockers (as of scaffold)

1. **Cursor Origin namespace** — `CloudAgent new_repo` failed: create namespace at https://cursor.com/codebase/get-started
2. **GitHub auth** — `gh` not logged in; public repo required for All Gas submission
3. **Convex project** — need logged-in Convex account for `npx convex dev` / deploy / `*.convex.site`
4. **API keys (Convex env, never commit)**
   - `AGENTMAIL_API_KEY`
   - `AGENTMAIL_WEBHOOK_SECRET`
   - `FIRECRAWL_API_KEY`
   - `FIRECRAWL_WEBHOOK_SECRET` (optional)
5. **Luma register** — still **HELD** pending Taylor

Offline progress without keys: `npm run test:gate` (Lean samples PASS).
