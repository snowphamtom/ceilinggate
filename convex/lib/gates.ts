/**
 * ResidualGates runtime port for Convex backend.
 * GRANT iff claimed ≤ interior componentwise; else REFUSE + bitmask.
 * Keep in sync with src/lib/residualGates.ts
 */
export type GateStatus = "grant" | "refuse";

export type GateDecision = {
  status: GateStatus;
  mask: number;
  failedIndices: number[];
};

/** granted = grant && mask === 0 */
export function granted(d: GateDecision): boolean {
  return d.status === "grant" && d.mask === 0;
}

/** Componentwise claimed ≤ interior on equal-length lists; else false. */
export function enclosedR(interior: number[], claimed: number[]): boolean {
  if (interior.length !== claimed.length) return false;
  for (let i = 0; i < interior.length; i++) {
    if (!(claimed[i]! <= interior[i]!)) return false;
  }
  return true;
}

/**
 * Indices (from `idx`) where interior < claimed.
 * Matches Lean: walks while both lists have heads; unequal tails yield no extra indices.
 */
export function breachesR(
  interior: number[],
  claimed: number[],
  idx = 0,
): number[] {
  if (interior.length === 0 || claimed.length === 0) return [];
  const rest = breachesR(interior.slice(1), claimed.slice(1), idx + 1);
  return interior[0]! < claimed[0]! ? [idx, ...rest] : rest;
}

/** Bitmask: bit idx set iff idx is in failed. */
export function maskOf(failed: number[]): number {
  return failed.reduce((acc, i) => acc | (1 << i), 0);
}

export const EXPENSE_LINES = ["fuel", "lodging", "meals", "misc"] as const;

/** Bit idx set iff that expense line is over the receipt. Not an 8-bit ATEC jacket. */
export function decodeMask(
  mask: number,
  lineItems: readonly string[] = EXPENSE_LINES,
): string[] {
  return lineItems.filter((_, i) => (mask & (1 << i)) !== 0);
}

/** gateB → { status: 'grant'|'refuse', mask, failedIndices } */
export function gateB(interior: number[], claimed: number[]): GateDecision {
  if (enclosedR(interior, claimed)) {
    return { status: "grant", mask: 0, failedIndices: [] };
  }
  const failed = breachesR(interior, claimed, 0);
  const m = maskOf(failed);
  return {
    status: "refuse",
    mask: m === 0 ? 1 : m,
    failedIndices: failed,
  };
}

/** Lean samples — must match ResidualGatesMathlib */
export const sampleInterior = [100, 50, 25, 10];
export const sampleValid = [98, 49, 25, 9];
export const sampleInvalid = [98, 51, 25, 11];
