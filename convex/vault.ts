import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Legion vault — tribute after firewall crawl + imperator learnings.
 * Never returns secret bodies to clients. GH_PAT_MAGPIE (if set) only
 * confirms GitHub Actions secret *names* exist.
 */

const ledgerStatus = v.optional(
  v.union(v.literal("ok"), v.literal("denied"), v.literal("escalated")),
);

export const insertLedger = internalMutation({
  args: {
    legion: v.string(),
    province: v.string(),
    action: v.string(),
    timestamp: v.number(),
    actor: v.optional(v.string()),
    payload: v.optional(v.any()),
    status: ledgerStatus,
    ip: v.optional(v.string()),
    latency_ms: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"grokLedger">> => {
    return await ctx.db.insert("grokLedger", {
      legion: args.legion,
      province: args.province,
      action: args.action,
      timestamp: args.timestamp,
      actor: args.actor,
      payload: args.payload,
      status: args.status,
      ip: args.ip,
      latency_ms: args.latency_ms,
    });
  },
});

export const insertLedgerPublic = mutation({
  args: {
    legion: v.string(),
    province: v.string(),
    action: v.string(),
    timestamp: v.number(),
    actor: v.optional(v.string()),
    payload: v.optional(v.any()),
    status: ledgerStatus,
    ip: v.optional(v.string()),
    latency_ms: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"grokLedger">> => {
    return await ctx.db.insert("grokLedger", {
      legion: args.legion,
      province: args.province,
      action: args.action,
      timestamp: args.timestamp,
      actor: args.actor,
      payload: args.payload,
      status: args.status,
      ip: args.ip,
      latency_ms: args.latency_ms,
    });
  },
});

export const insertLearning = mutation({
  args: {
    timestamp: v.number(),
    crawl: v.string(),
    grokMoves: v.string(),
    nextEdict: v.string(),
    source: v.optional(v.id("grokLedger")),
    pattern: v.optional(v.string()),
    edict: v.optional(v.string()),
    confidence: v.optional(v.number()),
    executed: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Id<"imperatorLearnings">> => {
    return await ctx.db.insert("imperatorLearnings", {
      timestamp: args.timestamp,
      crawl: args.crawl,
      grokMoves: args.grokMoves,
      nextEdict: args.nextEdict,
      source: args.source,
      pattern: args.pattern,
      edict: args.edict,
      confidence: args.confidence,
      executed: args.executed,
    });
  },
});

export const insertLearningInternal = internalMutation({
  args: {
    timestamp: v.number(),
    crawl: v.string(),
    grokMoves: v.string(),
    nextEdict: v.string(),
    source: v.optional(v.id("grokLedger")),
    pattern: v.optional(v.string()),
    edict: v.optional(v.string()),
    confidence: v.optional(v.number()),
    executed: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Id<"imperatorLearnings">> => {
    return await ctx.db.insert("imperatorLearnings", {
      timestamp: args.timestamp,
      crawl: args.crawl,
      grokMoves: args.grokMoves,
      nextEdict: args.nextEdict,
      source: args.source,
      pattern: args.pattern,
      edict: args.edict,
      confidence: args.confidence,
      executed: args.executed,
    });
  },
});

export const insertVaultAccess = internalMutation({
  args: {
    accessedAt: v.number(),
    repo: v.string(),
    path: v.string(),
    sha: v.optional(v.string()),
    deployedTo: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"vaultAccessLog">> => {
    return await ctx.db.insert("vaultAccessLog", {
      accessedAt: args.accessedAt,
      repo: args.repo,
      path: args.path,
      sha: args.sha,
      deployedTo: args.deployedTo,
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

export const latestLearning = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("imperatorLearnings")
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
    accessId: Id<"vaultAccessLog">;
    timestamp: number;
    crawlBase: string;
    crawlAt: number;
    results: CrawlRow[];
    learned: string[];
  }> => {
    const t0 = Date.now();
    const crawl = (await ctx.runAction(
      api.firewallCrawl.run,
      {},
    )) as CrawlResult;
    const timestamp = Date.now();
    const latency_ms = timestamp - t0;
    const failCount = crawl.results.filter((r) => !r.ok).length;
    const actionText =
      "fixed/verified 404 via Observatorium; Gate 200";
    const ledgerId: Id<"grokLedger"> = await ctx.runMutation(
      internal.vault.insertLedger,
      {
        legion: "IMPERATOR/Legion",
        province: "quirky",
        action: actionText,
        timestamp,
        actor: "vault.tributeAfterCrawl",
        payload: {
          base: crawl.base,
          at: crawl.at,
          failCount,
          routes: crawl.results.map((r) => r.route),
        },
        status: failCount > 0 ? "escalated" : "ok",
        latency_ms,
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
          "SAFE Y371: additive schema grokLedger+imperatorLearnings+vaultAccessLog; vault.tributeAfterCrawl; keep firewallCrawl engine; TWO-HOST intact",
        nextEdict:
          "Keep crawling *.convex.site only; never rewrite VITE_CONVEX_URL to .site; optional /llms.txt 404 stays known",
        source: ledgerId,
        pattern: "firewall-crawl-tribute",
        edict: "EDICTUM SECUNDUS Observatorium",
        confidence: failCount > 0 ? 0.55 : 0.92,
        executed: true,
      },
    );

    const accessId: Id<"vaultAccessLog"> = await ctx.runMutation(
      internal.vault.insertVaultAccess,
      {
        accessedAt: timestamp,
        repo: "snowphamtom/ceilinggate",
        path: "convex/vault.ts#tributeAfterCrawl",
        deployedTo: crawl.base,
      },
    );

    return {
      ledgerId,
      learningId,
      accessId,
      timestamp,
      crawlBase: crawl.base,
      crawlAt: crawl.at,
      results: crawl.results,
      learned: crawl.learned,
    };
  },
});

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
