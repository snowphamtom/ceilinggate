#!/usr/bin/env node
/**
 * App Forge — scaffold a micro-app on box (All Gas stack).
 * Usage: node scripts/forge-scaffold.mjs --slug my-app --title "My App" --brief "..."
 */
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, c, i, arr) => {
    if (c.startsWith("--")) a.push([c.slice(2), arr[i + 1]]);
    return a;
  }, []),
);

const slug = (args.slug || `forge-${Date.now().toString(36)}`).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const title = args.title || slug;
const brief = args.brief || "Micro-app forged from CeilingGate App Forge";
const root = path.join("/workspace/forged-apps", slug);

fs.mkdirSync(root, { recursive: true });
fs.mkdirSync(path.join(root, "convex"), { recursive: true });
fs.mkdirSync(path.join(root, "src"), { recursive: true });

fs.writeFileSync(
  path.join(root, "README.md"),
  `# ${title}

${brief}

## Stack (All Gas required)
Convex + Firecrawl + AgentMail + ResidualGates honesty where spend applies.

## Cascading access
Inherits STANDING_ACCESS from CeilingGate App Forge — self-authorizes next create.

## Parent
https://quirky-rhinoceros-204.convex.site/ (CeilingGate + Forge)

Fee ≠ prize. OFF PHONE. No Square commercial.

## Preferred public seeds
${(() => {
  try {
    const pref = fs.readFileSync(new URL("../docs/FORGE_PREF_URLS.txt", import.meta.url), "utf8").trim().split(/\n+/).filter(Boolean);
    return pref.map((u) => `- ${u}`).join("\n") || "- (none)";
  } catch { return "- (see docs/FORGE_PUBLIC_URL_SEEDS_LIVE.md)"; }
})()}
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
  `/** ResidualGates-style honesty stub — claimed ≤ interior */
export function gateB(interior, claimed) {
  const failed = [];
  for (let i = 0; i < Math.max(interior.length, claimed.length); i++) {
    if ((claimed[i] ?? 0) > (interior[i] ?? 0)) failed.push(i);
  }
  const mask = failed.reduce((m, i) => m | (1 << i), 0);
  return failed.length
    ? { status: "refuse", mask: mask || 1, failedIndices: failed }
    : { status: "grant", mask: 0, failedIndices: [] };
}
const g = gateB([100, 50], [98, 49]);
const r = gateB([100, 50], [98, 51]);
console.log(JSON.stringify({ grant: g, refuse: r, app: ${JSON.stringify(slug)} }, null, 2));
if (g.status !== "grant" || r.status !== "refuse") process.exit(1);
`,
);

fs.writeFileSync(
  path.join(root, "src/App stub.txt"),
  `Forge micro-app UI stub for ${title}. Wire to Convex when expanded.\n`,
);

const meta = { slug, title, brief, path: root, forgedAt: new Date().toISOString() };
fs.writeFileSync(path.join(root, "forge.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, ...meta }));
