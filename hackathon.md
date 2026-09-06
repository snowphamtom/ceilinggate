# CeilingGate

Everyday expense-line checker for Convex All Gas.

Email a money claim with a public receipt URL. CeilingGate reads the receipt, compares each claimed line to the page, and returns **GRANT** or **REFUSE**. REFUSE names the overage in dollars (“Lodging is $1 over the receipt”). OpenAI writes one sentence after the numbers. It does not decide.

Not a chat product. Not an SDK. Not the AgentMail sample inbox assistant.

## Links judges need

| | |
|---|---|
| Live app | https://quirky-rhinoceros-204.convex.site/ |
| Health | https://quirky-rhinoceros-204.convex.site/health |
| Repo | https://github.com/snowphamtom/ceilinggate |
| CI (green deploy) | https://github.com/snowphamtom/ceilinggate/actions/workflows/convex-deploy.yml |
| Demo (~1:25) | https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-20260905 |
| Listing | https://vibeapps.dev/s/ceilinggate |
| Claims inbox | ceilinggate-claims@agentmail.to |
| Share | https://x.com/magpie_inventor/status/2096419465973944560 |

Started 2026-09-05. Submitter: Taylor Heller. Deadline: 2026-09-22 12:00 PM PT.

## How to judge it (no login, no keys)

1. Open the live app.
2. Click **Demo GRANT**, then **Demo REFUSE**.
3. Read the ledger: line, claimed, on-receipt, GRANT/REFUSE.
4. Optional live path: email a claim plus a public receipt URL to the inbox. The board updates after Firecrawl reads the page.

Judges do not need API keys, a Convex dashboard, or an account.

## What each sponsor does

| Piece | Work on the live path |
|---|---|
| **Convex** | Claims, scrapes, and gate decisions. Queries drive the board. Frontend on `*.convex.site`. GitHub Actions deploys with `npx convex deploy`. |
| **Firecrawl** | Scrapes the public receipt URL. No URL, no live judgment. |
| **AgentMail** | Inbox `ceilinggate-claims@agentmail.to` plus webhook into Convex. |
| **OpenAI** | One sentence after the numbers. Does not pick GRANT or REFUSE. |

Rule: numbers first, language second.

## Why this is not the sample

The sample is a chat thread about mail. CeilingGate is a forensic spend ledger. Each line is checked against the scraped receipt. Over = REFUSE with the named overage. At or under = GRANT. The judge UI has no chat panel.

## Stack

- Vite + React + TypeScript on Convex static hosting
- Convex schema, queries, mutations, actions, HTTP routes
- Firecrawl Convex component (`pipeline.scrapeAndGate`)
- AgentMail component + `/agentmail/webhook`
- CI: `.github/workflows/convex-deploy.yml` (green as of 2026-09-06)
- Offline check: `npm run demo:gate`

## Growth log

**2026-09-05 — ship day**
- Scaffold, schema, offline GRANT/REFUSE
- Forensic board (not a chat UI)
- Live on quirky-rhinoceros-204.convex.site
- Public repo, inbox, Firecrawl in the pipeline
- Demo release `allgas-demo-20260905`
- Vibe Apps listing + X post

**2026-09-06 — operational growth**
- GitHub Actions now deploys the same app judges click (first green: run 35; follow-on green: run 37)
- Two-store lock: deploy key only in GitHub Actions; app keys stay on Convex env
- OpenAI one-line attached to each gate decision (does not decide)
- Child gates on the live site: Tip Jar Honesty, Line Delta, Mask Chip
- Receipt line-check stays the product; operator log is separate from the judge path
- Schema hardened so existing ops rows validate on deploy

Measured, not promised: live `/health` returns `{"ok":true,"app":"CeilingGate"}`. Demo GRANT/REFUSE work without login.

## Eligibility snapshot

New app after 25 Aug 2026. Convex backend. Public GitHub. Live `convex.site`. Video under 3 minutes. Luma / Vibe listing. Social tags sent.
