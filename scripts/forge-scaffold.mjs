#!/usr/bin/env node
/**
 * App Forge — scaffold a LIVE interactive ResidualGates micro-app.
 * Writes ONLY: README, package.json, demo-gate.mjs, src/index.html, forge.json,
 * and stages public/forge/{slug}/index.html for convex.site.
 * NEVER writes costume placeholder files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, c, i, arr) => {
    if (c.startsWith("--")) a.push([c.slice(2), arr[i + 1]]);
    return a;
  }, []),
);

const slug = (args.slug || `forge-${Date.now().toString(36)}`)
  .replace(/[^a-z0-9-]/gi, "-")
  .toLowerCase();
const title = args.title || slug;
const brief =
  args.brief ||
  "LIVE interactive ResidualGates micro-app: claimed ≤ interior → GRANT/REFUSE + mask.";
const root = path.join("/workspace/forged-apps", slug);
const pubRoot = path.join(__dirname, "..", "public", "forge", slug);

fs.mkdirSync(path.join(root, "src"), { recursive: true });
fs.mkdirSync(path.join(root, "convex"), { recursive: true });
fs.mkdirSync(pubRoot, { recursive: true });

// Remove any costume leftovers (old filenames) before writing LIVE artifacts
for (const dir of [path.join(root, "src"), root, pubRoot]) {
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (/stub/i.test(name) || /^App /i.test(name) && name.endsWith(".txt")) {
      fs.unlinkSync(path.join(dir, name));
    }
  }
}

fs.writeFileSync(
  path.join(root, "README.md"),
  `# ${title}

${brief}

## LIVE interactive
Open \`src/index.html\` or https://quirky-rhinoceros-204.convex.site/forge/${slug}/
Real gateB clicks → GRANT/REFUSE. BETTER-THAN-PARENT. NEVER NEED ACCESS.

## Stack
Convex + Firecrawl + AgentMail + ResidualGates.

Parent: https://quirky-rhinoceros-204.convex.site/
Fee ≠ prize. OFF PHONE. No Square commercial.
`,
);

fs.writeFileSync(
  path.join(root, "package.json"),
  JSON.stringify(
    {
      name: slug,
      private: true,
      type: "module",
      scripts: { "demo:gate": "node ./demo-gate.mjs" },
    },
    null,
    2,
  ) + "\n",
);

fs.writeFileSync(
  path.join(root, "demo-gate.mjs"),
  `/** LIVE gateB — claimed ≤ interior componentwise */
export function gateB(interior, claimed) {
  if (interior.length !== claimed.length) {
    return { status: "refuse", mask: 1, failedIndices: [] };
  }
  const failed = [];
  for (let i = 0; i < interior.length; i++) {
    if (claimed[i] > interior[i]) failed.push(i);
  }
  const mask = failed.reduce((m, i) => m | (1 << i), 0);
  return failed.length
    ? { status: "refuse", mask: mask || 1, failedIndices: failed }
    : { status: "grant", mask: 0, failedIndices: [] };
}

