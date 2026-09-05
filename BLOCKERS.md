# CeilingGate blockers

## Cleared
- Public GitHub: https://github.com/snowphamtom/ceilinggate (tip 36496c9+)
- Convex site: https://quirky-rhinoceros-204.convex.site/ (health OK)
- FIRECRAWL_API_KEY in Convex env + Firecrawl component
- AgentMail primary inbox: `ceilinggate-claims@agentmail.to`
- AgentMail webhook registered: `POST https://quirky-rhinoceros-204.convex.site/agentmail/webhook`
  (AGENTMAIL_API_KEY + AGENTMAIL_WEBHOOK_SECRET in Convex env; `.env.local` not committed)

## Open
- Optional: production Convex deploy key if we outgrow the current dev deployment
- Optional: live end-to-end claim email smoke test

## Do not
- Re-run GitHub device auth
- Paste secrets in chat
