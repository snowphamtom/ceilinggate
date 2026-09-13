/** Parse claimed ceilings and receipt URLs from AgentMail body text. */

const CLAIMED_LINE =
  /CLAIMED:\s*([0-9]+(?:\.[0-9]+)?(?:\s*,\s*[0-9]+(?:\.[0-9]+)?)*)/i;
const INTERIOR_LINE =
  /INTERIOR:\s*([0-9]+(?:\.[0-9]+)?(?:\s*,\s*[0-9]+(?:\.[0-9]+)?)*)/i;
const URL_RE = /https?:\/\/[^\s<>"')]+/gi;
const MONEY_RE = /\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/g;

function splitNums(s: string): number[] {
  return s
    .split(/\s*,\s*/)
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n));
}

/** v1 jsonOptions / v2 formats json schema — amounts only. Never GRANT/REFUSE. */
export const RECEIPT_EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    interior: {
      type: "array",
      items: { type: "number" },
      description: "Receipt line amounts in page order, major currency units",
    },
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          amount: { type: "number" },
        },
      },
    },
  },
} as const;

export const RECEIPT_EXTRACT_PROMPT =
  "Extract receipt line amounts only. Prefer an INTERIOR: tagged list. Do not decide GRANT or REFUSE. Do not invent lines that are not on the page.";

export function interiorFromExtract(json: unknown): number[] {
  if (!json || typeof json !== "object") return [];
  const o = json as { interior?: unknown; lines?: unknown };
  if (Array.isArray(o.interior)) {
    const nums = o.interior.map(Number).filter((n) => Number.isFinite(n));
    if (nums.length) return nums.slice(0, 8);
  }
  if (Array.isArray(o.lines)) {
    const nums = o.lines
      .map((row) =>
        row && typeof row === "object" && "amount" in row
          ? Number((row as { amount: unknown }).amount)
          : NaN,
      )
      .filter((n) => Number.isFinite(n));
    if (nums.length) return nums.slice(0, 8);
  }
  return [];
}

export function parseClaimed(body: string): number[] {
  const m = body.match(CLAIMED_LINE);
  if (m?.[1]) return splitNums(m[1]);
  const amounts: number[] = [];
  for (const hit of body.matchAll(MONEY_RE)) {
    const n = Number(hit[1]);
    if (Number.isFinite(n)) amounts.push(n);
  }
  return amounts.slice(0, 8);
}

export function parseInteriorFromMarkdown(md: string): number[] {
  const m = md.match(INTERIOR_LINE);
  if (m?.[1]) return splitNums(m[1]);
  const amounts: number[] = [];
  for (const hit of md.matchAll(MONEY_RE)) {
    const n = Number(hit[1]);
    if (Number.isFinite(n)) amounts.push(n);
  }
  return amounts.slice(0, 8);
}

export function parseSourceUrls(body: string): string[] {
  const receipt = body.match(/RECEIPT:\s*(https?:\/\/\S+)/i);
  const urls = new Set<string>();
  if (receipt?.[1]) urls.add(receipt[1].replace(/[.,;]+$/, ""));
  for (const u of body.matchAll(URL_RE)) {
    urls.add(u[0]!.replace(/[.,;)+]+$/, ""));
  }
  return [...urls];
}
