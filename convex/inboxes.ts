import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inboxes").collect();
  },
});

export const upsert = mutation({
  args: {
    agentMailInboxId: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("inboxes")
      .withIndex("by_agentMailInboxId", (q) =>
        q.eq("agentMailInboxId", args.agentMailInboxId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        displayName: args.displayName,
      });
      return existing._id;
    }
    return await ctx.db.insert("inboxes", {
      agentMailInboxId: args.agentMailInboxId,
      email: args.email,
      displayName: args.displayName,
      createdAt: Date.now(),
    });
  },
});

/**
 * Wire inbox id when Create / dashboard provides AGENTMAIL_INBOX_ID.
 * Call after deploy: no-op if env unset (never invents an id).
 */
export const syncFromEnv = mutation({
  args: {},
  handler: async (ctx) => {
    const inboxId = process.env.AGENTMAIL_INBOX_ID;
    if (!inboxId) {
      return {
        ok: false as const,
        note: "AGENTMAIL_INBOX_ID unset — set after AgentMail Create",
      };
    }
    const existing = await ctx.db
      .query("inboxes")
      .withIndex("by_agentMailInboxId", (q) =>
        q.eq("agentMailInboxId", inboxId),
      )
      .unique();
    if (existing) return { ok: true as const, id: existing._id, inboxId };
    const id = await ctx.db.insert("inboxes", {
      agentMailInboxId: inboxId,
      displayName: process.env.AGENTMAIL_INBOX_EMAIL ?? "ceilinggate@agentmail.to",
      email: process.env.AGENTMAIL_INBOX_EMAIL ?? "ceilinggate@agentmail.to",
      createdAt: Date.now(),
    });
    return { ok: true as const, id, inboxId };
  },
});
