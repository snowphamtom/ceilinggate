# CeilingGate

Email a money claim with a public receipt. CeilingGate checks each line against the receipt page and returns **GRANT**, or **REFUSE** with the over line in plain English.

Not a chat app. Not a developer SDK. Not the AgentMail sample inbox assistant.

## Current Status (2026-11-08) — Residual-Honest

| Surface | Measured Status |
|---------|-----------------|
| Live app | https://snowphamtom.github.io/ceilinggate/ |
| Product rule | Claimed ≤ receipt → GRANT; else REFUSE names the dollar overage |
| CI deploy | Green on master push (Convex) |
| Demo path | Prefer-live same-origin `/hls` + Public YT secondary |
| Two-host rule | Static fortress on GitHub Pages; Convex API on `.convex.cloud` (never point VITE_CONVEX_URL at `.site`) |
| Contest / listing | Materials present; no new submission claimed in this pass |

## Judges — start here

| | |
|---|---|
| Live | https://snowphamtom.github.io/ceilinggate/ |
| Demo video | https://snowphamtom.github.io/ceilinggate/watch.html |
| Playlist | https://snowphamtom.github.io/ceilinggate/hls/master.m3u8 |
| Health | https://snowphamtom.github.io/ceilinggate/health |
| Build log | [hackathon.md](./hackathon.md) |
| CI | [convex-deploy](https://github.com/snowphamtom/ceilinggate/actions/workflows/convex-deploy.yml) |
| Demo files | [Public YT](https://www.youtube.com/watch?v=hDnY3_iszX4) · [allgas-demo-yt](https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-yt) · [HLS ladder](https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-hls) |
| Listing | https://vibeapps.dev/s/claim-check |
| Inbox | ceilinggate-claims@agentmail.to |
| Share | https://x.com/magpie_inventor/status/2096419465973944560 |

Open the live app. Click **1 · Demo REFUSE**, then **2 · Demo GRANT**. Proof is above the fold. No login.

## What each sponsor does

- **Convex** — claims, scrapes, and decisions live in Convex. Frontend on `*.convex.site`. Actions deploys on every `master` push.
- **Firecrawl** — scrapes the public receipt. No URL, no live judgment.
- **AgentMail** — claim ingress at `ceilinggate-claims@agentmail.to`.
- **OpenAI** — one sentence after the numbers. It does not pick GRANT or REFUSE.

## Two hosts

Static fortress (browser, crawls, `/health`, `/watch.html`): `https://snowphamtom.github.io/ceilinggate`  
Convex client API (`VITE_CONVEX_URL`): `https://quirky-rhinoceros-204.convex.cloud`  
Evidence: `https://fleet-gerbil-682.convex.cloud`

Never point `VITE_CONVEX_URL` at `.site`. See [docs/TWO_HOST.md](./docs/TWO_HOST.md).

## Run locally

```bash
npm install
npm run demo:gate
npm run build
npm run preview
```
