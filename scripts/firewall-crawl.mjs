#!/usr/bin/env node
/**
 * EDICTUM SECUNDUS — box-side CONVEX_SITE_URL firewall crawl.
 * Crawls SITE (*.convex.site), never VITE_CONVEX_URL (*.convex.cloud).
 *
 *   SITE=https://quirky-rhinoceros-204.convex.site node scripts/firewall-crawl.mjs
 */
import { readFileSync } from "fs";
import { spawnSync } from "child_process";

const ROUTES = [
  "/",
  "/health",
  "/watch.html",
  "/watch",
  "/judge.html",
  "/forge/sorting-machine/",
  "/manifest.webmanifest",
  "/hls/master.m3u8",
  "/receipts/fuel-grant.html",
  "/llms.txt",
];

const KEEP = new Set([
  "/",
  "/health",
  "/watch.html",
  "/watch",
  "/judge.html",
  "/forge/sorting-machine/",
  "/manifest.webmanifest",
  "/hls/master.m3u8",
  "/receipts/fuel-grant.html",
]);

const OPTIONAL_404 = new Set(["/llms.txt"]);
const SITE_FALLBACK = "https://quirky-rhinoceros-204.convex.site";
const EVIDENCE = "https://fleet-gerbil-682.convex.cloud";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i);
      if (process.env[k]) continue;
      process.env[k] = t.slice(i + 1);
    }
  } catch {
    // CI / box may export SITE directly.
  }
}

function stripSlash(url) {
  return String(url).replace(/\/$/, "");
}

function resolveSite() {
  const raw =
    process.env.SITE ||
    process.env.CONVEX_SITE_URL ||
    process.env.VITE_PUBLIC_SITE_URL ||
    SITE_FALLBACK;
  const base = stripSlash(raw);
  if (/\.convex\.cloud$/i.test(base) || base === stripSlash(process.env.VITE_CONVEX_URL || "")) {
    throw new Error(
      "TWO-HOST LAW: SITE must be *.convex.site (CONVEX_SITE_URL). Do not crawl VITE_CONVEX_URL / *.convex.cloud.",
    );
  }
  return base;
}

function curlStatus(url) {
  const r = spawnSync("curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "-L", "--max-time", "20", url], {
    encoding: "utf8",
  });
  const code = parseInt((r.stdout || "").trim(), 10);
  if (r.status !== 0 && !Number.isFinite(code)) return 0;
  return Number.isFinite(code) ? code : 0;
}

async function fetchStatus(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    return res.status;
  } catch {
    return 0;
  }
}

async function probe(base, route) {
  const url = `${stripSlash(base)}${route}`;
  let status = curlStatus(url);
  if (!status) status = await fetchStatus(url);
  return { route, status, ok: status >= 200 && status < 300 };
}

function learn(results, cloudByRoute) {
  const learned = [
    "TWO-HOST LAW: static + HTTP live on *.convex.site; VITE_CONVEX_URL stays *.convex.cloud.",
    `Evidence stays ${EVIDENCE} — never rewrite to quirky.site.`,
    "A 404 of the same static path on *.convex.cloud is EXPECTED, not a broken deploy.",
  ];
  for (const r of results) {
    const cloud = cloudByRoute[r.route];
    if (KEEP.has(r.route) && !r.ok) {
      learned.push(`REAL PROBLEM: ${r.route} on .site returned ${r.status} (expected 2xx).`);
    } else if (OPTIONAL_404.has(r.route) && r.status === 404) {
      learned.push(`OPTIONAL/STRIPPED: ${r.route} 404 on .site is known, not a brick.`);
    } else if (r.ok && cloud === 404) {
      learned.push(
        `${r.route} ${r.status} on .site; .cloud 404 is EXPECTED (static does not live on .cloud).`,
      );
    } else if (r.ok) {
      learned.push(
        `${r.route} ${r.status} on .site; a .cloud static 404 for this path would be EXPECTED.`,
      );
    } else {
      learned.push(`${r.route} on .site returned ${r.status}.`);
    }
  }
  return learned;
}

async function main() {
  loadEnv();
  const base = resolveSite();
  const cloudBase = stripSlash(
    process.env.CONVEX_CLOUD_URL ||
      process.env.VITE_CONVEX_URL ||
      base.replace(/\.convex\.site$/i, ".convex.cloud"),
  );
  const at = Date.now();
  const results = [];
  const cloudByRoute = {};
  for (const route of ROUTES) {
    const row = await probe(base, route);
    results.push(row);
    const twin = await probe(cloudBase, route);
    cloudByRoute[route] = twin.status;
    row.cloudStatus = twin.status;
  }
  const learned = learn(results, cloudByRoute);
  const payload = {
    base,
    at,
    results: results.map(({ route, status, ok }) => ({ route, status, ok })),
    learned,
    cloudBase,
    cloud: results.map(({ route, cloudStatus }) => ({
      route,
      status: cloudStatus,
    })),
  };
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
