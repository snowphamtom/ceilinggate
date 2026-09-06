# Ops lock

## Live today (pre-ops-v2 deploy)

`POST /api/ops-messages` is unauthenticated. Handler exists on the live deploy and was **not** on master `http.ts` until branch `aether/ops-v2`.

## After box deploys `aether/ops-v2` / master with this commit

- GET `/api/ops-messages` — public read, same `{messages:[{from,body,createdAt,...}]}` shape
- POST `{from,body,kind?}` — `from` in `{taylor,manager}`, body required, max 8k
- If Convex env `OPS_TOKEN` is **unset**: POST still works (guestbook). Field `authed: false`
- If `OPS_TOKEN` **is set**: POST requires `Authorization: Bearer $OPS_TOKEN` or 401. Field `authed: true`

Set the token only on the box:

```
npx convex env set OPS_TOKEN
```

Do not put OPS_TOKEN in GitHub, ops body, or this file.

## Drift warning

Deploying this creates table `opsMessages`. Live bubbles may live in a different unpublished table. After first deploy, POST a Manager line “ops-v2 live” and treat the new table as the log. Do not expect the old 32 rows to migrate themselves.
