# CeilingGate design (hackathon)

**Product:** CeilingGate  
**Event:** Convex All Gas (OpenAI · Firecrawl · AgentMail)  
**Deadline:** Tue Sep 22, 2026 · 12:00 PM PT  
**Lean reference:** `/workspace/cohocf-beta3/ResidualGatesMathlib.lean` (`ℚ` lists so `native_decide` is legal)  
**Status:** BUILD GO. Luma registered (“You’re In”). Originality lock: forensic board, not chat-demo.

---

## Originality lock (vs chat-demo)

CeilingGate is **not** a chat-with-email rebrand of waynesutton/convex-agentmail-hackathon-demo or a Firecrawl docs-search toy.

- UI = case docket + ledger + verdict stamp (forensic/accounting voice)
- AgentMail = claim ingress only
- Firecrawl mandatory when a public URL exists — no judgment without scraped interior
- Fixtures = Monsters Ink Drive fuel (T&E residual-honesty + Lean samples), not lorem

## Pitch

CeilingGate is the honesty gate for dollar claims that arrive by email.

An AgentMail inbox receives a claim (travel, fuel, T&E, invoice ceiling). Firecrawl scrapes the linked **public** receipt/interior URL. Convex stores the claimed and interior vectors and runs a ResidualGates decision:

> **GRANT** iff `claimed ≤ interior` componentwise; else **REFUSE** with a bitmask of failed indices.

The UI is live: green GRANT or red REFUSE as soon as the scrape + gate finish. No vibes, no “looks fine” — a mask you can audit.

One-liner for judges: *Email claims a ceiling; the public receipt is the interior; Convex refuses the overclaim in realtime.*

---

## Why this wins (sponsor load-bearing)

Judges score **everyday usefulness** + **sponsor stack doing real work**, not another CRUD toy.

| Sponsor | Load-bearing job in CeilingGate |
|--------|----------------------------------|
| **AgentMail** | Claim ingress. Real inbox → webhook → Convex claim case. Without AgentMail there is no product surface. |
| **Firecrawl** | Independent interior. Scrapes the linked public receipt/page into numbers. Without Firecrawl, interiors are hand-waved. |
| **Convex** | Source of truth + gate + realtime UI. Schema, actions, http webhooks, `useQuery` GRANT/REFUSE. Host on `*.convex.site`. |
| **OpenAI / Codex** | Build + optional extract assist (parse claim text / receipt markdown). Prefer Convex AI Gateway if team is paid; otherwise fixture-first so demo never depends on a key. |

Differentiation: ResidualGates is a **machine-checkable policy** (Lean-backed semantics), not an LLM “approve” button. Everyday use: expense / fuel / vendor ceilings — a real person opens the inbox this week.

---

## User journey (3 screens)

1. **Inbox / Claims** — Live AgentMail-fed feed. Each row: subject, claimed vector preview, linked URL(s), pipeline status (`received → parsing → scraping → gated`).
2. **Gate decision** — Selected claim: side-by-side claimed vs interior, status **GRANT** (green) or **REFUSE** (red), `mask` hex/decimal, `failedIndices` chips, scrape URL + timestamp.
3. **Fixture runner** — One-click demo fuel (undistorted Drive samples): run Lean-aligned grant + refuse fixtures without waiting on live mail/scrape. Judges see the law in <10s.

---

## Convex data model

Tables (app space; AgentMail/Firecrawl components keep their own sandboxed tables):

### `claims`
- `threadId`, `messageId` (AgentMail ids)
- `subject`, `from`, `receivedAt`
- `bodyText` / `bodyHtml` (truncated ok)
- `claimed: number[]` — parsed dollar ceilings (ℚ-as-f64 for runtime; fixtures keep exact decimals)
- `sourceUrls: string[]` — public links to scrape
- `status`: `received | parsing | scraping | ready | gated | error`
- `error?: string`
- optional `embeddingId` → vectors table

