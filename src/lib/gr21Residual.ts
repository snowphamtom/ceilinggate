/**
 * GR-21 residual commitment fuel — C≤S projector for Sorting Machine stamps.
 * Maps Magpie triad residual commitment → receipt-line overage residual.
 * MAGPIE 19/658750: verification fuel only — not a Magpie rebrand.
 */

export type ResidualCommit = {
  commit: string;
  short: string;
  variance: number;
  overLines: number;
  projector: "CLEAR" | "OVER";
};

/** Sync FNV-1a 32 → hex (stamp display; not cryptographic Pedersen). */
function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Residual = componentwise max(0, C−S). Projector CLEAR iff all residuals 0 (C≤S).
 * Commitment binds residual vector + cycle/anchor label for Evidence stamp.
 */
export function residualCommitment(
  claimed: number[],
  source: number[],
  anchor = "ceilinggate-gr21",
): ResidualCommit {
  const n = Math.max(claimed.length, source.length, 1);
  const parts: string[] = [];
  let sumSq = 0;
  let overLines = 0;
  for (let i = 0; i < n; i++) {
    const c = Number.isFinite(claimed[i]) ? (claimed[i] as number) : 0;
    const s = Number.isFinite(source[i]) ? (source[i] as number) : 0;
    const r = Math.max(0, c - s);
    if (r > 0) overLines += 1;
    sumSq += r * r;
    parts.push(`${i}:${r}`);
  }
  const variance = sumSq / n;
  const payload = `GR21|${anchor}|${parts.join(",")}|var=${variance.toFixed(8)}`;
  const commit = fnv1aHex(payload) + fnv1aHex(payload.split("").reverse().join(""));
  return {
    commit,
    short: commit.slice(0, 8),
    variance,
    overLines,
    projector: overLines === 0 ? "CLEAR" : "OVER",
  };
}
