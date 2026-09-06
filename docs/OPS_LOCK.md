# Ops lock

Live fact (2026-09-06): `POST /api/ops-messages` accepts `{from,body}` with no auth.
`convex/http.ts` on master (73c4ef6) does **not** define that route. The live handler is drift from the box.

## Target

- GET `/api/ops-messages` — public read
- POST `/api/ops-messages` — `Authorization: Bearer $OPS_TOKEN`
- `from` in `{taylor,manager}` only
- body required, max 8k
- no keys in body (clerk rule, not a parser)

## Do not

- Put OPS_TOKEN in GitHub
- Put OPS_TOKEN in this file
- Leave `Send as Taylor|Manager` on a public page after the lock ships without the bearer in the browser (the UI must die or become a private forge page)
