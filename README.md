# CeilingGate

**Honesty gate for dollar claims that arrive by email.**

An AgentMail inbox receives a claim. Firecrawl scrapes the linked public receipt
(interior). Convex stores claimed vs interior vectors and runs ResidualGates:

> **GRANT** iff `claimed ≤ interior` componentwise; else **REFUSE** with a bitmask of failed indices.

Lean semantic oracle: `/workspace/cohocf-beta3/ResidualGatesMathlib.lean`  
Runtime port: `convex/lib/gates.ts` (numbers, no Lean in this repo)

One-liner: *Email claims a ceiling; the public receipt is the interior; Convex refuses the overclaim in realtime.*

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React + TypeScript |
| Backend | Convex (`queries` / `mutations` / `actions` / `http`) |
| Scrape | `@firecrawl/firecrawl-convex` component |
| Inbox | `@agentmail/convex` + webhook on `*.convex.site` |

## Quick start (local, no network keys)

```bash
cd /workspace/ceilinggate
npm install
npm run demo:gate    # asserts refuse mask === 10 (Lean sample_invalid)
npm run dev          # UI offline fixture demo (no VITE_CONVEX_URL)
```

Expected demo output includes:

```
ok: sampleInvalid mask 10 (bits 1 and 3)
CeilingGate ResidualGates demo PASSED
```

## Convex setup (needs login)

```bash
npx convex login          # interactive — blocker if no account on this machine
npx convex dev            # creates deployment, regenerates convex/_generated
npx convex env set FIRECRAWL_API_KEY fc-...
npx convex env set AGENTMAIL_API_KEY ...
npx convex env set AGENTMAIL_WEBHOOK_SECRET whsec_...
# optional:
npx convex env set FIRECRAWL_WEBHOOK_SECRET whsec-...
```

Copy the printed Convex URL into `.env.local`:

```bash
VITE_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
```

Then:

```bash
npm run dev
```

### Webhooks

| Service | URL |
|---------|-----|
| AgentMail | `https://<deployment>.convex.site/agentmail/webhook` |
| Firecrawl | `https://<deployment>.convex.site/firecrawl/webhook` (component mount) |

Register the AgentMail URL in the AgentMail dashboard and store the Svix secret as `AGENTMAIL_WEBHOOK_SECRET`.

## Env vars

| Name | Where | Purpose |
|------|-------|---------|
| `VITE_CONVEX_URL` | Vite `.env.local` | Frontend Convex client |
| `FIRECRAWL_API_KEY` | Convex env | Firecrawl scrapes |
| `FIRECRAWL_WEBHOOK_SECRET` | Convex env | Optional crawl webhook verify |
| `AGENTMAIL_API_KEY` | Convex env | Inbox API |
| `AGENTMAIL_WEBHOOK_SECRET` | Convex env | Svix verify (`whsec_…`) |

Never commit real keys.

## ResidualGates samples

| Fixture | Interior | Claimed | Result |
|---------|----------|---------|--------|
| `fuel-grant` | `[100,50,25,10]` | `[98,49,25,9]` | GRANT / mask `0` |
| `fuel-refuse` | `[100,50,25,10]` | `[98,51,25,11]` | REFUSE / mask `10` (bits 1 & 3) |

## Project layout

```
convex/
  lib/gates.ts          # gateB, enclosedR, breachesR, maskOf
  schema.ts             # inboxes, claims, fixtures
  claims.ts / fixtures.ts / inboxes.ts
  firecrawl.ts          # scrape action (component client)
  agentmail.ts          # onMessageReceived → claim row
  http.ts               # POST /agentmail/webhook
  convex.config.ts      # firecrawl + agentmail components
fixtures/demo-fixtures.json
scripts/demo-gate.js    # offline unit check
src/App.tsx             # GRANT/REFUSE UI + paste-fixture button
```

## Hackathon submission notes

- Event: **Convex All Gas** (OpenAI · Firecrawl · AgentMail)
- Deadline: **Tue Sep 22, 2026 · 12:00 PM PT**
- Host frontend on **`*.convex.site`** (or chatgpt.site) — not localhost-only
- Public GitHub repo required; include this README + `hackathon.md`
- Design notes: `/workspace/ceilinggate-design.md`
- Luma register: **HELD** until Taylor confirms

### If Convex login is blocked

Keep developing against `npm run demo:gate` + offline UI. Document the blocker; leave this runnable structure. After login, `npx convex dev` replaces stub `convex/_generated/*`.

### If Origin / GitHub push is blocked

Code lives on the box at `/workspace/ceilinggate`. Taylor can publish by:

1. Copying the tree to a machine with `gh` auth, or
2. Creating a public repo and pushing from Cursor Origin / GitHub integration, or
3. `tar czf ceilinggate.tgz -C /workspace ceilinggate` and uploading.

## License

Hackathon demo — see sponsor terms for submission.
