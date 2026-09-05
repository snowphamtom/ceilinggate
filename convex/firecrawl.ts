import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Scrape action with layered fallbacks (never invents API keys):
 * 1. FIRECRAWL_API_KEY → Firecrawl API
 * 2. else plain fetch of public URL (best-effort text)
 * 3. else fixture text / INTERIOR line
 */
export const storeScrape = internalMutation({
  args: {
    url: v.string(),
    text: v.string(),
    source: v.union(
      v.literal("firecrawl"),
      v.literal("fetch"),
      v.literal("fixture"),
    ),
    claimId: v.optional(v.id("claims")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scrapes", {
      url: args.url,
      text: args.text,
      source: args.source,
      claimId: args.claimId,
      createdAt: Date.now(),
    });
  },
});

const FIXTURE_BY_URL: Record<string, string> = {
  "https://monsters-ink-107139.square.site":
    "INTERIOR: 100, 50, 25, 10\nFixture scrape stand-in — Monsters Ink public shop (Drive-fuel demo).",
  "https://example.com/receipts/fuel-grant":
    "INTERIOR: 100, 50, 25, 10\nLegacy fixture alias.",
  "https://example.com/receipts/fuel-refuse":
    "INTERIOR: 100, 50, 25, 10\nLegacy fixture alias.",
};

function parseInterior(text: string): number[] | null {
  const tagged = text.match(/INTERIOR:\s*([0-9]+(?:\s*,\s*[0-9]+)*)/i);
  if (tagged?.[1]) {
    return tagged[1].split(",").map((s) => Number(s.trim()));
  }
  const amounts = [...text.matchAll(/\$?\b(\d+(?:\.\d{1,2})?)\b/g)]
    .map((m) => Number(m[1]))
    .filter((n) => !Number.isNaN(n));
  return amounts.length ? amounts.slice(0, 8) : null;
}

async function maybeGate(
  ctx: { runQuery: Function; runMutation: Function },
  claimId: unknown,
  text: string,
) {
  const interior = parseInterior(text);
  if (!claimId || !interior) return;
  const claim = await ctx.runQuery(api.claims.getClaim, { id: claimId });
  if (claim) {
    await ctx.runMutation(api.gates.runGate, {
      claimId,
      claimed: claim.claimed,
      interior,
      label: claim.label,
    });
  }
}

export const scrapeUrl = action({
  args: {
    url: v.string(),
    claimId: v.optional(v.id("claims")),
    fixtureText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (apiKey) {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: args.url, formats: ["markdown"] }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Firecrawl scrape failed: ${res.status} ${errText}`);
      }
      const data = (await res.json()) as {
        data?: { markdown?: string };
        markdown?: string;
      };
      const text = data.data?.markdown ?? data.markdown ?? JSON.stringify(data);
      const scrapeId = await ctx.runMutation(internal.firecrawl.storeScrape, {
        url: args.url,
        text,
        source: "firecrawl",
        claimId: args.claimId,
      });
      await maybeGate(ctx, args.claimId, text);
      return { scrapeId, source: "firecrawl" as const, text };
    }

    // ORIGINALITY RULE: Firecrawl is mandatory for live judgment when a URL exists.
    // Plain fetch does NOT unlock the gate. Fixture text only when explicitly passed
    // (offline Drive-fuel demo) — never invent a judgment from bare fetch.
    if (args.fixtureText || FIXTURE_BY_URL[args.url]) {
      const text =
        args.fixtureText ??
        FIXTURE_BY_URL[args.url]!;
      const scrapeId = await ctx.runMutation(internal.firecrawl.storeScrape, {
        url: args.url,
        text,
        source: "fixture",
        claimId: args.claimId,
      });
      await maybeGate(ctx, args.claimId, text);
      return {
        scrapeId,
        source: "fixture" as const,
        text,
        note: "Demo fixture scrape stand-in — live path still requires FIRECRAWL_API_KEY",
      };
    }

    // Store scrape attempt metadata but do NOT run gate without Firecrawl.
    const blocked = `NO_INTERIOR: FIRECRAWL_API_KEY required to scrape ${args.url}. Judgment withheld.`;
    const scrapeId = await ctx.runMutation(internal.firecrawl.storeScrape, {
      url: args.url,
      text: blocked,
      source: "fetch",
      claimId: args.claimId,
    });
    return {
      scrapeId,
      source: "fetch" as const,
      text: blocked,
      note: "Judgment blocked — no Firecrawl scrape",
      gated: false as const,
    };
  },
});
