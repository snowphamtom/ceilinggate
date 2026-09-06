import { v } from "convex/values";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { composeOneLine } from "./lib/oneLine";

/**
 * Sponsor job: one sentence, never a thread.
 * Uses OPENAI_API_KEY on the Convex deploy when present.
 * Falls back to the gate sentence so the board is never empty.
 */
export const annotate = internalAction({
  args: {
    decisionId: v.id("gateDecisions"),
    status: v.union(v.literal("grant"), v.literal("refuse")),
    claimed: v.array(v.number()),
    interior: v.array(v.number()),
    failedIndices: v.array(v.number()),
    lineItems: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const fallback = composeOneLine(args);
    const key = process.env.OPENAI_API_KEY;
    let text = fallback;
    let source: "openai" | "gate" = "gate";

    if (key) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 48,
            temperature: 0,
            messages: [
              {
                role: "system",
                content:
                  "Reply with exactly one sentence. No greeting. No questions. Restate GRANT or the first overage in plain English dollars.",
              },
              {
                role: "user",
                content: JSON.stringify({
                  status: args.status,
                  claimed: args.claimed,
                  interior: args.interior,
                  failedIndices: args.failedIndices,
                  lineItems: args.lineItems ?? ["fuel", "lodging", "meals", "misc"],
                  seed: fallback,
                }),
              },
            ],
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const out = data.choices?.[0]?.message?.content?.trim();
          if (out) {
            text = out.split("\n")[0]!.slice(0, 180);
            source = "openai";
          }
        }
      } catch {
        text = fallback;
        source = "gate";
      }
    }

    await ctx.runMutation(internal.oneLine.store, {
      decisionId: args.decisionId,
      oneLine: text,
      oneLineSource: source,
    });
    return { oneLine: text, oneLineSource: source };
  },
});

export const store = internalMutation({
  args: {
    decisionId: v.id("gateDecisions"),
    oneLine: v.string(),
    oneLineSource: v.union(v.literal("openai"), v.literal("gate")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.decisionId, {
      oneLine: args.oneLine,
      oneLineSource: args.oneLineSource,
    });
  },
});
