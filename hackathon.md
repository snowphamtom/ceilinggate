# CeilingGate — Convex All Gas build log

- **App:** CeilingGate — everyday money-claim checker (small biz / contractors / grant seekers)
- **Path (box):** `/workspace/ceilinggate`
- **Started:** 2026-09-05
- **Deadline:** 2026-09-22 12:00 PM PT
- **Publish:** KEEP LOCAL until Origin/`gh` unblocked → then public GitHub
- **Live URL:** _pending — Convex project → `*.convex.site` static host_
- **Public repo:** _deferred (blocker)_
- **Luma register:** Done (“You’re In”)
- **Inbox:** `ceilinggate@agentmail.to`

## Everyday pitch (judging)

Email a money claim with a public receipt link. CeilingGate scrapes the receipt, compares each line to what was claimed, and returns **GRANT** or **REFUSE** with failed lines in plain English (e.g. “Lodging is $1 over the receipt”).

**Not** a chat app. **Not** a gate SDK. **Not** docs-search. **Not** a copy of the AgentMail chat demo.

## Stack (required artifacts)

| Artifact | Status |
|----------|--------|
| New full-stack app | Yes — `/workspace/ceilinggate` |
| Convex backend | `convex/` schema, mutations, queries, actions, http |
| Firecrawl Convex component | `convex/convex.config.ts` uses `@firecrawl/firecrawl-convex`; `pipeline.scrapeAndGate` |
| AgentMail real ingress | Component + inbox `ceilinggate@agentmail.to`; webhook stub `/agentmail/webhook` |
| Live queries/mutations | `claims`, `gates`, `fixtures`, `pipeline`, `inboxes` |
| Path to convex.site | Vite `build` → deploy static to Convex hosting when deploy key exists |
| ResidualGates math | Runtime port; offline `demo:gate` PASS |

## Build log (chronological)

### 2026-09-05 — scaffold
- [x] Design (`docs/design.md`)
- [x] Vite + React + TS
- [x] Schema: claims, interiors, gateDecisions, vectors, scrapes, inboxes
- [x] Gate logic + `npm run demo:gate` → GRANT + REFUSE mask **10**
- [x] AgentMail inbox created: `ceilinggate@agentmail.to`
- [x] Firecrawl + AgentMail components wired in `convex.config.ts`
- [x] Pipeline: AgentMail → parse → Firecrawl scrape → gateB
- [x] Offline board UI + `npm run build` green

### 2026-09-05 — originality harden
- [x] Forensic board (not chat thread)
- [x] Firecrawl mandatory for live judgment when URL exists
- [x] Drive-fuel fixtures (Monsters Ink T&E), not lorem
- [x] README rules checklist 1–11

### 2026-09-05 — judging pivot (everyday apps)
- [x] UI/copy reframed for normal-person money claims
- [x] Plain-English failed lines (no SDK-first framing)
- [x] Claims inbox + result board language
- [ ] Convex cloud deploy + `*.convex.site`
- [ ] Live AgentMail webhook + Firecrawl key in Convex env
- [ ] Public GitHub
- [ ] vibeapps.dev video + social (Taylor sends)


### 2026-09-05 — offline demo FLAG
- [x] **Offline gate demo WORKS** (`npm run demo:gate` PASS; `npm run build` green; everyday UI preview)
- Public GH still waiting on Origin or Taylor repo URL


### 2026-09-05 — autonomous: no Taylor asks
- [x] Local git commit `1acbfec`
- [x] Tried `gh` — not logged in
- [x] Tried CloudAgent new_repo — Origin namespace missing
- [x] Last-resort tarball prepared under `/workspace/releases/`
- Everyday framing + originality unchanged; offline demo still PASS

## Blockers (work around — do not wait)

1. Convex login / `CONVEX_DEPLOY_KEY` → hosting on `*.convex.site`
2. `FIRECRAWL_API_KEY` in Convex env → live scrapes
3. AgentMail webhook secret → verified ingress
4. Origin namespace / `gh` auth → public GitHub

## Demo without keys

```bash
cd /workspace/ceilinggate
npm install && npm run demo:gate && npm run build && npm run preview
```

Click **Check sample claims** → GRANT (all lines OK) + REFUSE (lodging & misc over).