### `interiors`
- `claimId`
- `url`
- `firecrawlJobId?`
- `rawMarkdown` / `rawText` (capped)
- `interior: number[]` — receipt/interior components (aligned length to claimed when gated)
- `scrapedAt`

### `gateDecisions`
- `claimId` (unique)
- `status`: `grant | refuse`
- `mask: number`
- `failedIndices: number[]`
- `claimed: number[]`, `interior: number[]` (frozen snapshot)
- `decidedAt`

### `vectors` (optional for “Convex stores vectors”)
- `claimId` or `interiorId`
- `kind`: `claim | receipt | joint`
- `embedding: number[]` (or Convex vector index when enabled)
- Used for similarity / audit search — **not** a substitute for the gate.

Indexes: `claims.by_receivedAt`, `claims.by_status`, `gateDecisions.by_claimId`, `interiors.by_claimId`.

---

## Pipeline (AgentMail → parse → Firecrawl → gate → UI)

```
AgentMail webhook (convex.site/agentmail/webhook)
  → onMessageReceived
  → parseClaim(email): extract claimed[] + sourceUrls[]
  → insert claims (status=parsing→scraping)
  → Firecrawl scrape(url) → interiors.interior[]
  → gateB(interior, claimed) → gateDecisions
  → claims.status = gated
  → React useQuery → GRANT/REFUSE UI
```

**Parse rules (MVP):**
- Prefer structured lines: `CLAIMED: 98, 49, 25, 9` and `RECEIPT: https://…`
- Fallback: first N currency amounts in body = claimed; first http(s) link = scrape target.
- Length mismatch → REFUSE with explicit error / mask policy (document: treat as non-enclosed).

**Firecrawl:** scrape markdown; extract `INTERIOR: a, b, c, d` if present, else currency amounts in document order. Demo fixtures host static public pages or in-repo HTML served for scrape.

**UI:** subscribe to `listClaims` + `getDecision(claimId)`; no polling.

---

## ResidualGates mapping (`enclosedR`, `breachesR`, `maskOf`, `gateB`)

Port of `ResidualGatesMathlib.lean` (runtime TS; Lean stays the proof oracle):

| Lean | Runtime |
|------|---------|
| `enclosedR interior claimed` | Same length and ∀i. `claimed[i] ≤ interior[i]` |
| `breachesR interior claimed 0` | Indices where `interior[i] < claimed[i]` |
| `maskOf failed` | `foldl (acc, idx) => acc \| (1 << idx)` |
| `gateB` | if enclosed → `{grant, mask:0, []}` else `{refuse, mask: m\|\|1, failed}` |
| `granted` | `status===grant && mask===0` |

Lean samples (must pass in fixture runner):

| Name | Interior | Claimed | Result |
|------|----------|---------|--------|
| `sample_valid_grant` | `[100,50,25,10]` | `[98,49,25,9]` | GRANT |
| `sample_invalid_refuse` | `[100,50,25,10]` | `[98,51,25,11]` | REFUSE, `mask=10` (bits 1 & 3) |

Note: executable gate stays on rationals/decimals; do not `native_decide` on ℝ — same constraint as Lean.

---

## Demo fixtures JSON schema (from Drive undistorted fuel)

