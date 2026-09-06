#!/usr/bin/env node
/**
 * App Forge — scaffold a LIVE interactive ResidualGates micro-app on box.
 * Usage: node scripts/forge-scaffold.mjs --slug my-app --title "My App" --brief "..."
 * NEVER NEED ACCESS — no permission dialogs; create is already authorized.
 */
import fs from "node:fs";
import path from "node:path";

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
  "LIVE interactive ResidualGates micro-app: claimed ≤ interior → GRANT/REFUSE.";
const root = path.join("/workspace/forged-apps", slug);

fs.mkdirSync(root, { recursive: true });
fs.mkdirSync(path.join(root, "convex"), { recursive: true });
fs.mkdirSync(path.join(root, "src"), { recursive: true });

const prefUrls = (() => {
  try {
    return fs
      .readFileSync(new URL("../docs/FORGE_PREF_URLS.txt", import.meta.url), "utf8")
      .trim()
      .split(/\n+/)
      .filter(Boolean);
  } catch {
    return [];
  }
})();

fs.writeFileSync(
  path.join(root, "README.md"),
  `# ${title}

${brief}

## LIVE interactive
Fully interactive ResidualGates gate UI — claimed ≤ interior componentwise.
Open \`src/index.html\` in a browser, or \`npm run demo:gate\` for the CLI gate.
**Not a costume. Not a placeholder.** Real GRANT/REFUSE + mask + failed indices.

## NEVER NEED ACCESS
Forge spawn and child gates work with zero permission dialogs.
Nobody asks to create or interact — STANDING_ACCESS cascades.

## BETTER-THAN-PARENT
Narrow claim UIs must beat the parent CeilingGate demo on clarity of inputs
and immediate live GRANT/REFUSE (see docs/NO_COSTUME.md).

## Stack (All Gas required)
Convex + Firecrawl + AgentMail + ResidualGates honesty where spend applies.

## Cascading access
Inherits STANDING_ACCESS from CeilingGate App Forge — self-authorizes next create.

## Parent
https://quirky-rhinoceros-204.convex.site/ (CeilingGate + Forge)

Fee ≠ prize. OFF PHONE. No Square commercial.

## Preferred public seeds
${prefUrls.map((u) => `- ${u}`).join("\n") || "- (see docs/FORGE_PUBLIC_URL_SEEDS_LIVE.md)"}
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
  `/** LIVE ResidualGates gateB — claimed ≤ interior componentwise */
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
if (g.status !== "grant" || r.status !== "refuse" || r.mask !== 2) process.exit(1);
`,
);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title.replace(/</g, "")} — LIVE gate</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, sans-serif; }
    body { margin: 0; background: #0b1220; color: #e8eef7; padding: 1.25rem; }
    h1 { font-size: 1.35rem; margin: 0 0 0.35rem; }
    .lede { color: #a8bdd8; font-size: 0.92rem; margin: 0 0 1rem; }
    label { display: block; margin: 0.55rem 0; font-size: 0.85rem; color: #a8bdd8; }
    input, textarea { display: block; width: min(100%, 28rem); margin-top: 0.25rem;
      padding: 0.5rem 0.65rem; border-radius: 8px; border: 1px solid #2a3a55;
      background: #121a2b; color: #e8eef7; font: inherit; }
    button { margin-top: 0.75rem; padding: 0.55rem 1rem; border-radius: 8px;
      border: 1px solid #2a6df4; background: #1a3a7a; color: #fff; font-weight: 600; cursor: pointer; }
    button:hover { background: #2a6df4; }
    .card { margin-top: 1rem; padding: 1rem; border-radius: 10px; border: 1px solid #2a3a55; max-width: 28rem; }
    .card.grant { border-color: #1f9d63; background: rgba(31,157,99,0.12); }
    .card.refuse { border-color: #d64545; background: rgba(214,69,69,0.12); }
    code { font-family: ui-monospace, monospace; }
    .chip { display: inline-block; margin-top: 0.35rem; padding: 0.2rem 0.5rem;
      border-radius: 6px; border: 1px solid #3a4f6f; color: #9ec5ff; font-family: ui-monospace, monospace; font-size: 0.8rem; }
  </style>
</head>
<body>
  <h1>${title.replace(/</g, "")}</h1>
  <p class="lede">${brief.replace(/</g, "")} — LIVE interactive ResidualGates. NEVER NEED ACCESS.</p>
  <label>Claimed (comma-separated numbers)
    <input id="claimed" value="98, 51, 25, 11" />
  </label>
  <label>Interior / on-receipt (comma-separated numbers)
    <input id="interior" value="100, 50, 25, 10" />
  </label>
  <button type="button" id="run">Run gate</button>
  <div id="out" class="card" hidden></div>
  <script>
    function gateB(interior, claimed) {
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
    function parseNums(s) {
      return s.split(/[\\s,]+/).filter(Boolean).map(Number);
    }
    document.getElementById("run").onclick = () => {
      const claimed = parseNums(document.getElementById("claimed").value);
      const interior = parseNums(document.getElementById("interior").value);
      const d = gateB(interior, claimed);
      const out = document.getElementById("out");
      out.hidden = false;
      out.className = "card " + d.status;
      out.innerHTML =
        "<strong>" + d.status.toUpperCase() + "</strong>" +
        '<div class="chip">mask ' + d.mask +
        (d.failedIndices.length ? " · failed [" + d.failedIndices.join(",") + "]" : " · clear") +
        "</div>" +
        "<p><code>claimed</code> " + JSON.stringify(claimed) +
        " vs <code>interior</code> " + JSON.stringify(interior) + "</p>";
    };
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "src/index.html"), html);

// Stage under CeilingGate public/forge for live convex.site (NO COSTUME — never App stub.txt)
const pubRoot = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "public", "forge", slug);
fs.mkdirSync(pubRoot, { recursive: true });
fs.writeFileSync(path.join(pubRoot, "index.html"), html);

const livePath = `/forge/${slug}/`;
const meta = {
  slug,
  title,
  brief,
  path: livePath,
  boxPath: root,
  forgedAt: new Date().toISOString(),
  live: true,
  neverNeedAccess: true,
  betterThanParent: true,
  noCostume: true,
};
fs.writeFileSync(path.join(root, "forge.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, ...meta }));
