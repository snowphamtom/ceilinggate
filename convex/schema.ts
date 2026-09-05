import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * CeilingGate schema stubs.
 * AgentMail / Firecrawl components keep their own sandboxed tables.
 */
export default defineSchema({
  inboxes: defineTable({
    agentMailInboxId: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_agentMailInboxId", ["agentMailInboxId"]),

  claims: defineTable({
    claimed: v.array(v.number()),
    interior: v.optional(v.array(v.number())),
    /** received | parsing | scraping | ready | gated | error */
    status: v.string(),
    mask: v.optional(v.number()),
    failedIndices: v.optional(v.array(v.number())),
    gateStatus: v.optional(v.union(v.literal("grant"), v.literal("refuse"))),
    sourceUrl: v.optional(v.string()),
    sourceUrls: v.optional(v.array(v.string())),
    emailId: v.optional(v.string()),
    messageId: v.optional(v.string()),
    threadId: v.optional(v.string()),
    subject: v.optional(v.string()),
    from: v.optional(v.string()),
    label: v.optional(v.string()),
    bodyText: v.optional(v.string()),
    fixtureId: v.optional(v.string()),
    error: v.optional(v.string()),
    receivedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_receivedAt", ["receivedAt"])
    .index("by_status", ["status"])
    .index("by_emailId", ["emailId"]),

  interiors: defineTable({
    claimId: v.id("claims"),
    url: v.string(),
    firecrawlJobId: v.optional(v.string()),
    rawMarkdown: v.optional(v.string()),
    rawText: v.optional(v.string()),
    interior: v.array(v.number()),
    scrapedAt: v.number(),
  }).index("by_claimId", ["claimId"]),

  gateDecisions: defineTable({
    claimId: v.optional(v.id("claims")),
    label: v.optional(v.string()),
    claimed: v.array(v.number()),
    interior: v.array(v.number()),
    status: v.union(v.literal("grant"), v.literal("refuse")),
    mask: v.number(),
    failedIndices: v.array(v.number()),
    decidedAt: v.number(),
  })
    .index("by_decidedAt", ["decidedAt"])
    .index("by_claimId", ["claimId"]),

  scrapes: defineTable({
    url: v.string(),
    text: v.string(),
    source: v.union(
      v.literal("firecrawl"),
      v.literal("fetch"),
      v.literal("fixture"),
    ),
    claimId: v.optional(v.id("claims")),
    createdAt: v.number(),
  }).index("by_url", ["url"]),

  vectors: defineTable({
    claimId: v.optional(v.id("claims")),
    kind: v.string(),
    embedding: v.array(v.number()),
    dims: v.number(),
    createdAt: v.number(),
  }).index("by_claimId", ["claimId"]),

  fixtures: defineTable({
    fixtureId: v.string(),
    label: v.string(),
    claimed: v.array(v.number()),
    interior: v.array(v.number()),
    expectStatus: v.string(),
    expectMask: v.number(),
    expectFailedIndices: v.array(v.number()),
  }).index("by_fixtureId", ["fixtureId"]),
});
