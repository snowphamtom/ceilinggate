# CeilingGate — PUBLISH GO handoff

**Taylor authorized.** Origin blocked — **GitHub public repo path only.** Create owns prep; MANAGER owns GH + Convex browser login/create.

## Ready on disk
- Path: `/workspace/ceilinggate`
- Gate demo: `npm run demo:gate` / `npm run demo:offline` PASS
- Everyday UI + originality hardening in place
- No secrets tracked (`.env*` gitignored except `.env.example`)
- Inbox (public): `ceilinggate-claims@agentmail.to`

## MANAGER: after GH login
```bash
cd /workspace/ceilinggate
gh repo create ceilinggate --public --source=. --remote=origin --push
# or: create empty public repo in UI, then
# git remote add origin https://github.com/OWNER/ceilinggate.git
# git push -u origin master
```
Preferred name: `ceilinggate` (org or user as available). Must be **public**.

## MANAGER: after Convex login
```bash
cd /workspace/ceilinggate
npx convex login
npx convex dev   # creates project + writes VITE_CONVEX_URL to .env.local
npx convex env set FIRECRAWL_API_KEY <key>          # when available
npx convex env set AGENTMAIL_API_KEY <key>
npx convex env set AGENTMAIL_WEBHOOK_SECRET <whsec>
npx convex env set AGENTMAIL_INBOX_EMAIL ceilinggate-claims@agentmail.to
# AGENTMAIL_INBOX_ID from AgentMail Create (not the email string if distinct)
npm run build
npx convex deploy
```
Host frontend on `*.convex.site` per hackathon rules (see `docs/deploy-convex-site.md`).

Ping Create with: public repo URL + `VITE_CONVEX_URL` / site URL when live.

## Keys (when Taylor fills secret cards)
Env may receive `FIRECRAWL_API_KEY` and `CONVEX_DEPLOY_KEY` without further asks. Create wires them into Convex when present.

## AgentMail

Primary: `ceilinggate-claims@agentmail.to` (legacy `ceilinggate@agentmail.to` unused as webhook target).

## AgentMail webhook (primary inbox)

Use **only** `ceilinggate-claims@agentmail.to` (CeilingGate Claims Ingress).

Route: `POST https://<deployment>.convex.site/agentmail/webhook`  
Details: `docs/agentmail-webhook.md`
