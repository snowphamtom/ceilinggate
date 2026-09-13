# CeilingGate

Everyday **receipt-line** expense checker for Convex All Gas.

Email a money claim with a public receipt URL. CeilingGate scrapes the receipt, compares **each claimed line** to on-receipt amounts (**C ≤ S**), and returns **GRANT** or **REFUSE**. REFUSE names the overage in dollars (“Lodging is $1 over the receipt”). OpenAI writes one sentence after the numbers — it does not decide.

Live root is the continuous **Sorting Machine** (GATHER → SORT), not a chat product, not a page-promise checker, not an SDK sample.

## Links judges need

| | |
|---|---|
| **Listing (canonical)** | https://vibeapps.dev/s/ceilinggate-1 |
| Live app (Sorting Machine root) | https://quirky-rhinoceros-204.convex.site/ |
| Health | https://quirky-rhinoceros-204.convex.site/health |
| Repo | https://github.com/snowphamtom/ceilinggate |
| CI (green deploy) | https://github.com/snowphamtom/ceilinggate/actions/workflows/convex-deploy.yml |
| Demo prefer-live (YouTube silent) | https://www.youtube.com/watch?v=2KsMO90LpdE |
| Demo prefer-live (GH file) | https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-yt/CeilingGate-Forge-gates-clip-YT.mp4 |
| Claims inbox | ceilinggate-claims@agentmail.to |

Started 2026-09-05. Submitter: Taylor Heller. Deadline: 2026-09-22 12:00 PM PT.  
**HOLD FILE** on the vibeapps card — UPDATE listing only (`ceilinggate-1`, not legacy `/s/ceilinggate`).

## How to judge it (no login, no keys)

1. Open the live app — root is the **Sorting Machine**.
2. Click **Demo GRANT**, then **Demo REFUSE**.
3. Read the ledger: **LINE · CLAIMED (C) · ON RECEIPT (S) · STATUS** → GRANT/REFUSE stamp.
4. Check Evidence/Verdict **GR-21 residual commitment** (C≤S projector · commit hash · σ²) on the stamp.
5. Optional live path: email a claim plus a public receipt URL to the inbox. The board updates after Firecrawl reads the page.

Judges do not need API keys, a Convex dashboard, or an account.

## Differentiator (receipt-line beat)

| Us | Not us |
|---|---|
| Every **receipt line** gated **C ≤ S** → GRANT/REFUSE | Whole-page promise / chat shrug |
| Continuous gather → sort Sorting Machine root | Organize-in-place costume board |
| GR-21 residual commitment on Evidence/Verdict stamps | Block / vibes10 style page gaps without line residuals |

Rule: numbers first, language second. Leftover on one line cannot cover a hole on another.

## What each sponsor does

| Piece | Work on the live path |
|---|---|
| **Convex** | Claims, scrapes, gate decisions, Sorting Machine board on `*.convex.site`. Evidence backend stamps GR-21 residual (`gr21:getLastResidual`). GitHub Actions deploys with `npx convex deploy`. |
| **Firecrawl** | Scrapes the public receipt URL into a line ledger. No URL, no live judgment. |
| **AgentMail** | Inbox `ceilinggate-claims@agentmail.to` plus webhook into Convex. |
| **OpenAI** | `oneLine` after the numbers — one sentence only. Does **not** pick GRANT or REFUSE. |

## Why this is not the sample

The sample is a chat thread about mail. CeilingGate is a forensic **receipt-line** spend ledger. Each line is checked against the scraped receipt. Over = REFUSE with the named overage. At or under = GRANT. The judge UI has no chat panel.

## Stack

- Vite + React + TypeScript — Sorting Machine SPA root on Convex static hosting
- Convex schema, queries, mutations, actions, HTTP routes (+ Evidence fleet-gerbil GR-21 anchors)
- Firecrawl Convex component (`pipeline.scrapeAndGate`)
- AgentMail component + `/agentmail/webhook`
- OpenAI `oneLine` post-decision prose
- CI: `.github/workflows/convex-deploy.yml`
- Offline check: `npm run demo:gate`

## Eligibility snapshot

New app after 25 Aug 2026. Convex backend. Public GitHub. Live `convex.site`. Video under 3 minutes (prefer-live YT `2KsMO90LpdE` + allgas-demo-yt). Luma / Vibe listing `ceilinggate-1`. Social tags sent.
