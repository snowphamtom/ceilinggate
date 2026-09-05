# CeilingGate — true hard blockers only

Things we **cannot** route around without an external login/namespace (no asks — just flags):

1. **Public GitHub** — `gh` not authenticated; no `GH_TOKEN`/`GITHUB_TOKEN`; CloudAgent `new_repo` fails: Origin namespace missing ([get-started](https://cursor.com/codebase/get-started)). Last-resort tarball: `/workspace/releases/ceilinggate-offline-20260905.tar.gz` + `/workspace/releases/ceilinggate-PUBLIC-REPO.md`.
2. **`*.convex.site` host** — needs Convex login / deploy key. Offline board + `npm run demo:gate` work without it.
3. **Live Firecrawl scrapes** — needs `FIRECRAWL_API_KEY` in Convex env. Demo uses fixture scrape stand-in; live judgment correctly withheld without Firecrawl.

**Not blockers for the offline demo:** AgentMail inbox exists (`ceilinggate@agentmail.to`); gate math PASS; everyday UI builds.
