import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  mutation,
} from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { AgentMail } from "@agentmail/convex";
import FirecrawlClient from "@firecrawl/firecrawl-convex";
import { gateB } from "./lib/gates";
import {
  parseClaimed,
  parseInteriorFromMarkdown,
  parseSourceUrls,
} from "./parse";

const firecrawl = new FirecrawlClient(components.firecrawl);

export const agentmail: any = new AgentMail(components.agentmail, {
  onMessageReceived: internal.pipeline.onMessageReceived,
});

export const onMessageReceived = internalMutation({
  args: { message: v.any(), thread: v.any(), eventId: v.string() },
  handler: async (ctx, args) => {
    const text: string =
      args.message?.text ??
      args.message?.extracted_text ??
      args.message?.body ??
      "";
    const subject: string = args.message?.subject ?? "(no subject)";
    const fromRaw =
      args.message?.from ??
      args.message?.from_ ??
      args.message?.from_addresses ??
      "unknown";
    const from =
      typeof fromRaw === "string" ? fromRaw : JSON.stringify(fromRaw);
    const claimed = parseClaimed(String(text));
    const sourceUrls = parseSourceUrls(String(text));
    const now = Date.now();
    const claimId = await ctx.db.insert("claims", {
      threadId: args.message?.thread_id,
      messageId: args.message?.message_id,
      emailId: args.message?.message_id,
      subject,
      from,
      receivedAt: now,
      createdAt: now,
      bodyText: String(text).slice(0, 8000),
      claimed,
      sourceUrls,
      sourceUrl: sourceUrls[0],
      status: sourceUrls.length ? "scraping" : "ready",
    });
    await ctx.db.insert("vectors", {
      claimId,
      kind: "claim",
      embedding: claimed.map((n) => n / 100),
      dims: claimed.length,
      createdAt: Date.now(),
    });
    if (sourceUrls[0]) {
      await ctx.scheduler.runAfter(0, internal.pipeline.scrapeAndGate, {
        claimId,
        url: sourceUrls[0],
      });
    }
  },
});

export const scrapeAndGate = internalAction({
  args: { claimId: v.id("claims"), url: v.string() },
  handler: async (ctx, args) => {
    try {
      try {
        const doc = await firecrawl.scrape(ctx, args.url, { formats: ["markdown"] });
        const md =
          (doc as { markdown?: string }).markdown ??
          (doc as { content?: string }).content ??
          JSON.stringify(doc).slice(0, 4000);
        const interior = parseInteriorFromMarkdown(md);
        await ctx.runMutation(internal.pipeline.gateWithInterior, {
          claimId: args.claimId,
          interior,
          url: args.url,
          rawMarkdown: md.slice(0, 12000),
        });
        return;
      } catch {
        // Fallback: our action (fixtures / direct API key).
        await ctx.runAction(api.firecrawl.scrapeUrl, {
          url: args.url,
          claimId: args.claimId,
        });
      }
    } catch (e) {
      await ctx.runMutation(internal.pipeline.markError, {
        claimId: args.claimId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
});

export const gateWithInterior = internalMutation({
  args: {
    claimId: v.id("claims"),
    interior: v.array(v.number()),
    url: v.string(),
    rawMarkdown: v.string(),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId);
    if (!claim) return;
    if (args.url) {
      await ctx.db.insert("interiors", {
        claimId: args.claimId,
        url: args.url,
        rawMarkdown: args.rawMarkdown,
        interior: args.interior,
        scrapedAt: Date.now(),
      });
    }
    const decision = gateB(args.interior, claim.claimed);
    const existing = await ctx.db
      .query("gateDecisions")
      .withIndex("by_claimId", (q) => q.eq("claimId", args.claimId))
      .unique();
    const fields = {
      status: decision.status,
      mask: decision.mask,
      failedIndices: decision.failedIndices,
      claimed: claim.claimed,
      interior: args.interior,
      decidedAt: Date.now(),
    };
    if (existing) await ctx.db.patch(existing._id, fields);
    else await ctx.db.insert("gateDecisions", { claimId: args.claimId, ...fields });
    await ctx.db.patch(args.claimId, { status: "gated", error: undefined });
  },
});

export const markError = internalMutation({
  args: { claimId: v.id("claims"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.claimId, { status: "error", error: args.error });
  },
});

export const scrapeClaimUrl = action({
  args: { claimId: v.id("claims"), url: v.string() },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.pipeline.scrapeAndGate, args);
  },
});

export const ingestManualClaim = mutation({
  args: {
    subject: v.string(),
    from: v.string(),
    bodyText: v.string(),
  },
  handler: async (ctx, args) => {
    const claimed = parseClaimed(args.bodyText);
    const sourceUrls = parseSourceUrls(args.bodyText);
    const now = Date.now();
    const claimId = await ctx.db.insert("claims", {
      subject: args.subject,
      from: args.from,
      receivedAt: now,
      createdAt: now,
      bodyText: args.bodyText.slice(0, 8000),
      claimed,
      sourceUrls,
      sourceUrl: sourceUrls[0],
      status: sourceUrls.length ? "scraping" : "ready",
    });
    if (sourceUrls[0]) {
      await ctx.scheduler.runAfter(0, internal.pipeline.scrapeAndGate, {
        claimId,
        url: sourceUrls[0],
      });
    }
    return claimId;
  },
});