const g = gateB([100, 50], [98, 49]);
const r = gateB([100, 50], [98, 51]);
console.log(JSON.stringify({ grant: g, refuse: r, app: ${JSON.stringify(slug)}, live: true }, null, 2));
if (g.status !== "grant" || r.status !== "refuse") process.exit(1);
`,
);

const safeTitle = title.replace(/</g, "");
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} — LIVE gate</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, sans-serif; }
    body { margin: 0; background: #0b1220; color: #e8eef7; padding: 1.25rem; max-width: 36rem; }
    h1 { font-size: 1.35rem; margin: 0 0 0.35rem; }
    .lede { color: #a8bdd8; font-size: 0.92rem; margin: 0 0 1rem; }
    label { display: block; margin: 0.55rem 0; font-size: 0.85rem; color: #a8bdd8; }
    input { display: block; width: 100%; box-sizing: border-box; margin-top: 0.25rem;
      padding: 0.55rem 0.65rem; border-radius: 8px; border: 1px solid #2a3a55;
      background: #121a2b; color: #e8eef7; font: inherit; }
    .row { display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.75rem; }
    button { padding: 0.55rem 0.9rem; border-radius: 8px; border: 1px solid #2a6df4;
      background: #1a3a7a; color: #fff; font-weight: 600; cursor: pointer; }
    button.ghost { background: transparent; border-color: #94a3b8; }
    .card { margin-top: 1rem; padding: 1rem; border-radius: 10px; border: 1px solid #2a3a55; }
    .card.grant { border-color: #1f9d63; background: rgba(31,157,99,0.12); }
    .card.refuse { border-color: #d64545; background: rgba(214,69,69,0.12); }
    .chip { display: inline-block; margin-top: 0.35rem; padding: 0.2rem 0.5rem;
      border-radius: 6px; border: 1px solid #3a4f6f; color: #9ec5ff; font-family: ui-monospace, monospace; font-size: 0.8rem; }
    table { width:100%; border-collapse: collapse; margin-top:0.75rem; font-size:0.88rem; }
    th, td { text-align:left; padding:0.35rem 0.4rem; border-bottom:1px solid #2a3a55; font-family: ui-monospace, monospace; }
    td.ok { color:#6ee7a8; } td.bad { color:#fca5a5; }
    a { color: #9ec5ff; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p class="lede">LIVE gateB — claimed ≤ interior. BETTER-THAN-PARENT. NEVER NEED ACCESS. NO COSTUME.</p>
  <label>Claimed (comma-separated)<input id="claimed" value="98, 51, 25, 11" /></label>
  <label>Interior / on-receipt<input id="interior" value="100, 50, 25, 10" /></label>
  <div class="row">
    <button type="button" class="ghost" id="demoGrant">Demo GRANT</button>
    <button type="button" class="ghost" id="demoRefuse">Demo REFUSE</button>
    <button type="button" id="run">Run gate</button>
  </div>
  <div id="out" class="card" hidden></div>
  <p class="lede"><a href="/">← CeilingGate</a></p>
  <script>
    function gateB(interior, claimed) {
      if (interior.length !== claimed.length) return { status: "refuse", mask: 1, failedIndices: [] };
      const failed = [];
      for (let i = 0; i < interior.length; i++) if (claimed[i] > interior[i]) failed.push(i);
      const mask = failed.reduce((m, i) => m | (1 << i), 0);
      return failed.length ? { status: "refuse", mask: mask || 1, failedIndices: failed }
        : { status: "grant", mask: 0, failedIndices: [] };
    }
    function parseNums(s) { return s.split(/[\\s,]+/).filter(Boolean).map(Number); }
    function money(n) { return "$" + (Number.isFinite(n) ? n.toFixed(2) : "—"); }
    function show(claimed, interior) {
      const d = gateB(interior, claimed);
      const out = document.getElementById("out");
      out.hidden = false;
      out.className = "card " + d.status;
      const n = Math.max(claimed.length, interior.length);
      let rows = "";
      for (let i = 0; i < n; i++) {
        const c = claimed[i], inn = interior[i];
        const ok = Number.isFinite(c) && Number.isFinite(inn) && c <= inn;
        const delta = Number.isFinite(c) && Number.isFinite(inn) ? c - inn : NaN;
        rows += "<tr><td>" + i + "</td><td>" + money(c) + "</td><td>" + money(inn) + "</td><td class='" +
          (ok ? "ok" : "bad") + "'>" + (ok ? "CLEAR" : "OVER " + money(delta)) + "</td></tr>";
      }
      out.innerHTML = "<strong>" + d.status.toUpperCase() + "</strong>" +
        '<div class="chip">mask ' + d.mask +
        (d.failedIndices.length ? " · failed [" + d.failedIndices.join(",") + "]" : " · clear") + "</div>" +
        "<table><thead><tr><th>Line</th><th>Claimed</th><th>Interior</th><th>Status</th></tr></thead><tbody>" +
        rows + "</tbody></table>";
    }
    function read() {
      return [parseNums(document.getElementById("claimed").value), parseNums(document.getElementById("interior").value)];
    }
    document.getElementById("demoGrant").onclick = () => {
      document.getElementById("claimed").value = "98, 49, 25, 9";
      document.getElementById("interior").value = "100, 50, 25, 10";
      show([98,49,25,9],[100,50,25,10]);
    };
    document.getElementById("demoRefuse").onclick = () => {
      document.getElementById("claimed").value = "98, 51, 25, 11";
      document.getElementById("interior").value = "100, 50, 25, 10";
      show([98,51,25,11],[100,50,25,10]);
    };
    document.getElementById("run").onclick = () => show(...read());
    ["claimed","interior"].forEach((id) => document.getElementById(id).addEventListener("input", () => show(...read())));
    show(...read());
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "src", "index.html"), html);
fs.writeFileSync(path.join(pubRoot, "index.html"), html);

const meta = {
  slug,
  title,
  brief,
  path: `/forge/${slug}/`,
  boxPath: root,
  forgedAt: new Date().toISOString(),
  live: true,
  neverNeedAccess: true,
  betterThanParent: true,
  noCostume: true,
};
fs.writeFileSync(path.join(root, "forge.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, ...meta }));
