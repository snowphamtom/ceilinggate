import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createClaim = mutation({
  args: {
    claimed: v.array(v.number()),
    interior: v.optional(v.array(v.number())),
    sourceUrl: v.optional(v.string()),
    sourceUrls: v.optional(v.array(v.string())),
    emailId: v.optional(v.string()),
    subject: v.optional(v.string()),
    from: v.optional(v.string()),
    label: v.optional(v.string()),
    bodyText: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("claims", {
      claimed: args.claimed,
      interior: args.interior,
      status: args.status ?? "received",
      sourceUrl: args.sourceUrl,
      sourceUrls: args.sourceUrls,
      emailId: args.emailId,
      subject: args.subject,
      from: args.from,
      label: args.label,
      bodyText: args.bodyText,
      createdAt: now,
      receivedAt: now,
    });
  },
});

export const listClaims = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("claims")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const listDecisions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
    const rows = [];
    for (const claim of claims) {
      const decision = await ctx.db
        .query("gateDecisions")
        .withIndex("by_claimId", (q) => q.eq("claimId", claim._id))
        .unique();
      rows.push({ claim, decision });
    }
    return rows;
  },
});

export const getClaim = query({
  args: { id: v.id("claims") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Alias used by some UI variants */
export const get = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.claimId);
  },
});

export const getDecision = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gateDecisions")
      .withIndex("by_claimId", (q) => q.eq("claimId", args.claimId))
      .unique();
  },
});

export const getInterior = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interiors")
      .withIndex("by_claimId", (q) => q.eq("claimId", args.claimId))
      .unique();
  },
});

export const markStatus = mutation({
  args: {
    id: v.id("claims"),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      error: args.error,
    });
  },
});
