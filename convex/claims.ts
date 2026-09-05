import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("claims")
      .withIndex("by_receivedAt")
      .order("desc")
      .take(limit);
  },
});

export const get = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => ctx.db.get(claimId),
});

export const getDecision = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) =>
    ctx.db
      .query("gateDecisions")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .unique(),
});

export const getInterior = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) =>
    ctx.db
      .query("interiors")
      .withIndex("by_claimId", (q) => q.eq("claimId", claimId))
      .first(),
});

export const listDecisions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_receivedAt")
      .order("desc")
      .take(limit);
    const out = [];
    for (const c of claims) {
      const decision = await ctx.db
        .query("gateDecisions")
        .withIndex("by_claimId", (q) => q.eq("claimId", c._id))
        .unique();
      out.push({ claim: c, decision });
    }
    return out;
  },
});

export const createManual = mutation({
  args: {
    subject: v.string(),
    from: v.string(),
    bodyText: v.string(),
    claimed: v.array(v.number()),
    sourceUrls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("claims", {
      subject: args.subject,
      from: args.from,
      receivedAt: Date.now(),
      bodyText: args.bodyText,
      claimed: args.claimed,
      sourceUrls: args.sourceUrls,
      status: args.sourceUrls.length ? "scraping" : "ready",
    });
  },
});
