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
