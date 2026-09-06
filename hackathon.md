# CeilingGate — Convex All Gas build log

**Cash tiers (Luma only):** $10k / $5k / $1.5k. USPTO fee fixtures (e.g. $2,100 Track One) are not prize money.

- **App:** CeilingGate — everyday money-claim checker (small biz / contractors / grant seekers)
- **Path (box):** `/workspace/ceilinggate`
- **Started:** 2026-09-05
- **Deadline:** 2026-09-22 12:00 PM PT
- **Publish:** **LIVE** — Taylor FULL GO
- **Live URL:** https://quirky-rhinoceros-204.convex.site/
- **Public repo:** https://github.com/snowphamtom/ceilinggate
- **Luma register:** **Done** (“You’re In”)
- **Inbox:** `ceilinggate-claims@agentmail.to`

## Everyday pitch (judging)

Email a money claim with a public receipt link. CeilingGate scrapes the receipt, compares each line to what was claimed, and returns **GRANT** or **REFUSE** with failed lines in plain English (e.g. “Lodging is $1 over the receipt”).

**Not** a chat app. **Not** a gate SDK. **Not** docs-search. **Not** a copy of the AgentMail chat demo.

## Stack (required artifacts)

| Artifact | Status |
|----------|--------|
| New full-stack app | Yes — `/workspace/ceilinggate` |
| Convex backend | `convex/` schema, mutations, queries, actions, http |
| Firecrawl Convex component | `convex/convex.config.ts` uses `@firecrawl/firecrawl-convex`; `pipeline.scrapeAndGate` |
| AgentMail real ingress | Component + inbox `ceilinggate-claims@agentmail.to`; webhook stub `/agentmail/webhook` |
| Live queries/mutations | `claims`, `gates`, `fixtures`, `pipeline`, `inboxes` |
| Path to convex.site | Vite `build` → deploy static to Convex hosting when deploy key exists |
| ResidualGates math | Runtime port; offline `demo:gate` PASS |

## Build log (chronological)

### 2026-09-05 — scaffold
- [x] Design (`docs/design.md`)
- [x] Vite + React + TS
- [x] Schema: claims, interiors, gateDecisions, vectors, scrapes, inboxes
- [x] Gate logic + `npm run demo:gate` → GRANT + REFUSE mask **10**
- [x] AgentMail inbox created: `ceilinggate-claims@agentmail.to`
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
- [x] Convex cloud deploy + `*.convex.site`
- [x] Live AgentMail webhook + Firecrawl key in Convex env
- [x] Public GitHub
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


### 2026-09-05 — local lock then overridden (historical)
- [x] No GitHub / Origin push until later go
- [x] Finish local scaffold, gate demo, hackathon.md, fixtures
- Publish deferred; tarball may exist but is not a publish step


### 2026-09-05 — PUBLISH GO
- [x] Taylor authorized account creation
- [x] Repo prepped (`PUBLISH.md`); gate demo re-verified PASS
- [ ] MANAGER: GH login + public repo create
- [ ] MANAGER: Convex login + project
- [ ] Create: `git push` + `convex deploy` / site wire when creds exist


### 2026-09-05 — PUBLISH LIVE (Taylor override)
- [x] Keep-local overridden — publish authorized
- [x] Luma done
- [x] AgentMail `ceilinggate-claims@agentmail.to` exists; webhook path in `convex/http.ts`
- [x] Offline tests kept green
- [ ] GH public remote — browser create/login in flight (MANAGER)
- [ ] Create: git push when remote URL appears
- [ ] Convex login → `*.convex.site` + env keys


### 2026-09-05 — Drive fuel fixtures
- [x] Loaded Eve brief `1l1wjwE8…` + priority fileIds into `fixtures/demo.json` (14 forensic cases)
- [x] Labels = forensic claim↔receipt examples (not chat)
- [x] Offline `demo:offline` still green


### 2026-09-05 — Eve Batch2 fixtures merged
- [x] Sibling brief `1iNnqPeHizQyiOYvDnhjypbqVXyAXPUBT` + listed Batch2 fileIds
- [x] Fixtures total 23 (Lean 2 + forensic Drive); all 8 requested fileIds covered
- [x] CISA/IC3/NIST/Verizon URL seeds added; offline demo still green


### 2026-09-05 — everyday sentence + more Eve fuel
- [x] UI/README lead with judging everyday expense sentence
- [x] Fixtures now 28 (Batch2/3/4 strong pairs added); demo still green


### 2026-09-05 — Eve Batch3 fixtures merged
- [x] Sibling brief `1GRhQrnN5MasH7_Soyj1DeFeVM3K92AZp`
- [x] All 18 requested Batch3 fileIds covered; fixtures total **43**
- [x] Offline demo still green

## Remaining (MANAGER login unblocks)

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


## LIVE (2026-09-05 evening CT)
- [x] Site https://quirky-rhinoceros-204.convex.site/ (+ /health)
- [x] GH https://github.com/snowphamtom/ceilinggate
- [x] Tip (see STATUS.md) — Batch15 shortlist includes Missing Parts $900 public fee-schedule URL
- [x] Firecrawl Y · AgentMail Y · inbox `ceilinggate-claims@agentmail.to`
- [x] Cash prizes ONLY $10k/$5k/$1.5k (Luma)
- [x] vibeapps screenshots (`/workspace/ceilinggate-demo/shots/`) + [ ] video
- [ ] Submit https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit
- [x] Demo pack release https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-20260905 (off-phone)
