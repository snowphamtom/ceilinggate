# What Actions needs (no values in this file)

Live app: https://quirky-rhinoceros-204.convex.site/
Workflow: `.github/workflows/convex-deploy.yml`
Runs 31–32: `secret_present` was empty. Convex was never called.

## One secret

Name: `CONVEX_DEPLOY_KEY`
Place: **Repository** secrets only
URL: https://github.com/snowphamtom/ceilinggate/settings/secrets/actions

Mint the string: https://dashboard.convex.dev/d/quirky-rhinoceros-204/settings/deploy-keys

Do not put it in Vercel, Environment secrets, Dependabot, Codespaces, Ops, or chat.

## After the row exists

Reply `secret in` with no value. Dispatch `convex-deploy.yml` on `master`.
Next log line should be `secret_present=true` then `npx convex deploy -y`.
