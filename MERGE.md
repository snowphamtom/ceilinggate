# Merged live map

| Path | Role |
|------|------|
| https://quirky-rhinoceros-204.convex.site/ | Canonical contest app (Convex + ResidualGates) |
| https://quirky-rhinoceros-204.convex.site/health | Health |
| https://quirky-rhinoceros-204.convex.site/forge/ops-channel/ | Bot ops |
| https://github.com/snowphamtom/ceilinggate | Public source |
| `.github/workflows/convex-deploy.yml` | Push-to-Convex when `CONVEX_DEPLOY_KEY` secret exists |
| Vercel project `ceilinggate` | Judge-path mirror (SSO still on team token; not judge URL yet) |
| `ceilinggate-claims@agentmail.to` | Live ingress |

Judge path after next Convex deploy: `/judge.html`
