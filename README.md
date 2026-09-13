# CeilingGate

Email a money claim with a public receipt. CeilingGate checks each line against the receipt page and returns **GRANT**, or **REFUSE** with the over line in plain English.

Not a chat app. Not a developer SDK. Not the AgentMail sample inbox assistant.

## Judges — start here

| | |
|---|---|
| Live | https://quirky-rhinoceros-204.convex.site/ |
| Demo video | https://quirky-rhinoceros-204.convex.site/watch.html |
| Playlist | https://quirky-rhinoceros-204.convex.site/hls/master.m3u8 |
| Health | https://quirky-rhinoceros-204.convex.site/health |
| Build log | [hackathon.md](./hackathon.md) |
| CI | [convex-deploy](https://github.com/snowphamtom/ceilinggate/actions/workflows/convex-deploy.yml) |
| Demo files | [prefer-live YT](https://www.youtube.com/watch?v=2KsMO90LpdE) · [allgas-demo-yt](https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-yt) · [HLS ladder](https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-hls) |
| Listing | https://vibeapps.dev/s/ceilinggate-1 |
| Inbox | ceilinggate-claims@agentmail.to |
| Share | https://x.com/magpie_inventor/status/2096419465973944560 |

Open the live app. Click **1 · Demo REFUSE**, then **2 · Demo GRANT**. Proof is above the fold. No login. Video: YouTube prefer-live `2KsMO90LpdE` (letter **O**) on `/watch.html` + DemoReel; on-site player uses true HLS (`allgas-demo-hls` ladder) with progressive `allgas-demo-yt` mp4 fallback.

## What each sponsor does

- **Convex** — claims, scrapes, and decisions live in Convex. Frontend on `*.convex.site`. Actions deploys on every `master` push.
- **Firecrawl** — scrapes the public receipt. No URL, no live judgment.
- **AgentMail** — claim ingress at `ceilinggate-claims@agentmail.to`.
- **OpenAI** — one sentence after the numbers. It does not pick GRANT or REFUSE.

## 2026-09-13

CI deploy is green. `/watch.html` embeds YouTube `2KsMO90LpdE` (prefer-live); on-site progressive/HLS uses true ABR from release `allgas-demo-hls` (YT cut) with `allgas-demo-yt` mp4 fallback and fresh GRANT poster (not 20260905). Product rule unchanged: claimed ≤ receipt, or REFUSE names the dollar overage.

## Two hosts

Static fortress (browser, crawls, `/health`, `/watch.html`): `https://quirky-rhinoceros-204.convex.site`  
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
