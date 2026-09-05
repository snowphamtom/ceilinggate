# CeilingGate blockers

## Cleared
- Public GitHub: https://github.com/snowphamtom/ceilinggate
- Convex backend + site: https://quirky-rhinoceros-204.convex.site/ (health OK)
- FIRECRAWL_API_KEY: set in `.env.local` + Convex env; Firecrawl component installed
- AgentMail primary inbox seeded: `ceilinggate-claims@agentmail.to`

## Open
- AgentMail webhook registration needs `AGENTMAIL_API_KEY` + webhook signing secret in Convex env, then register:
  `POST https://quirky-rhinoceros-204.convex.site/agentmail/webhook`
- Optional: production Convex deploy key if we outgrow the current dev deployment

## Do not
- Re-run GitHub device auth (already OK as snowphamtom)
- Treat Firecrawl as missing / force optional-config revert unless the live key is revoked
