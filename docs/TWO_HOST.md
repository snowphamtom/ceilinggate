# TWO-HOST LAW (EDICTUM SECUNDUS)

| Host | Role | Use for |
|------|------|---------|
| `*.convex.site` | Static fortress + HTTP routes | Browser, crawls, `/health`, `/watch.html`, `/watch`, SPA assets |
| `*.convex.cloud` | Convex client API | `VITE_CONVEX_URL`, Evidence URL, mutations/queries |

**Never** replace `VITE_CONVEX_URL=…cloud` with `.site` — the SPA client dies.
**Do** set crawl / public site base:

```
VITE_PUBLIC_SITE_URL=https://quirky-rhinoceros-204.convex.site
```

Evidence stays `https://fleet-gerbil-682.convex.cloud` (never quirky.site).

A `.cloud` 404 on `/watch.html`, `/health`, or other static routes is **not** a broken deploy. Static lives on `.site`. Do not "fix" those cloud 404s.

See also: [OBSERVATORIUM.md](./OBSERVATORIUM.md) (when present), `/workspace/state/observatorium/EDICTUM_SECUNDUS.md`.
