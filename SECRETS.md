# CeilingGate secrets — two stores only

Do not paste keys into chat, issues, or git.
Do not put Firecrawl / AgentMail / OpenAI into GitHub Actions.

## Store A — GitHub Actions (CI write path)

One secret. Name must match exactly.

1. Open https://github.com/snowphamtom/ceilinggate/settings/secrets/actions
2. New repository secret
3. Name: `CONVEX_DEPLOY_KEY`
4. Value: prod deploy key from Convex dashboard → Deployment Settings → Deploy keys → Generate (`deployment:deploy`)
5. Add secret. Do not screenshot the value.

After that row exists, Actions can run `npx convex deploy -y`.
The key never prints in logs (workflow already fail-closes if empty).

## Store B — Convex deployment env (app runtime)

Set on the **quirky-rhinoceros-204** deployment, not in GitHub.

Dashboard: Project → Deployment Settings → Environment Variables

Or, once Store A exists and a laptop CLI is logged in:

```
npx convex env set FIRECRAWL_API_KEY
npx convex env set FIRECRAWL_WEBHOOK_SECRET
npx convex env set AGENTMAIL_API_KEY
npx convex env set AGENTMAIL_WEBHOOK_SECRET
npx convex env set AGENTMAIL_INBOX_ID ceilinggate-claims
npx convex env set AGENTMAIL_INBOX_EMAIL ceilinggate-claims@agentmail.to
npx convex env set OPENAI_API_KEY
```

Prefer interactive `npx convex env set NAME` (no value on the command line) so the secret stays out of shell history.

Public, not secret:

- Inbox address `ceilinggate-claims@agentmail.to`
- Site `https://quirky-rhinoceros-204.convex.site/`

## Never

- Commit `.env`, `.env.local`, `.env.agentmail`
- Put `CONVEX_DEPLOY_KEY` into Convex env (it is a CI key, not an app key)
- Put app API keys into GitHub secrets (Convex actions read `process.env` on the deployment)
- Paste any of the above into this chat

## Check

- GitHub: one Actions secret named `CONVEX_DEPLOY_KEY`
- Convex dashboard env list shows Firecrawl + AgentMail + OpenAI names
- `npx convex env list` shows names only in discussion; do not paste values here
