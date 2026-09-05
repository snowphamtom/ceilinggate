import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { gateB } from "./lib/gates";

/**
 * AgentMail wiring stubs.
 * When @agentmail/convex is configured + codegen produces `components`,
 * construct `new AgentMail(components.agentmail, { onMessageReceived })`
 * in pipeline.ts (preferred) or here after `npx convex dev`.
 *
 * Inbox id: set AGENTMAIL_INBOX_ID (from Create) then call inboxes.syncFromEnv.
 */

export const onMessageReceived = internalMutation({
  args: {
    message: v.any(),
    thread: v.any(),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = args.message as {
      message_id?: string;
      inbox_id?: string;
      subject?: string;
      from_?: string | { email?: string };
      text?: string;
      extracted_text?: string;
    };

    // Prefer env inbox when Create provided one; else message inbox_id.
    const configuredInbox = process.env.AGENTMAIL_INBOX_ID;
    if (
      configuredInbox &&
      msg.inbox_id &&
      msg.inbox_id !== configuredInbox
    ) {
      // Ignore mail for other inboxes when a specific Create id is wired.
      return;
    }

    const body = msg.text ?? msg.extracted_text ?? "";
    const claimed = parseClaimed(body);
    const sourceUrl = firstUrl(body);
    const from =
      typeof msg.from_ === "string"
        ? msg.from_
        : (msg.from_?.email ?? undefined);

    const interior: number[] = [];
    const decision = gateB(interior, claimed);
    const now = Date.now();

    if (msg.inbox_id || configuredInbox) {
      const agentMailInboxId = configuredInbox ?? msg.inbox_id!;
      const existing = await ctx.db
        .query("inboxes")
        .withIndex("by_agentMailInboxId", (q) =>
          q.eq("agentMailInboxId", agentMailInboxId),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("inboxes", {
          agentMailInboxId,
          createdAt: now,
        });
      }
    }

    await ctx.db.insert("claims", {
      claimed,
      interior,
      status: sourceUrl ? "scraping" : "received",
      mask: decision.mask,
      failedIndices: decision.failedIndices,
      sourceUrl,
      sourceUrls: sourceUrl ? [sourceUrl] : [],
      emailId: msg.message_id,
      messageId: msg.message_id,
      subject: msg.subject,
      from,
      createdAt: now,
      receivedAt: now,
    });
  },
});

export const registerInbox = mutation({
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
    if (existing) return existing._id;
    return await ctx.db.insert("inboxes", {
      agentMailInboxId: args.agentMailInboxId,
      email: args.email,
      displayName: args.displayName,
      createdAt: Date.now(),
    });
  },
});

function parseClaimed(body: string): number[] {
  const tagged = body.match(/CLAIMED:\s*([0-9.,\s]+)/i);
  if (tagged?.[1]) {
    return tagged[1]
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
  }
  return [...body.matchAll(/\$(\d+(?:\.\d{1,2})?)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => !Number.isNaN(n))
    .slice(0, 8);
}

function firstUrl(body: string): string | undefined {
  const m = body.match(/https?:\/\/[^\s)>"]+/i);
  return m?.[0];
}
