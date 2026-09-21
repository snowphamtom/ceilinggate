# Claim Check

Everyday **receipt-line** expense checker for Convex All Gas.

Email a money claim with a public receipt URL. Claim Check scrapes the receipt, compares **each claimed line** to on-receipt amounts (**C ≤ S**), and returns **GRANT** or **REFUSE**. REFUSE names the overage in dollars (“Lodging is $1 over the receipt”). OpenAI writes one sentence after the numbers — it does not decide.

Live root is **Claim Check** (GATHER → SORT claim-vs-receipt), not a chat product, not a page-promise checker, not an SDK sample.

## Links judges need

| | |
|---|---|
| **Listing (canonical)** | https://vibeapps.dev/s/claim-check |
| Live app PRIMARY (Claim Check) | https://snowphamtom.github.io/ceilinggate/ |
| API (two-host `.cloud`) | https://quirky-rhinoceros-204.convex.cloud |
| `.convex.site` | DEAD — free-plan HTTP 500; do not use |
| Health | `.cloud` ok when plan allows; `.site` DEAD |
| Repo | https://github.com/snowphamtom/ceilinggate |
| CI (green deploy) | https://github.com/snowphamtom/ceilinggate/actions/workflows/convex-deploy.yml |
| Demo prefer-live | https://snowphamtom.github.io/ceilinggate/watch.html · Public YT `hDnY3_iszX4` |
| Demo prefer-live (GH file) | https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-yt/CeilingGate-Forge-gates-clip-YT.mp4 |
| Claims inbox | ceilinggate-claims@agentmail.to |

Started 2026-09-05. Submitter: Taylor Heller. Deadline: 2026-09-22 12:00 PM PT.  
**HOLD FILE** on the vibeapps card — UPDATE listing only (`claim-check`, not legacy `ceilinggate-1`).

## How to judge it (no login, no keys)

1. Open the live app — root is **Claim Check**.
2. Click **1 · Demo GRANT**, then **2 · Demo REFUSE** (CG-TE lodging/misc $1 over). Read the Check ID stamp + LINE/CLAIMED/ON RECEIPT/STATUS table + OpenAI one-line each time.
3. Read the ledger: **LINE · CLAIMED (C) · ON RECEIPT (S) · STATUS** → GRANT/REFUSE stamp.
4. Check Evidence/Verdict **residual Check ID** (C≤S projector · short id · σ²) on the stamp.
5. Optional live path: email a claim plus a public receipt URL to the inbox. The board updates after Firecrawl reads the page.

Hero stays ResidualGates / C≤S — never an inbox yes/no chat. OpenAI one-line does not decide.

Judges do not need API keys, a Convex dashboard, or an account.

## Differentiator (receipt-line beat)

| Us | Not us |
|---|---|
| Every **receipt line** gated **C ≤ S** → GRANT/REFUSE + LINE/CLAIMED/ON RECEIPT/STATUS | Whole-page promise / chat shrug |
| ResidualGates expense board | **RecallReady** (forward receipt → product recall watch) |
| Claimed ≤ scraped receipt residual | **Exorcist** (forward receipts → cancel forgotten subs) |
| Expense C≤S table | **Owed** (terms/recovery chase, not line residual) |
| **Claim Check** + C≤S table (keep name) | **ClaimHero** (insurance denial appeals — name collision only) |
| Continuous gather → sort Claim Check root | Organize-in-place costume / inbox yes-no chat |

Rule: numbers first, language second. Leftover on one line cannot cover a hole on another. No freeform chat panel.

## What each sponsor does

| Piece | Work on the live path |
|---|---|
| **Convex** | Claims, scrapes, gate decisions on `*.convex.cloud`. PRIMARY face is GitHub Pages (`.convex.site` DEAD — accepted rule risk). Evidence backend stamps residual Check ID via the live residual query. GitHub Actions deploys with `npx convex deploy`. |
| **Firecrawl** | Scrapes the public receipt URL into a line ledger. No URL, no live judgment. |
| **AgentMail** | Inbox `ceilinggate-claims@agentmail.to` plus webhook into Convex. |
| **OpenAI** | `oneLine` after the numbers — one sentence only. Does **not** pick GRANT or REFUSE. |

## Why this is not the sample

The sample is a chat thread about mail. Claim Check is a forensic **receipt-line** spend ledger. Each line is checked against the scraped receipt. Over = REFUSE with the named overage. At or under = GRANT. The judge UI has no chat panel.

## Stack

- Vite + React + TypeScript — Claim Check SPA PRIMARY on GitHub Pages (`VITE_CONVEX_URL` → `*.convex.cloud`; `.site` DEAD)
- Convex schema, queries, mutations, actions, HTTP routes (+ Evidence fleet-gerbil residual anchors)
- Firecrawl Convex component (`pipeline.scrapeAndGate`)
- AgentMail component + `/agentmail/webhook`
- OpenAI `oneLine` post-decision prose
- CI: `.github/workflows/convex-deploy.yml`
- Offline check: `npm run demo:gate`


## Observatorium (two-host law)

Two-host law: client API = `*.convex.cloud`. Static face PRIMARY = GitHub Pages. `*.convex.site` DEAD (free-plan HTTP 500) — accepted rule risk until plan lifts.

**Never** point `VITE_CONVEX_URL` at `.site` — the SPA client dies. PRIMARY public face: `https://snowphamtom.github.io/ceilinggate/`. `.convex.site` DEAD until plan lifts.

Inner crawl: `npx convex run firewallCrawl:run '{}'`. Outer: `node scripts/firewall-crawl.mjs`. Doc: `docs/OBSERVATORIUM.md`.

## Lean judge face (KEEP)

Root SPA is the money sorter only: hero + 5-stage GATHER→BUCKET · prefer-live `/hls` yt7 · Public YT `hDnY3_iszX4` · Demo REFUSE then GRANT · Check ID stamp · lean AgentMail intake. Cascade/Drive/Sponsors stripped from root.

## Eligibility snapshot

New app after 25 Aug 2026. Convex backend. Public GitHub. Live GitHub Pages PRIMARY (`.site` DEAD). Video under 3 minutes (prefer-live `/hls` yt7 + Public YT `hDnY3_iszX4`). Luma / Vibe listing `claim-check`. Social tags sent.

## Senate lock 2026-09-14 12:37 CT
PRIMARY face = GitHub Pages. `.convex.site` DEAD — **accepted rule risk** (no Pro). Judges: use Pages URL on vibeapps listing.
