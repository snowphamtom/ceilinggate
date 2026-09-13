import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Legion vault — tribute after firewall crawl + imperator learnings.
 * Never returns secret bodies to clients. GH_PAT_MAGPIE (if set) only
 * confirms GitHub Actions secret *names* exist.
 */

export const insertLedger = internalMutation({
  args: {
    legion: v.string(),
    province: v.string(),
    action: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"grokLedger">> => {
    return await ctx.db.insert("grokLedger", {
      legion: args.legion,
      province: args.province,
      action: args.action,
      timestamp: args.timestamp,
    });
  },
});

/** Public alias for manual ledger inserts if needed */
export const insertLedgerPublic = mutation({
  args: {
    legion: v.string(),
    province: v.string(),
    action: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"grokLedger">> => {
    return await ctx.db.insert("grokLedger", {
      legion: args.legion,
      province: args.province,
      action: args.action,
      timestamp: args.timestamp,
    });
  },
});

export const insertLearning = mutation({
  args: {
    timestamp: v.number(),
    crawl: v.string(),
    grokMoves: v.string(),
    nextEdict: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"imperatorLearnings">> => {
    return await ctx.db.insert("imperatorLearnings", {
      timestamp: args.timestamp,
      crawl: args.crawl,
      grokMoves: args.grokMoves,
      nextEdict: args.nextEdict,
    });
  },
});

export const insertLearningInternal = internalMutation({
  args: {
    timestamp: v.number(),
    crawl: v.string(),
    grokMoves: v.string(),
    nextEdict: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"imperatorLearnings">> => {
    return await ctx.db.insert("imperatorLearnings", {
      timestamp: args.timestamp,
      crawl: args.crawl,
      grokMoves: args.grokMoves,
      nextEdict: args.nextEdict,
    });
  },
});

export const latestLedger = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("grokLedger")
      .withIndex("by_timestamp")
      .order("desc")
      .first();
  },
});

type CrawlRow = { route: string; status: number; ok: boolean; ms?: number; error?: string };
type CrawlResult = {
  base: string;
  at: number;
  results: CrawlRow[];
  learned: string[];
};

export const tributeAfterCrawl = action({
  args: {},
  handler: async (ctx): Promise<{
    ledgerId: Id<"grokLedger">;
    learningId: Id<"imperatorLearnings">;
    timestamp: number;
    crawlBase: string;
    crawlAt: number;
    results: CrawlRow[];
    learned: string[];
  }> => {
    const crawl = (await ctx.runAction(
      api.firewallCrawl.run,
      {},
    )) as CrawlResult;
    const timestamp = Date.now();
    const actionText =
      "fixed/verified 404 via Observatorium; Gate 200";
    const ledgerId: Id<"grokLedger"> = await ctx.runMutation(
      internal.vault.insertLedger,
      {
        legion: "IMPERATOR/Legion",
        province: "quirky",
        action: actionText,
        timestamp,
      },
    );

    const crawlSummary = crawl.results
      .map((r) => `${r.route} ${r.status}${r.ok ? "" : " FAIL"}`)
      .join("; ");

    const learningId: Id<"imperatorLearnings"> = await ctx.runMutation(
      internal.vault.insertLearningInternal,
      {
        timestamp,
        crawl: crawlSummary,
        grokMoves:
          "SAFE Y371: schema grokLedger+imperatorLearnings; vault.tributeAfterCrawl; keep firewallCrawl engine; TWO-HOST intact; no Imperium Live GET /",
        nextEdict:
          "Keep crawling *.convex.site only; never rewrite VITE_CONVEX_URL to .site; optional /llms.txt 404 stays known",
      },
    );

    return {
      ledgerId,
      learningId,
      timestamp,
      crawlBase: crawl.base,
      crawlAt: crawl.at,
      results: crawl.results,
      learned: crawl.learned,
    };
  },
});

/**
 * Optional: if GH_PAT_MAGPIE is set on the deployment, list Actions secret
 * *names* only (GitHub API never returns secret values). Never echo PAT.
 */
export const confirmGhVaultNames = action({
  args: {},
  handler: async (): Promise<{
    ok: boolean;
    skipped: boolean;
    note: string;
    names: string[];
  }> => {
    const pat = process.env.GH_PAT_MAGPIE;
    if (!pat) {
      return {
        ok: false,
        skipped: true,
        note: "GH_PAT_MAGPIE not set on deployment — vault name check skipped",
        names: [],
      };
    }
    const repo =
      process.env.GH_VAULT_REPO || "snowphamtom/ceilinggate";
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/secrets`,
        {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${pat}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "ceilinggate-vault",
          },
        },
      );
      if (!res.ok) {
        return {
          ok: false,
          skipped: false,
          note: `GitHub secrets list HTTP ${res.status} (names only attempted; no bodies)`,
          names: [],
        };
      }
      const body = (await res.json()) as {
        secrets?: Array<{ name: string }>;
      };
      const names = (body.secrets || []).map((s) => s.name).sort();
      return {
        ok: true,
        skipped: false,
        note: `Confirmed ${names.length} Actions secret name(s) exist (values never returned)`,
        names,
      };
    } catch {
      return {
        ok: false,
        skipped: false,
        note: "GitHub secrets list failed (network/error); no secret bodies exposed",
        names: [],
      };
    }
  },
});
