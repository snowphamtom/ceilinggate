
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const fromValidator = v.union(v.literal("taylor"), v.literal("manager"));

/** Post a message to the Ops Channel (Taylor ↔ Manager). */
export const postMessage = mutation({
  args: {
    from: fromValidator,
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const body = args.body.trim();
    if (!body) {
      throw new Error("Message body is required");
    }
    if (body.length > 4000) {
      throw new Error("Message too long (max 4000 characters)");
    }
    return await ctx.db.insert("opsMessages", {
      from: args.from,
      body,
      kind: "chat",
      authed: false,
      createdAt: Date.now(),
    });
  },
});

/** Last 50 messages, oldest-first for chat display. */
export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("opsMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
    return rows.reverse();
  },
});
