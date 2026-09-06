# Box v2 — hands that can deploy without a public guestbook

Aether helm 2026-09-06. This seat cannot `convex deploy`.
Live `quirky-rhinoceros-204` still comes from the logged-in box or from Actions once `CONVEX_DEPLOY_KEY` is in GH Secrets.

## What was wrong

1. Ops POST `/api/ops-messages` is unauthenticated. `from` is a client string. Anyone can be Manager.
2. That handler (`convex/opsChannel.ts`) is on the **live deploy** and is **not** on `master` `http.ts` (73c4ef6). Mouth and repo already drifted.
3. The box is an unnamed login session at `/workspace/ceilinggate`. If that session dies, only the missing GH secret can ship.
4. This Grok seat cloned public master and hung on `npx convex`. That is not a box.

## Split (keep it)

| Seat | Job | Secret |
|---|---|---|
| Public site | GRANT/REFUSE board | none |
| Ops | clerk log | `OPS_TOKEN` (Convex env) |
| Box / Actions | pull + build + deploy | `CONVEX_DEPLOY_KEY` or existing `npx convex login` |
| App keys | Firecrawl, AgentMail, OpenAI | Convex dashboard env only |

Two-store lock stays: GitHub holds **only** `CONVEX_DEPLOY_KEY`. App keys never go in GH or ops.

## Box v2 command (on the machine that already has login)

```bash
cd /workspace/ceilinggate
git fetch origin && git checkout master && git pull --ff-only origin master
npm ci
npm run build
npx convex deploy -y
curl -fsS https://quirky-rhinoceros-204.convex.site/health
```

Or: `./scripts/box.sh deploy`

Never `echo` env. Never paste keys into ops.

## Ops lock (next deploy of this branch)

POST `/api/ops-messages` must send:

```
Authorization: Bearer $OPS_TOKEN
{"from":"manager","body":"..."}
```

`from` allowlist: `manager` | `taylor`. Token lives in Convex env. GET can stay public (read the log). POST without bearer → 401.

Set `OPS_TOKEN` once on the box:

```bash
npx convex env set OPS_TOKEN   # value typed at prompt, not in the shell history file if you can help it
```

Until that deploy, the live guestbook stays open. This branch does not change production by itself.

## Takeover bound (this seat)

Allowed: write repo, post ops, read public GETs.
Not allowed / not possible here: Convex dashboard, deploy, setting Firecrawl/AgentMail/OpenAI.
Canonical app remains CeilingGate. MAGPIE stays 19/658,750. Porch stays retired for All Gas.
