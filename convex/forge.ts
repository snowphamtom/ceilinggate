import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Record a spawned micro-app from App Forge (judge demo + cascading access). */
export const spawn = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    brief: v.string(),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("forgedApps")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        brief: args.brief,
        path: args.path,
        createdAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("forgedApps", {
      slug: args.slug,
      title: args.title,
      brief: args.brief,
      path: args.path,
      stack: ["convex", "firecrawl", "agentmail", "residual-gates"],
      inheritsAccess: true,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("forgedApps").order("desc").take(20);
  },
});
