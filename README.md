# CeilingGate

**Everyday money-claim checker** for small businesses, contractors, and grant seekers — not a chat app, not a developer SDK.

Someone emails a claim with a public receipt link. CeilingGate scrapes the receipt, compares each line, and returns **GRANT** or **REFUSE** with failed lines in plain English (e.g. “Lodging is $1 over the receipt”).

Under the hood: GRANT iff `claimed ≤ interior` componentwise; else REFUSE with a failure bitmask (ResidualGates).

**Deadline:** Tue Sep 22, 2026 · 12:00 PM PT · host `*.convex.site` · public GitHub when Origin/`gh` unblocked.

**PUBLISH GO** — see `PUBLISH.md`. Path: `/workspace/ceilinggate`.

---

## Hackathon rules checklist

| # | Rule | CeilingGate |
|---|------|-------------|
| 1 | New full-stack app | Yes — this repo, not a fork rebrand |
| 2 | Convex backend | `convex/` schema + pipeline + http |
| 3 | Firecrawl feeds data | Mandatory scrape when claim has a public URL; no judgment without scraped interior |
| 4 | AgentMail inbox | Claim ingress `ceilinggate@agentmail.to` (not chat transcript export) |
| 5 | Built with agent / Codex + Convex plugin | Scaffolded under Create + Convex/Firecrawl/AgentMail plugins |
| 6 | Host frontend on convex.site OR chatgpt.site | Target `*.convex.site` (MANAGER Convex login) |
| 7 | Public GitHub (not private) | PUBLISH GO — MANAGER login then push |
| 8 | No localhost submission | Offline board is for build; submission is hosted |
| 9 | Video on vibeapps.dev by Sep 22 12:00 PM PT | Streamer draft later; Taylor asks |
| 10 | Social tags @convex @OpenAI @firecrawl @agentmail | Taylor sends (draft-only here) |
| 11 | Luma registered | Done (“You’re In”) |

---

## Originality vs chat-demo toys

**Not** `waynesutton/convex-agentmail-hackathon-demo` and **not** a Firecrawl docs-search chat.

| Chat-demo pattern | CeilingGate |
|-------------------|-------------|
| Email ↔ AI buddy thread UI | Forensic **case docket + verdict board + ledger** |
| AgentMail as chat export | AgentMail = **claim ingress only** |
| Firecrawl optional / search toy | Firecrawl **required** for live judgment when URL exists |
| LLM “looks fine” approve | ResidualGates **mask** — machine-checkable GRANT/REFUSE |
| Lorem / sample receipts | Fixtures from **Monsters Ink Drive fuel** (T&E residual-honesty vectors + Lean samples) |
| Soft product copy | Accounting / forensic voice |

Core loop: **claim vectors vs interior vectors → bitmask**.

---

## Architecture

```
AgentMail claim email ──► Convex claims ──► Firecrawl scrape (mandatory if URL)
                                      │
                                      ▼
                         ResidualGates gateB → GRANT / REFUSE + mask
                                      │
                                      ▼
                         Forensic UI (docket · ledger · verdict)
```

Offline: Drive-fuel fixtures ship with **fixture scrape** text as interior stand-in so the board demos without keys.

## Quick start

```bash
cd /workspace/ceilinggate
/usr/bin/npm install
/usr/bin/npm run demo:gate     # Lean samples: grant + refuse mask 10
/usr/bin/npm run build
/usr/bin/npm run preview       # forensic board
```

## ResidualGates samples (Drive-fuel labeled)

| Case | Interior | Claimed | Result |
|------|----------|---------|--------|
| `CG-TE-001` te-grant | `[100,50,25,10]` | `[98,49,25,9]` | GRANT / mask `0` |
| `CG-TE-002` te-refuse | `[100,50,25,10]` | `[98,51,25,11]` | REFUSE / mask `10` (lodging+misc) |

Line items: fuel, lodging, meals, misc — mapped from Lean `sample_valid` / `sample_invalid`.

## Env blockers

| Blocker | Why |
|---------|-----|
| Origin / `gh` | Public GitHub |
| `CONVEX_DEPLOY_KEY` / login | `*.convex.site` |
| `FIRECRAWL_API_KEY` | Live scrapes (required for live judgment) |
| AgentMail webhook secret | Verify inbound |

Inbox: `ceilinggate@agentmail.to`

## Out of scope

No Square shop edits, no COHOCF mythos products, no MAGPIE SKU, no “AI buddy” framing.
