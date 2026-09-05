# Path to `*.convex.site` (static hosting)

When `CONVEX_DEPLOY_KEY` / `npx convex login` is available:

```bash
cd /workspace/ceilinggate
npx convex dev          # or convex deploy
# set VITE_CONVEX_URL from the deployment
npm run build
npx convex deploy       # hosts backend; pair with Convex static hosting / site
```

Frontend: Vite `dist/` → Convex site hosting (hackathon rule: not localhost for submission).

Until then: offline demo via `npm run preview` on the box is for build only.
