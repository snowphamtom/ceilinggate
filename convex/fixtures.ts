import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  gateB,
  granted,
  sampleInterior,
  sampleInvalid,
  sampleValid,
} from "./lib/gates";

const FIXTURES = [
  {
    id: "fuel-grant",
    label: "Undistorted fuel GRANT",
    subject: "T&E claim — under ceiling",
    from: "fixture@ceilinggate.local",
    body: "CLAIMED: 98, 49, 25, 9\nRECEIPT: https://example.com/receipts/fuel-grant",
    claimed: sampleValid,
    interior: sampleInterior,
  },
  {
    id: "fuel-refuse",
    label: "Undistorted fuel REFUSE (mask 10)",
    subject: "T&E claim — over ceiling",
    from: "fixture@ceilinggate.local",
    body: "CLAIMED: 98, 51, 25, 11\nRECEIPT: https://example.com/receipts/fuel-refuse",
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

async function insertGated(
  ctx: { db: any },
  f: (typeof FIXTURES)[number],
) {
  const decision = gateB([...f.interior], [...f.claimed]);
  const claimId = await ctx.db.insert("claims", {
    subject: f.subject,
    from: f.from,
    receivedAt: Date.now(),
    bodyText: f.body,
    claimed: [...f.claimed],
    sourceUrls: [`https://example.com/receipts/${f.id}`],
    status: "gated" as const,
    fixtureId: f.id,
  });
  await ctx.db.insert("interiors", {
    claimId,
    url: `https://example.com/receipts/${f.id}`,
    rawMarkdown: `INTERIOR: ${f.interior.join(", ")}`,
    interior: [...f.interior],
    scrapedAt: Date.now(),
  });
  await ctx.db.insert("gateDecisions", {
    claimId,
    status: decision.status,
    mask: decision.mask,
    failedIndices: decision.failedIndices,
    claimed: [...f.claimed],
    interior: [...f.interior],
    decidedAt: Date.now(),
  });
  await ctx.db.insert("vectors", {
    claimId,
    kind: "joint" as const,
    embedding: f.claimed.map((n, i) => n - (f.interior[i] ?? 0)),
    dims: f.claimed.length,
    createdAt: Date.now(),
  });
  return { claimId, decision, granted: granted(decision) };
}

export const runFixture = mutation({
  args: { fixtureId: v.string() },
  handler: async (ctx, { fixtureId }) => {
    const f = FIXTURES.find((x) => x.id === fixtureId);
    if (!f) throw new Error(`Unknown fixture: ${fixtureId}`);
    return insertGated(ctx, f);
  },
});

export const runAllFixtures = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];
    for (const f of FIXTURES) results.push(await insertGated(ctx, f));
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
