import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    oneLine: v.optional(v.string()),
    oneLineSource: v.optional(v.union(v.literal("openai"), v.literal("gate"))),
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

  siteAssets: defineTable({
    path: v.string(),
    storageId: v.id("_storage"),
    contentType: v.string(),
    deploymentId: v.string(),
  })
    .index("by_deployment_path", ["deploymentId", "path"])
    .index("by_deployment", ["deploymentId"])
    .index("by_path", ["path"]),

  forgedApps: defineTable({
    slug: v.string(),
    title: v.string(),
    brief: v.string(),
    path: v.string(),
    stack: v.array(v.string()),
    inheritsAccess: v.boolean(),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),
  siteMeta: defineTable({
    key: v.string(),
    deploymentId: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  opsMessages: defineTable({
    from: v.string(),
    body: v.string(),
    kind: v.optional(v.string()),
    authed: v.optional(v.boolean()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  /** Observatorium — firewall crawl snapshots (EDICTUM SECUNDUS) */
  firewallCrawlLogs: defineTable({
    siteUrl: v.string(),
    results: v.array(
      v.object({
        route: v.string(),
        status: v.number(),
        ok: v.boolean(),
        ms: v.optional(v.number()),
        error: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
    learned: v.optional(v.array(v.string())),
  }).index("by_createdAt", ["createdAt"]),

  /** Legion tribute — Observatorium ledger rows */
  grokLedger: defineTable({
    legion: v.string(),
    province: v.string(),
    action: v.string(),
    timestamp: v.number(),
    /** Additive Senate fields (optional — never rename camelCase) */
    actor: v.optional(v.string()),
    payload: v.optional(v.any()),
    status: v.optional(
      v.union(v.literal("ok"), v.literal("denied"), v.literal("escalated")),
    ),
    ip: v.optional(v.string()),
    latency_ms: v.optional(v.number()),
  }).index("by_timestamp", ["timestamp"]),

  /** Imperator learnings after crawl / edict cycles */
  imperatorLearnings: defineTable({
    timestamp: v.number(),
    crawl: v.string(),
    grokMoves: v.string(),
    nextEdict: v.string(),
    source: v.optional(v.id("grokLedger")),
    pattern: v.optional(v.string()),
    edict: v.optional(v.string()),
    confidence: v.optional(v.number()),
    executed: v.optional(v.boolean()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_confidence", ["confidence"]),

  /** Vault access audit — additive Observatorium */
  vaultAccessLog: defineTable({
    accessedAt: v.number(),
    repo: v.string(),
    path: v.string(),
    sha: v.optional(v.string()),
    deployedTo: v.optional(v.string()),
  }).index("by_accessedAt", ["accessedAt"]),
});
