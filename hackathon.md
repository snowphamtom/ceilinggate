# CeilingGate — Convex All Gas build log

- **App:** CeilingGate
- **Started:** 2026-09-05
- **Deadline:** 2026-09-22 12:00 PM PT
- **Live URL:** _pending — need Convex project → *.convex.site_
- **Public repo:** _pending — gh auth / Origin namespace_
- **Luma register:** **HELD**

## Stack

- Convex (DB, functions, realtime, static hosting target)
- AgentMail (`@agentmail/convex`) — claim inbox
- Firecrawl (`@firecrawl/firecrawl-convex`) — scrape public receipt interiors
- ResidualGates port (`convex/gateLogic.ts`) — GRANT iff claimed ≤ interior

## What shipped so far

- [x] Design doc (`docs/design.md`, also `/workspace/ceilinggate-design.md`)
- [x] Vite + React + TS scaffold
- [x] Schema: claims, interiors, gateDecisions, vectors
- [x] Gate logic + offline Lean sample self-check (`npm run test:gate`)
- [x] Fixture runner (fuel-grant / fuel-refuse, mask 10)
- [x] Pipeline stubs: AgentMail webhook → parse → Firecrawl scrape → gateB → UI
- [x] 3-screen UI (Inbox / Gate / Fixtures)
- [ ] Convex cloud deploy + convex.site
- [ ] Live AgentMail inbox + webhook
- [ ] Live Firecrawl scrape of public receipt
- [ ] Public GitHub
- [ ] Social tags + vibeapps video

## Blockers

1. **Origin namespace** — CloudAgent `new_repo` blocked (`cursor.com/codebase/get-started`)
2. **GitHub auth** — `gh` not logged in on build box
3. **API keys** — `AGENTMAIL_API_KEY`, `AGENTMAIL_WEBHOOK_SECRET`, `FIRECRAWL_API_KEY` (+ optional webhook secret)
4. **Convex project / deploy account** — required for `npx convex dev` codegen + hosting

## Demo path without keys

`npm run test:gate` then, after Convex login: `npx convex dev` → UI Fixtures → Run all → GRANT + REFUSE mask 10.
