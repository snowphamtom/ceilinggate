# Observatorium — EDICTUM SECUNDUS firewall crawl

Inner census of the live static fortress. Outer box curls already learned the
two-host split; this is the in-repo crawl so Grok/Forge does not "fix" a
`.cloud` 404 by rewriting the client URL.

## Two-host law

| Host | Role | Use for |
|------|------|---------|
| `*.convex.site` | Static fortress + HTTP routes | Browser, crawls, `/health`, `/watch.html` |
| `*.convex.cloud` | Convex client API | `VITE_CONVEX_URL`, mutations / queries |

Canonical live:

- **SITE / `CONVEX_SITE_URL`:** `https://quirky-rhinoceros-204.convex.site`
- **`VITE_CONVEX_URL`:** `https://quirky-rhinoceros-204.convex.cloud` — **never** change to `.site`
- **Evidence:** `https://fleet-gerbil-682.convex.cloud` — never quirky, never `.site`

A 404 of `/watch.html` (or any static path) on `*.convex.cloud` is **expected**.
It is not a broken deploy. Do not point `VITE_CONVEX_URL` at `.site` or the SPA
client dies.

`CONVEX_SITE_URL` is platform-provided inside Convex actions. The box script
reads `SITE` / `CONVEX_SITE_URL` / `VITE_PUBLIC_SITE_URL` and refuses a `.cloud`
base.

## Routes

`/`, `/health`, `/watch.html`, `/forge/sorting-machine/`, `/manifest.webmanifest`,
`/hls/master.m3u8`, `/receipts/fuel-grant.html`, `/judge.html`, `/llms.txt`

KEEP (expect 2xx on `.site`): the first seven.
OPTIONAL (404 on `.site` is known, not a brick): `/llms.txt` only.
KEEP now includes `/judge.html` and `/watch` (http routes added after crawl FAIL).

## Run the box script

From the ceilinggate checkout (loads `.env.local` but **does not** use
`VITE_CONVEX_URL` as the crawl host):

```bash
cd /workspace/ceilinggate
SITE=https://quirky-rhinoceros-204.convex.site node scripts/firewall-crawl.mjs
```

`SITE` wins; else `CONVEX_SITE_URL`; else `VITE_PUBLIC_SITE_URL`; else the
canonical `.site` fallback. Each route is probed with `curl` (fetch fallback).
Stdout is `{ base, at, results:[{route,status,ok}], learned:string[] }`.
`learned` marks expected `.cloud` static 404s vs real `.site` KEEP failures.

## Run the Convex action

After functions deploy (`npx convex deploy` — functions/schema only; do not
re-upload static / do not brick `/assets`):

```bash
cd /workspace/ceilinggate
npx convex run firewallCrawl:run
npx convex run firewallCrawl:latest
```

`firewallCrawl:run` fetches `CONVEX_SITE_URL + route` for the list above,
writes `firewallCrawlLogs`, and returns the same `{ base, at, results, learned }`
shape. `firewallCrawl:store` is the mutation that persists a run.

## Commit voice (this edict)

> I changed X because Y failed in firewall crawl (route R status S).

Example: *I changed firewallCrawl.ts because outer census needed an inner
CONVEX_SITE_URL crawl.*
