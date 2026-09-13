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
| Demo files | [release allgas-demo-20260905](https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-20260905) |
| Listing | https://vibeapps.dev/s/ceilinggate |
| Inbox | ceilinggate-claims@agentmail.to |
| Share | https://x.com/magpie_inventor/status/2096419465973944560 |

Open the live app. Click **Demo GRANT**, then **Demo REFUSE**. Read the ledger. No login. Video plays on `/watch.html` from the GitHub release mp4s.

## What each sponsor does

- **Convex** — claims, scrapes, and decisions live in Convex. Frontend on `*.convex.site`. Actions deploys on every `master` push.
- **Firecrawl** — scrapes the public receipt. No URL, no live judgment.
- **AgentMail** — claim ingress at `ceilinggate-claims@agentmail.to`.
- **OpenAI** — one sentence after the numbers. It does not pick GRANT or REFUSE.

## 2026-09-13

CI deploy is green. `/watch.html` and `/hls/master.m3u8` are on the live site. Product rule unchanged: claimed ≤ receipt, or REFUSE names the dollar overage.

## Run locally

```bash
npm install
npm run demo:gate
npm run build
npm run preview
```
