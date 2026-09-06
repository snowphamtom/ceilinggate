# CeilingGate

Everyday expense-line checker for All Gas.

Email a money claim with a public receipt link. CeilingGate scrapes the receipt, compares each claimed line to what is on the page, and returns **GRANT** or **REFUSE** with the failed lines in plain English (example: “Lodging is $1 over the receipt”).

Not a chat app. Not a docs-search bot. Not the AgentMail inbox-assistant sample.

## Links judges need

| | |
|---|---|
| Live app | https://quirky-rhinoceros-204.convex.site/ |
| Health | https://quirky-rhinoceros-204.convex.site/health |
| Repo | https://github.com/snowphamtom/ceilinggate |
| Demo (~1:25) | https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-20260905 |
| Listing | https://vibeapps.dev/s/ceilinggate |
| Claims inbox | ceilinggate-claims@agentmail.to |
| Share | https://x.com/magpie_inventor/status/2096419465973944560 |

Started 2026-09-05. Submitter: Taylor Heller.

## How to click it (no login)

1. Open the live app.
2. Click **Demo GRANT**, then **Demo REFUSE** (or the GRANT → $1 REFUSE signature).
3. Read the ledger: line, claimed amount, amount on the receipt, GRANT/REFUSE.
4. Optional live path: email a claim plus a public receipt URL to the inbox. The board updates after Firecrawl reads the page. The ship-set demo does not need email.

Judges do not need API keys, a Convex dashboard, or an account.

## What each sponsor does

| Piece | Real work |
|---|---|
| **Convex** | Claims, scrapes, and gate decisions live in Convex. Queries and mutations drive the board. Frontend is on `*.convex.site`. |
| **Firecrawl** | Scrapes the public receipt URL. The gate reads those totals. No URL, no live judgment. |
| **AgentMail** | Inbox `ceilinggate-claims@agentmail.to` plus webhook into Convex. |
| **OpenAI** | One plain-English sentence **after** the numbers. It does not pick GRANT or REFUSE. |

Rule of the product: numbers first, language second.

## Why this is not a copy of the sample

The sample is a chat thread that talks about mail. CeilingGate is a forensic spend ledger. Each claimed line is checked against the scraped receipt. Over = REFUSE and the overage is named. Under or equal = GRANT. No chat panel.

## Stack

- Vite + React + TypeScript frontend on Convex static hosting
- Convex schema, queries, mutations, actions, HTTP routes (`convex/`)
- Firecrawl Convex component (`pipeline.scrapeAndGate`)
- AgentMail component + `/agentmail/webhook`
- Offline check: `npm run demo:gate` (GRANT path + REFUSE mask)

## Build, short

**2026-09-05**
- Scaffold, schema, offline GRANT/REFUSE demo
- Forensic board (not a chat UI)
- Everyday copy: money claim + receipt, not an SDK pitch
- Live deploy on quirky-rhinoceros-204.convex.site
- Public repo, AgentMail inbox, Firecrawl in the pipeline
- Demo video on release `allgas-demo-20260905`
- Vibe Apps listing + X post tagging @convex @OpenAI @firecrawl @agentmail

## Eligibility snapshot

New app after Aug 25. Convex backend. Public GitHub. Live `convex.site`. Video under 3 minutes. Luma registered. Social tags sent.
