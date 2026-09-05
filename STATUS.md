# CeilingGate STATUS (LOCAL ONLY)

**Updated:** 2026-09-05 evening CT  
**Publish:** KEEP LOCAL — no GitHub/Origin until later go

## Local finish checklist
- [x] Everyday money-claim UI (claims inbox + plain-English REFUSE lines)
- [x] Originality: not chat-demo / not SDK / not docs-search
- [x] Fixtures `te-grant` / `te-refuse` (Drive-fuel T&E labels)
- [x] `npm run demo:gate` PASS (GRANT + REFUSE mask 10)
- [x] `npm run build` green
- [x] `hackathon.md` build log + rules path
- [x] AgentMail inbox `ceilinggate@agentmail.to` (ingress ready; webhook waits deploy)
- [x] Firecrawl + AgentMail Convex components in `convex.config.ts`
- [ ] Convex deploy / `*.convex.site` — deferred (needs key; not local-blocker for demo)
- [ ] Public GitHub — deferred by Taylor

## Run locally
```bash
cd /workspace/ceilinggate
npm run demo:offline
npm run preview   # Check sample claims
```
