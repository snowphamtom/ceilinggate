import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * EDICTUM SECUNDUS — inner CONVEX_SITE_URL firewall crawl.
 *
 * TWO-HOST LAW:
 *   *.convex.site  = static fortress + HTTP routes (this crawl)
 *   *.convex.cloud = Convex client API (VITE_CONVEX_URL) — NEVER crawl-as-site
 * Evidence stays https://fleet-gerbil-682.convex.cloud
 */

export const CRAWL_ROUTES = [
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
] as const;

const KEEP = new Set<string>([
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

const OPTIONAL_404 = new Set<string>(["/llms.txt"]);

const SITE_FALLBACK = "https://quirky-rhinoceros-204.convex.site";
const EVIDENCE = "https://fleet-gerbil-682.convex.cloud";

const resultValidator = v.object({
  route: v.string(),
  status: v.number(),
  ok: v.boolean(),
  ms: v.optional(v.number()),
  error: v.optional(v.string()),
});

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function assertSiteBase(base: string): string {
  const b = stripSlash(base);
  if (/\.convex\.cloud$/i.test(b)) {
    throw new Error(
      "TWO-HOST LAW: crawl base must be CONVEX_SITE_URL (*.convex.site), never *.convex.cloud / VITE_CONVEX_URL",
    );
  }
  return b;
}

async function probe(
  base: string,
  route: string,
): Promise<{ route: string; status: number; ok: boolean }> {
  const url = `${stripSlash(base)}${route}`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    return { route, status: res.status, ok: res.ok };
  } catch {
    return { route, status: 0, ok: false };
  }
}

function learn(
  results: Array<{ route: string; status: number; ok: boolean }>,
  cloudByRoute: Record<string, number>,
): string[] {
  const learned: string[] = [
    "TWO-HOST LAW: static + HTTP live on *.convex.site; VITE_CONVEX_URL stays *.convex.cloud.",
    `Evidence stays ${EVIDENCE} — never rewrite to quirky.site.`,
    "A 404 of the same static path on *.convex.cloud is EXPECTED, not a broken deploy.",
  ];
  for (const r of results) {
    const cloud = cloudByRoute[r.route];
    if (KEEP.has(r.route) && !r.ok) {
      learned.push(
        `REAL PROBLEM: ${r.route} on .site returned ${r.status} (expected 2xx).`,
      );
    } else if (OPTIONAL_404.has(r.route) && r.status === 404) {
      learned.push(
        `OPTIONAL/STRIPPED: ${r.route} 404 on .site is known, not a brick.`,
      );
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

export const store = mutation({
  args: {
    base: v.string(),
    at: v.number(),
    results: v.array(resultValidator),
    learned: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("firewallCrawlLogs", {
      siteUrl: args.base,
      createdAt: args.at,
      results: args.results,
      learned: args.learned,
    });
  },
});

export const latest = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("firewallCrawlLogs")
      .withIndex("by_createdAt")
      .order("desc")
      .first();
  },
});

export const run = action({
  args: {},
  handler: async (ctx) => {
    const base = assertSiteBase(process.env.CONVEX_SITE_URL || SITE_FALLBACK);
    const cloudBase = stripSlash(
      process.env.CONVEX_CLOUD_URL ||
        base.replace(/\.convex\.site$/i, ".convex.cloud"),
    );
    const at = Date.now();
    const results: Array<{ route: string; status: number; ok: boolean }> = [];
    const cloudByRoute: Record<string, number> = {};
    for (const route of CRAWL_ROUTES) {
      const row = await probe(base, route);
      results.push(row);
      const twin = await probe(cloudBase, route);
      cloudByRoute[route] = twin.status;
    }
    const learned = learn(results, cloudByRoute);
    await ctx.runMutation(api.firewallCrawl.store, {
      base,
      at,
      results,
      learned,
    });
    return { base, at, results, learned };
  },
});
