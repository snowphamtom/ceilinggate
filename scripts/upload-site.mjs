import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { spawnSync } from "child_process";
import { randomUUID } from "crypto";
import { lookup } from "mime-types";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      process.env[t.slice(0, i)] = t.slice(i + 1);
    }
  } catch {
    // CI uses CONVEX_DEPLOY_KEY; .env.local is local-only.
  }
}

function convexRun(fn, args) {
  const r = spawnSync(
    "npx",
    ["convex", "run", fn, JSON.stringify(args), "--typecheck=disable", "--codegen=disable"],
    { encoding: "utf8", env: process.env },
  );
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "").slice(0, 2000));
  const out = (r.stdout || "").trim();
  // Full stdout may be a JSON string/object/array — parse the whole payload.
  try {
    return JSON.parse(out);
  } catch {
    const start = Math.min(
      ...["{", "[", "\""].map((c) => (out.indexOf(c) >= 0 ? out.indexOf(c) : Infinity)),
    );
    if (!Number.isFinite(start)) return out;
    return JSON.parse(out.slice(start));
  }
}

function collect(dir, base = dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...collect(full, base));
    else
      out.push({
        path: "/" + relative(base, full).replace(/\\/g, "/"),
        localPath: full,
        contentType: lookup(full) || "application/octet-stream",
      });
  }
  return out;
}


function injectSpaCssIntoForge(distDir = "./dist") {
  const assets = join(distDir, "assets");
  let cssName = "";
  try {
    cssName = readdirSync(assets).find((f) => f.endsWith(".css")) || "";
  } catch {
    return;
  }
  if (!cssName) return;
  const href = `/assets/${cssName}`;
  const forgeRoot = join(distDir, "forge");
  const htmlFiles = [];
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith(".html")) htmlFiles.push(full);
    }
  }
  try {
    walk(forgeRoot);
  } catch {
    return;
  }
  const tag = `<link rel="stylesheet" href="${href}" data-spa-css="1" />`;
  for (const file of htmlFiles) {
    let html = readFileSync(file, "utf8");
    // Visual ACK: shared SPA CSS hash OK alongside data-forge-self-style inline chrome
    if (html.includes('data-spa-css="1"')) {
      html = html.replace(/<link rel="stylesheet" href="\/assets\/[^"]+" data-spa-css="1" \/>/, tag);
    } else if (html.includes("</head>")) {
      html = html.replace("</head>", `  ${tag}\n</head>`);
    } else {
      continue;
    }
    // keep Visual chrome; shared SPA CSS is additive
    writeFileSync(file, html);
    console.log("spa-css", relative(distDir, file), "→", href);
  }
}

async function main() {
  loadEnv();
  injectSpaCssIntoForge("./dist");
  const files = collect("./dist");
  const deploymentId = randomUUID();
  console.log("uploading", files.length, "files", deploymentId);
  const published = [];
  for (const f of files) {
    const uploadUrl = convexRun("site:generateUploadUrl", {});
    const body = readFileSync(f.localPath);
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": f.contentType },
      body,
    });
    if (!res.ok) throw new Error(`${f.path} ${res.status} ${await res.text()}`);
    const { storageId } = await res.json();
    published.push({ path: f.path, storageId, contentType: f.contentType });
    console.log("ok", f.path);
  }
  // publish in chunks
  for (let i = 0; i < published.length; i += 40) {
    const chunk = published.slice(i, i + 40);
    console.log(
      "publish",
      convexRun("site:publish", { deploymentId, files: chunk }),
    );
  }
  console.log("LIVE https://quirky-rhinoceros-204.convex.site/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
