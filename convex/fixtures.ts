import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  gateB,
  sampleInterior,
  sampleInvalid,
  sampleValid,
  granted,
} from "./lib/gates";

const FIXTURES = [
  {
    id: "te-grant",
    label: "CG-TE-001 GRANT — Drive-fuel T&E under ceiling",
    subject: "T&E claim — under ceiling",
    from: "fixture@ceilinggate.local",
    body: "CLAIMED: 98, 49, 25, 9\nRECEIPT: https://monsters-ink-107139.square.site",
    claimed: sampleValid,
    interior: sampleInterior,
  },
  {
    id: "te-refuse",
    label: "CG-TE-002 REFUSE — lodging+misc overclaim (mask 10)",
    subject: "T&E claim — over ceiling",
    from: "fixture@ceilinggate.local",
    body: "CLAIMED: 98, 51, 25, 11\nRECEIPT: https://monsters-ink-107139.square.site",
    claimed: sampleInvalid,
    interior: sampleInterior,
  },
] as const;

export const listFixtureDefs = query({
  args: {},
  handler: async () =>
    FIXTURES.map((f) => ({
      id: f.id,
      label: f.label,
      claimed: [...f.claimed],
      interior: [...f.interior],
      expect: gateB([...f.interior], [...f.claimed]),
    })),
});

export const runFixture = mutation({
  args: { fixtureId: v.string() },
  handler: async (ctx, { fixtureId }) => {
    const f = FIXTURES.find((x) => x.id === fixtureId);
    if (!f) throw new Error(`Unknown fixture: ${fixtureId}`);
    const decision = gateB([...f.interior], [...f.claimed]);
    const now = Date.now();
    const claimId = await ctx.db.insert("claims", {
      subject: f.subject,
      from: f.from,
      receivedAt: now,
      createdAt: now,
      bodyText: f.body,
      claimed: [...f.claimed],
      interior: [...f.interior],
      sourceUrls: [`https://monsters-ink-107139.square.site`],
      sourceUrl: `https://monsters-ink-107139.square.site`,
      status: "gated",
      gateStatus: decision.status,
      mask: decision.mask,
      failedIndices: decision.failedIndices,
      fixtureId: f.id,
    });
    await ctx.db.insert("interiors", {
      claimId,
      url: `https://monsters-ink-107139.square.site`,
      rawMarkdown: `INTERIOR: ${f.interior.join(", ")}`,
      interior: [...f.interior],
      scrapedAt: now,
    });
    await ctx.db.insert("gateDecisions", {
      claimId,
      status: decision.status,
      mask: decision.mask,
      failedIndices: decision.failedIndices,
      claimed: [...f.claimed],
      interior: [...f.interior],
      decidedAt: now,
      label: f.label,
    });
    await ctx.db.insert("vectors", {
      claimId,
      kind: "joint",
      embedding: f.claimed.map((n, i) => n - (f.interior[i] ?? 0)),
      dims: f.claimed.length,
      createdAt: now,
    });
    return { claimId, decision, granted: granted(decision) };
  },
});

export const runAllFixtures = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];
    for (const f of FIXTURES) {
      const decision = gateB([...f.interior], [...f.claimed]);
      const now = Date.now();
      const claimId = await ctx.db.insert("claims", {
        subject: f.subject,
        from: f.from,
        receivedAt: now,
        createdAt: now,
        bodyText: f.body,
        claimed: [...f.claimed],
        interior: [...f.interior],
        sourceUrls: [`https://monsters-ink-107139.square.site`],
        sourceUrl: `https://monsters-ink-107139.square.site`,
        status: "gated",
        gateStatus: decision.status,
        mask: decision.mask,
        failedIndices: decision.failedIndices,
        fixtureId: f.id,
      });
      await ctx.db.insert("interiors", {
        claimId,
        url: `https://monsters-ink-107139.square.site`,
        rawMarkdown: `INTERIOR: ${f.interior.join(", ")}`,
        interior: [...f.interior],
        scrapedAt: now,
      });
      await ctx.db.insert("gateDecisions", {
        claimId,
        status: decision.status,
        mask: decision.mask,
        failedIndices: decision.failedIndices,
        claimed: [...f.claimed],
        interior: [...f.interior],
        decidedAt: now,
        label: f.label,
      });
      results.push({ fixtureId: f.id, claimId, decision });
    }
    return results;
  },
});

export const leanSampleSelfCheck = query({
  args: {},
  handler: async () => {
    const g = gateB(sampleInterior, sampleValid);
    const r = gateB(sampleInterior, sampleInvalid);
    return {
      sample_valid_grant: granted(g) === true,
      sample_invalid_refuse: r.status === "refuse",
      sample_invalid_mask_ten: r.mask === 10,
      grant: g,
      refuse: r,
    };
  },
});
