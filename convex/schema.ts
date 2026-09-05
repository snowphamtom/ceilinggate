import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  claims: defineTable({
    threadId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    subject: v.string(),
    from: v.string(),
    receivedAt: v.number(),
    bodyText: v.string(),
    claimed: v.array(v.number()),
    sourceUrls: v.array(v.string()),
    status: v.union(
      v.literal("received"),
      v.literal("parsing"),
      v.literal("scraping"),
      v.literal("ready"),
      v.literal("gated"),
      v.literal("error"),
    ),
    error: v.optional(v.string()),
    fixtureId: v.optional(v.string()),
  })
    .index("by_receivedAt", ["receivedAt"])
    .index("by_status", ["status"])
    .index("by_messageId", ["messageId"]),

  interiors: defineTable({
    claimId: v.id("claims"),
    url: v.string(),
    firecrawlJobId: v.optional(v.string()),
    rawMarkdown: v.optional(v.string()),
    interior: v.array(v.number()),
    scrapedAt: v.number(),
  }).index("by_claimId", ["claimId"]),

  gateDecisions: defineTable({
    claimId: v.id("claims"),
    status: v.union(v.literal("grant"), v.literal("refuse")),
    mask: v.number(),
    failedIndices: v.array(v.number()),
    claimed: v.array(v.number()),
    interior: v.array(v.number()),
    decidedAt: v.number(),
  }).index("by_claimId", ["claimId"]),

  vectors: defineTable({
    claimId: v.id("claims"),
    kind: v.union(v.literal("claim"), v.literal("receipt"), v.literal("joint")),
    embedding: v.array(v.number()),
    dims: v.number(),
    createdAt: v.number(),
  }).index("by_claimId", ["claimId"]),
});
