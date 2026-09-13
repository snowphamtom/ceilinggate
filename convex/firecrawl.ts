import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  RECEIPT_EXTRACT_PROMPT,
  RECEIPT_EXTRACT_SCHEMA,
  interiorFromExtract,
} from "./parse";

/**
 * Scrape action with layered fallbacks (never invents API keys):
 * 1. FIRECRAWL_API_KEY → Firecrawl API (markdown + JSON extract)
 * 2. else fixture text / INTERIOR line
 * 3. else withhold judgment
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
  const tagged = text.match(
    /INTERIOR:\s*([0-9]+(?:\.[0-9]+)?(?:\s*,\s*[0-9]+(?:\.[0-9]+)?)*)/i,
  );
  if (tagged?.[1]) {
    return tagged[1].split(",").map((s) => Number(s.trim()));
  }
  const amounts = [...text.matchAll(/\$?\b(\d+(?:\.\d{1,2})?)\b/g)]
    .map((m) => Number(m[1]))
    .filter((n) => !Number.isNaN(n));
  return amounts.length ? amounts.slice(0, 8) : null;
}

function interiorFromPayload(
  json: unknown,
  markdown: string,
): number[] | null {
  const extracted = interiorFromExtract(json);
  if (extracted.length) return extracted;
  return parseInterior(markdown);
}

async function maybeGate(
  ctx: { runMutation: Function },
  claimId: unknown,
  text: string,
  url: string,
  json?: unknown,
) {
  const interior = interiorFromPayload(json, text);
  if (!claimId || !interior) return;
  await ctx.runMutation(internal.pipeline.gateWithInterior, {
    claimId,
    interior,
    url,
    rawMarkdown: text,
  });
}

export const scrapeUrl = action({
  args: {
    url: v.string(),
    claimId: v.optional(v.id("claims")),
    fixtureText: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    scrapeId: string;
    source: "firecrawl" | "fixture" | "fetch";
    text: string;
    note?: string;
    gated?: false;
  }> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (apiKey) {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: args.url,
          formats: ["markdown", "json"],
          onlyMainContent: true,
          jsonOptions: {
            schema: RECEIPT_EXTRACT_SCHEMA,
            prompt: RECEIPT_EXTRACT_PROMPT,
            checkPromptInjection: true,
          },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Firecrawl scrape failed: ${res.status} ${errText}`);
      }
      const data = (await res.json()) as {
        data?: { markdown?: string; json?: unknown };
        markdown?: string;
        json?: unknown;
      };
      const text = data.data?.markdown ?? data.markdown ?? JSON.stringify(data);
      const extracted = data.data?.json ?? data.json;
      const scrapeId = await ctx.runMutation(internal.firecrawl.storeScrape, {
        url: args.url,
        text: extracted
          ? `${text}\n\nEXTRACT:${JSON.stringify(extracted)}`
          : text,
        source: "firecrawl",
        claimId: args.claimId,
      });
      await maybeGate(ctx, args.claimId, text, args.url, extracted);
      return { scrapeId, source: "firecrawl" as const, text };
    }

    if (args.fixtureText || FIXTURE_BY_URL[args.url]) {
      const text = args.fixtureText ?? FIXTURE_BY_URL[args.url]!;
      const scrapeId = await ctx.runMutation(internal.firecrawl.storeScrape, {
        url: args.url,
        text,
        source: "fixture",
        claimId: args.claimId,
      });
      await maybeGate(ctx, args.claimId, text, args.url);
      return {
        scrapeId,
        source: "fixture" as const,
        text,
        note: "Demo fixture scrape stand-in — live path still requires FIRECRAWL_API_KEY",
      };
    }

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
