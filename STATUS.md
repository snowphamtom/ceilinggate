# CeilingGate STATUS — 2026-09-05 21:30 CT

## Live (judges can open)
- App: https://quirky-rhinoceros-204.convex.site/
- Repo: https://github.com/snowphamtom/ceilinggate
- Listing: https://vibeapps.dev/s/ceilinggate
- Inbox: ceilinggate-claims@agentmail.to
- Demo pack: https://github.com/snowphamtom/ceilinggate/releases/tag/allgas-demo-20260905
- X: https://x.com/magpie_inventor/status/2096419465973944560
- Luma: registered (yeti.monstersink@gmail.com)
- Wayne note: sent

## Blocker that changes the live UI
GitHub Action `convex-deploy` has failed 16 times. Secret `CONVEX_DEPLOY_KEY` is empty.
The site judges see is the older ResidualGates / child-gates build.
Clean board is on `master` (`src/App.tsx`) and will not replace the live site until that secret exists and deploy is re-run.

Add it once: GitHub → snowphamtom/ceilinggate → Settings → Secrets and variables → Actions → `CONVEX_DEPLOY_KEY` = Convex production deploy key. Then Actions → convex-deploy → Run workflow.

## Listing still missing (Clerk = Taylor only)
Vibe card has title + tagline + live URL + AllGasHackathon tag. It does not show GitHub, video, or screenshots.
Paste these on the listing edit:
- GitHub: https://github.com/snowphamtom/ceilinggate
- Video: https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/CeilingGate-AllGas-demo.mp4
- Shot: https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/02-grant.png