Undistorted fuel = Drive-honest T&E/ceiling examples aligned to Lean samples (no Kodex physics claims). File: `fixtures/demo-fixtures.json`.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CeilingGateDemoFixtures",
  "type": "object",
  "required": ["version", "source", "fixtures"],
  "properties": {
    "version": { "type": "string" },
    "source": {
      "type": "string",
      "description": "Drive undistorted fuel / ResidualGates samples"
    },
    "fixtures": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "email", "claimed", "interior", "expect"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "email": {
            "type": "object",
            "required": ["subject", "from", "body"],
            "properties": {
              "subject": { "type": "string" },
              "from": { "type": "string" },
              "body": { "type": "string" },
              "receiptUrl": { "type": "string", "format": "uri" }
            }
          },
          "claimed": { "type": "array", "items": { "type": "number" } },
          "interior": { "type": "array", "items": { "type": "number" } },
          "expect": {
            "type": "object",
            "required": ["status", "mask", "failedIndices"],
            "properties": {
              "status": { "enum": ["grant", "refuse"] },
              "mask": { "type": "integer", "minimum": 0 },
              "failedIndices": {
                "type": "array",
                "items": { "type": "integer", "minimum": 0 }
              }
            }
          }
        }
      }
    }
  }
}
```

Canonical fixtures:

1. **te-grant** — claimed `[98,49,25,9]` ≤ interior `[100,50,25,10]` → GRANT / mask 0  
2. **te-refuse** — claimed `[98,51,25,11]` ≰ interior → REFUSE / mask 10 / failed `[1,3]`

Line items metaphor (demo copy only): `[fuel, lodging, meals, misc]` dollar ceilings vs receipt totals.

---

## 60-second demo script

| t | Action |
|---|--------|
| 0–5s | Open `*.convex.site` — Inbox screen, “CeilingGate” title. |
| 5–15s | Fixture runner → **te-grant** → green **GRANT**, mask `0`. |
| 15–30s | **te-refuse** → red **REFUSE**, mask `10`, chips on indices 1 & 3. Say: “claimed ≤ interior, else bitmask.” |
| 30–45s | Show (or simulate) AgentMail claim email + Firecrawl scrape status flipping to gated. |
| 45–55s | Point at Convex dashboard / live query — no refresh. |
| 55–60s | Close: “Email claim · public receipt · ResidualGates · Convex realtime.” |

Video ≤ 3 min for vibeapps; this 60s cut is the core.

---

## Submission checklist

| Item | Status |
|------|--------|
| Register on Luma (`luma.com/convex-allgas-hackathon`) | **HELD** — do not register until Taylor confirms |
| New app started ≥ Aug 25, 2026 | Pending scaffold |
| Convex backend (queries/mutations/actions/components) | In progress |
| AgentMail does real inbox work | Blocked on API key + webhook |
| Firecrawl does real scrape work | Blocked on API key |
| Frontend on **convex.site** (or chatgpt.site) | Planned; blocked on Convex project |
| Public GitHub repo (no private) | Blocked on `gh` auth / Origin mirror |
| `hackathon.md` build log in repo | Scaffold |
| Social post tagging @convex @OpenAI @firecrawl @agentmail | Later |
| Submit video on vibeapps.dev (exact All Gas submit URL) before **Sep 22, 2026 12:00 PM PT** | Later |
| No localhost-only submission | Enforced by host plan |

---

## Out of scope

- Deploying with real API keys in this design pass (keys stay in Convex env, never in git)
- Lean-in-the-loop CI proving each live email (Lean is semantic oracle; TS is the runtime gate)
- Auth / multi-tenant orgs (optional later; not required)
- Private receipt URLs, paywalled pages, or credentialed scrape
- MAGPIE / CH4R0N / quantum / Kodex physics claims
- Federal SAM/CAGE sales motion
- Replacing the gate with an LLM approve/deny
- iOS/Android native apps

---

## Open questions for Taylor (max 3)

1. **Luma register:** Keep **HELD**, or register now under yeti.monstersink / Monsters Ink so the clock and Discord visibility are official?
2. **Keys & Convex project:** Which account owns the Convex deployment + AgentMail inbox + Firecrawl key for the public `*.convex.site` demo (and is AI Gateway available on that plan)?
3. **Public GitHub:** Preferred org/user for the required public repo (push from Origin mirror vs direct `gh` login on the build machine)?

---

*Design-only content above; implementation lives in `/workspace/ceilinggate`. Deadline hard stop: Sep 22, 2026 12:00 PM PT.*
